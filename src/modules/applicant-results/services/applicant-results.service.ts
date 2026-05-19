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
import { EvaluationResult } from "../entities/evaluation-results.entity";
import { Application } from "../../applicants/entities/application.entity";
import { Vacancy } from "../../vacancies/entities/vacancy.entity";
import { ApplicantEducation } from "../../applicants/entities/applicant-education.entity";
import { ApplicantJobHistory } from "../../applicants/entities/applicant-job-history.entity";

import {
  FastApiScoringRequestDto,
  FastApiScoringResponseDto,
  CvDocumentResponseDto,
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
    @InjectRepository(EvaluationResult)
    private readonly evaluationResultRepository: Repository<EvaluationResult>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Vacancy)
    private readonly vacancyRepository: Repository<Vacancy>,
    @InjectRepository(ApplicantEducation)
    private readonly applicantEducationRepository: Repository<ApplicantEducation>,
    @InjectRepository(ApplicantJobHistory)
    private readonly applicantJobHistoryRepository: Repository<ApplicantJobHistory>
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
   * Mengambil hasil parsing CV (nama, skills, waktu parsing).
   * Data pendidikan dan pengalaman diakses via profil pelamar (applicant_educations,
   * applicant_job_histories) yang sudah diisi saat scoring.
   *
   * @param applicationId - UUID lamaran
   * @throws NotFoundException jika hasil belum tersedia
   */
  async getCvResult(applicationId: string): Promise<CvDocumentResponseDto> {
    const cvDoc = await this.cvDocumentRepository.findOne({
      where: { applicationId }
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
   *
   * Alur:
   *   1. Ambil Application + relasi applicant & vacancy
   *   2. Validasi CV sudah diupload
   *   3. Susun payload JSON (cvUrl + persyaratan lowongan) → kirim ke FastAPI
   *   4. FastAPI parsing CV & scoring, kembalikan cvParsed + scores dalam 1 respons
   *   5. Simpan hasil ke database:
   *      - cv_documents          → nama, skills[], waktu parsing
   *      - applicant_educations  → riwayat pendidikan per entry (linked cv_document_id)
   *      - applicant_job_histories → riwayat pengalaman per entry (linked cv_document_id)
   *      - evaluation_results    → skor WSM + scoreDetail JSON (termasuk entry breakdown)
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

    // 3. Susun payload untuk FastAPI
    //    NestJS hanya mengirim URL CV + persyaratan lowongan sebagai JSON.
    //    FastAPI yang bertanggung jawab: download file CV, ekstrak teks, parsing, scoring.
    const scoringRequest = this.buildScoringRequest(
      applicationId,
      applicant.cvUrl,
      vacancy
    );

    // 4. Kirim ke FastAPI — 1 endpoint menangani parsing + scoring sekaligus
    const scoringResponse = await this.callFastApiScoring(scoringRequest);

    // 5. Simpan hasil ke database dalam satu transaksi atomik
    await this.saveResults(scoringResponse, applicant.id);

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

    request.applicationId       = applicationId;
    request.cvUrl               = cvUrl;
    request.requiredEducation       = vacancy.requiredEducation ?? null;
    request.requiredExperienceYears = vacancy.requiredExperienceYears ?? null;
    request.relevantMajor       = vacancy.relevantMajor ?? null;
    request.roleDescription     = vacancy.roleDescription ?? null;
    request.requiredSkills      = vacancy.requiredSkills ?? null;

    return request;
  }

  /**
   * Mengirim payload ke FastAPI Scoring Service dan mengembalikan hasilnya.
   * Endpoint tunggal /process-cv menangani parsing + scoring dalam satu request.
   *
   * @throws InternalServerErrorException jika FastAPI tidak dapat dihubungi
   */
  private async callFastApiScoring(
    request: FastApiScoringRequestDto
  ): Promise<FastApiScoringResponseDto> {
    const url = `${this.fastApiBaseUrl}/process-cv`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ success: boolean; data: FastApiScoringResponseDto }>(
          url,
          request,
          {
            headers: { "Content-Type": "application/json" },
            timeout: 120_000 // 2 menit — LLM & SBERT bisa lambat
          }
        )
      );

      if (!response.data.success) {
        throw new InternalServerErrorException(
          "FastAPI Scoring Service mengembalikan success=false"
        );
      }

      return response.data.data;
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
   * Bersifat idempotent — jika record sudah ada (re-scoring), data lama ditimpa.
   *
   * Tabel yang diisi:
   * ┌─ cv_documents             (1 row per application)
   * │   ├─ applicant_educations    (N rows, linked ke cv_document_id + applicant_id)
   * │   └─ applicant_job_histories (N rows, linked ke cv_document_id + applicant_id)
   * └─ evaluation_results       (1 row per application)
   *
   * Catatan:
   * - similarity_score & is_relevant per pengalaman TIDAK disimpan di
   *   applicant_job_histories (vacancy-specific) — hanya masuk scoreDetail JSON.
   * - Menghapus CvDocument akan CASCADE-delete education & jobHistory terkait.
   *
   * @param dto         - Respons FastAPI sudah di-unwrap dari envelope { success, data }
   * @param applicantId - UUID pelamar, dibutuhkan untuk FK applicant_id
   */
  private async saveResults(
    dto: FastApiScoringResponseDto,
    applicantId: string
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { applicationId, cvParsed, scores } = dto;

      // ── Hapus data lama jika ada (idempotent) ──────────────────────────────
      // DELETE CvDocument akan CASCADE ke ApplicantEducation & ApplicantJobHistory
      // yang terkait lewat FK cv_document_id ON DELETE CASCADE.
      const existingCv = await manager.findOne(CvDocument, {
        where: { applicationId }
      });
      if (existingCv) {
        await manager.delete(CvDocument, { id: existingCv.id });
      }
      await manager.delete(EvaluationResult, { applicationId });

      // ── Simpan CvDocument ─────────────────────────────────────────────────
      const cvDoc = new CvDocument();
      cvDoc.applicationId = applicationId as string;
      cvDoc.applicantName = cvParsed.applicantName;
      cvDoc.skills        = cvParsed.skills; // string[] — untuk Jaccard similarity
      cvDoc.parsedAt      = new Date();

      const savedCvDoc = await manager.save(CvDocument, cvDoc);

      // ── Simpan ApplicantEducation ─────────────────────────────────────────
      // Mapping FastAPI → ApplicantEducation:
      //   level          → level       (EducationLevel enum)
      //   major          → major
      //   institution    → schoolName
      //   graduationYear → endMonth    (string "YYYY", nullable)
      // Kolom lain (degree, gpa, startMonth, diplomaFileName) dibiarkan null
      // karena LLM tidak mengekstrak data tersebut untuk scope TA ini.
      if (cvParsed.educations.length > 0) {
        const educations: ApplicantEducation[] = cvParsed.educations.map(
          (edu, index) => {
            const e = new ApplicantEducation();
            e.applicantId   = applicantId;
            e.cvDocumentId  = savedCvDoc.id;
            e.level         = edu.level;
            e.major         = edu.major;
            e.schoolName    = edu.institution;
            e.endMonth      = edu.graduationYear
              ? String(edu.graduationYear)
              : null;
            e.order         = index + 1;
            return e;
          }
        );
        await manager.save(ApplicantEducation, educations);
      }

      // ── Simpan ApplicantJobHistory ────────────────────────────────────────
      // Mapping FastAPI → ApplicantJobHistory:
      //   role          → position
      //   company       → company
      //   description   → description
      //   startDate     → startDate   (Date | null — sudah dinormalisasi ISO oleh FastAPI)
      //   endDate       → endDate     (Date | null — null jika masih aktif / tidak diketahui)
      //   durationYears → durationYears
      //
      // TIDAK disimpan di sini (vacancy-specific, masuk scoreDetail JSON):
      //   similarityScore, isRelevant
      // Kolom lain (employeeStatus, location, achievements) dibiarkan null.
      if (cvParsed.workExperiences.length > 0) {
        const jobHistories: ApplicantJobHistory[] = cvParsed.workExperiences.map(
          (exp, index) => {
            const j = new ApplicantJobHistory();
            j.applicantId   = applicantId;
            j.cvDocumentId  = savedCvDoc.id;
            j.position      = exp.role;
            j.company       = exp.company;
            j.description   = exp.description;
            j.startDate     = exp.startDate!;
            j.endDate       = exp.endDate!;
            j.durationYears = exp.durationYears;
            j.order         = index + 1;
            return j;
          }
        );
        await manager.save(ApplicantJobHistory, jobHistories);
      }

      // ── Simpan EvaluationResult ───────────────────────────────────────────
      // Menyimpan skor WSM dan breakdown lengkap dalam satu JSON column.
      //
      // scoreDetail JSON structure (sesuai kontrak FastAPI yang disepakati):
      // {
      //   education: {
      //     selectedLevel, selectedMajor, levelScore, majorSimilarity,
      //     entries: [{ level, major, levelScore, majorSimilarity }]
      //   },
      //   experience: {
      //     durationScore, avgSimilarity, relevantDurationYears,
      //     entries: [{ role, durationYears, similarityScore, isRelevant }]
      //   },
      //   skill: {
      //     vacancySkills[], applicantSkills[], matchedSkills[], jaccardScore
      //   }
      // }
      const sd = scores.scoreDetail;

      const evalResult = new EvaluationResult();
      evalResult.applicationId   = applicationId as string;
      evalResult.educationScore  = scores.educationScore;
      evalResult.experienceScore = scores.experienceScore;
      evalResult.skillScore      = scores.skillScore;
      evalResult.totalScore      = scores.totalScore;
      evalResult.scoreDetail     = {
        education: {
          selectedLevel:   sd.education.selectedLevel,
          selectedMajor:   sd.education.selectedMajor,
          levelScore:      sd.education.levelScore,
          majorSimilarity: sd.education.majorSimilarity,
          entries: sd.education.entries.map((e) => ({
            level:           e.level,
            major:           e.major,
            levelScore:      e.levelScore,
            majorSimilarity: e.majorSimilarity
          }))
        },
        experience: {
          durationScore:         sd.experience.durationScore,
          avgSimilarity:         sd.experience.avgSimilarity,
          relevantDurationYears: sd.experience.relevantDurationYears,
          entries: sd.experience.entries.map((e) => ({
            role:            e.role,
            durationYears:   e.durationYears,
            similarityScore: e.similarityScore,
            isRelevant:      e.isRelevant
          }))
        },
        skill: {
          vacancySkills:   sd.skill.vacancySkills,
          applicantSkills: sd.skill.applicantSkills,
          matchedSkills:   sd.skill.matchedSkills,
          jaccardScore:    sd.skill.jaccardScore
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

    dto.id            = cvDoc.id;
    dto.applicationId = cvDoc.applicationId;
    dto.applicantName = cvDoc.applicantName ?? null;
    dto.skills        = cvDoc.skills ?? null;
    dto.parsedAt      = cvDoc.parsedAt ?? null;
    dto.createdAt     = cvDoc.createdAt;
    dto.updatedAt     = cvDoc.updatedAt;

    return dto;
  }

  private mapEvaluationResultToDto(
    result: EvaluationResult
  ): EvaluationResultResponseDto {
    const dto = new EvaluationResultResponseDto();

    dto.id              = result.id;
    dto.applicationId   = result.applicationId;
    dto.educationScore  = result.educationScore ?? null;
    dto.experienceScore = result.experienceScore ?? null;
    dto.skillScore      = result.skillScore ?? null;
    dto.totalScore      = result.totalScore ?? null;
    dto.decision        = result.decision ?? null;
    dto.scoreDetail     = result.scoreDetail
      ? (result.scoreDetail as unknown as ScoreDetailDto)
      : null;
    dto.evaluatedAt     = result.evaluatedAt ?? null;
    dto.createdAt       = result.createdAt;
    dto.updatedAt       = result.updatedAt;

    return dto;
  }
}