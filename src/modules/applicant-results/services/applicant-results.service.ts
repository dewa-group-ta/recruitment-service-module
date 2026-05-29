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

// ─── Tipe internal ────────────────────────────────────────────────────────────

interface NormalizedEducation {
  level: EducationLevel | null;
  major: string | null;
  graduationYear: number | null;
}

interface NormalizedWorkExperience {
  position: string | null;
  company: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  durationYears: number | null;
}

interface NormalizedExperienceEntry {
  position: string | null;
  company: string | null;
  description: string | null;
  similarityScore: number | null;
}

interface NormalizedEducationEvaluation {
  method: string | null;
  vacancyRequiredLevel: number | null;
  applicantHighestLevel: number | null;
  isLevelFulfilled: boolean | null;
}

interface NormalizedScoringResult {
  applicationId: string;
  cvParsed: {
    applicantName: string | null;
    educations: NormalizedEducation[];
    workExperiences: NormalizedWorkExperience[];
  };
  evaluation: {
    shortlistScore: number;
    experience: {
      method: string;
      entries: NormalizedExperienceEntry[];
    };
    educationEvaluation: NormalizedEducationEvaluation | null;
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

  async triggerScoringAsync(applicationId: string, cvFilePath: string): Promise<void> {
    this.runScoring(applicationId, cvFilePath).catch((err: unknown) => {
      this.logger.error(
        `Scoring gagal untuk applicationId=${applicationId}`,
        err instanceof Error ? err.stack : String(err)
      );
    });
  }

  async getEvaluationResult(applicationId: string): Promise<EvaluationResult> {
    const result = await this.evaluationResultRepository.findOne({ where: { applicationId } });
    if (!result) {
      throw new NotFoundException(`Hasil evaluasi untuk lamaran ${applicationId} belum tersedia`);
    }
    return result;
  }

  async updateDecision(applicationId: string, decision: EvaluationDecision): Promise<EvaluationResult> {
    const result = await this.evaluationResultRepository.findOne({ where: { applicationId } });
    if (!result) {
      throw new NotFoundException(`Hasil evaluasi untuk lamaran ${applicationId} tidak ditemukan`);
    }
    result.decision = decision;
    const updated = await this.evaluationResultRepository.save(result);
    this.logger.log(`Keputusan ditetapkan: applicationId=${applicationId}, decision=${decision}`);
    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Orkestrasi
  // ─────────────────────────────────────────────────────────────────────────────

  private async runScoring(applicationId: string, cvFilePath: string): Promise<void> {
    this.logger.log(`Memulai scoring untuk applicationId=${applicationId}`);

    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ["applicant", "vacancy"]
    });

    if (!application) {
      throw new NotFoundException(`Application ${applicationId} tidak ditemukan`);
    }

    const { applicant, vacancy } = application;
    const cvBuffer = await this.minioService.getFileBuffer(cvFilePath);

    const scoringResult = await this.callFastApiScoring(
      applicationId,
      cvBuffer,
      cvFilePath,
      vacancy.responsibilities ?? "",
      vacancy.requiredEducation ?? 0
    );

    await this.saveResults(scoringResult, applicant.id);

    this.logger.log(
      `Scoring selesai untuk applicationId=${applicationId}, ` +
      `maxExperienceScore=${scoringResult.evaluation.shortlistScore}`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: FastAPI call
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Field multipart yang dikirim ke FastAPI /parse:
   *   - cv_file                 : Buffer PDF
   *   - application_id          : string
   *   - role_description        : string (dari vacancy.responsibilities)
   *   - required_education_level: number (dari vacancy.requiredEducation)
   */
  private async callFastApiScoring(
    applicationId: string,
    cvBuffer: Buffer,
    cvFilePath: string,
    roleDescription: string,
    requiredEducationLevel: number
  ): Promise<NormalizedScoringResult> {
    const url = `${this.fastApiBaseUrl}/parse`;

    const form = new FormData();
    const fileName = cvFilePath.split("/").pop() ?? "cv.pdf";

    form.append("cv_file", cvBuffer, { filename: fileName, contentType: "application/pdf" });
    form.append("application_id",           applicationId);
    form.append("role_description",         roleDescription);
    form.append("required_education_level", String(requiredEducationLevel));

    try {
      const response = await firstValueFrom(
        this.httpService.post<FastApiScoringResponseDto>(url, form, {
          headers: { ...form.getHeaders() },
          timeout: 120_000
        })
      );

      if (!response.data.success) {
        throw new InternalServerErrorException("FastAPI Scoring Service mengembalikan success=false");
      }

      return this.mapFastApiResponse(response.data.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`FastAPI scoring gagal: ${message}`);
      throw new InternalServerErrorException(`Gagal menghubungi FastAPI Scoring Service: ${message}`);
    }
  }

  private mapFastApiResponse(data: FastApiScoringDataDto): NormalizedScoringResult {
    const cvParsed   = data.cv_parsed;
    const evaluation = data.evaluation;

    const educations: NormalizedEducation[] = (cvParsed.educations ?? []).map((e) => ({
      level:          this.mapEducationLevel(e.level),
      major:          e.major           ?? null,
      graduationYear: e.graduation_year ?? null
    }));

    const workExperiences: NormalizedWorkExperience[] = (cvParsed.work_experiences ?? []).map((w) => ({
      position:      w.position       ?? null,
      company:       w.company        ?? null,
      description:   w.description    ?? null,
      startDate:     w.start_date     ?? null,
      endDate:       w.end_date       ?? null,
      durationYears: w.duration_years ?? null
    }));

    // Entries dari FastAPI sudah enriched (position + company + description + score)
    const expEntries: NormalizedExperienceEntry[] = (
      evaluation.details.experience.entries ?? []
    ).map((e) => ({
      position:        e.position          ?? null,
      company:         e.company           ?? null,
      description:     e.description       ?? null,
      similarityScore: e.similarity_score  ?? null
    }));

    const eduEval = evaluation.details.education;
    const educationEvaluation: NormalizedEducationEvaluation | null = eduEval
      ? {
          method:                eduEval.method                  ?? null,
          vacancyRequiredLevel:  eduEval.vacancy_required_level  ?? null,
          applicantHighestLevel: eduEval.applicant_highest_level ?? null,
          isLevelFulfilled:      eduEval.is_level_fulfilled       ?? null
        }
      : null;

    return {
      applicationId: data.application_id,
      cvParsed: { applicantName: cvParsed.applicant_name ?? null, educations, workExperiences },
      evaluation: {
        shortlistScore: evaluation.shortlist_score ?? 0,
        experience: {
          method:  evaluation.details.experience.method ?? "SBERT Semantic Similarity (MAX)",
          entries: expEntries
        },
        educationEvaluation
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Simpan ke database
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Struktur evaluateDetail yang disimpan:
   * {
   *   cv_parsed: { applicant_name, educations[], work_experiences[] },
   *   experience: {
   *     method: "SBERT ...",
   *     entries: [{ position, company, description, similarity_score }]
   *   },
   *   education_evaluation: {
   *     method: "Rule-Based Level Matching",
   *     vacancy_required_level, applicant_highest_level, is_level_fulfilled
   *   }
   * }
   */
  private async saveResults(result: NormalizedScoringResult, applicantId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { applicationId, cvParsed, evaluation } = result;

      await manager.delete(EvaluationResult, { applicationId });

      // Timpa ApplicantEducation
      await manager.softDelete(ApplicantEducation, { applicantId });
      if (cvParsed.educations.length > 0) {
        const educations = cvParsed.educations.map((edu, index) => {
          const e       = new ApplicantEducation();
          e.applicantId = applicantId;
          e.level       = edu.level;
          e.major       = edu.major;
          e.endMonth    = edu.graduationYear ? String(edu.graduationYear) : null;
          e.order       = index + 1;
          return e;
        });
        await manager.save(ApplicantEducation, educations);
      }

      // Timpa ApplicantJobHistory
      await manager.softDelete(ApplicantJobHistory, { applicantId });
      if (cvParsed.workExperiences.length > 0) {
        const jobHistories = cvParsed.workExperiences.map((exp, index) => {
          const j         = new ApplicantJobHistory();
          j.applicantId   = applicantId;
          j.position      = exp.position;
          j.company       = exp.company;
          j.description   = exp.description;
          j.startDate     = exp.startDate ? new Date(exp.startDate) : new Date();
          j.endDate       = exp.endDate   ? new Date(exp.endDate)   : new Date();
          j.durationYears = exp.durationYears;
          j.order         = index + 1;
          return j;
        });
        await manager.save(ApplicantJobHistory, jobHistories);
      }

      // Simpan EvaluationResult
      const evalResult              = new EvaluationResult();
      evalResult.applicationId      = applicationId;
      evalResult.maxExperienceScore = evaluation.shortlistScore;
      evalResult.evaluateDetail     = {
        cv_parsed: {
          applicant_name:   cvParsed.applicantName,
          educations:       cvParsed.educations,
          work_experiences: cvParsed.workExperiences
        },
        experience: {
          method:  evaluation.experience.method,
          entries: evaluation.experience.entries.map((e) => ({
            position:         e.position,
            company:          e.company,
            description:      e.description,
            similarity_score: e.similarityScore
          }))
        },
        education_evaluation: evaluation.educationEvaluation
          ? {
              method:                  evaluation.educationEvaluation.method,
              vacancy_required_level:  evaluation.educationEvaluation.vacancyRequiredLevel,
              applicant_highest_level: evaluation.educationEvaluation.applicantHighestLevel,
              is_level_fulfilled:      evaluation.educationEvaluation.isLevelFulfilled
            }
          : null
      };
      evalResult.evaluatedAt = new Date();

      await manager.save(EvaluationResult, evalResult);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Helper
  // ─────────────────────────────────────────────────────────────────────────────

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