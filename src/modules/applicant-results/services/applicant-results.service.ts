import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import FormData from "form-data";

import { EvaluationResult, EvaluationDecision } from "../entities/evaluation-results.entity";
import { Application } from "../../applicants/entities/application.entity";
import { Vacancy } from "../../vacancies/entities/vacancy.entity";
import { ApplicantEducation } from "../../applicants/entities/applicant-education.entity";
import { ApplicantJobHistory } from "../../applicants/entities/applicant-job-history.entity";
import { EducationLevel } from "../../../shared/enums/job-status.enum";
import { MinioService } from "../../../shared/services/minio.service";

import {
  FastApiScoringResponseDto,
  FastApiScoringDataDto
} from "../dto/fastapi-scoring-response.dto";

// ─── Tipe internal untuk hasil normalisasi respons FastAPI ────────────────────

interface NormalizedEducation {
  level: EducationLevel | null;
  major: string | null;
  graduationYear: number | null;
}

interface NormalizedWorkExperience {
  role: string | null;
  company: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  durationYears: number | null;
}

interface NormalizedExperienceEntry {
  role: string | null;
  similarityScore: number | null;
}

interface NormalizedScoringResult {
  applicationId: string;
  cvParsed: {
    applicantName: string | null;
    skills: string[];
    educations: NormalizedEducation[];
    workExperiences: NormalizedWorkExperience[];
  };
  evaluation: {
    shortlistScore: number;
    experience: {
      method: string;
      entries: NormalizedExperienceEntry[];
    };
  };
}

@Injectable()
export class ApplicantResultsService {
  private readonly logger = new Logger(ApplicantResultsService.name);
  private readonly fastApiBaseUrl: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly minioService: MinioService,
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
   * Dipanggil setelah pelamar berhasil submit lamaran.
   *
   * cvFilePath diteruskan langsung dari applyForPosition agar tidak perlu
   * query ulang File entity di dalam scoring service.
   *
   * @param applicationId - UUID lamaran
   * @param cvFilePath    - Path file CV di MinIO (contoh: "applicants/cv/1234-abc.pdf")
   */
  async triggerScoringAsync(
    applicationId: string,
    cvFilePath: string
  ): Promise<void> {
    this.runScoring(applicationId, cvFilePath).catch((err: unknown) => {
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
   * Mengambil hasil evaluasi untuk suatu lamaran.
   *
   * @param applicationId - UUID lamaran
   * @throws NotFoundException jika hasil belum tersedia
   */
  async getEvaluationResult(applicationId: string): Promise<EvaluationResult> {
    const result = await this.evaluationResultRepository.findOne({
      where: { applicationId }
    });

    if (!result) {
      throw new NotFoundException(
        `Hasil evaluasi untuk lamaran ${applicationId} belum tersedia`
      );
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC: Aksi rekruter
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Menetapkan keputusan rekruter (lolos / tidak_lolos) secara manual.
   *
   * @param applicationId - UUID lamaran
   * @param decision      - Keputusan rekruter
   * @throws NotFoundException jika hasil evaluasi belum ada
   */
  async updateDecision(
    applicationId: string,
    decision: EvaluationDecision
  ): Promise<EvaluationResult> {
    const result = await this.evaluationResultRepository.findOne({
      where: { applicationId }
    });

    if (!result) {
      throw new NotFoundException(
        `Hasil evaluasi untuk lamaran ${applicationId} tidak ditemukan`
      );
    }

    result.decision = decision;
    const updated = await this.evaluationResultRepository.save(result);

    this.logger.log(
      `Keputusan ditetapkan: applicationId=${applicationId}, decision=${decision}`
    );

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Orkestrasi scoring end-to-end
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Orkestrasi lengkap: ambil data → download CV dari MinIO →
   * kirim ke FastAPI sebagai multipart → simpan hasil.
   */
  private async runScoring(
    applicationId: string,
    cvFilePath: string
  ): Promise<void> {
    this.logger.log(`Memulai scoring untuk applicationId=${applicationId}`);

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

    const cvBuffer = await this.minioService.getFileBuffer(cvFilePath);

    const scoringResult = await this.callFastApiScoring(
      applicationId,
      cvBuffer,
      cvFilePath,
      vacancy.responsibilities ?? ""
    );

    await this.saveResults(scoringResult, applicant.id);

    this.logger.log(
      `Scoring selesai untuk applicationId=${applicationId}, ` +
        `maxExperienceScore=${scoringResult.evaluation.shortlistScore}`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Kirim ke FastAPI
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mengirim CV sebagai multipart/form-data ke FastAPI Scoring Service.
   *
   * FastAPI endpoint: POST /parse
   * Format multipart/form-data:
   *   - file            : Buffer PDF dokumen CV
   *   - application_id  : UUID lamaran
   *   - responsibilities: teks tanggung jawab posisi dari vacancy
   */
  private async callFastApiScoring(
    applicationId: string,
    cvBuffer: Buffer,
    cvFilePath: string,
    responsibilities: string
  ): Promise<NormalizedScoringResult> {
    const url = `${this.fastApiBaseUrl}/parse`;

    const form = new FormData();
    const fileName = cvFilePath.split("/").pop() ?? "cv.pdf";
    form.append("file", cvBuffer, {
      filename:    fileName,
      contentType: "application/pdf"
    });
    form.append("application_id",  applicationId);
    form.append("responsibilities", responsibilities);

    try {
      const response = await firstValueFrom(
        this.httpService.post<FastApiScoringResponseDto>(url, form, {
          headers: { ...form.getHeaders() },
          timeout: 120_000
        })
      );

      if (!response.data.success) {
        throw new InternalServerErrorException(
          "FastAPI Scoring Service mengembalikan success=false"
        );
      }

      return this.mapFastApiResponse(response.data.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`FastAPI scoring gagal: ${message}`);
      throw new InternalServerErrorException(
        `Gagal menghubungi FastAPI Scoring Service: ${message}`
      );
    }
  }

  /**
   * Menormalisasi respons FastAPI (snake_case) ke struktur internal (camelCase).
   */
  private mapFastApiResponse(data: FastApiScoringDataDto): NormalizedScoringResult {
    const cvParsed   = data.cv_parsed;
    const evaluation = data.evaluation;

    const educations: NormalizedEducation[] = (cvParsed.educations ?? []).map((e) => ({
      level:          this.mapEducationLevel(e.level),
      major:          e.major           ?? null,
      graduationYear: e.graduation_year ?? null
    }));

    const workExperiences: NormalizedWorkExperience[] = (cvParsed.work_experiences ?? []).map((w) => ({
      role:          w.role           ?? null,
      company:       w.company        ?? null,
      description:   w.description    ?? null,
      startDate:     w.start_date     ?? null,
      endDate:       w.end_date       ?? null,
      durationYears: w.duration_years ?? null
    }));

    const expEntries: NormalizedExperienceEntry[] = (
      evaluation.details.experience.entries ?? []
    ).map((e) => ({
      role:            e.role             ?? null,
      similarityScore: e.similarity_score ?? null
    }));

    return {
      applicationId: data.application_id,
      cvParsed: {
        applicantName:  cvParsed.applicant_name ?? null,
        skills:         cvParsed.skills         ?? [],
        educations,
        workExperiences
      },
      evaluation: {
        shortlistScore: evaluation.shortlist_score ?? 0,
        experience: {
          method:  evaluation.details.experience.method ?? "SBERT Semantic Similarity (MAX)",
          entries: expEntries
        }
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Simpan hasil ke database
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Menyimpan seluruh hasil scoring dalam satu transaksi atomik.
   * Bersifat idempotent — jika record sudah ada (re-scoring), data lama ditimpa.
   *
   * Tabel yang diisi:
   *   applicant_educations    → ditimpa dengan hasil parsing CV terbaru
   *   applicant_job_histories → ditimpa dengan hasil parsing CV terbaru
   *   evaluation_results      → 1 row per application
   *
   * Struktur evaluateDetail (snapshot permanen sejak saat evaluasi):
   * {
   *   "cv_parsed": {
   *     "applicant_name": "...",
   *     "skills": [...],
   *     "educations": [{ "level", "major", "graduationYear" }],
   *     "work_experiences": [{ "role", "company", "description", "durationYears", ... }]
   *   },
   *   "experience": {
   *     "method": "SBERT Semantic Similarity (MAX)",
   *     "entries": [
   *       {
   *         "role": "Backend Engineer",
   *         "company": "Tokopedia",
   *         "description": "Mengembangkan REST API...",
   *         "duration_years": 2.5,
   *         "similarity_score": 0.89
   *       }
   *     ]
   *   }
   * }
   *
   * Catatan tentang enriched entries:
   *   FastAPI hanya mengembalikan role + similarity_score di evaluation.entries.
   *   Agar HR dapat melihat deskripsi + perusahaan per entri di halaman detail,
   *   kita cross-reference dengan cv_parsed.work_experiences berdasarkan role name.
   *   Hasilnya disimpan langsung di entries agar snapshot lengkap dan self-contained.
   */
  private async saveResults(
    result: NormalizedScoringResult,
    applicantId: string
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { applicationId, cvParsed, evaluation } = result;

      // ── Idempotent: hapus EvaluationResult lama jika ada ─────────────────
      await manager.delete(EvaluationResult, { applicationId });

      // ── Timpa ApplicantEducation dengan hasil parsing CV terbaru ──────────
      await manager.softDelete(ApplicantEducation, { applicantId });

      if (cvParsed.educations.length > 0) {
        const educations: ApplicantEducation[] = cvParsed.educations.map(
          (edu, index) => {
            const e       = new ApplicantEducation();
            e.applicantId = applicantId;
            e.level       = edu.level;
            e.major       = edu.major;
            e.endMonth    = edu.graduationYear ? String(edu.graduationYear) : null;
            e.order       = index + 1;
            return e;
          }
        );
        await manager.save(ApplicantEducation, educations);
      }

      // ── Timpa ApplicantJobHistory dengan hasil parsing CV terbaru ─────────
      await manager.softDelete(ApplicantJobHistory, { applicantId });

      if (cvParsed.workExperiences.length > 0) {
        const jobHistories: ApplicantJobHistory[] = cvParsed.workExperiences.map(
          (exp, index) => {
            const j         = new ApplicantJobHistory();
            j.applicantId   = applicantId;
            j.position      = exp.role;
            j.company       = exp.company;
            j.description   = exp.description;
            j.startDate     = exp.startDate ? new Date(exp.startDate) : new Date();
            j.endDate       = exp.endDate   ? new Date(exp.endDate)   : new Date();
            j.durationYears = exp.durationYears;
            j.order         = index + 1;
            return j;
          }
        );
        await manager.save(ApplicantJobHistory, jobHistories);
      }

      // ── Enriched entries: cross-reference dengan work_experiences ─────────
      //
      // FastAPI hanya mengembalikan { role, similarity_score } di evaluation.entries.
      // Kita perkaya dengan description, company, dan duration_years dari
      // cv_parsed.work_experiences menggunakan role name sebagai kunci lookup.
      //
      // Ini penting agar halaman detail HR bisa menampilkan:
      //   "Backend Engineer @ Tokopedia (2.5 thn) — <deskripsi> — Score: 0.89"
      // tanpa frontend perlu query data tambahan.
      const workExpByRole = new Map<string, NormalizedWorkExperience>(
        cvParsed.workExperiences
          .filter(w => w.role !== null)
          .map(w => [w.role!.toLowerCase().trim(), w])
      );

      const enrichedEntries = evaluation.experience.entries.map((e) => {
        const matched = workExpByRole.get(e.role?.toLowerCase().trim() ?? "");
        return {
          role:             e.role,
          company:          matched?.company       ?? null,
          description:      matched?.description   ?? null,
          duration_years:   matched?.durationYears ?? null,
          similarity_score: e.similarityScore
        };
      });

      // ── Simpan EvaluationResult ───────────────────────────────────────────
      const evalResult              = new EvaluationResult();
      evalResult.applicationId      = applicationId;
      evalResult.maxExperienceScore = evaluation.shortlistScore;
      evalResult.evaluateDetail     = {
        cv_parsed: {
          applicant_name:   cvParsed.applicantName,
          skills:           cvParsed.skills,
          educations:       cvParsed.educations,      // level, major, graduationYear
          work_experiences: cvParsed.workExperiences  // full data termasuk description
        },
        experience: {
          method:  evaluation.experience.method,
          entries: enrichedEntries                    // role + company + desc + score
        }
      };
      evalResult.evaluatedAt = new Date();
      // decision sengaja tidak diisi — ditetapkan manual oleh rekruter

      await manager.save(EvaluationResult, evalResult);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Helper
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Memetakan nilai numerik CvEducationLevel dari FastAPI ke EducationLevel enum.
   *
   *   1 = SMA  →  EducationLevel.HIGH_SCHOOL
   *   2 = D3   →  EducationLevel.DIPLOMA
   *   3 = S1   →  EducationLevel.BACHELOR
   *   4 = S2   →  EducationLevel.MASTER
   *   5 = S3   →  EducationLevel.DOCTORATE
   */
  private mapEducationLevel(level: number | null): EducationLevel | null {
    if (level === null || level === undefined) return null;

    const validLevels = new Set<number>([
      EducationLevel.HIGH_SCHOOL,
      EducationLevel.DIPLOMA,
      EducationLevel.BACHELOR,
      EducationLevel.MASTER,
      EducationLevel.DOCTORATE
    ]);

    return validLevels.has(level) ? (level as EducationLevel) : null;
  }
}