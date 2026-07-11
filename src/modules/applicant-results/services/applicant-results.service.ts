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
import { EvaluationResult } from "../entities/evaluation-results.entity";
import { Application } from "../../applicants/entities/application.entity";
import { Vacancy } from "../../vacancies/entities/vacancy.entity";
import { ApplicantEducation } from "../../applicants/entities/applicant-education.entity";
import { ApplicantJobHistory } from "../../applicants/entities/applicant-job-history.entity";
import { EducationLevel } from "../../../shared/enums/job-status.enum";
import { MinioService } from "../../../shared/services/minio.service";
import { FastApiScoringResponseDto } from "../dto/fastapi-scoring-response.dto";

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

  async updateDecision(
    applicationId: string,
    decision: string
  ): Promise<EvaluationResult> {
    const result = await this.evaluationResultRepository.findOne({
      where: { applicationId }
    });
    if (!result) {
      throw new NotFoundException(
        `Hasil evaluasi untuk lamaran ${applicationId} tidak ditemukan`
      );
    }
    result.decision = decision as any; // Sesuaikan dengan enum EvaluationDecision
    const updated = await this.evaluationResultRepository.save(result);
    this.logger.log(
      `Keputusan ditetapkan: applicationId=${applicationId}, decision=${decision}`
    );
    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Orkestrasi
  // ─────────────────────────────────────────────────────────────────────────────
  async runScoring(
    applicationId: string,
    cvFilePath: string,
    cvMimeType: string
  ): Promise<FastApiScoringResponseDto> {
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

    const { vacancy } = application;
    const cvBuffer = await this.minioService.getFileBuffer(cvFilePath);

    const scoringResult = await this.callFastApiScoring(
      applicationId,
      cvBuffer,
      cvFilePath,
      cvMimeType,
      vacancy.responsibilities ?? ""
    );

    const maxScore = scoringResult.experience?.length
      ? Math.max(...scoringResult.experience.map((e) => e.similarity ?? 0))
      : 0;

    this.logger.log(
      `Scoring selesai untuk applicationId=${applicationId}, maxExperienceScore=${maxScore}`
    );

    return scoringResult;
  }

  async runFormBasedScoring(
    applicationId: string,
    jobResponsibilities: string,
    experiences: {
      position: string;
      company: string;
      description: string;
      startDate?: string;
      endDate?: string;
    }[]
  ): Promise<void> {
    this.logger.log(
      `Memulai form-based scoring untuk applicationId=${applicationId}`
    );

    const url = `${this.fastApiBaseUrl}/scoring/score-experiences`;
    const payload = {
      application_id: applicationId,
      job_responsibilities: jobResponsibilities,
      experiences
    };

    let scores: {
      position: string;
      company: string;
      description: string;
      similarity: number;
    }[] = [];
    let maxScore = 0;

    try {
      const response = await firstValueFrom(
        this.httpService.post<{
          data: {
            application_id: string;
            scores: typeof scores;
            max_score: number;
          };
        }>(url, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 60_000
        })
      );
      scores = response.data?.data?.scores ?? [];
      maxScore = response.data?.data?.max_score ?? 0;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Form-based scoring FastAPI call failed: ${message}`);
      throw new InternalServerErrorException(
        `Gagal menghubungi FastAPI Scoring Service: ${message}`
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const evaluateDetail = {
        experience: scores.map((s) => {
          const orig = experiences.find((e) => e.position === s.position);
          return {
            role: s.position,
            description: s.description,
            start: orig?.startDate ?? null,
            end: orig?.endDate ?? null,
            duration_years: null,
            similarity: s.similarity
          };
        }),
        educations: []
      };

      const existing = await manager.findOne(EvaluationResult, {
        where: { applicationId }
      });
      if (existing) {
        existing.maxExperienceScore = maxScore;
        existing.evaluateDetail = evaluateDetail;
        existing.evaluatedAt = new Date();
        await manager.save(EvaluationResult, existing);
      } else {
        const evalResult = manager.create(EvaluationResult);
        evalResult.applicationId = applicationId;
        evalResult.maxExperienceScore = maxScore;
        evalResult.evaluateDetail = evaluateDetail;
        evalResult.evaluatedAt = new Date();
        await manager.save(EvaluationResult, evalResult);
      }
    });

    this.logger.log(
      `Form-based scoring selesai: applicationId=${applicationId}, maxScore=${maxScore}`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: FastAPI call
  // ─────────────────────────────────────────────────────────────────────────────
  private async callFastApiScoring(
    applicationId: string,
    cvBuffer: Buffer,
    cvFilePath: string,
    cvMimeType: string,
    jobResponsibilities: string
  ): Promise<FastApiScoringResponseDto> {
    const url = `${this.fastApiBaseUrl}/parse-and-evaluate`;
    const form = new FormData();
    const fileName = cvFilePath.split("/").pop() ?? "cv.pdf";

    form.append("cv_file", cvBuffer, {
      filename: fileName,
      contentType: cvMimeType
    });
    form.append("application_id", applicationId);
    form.append("job_responsibilities", jobResponsibilities);

    try {
      const response = await firstValueFrom(
        this.httpService.post<FastApiScoringResponseDto>(url, form, {
          headers: { ...form.getHeaders() },
          timeout: 120_000
        })
      );
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`FastAPI scoring gagal: ${message}`);
      throw new InternalServerErrorException(
        `Gagal menghubungi FastAPI Scoring Service: ${message}`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Simpan ke database
  // ─────────────────────────────────────────────────────────────────────────────
  async saveResults(
    result: FastApiScoringResponseDto,
    applicantId: string
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { application_id, educations, experience } = result;

      // evaluationresult sudah dibuat sebagai placeholder saat quickapply
      const existingEvalResult = await manager.findOne(EvaluationResult, {
        where: { applicationId: application_id }
      });

      if (existingEvalResult) {
          existingEvalResult.evaluateDetail = { educations, experience };
        existingEvalResult.evaluatedAt = new Date();
        // maxExperienceScore akan diupdate di bawah
      } else {
        // Fallback: jika somehow EvaluationResult tidak ada, delete yang lama
        await manager.delete(EvaluationResult, {
          applicationId: application_id
        });
      }

      // 1. Timpa ApplicantEducation
      await manager.softDelete(ApplicantEducation, { applicantId });
      if (educations && educations.length > 0) {
        const educationEntities = educations.map((edu, index) => {
          const e = new ApplicantEducation();
          e.applicantId = applicantId;
          e.level = this.mapEducationLevel(edu.level);
          e.major = edu.major ?? null;
          e.schoolName = edu.institution ?? null; // Mapping institution -> schoolName
          e.order = index + 1;
          return e;
        });
        await manager.save(ApplicantEducation, educationEntities);
      }

      // 2. Timpa ApplicantJobHistory
      await manager.softDelete(ApplicantJobHistory, { applicantId });
      if (experience && experience.length > 0) {
        const jobHistoryEntities = experience.map((exp, index) => {
          const j = new ApplicantJobHistory();
          j.applicantId = applicantId;
          j.position = exp.role ?? null; // Mapping role -> position
          j.company = null; // Tidak ada di response terbaru
          j.description = exp.description ?? null;
          j.startDate = this.parseMonthYear(exp.start) ?? new Date();
          j.endDate = this.parseMonthYear(exp.end) ?? new Date();
          j.durationYears = exp.duration_years ?? null;
          j.order = index + 1;
          return j;
        });
        await manager.save(ApplicantJobHistory, jobHistoryEntities);
      }

      // 3. Update/Save EvaluationResult dengan scoring data
      const maxScore =
        experience && experience.length > 0
          ? Math.max(...experience.map((e) => e.similarity ?? 0))
          : 0;

      if (existingEvalResult) {
        existingEvalResult.maxExperienceScore = maxScore;
        await manager.save(EvaluationResult, existingEvalResult);
      } else {
        const evalResult = new EvaluationResult();
        evalResult.applicationId = application_id;
        evalResult.maxExperienceScore = maxScore;
        evalResult.evaluateDetail = { educations, experience };
        evalResult.evaluatedAt = new Date();
        await manager.save(EvaluationResult, evalResult);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Helper
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mengubah format "MM-YYYY" (contoh: "01-2024") menjadi objek Date
   */
  private parseMonthYear(monthYear: string | null): Date | null {
    if (!monthYear) return null;
    const parts = monthYear.split("-");
    if (parts.length === 2) {
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10);
      if (!isNaN(month) && !isNaN(year)) {
        return new Date(year, month - 1, 1);
      }
    }
    return null;
  }

  private mapEducationLevel(level: number | null): EducationLevel | null {
    if (level === null || level === undefined) return null;
    const numericToEnum: Record<number, EducationLevel> = {
      0: EducationLevel.NO_REQUIREMENT,
      1: EducationLevel.HIGH_SCHOOL,
      2: EducationLevel.DIPLOMA,
      3: EducationLevel.BACHELOR,
      4: EducationLevel.MASTER,
      5: EducationLevel.DOCTORATE
    };
    return numericToEnum[level] ?? null;
  }

  async saveEvaluationError(
    applicationId: string,
    errorMessage: string
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(EvaluationResult, {
        where: { applicationId }
      });

      if (existing) {
        existing.evaluatedAt = new Date();
        existing.errorMessage = errorMessage;
        await manager.save(EvaluationResult, existing);
      } else {
        const evalResult = new EvaluationResult();
        evalResult.applicationId = applicationId;
        evalResult.evaluatedAt = new Date();
        evalResult.errorMessage = errorMessage;
        await manager.save(EvaluationResult, evalResult);
      }
    });
  }
}
