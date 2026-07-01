import {
  Injectable,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Not } from "typeorm";
import { Vacancy } from "../entities/vacancy.entity";
import { CreateVacancyDto } from "../dto/create-vacancy.dto";
import { UpdateVacancyDto } from "../dto/update-vacancy.dto";
import { VacancyResponseDto } from "../dto/vacancy-response.dto";
import { PublicVacancyResponseDto } from "../dto/public-vacancy-response.dto";
import {
  JobStatus,
  EmploymentType,
  WorkModel,
  JobType
} from "../../../shared/enums/job-status.enum";
import { Application } from "../../applicants/entities/application.entity";
import { ApplicantStatus } from "../../../shared/enums/applicant.enum";
import { RecruitmentPipelineService } from "./recruitment-pipeline.service";

@Injectable()
export class VacancyService {
  constructor(
    @InjectRepository(Vacancy)
    private readonly vacancyRepository: Repository<Vacancy>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly recruitmentPipelineService: RecruitmentPipelineService
  ) {}

  async create(
    createVacancyDto: CreateVacancyDto,
    createdById: string
  ): Promise<VacancyResponseDto> {
    try {
      const defaultTemplate =
        await this.recruitmentPipelineService.getDefaultTemplate();

      if (!defaultTemplate) {
        throw new BadRequestException(
          "No default template pipeline found. Please ensure a default template is configured."
        );
      }

      const pipelineInstance =
        await this.recruitmentPipelineService.createFromTemplate(
          defaultTemplate.id,
          createdById,
          `${createVacancyDto.title} - Pipeline`
        );

      const vacancy = this.vacancyRepository.create({
        title: createVacancyDto.title,
        status: JobStatus.DRAFT,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.ON_SITE,
        currency: "IDR",
        pipelineId: pipelineInstance.id,
        createdById,
        isLimitApplicantEnabled: false,
        isLimitHiredEnabled: false
      });

      const savedVacancy = await this.vacancyRepository.save(vacancy);

      // Reload with relations so department name resolves in the response
      const vacancyWithRelations = await this.vacancyRepository.findOne({
        where: { id: savedVacancy.id },
        relations: ["department", "pipeline", "jobCategory"]
      });

      return this.mapToResponseDto(vacancyWithRelations!);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to create vacancy: ${msg}`);
    }
  }

  async update(
    id: string,
    updateVacancyDto: UpdateVacancyDto,
    updatedById: string
  ): Promise<VacancyResponseDto> {
    const existingVacancy = await this.vacancyRepository.findOne({
      where: { id }
    });

    if (!existingVacancy) {
      throw new NotFoundException(`Vacancy with ID ${id} not found`);
    }

    if (existingVacancy.status !== JobStatus.DRAFT) {
      throw new BadRequestException('Only draft vacancies can be edited');
    }

    this.validateUpdateData(updateVacancyDto);

    const updateData = this.prepareUpdateData(updateVacancyDto, updatedById);

    await this.vacancyRepository.update(id, updateData);

    // Reload with relations so mapToResponseDto can resolve department name etc.
    const updatedVacancy = await this.vacancyRepository.findOne({
      where: { id },
      relations: ["department", "pipeline", "jobCategory"]
    });

    if (!updatedVacancy) {
      throw new NotFoundException(
        `Vacancy with ID ${id} not found after update`
      );
    }

    return this.mapToResponseDto(updatedVacancy);
  }

  async findOne(id: string): Promise<VacancyResponseDto> {
    const vacancy = await this.vacancyRepository.findOne({
      where: { id },
      relations: ["department", "pipeline", "jobCategory"]
    });

    if (!vacancy) {
      throw new NotFoundException(`Vacancy with ID ${id} not found`);
    }

    return this.mapToResponseDto(vacancy);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    jobCategory?: string,
    status?: string,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    data: (VacancyResponseDto & {
      totalApplicants: number;
      hiredApplicants: number;
      rejectedApplicants: number;
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.vacancyRepository
      .createQueryBuilder("vacancy")
      .where("vacancy.deletedAt IS NULL");

    if (jobCategory) {
      queryBuilder.andWhere("vacancy.jobCategoryId = :jobCategory", {
        jobCategory
      });
    }

    if (status) {
      queryBuilder.andWhere("vacancy.status = :status", { status });
    }

    if (search) {
      queryBuilder.andWhere(
        "(vacancy.title ILIKE :search OR vacancy.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (startDate) {
      queryBuilder.andWhere("vacancy.startDate >= :startDate", { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere("vacancy.endDate <= :endDate", { endDate });
    }

    const countBuilder = queryBuilder.clone();

    queryBuilder
      .leftJoinAndSelect("vacancy.department", "department")
      .leftJoinAndSelect("vacancy.pipeline", "pipeline")
      .leftJoinAndSelect("vacancy.jobCategory", "jobCategory")
      .orderBy("vacancy.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [vacancies, total] = await Promise.all([
      queryBuilder.getMany(),
      countBuilder.getCount()
    ]);

    const totalPages = Math.ceil(total / limit);

    // Single query for all applicant counts — avoids N+1
    const vacancyIds = vacancies.map((v) => v.id);
    const countMap = await this.getApplicantCountsForVacancies(vacancyIds);

    const vacanciesWithCounts = vacancies.map((vacancy) => {
      const counts = countMap[vacancy.id] ?? {
        totalApplicants: 0,
        hiredApplicants: 0,
        rejectedApplicants: 0
      };
      return {
        ...this.mapToResponseDto(vacancy),
        ...counts
      };
    });

    return {
      data: vacanciesWithCounts,
      total,
      page,
      limit,
      totalPages
    };
  }

  async remove(id: string, deletedById: string): Promise<void> {
    const vacancy = await this.vacancyRepository.findOne({
      where: { id }
    });

    if (!vacancy) {
      throw new NotFoundException(`Vacancy with ID ${id} not found`);
    }

    if (vacancy.status !== JobStatus.DRAFT) {
      throw new BadRequestException('Only draft vacancies can be deleted');
    }

    await this.vacancyRepository.softDelete(id);
    await this.vacancyRepository.update(id, { deletedById });
  }

  async publishVacancy(id: string, updatedById: string): Promise<VacancyResponseDto> {
    const preCheck = await this.vacancyRepository.findOne({ where: { id } });
    if (!preCheck) throw new NotFoundException(`Vacancy with ID ${id} not found`);
    if (!preCheck.jobCode) {
      throw new BadRequestException('Job code is required before publishing a vacancy');
    }

    const result = await this.vacancyRepository.update(
      { id, status: JobStatus.DRAFT },
      { status: JobStatus.PUBLISHED, updatedById }
    );

    if (result.affected === 0) {
      throw new BadRequestException('Only draft vacancies can be published');
    }

    return this.mapToResponseDto(
      (await this.vacancyRepository.findOne({
        where: { id }, relations: ['department', 'pipeline', 'jobCategory']
      }))!
    );
  }

  async unpublishVacancy(id: string, updatedById: string): Promise<VacancyResponseDto> {
    const result = await this.vacancyRepository.update(
      { id, status: JobStatus.PUBLISHED },
      { status: JobStatus.DRAFT, updatedById }
    );

    if (result.affected === 0) {
      const vacancy = await this.vacancyRepository.findOne({ where: { id } });
      if (!vacancy) throw new NotFoundException(`Vacancy with ID ${id} not found`);
      throw new BadRequestException('Only published vacancies can be unpublished');
    }

    return this.mapToResponseDto(
      (await this.vacancyRepository.findOne({
        where: { id }, relations: ['department', 'pipeline', 'jobCategory']
      }))!
    );
  }

  async closeVacancy(id: string, updatedById: string): Promise<VacancyResponseDto> {
    const result = await this.vacancyRepository.update(
      { id, status: JobStatus.PUBLISHED },
      { status: JobStatus.CLOSED, updatedById }
    );

    if (result.affected === 0) {
      const vacancy = await this.vacancyRepository.findOne({ where: { id } });
      if (!vacancy) throw new NotFoundException(`Vacancy with ID ${id} not found`);
      throw new BadRequestException('Only published vacancies can be closed');
    }

    return this.mapToResponseDto(
      (await this.vacancyRepository.findOne({
        where: { id }, relations: ['department', 'pipeline', 'jobCategory']
      }))!
    );
  }

  async reopenVacancy(id: string, updatedById: string): Promise<VacancyResponseDto> {
    const result = await this.vacancyRepository.update(
      { id, status: JobStatus.CLOSED },
      { status: JobStatus.PUBLISHED, updatedById }
    );

    if (result.affected === 0) {
      const vacancy = await this.vacancyRepository.findOne({ where: { id } });
      if (!vacancy) throw new NotFoundException(`Vacancy with ID ${id} not found`);
      throw new BadRequestException('Only closed vacancies can be reopened');
    }

    return this.mapToResponseDto(
      (await this.vacancyRepository.findOne({
        where: { id }, relations: ['department', 'pipeline', 'jobCategory']
      }))!
    );
  }

  async archiveVacancy(id: string, updatedById: string): Promise<VacancyResponseDto> {
    const result = await this.vacancyRepository.update(
      { id, status: Not(JobStatus.ARCHIVED) },
      { status: JobStatus.ARCHIVED, updatedById }
    );

    if (result.affected === 0) {
      const vacancy = await this.vacancyRepository.findOne({ where: { id } });
      if (!vacancy) throw new NotFoundException(`Vacancy with ID ${id} not found`);
      throw new BadRequestException('Vacancy is already archived');
    }

    return this.mapToResponseDto(
      (await this.vacancyRepository.findOne({
        where: { id }, relations: ['department', 'pipeline', 'jobCategory']
      }))!
    );
  }

  async findAllPublic(
    page: number = 1,
    limit: number = 10,
    jobCategory?: string
  ): Promise<{
    data: PublicVacancyResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const whereCondition: FindOptionsWhere<Vacancy> = {
      status: JobStatus.PUBLISHED
    };

    if (jobCategory) {
      whereCondition.jobCategoryId = jobCategory;
    }

    const [vacancies, total] = await this.vacancyRepository.findAndCount({
      select: {
        id: true,
        title: true,
        description: true,
        responsibilities: true,
        requirements: true,
        jobType: true,
        employmentType: true,
        workModel: true,
        startDate: true,
        endDate: true,
        officeAddresses: true,
        createdAt: true,
        status: true,
        posterConfiguration: true,
        requiredEducation: true,
        requiredExperienceYears: true,
        generatedPosterUrl: true,
        jobCategory: {
          id: true,
          name: true
        }
      },
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
      relations: ["jobCategory"]
    });

    const totalPages = Math.ceil(total / limit);

    const data = vacancies.map((vacancy) =>
      this.mapToPublicResponseDto(vacancy)
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }

  async findOnePublic(id: string): Promise<PublicVacancyResponseDto> {
    const vacancy = await this.vacancyRepository.findOne({
      where: {
        id,
        status: JobStatus.PUBLISHED
      },
      relations: ["jobCategory"]
    });

    if (!vacancy) {
      throw new NotFoundException(`Public vacancy with ID ${id} not found`);
    }

    return this.mapToPublicResponseDto(vacancy);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private validateUpdateData(updateVacancyDto: UpdateVacancyDto): void {
    if (updateVacancyDto.pipelineId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(updateVacancyDto.pipelineId)) {
        throw new BadRequestException("Invalid pipeline ID format");
      }
    }

    if (updateVacancyDto.salaryMin && updateVacancyDto.salaryMax) {
      if (updateVacancyDto.salaryMin > updateVacancyDto.salaryMax) {
        throw new BadRequestException(
          "Minimum salary cannot be greater than maximum salary"
        );
      }
    }

    if (
      updateVacancyDto.startDate &&
      updateVacancyDto.endDate &&
      new Date(updateVacancyDto.startDate) > new Date(updateVacancyDto.endDate)
    ) {
      throw new BadRequestException(
        "Start date cannot be after end date"
      );
    }
  }

  private prepareUpdateData(
    updateVacancyDto: UpdateVacancyDto,
    updatedById: string
  ): Partial<Vacancy> {
    const updateData: Partial<Vacancy> = { updatedById };

    const stringFields = [
      "title",
      "jobCode",
      "description",
      "responsibilities",
      "requirements",
      "jobType",
      "employmentType",
      "workModel",
      "currency",
      "departmentId",
      "pipelineId",
      "jobCategoryId",
      "generatedPosterUrl"
    ];

    stringFields.forEach((field) => {
      if (
        updateVacancyDto[field] !== undefined &&
        updateVacancyDto[field] !== null
      ) {
        updateData[field] = updateVacancyDto[field];
      }
    });

    // salaryPeriod and requiredEducation can be explicitly set to null to clear them.
    // Cast through any because Partial<Vacancy> uses undefined but TypeORM accepts null for nullable columns.
    if (updateVacancyDto.salaryPeriod !== undefined) {
      (updateData as any).salaryPeriod = updateVacancyDto.salaryPeriod ?? null;
    }
    if (updateVacancyDto.requiredEducation !== undefined) {
      (updateData as any).requiredEducation = updateVacancyDto.requiredEducation ?? null;
    }

    const numberFields = [
      "salaryMin",
      "salaryMax",
      "requiredExperienceYears",
      "hoursPerWeekMin",
      "hoursPerWeekMax"
    ];

    numberFields.forEach((field) => {
      if (updateVacancyDto[field] !== undefined) {
        updateData[field] = updateVacancyDto[field];
      }
    });

    // Quota constraints disabled — applicantLimit, hiredLimit, isLimitApplicantEnabled, isLimitHiredEnabled always set to null/false
    updateData.isLimitApplicantEnabled = false;
    (updateData as any).applicantLimit = null;
    updateData.isLimitHiredEnabled = false;
    (updateData as any).hiredLimit = null;

    if (updateVacancyDto.officeAddresses !== undefined) {
      updateData.officeAddresses = updateVacancyDto.officeAddresses;
    }

    if (updateVacancyDto.posterConfiguration !== undefined) {
      updateData.posterConfiguration = updateVacancyDto.posterConfiguration;
    }

    // Real date columns — stored directly on the entity
    if (updateVacancyDto.startDate) {
      const d = this.parseDate(updateVacancyDto.startDate);
      if (d) updateData.startDate = d;
    }
    if (updateVacancyDto.endDate) {
      const d = this.parseDate(updateVacancyDto.endDate);
      if (d) updateData.endDate = d;
    }

    return updateData;
  }

  private mapToResponseDto(vacancy: Vacancy): VacancyResponseDto {
    return {
      id: vacancy.id,
      title: vacancy.title,
      jobCode: vacancy.jobCode,
      description: vacancy.description,
      responsibilities: vacancy.responsibilities,
      requirements: vacancy.requirements,
      status: vacancy.status,
      jobType: vacancy.jobType,
      employmentType: vacancy.employmentType,
      workModel: vacancy.workModel,
      startDate: vacancy.startDate,
      endDate: vacancy.endDate,
      isLimitApplicantEnabled: false,
      applicantLimit: null as any,
      isLimitHiredEnabled: false,
      hiredLimit: null as any,
      officeAddresses: vacancy.officeAddresses,
      department: vacancy.department?.name ?? null,
      departmentId: vacancy.departmentId,
      salaryMin: vacancy.salaryMin,
      salaryMax: vacancy.salaryMax,
      salaryPeriod: vacancy.salaryPeriod,
      currency: vacancy.currency,
      jobCategoryId: vacancy.jobCategoryId,
      requiredEducation: vacancy.requiredEducation,
      requiredExperienceYears: vacancy.requiredExperienceYears,
      hoursPerWeekMin: vacancy.hoursPerWeekMin,
      hoursPerWeekMax: vacancy.hoursPerWeekMax,
      pipelineId: vacancy.pipelineId,
      createdById: vacancy.createdById,
      updatedById: vacancy.updatedById,
      createdAt: vacancy.createdAt,
      updatedAt: vacancy.updatedAt,
      generatedPosterUrl: vacancy.generatedPosterUrl,
      posterConfiguration: vacancy.posterConfiguration
    };
  }

  private mapToPublicResponseDto(vacancy: Vacancy): PublicVacancyResponseDto {
    return {
      id: vacancy.id,
      title: vacancy.title,
      description: vacancy.description,
      responsibilities: vacancy.responsibilities,
      requirements: vacancy.requirements,
      jobType: vacancy.jobType,
      employmentType: vacancy.employmentType,
      workModel: vacancy.workModel,
      officeAddresses: vacancy.officeAddresses || [],
      applicationDeadline: vacancy.endDate,
      expectedStartDate: vacancy.startDate,
      requiredEducation: vacancy.requiredEducation,
      requiredExperienceYears: vacancy.requiredExperienceYears,
      jobCategory: vacancy.jobCategory
        ? { id: vacancy.jobCategory.id, name: vacancy.jobCategory.name }
        : { id: "", name: "" },
      generatedPosterUrl: vacancy.generatedPosterUrl,
      status: vacancy.status,
      startDate: vacancy.startDate,
      endDate: vacancy.endDate,
      posterConfiguration: vacancy.posterConfiguration
    };
  }

  /**
   * Retrieve totalApplicants, hiredApplicants, and rejectedApplicants for a
   * set of vacancy IDs in a single aggregated query — avoids N+1.
   */
  private async getApplicantCountsForVacancies(
    vacancyIds: string[]
  ): Promise<
    Record<
      string,
      {
        totalApplicants: number;
        hiredApplicants: number;
        rejectedApplicants: number;
      }
    >
  > {
    if (vacancyIds.length === 0) return {};

    const rows = await this.applicationRepository
      .createQueryBuilder("app")
      .select("app.vacancyId", "vacancyId")
      .addSelect("COUNT(*)", "total")
      .addSelect(
        `SUM(CASE WHEN app.status = '${ApplicantStatus.HIRED}' THEN 1 ELSE 0 END)`,
        "hired"
      )
      .addSelect(
        `SUM(CASE WHEN app.status = '${ApplicantStatus.REJECTED}' THEN 1 ELSE 0 END)`,
        "rejected"
      )
      .where("app.vacancyId IN (:...vacancyIds)", { vacancyIds })
      .groupBy("app.vacancyId")
      .getRawMany();

    const result: Record<
      string,
      {
        totalApplicants: number;
        hiredApplicants: number;
        rejectedApplicants: number;
      }
    > = {};

    for (const row of rows) {
      result[row.vacancyId] = {
        totalApplicants: Number(row.total),
        hiredApplicants: Number(row.hired),
        rejectedApplicants: Number(row.rejected)
      };
    }

    return result;
  }

  private parseDate(dateString: string): Date | undefined {
    if (
      !dateString ||
      dateString === "undefined" ||
      dateString.includes("NaN")
    ) {
      return undefined;
    }

    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  }

}
