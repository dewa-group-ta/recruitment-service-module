import { CreateVacancyDto } from "../../modules/vacancies/dto/create-vacancy.dto";
import { UpdateVacancyDto } from "../../modules/vacancies/dto/update-vacancy.dto";
import { VacancyResponseDto } from "../../modules/vacancies/dto/vacancy-response.dto";
import { PublicVacancyResponseDto } from "../../modules/vacancies/dto/public-vacancy-response.dto";
import { Vacancy } from "../../modules/vacancies/entities/vacancy.entity";
import { JobStatus } from "../enums/job-status.enum";

/**
 * Interface for vacancy service operations
 * Defines the contract for vacancy-related business logic
 */
export interface IVacancyService {
  /**
   * Create a new vacancy
   * @param createVacancyDto - Vacancy creation data
   * @param createdById - ID of the user creating the vacancy
   * @returns Promise<VacancyResponseDto> - Created vacancy
   * @throws BadRequestException - When validation fails
   * @throws NotFoundException - When default template not found
   */
  create(
    createVacancyDto: CreateVacancyDto,
    createdById: string
  ): Promise<VacancyResponseDto>;

  /**
   * Update vacancy with detailed information
   * @param id - Vacancy ID
   * @param updateVacancyDto - Updated vacancy data
   * @param updatedById - ID of the user updating the vacancy
   * @returns Promise<VacancyResponseDto> - Updated vacancy
   * @throws NotFoundException - When vacancy not found
   * @throws BadRequestException - When validation fails
   */
  update(
    id: string,
    updateVacancyDto: UpdateVacancyDto,
    updatedById: string
  ): Promise<VacancyResponseDto>;

  /**
   * Get vacancy by ID
   * @param id - Vacancy ID
   * @returns Promise<VacancyResponseDto> - Vacancy details
   * @throws NotFoundException - When vacancy not found
   */
  findById(id: string): Promise<VacancyResponseDto>;

  /**
   * Get all vacancies with pagination and filtering
   * @param page - Page number
   * @param limit - Items per page
   * @param status - Filter by status
   * @param departmentId - Filter by department
   * @returns Promise<{data: VacancyResponseDto[], total: number}> - Paginated vacancies
   */
  findAll(
    page: number,
    limit: number,
    status?: JobStatus,
    departmentId?: string
  ): Promise<{ data: VacancyResponseDto[]; total: number }>;

  /**
   * Get public vacancies (for job seekers)
   * @param page - Page number
   * @param limit - Items per page
   * @param search - Search term
   * @param departmentId - Filter by department
   * @returns Promise<{data: PublicVacancyResponseDto[], total: number}> - Paginated public vacancies
   */
  findPublicVacancies(
    page: number,
    limit: number,
    search?: string,
    departmentId?: string
  ): Promise<{ data: PublicVacancyResponseDto[]; total: number }>;

  /**
   * Update vacancy status
   * @param id - Vacancy ID
   * @param status - New status
   * @param updatedById - ID of the user updating the status
   * @returns Promise<VacancyResponseDto> - Updated vacancy
   * @throws NotFoundException - When vacancy not found
   * @throws BadRequestException - When status transition is invalid
   */
  updateStatus(
    id: string,
    status: JobStatus,
    updatedById: string
  ): Promise<VacancyResponseDto>;

  /**
   * Delete vacancy (soft delete)
   * @param id - Vacancy ID
   * @param deletedById - ID of the user deleting the vacancy
   * @returns Promise<boolean> - Success status
   * @throws NotFoundException - When vacancy not found
   */
  delete(id: string, deletedById: string): Promise<boolean>;

  /**
   * Get vacancy statistics
   * @param id - Vacancy ID
   * @returns Promise<{totalApplications: number, hiredCount: number, pendingCount: number}> - Statistics
   * @throws NotFoundException - When vacancy not found
   */
  getStatistics(id: string): Promise<{
    totalApplications: number;
    hiredCount: number;
    pendingCount: number;
  }>;
}

/**
 * Interface for vacancy repository operations
 * Defines the contract for data access layer
 */
export interface IVacancyRepository {
  /**
   * Find vacancy by ID
   * @param id - Vacancy ID
   * @returns Promise<Vacancy | null> - Vacancy or null if not found
   */
  findById(id: string): Promise<Vacancy | null>;

  /**
   * Find vacancy by ID with relations
   * @param id - Vacancy ID
   * @param relations - Relations to include
   * @returns Promise<Vacancy | null> - Vacancy with relations or null if not found
   */
  findByIdWithRelations(
    id: string,
    relations: string[]
  ): Promise<Vacancy | null>;

  /**
   * Create new vacancy
   * @param vacancy - Vacancy data
   * @returns Promise<Vacancy> - Created vacancy
   */
  create(vacancy: Partial<Vacancy>): Promise<Vacancy>;

  /**
   * Update vacancy
   * @param id - Vacancy ID
   * @param updateData - Update data
   * @returns Promise<Vacancy> - Updated vacancy
   */
  update(id: string, updateData: Partial<Vacancy>): Promise<Vacancy>;

  /**
   * Find vacancies with pagination and filtering
   * @param page - Page number
   * @param limit - Items per page
   * @param filters - Filter criteria
   * @returns Promise<{data: Vacancy[], total: number}> - Paginated vacancies
   */
  findWithPagination(
    page: number,
    limit: number,
    filters: {
      status?: JobStatus;
      departmentId?: string;
      search?: string;
    }
  ): Promise<{ data: Vacancy[]; total: number }>;

  /**
   * Find active public vacancies
   * @param page - Page number
   * @param limit - Items per page
   * @param search - Search term
   * @param departmentId - Filter by department
   * @returns Promise<{data: Vacancy[], total: number}> - Paginated public vacancies
   */
  findPublicVacancies(
    page: number,
    limit: number,
    search?: string,
    departmentId?: string
  ): Promise<{ data: Vacancy[]; total: number }>;

  /**
   * Delete vacancy (soft delete)
   * @param id - Vacancy ID
   * @returns Promise<boolean> - Success status
   */
  delete(id: string): Promise<boolean>;

  /**
   * Count applications for vacancy
   * @param vacancyId - Vacancy ID
   * @returns Promise<number> - Application count
   */
  countApplications(vacancyId: string): Promise<number>;

  /**
   * Count hired applicants for vacancy
   * @param vacancyId - Vacancy ID
   * @returns Promise<number> - Hired count
   */
  countHiredApplicants(vacancyId: string): Promise<number>;
}
