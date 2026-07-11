import { CreateVacancyDto } from "../../modules/vacancies/dto/create-vacancy.dto";
import { UpdateVacancyDto } from "../../modules/vacancies/dto/update-vacancy.dto";
import { VacancyResponseDto } from "../../modules/vacancies/dto/vacancy-response.dto";
import { PublicVacancyResponseDto } from "../../modules/vacancies/dto/public-vacancy-response.dto";
import { Vacancy } from "../../modules/vacancies/entities/vacancy.entity";
import { JobStatus } from "../enums/job-status.enum";

export interface IVacancyService {
  create(
    createVacancyDto: CreateVacancyDto,
    createdById: string
  ): Promise<VacancyResponseDto>;

  update(
    id: string,
    updateVacancyDto: UpdateVacancyDto,
    updatedById: string
  ): Promise<VacancyResponseDto>;

  findById(id: string): Promise<VacancyResponseDto>;

  findAll(
    page: number,
    limit: number,
    status?: JobStatus,
    departmentId?: string
  ): Promise<{ data: VacancyResponseDto[]; total: number }>;

  findPublicVacancies(
    page: number,
    limit: number,
    search?: string,
    departmentId?: string
  ): Promise<{ data: PublicVacancyResponseDto[]; total: number }>;

  updateStatus(
    id: string,
    status: JobStatus,
    updatedById: string
  ): Promise<VacancyResponseDto>;

  delete(id: string, deletedById: string): Promise<boolean>;

  getStatistics(id: string): Promise<{
    totalApplications: number;
    hiredCount: number;
    pendingCount: number;
  }>;
}

export interface IVacancyRepository {
  findById(id: string): Promise<Vacancy | null>;

  findByIdWithRelations(
    id: string,
    relations: string[]
  ): Promise<Vacancy | null>;

  create(vacancy: Partial<Vacancy>): Promise<Vacancy>;

  update(id: string, updateData: Partial<Vacancy>): Promise<Vacancy>;

  findWithPagination(
    page: number,
    limit: number,
    filters: {
      status?: JobStatus;
      departmentId?: string;
      search?: string;
    }
  ): Promise<{ data: Vacancy[]; total: number }>;

  findPublicVacancies(
    page: number,
    limit: number,
    search?: string,
    departmentId?: string
  ): Promise<{ data: Vacancy[]; total: number }>;

  delete(id: string): Promise<boolean>;

  countApplications(vacancyId: string): Promise<number>;

  countHiredApplicants(vacancyId: string): Promise<number>;
}
