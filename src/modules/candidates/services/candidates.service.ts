import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, In, DataSource } from "typeorm";
import { Application } from "../../applicants/entities/application.entity";
import { Applicant } from "../../applicants/entities/applicant.entity";
import { Vacancy } from "../../vacancies/entities/vacancy.entity";
import { PipelineStage } from "../../vacancies/entities/pipeline-stage.entity";
import { StageActivity } from "../../vacancies/entities/stage-activity.entity";
import { ApplicationNotes } from "../../applicants/entities/application-notes.entity";
import { ApplicantStatus } from "../../../shared/enums/applicant.enum";
import { EvaluationResult } from "../../applicant-results/entities/evaluation-results.entity";
import { ApplicantTableQueryDto, ApplicantSummaryQueryDto } from "../dto/applicant-table-query.dto";
import { ApplicantTableItemDto, ApplicantSummaryDataDto } from "../dto/applicant-table-response.dto";
import { CreateApplicationNotesDto } from "../../applicants/dto/create-application-notes.dto";
import { UpdateApplicationNotesDto } from "../../applicants/dto/update-application-notes.dto";
import { ApplicationNotesResponseDto } from "../../applicants/dto/application-notes-response.dto";
import { QueryApplicationNotesDto } from "../../applicants/dto/query-application-notes.dto";
import { HiringProgressDto } from "../dto/hiring-progress.dto";
import { JobStatus } from "src/shared/enums/job-status.enum";
import { StageActivityStatus } from "src/shared/enums/pipeline.enum";
import { NotificationService } from "../../../shared/services/notification.service";

export interface ScoringBreakdown {
  method: string | null;
  experiences: Array<{
    position: string | null;
    company: string | null;
    description: string | null;
    durationYears: number | null;
    similarityScore: number | null;
    isTopMatch: boolean;
  }>;
  educations: Array<{
    level: number | null;
    major: string | null;
    graduationYear: number | null;
  }>;
  educationEvaluation: {
    method: string | null;
    vacancyRequiredLevel: number | null;
    applicantHighestLevel: number | null;
    isLevelFulfilled: boolean | null;
  } | null;
}

export interface Candidate {
  id: string;
  applicationId: string;
  applicationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  status: ApplicantStatus;
  currentStage: string;
  score: number;
  appliedAt: Date;
  avatar?: string;
  education?: string;
  experience?: string;
  coverLetter?: string;
  expectedStartDate?: string;
  source?: string;
  // Personal details
  gender?: string;
  placeOfBirth?: string;
  dateOfBirth?: Date;
  availability?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  socialMediaUrl?: string;
  cvUrl?: string;
  isTalentPool?: boolean;
  vacancy?: {
    id: string;
    title: string;
    status: string;
    department?: string;
    workLocation?: string;
  };
  addresses?: Array<{
    id: string;
    applicantId: string;
    province: string;
    regency: string;
    district: string;
    village: string;
    fullAddress: string;
    postalCode: string;
    addressType: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }>;
  educations?: Array<{
    id: string;
    applicantId: string;
    schoolName: string;
    major: string;
    degree: string;
    gpa?: number;
    startMonth: string;
    endMonth?: string;
    diplomaFileName?: string;
    order: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }>;
  jobHistories?: Array<{
    id: string;
    applicantId: string;
    position: string | null;
    employeeStatus: string | null;
    company: string | null;
    startDate: Date;
    endDate?: Date;
    location?: string;
    description?: string;
    achievements?: string;
    order: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }>;

  evaluationResult?: {
    maxExperienceScore: number | null;
    decision: string | null;
    evaluatedAt: Date | null;
    scoringBreakdown: ScoringBreakdown | null;
  } | null;
}

export interface CandidatesByStage {
  stage: string;
  candidates: Candidate[];
}

export interface CandidatesResponse {
  data: Candidate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(Vacancy)
    private readonly vacancyRepository: Repository<Vacancy>,
    @InjectRepository(PipelineStage)
    private readonly pipelineStageRepository: Repository<PipelineStage>,
    @InjectRepository(StageActivity)
    private readonly stageActivityRepository: Repository<StageActivity>,
    @InjectRepository(ApplicationNotes)
    private readonly applicationNotesRepository: Repository<ApplicationNotes>,
    @InjectRepository(EvaluationResult)
    private readonly evaluationResultRepository: Repository<EvaluationResult>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Get all candidates with filters
   */
  async getAllCandidates(
    page: number = 1,
    limit: number = 10,
    status?: string,
    stage?: string,
    search?: string,
    vacancyId?: string
  ): Promise<CandidatesResponse> {
    const queryBuilder = this.applicationRepository
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.applicant", "applicant")
      .leftJoinAndSelect("application.vacancy", "vacancy")
      .leftJoinAndSelect("application.currentStage", "currentStage")
      .leftJoinAndSelect("currentStage.stageTemplate", "stageTemplate")
      .leftJoinAndSelect("applicant.educations", "educations")
      .leftJoinAndSelect("applicant.jobHistories", "jobHistories")
      .leftJoinAndSelect("applicant.applicantSources", "applicantSources")
      .leftJoinAndSelect("applicant.addresses", "addresses");

    // Apply filters
    if (status) {
      // Map frontend status to backend enum values
      let mappedStatus = status;
      if (status === "qualified") {
        // Qualified candidates are hired
        mappedStatus = "hired";
      } else if (status === "disqualified") {
        // Disqualified candidates are rejected
        mappedStatus = "rejected";
      }

      queryBuilder.andWhere("application.status = :status", {
        status: mappedStatus
      });
    }

    if (stage) {
      queryBuilder.andWhere("stageTemplate.name = :stage", { stage });
    }

    if (search) {
      queryBuilder.andWhere(
        "(applicant.fullName ILIKE :search OR applicant.email ILIKE :search OR application.applicationNumber ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (vacancyId) {
      queryBuilder.andWhere("application.vacancyId = :vacancyId", {
        vacancyId
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Order by applied date
    queryBuilder.orderBy("application.appliedAt", "DESC");

    const applications = await queryBuilder.getMany();

    // Transform to candidates
    const candidates: Candidate[] = applications.map((app) => ({
      id: app.applicant.id,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      fullName: app.applicant.fullName,
      email: app.applicant.email,
      phone: app.applicant.phone,
      status: app.status,
      currentStage: app.currentStage?.stageTemplate?.name || "Applied",
      score: app.currentScore,
      appliedAt: app.appliedAt,
      avatar: app.applicant.photoUrl,
      education: this.getEducationLevel(app.applicant.educations),
      experience: this.getExperienceLevel(app.applicant.jobHistories),
      address: app.applicant.addresses?.map(addr => ({
        id: addr.id,
        applicantId: addr.applicantId,
        province: addr.province,
        regency: addr.regency,
        district: addr.district,
        village: addr.village,
        fullAddress: addr.fullAddress,
        postalCode: addr.postalCode,
        addressType: addr.addressType,
        createdAt: this.toISOString(addr.createdAt),
        updatedAt: this.toISOString(addr.updatedAt),
        deletedAt: this.toISOString(addr.deletedAt) || null
      })),
      vacancy: app.vacancy ? {
        id: app.vacancy.id,
        title: app.vacancy.title,
        status: app.vacancy.status,
        department: app.vacancy.department?.name,
        workLocation: app.vacancy.officeAddresses?.[0]
      } : undefined
    }));

    return {
      data: candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get candidates for a specific vacancy
   */
  async getCandidatesByVacancy(
    vacancyId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
    stage?: string,
    search?: string
  ): Promise<CandidatesResponse> {
    return this.getAllCandidates(page, limit, status, stage, search, vacancyId);
  }

  /**
   * Get candidates grouped by stage for a vacancy
   */
  async getCandidatesByStage(vacancyId: string): Promise<CandidatesByStage[]> {
    const applications = await this.applicationRepository.find({
      where: { vacancyId },
      relations: [
        "applicant",
        "currentStage",
        "currentStage.stageTemplate",
        "applicant.educations",
        "applicant.jobHistories",
        "applicant.applicantSources"
      ],
      order: { appliedAt: "DESC" }
    });

    // Group by stage
    const stageMap = new Map<string, Candidate[]>();

    applications.forEach((app) => {
      const stageName = app.currentStage?.stageTemplate?.name || "Applied";

      if (!stageMap.has(stageName)) {
        stageMap.set(stageName, []);
      }

      const candidate: Candidate = {
        id: app.applicant.id,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        fullName: app.applicant.fullName,
        email: app.applicant.email,
        phone: app.applicant.phone,
        status: app.status,
        currentStage: stageName,
        score: app.currentScore,
        appliedAt: app.appliedAt,
        avatar: app.applicant.photoUrl,
        education: this.getEducationLevel(app.applicant.educations),
        experience: this.getExperienceLevel(app.applicant.jobHistories)
      };

      stageMap.get(stageName)!.push(candidate);
    });

    // Convert to array
    return Array.from(stageMap.entries()).map(([stage, candidates]) => ({
      stage,
      candidates
    }));
  }

  /**
   * Get candidate statistics
   */
  async getCandidateStats(vacancyId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byStage: Record<string, number>;
  }> {
    const queryBuilder = this.applicationRepository
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.currentStage", "currentStage")
      .leftJoinAndSelect("currentStage.stageTemplate", "stageTemplate");

    if (vacancyId) {
      queryBuilder.andWhere("application.vacancyId = :vacancyId", {
        vacancyId
      });
    }

    const applications = await queryBuilder.getMany();

    const stats = {
      total: applications.length,
      byStatus: {} as Record<string, number>,
      byStage: {} as Record<string, number>,
    };

    applications.forEach((app) => {
      // Count by status
      const status = app.status;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Count by stage
      const stage = app.currentStage?.stageTemplate?.name || "Applied";
      stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;
    });


    return stats;
  }

  /**
   * Get education level from educations array
   */
  private getEducationLevel(educations: any[]): string {
    if (!educations || educations.length === 0) return "Not specified";

    // Get the highest education level
    const levels = educations.map(
      (edu) => edu.degree || edu.level || "Unknown"
    );
    return levels[0] || "Not specified";
  }

  /**
   * Get experience level from job histories
   */
  private getExperienceLevel(jobHistories: any[]): string {
    if (!jobHistories || jobHistories.length === 0) return "No experience";

    const totalMonths = jobHistories.reduce((total, job) => {
      const startDate = new Date(job.startDate);
      const endDate = job.endDate ? new Date(job.endDate) : new Date();
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      return total + Math.max(0, months);
    }, 0);

    const years = Math.floor(totalMonths / 12);

    if (years === 0) return "Less than 1 year";
    if (years === 1) return "1 year";
    if (years < 5) return `${years} years`;
    if (years < 10) return `${years} years (Senior)`;
    return `${years} years (Expert)`;
  }

  /**
   * Get applicants for table display with optimized data structure
   */
  async getApplicantsTable(query: ApplicantTableQueryDto): Promise<{
    data: ApplicantTableItemDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      jobStatus,
      stage,
      vacancyId,
      sortBy = 'applyDate',
      sortOrder = 'desc'
    } = query;

    const queryBuilder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.applicant', 'applicant')
      .leftJoinAndSelect('application.vacancy', 'vacancy')
      .leftJoinAndSelect('application.currentStage', 'currentStage')
      .leftJoinAndSelect('currentStage.stageTemplate', 'stageTemplate');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(applicant.fullName ILIKE :search OR applicant.email ILIKE :search OR vacancy.title ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status && status.length > 0) {
      const statusConditions = status.map((s, index) => {
        if (s === 'talent-pool') {
          return `application.isTalentPool = true`;
        }
        const statusMap: Record<string, string> = {
          'new': 'applied',
          'qualified': 'hired',
          'disqualified': 'rejected'
        };
        return `application.status = :status${index}`;
      });
      
      queryBuilder.andWhere(`(${statusConditions.join(' OR ')})`);
      status.forEach((s, index) => {
        if (s !== 'talent-pool') {
          const statusMap: Record<string, string> = {
            'new': 'applied',
            'qualified': 'hired',
            'disqualified': 'rejected'
          };
          queryBuilder.setParameter(`status${index}`, statusMap[s] || s);
        }
      });
    }

    if (jobStatus && jobStatus.length > 0) {
      queryBuilder.andWhere('vacancy.status IN (:...jobStatus)', { jobStatus });
    }

    if (stage && stage.length > 0) {
      queryBuilder.andWhere('currentStage.stageTemplate.id IN (:...stage)', { stage });
    }

    if (vacancyId) {
      queryBuilder.andWhere('application.vacancyId = :vacancyId', { vacancyId });
    }

    // Apply sorting
    const sortField = this.getSortField(sortBy);
    if (sortBy === 'maxExperienceScore') {
      // Sort by WSM maxExperienceScore dari evaluation_results (nullable → NULLS LAST)
      queryBuilder
        .leftJoin(EvaluationResult, 'evalSort', 'evalSort.applicationId = application.id')
        .addSelect('evalSort.maxExperienceScore', 'evalSort_max_experience_score')
        .orderBy('evalSort.maxExperienceScore', sortOrder.toUpperCase() as 'ASC' | 'DESC', 'NULLS LAST');
    } else {
      queryBuilder.orderBy(sortField!, sortOrder.toUpperCase() as 'ASC' | 'DESC');
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Get total count
    const totalQuery = queryBuilder.clone();
    const total = await totalQuery.getCount();

    // Execute query
    const applications = await queryBuilder.getMany();

    // Batch-fetch evaluation results untuk semua application sekaligus (1 query)
    // Lebih efisien daripada N+1 query per application
    const applicationIds = applications.map(a => a.id);
    const evalResults = applicationIds.length > 0
      ? await this.evaluationResultRepository.find({
          where: { applicationId: In(applicationIds) },
          select: ['applicationId', 'maxExperienceScore']
        })
      : [];
    const evalMap = new Map<string, number | null>(
      evalResults.map(e => [e.applicationId, e.maxExperienceScore ?? null])
    );

    // Transform to DTO — inject maxExperienceScore dari WSM scoring
    const data: ApplicantTableItemDto[] = applications.map(app => ({
      ...this.transformToApplicantTableItem(app),
      maxExperienceScore: evalMap.get(app.id) ?? null
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get applicant summary/statistics
   */
  async getApplicantsSummary(query: ApplicantSummaryQueryDto): Promise<ApplicantSummaryDataDto> {
    const { status, jobStatus, stage, vacancyId, dateFrom, dateTo } = query;

    const queryBuilder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.applicant', 'applicant')
      .leftJoinAndSelect('application.vacancy', 'vacancy')
      .leftJoinAndSelect('application.currentStage', 'currentStage')
      .leftJoinAndSelect('currentStage.stageTemplate', 'stageTemplate');

    // Apply filters
    if (status && status.length > 0) {
      const statusConditions = status.map((s, index) => {
        if (s === 'talent-pool') {
          return `application.isTalentPool = true`;
        }
        const statusMap: Record<string, string> = {
          'new': 'applied',
          'qualified': 'hired',
          'disqualified': 'rejected'
        };
        return `application.status = :status${index}`;
      });
      
      queryBuilder.andWhere(`(${statusConditions.join(' OR ')})`);
      status.forEach((s, index) => {
        if (s !== 'talent-pool') {
          const statusMap: Record<string, string> = {
            'new': 'applied',
            'qualified': 'hired',
            'disqualified': 'rejected'
          };
          queryBuilder.setParameter(`status${index}`, statusMap[s] || s);
        }
      });
    }

    if (jobStatus && jobStatus.length > 0) {
      queryBuilder.andWhere('vacancy.status IN (:...jobStatus)', { jobStatus });
    }

    if (stage && stage.length > 0) {
      queryBuilder.andWhere('stageTemplate.name IN (:...stage)', { stage });
    }

    if (vacancyId) {
      queryBuilder.andWhere('application.vacancyId = :vacancyId', { vacancyId });
    }

    if (dateFrom) {
      queryBuilder.andWhere('application.appliedAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('application.appliedAt <= :dateTo', { dateTo });
    }

    const applications = await queryBuilder.getMany();

    // Calculate statistics
    const total = applications.length;
    
    const byStatus = {
      new: 0,
      qualified: 0,
      disqualified: 0,
      talentPool: 0
    };

    const byStage: Record<string, number> = {};
    const byJobStatus = {
      published: 0,
      draft: 0,
      closed: 0,
      archived: 0
    };

    let recentApplications = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    applications.forEach(app => {
      // Count by status
      if (app.status === 'applied') byStatus.new++;
      else if (app.status === ApplicantStatus.HIRED) byStatus.qualified++;
      else if (app.status === ApplicantStatus.REJECTED) byStatus.disqualified++;

      if (app.isTalentPool) byStatus.talentPool++;

      // Count by stage
      const stageName = app.currentStage?.stageTemplate?.name || 'Unknown';
      byStage[stageName] = (byStage[stageName] || 0) + 1;

      // Count by job status
      const jobStatus = app.vacancy?.status;
      if (jobStatus === JobStatus.PUBLISHED) byJobStatus.published++;
      else if (jobStatus === JobStatus.DRAFT) byJobStatus.draft++;
      else if (jobStatus === JobStatus.CLOSED) byJobStatus.closed++;
      else if (jobStatus === JobStatus.ARCHIVED) byJobStatus.archived++;

      // Count recent applications
      if (new Date(app.appliedAt) >= sevenDaysAgo) {
        recentApplications++;
      }
    });

    return {
      total,
      byStatus,
      byStage,
      byJobStatus,
      recentApplications
    };
  }

  /**
   * Transform application to applicant table item
   */
  private transformToApplicantTableItem(application: any): ApplicantTableItemDto {
    const applicant = application.applicant;
    const vacancy = application.vacancy;
    const currentStage = application.currentStage;

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth: Date | string | null | undefined): number | undefined => {
      if (!dateOfBirth) return undefined;
      
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    };
    
    const age = calculateAge(applicant.dateOfBirth);

    // Map status using consistent mapping
    const statusMap: Record<string, string> = {
      'applied': 'new',
      'accepted': 'qualified', 
      'rejected': 'disqualified',
      'hired': 'qualified'
    };

    const status = statusMap[application.status] || 'new';
    const isTalentPool = application.isTalentPool;

    return {
      id: application.id,
      applicationId: application.id,
      applicantId: applicant.id,
      name: applicant.fullName,
      email: applicant.email,
      phone: applicant.phone || '',
      avatar: applicant.photoUrl || null,
      age,
      jobVacancy: {
        id: vacancy.id,
        title: vacancy.title,
        status: vacancy.status,
        department: vacancy.department,
        workLocation: vacancy.officeAddresses?.[0] || null
      },
      status,
      currentStage: currentStage?.stageTemplate?.name || 'Applied',
      currentScore: application.currentScore || undefined,
      isTalentPool,
      applyDate: application.appliedAt ? new Date(application.appliedAt).toISOString() : new Date().toISOString(),
      lastActivityAt: application.lastActivityAt ? new Date(application.lastActivityAt).toISOString() : undefined,
      source: application.source || undefined,
      expectedStartDate: application.expectedStartDate ? new Date(application.expectedStartDate).toISOString() : undefined,
      coverLetter: application.coverLetter || undefined
    };
  }

  // =============================================================================
// PERUBAHAN 4: getSortField
//
// Ganti seluruh method getSortField yang lama dengan versi di bawah ini.
// Hanya mengubah satu baris: 'totalScore' → 'maxExperienceScore'.
// =============================================================================
 
  /**
   * Get sort field for query builder.
   * maxExperienceScore ditangani secara khusus di getApplicantsTable
   * (butuh LEFT JOIN ke evaluation_results), bukan via kolom langsung.
   */
  private getSortField(sortBy: string): string | null {
    const sortFields: Record<string, string> = {
      name:         "applicant.fullName",
      applyDate:    "application.appliedAt",
      currentScore: "application.currentScore",
      stage:        "stageTemplate.name"
    };
    if (sortBy === "maxExperienceScore") return null;
    return sortFields[sortBy] ?? "application.appliedAt";
  }

  // =============================================================================
// PERUBAHAN 3: getCandidateDetail
//
// Ganti seluruh method getCandidateDetail yang lama dengan versi di bawah ini.
//
// Yang berubah:
//   - evaluateDetail tidak lagi di-return sebagai raw JSON string
//   - Sebaliknya, di-parse dan diubah menjadi ScoringBreakdown yang terstruktur
//   - isTopMatch dihitung: true untuk entri yang similarity_score-nya sama
//     dengan maxExperienceScore (entry yang menjadi dasar skor akhir)
//   - educations di scoringBreakdown diambil dari cv_parsed.educations (snapshot)
// =============================================================================
 
  /**
   * Get candidate detail by application ID.
   * Termasuk scoring breakdown lengkap yang siap ditampilkan oleh HR:
   * tiap entri pengalaman beserta role, perusahaan, deskripsi, dan skor similarity-nya.
   */
  async getCandidateDetail(applicationId: string): Promise<Candidate> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: [
        "applicant",
        "vacancy",
        "currentStage",
        "currentStage.stageTemplate",
        "applicant.educations",
        "applicant.jobHistories",
        "applicant.applicantSources",
        "applicant.addresses"
      ]
    });
 
    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }
 
    const evalResult = await this.evaluationResultRepository.findOne({
      where: { applicationId }
    });
 
    // ── Parse evaluateDetail → ScoringBreakdown ───────────────────────────
    let scoringBreakdown: ScoringBreakdown | null = null;
 
    if (evalResult?.evaluateDetail) {
      const detail: Record<string, any> =
        typeof evalResult.evaluateDetail === "string"
          ? JSON.parse(evalResult.evaluateDetail)
          : evalResult.evaluateDetail;
 
      const maxScore = evalResult.maxExperienceScore ?? null;
 
      const experienceEntries: ScoringBreakdown["experiences"] = (
        detail.experience?.entries ?? []
      ).map((e: any) => ({
        position:        e.position          ?? null,
        company:         e.company           ?? null,
        description:     e.description       ?? null,
        durationYears:   e.duration_years    ?? null,
        similarityScore: e.similarity_score  ?? null,
        isTopMatch:
          maxScore !== null &&
          e.similarity_score !== null &&
          Math.abs(e.similarity_score - maxScore) < 0.0001
      }));
 
      const educationEntries: ScoringBreakdown["educations"] = (
        detail.cv_parsed?.educations ?? []
      ).map((e: any) => ({
        level:          e.level                                ?? null,
        major:          e.major                               ?? null,
        graduationYear: e.graduationYear ?? e.graduation_year ?? null
      }));
 
      const eduEval = detail.education_evaluation ?? null;
      const educationEvaluation: ScoringBreakdown["educationEvaluation"] = eduEval
        ? {
            method:                eduEval.method                  ?? null,
            vacancyRequiredLevel:  eduEval.vacancy_required_level  ?? null,
            applicantHighestLevel: eduEval.applicant_highest_level ?? null,
            isLevelFulfilled:      eduEval.is_level_fulfilled       ?? null
          }
        : null;
 
      scoringBreakdown = {
        method:              detail.experience?.method ?? null,
        experiences:         experienceEntries,
        educations:          educationEntries,
        educationEvaluation
      };
    }
    // ─────────────────────────────────────────────────────────────────────
 
    return {
      id: application.applicant.id,
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      fullName: application.applicant.fullName,
      email: application.applicant.email,
      phone: application.applicant.phone,
      status: application.status,
      currentStage: application.currentStage?.stageTemplate?.name || "Applied",
      score: application.currentScore,
      appliedAt: application.appliedAt,
      avatar: application.applicant.photoUrl,
      education: this.getEducationLevel(application.applicant.educations),
      experience: this.getExperienceLevel(application.applicant.jobHistories),
      coverLetter: application.coverLetter,
      expectedStartDate: application.expectedStartDate
        ? this.toISOString(application.expectedStartDate)
        : undefined,
      source: application.source,
      gender:         application.applicant.gender,
      placeOfBirth:   application.applicant.placeOfBirth,
      dateOfBirth:    application.applicant.dateOfBirth,
      availability:   application.applicant.availability,
      linkedinUrl:    application.applicant.linkedinUrl,
      portfolioUrl:   application.applicant.portfolioUrl,
      socialMediaUrl: application.applicant.socialMediaUrl,
      cvUrl:          application.applicant.cvUrl,
      isTalentPool:   application.isTalentPool,
      vacancy: application.vacancy
        ? {
            id:           application.vacancy.id,
            title:        application.vacancy.title,
            status:       application.vacancy.status,
            department:   application.vacancy.department?.name,
            workLocation: application.vacancy.officeAddresses?.[0]
          }
        : undefined,
      addresses: application.applicant.addresses?.map((addr) => ({
        id: addr.id, applicantId: addr.applicantId,
        province: addr.province, regency: addr.regency,
        district: addr.district, village: addr.village,
        fullAddress: addr.fullAddress, postalCode: addr.postalCode,
        addressType: addr.addressType,
        createdAt: this.toISOString(addr.createdAt),
        updatedAt: this.toISOString(addr.updatedAt),
        deletedAt: this.toISOString(addr.deletedAt) || null
      })) ?? [],
      educations: application.applicant.educations?.map((edu) => ({
        id: edu.id, applicantId: edu.applicantId,
        schoolName: edu.schoolName ?? "", major: edu.major ?? "",
        degree: edu.degree ?? "", gpa: edu.gpa ?? undefined,
        startMonth: edu.startMonth ?? "", endMonth: edu.endMonth ?? undefined,
        diplomaFileName: edu.diplomaFileName ?? undefined, order: edu.order,
        createdAt: this.toISOString(edu.createdAt),
        updatedAt: this.toISOString(edu.updatedAt),
        deletedAt: this.toISOString(edu.deletedAt) || null
      })) ?? [],
      jobHistories: application.applicant.jobHistories?.map((job) => ({
        id: job.id, applicantId: job.applicantId,
        position: job.position, employeeStatus: job.employeeStatus as string | null,
        company: job.company, startDate: job.startDate, endDate: job.endDate,
        location: job.location ?? undefined, description: job.description ?? undefined,
        achievements: job.achievements ?? undefined, order: job.order,
        createdAt: this.toISOString(job.createdAt),
        updatedAt: this.toISOString(job.updatedAt),
        deletedAt: this.toISOString(job.deletedAt) || null
      })) ?? [],
      evaluationResult: evalResult
        ? {
            maxExperienceScore: evalResult.maxExperienceScore ?? null,
            decision:
              typeof evalResult.decision === "string" ? evalResult.decision
              : evalResult.decision != null ? String(evalResult.decision)
              : null,
            evaluatedAt:     evalResult.evaluatedAt ?? null,
            scoringBreakdown
          }
        : null
    };
  }

  /**
   * Get hiring progress for a candidate
   */
  async getHiringProgress(applicationId: string): Promise<HiringProgressDto> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: [
        "applicant",
        "currentStage",
        "currentStage.stageTemplate",
        "pipeline",
        "pipeline.stages",
        "pipeline.stages.stageTemplate",
        "activities",
        "activities.stage",
        "activities.stage.stageTemplate"
      ],
      order: {
        "pipeline": {
          "stages": {
            "stageOrder": "ASC"
          }
        }
      }
    });

    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }

    // Get pipeline stages
    const pipeline = application.pipeline;
    const stages = pipeline?.stages || [];
    const activities = application.activities || [];
    
    // Default stages if no pipeline exists
    const defaultStages = [
      { id: 'applied', name: 'Applied', order: 1 },
      { id: 'screening', name: 'Screening CV', order: 2 },
      { id: 'interview', name: 'Interview', order: 3 },
      { id: 'offering', name: 'Offering', order: 4 },
      { id: 'hired', name: 'Hired', order: 5 }
    ];
    
    // Use pipeline stages or default stages
    const availableStages = stages.length > 0 ? stages : defaultStages;
    
    // Helper function to get stage name
    const getStageName = (stage: any) => {
      return stage.stageTemplate?.name || stage.name || 'Unknown Stage';
    };
    
    // Create stage progress
    const stageProgress = availableStages.map(stage => {
      const activity = activities.find(act => act.stage?.id === stage.id);
      
      return {
        title: getStageName(stage),
        date: activity?.createdAt ? this.toISOString(activity.createdAt) : undefined,
        status: activity?.status as StageActivityStatus,
        score: activity?.score,
        notes: activity?.notes,
        canScore: stage.stageTemplate?.canScore || false,
      };
    });

    // Find current and upcoming stages
    const currentStageIndex = availableStages.findIndex(stage => stage.id === application.currentStage?.id);
    const currentStage = application.currentStage?.stageTemplate?.name || 'Applied';
    const upcomingStage = currentStageIndex < availableStages.length - 1 
      ? getStageName(availableStages[currentStageIndex + 1])
      : 'Completed';

    // Get canScore for current and upcoming stages
    const currentStageCanScore = application.currentStage?.stageTemplate?.canScore || false;
    const upcomingStageCanScore = currentStageIndex < availableStages.length - 1 
      ? (availableStages[currentStageIndex + 1] as any)?.stageTemplate?.canScore || false
      : false;

    return {
      currentStage,
      upcomingStage,
      overallScore: application.currentScore,
      currentStageCanScore,
      upcomingStageCanScore,
      stages: stageProgress
    };
  }

  /**
   * Update candidate status
   */
  async updateCandidateStatus(
    applicationId: string,
    status: string,
    notes?: string
  ): Promise<Candidate> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ["applicant", "vacancy", "currentStage", "currentStage.stageTemplate"]
    });

    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }

    // Update application status
    await this.applicationRepository.update(applicationId, {
      status: status as any,
      lastActivityAt: new Date()
    });

    // Send status update notification to applicant
    try {
      if (application.applicant && application.vacancy) {
        await this.notificationService.sendCustomNotification(
          "notification_applicant_status_update",
          {
            email: application.applicant.email,
            name: application.applicant.fullName
          },
          {
            applicant_name: application.applicant.fullName,
            vacancy_name: application.vacancy.title,
            status: status,
            application_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/applicant/tracking/${applicationId}`,
            company_name: process.env.COMPANY_NAME || "Neuronworks",
            company_website: process.env.COMPANY_WEBSITE || "https://neuronworks.id"
          }
        );
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to send status update notification:', error);
    }

    // Return updated candidate
    return this.getCandidateDetail(applicationId);
  }

  /**
   * Move candidate to next stage
   */
  async moveToNextStage(
    applicationId: string,
    notes?: string,
    score?: number
  ): Promise<Candidate> {
    // Use database transaction to ensure atomicity
    return await this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, {
        where: { id: applicationId },
        relations: ["currentStage", "currentStage.stageTemplate", "pipeline", "pipeline.stages", "activities"]
      });

      if (!application) {
        throw new Error(`Application with ID ${applicationId} not found`);
      }

      const currentStage = application.currentStage;

      // Find next stage
      const stages = application.pipeline?.stages || [];
      const nextStage = stages.find(stage => stage.stageOrder > currentStage?.stageOrder);  
      if (!nextStage) {
        throw new Error(`Next stage not found`);
      }

      // calculate overall score
      const activityWithScore = application.activities.filter(activity => activity.score !== undefined && activity.score !== null);
      const currentScore = score !== undefined ? score : 0;
      
      // Include current score in calculation
      const allScores = [...activityWithScore.map(activity => parseFloat(activity.score?.toString() || '0')), currentScore];
      const totalScore = allScores.reduce((acc, score) => acc + score, 0);
      const overallScore = allScores.length > 0 ? totalScore / allScores.length : 0;

      // update current stage activity
      const currentStageActivity = application.activities.find(activity => activity.stageId === currentStage?.id);
      if (currentStageActivity) {
        currentStageActivity.status = StageActivityStatus.DONE;
        currentStageActivity.score = score;
        currentStageActivity.notes = notes;
        await manager.save(StageActivity, currentStageActivity);
      }

      console.log('currentStage', currentStage);
      console.log('nextStage', nextStage);
      console.log('overallScore', overallScore);

      // create stage activity
      const stageActivity = manager.create(StageActivity, {
        applicationId: applicationId,
        stageId: nextStage.id,
        status: StageActivityStatus.IN_PROGRESS,
        createdAt: new Date(),
      });
      await manager.save(StageActivity, stageActivity);

      // Update application current stage
      await manager.update(Application, applicationId, {
        currentStageId: nextStage.id,
        currentScore: parseFloat(overallScore.toFixed(2)),
        currentNotes: notes,
        lastActivityAt: new Date()
      });

      if(currentStage.sendNotification){
        // Send email notification to applicant with updated stage template
        try {
          // Get applicant data for notification
          const applicationWithApplicant = await manager.findOne(Application, {
            where: { id: applicationId },
            relations: ["applicant", "vacancy"]
          });

          if (applicationWithApplicant?.applicant && applicationWithApplicant?.vacancy) {
            await this.notificationService.sendCustomNotification(
              "notification_applicant_stage_update",
              {
                email: applicationWithApplicant.applicant.email,
                name: applicationWithApplicant.applicant.fullName
              },
              {
                applicant_name: applicationWithApplicant.applicant.fullName,
                vacancy_name: applicationWithApplicant.vacancy.title,
                stage_name: nextStage.stageTemplate?.name || "Next Stage",
                application_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/applicant/tracking/${applicationId}`,
                company_name: process.env.COMPANY_NAME || "Neuronworks",
                company_website: process.env.COMPANY_WEBSITE || "https://neuronworks.id"
              }
            );
          }
        } catch (error) {
          // Log error but don't fail the transaction
          console.error('Failed to send stage update notification:', error);
        }
      }

      // Return updated candidate
      return this.getCandidateDetail(applicationId);
    });
  }

  /**
   * Add candidate score
   */
  async addCandidateScore(
    applicationId: string,
    score: number,
    notes?: string
  ): Promise<Candidate> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId }
    });

    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }

    // Update application score
    await this.applicationRepository.update(applicationId, {
      currentScore: score,
      lastActivityAt: new Date()
    });

    // Return updated candidate
    return this.getCandidateDetail(applicationId);
  }

  /**
   * Update talent pool status for an application
   */
  async updateTalentPoolStatus(applicationId: string, isTalentPool: boolean): Promise<void> {
    await this.applicationRepository.update(applicationId, {
      isTalentPool
    });
  }

  /**
   * Helper method to safely convert date to ISO string
   */
  private toISOString(date: any): string {
    if (!date) return '';
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') return date;
    return '';
  }

  // ==================== APPLICATION NOTES METHODS ====================

  /**
   * Create a new note for an application
   */
  async createApplicationNote(createDto: CreateApplicationNotesDto): Promise<ApplicationNotesResponseDto> {
    // Verify application exists
    const application = await this.applicationRepository.findOne({
      where: { id: createDto.applicationId }
    });

    if (!application) {
      throw new Error(`Application with ID ${createDto.applicationId} not found`);
    }

    // Create the note
    const note = this.applicationNotesRepository.create({
      applicationId: createDto.applicationId,
      notes: createDto.notes,
      createdBy: createDto.createdBy,
      isPrivate: createDto.isPrivate || false,
      category: createDto.category,
      priority: createDto.priority
    });

    const savedNote = await this.applicationNotesRepository.save(note);

    return this.transformToNotesResponseDto(savedNote);
  }

  /**
   * Get all notes for an application
   */
  async getApplicationNotes(
    applicationId: string,
    query: QueryApplicationNotesDto
  ): Promise<{
    data: ApplicationNotesResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, category, priority, isPrivate, createdBy, sort_by = 'createdAt', order = 'DESC' } = query;

    const queryBuilder = this.applicationNotesRepository
      .createQueryBuilder('notes')
      .where('notes.applicationId = :applicationId', { applicationId });

    // Apply filters
    if (category) {
      queryBuilder.andWhere('notes.category = :category', { category });
    }

    if (priority) {
      queryBuilder.andWhere('notes.priority = :priority', { priority });
    }

    if (typeof isPrivate === 'boolean') {
      queryBuilder.andWhere('notes.isPrivate = :isPrivate', { isPrivate });
    }

    if (createdBy) {
      queryBuilder.andWhere('notes.createdBy = :createdBy', { createdBy });
    }

    // Apply sorting
    queryBuilder.orderBy(`notes.${sort_by}`, order.toUpperCase() as 'ASC' | 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const notes = await queryBuilder.getMany();

    const data = notes.map(note => this.transformToNotesResponseDto(note));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get a specific note by ID
   */
  async getApplicationNoteById(noteId: string): Promise<ApplicationNotesResponseDto> {
    const note = await this.applicationNotesRepository.findOne({
      where: { id: noteId }
    });

    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    return this.transformToNotesResponseDto(note);
  }

  /**
   * Update an application note
   */
  async updateApplicationNote(
    noteId: string,
    updateDto: UpdateApplicationNotesDto
  ): Promise<ApplicationNotesResponseDto> {
    const note = await this.applicationNotesRepository.findOne({
      where: { id: noteId }
    });

    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    // Update the note
    Object.assign(note, updateDto);
    const updatedNote = await this.applicationNotesRepository.save(note);

    return this.transformToNotesResponseDto(updatedNote);
  }

  /**
   * Delete an application note
   */
  async deleteApplicationNote(noteId: string): Promise<void> {
    const note = await this.applicationNotesRepository.findOne({
      where: { id: noteId }
    });

    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    await this.applicationNotesRepository.softDelete(noteId);
  }

  /**
   * Get notes for multiple applications (for candidates list)
   */
  async getNotesForApplications(applicationIds: string[]): Promise<Record<string, ApplicationNotesResponseDto[]>> {
    const notes = await this.applicationNotesRepository.find({
      where: applicationIds.map(id => ({ applicationId: id })),
      order: { createdAt: 'DESC' }
    });

    // Group notes by application ID
    const notesByApplication: Record<string, ApplicationNotesResponseDto[]> = {};
    
    applicationIds.forEach(id => {
      notesByApplication[id] = [];
    });

    notes.forEach(note => {
      if (notesByApplication[note.applicationId]) {
        notesByApplication[note.applicationId].push(this.transformToNotesResponseDto(note));
      }
    });

    return notesByApplication;
  }

  /**
   * Transform entity to response DTO
   */
  private transformToNotesResponseDto(note: ApplicationNotes): ApplicationNotesResponseDto {
    return {
      id: note.id,
      applicationId: note.applicationId,
      notes: note.notes,
      createdBy: note.createdBy,
      updatedBy: note.updatedBy,
      isPrivate: note.isPrivate,
      category: note.category,
      priority: note.priority,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };
  }

  /**
   * Get multiple candidates for comparison
   * Follows Single Responsibility Principle - focused only on fetching comparison data
   */
  async getCandidatesForComparison(applicationIds: string[]): Promise<Candidate[]> {
    const applications = await this.applicationRepository.find({
      where: { id: In(applicationIds) },
      relations: [
        "applicant",
        "applicant.addresses",
        "applicant.educations",
        "applicant.jobHistories",
        "currentStage",
        "currentStage.stageTemplate",
        "vacancy",
        "vacancy.department",
        "pipeline",
        "pipeline.stages",
        "pipeline.stages.stageTemplate"
      ],
      order: {
        "pipeline": {
          "stages": {
            "stageOrder": "ASC"
          }
        }
      }
    });

    if (applications.length === 0) {
      throw new Error("No applications found with the provided IDs");
    }

    // Get all activities for these applications
    const allActivities = await this.stageActivityRepository.find({
      where: { applicationId: In(applicationIds) },
      order: { createdAt: "ASC" }
    });

    // Group activities by applicationId
    const activitiesByApplication = allActivities.reduce((acc, activity) => {
      if (!acc[activity.applicationId]) {
        acc[activity.applicationId] = [];
      }
      acc[activity.applicationId].push(activity);
      return acc;
    }, {} as Record<string, any[]>);

    // Transform applications to candidates with comparison-specific data structure
    const candidates: Candidate[] = applications.map(application => {
      // Get hiring progress data with proper activities
      const progress = this.getHiringProgressForComparison(application, activitiesByApplication[application.id] || []);
      
      // Get detailed info for comparison
      const info = this.getDetailedInfoForComparison(application);

      return {
        id: application.applicant.id,
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        fullName: application.applicant.fullName,
        email: application.applicant.email,
        phone: application.applicant.phone,
        status: application.status,
        currentStage: application.currentStage?.stageTemplate?.name || "Applied",
        score: application.currentScore,
        appliedAt: application.appliedAt,
        avatar: application.applicant.photoUrl,
        education: this.getEducationLevel(application.applicant.educations),
        experience: this.getExperienceLevel(application.applicant.jobHistories),
        coverLetter: application.coverLetter,
        expectedStartDate: application.expectedStartDate ? this.toISOString(application.expectedStartDate) : undefined,
        source: application.source,
        // Personal details
        gender: application.applicant.gender,
        placeOfBirth: application.applicant.placeOfBirth,
        dateOfBirth: application.applicant.dateOfBirth,
        availability: application.applicant.availability,
        linkedinUrl: application.applicant.linkedinUrl,
        portfolioUrl: application.applicant.portfolioUrl,
        socialMediaUrl: application.applicant.socialMediaUrl,
        cvUrl: application.applicant.cvUrl,
        isTalentPool: application.isTalentPool,
        vacancy: application.vacancy ? {
          id: application.vacancy.id,
          title: application.vacancy.title,
          status: application.vacancy.status,
          department: application.vacancy.department?.name,
          workLocation: application.vacancy.officeAddresses?.[0]
        } : undefined,
        addresses: application.applicant.addresses?.map(addr => ({
          id: addr.id,
          applicantId: addr.applicantId,
          province: addr.province,
          regency: addr.regency,
          district: addr.district,
          village: addr.village,
          fullAddress: addr.fullAddress,
          postalCode: addr.postalCode,
          addressType: addr.addressType,
          createdAt: this.toISOString(addr.createdAt),
          updatedAt: this.toISOString(addr.updatedAt),
          deletedAt: this.toISOString(addr.deletedAt) || null
        })) || [],
        educations: application.applicant.educations?.map(edu => ({
          id: edu.id,
          applicantId: edu.applicantId,
          schoolName: edu.schoolName,
          major: edu.major,
          degree: edu.degree,
          gpa: edu.gpa,
          startMonth: edu.startMonth,
          endMonth: edu.endMonth,
          diplomaFileName: edu.diplomaFileName,
          order: edu.order,
          createdAt: this.toISOString(edu.createdAt),
          updatedAt: this.toISOString(edu.updatedAt),
          deletedAt: this.toISOString(edu.deletedAt) || null
        })) || [],
        jobHistories: application.applicant.jobHistories?.map(job => ({
          id: job.id,
          applicantId: job.applicantId,
          position: job.position,
          employeeStatus: job.employeeStatus as string | null,
          company: job.company,
          startDate: job.startDate,
          endDate: job.endDate,
          location: job.location,
          description: job.description,
          achievements: job.achievements,
          order: job.order,
          createdAt: this.toISOString(job.createdAt),
          updatedAt: this.toISOString(job.updatedAt),
          deletedAt: this.toISOString(job.deletedAt) || null
        })) || [],
        // Add comparison-specific data
        progress,
        info
      } as any;
    });

    return candidates;
  }

  /**
   * Get hiring progress data for comparison
   * Follows Single Responsibility Principle - focused only on progress data transformation
   */
  private getHiringProgressForComparison(application: any, activities: any[]): any {
    const pipeline = application.pipeline;
    const stages = pipeline?.stages || [];
    
    // Default stages if no pipeline exists
    const defaultStages = [
      { id: 'applied', name: 'Applied', order: 1 },
      { id: 'screening', name: 'Screening CV', order: 2 },
      { id: 'interview', name: 'Interview', order: 3 },
      { id: 'offering', name: 'Offering', order: 4 },
      { id: 'hired', name: 'Hired', order: 5 }
    ];
    
    // Use pipeline stages or default stages
    const availableStages = stages.length > 0 ? stages : defaultStages;
    
    // Sort stages by order
    const sortedStages = availableStages.sort((a, b) => a.order - b.order);
    
    // Helper function to get stage name
    const getStageName = (stage: any) => {
      if (!stage) return 'Unknown';
      return stage.stageTemplate?.name || stage.name || 'Unknown';
    };
    
    // Get current stage index
    const currentStageName = getStageName(application.currentStage);
    const currentStageIndex = sortedStages.findIndex(stage => 
      getStageName(stage) === currentStageName
    );
    
    // Get upcoming stage
    const upcomingStage = currentStageIndex < sortedStages.length - 1 
      ? getStageName(sortedStages[currentStageIndex + 1])
      : null;
    
    // Build stages array with status
    const stagesWithStatus = sortedStages.map((stage, index) => {
      const stageName = getStageName(stage);
      
      // Find activities for this specific stage using stageId (like in getApplicationTracking)
      const stageActivities = activities.filter(activity => 
        activity && activity.stageId === stage.id
      );
      
      // Get the latest activity for this stage
      const latestActivity = stageActivities.length > 0 
        ? stageActivities[stageActivities.length - 1] 
        : null;
      
      return {
        title: stageName,
        date: latestActivity?.createdAt ? this.toISOString(latestActivity.createdAt) : undefined,
        status: latestActivity?.status as StageActivityStatus,
        score: latestActivity?.score,
        notes: latestActivity?.notes
      };
    });
    
    return {
      currentStage: currentStageName,
      upcomingStage,
      overallScore: application.currentScore || 0,
      stages: stagesWithStatus
    };
  }

  /**
   * Get detailed info for comparison
   * Follows Single Responsibility Principle - focused only on info data transformation
   */
  private getDetailedInfoForComparison(application: any): any {
    const applicant = application.applicant;
    
    return {
      contact: {
        email: applicant.email,
        phone: applicant.phone,
        socialLinks: [
          ...(applicant.linkedinUrl ? [{
            platform: 'LinkedIn',
            username: applicant.linkedinUrl,
            url: applicant.linkedinUrl,
            icon: 'ri:linkedin-fill'
          }] : []),
          ...(applicant.portfolioUrl ? [{
            platform: 'Portfolio',
            username: applicant.portfolioUrl,
            url: applicant.portfolioUrl,
            icon: 'ri:links-line'
          }] : []),
          ...(applicant.socialMediaUrl ? [{
            platform: 'Social',
            username: applicant.socialMediaUrl,
            url: applicant.socialMediaUrl,
            icon: 'ri:links-line'
          }] : [])
        ]
      },
      personalDetails: {
        gender: applicant.gender,
        birthPlace: applicant.placeOfBirth,
        birthDate: applicant.dateOfBirth ? this.toISOString(applicant.dateOfBirth) : undefined,
        address: applicant.addresses?.[0]?.fullAddress,
        availability: applicant.availability
      },
      education: applicant.educations?.[0] ? {
        year: applicant.educations[0].endMonth ? applicant.educations[0].endMonth.split('-')[0] : undefined,
        degree: applicant.educations[0].degree,
        gpa: applicant.educations[0].gpa?.toString(),
        institution: applicant.educations[0].schoolName,
        startDate: applicant.educations[0].startMonth,
        endDate: applicant.educations[0].endMonth,
        certificateUrl: applicant.educations[0].diplomaFileName
      } : undefined,
      jobHistory: applicant.jobHistories?.[0] ? {
        status: applicant.jobHistories[0].employeeStatus,
        position: applicant.jobHistories[0].position,
        company: applicant.jobHistories[0].company,
        startDate: applicant.jobHistories[0].startDate ? this.toISOString(applicant.jobHistories[0].startDate) : undefined,
        endDate: applicant.jobHistories[0].endDate ? this.toISOString(applicant.jobHistories[0].endDate) : undefined,
        duration: this.calculateDuration(applicant.jobHistories[0].startDate, applicant.jobHistories[0].endDate)
      } : undefined,
      cvUrl: applicant.cvUrl
    };
  }

  /**
   * Calculate duration between two dates
   * Follows Single Responsibility Principle - focused only on date calculation
   */
  private calculateDuration(startDate: Date, endDate?: Date): string {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return months > 0 ? `${years} years ${months} months` : `${years} years`;
    } else {
      return months > 0 ? `${months} months` : 'Less than a month';
    }
  }
}