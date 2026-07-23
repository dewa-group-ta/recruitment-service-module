import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger
} from "@nestjs/common";
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
import { File, FileType } from "../../../shared/entities/file.entity";
import {
  ApplicantTableQueryDto,
  ApplicantSummaryQueryDto
} from "../dto/applicant-table-query.dto";
import {
  ApplicantTableItemDto,
  ApplicantSummaryDataDto
} from "../dto/applicant-table-response.dto";
import { CreateApplicationNotesDto } from "../../applicants/dto/create-application-notes.dto";
import { UpdateApplicationNotesDto } from "../../applicants/dto/update-application-notes.dto";
import { ApplicationNotesResponseDto } from "../../applicants/dto/application-notes-response.dto";
import { QueryApplicationNotesDto } from "../../applicants/dto/query-application-notes.dto";
import { HiringProgressDto } from "../dto/hiring-progress.dto";
import { JobStatus } from "src/shared/enums/job-status.enum";
import { StageActivityStatus } from "src/shared/enums/pipeline.enum";
import { NotificationService } from "../../../shared/services/notification.service";
import { MinioService } from "../../../shared/services/minio.service";

export interface ScoringBreakdown {
  educations: Array<{
    level: number | null;
    major: string | null;
    institution: string | null;
  }>;
  experiences: Array<{
    role: string | null;
    description: string | null;
    start: string | null;
    end: string | null;
    durationYears: number | null;
    similarity: number | null;
    isTopMatch: boolean;
  }>;
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
  // data pribadi
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
    requiredEducation?: string | null;
    requiredExperienceYears?: number | null;
    responsibilities?: string | null;
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
    schoolName: string | null;
    major: string | null;
    degree: string | null;
    gpa?: number | null;
    startMonth: string | null;
    endMonth?: string | null;
    diplomaFileName?: string | null;
    level?: string | null;
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
    startDate: string | null;
    endDate?: string | null;
    location?: string | null;
    description?: string | null;
    achievements?: string | null;
    durationYears?: number | null;
    order: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }>;

  evaluationResult?: {
    maxExperienceScore: number | null;
    decision: string | null;
    evaluatedAt: Date | null;
    errorMessage: string | null;
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
  private readonly logger = new Logger(CandidatesService.name);

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
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly minioService: MinioService
  ) {}

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

    if (status) {
      // frontend pakai istilah "qualified"/"disqualified", backend pakai enum status "hired"/"rejected"
      let mappedStatus = status;
      if (status === "qualified") {
        mappedStatus = "hired";
      } else if (status === "disqualified") {
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

    const total = await queryBuilder.getCount();

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    queryBuilder.orderBy("application.appliedAt", "DESC");

    const applications = await queryBuilder.getMany();

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
      address: app.applicant.addresses?.map((addr) => ({
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
      vacancy: app.vacancy
        ? {
            id: app.vacancy.id,
            title: app.vacancy.title,
            status: app.vacancy.status,
            department: app.vacancy.department?.name,
            workLocation: app.vacancy.officeAddresses?.[0]
          }
        : undefined
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

    return Array.from(stageMap.entries()).map(([stage, candidates]) => ({
      stage,
      candidates
    }));
  }

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
      byStage: {} as Record<string, number>
    };

    applications.forEach((app) => {
      const status = app.status;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      const stage = app.currentStage?.stageTemplate?.name || "Applied";
      stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;
    });

    return stats;
  }

  private getEducationLevel(educations: any[]): string {
    if (!educations || educations.length === 0) return "Not specified";

    const levels = educations.map(
      (edu) => edu.degree || edu.level || "Unknown"
    );
    return levels[0] || "Not specified";
  }

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
      sortBy = "applyDate",
      sortOrder = "desc"
    } = query;

    const queryBuilder = this.applicationRepository
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.applicant", "applicant")
      .leftJoinAndSelect("application.vacancy", "vacancy")
      .leftJoinAndSelect("application.currentStage", "currentStage")
      .leftJoinAndSelect("currentStage.stageTemplate", "stageTemplate");

    if (search) {
      queryBuilder.andWhere(
        "(applicant.fullName ILIKE :search OR applicant.email ILIKE :search OR vacancy.title ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (status && status.length > 0) {
      const statusConditions = status.map((s, index) => {
        if (s === "talent-pool") {
          return `application.isTalentPool = true`;
        }
        return `application.status = :status${index}`;
      });

      queryBuilder.andWhere(`(${statusConditions.join(" OR ")})`);
      status.forEach((s, index) => {
        if (s !== "talent-pool") {
          queryBuilder.setParameter(`status${index}`, s);
        }
      });
    }

    if (jobStatus && jobStatus.length > 0) {
      queryBuilder.andWhere("vacancy.status IN (:...jobStatus)", { jobStatus });
    }

    if (stage && stage.length > 0) {
      queryBuilder.andWhere("currentStage.id IN (:...stage)", { stage });
    }

    if (vacancyId) {
      queryBuilder.andWhere("application.vacancyId = :vacancyId", {
        vacancyId
      });
    }

    const sortField = this.getSortField(sortBy);
    if (sortBy === "maxExperienceScore") {
      // sort by wsm maxExperienceScore dari evaluation_results (nullable → NULLS LAST)
      queryBuilder
        .leftJoin(
          EvaluationResult,
          "evalSort",
          "evalSort.applicationId = application.id"
        )
        .addSelect(
          "evalSort.maxExperienceScore",
          "evalSort_max_experience_score"
        )
        .orderBy(
          "evalSort.maxExperienceScore",
          sortOrder.toUpperCase() as "ASC" | "DESC",
          "NULLS LAST"
        );
    } else {
      queryBuilder.orderBy(
        sortField!,
        sortOrder.toUpperCase() as "ASC" | "DESC"
      );
    }

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const totalQuery = queryBuilder.clone();
    const total = await totalQuery.getCount();

    const applications = await queryBuilder.getMany();

    // batch-fetch evaluation results untuk semua application sekaligus (1 query),
    // lebih efisien daripada n+1 query per application
    const applicationIds = applications.map((a) => a.id);
    const evalResults =
      applicationIds.length > 0
        ? await this.evaluationResultRepository.find({
            where: { applicationId: In(applicationIds) },
            select: ["applicationId", "maxExperienceScore"]
          })
        : [];
    const evalMap = new Map<string, number | null>(
      evalResults.map((e) => [e.applicationId, e.maxExperienceScore ?? null])
    );

    // transfpac ke dto — inject maxExperienceScore dari wsm scoring
    const transformed = applications.map((app) => ({
      ...this.transformToApplicantTableItem(app),
      maxExperienceScore: evalMap.get(app.id) ?? null
    }));

    // konversi path file avatar ke url minio publik secara paralel
    const data: ApplicantTableItemDto[] = await Promise.all(
      transformed.map(async (item) => ({
        ...item,
        avatar: item.avatar
          ? await this.minioService
              .getFileUrl(item.avatar)
              .catch(() => undefined)
          : undefined
      }))
    );

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

  async getApplicantsSummary(
    query: ApplicantSummaryQueryDto
  ): Promise<ApplicantSummaryDataDto> {
    const { status, jobStatus, stage, vacancyId, dateFrom, dateTo } = query;

    const queryBuilder = this.applicationRepository
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.applicant", "applicant")
      .leftJoinAndSelect("application.vacancy", "vacancy")
      .leftJoinAndSelect("application.currentStage", "currentStage")
      .leftJoinAndSelect("currentStage.stageTemplate", "stageTemplate");

    if (status && status.length > 0) {
      const statusConditions = status.map((s, index) => {
        if (s === "talent-pool") {
          return `application.isTalentPool = true`;
        }
        return `application.status = :status${index}`;
      });

      queryBuilder.andWhere(`(${statusConditions.join(" OR ")})`);
      status.forEach((s, index) => {
        if (s !== "talent-pool") {
          queryBuilder.setParameter(`status${index}`, s);
        }
      });
    }

    if (jobStatus && jobStatus.length > 0) {
      queryBuilder.andWhere("vacancy.status IN (:...jobStatus)", { jobStatus });
    }

    if (stage && stage.length > 0) {
      queryBuilder.andWhere("currentStage.id IN (:...stage)", { stage });
    }

    if (vacancyId) {
      queryBuilder.andWhere("application.vacancyId = :vacancyId", {
        vacancyId
      });
    }

    if (dateFrom) {
      queryBuilder.andWhere("application.appliedAt >= :dateFrom", { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere("application.appliedAt <= :dateTo", { dateTo });
    }

    const applications = await queryBuilder.getMany();

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

    applications.forEach((app) => {
      if (app.status === "applied") byStatus.new++;
      else if (app.status === ApplicantStatus.HIRED) byStatus.qualified++;
      else if (app.status === ApplicantStatus.REJECTED) byStatus.disqualified++;

      if (app.isTalentPool) byStatus.talentPool++;

      const stageName = app.currentStage?.stageTemplate?.name || "Unknown";
      byStage[stageName] = (byStage[stageName] || 0) + 1;

      const jobStatus = app.vacancy?.status;
      if (jobStatus === JobStatus.PUBLISHED) byJobStatus.published++;
      else if (jobStatus === JobStatus.DRAFT) byJobStatus.draft++;
      else if (jobStatus === JobStatus.CLOSED) byJobStatus.closed++;
      else if (jobStatus === JobStatus.ARCHIVED) byJobStatus.archived++;

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

  private transformToApplicantTableItem(
    application: any
  ): ApplicantTableItemDto {
    const applicant = application.applicant;
    const vacancy = application.vacancy;
    const currentStage = application.currentStage;

    const calculateAge = (
      dateOfBirth: Date | string | null | undefined
    ): number | undefined => {
      if (!dateOfBirth) return undefined;

      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    };

    const age = calculateAge(applicant.dateOfBirth);

    const status = application.status;
    const isTalentPool = application.isTalentPool;

    return {
      id: application.id,
      applicationId: application.id,
      applicantId: applicant.id,
      name: applicant.fullName,
      email: applicant.email,
      phone: applicant.phone || "",
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
      currentStage: currentStage?.stageTemplate?.name || "Applied",
      currentScore: application.currentScore || undefined,
      isTalentPool,
      applyDate: application.appliedAt
        ? new Date(application.appliedAt).toISOString()
        : new Date().toISOString(),
      lastActivityAt: application.lastActivityAt
        ? new Date(application.lastActivityAt).toISOString()
        : undefined,
      source: application.source || undefined,
      expectedStartDate: application.expectedStartDate
        ? new Date(application.expectedStartDate).toISOString()
        : undefined,
      coverLetter: application.coverLetter || undefined
    };
  }

  // maxExperienceScore ditangani khusus di getApplicantsTable (butuh LEFT JOIN ke evaluation_results), bukan kolom langsung
  private getSortField(sortBy: string): string | null {
    const sortFields: Record<string, string> = {
      name: "applicant.fullName",
      applyDate: "application.appliedAt",
      currentScore: "application.currentScore",
      stage: "stageTemplate.name"
    };
    if (sortBy === "maxExperienceScore") return null;
    return sortFields[sortBy] ?? "application.appliedAt";
  }

  // parse evaluateDetail jadi ScoringBreakdown dengan array yang dijamin non-null,
  // supaya data binding di frontend selalu punya educations & experiences
  private parseEvaluateDetail(
    evalResult: EvaluationResult | null
  ): ScoringBreakdown {
    const emptyBreakdown: ScoringBreakdown = {
      experiences: [],
      educations: []
    };

    if (!evalResult?.evaluateDetail) return emptyBreakdown;

    try {
      const detail: Record<string, any> =
        typeof evalResult.evaluateDetail === "string"
          ? JSON.parse(evalResult.evaluateDetail)
          : evalResult.evaluateDetail;

      if (!detail) return emptyBreakdown;

      const maxScore = evalResult.maxExperienceScore ?? null;

      // 1. parse experiences dengan null handling yang aman
      const experienceEntries: ScoringBreakdown["experiences"] = (
        Array.isArray(detail.experience) ? detail.experience : []
      ).map((e: any) => ({
        role: e?.role ?? null,
        description: e?.description ?? null,
        start: e?.start ?? null,
        end: e?.end ?? null,
        durationYears: e?.duration_years ?? null,
        similarity: typeof e?.similarity === "number" ? e.similarity : null,
        isTopMatch:
          maxScore !== null &&
          typeof e?.similarity === "number" &&
          e.similarity === maxScore
      }));

      // 2. parse educations dengan null handling yang aman
      const educationEntries: ScoringBreakdown["educations"] = (
        Array.isArray(detail.educations) ? detail.educations : []
      ).map((e: any) => ({
        level: typeof e?.level === "number" ? e.level : null,
        major: e?.major ?? null,
        institution: e?.institution ?? null
      }));

      return {
        experiences: experienceEntries,
        educations: educationEntries
      };
    } catch (error) {
      this.logger.error(`Failed to parse evaluateDetail: ${error}`);
      return emptyBreakdown;
    }
  }

  // jaminan: evaluationResult SELALU ada (dibuat saat submit application),
  // scoringBreakdown.educations & experiences SELALU array (tidak pernah null/undefined),
  // update scoring terjadi async tanpa blocking response.
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
      throw new NotFoundException(
        `Application with ID ${applicationId} not found`
      );
    }

    // dijamin ada (dibuat saat submit application di quickApply step 4i)
    const evalResult = await this.evaluationResultRepository.findOne({
      where: { applicationId }
    });

    const scoringBreakdown = this.parseEvaluateDetail(evalResult);

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
      avatar: application.applicant.photoUrl
        ? await this.minioService
            .getFileUrl(application.applicant.photoUrl)
            .catch(() => undefined)
        : undefined,
      education: this.getEducationLevel(application.applicant.educations),
      experience: this.getExperienceLevel(application.applicant.jobHistories),
      coverLetter: application.coverLetter,
      expectedStartDate: application.expectedStartDate
        ? this.toISOString(application.expectedStartDate)
        : undefined,
      source: application.source,
      gender: application.applicant.gender,
      placeOfBirth: application.applicant.placeOfBirth,
      dateOfBirth: application.applicant.dateOfBirth,
      availability: application.applicant.availability,
      linkedinUrl: application.applicant.linkedinUrl,
      portfolioUrl: application.applicant.portfolioUrl,
      socialMediaUrl: application.applicant.socialMediaUrl,
      cvUrl: await (async () => {
        const cvFile = await this.fileRepository.findOne({
          where: { relatedEntityId: application.id, fileType: FileType.CV },
          order: { createdAt: "DESC" }
        });
        if (!cvFile) return undefined;
        return this.minioService
          .getFileUrl(cvFile.filePath)
          .catch(() => undefined);
      })(),
      isTalentPool: application.isTalentPool,
      vacancy: application.vacancy
        ? {
            id: application.vacancy.id,
            title: application.vacancy.title,
            status: application.vacancy.status,
            department: application.vacancy.department?.name,
            workLocation: application.vacancy.officeAddresses?.[0],
            requiredEducation: application.vacancy.requiredEducation ?? null,
            requiredExperienceYears:
              application.vacancy.requiredExperienceYears ?? null,
            responsibilities: application.vacancy.responsibilities ?? null
          }
        : undefined,
      addresses:
        application.applicant.addresses?.map((addr) => ({
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
        })) ?? [],
      educations:
        application.applicant.educations?.map((edu) => ({
          id: edu.id,
          applicantId: edu.applicantId,
          schoolName: edu.schoolName,
          degree: edu.degree,
          major: edu.major,
          gpa: edu.gpa,
          startMonth: edu.startMonth,
          endMonth: edu.endMonth,
          diplomaFileName: edu.diplomaFileName,
          level: edu.level,
          order: edu.order,
          createdAt: this.toISOString(edu.createdAt),
          updatedAt: this.toISOString(edu.updatedAt),
          deletedAt: this.toISOString(edu.deletedAt) || null
        })) ?? [],
      jobHistories:
        application.applicant.jobHistories?.map((job) => ({
          id: job.id,
          applicantId: job.applicantId,
          position: job.position,
          company: job.company,
          employeeStatus: job.employeeStatus,
          startDate: job.startDate ? this.toISOString(job.startDate) : null,
          endDate: job.endDate ? this.toISOString(job.endDate) : null,
          location: job.location,
          description: job.description,
          achievements: job.achievements,
          durationYears: job.durationYears,
          order: job.order,
          createdAt: this.toISOString(job.createdAt),
          updatedAt: this.toISOString(job.updatedAt),
          deletedAt: this.toISOString(job.deletedAt) || null
        })) ?? [],
      // dijamin ada dan strukturnya konsisten
      evaluationResult: {
        maxExperienceScore: evalResult?.maxExperienceScore ?? null,
        decision:
          typeof evalResult?.decision === "string"
            ? evalResult.decision
            : evalResult?.decision != null
              ? String(evalResult.decision)
              : null,
        evaluatedAt: evalResult?.evaluatedAt ?? null,
        errorMessage: evalResult?.errorMessage ?? null,
        scoringBreakdown
      }
    };
  }

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
        pipeline: {
          stages: {
            stageOrder: "ASC"
          }
        }
      }
    });

    if (!application) {
      throw new NotFoundException(
        `Application with ID ${applicationId} not found`
      );
    }

    const pipeline = application.pipeline;
    const stages = pipeline?.stages || [];
    const activities = application.activities || [];

    // default stages kalau tidak ada pipeline
    const defaultStages = [
      { id: "applied", name: "Applied", order: 1 },
      { id: "screening", name: "Screening CV", order: 2 },
      { id: "interview", name: "Interview", order: 3 },
      { id: "offering", name: "Offering", order: 4 },
      { id: "hired", name: "Hired", order: 5 }
    ];

    const availableStages = stages.length > 0 ? stages : defaultStages;

    const getStageName = (stage: any) => {
      return stage.stageTemplate?.name || stage.name || "Unknown Stage";
    };

    const stageProgress = availableStages.map((stage) => {
      const activity = activities.find((act) => act.stage?.id === stage.id);

      return {
        title: getStageName(stage),
        date: activity?.createdAt
          ? this.toISOString(activity.createdAt)
          : undefined,
        status: (activity?.status ??
          StageActivityStatus.PENDING) as StageActivityStatus,
        score: activity?.score,
        notes: activity?.notes,
        canScore: stage.stageTemplate?.canScore || false
      };
    });

    const currentStageIndex = availableStages.findIndex(
      (stage) => stage.id === application.currentStage?.id
    );
    const currentStage =
      application.currentStage?.stageTemplate?.name || "Applied";
    const isDisqualified = application.status === ApplicantStatus.REJECTED;
    const upcomingStage = isDisqualified
      ? "Disqualified"
      : currentStageIndex !== -1 &&
          currentStageIndex < availableStages.length - 1
        ? getStageName(availableStages[currentStageIndex + 1])
        : "Completed";

    const currentStageCanScore =
      application.currentStage?.stageTemplate?.canScore || false;
    const upcomingStageCanScore =
      currentStageIndex < availableStages.length - 1
        ? (availableStages[currentStageIndex + 1] as any)?.stageTemplate
            ?.canScore || false
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

  async updateCandidateStatus(
    applicationId: string,
    status: string,
    notes?: string,
    score?: number
  ): Promise<Candidate> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: [
        "applicant",
        "vacancy",
        "currentStage",
        "currentStage.stageTemplate",
        "activities"
      ]
    });

    if (!application) {
      throw new NotFoundException(
        `Application with ID ${applicationId} not found`
      );
    }

    await this.dataSource.transaction(async (manager) => {
      // saat rejected, tandai stage activity yang sedang in-progress jadi failed
      if (status === ApplicantStatus.REJECTED && application.currentStageId) {
        const currentActivity = application.activities?.find(
          (act) =>
            act.stageId === application.currentStageId &&
            act.status === StageActivityStatus.IN_PROGRESS
        );
        if (currentActivity) {
          await manager.update(StageActivity, currentActivity.id, {
            status: StageActivityStatus.FAILED,
            notes: notes,
            score: score
          });
        }
      }

      await manager.update(Application, applicationId, {
        status: status as any,
        lastActivityAt: new Date()
      });
    });

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
            application_link: `${process.env.FRONTEND_URL || "http://localhost:3000"}/applicant/tracking/${applicationId}`,
            company_name: process.env.COMPANY_NAME || "Neuronworks",
            company_website:
              process.env.COMPANY_WEBSITE || "https://neuronworks.id"
          }
        );
      }
    } catch (error) {
      this.logger.error("Failed to send status update notification:", error);
    }

    return this.getCandidateDetail(applicationId);
  }

  async moveToNextStage(
    applicationId: string,
    notes?: string,
    score?: number
  ): Promise<Candidate> {
    // pakai transaksi db untuk menjamin atomicity
    return await this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, {
        where: { id: applicationId },
        relations: [
          "currentStage",
          "currentStage.stageTemplate",
          "pipeline",
          "pipeline.stages",
          "pipeline.stages.stageTemplate",
          "activities"
        ]
      });

      if (!application) {
        throw new NotFoundException(
          `Application with ID ${applicationId} not found`
        );
      }

      if (
        application.status === ApplicantStatus.HIRED ||
        application.status === ApplicantStatus.REJECTED
      ) {
        throw new BadRequestException(
          `Cannot move application in terminal state: ${application.status}`
        );
      }

      const currentStage = application.currentStage;
      if (!currentStage) {
        throw new BadRequestException(
          `Application has no current stage. Ensure applyForPosition was called first.`
        );
      }

      const stages = application.pipeline?.stages || [];
      const nextStage = stages.find(
        (stage) => stage.stageOrder > currentStage.stageOrder
      );
      if (!nextStage) {
        throw new NotFoundException(`Next stage not found`);
      }

      // skor stage selalu diberikan oleh hr — tidak ada scoring otomatis dari evaluation results
      const effectiveScore = score;

      const activityWithScore = application.activities.filter(
        (activity) => activity.score !== undefined && activity.score !== null
      );
      const currentScore = effectiveScore !== undefined ? effectiveScore : 0;

      const allScores = [
        ...activityWithScore.map((activity) =>
          parseFloat(activity.score?.toString() || "0")
        ),
        currentScore
      ];
      const totalScore = allScores.reduce((acc, s) => acc + s, 0);
      const overallScore =
        allScores.length > 0 ? totalScore / allScores.length : 0;

      const currentStageActivity = application.activities.find(
        (activity) => activity.stageId === currentStage?.id
      );
      if (currentStageActivity) {
        currentStageActivity.status = StageActivityStatus.DONE;
        currentStageActivity.score = effectiveScore;
        currentStageActivity.notes = notes;
        await manager.save(StageActivity, currentStageActivity);
      }

      const stageActivity = manager.create(StageActivity, {
        applicationId: applicationId,
        stageId: nextStage.id,
        status: StageActivityStatus.IN_PROGRESS,
        createdAt: new Date()
      });
      await manager.save(StageActivity, stageActivity);

      await manager.update(Application, applicationId, {
        currentStageId: nextStage.id,
        currentScore: parseFloat(overallScore.toFixed(2)),
        currentNotes: notes,
        lastActivityAt: new Date()
      });

      if (currentStage.sendNotification) {
        try {
          const applicationWithApplicant = await manager.findOne(Application, {
            where: { id: applicationId },
            relations: ["applicant", "vacancy"]
          });

          if (
            applicationWithApplicant?.applicant &&
            applicationWithApplicant?.vacancy
          ) {
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
                application_link: `${process.env.FRONTEND_URL || "http://localhost:3000"}/applicant/tracking/${applicationId}`,
                company_name: process.env.COMPANY_NAME || "Neuronworks",
                company_website:
                  process.env.COMPANY_WEBSITE || "https://neuronworks.id"
              }
            );
          }
        } catch (error) {
          // jangan gagalkan transaksi meski notifikasi gagal terkirim
          this.logger.error("Failed to send stage update notification:", error);
        }
      }

      return this.getCandidateDetail(applicationId);
    });
  }

  async updateTalentPoolStatus(
    applicationId: string,
    isTalentPool: boolean
  ): Promise<void> {
    await this.applicationRepository.update(applicationId, {
      isTalentPool
    });
  }

  private toISOString(date: any): string {
    if (!date) return "";
    if (date instanceof Date) return date.toISOString();
    if (typeof date === "string") return date;
    return "";
  }

  // ==================== method catatan aplikasi ====================

  async createApplicationNote(
    createDto: CreateApplicationNotesDto
  ): Promise<ApplicationNotesResponseDto> {
    const application = await this.applicationRepository.findOne({
      where: { id: createDto.applicationId }
    });

    if (!application) {
      throw new Error(
        `Application with ID ${createDto.applicationId} not found`
      );
    }

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
    const {
      page = 1,
      limit = 10,
      category,
      priority,
      isPrivate,
      createdBy,
      sort_by = "createdAt",
      order = "DESC"
    } = query;

    const queryBuilder = this.applicationNotesRepository
      .createQueryBuilder("notes")
      .where("notes.applicationId = :applicationId", { applicationId });

    if (category) {
      queryBuilder.andWhere("notes.category = :category", { category });
    }

    if (priority) {
      queryBuilder.andWhere("notes.priority = :priority", { priority });
    }

    if (typeof isPrivate === "boolean") {
      queryBuilder.andWhere("notes.isPrivate = :isPrivate", { isPrivate });
    }

    if (createdBy) {
      queryBuilder.andWhere("notes.createdBy = :createdBy", { createdBy });
    }

    queryBuilder.orderBy(
      `notes.${sort_by}`,
      order.toUpperCase() as "ASC" | "DESC"
    );

    const total = await queryBuilder.getCount();

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const notes = await queryBuilder.getMany();

    const data = notes.map((note) => this.transformToNotesResponseDto(note));

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

  async getApplicationNoteById(
    noteId: string
  ): Promise<ApplicationNotesResponseDto> {
    const note = await this.applicationNotesRepository.findOne({
      where: { id: noteId }
    });

    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    return this.transformToNotesResponseDto(note);
  }

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

    Object.assign(note, updateDto);
    const updatedNote = await this.applicationNotesRepository.save(note);

    return this.transformToNotesResponseDto(updatedNote);
  }

  async deleteApplicationNote(noteId: string): Promise<void> {
    const note = await this.applicationNotesRepository.findOne({
      where: { id: noteId }
    });

    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    await this.applicationNotesRepository.softDelete(noteId);
  }

  async getNotesForApplications(
    applicationIds: string[]
  ): Promise<Record<string, ApplicationNotesResponseDto[]>> {
    const notes = await this.applicationNotesRepository.find({
      where: applicationIds.map((id) => ({ applicationId: id })),
      order: { createdAt: "DESC" }
    });

    const notesByApplication: Record<string, ApplicationNotesResponseDto[]> =
      {};

    applicationIds.forEach((id) => {
      notesByApplication[id] = [];
    });

    notes.forEach((note) => {
      if (notesByApplication[note.applicationId]) {
        notesByApplication[note.applicationId].push(
          this.transformToNotesResponseDto(note)
        );
      }
    });

    return notesByApplication;
  }

  private transformToNotesResponseDto(
    note: ApplicationNotes
  ): ApplicationNotesResponseDto {
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

  async getCandidatesForComparison(
    applicationIds: string[]
  ): Promise<Candidate[]> {
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
        pipeline: {
          stages: {
            stageOrder: "ASC"
          }
        }
      }
    });

    if (applications.length === 0) {
      throw new Error("No applications found with the provided IDs");
    }

    const allActivities = await this.stageActivityRepository.find({
      where: { applicationId: In(applicationIds) },
      order: { createdAt: "ASC" }
    });

    const activitiesByApplication = allActivities.reduce(
      (acc, activity) => {
        if (!acc[activity.applicationId]) {
          acc[activity.applicationId] = [];
        }
        acc[activity.applicationId].push(activity);
        return acc;
      },
      {} as Record<string, any[]>
    );

    const candidates: Candidate[] = applications.map((application) => {
      const progress = this.getHiringProgressForComparison(
        application,
        activitiesByApplication[application.id] || []
      );

      const info = this.getDetailedInfoForComparison(application);

      return {
        id: application.applicant.id,
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        fullName: application.applicant.fullName,
        email: application.applicant.email,
        phone: application.applicant.phone,
        status: application.status,
        currentStage:
          application.currentStage?.stageTemplate?.name || "Applied",
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
        // data pribadi
        gender: application.applicant.gender,
        placeOfBirth: application.applicant.placeOfBirth,
        dateOfBirth: application.applicant.dateOfBirth,
        availability: application.applicant.availability,
        linkedinUrl: application.applicant.linkedinUrl,
        portfolioUrl: application.applicant.portfolioUrl,
        socialMediaUrl: application.applicant.socialMediaUrl,
        cvUrl: application.applicant.cvUrl,
        isTalentPool: application.isTalentPool,
        vacancy: application.vacancy
          ? {
              id: application.vacancy.id,
              title: application.vacancy.title,
              status: application.vacancy.status,
              department: application.vacancy.department?.name,
              workLocation: application.vacancy.officeAddresses?.[0]
            }
          : undefined,
        addresses:
          application.applicant.addresses?.map((addr) => ({
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
        educations:
          application.applicant.educations?.map((edu) => ({
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
        jobHistories:
          application.applicant.jobHistories?.map((job) => ({
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
        // data khusus untuk halaman comparison
        progress,
        info
      } as any;
    });

    return candidates;
  }

  private getHiringProgressForComparison(
    application: any,
    activities: any[]
  ): any {
    const pipeline = application.pipeline;
    const stages = pipeline?.stages || [];

    // default stages kalau tidak ada pipeline
    const defaultStages = [
      { id: "applied", name: "Applied", order: 1 },
      { id: "screening", name: "Screening CV", order: 2 },
      { id: "interview", name: "Interview", order: 3 },
      { id: "offering", name: "Offering", order: 4 },
      { id: "hired", name: "Hired", order: 5 }
    ];

    const availableStages = stages.length > 0 ? stages : defaultStages;
    const sortedStages = availableStages.sort((a, b) => a.order - b.order);

    const getStageName = (stage: any) => {
      if (!stage) return "Unknown";
      return stage.stageTemplate?.name || stage.name || "Unknown";
    };

    const currentStageName = getStageName(application.currentStage);
    const currentStageIndex = sortedStages.findIndex(
      (stage) => getStageName(stage) === currentStageName
    );

    const upcomingStage =
      currentStageIndex < sortedStages.length - 1
        ? getStageName(sortedStages[currentStageIndex + 1])
        : null;

    const stagesWithStatus = sortedStages.map((stage, index) => {
      const stageName = getStageName(stage);

      // cari activities untuk stage ini pakai stageId (pola sama seperti di getApplicationTracking)
      const stageActivities = activities.filter(
        (activity) => activity && activity.stageId === stage.id
      );

      const latestActivity =
        stageActivities.length > 0
          ? stageActivities[stageActivities.length - 1]
          : null;

      return {
        title: stageName,
        date: latestActivity?.createdAt
          ? this.toISOString(latestActivity.createdAt)
          : undefined,
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

  private getDetailedInfoForComparison(application: any): any {
    const applicant = application.applicant;

    return {
      contact: {
        email: applicant.email,
        phone: applicant.phone,
        socialLinks: [
          ...(applicant.linkedinUrl
            ? [
                {
                  platform: "LinkedIn",
                  username: applicant.linkedinUrl,
                  url: applicant.linkedinUrl,
                  icon: "ri:linkedin-fill"
                }
              ]
            : []),
          ...(applicant.portfolioUrl
            ? [
                {
                  platform: "Portfolio",
                  username: applicant.portfolioUrl,
                  url: applicant.portfolioUrl,
                  icon: "ri:links-line"
                }
              ]
            : []),
          ...(applicant.socialMediaUrl
            ? [
                {
                  platform: "Social",
                  username: applicant.socialMediaUrl,
                  url: applicant.socialMediaUrl,
                  icon: "ri:links-line"
                }
              ]
            : [])
        ]
      },
      personalDetails: {
        gender: applicant.gender,
        birthPlace: applicant.placeOfBirth,
        birthDate: applicant.dateOfBirth
          ? this.toISOString(applicant.dateOfBirth)
          : undefined,
        address: applicant.addresses?.[0]?.fullAddress,
        availability: applicant.availability
      },
      education: applicant.educations?.[0]
        ? {
            year: applicant.educations[0].endMonth
              ? applicant.educations[0].endMonth.split("-")[0]
              : undefined,
            degree: applicant.educations[0].degree,
            gpa: applicant.educations[0].gpa?.toString(),
            institution: applicant.educations[0].schoolName,
            startDate: applicant.educations[0].startMonth,
            endDate: applicant.educations[0].endMonth,
            certificateUrl: applicant.educations[0].diplomaFileName
          }
        : undefined,
      jobHistory: applicant.jobHistories?.[0]
        ? {
            status: applicant.jobHistories[0].employeeStatus,
            position: applicant.jobHistories[0].position,
            company: applicant.jobHistories[0].company,
            startDate: applicant.jobHistories[0].startDate
              ? this.toISOString(applicant.jobHistories[0].startDate)
              : undefined,
            endDate: applicant.jobHistories[0].endDate
              ? this.toISOString(applicant.jobHistories[0].endDate)
              : undefined,
            duration: this.calculateDuration(
              applicant.jobHistories[0].startDate,
              applicant.jobHistories[0].endDate
            )
          }
        : undefined,
      cvUrl: applicant.cvUrl
    };
  }

  private calculateDuration(startDate: Date, endDate?: Date): string {
    if (!startDate) return "";

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years > 0) {
      return months > 0 ? `${years} years ${months} months` : `${years} years`;
    } else {
      return months > 0 ? `${months} months` : "Less than a month";
    }
  }
}
