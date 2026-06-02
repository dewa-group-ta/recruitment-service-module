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
    const result = await this.evaluationResultRepository.findOne({ where: { applicationId } });
    if (!result) {
      throw new NotFoundException(`Hasil evaluasi untuk lamaran ${applicationId} belum tersedia`);
    }
    return result;
  }

  async updateDecision(applicationId: string, decision: string): Promise<EvaluationResult> {
    const result = await this.evaluationResultRepository.findOne({ where: { applicationId } });
    if (!result) {
      throw new NotFoundException(`Hasil evaluasi untuk lamaran ${applicationId} tidak ditemukan`);
    }
    result.decision = decision as any; // Sesuaikan dengan enum EvaluationDecision
    const updated = await this.evaluationResultRepository.save(result);
    this.logger.log(`Keputusan ditetapkan: applicationId=${applicationId}, decision=${decision}`);
    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Orkestrasi
  // ─────────────────────────────────────────────────────────────────────────────
  async runScoring(
    applicationId: string,
    cvFilePath: string
  ): Promise<FastApiScoringResponseDto> {
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

    // Hapus parameter requiredEducationLevel
    const scoringResult = await this.callFastApiScoring(
      applicationId,
      cvBuffer,
      cvFilePath,
      vacancy.responsibilities ?? ""
    );

    const maxScore = scoringResult.experience?.length 
      ? Math.max(...scoringResult.experience.map(e => e.similarity ?? 0)) 
      : 0;

    this.logger.log(
      `Scoring selesai untuk applicationId=${applicationId}, maxExperienceScore=${maxScore}`
    );

    return scoringResult;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: FastAPI call
  // ─────────────────────────────────────────────────────────────────────────────
  private async callFastApiScoring(
  applicationId: string,
  cvBuffer: Buffer,
  cvFilePath: string,
  jobResponsibilities: string    // ← rename parameter
): Promise<FastApiScoringResponseDto> {

  const url = `${this.fastApiBaseUrl}/parse-and-evaluate/`;
  const form = new FormData();
  const fileName = cvFilePath.split("/").pop() ?? "cv.pdf";

  form.append("cv_file", cvBuffer, { filename: fileName, contentType: "application/pdf" });
  form.append("application_id", applicationId);
  form.append("job_responsibilities", jobResponsibilities);  // ← ganti dari role_description
  // required_education_level dihapus

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
    throw new InternalServerErrorException(`Gagal menghubungi FastAPI Scoring Service: ${message}`);
  }
}

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE: Simpan ke database
  // ─────────────────────────────────────────────────────────────────────────────
  async saveResults(result: FastApiScoringResponseDto, applicantId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { application_id, educations, experience } = result;

      await manager.delete(EvaluationResult, { applicationId: application_id });

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

      // 3. Simpan EvaluationResult
      // Hitung max similarity score secara dinamis dari array experience
      const maxScore = experience && experience.length > 0 
        ? Math.max(...experience.map(e => e.similarity ?? 0)) 
        : 0;

      const evalResult = new EvaluationResult();
      evalResult.applicationId = application_id;
      evalResult.maxExperienceScore = maxScore;
      
      // Simpan snapshot JSON
      evalResult.evaluateDetail = {
        educations,
        experience
      };
      
      evalResult.evaluatedAt = new Date();
      await manager.save(EvaluationResult, evalResult);
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
    const parts = monthYear.split('-');
    if (parts.length === 2) {
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10);
      if (!isNaN(month) && !isNaN(year)) {
        // Set ke tanggal 1 pada bulan tersebut
        return new Date(year, month - 1, 1); 
      }
    }
    return null;
  }

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