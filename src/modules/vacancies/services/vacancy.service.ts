import {
  Injectable,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan, FindOptionsWhere } from "typeorm";
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

  /**
   * Create a new vacancy with only title validation and automatic pipeline creation
   * @param createVacancyDto - Vacancy data with title
   * @param createdById - ID of the user creating the vacancy
   * @returns Created vacancy with pipeline
   */
  async create(
    createVacancyDto: CreateVacancyDto,
    createdById: string
  ): Promise<VacancyResponseDto> {
    try {
      // Get the default template pipeline
      const defaultTemplate =
        await this.recruitmentPipelineService.getDefaultTemplate();

      if (!defaultTemplate) {
        throw new BadRequestException(
          "No default template pipeline found. Please ensure a default template is configured."
        );
      }

      // Create a new pipeline instance from the default template
      const pipelineInstance =
        await this.recruitmentPipelineService.createFromTemplate(
          defaultTemplate.id,
          createdById,
          `${createVacancyDto.title} - Pipeline`
        );

      // Create vacancy with minimal required fields and pipeline reference
      const vacancy = this.vacancyRepository.create({
        title: createVacancyDto.title,
        status: JobStatus.DRAFT,
        jobType: JobType.RECRUITMENT, // Default value
        employmentType: EmploymentType.FULL_TIME, // Default value
        workModel: WorkModel.ON_SITE, // Default value
        currency: "IDR", // Default currency
        pipelineId: pipelineInstance.id, // Link to the created pipeline
        createdById
      });

      const savedVacancy = await this.vacancyRepository.save(vacancy);

      return this.mapToResponseDto(savedVacancy);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create vacancy: ${error.message}`
      );
    }
  }

  /**
   * Update vacancy with detailed information
   * @param id - Vacancy ID
   * @param updateVacancyDto - Updated vacancy data
   * @param updatedById - ID of the user updating the vacancy
   * @returns Updated vacancy
   */
  async update(
    id: string,
    updateVacancyDto: UpdateVacancyDto,
    updatedById: string
  ): Promise<VacancyResponseDto> {
    // Find existing vacancy
    const existingVacancy = await this.vacancyRepository.findOne({
      where: { id }
    });

    if (!existingVacancy) {
      throw new NotFoundException(`Vacancy with ID ${id} not found`);
    }

    // Validate input data
    this.validateUpdateData(updateVacancyDto);

    // Prepare update data
    const updateData = this.prepareUpdateData(updateVacancyDto, updatedById);

    // Update vacancy
    await this.vacancyRepository.update(id, updateData);

    // Fetch updated vacancy
    const updatedVacancy = await this.vacancyRepository.findOne({
      where: { id }
    });

    if (!updatedVacancy) {
      throw new NotFoundException(
        `Vacancy with ID ${id} not found after update`
      );
    }

    return this.mapToResponseDto(updatedVacancy);
  }

  /**
   * Get vacancy by ID with all relations needed for edit form
   * @param id - Vacancy ID
   * @returns Vacancy details with all necessary relations
   */
  async findOne(id: string): Promise<VacancyResponseDto> {
    const vacancy = await this.vacancyRepository.findOne({
      where: { id },
      relations: ["pipeline", "jobCategory"]
    });

    if (!vacancy) {
      throw new NotFoundException(`Vacancy with ID ${id} not found`);
    }

    return this.mapToResponseDto(vacancy);
  }

  /**
   * Get all job vacancies with pagination and applicant counts
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @param jobCategory - Filter by job category ID (optional)
   * @param status - Filter by job status (optional)
   * @param search - Search in title, description, and department (optional)
   * @returns Paginated job vacancies with applicant statistics
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    jobCategory?: string,
    status?: string,
    search?: string
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
    // Build query builder for complex filtering
    const queryBuilder = this.vacancyRepository
      .createQueryBuilder("vacancy")
      .where("vacancy.deletedAt IS NULL");

    // Apply filters
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
        "(vacancy.title ILIKE :search OR vacancy.description ILIKE :search OR vacancy.department ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Apply pagination and ordering
    queryBuilder
      .orderBy("vacancy.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    // Get total count for pagination
    const totalQueryBuilder = this.vacancyRepository
      .createQueryBuilder("vacancy")
      .where("vacancy.deletedAt IS NULL");

    if (jobCategory) {
      totalQueryBuilder.andWhere("vacancy.jobCategoryId = :jobCategory", {
        jobCategory
      });
    }

    if (status) {
      totalQueryBuilder.andWhere("vacancy.status = :status", { status });
    }

    if (search) {
      totalQueryBuilder.andWhere(
        "(vacancy.title ILIKE :search OR vacancy.description ILIKE :search OR vacancy.department ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    const [vacancies, total] = await Promise.all([
      queryBuilder.getMany(),
      totalQueryBuilder.getCount()
    ]);

    const totalPages = Math.ceil(total / limit);

    // Get applicant counts for each vacancy
    const vacanciesWithCounts = await Promise.all(
      vacancies.map(async (vacancy) => {
        const [totalApplicants, rejectedApplicants] = await Promise.all([
          this.applicationRepository.count({
            where: { vacancyId: vacancy.id }
          }),
          this.applicationRepository.count({
            where: {
              vacancyId: vacancy.id,
              status: ApplicantStatus.REJECTED
            }
          })
        ]);
        const hiredApplicants = totalApplicants - rejectedApplicants;

        return {
          ...this.mapToResponseDto(vacancy),
          totalApplicants,
          hiredApplicants,
          rejectedApplicants
        };
      })
    );

    return {
      data: vacanciesWithCounts,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Soft delete vacancy
   * @param id - Vacancy ID
   * @param deletedById - ID of the user deleting the vacancy
   */
  async remove(id: string, deletedById: string): Promise<void> {
    const vacancy = await this.vacancyRepository.findOne({
      where: { id }
    });

    if (!vacancy) {
      throw new NotFoundException(`Vacancy with ID ${id} not found`);
    }

    await this.vacancyRepository.softDelete(id);
    await this.vacancyRepository.update(id, { deletedById });
  }

  /**
   * Validate update data
   * @param updateVacancyDto - Update data to validate
   */
  private validateUpdateData(updateVacancyDto: UpdateVacancyDto): void {
    // Validate pipeline exists if provided
    if (updateVacancyDto.pipelineId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(updateVacancyDto.pipelineId)) {
        throw new BadRequestException("Invalid pipeline ID format");
      }
    }

    // Validate salary range
    if (updateVacancyDto.salaryMin && updateVacancyDto.salaryMax) {
      if (updateVacancyDto.salaryMin > updateVacancyDto.salaryMax) {
        throw new BadRequestException(
          "Minimum salary cannot be greater than maximum salary"
        );
      }
    }
  }

  /**
   * Prepare update data from DTO
   * @param updateVacancyDto - Update DTO
   * @param updatedById - User ID
   * @returns Prepared update data
   */
  private prepareUpdateData(
    updateVacancyDto: UpdateVacancyDto,
    updatedById: string
  ): Partial<Vacancy> {
    const updateData: Partial<Vacancy> = { updatedById };

    // Map string fields
    const stringFields = [
      "title",
      "description",
      "responsibilities",
      "requirements",
      "status",
      "jobType",
      "employmentType",
      "workModel",
      "salaryPeriod",
      "currency",
      "departmentId",
      "requiredEducation",
      "pipelineId",
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

    // Map number fields
    const numberFields = [
      "applicantLimit",
      "hiredLimit",
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

    // Map array fields
    if ((updateVacancyDto as any).officeAddresses !== undefined) {
      updateData.officeAddresses = (updateVacancyDto as any).officeAddresses;
    }

    // Map poster configuration
    if (updateVacancyDto.posterConfiguration !== undefined) {
      updateData.posterConfiguration = updateVacancyDto.posterConfiguration;
    }

    // Convert date strings to Date objects
    const dateFields = [
      "applicationDeadline",
      "expectedStartDate",
      "publishedAt",
      "archivedAt",
      "closedAt"
    ];

    dateFields.forEach((field) => {
      if (updateVacancyDto[field]) {
        updateData[field] = new Date(updateVacancyDto[field]);
      }
    });

    return updateData;
  }

  /**
   * Map entity to response DTO
   * @param vacancy - Vacancy entity
   * @returns Vacancy response DTO
   */
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
      isLimitApplicantEnabled: vacancy.isLimitApplicantEnabled,
      applicantLimit: vacancy.applicantLimit,
      isLimitHiredEnabled: vacancy.isLimitHiredEnabled,
      hiredLimit: vacancy.hiredLimit,
      officeAddresses: vacancy.officeAddresses,
      department: vacancy.department?.name || "",
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
      posterConfiguration: vacancy.posterConfiguration,
      applicationDeadline: vacancy.endDate,
      expectedStartDate: vacancy.startDate,
      publishedAt: vacancy.createdAt,
      archivedAt: vacancy.deletedAt,
      closedAt: vacancy.endDate
    };
  }

  /**
   * Get all public job vacancies with pagination (only PUBLISHED status)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @param jobCategory - Filter by job category ID (optional)
   * @returns Paginated public job vacancies
   */
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
    // Build where condition for public (only PUBLISHED and not expired)
    const whereCondition: FindOptionsWhere<Vacancy> = {
      status: JobStatus.PUBLISHED,
      endDate: MoreThan(new Date())
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

  /**
   * Get public vacancy by ID (only PUBLISHED status)
   * @param id - Vacancy ID
   * @returns Public vacancy details
   */
  async findOnePublic(id: string): Promise<PublicVacancyResponseDto> {
    const vacancy = await this.vacancyRepository.findOne({
      where: {
        id,
        status: JobStatus.PUBLISHED,
        endDate: MoreThan(new Date())
      },
      relations: ["jobCategory"]
    });

    if (!vacancy) {
      throw new NotFoundException(`Public vacancy with ID ${id} not found`);
    }

    return this.mapToPublicResponseDto(vacancy);
  }

  /**
   * Parse date string safely
   * @param dateString - Date string to parse
   * @returns Date object or undefined if invalid
   */
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

  /**
   * Convert frontend poster config arrays to backend boolean object structure
   * @param posterConfig - Frontend poster config with arrays
   * @returns Backend poster config with boolean objects
   */
  private convertPosterConfig(posterConfig: any): any {
    if (!posterConfig) return undefined;

    // Helper function to check if a value is in an array or is a boolean
    const isEnabled = (section: any, key: string, arrayKey?: string) => {
      if (Array.isArray(section)) {
        return section.includes(arrayKey || key);
      }
      if (typeof section === "object" && section !== null) {
        return section[key] === true;
      }
      return false;
    };

    return {
      jobDetails: {
        dueDate: isEnabled(posterConfig.jobDetails, "dueDate", "due-date"),
        jobTitle: isEnabled(posterConfig.jobDetails, "jobTitle", "job-title"),
        jobType: isEnabled(posterConfig.jobDetails, "jobType", "job-type"),
        applicantLimit: isEnabled(
          posterConfig.jobDetails,
          "applicantLimit",
          "limit-applicants"
        )
      },
      employmentDetails: {
        employmentType: isEnabled(
          posterConfig.employmentDetails,
          "employmentType",
          "employment-type"
        ),
        category: isEnabled(
          posterConfig.employmentDetails,
          "category",
          "category"
        ),
        education: isEnabled(
          posterConfig.employmentDetails,
          "education",
          "education"
        ),
        experience: isEnabled(
          posterConfig.employmentDetails,
          "experience",
          "experience"
        )
      },
      jobOverview: {
        description: isEnabled(
          posterConfig.jobOverview,
          "description",
          "description"
        ),
        responsibilities: isEnabled(
          posterConfig.jobOverview,
          "responsibilities",
          "responsibilities"
        ),
        requirements: isEnabled(
          posterConfig.jobOverview,
          "requirements",
          "requirements"
        )
      },
      locations: {
        locations:
          typeof posterConfig.locations === "boolean"
            ? posterConfig.locations
            : false
      },
      workModel: {
        workModel:
          typeof posterConfig.workModel === "boolean"
            ? posterConfig.workModel
            : false
      },
      salary: {
        salary:
          typeof posterConfig.salary === "boolean" ? posterConfig.salary : false
      }
    };
  }

  /**
   * Map frontend JobFormData to Vacancy entity
   * @param jobFormData - Data from frontend form
   * @param updatedById - ID of the user updating the vacancy
   * @returns Mapped vacancy data
   */
  private mapJobFormDataToVacancy(
    jobFormData: any,
    updatedById: string
  ): Partial<Vacancy> {
    return {
      title: jobFormData.jobTitle,
      jobCode: jobFormData.jobCode,
      description: jobFormData.description,
      responsibilities: jobFormData.responsibilities,
      requirements: jobFormData.requirements,
      jobType: jobFormData.jobType,
      employmentType: jobFormData.employeeType,
      startDate: jobFormData.startDate
        ? this.parseDate(jobFormData.startDate)
        : undefined,
      endDate: jobFormData.endDate
        ? this.parseDate(jobFormData.endDate)
        : undefined,
      isLimitApplicantEnabled: jobFormData.isLimitApplicantEnabled || false,
      applicantLimit: jobFormData.limitApplicant,
      isLimitHiredEnabled: jobFormData.isLimitHiredEnabled || false,
      hiredLimit: jobFormData.limitHired,
      officeAddresses: jobFormData.officeAddresses || [],
      workModel: jobFormData.workModel,
      departmentId: jobFormData.department,
      salaryMin: jobFormData.minSalary
        ? parseInt(jobFormData.minSalary)
        : undefined,
      salaryMax: jobFormData.maxSalary
        ? parseInt(jobFormData.maxSalary)
        : undefined,
      salaryPeriod:
        jobFormData.salaryPeriod && jobFormData.salaryPeriod.trim() !== ""
          ? jobFormData.salaryPeriod
          : null,
      currency: jobFormData.currency,
      requiredEducation:
        jobFormData.levelEducation && jobFormData.levelEducation.trim() !== ""
          ? jobFormData.levelEducation
          : null,
      requiredExperienceYears: jobFormData.yearOfExperience
        ? parseInt(jobFormData.yearOfExperience)
        : undefined,
      hoursPerWeekMin: jobFormData.minHourPerWeek
        ? parseInt(jobFormData.minHourPerWeek)
        : undefined,
      hoursPerWeekMax: jobFormData.maxHourPerWeek
        ? parseInt(jobFormData.maxHourPerWeek)
        : undefined,
      posterConfiguration: this.convertPosterConfig(jobFormData.posterConfig),
      pipelineId: jobFormData.pipelineId,
      jobCategoryId:
        jobFormData.jobCategory && jobFormData.jobCategory.trim() !== ""
          ? jobFormData.jobCategory
          : null,
      updatedById
    };
  }

  /**
   * Update vacancy from job form data
   * @param id - Vacancy ID
   * @param jobFormData - Data from frontend form
   * @param updatedById - ID of the user updating the vacancy
   * @returns Updated vacancy
   */
  async updateFromJobForm(
    id: string,
    jobFormData: any,
    updatedById: string
  ): Promise<VacancyResponseDto> {
    const vacancy = await this.findOne(id);
    if (!vacancy) {
      throw new NotFoundException(`Vacancy with ID ${id} not found`);
    }

    const updateData = this.mapJobFormDataToVacancy(jobFormData, updatedById);

    await this.vacancyRepository.update(id, updateData);
    const updatedVacancy = await this.vacancyRepository.findOne({
      where: { id },
      relations: ["pipeline", "jobCategory", "applications"]
    });

    if (!updatedVacancy) {
      throw new NotFoundException(`Vacancy with ID ${id} not found`);
    }

    return this.mapToResponseDto(updatedVacancy);
  }

  /**
   * Map vacancy entity to public response DTO
   * @param vacancy - Vacancy entity
   * @returns Public vacancy response DTO
   */
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
      applicationDeadline: vacancy.endDate, // Updated to use endDate
      expectedStartDate: vacancy.startDate, // Updated to use startDate
      requiredEducation: vacancy.requiredEducation,
      requiredExperienceYears: vacancy.requiredExperienceYears,
      jobCategory: {
        id: vacancy.jobCategory.id,
        name: vacancy.jobCategory.name
      },
      generatedPosterUrl: vacancy.generatedPosterUrl,
      status: vacancy.status,
      startDate: vacancy.startDate,
      endDate: vacancy.endDate,
      posterConfiguration: vacancy.posterConfiguration
    };
  }
}
