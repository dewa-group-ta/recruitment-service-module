import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

import { CvDocument } from "../entities/cv-documents.entity";
import { CvEducationHistory } from "../entities/cv-education-histories.entity";
import { CvWorkExperience } from "../entities/cv-work-experiences.entity";
import { EvaluationResult } from "../entities/evaluation-results.entity";
import { Application } from "../../applicants/entities/application.entity";
import { Vacancy } from "../../vacancies/entities/vacancy.entity";

import {
  FastApiScoringRequestDto,
  FastApiScoringResponseDto,
  CvDocumentResponseDto,
  CvEducationHistoryResponseDto,
  CvWorkExperienceResponseDto,
  EvaluationResultResponseDto,
  ScoreDetailDto,
  UpdateDecisionDto
} from "../dto";

@Injectable()
export class ApplicantResultsService {
  private readonly logger = new Logger(ApplicantResultsService.name);
  private readonly fastApiBaseUrl: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(CvDocument)
    private readonly cvDocumentRepository: Repository<CvDocument>,
    @InjectRepository(CvEducationHistory)
    private readonly cvEducationRepository: Repository<CvEducationHistory>,
    @InjectRepository(CvWorkExperience)
    private readonly cvWorkExperienceRepository: Repository<CvWorkExperience>,
    @InjectRepository(EvaluationResult)
    private readonly evaluationResultRepository: Repository<EvaluationResult>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Vacancy)
    private readonly vacancyRepository: Repository<Vacancy>
  ) {
    this.fastApiBaseUrl = this.configService.get<string>(
      "FASTAPI_BASE_URL",
      "http://localhost:8000"
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC: Trigger scoring (dipanggil dari ApplicantService setelah apply)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Memulai proses scoring secara asinkron (fire-and-forget).
   * Dipanggil setelah pelamar berhasil submit lamaran (status → APPLIED).
   * Tidak melempar error ke caller — kegagalan hanya dicatat di log.
   *
   * @param applicationId - UUID lamaran yang baru di-submit
   */
  async triggerScoringAsync(applicationId: string): Promise<void> {
    // Jalankan tanpa await agar response ke pelamar tidak tertunda
    this.runScoring(applicationId).catch((err: unknown) => {
      this.logger.error(
        `Scoring gagal untuk applicationId=${applicationId}`,
        err instanceof Error ? err.stack : String(err)
      );
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC: Query untuk HR
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mengambil hasil parsing CV beserta riwayat pendidikan dan pengalaman.
   * Digunakan HR saat membuka detail lamaran.
   *
   * @param applicationId - UUID lamaran
   * @throws NotFoundException jika hasil belum tersedia
   */
  async getCvResult(applicationId: string): Promise<CvDocumentResponseDto> {
    const cvDoc = await this.cvDocumentRepository.findOne({
      where: { applicationId },
      relations: ["educations", "workExperiences"]
    });

    if (!cvDoc) {
      throw new NotFoundException(
        `Hasil CV untuk lamaran ${applicationId} belum tersedia`
      );
    }

    return this.mapCvDocumentToDto(cvDoc);
  }

  /**
   * Mengambil hasil scoring WSM beserta breakdown dan keputusan rekruter.
   * Digunakan HR saat membuka detail lamaran.
   *
   * @param applicationId - UUID lamaran
   * @throws NotFoundException jika hasil belum tersedia
   */
  async getEvaluationResult(
    applicationId: string
  ): Promise<EvaluationResultResponseDto> {
    const result = await this.evaluationResultRepository.findOne({
      where: { applicationId }
    });

    if (!result) {
      throw new NotFoundException(
        `Hasil evaluasi untuk lamaran ${applicationId} belum tersedia`
      );
    }

    return this.mapEvaluationResultToDto(result);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC: Aksi rekruter
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Menetapkan keputusan rekruter (lolos / tidak_lolos) secara manual.
   * Sesuai BR-09: keputusan tidak ditetapkan otomatis oleh sistem.
   *
   * @param applicationId - UUID lamaran
   * @param dto - Keputusan yang dipilih rekruter
   * @throws NotFoundException jika hasil evaluasi belum ada
   */
  async updateDecision(
    applicationId: string,
    dto: UpdateDecisionDto
  ): Promise<EvaluationResultResponseDto> {
    const result = await this.evaluationResultRepository.findOne({
      where: { applicationId }
    });

    if (!result) {
      throw new NotFoundException(
        `Hasil evaluasi untuk lamaran ${applicationId} tidak ditemukan`
      );
    }

    result.decision = dto.decision;
    const updated = await this.evaluationResultRepository.save(result);

    this.logger.log(
      `Keputusan ditetapkan: applicationId=${applicationId}, decision=${dto.decision}`
    );

    return this.mapEvaluationResultToDto(updated);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Orkestrasi scoring end-to-end
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Orkestrasi lengkap: ambil data → kirim cvUrl ke FastAPI → simpan hasil.
   * Ekstraksi teks CV sepenuhnya dilakukan oleh FastAPI, bukan NestJS.
   */
  private async runScoring(applicationId: string): Promise<void> {
    this.logger.log(`Memulai scoring untuk applicationId=${applicationId}`);

    // 1. Ambil application beserta relasi yang dibutuhkan
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ["applicant", "vacancy"]
    });

    if (!application) {
      throw new NotFoundException(
        `Application ${applicationId} tidak ditemukan`
      );
    }

    const { applicant, vacancy } = application;

    // 2. Validasi CV sudah diupload
    if (!applicant.cvUrl) {
      throw new BadRequestException(
        `Pelamar ${applicant.id} belum mengupload CV`
      );
    }

    // 3. Susun payload untuk FastAPI — kirim URL, bukan teks mentah
    //    FastAPI yang bertanggung jawab download file & ekstrak teks
    const scoringRequest = this.buildScoringRequest(
      applicationId,
      applicant.cvUrl,
      vacancy
    );

    // 4. Kirim ke FastAPI dan terima hasilnya
    const scoringResponse = await this.callFastApiScoring(scoringRequest);

    // 5. Simpan hasil ke database dalam satu transaksi
    await this.saveResults(scoringResponse);

    this.logger.log(
      `Scoring selesai untuk applicationId=${applicationId}, ` +
        `totalScore=${scoringResponse.scores.totalScore}`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Build payload & panggil FastAPI
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Menyusun payload scoring dari data vacancy.
   * NestJS hanya mengirim cvUrl — FastAPI yang download & ekstrak teks CV.
   */
  private buildScoringRequest(
    applicationId: string,
    cvUrl: string,
    vacancy: Vacancy
  ): FastApiScoringRequestDto {
    const request = new FastApiScoringRequestDto();

    request.applicationId = applicationId;
    request.cvUrl = cvUrl;
    request.requiredEducation = vacancy.requiredEducation ?? null;
    request.requiredExperienceYears = vacancy.requiredExperienceYears ?? null;
    request.relevantMajor = (vacancy as any).relevantMajor ?? null;
    request.roleDescription = (vacancy as any).roleDescription ?? null;
    request.requiredSkills = (vacancy as any).requiredSkills ?? null;

    return request;
  }

  /**
   * Mengirim payload ke FastAPI Scoring Service dan mengembalikan hasilnya.
   *
   * @throws InternalServerErrorException jika FastAPI tidak dapat dihubungi
   */
  private async callFastApiScoring(
    request: FastApiScoringRequestDto
  ): Promise<FastApiScoringResponseDto> {
    const url = `${this.fastApiBaseUrl}/scoring`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<FastApiScoringResponseDto>(url, request, {
          headers: { "Content-Type": "application/json" },
          timeout: 120_000 // 2 menit — LLM bisa lambat
        })
      );

      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`FastAPI scoring gagal: ${message}`);
      throw new InternalServerErrorException(
        `Gagal menghubungi FastAPI Scoring Service: ${message}`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Simpan hasil ke database
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Menyimpan seluruh hasil scoring dalam satu transaksi atomik.
   * Jika record sudah ada (re-scoring), data lama ditimpa.
   */
  private async saveResults(dto: FastApiScoringResponseDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { applicationId, cvParsed, scores } = dto;

      // ── Hapus data lama jika ada (idempotent) ──────────────────────────────
      const existingCv = await manager.findOne(CvDocument, {
        where: { applicationId }
      });

      if (existingCv) {
        await manager.delete(CvEducationHistory, {
          cvDocumentId: existingCv.id
        });
        await manager.delete(CvWorkExperience, { cvDocumentId: existingCv.id });
        await manager.delete(CvDocument, { id: existingCv.id });
      }

      await manager.delete(EvaluationResult, { applicationId });

      // ── Simpan CvDocument ─────────────────────────────────────────────────
      const cvDoc = new CvDocument();
      cvDoc.applicationId = applicationId as string;
      cvDoc.applicantName = cvParsed.applicantName;
      cvDoc.skills = cvParsed.skills;
      cvDoc.parsedAt = new Date();

      const savedCvDoc = await manager.save(CvDocument, cvDoc);

      // ── Simpan CvEducationHistory ─────────────────────────────────────────
      if (cvParsed.educations.length > 0) {
        const educations = cvParsed.educations.map((edu) => {
          const e = new CvEducationHistory();
          e.cvDocumentId = savedCvDoc.id;
          e.level = edu.level;
          e.major = edu.major;
          e.institution = edu.institution;
          e.graduationYear = edu.graduationYear;
          return e;
        });
        await manager.save(CvEducationHistory, educations);
      }

      // ── Simpan CvWorkExperience ───────────────────────────────────────────
      if (cvParsed.workExperiences.length > 0) {
        const workExperiences = cvParsed.workExperiences.map((exp) => {
          const w = new CvWorkExperience();
          w.cvDocumentId = savedCvDoc.id;
          w.role = exp.role;
          w.company = exp.company;
          w.description = exp.description;
          w.startDate = exp.startDate;
          w.endDate = exp.endDate;
          w.durationYears = exp.durationYears;
          w.similarityScore = exp.similarityScore;
          w.isRelevant = exp.isRelevant;
          return w;
        });
        await manager.save(CvWorkExperience, workExperiences);
      }

      // ── Simpan EvaluationResult ───────────────────────────────────────────
      const evalResult = new EvaluationResult();
      evalResult.applicationId = applicationId as string;
      evalResult.educationScore = scores.educationScore;
      evalResult.experienceScore = scores.experienceScore;
      evalResult.skillScore = scores.skillScore;
      evalResult.totalScore = scores.totalScore;
      evalResult.scoreDetail = {
        education: {
          levelScore: scores.scoreDetail.education.levelScore,
          majorSimilarity: scores.scoreDetail.education.majorSimilarity
        },
        experience: {
          durationScore: scores.scoreDetail.experience.durationScore,
          avgSimilarity: scores.scoreDetail.experience.avgSimilarity,
          relevantDurationYears:
            scores.scoreDetail.experience.relevantDurationYears
        },
        skill: {
          vacancySkills: scores.scoreDetail.skill.vacancySkills,
          applicantSkills: scores.scoreDetail.skill.applicantSkills,
          similarityScore: scores.scoreDetail.skill.similarityScore
        }
      };
      evalResult.evaluatedAt = new Date();
      // decision sengaja tidak diisi — ditetapkan manual oleh rekruter (BR-09)

      await manager.save(EvaluationResult, evalResult);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Mapper entitas → DTO
  // ─────────────────────────────────────────────────────────────────────────────

  private mapCvDocumentToDto(cvDoc: CvDocument): CvDocumentResponseDto {
    const dto = new CvDocumentResponseDto();

    dto.id = cvDoc.id;
    dto.applicationId = cvDoc.applicationId;
    dto.applicantName = cvDoc.applicantName ?? null;
    dto.skills = cvDoc.skills ?? null;
    dto.parsedAt = cvDoc.parsedAt ?? null;
    dto.createdAt = cvDoc.createdAt;
    dto.updatedAt = cvDoc.updatedAt;

    dto.educations = (cvDoc.educations ?? []).map((edu) => {
      const eduDto = new CvEducationHistoryResponseDto();
      eduDto.id = edu.id;
      eduDto.level = edu.level ?? null;
      eduDto.major = edu.major ?? null;
      eduDto.institution = edu.institution ?? null;
      eduDto.graduationYear = edu.graduationYear ?? null;
      return eduDto;
    });

    dto.workExperiences = (cvDoc.workExperiences ?? []).map((exp) => {
      const expDto = new CvWorkExperienceResponseDto();
      expDto.id = exp.id;
      expDto.role = exp.role ?? null;
      expDto.company = exp.company ?? null;
      expDto.description = exp.description ?? null;
      expDto.startDate = exp.startDate ?? null;
      expDto.endDate = exp.endDate ?? null;
      expDto.durationYears = exp.durationYears ?? null;
      expDto.similarityScore = exp.similarityScore ?? null;
      expDto.isRelevant = exp.isRelevant ?? null;
      return expDto;
    });

    return dto;
  }

  private mapEvaluationResultToDto(
    result: EvaluationResult
  ): EvaluationResultResponseDto {
    const dto = new EvaluationResultResponseDto();

    dto.id = result.id;
    dto.applicationId = result.applicationId;
    dto.educationScore = result.educationScore ?? null;
    dto.experienceScore = result.experienceScore ?? null;
    dto.skillScore = result.skillScore ?? null;
    dto.totalScore = result.totalScore ?? null;
    dto.decision = result.decision ?? null;
    dto.scoreDetail = result.scoreDetail
      ? (result.scoreDetail as unknown as ScoreDetailDto)
      : null;
    dto.evaluatedAt = result.evaluatedAt ?? null;
    dto.createdAt = result.createdAt;
    dto.updatedAt = result.updatedAt;

    return dto;
  }
}