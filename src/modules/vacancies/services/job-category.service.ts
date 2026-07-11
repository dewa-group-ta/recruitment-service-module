import {
  Injectable,
  NotFoundException,
  ConflictException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { JobCategory } from "../entities/job-category.entity";
import { CreateJobCategoryDto } from "../dto/create-job-category.dto";
import { UpdateJobCategoryDto } from "../dto/update-job-category.dto";
import { JobCategoryResponseDto } from "../dto/job-category-response.dto";
import { Pagination } from "../../../shared/paginate/pagination";
import { JobStatus } from "src/shared/enums/job-status.enum";
import { QueryJobCategoryDto } from "../dto/query-job-category.dto";

@Injectable()
export class JobCategoryService {
  constructor(
    @InjectRepository(JobCategory)
    private readonly jobCategoryRepository: Repository<JobCategory>
  ) {}

  async create(
    createJobCategoryDto: CreateJobCategoryDto
  ): Promise<JobCategoryResponseDto> {
    const existingCategory = await this.jobCategoryRepository.findOne({
      where: { name: createJobCategoryDto.name },
      withDeleted: false
    });

    if (existingCategory) {
      throw new ConflictException("Job category with this name already exists");
    }

    if (createJobCategoryDto.code) {
      const existingCode = await this.jobCategoryRepository.findOne({
        where: { code: createJobCategoryDto.code },
        withDeleted: false
      });

      if (existingCode) {
        throw new ConflictException(
          "Job category with this code already exists"
        );
      }
    }

    const jobCategory = this.jobCategoryRepository.create({
      ...createJobCategoryDto,
      sortOrder: createJobCategoryDto.sortOrder ?? 0,
      isActive: createJobCategoryDto.isActive ?? true
    });

    const savedCategory = await this.jobCategoryRepository.save(jobCategory);
    return this.mapToResponseDto(savedCategory);
  }

  async findAll(
    paginationDto: QueryJobCategoryDto
  ): Promise<Pagination<JobCategoryResponseDto>> {
    const {
      page = 1,
      limit = 10,
      keyword: search,
      sort_by: sortBy = "sortOrder",
      order: sortOrder = "ASC",
      isActive = false
    } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.jobCategoryRepository
      .createQueryBuilder("jobCategory")
      .leftJoinAndSelect("jobCategory.vacancies", "vacancy")
      .where("jobCategory.deletedAt IS NULL");

    if (isActive) {
      queryBuilder.andWhere("jobCategory.isActive = :isActive", { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        "(jobCategory.name ILIKE :search OR jobCategory.description ILIKE :search OR jobCategory.code ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy(`jobCategory.${sortBy}`, sortOrder);

    queryBuilder.skip(skip).take(limit);

    const [categories, total] = await queryBuilder.getManyAndCount();

    const responseData = categories.map((category) =>
      this.mapToResponseDto(category)
    );

    return new Pagination({
      data: responseData,
      page,
      limit,
      total_items: total,
      total_pages: Math.ceil(total / limit)
    });
  }

  async findAllActive(): Promise<JobCategoryResponseDto[]> {
    const categories = await this.jobCategoryRepository.find({
      where: {
        isActive: true,
        vacancies: {
          status: JobStatus.PUBLISHED,
          endDate: MoreThan(new Date())
        }
      },
      order: { sortOrder: "ASC", name: "ASC" }
    });

    return categories.map((category) => this.mapToResponseDto(category));
  }

  async findOne(id: string): Promise<JobCategoryResponseDto> {
    const category = await this.jobCategoryRepository.findOne({
      where: { id },
      relations: ["vacancies"]
    });

    if (!category) {
      throw new NotFoundException("Job category not found");
    }

    return this.mapToResponseDto(category);
  }

  async update(
    id: string,
    updateJobCategoryDto: UpdateJobCategoryDto
  ): Promise<JobCategoryResponseDto> {
    const category = await this.jobCategoryRepository.findOne({
      where: { id },
      withDeleted: false
    });

    if (!category) {
      throw new NotFoundException("Job category not found");
    }

    if (
      updateJobCategoryDto.name &&
      updateJobCategoryDto.name !== category.name
    ) {
      const existingCategory = await this.jobCategoryRepository.findOne({
        where: { name: updateJobCategoryDto.name },
        withDeleted: false
      });

      if (existingCategory) {
        throw new ConflictException(
          "Job category with this name already exists"
        );
      }
    }

    if (
      updateJobCategoryDto.code &&
      updateJobCategoryDto.code !== category.code
    ) {
      const existingCode = await this.jobCategoryRepository.findOne({
        where: { code: updateJobCategoryDto.code },
        withDeleted: false
      });

      if (existingCode) {
        throw new ConflictException(
          "Job category with this code already exists"
        );
      }
    }

    Object.assign(category, updateJobCategoryDto);
    const updatedCategory = await this.jobCategoryRepository.save(category);

    return this.mapToResponseDto(updatedCategory);
  }

  async remove(id: string): Promise<void> {
    const category = await this.jobCategoryRepository.findOne({
      where: { id },
      withDeleted: false
    });

    if (!category) {
      throw new NotFoundException("Job category not found");
    }

    const activeVacancies = await this.jobCategoryRepository
      .createQueryBuilder("jobCategory")
      .leftJoin("jobCategory.vacancies", "vacancy")
      .where("jobCategory.id = :id", { id })
      .andWhere("vacancy.deletedAt IS NULL")
      .andWhere("vacancy.status IN (:...statuses)", {
        statuses: ["DRAFT", "PUBLISHED", "CLOSED"]
      })
      .getCount();

    if (activeVacancies > 0) {
      throw new ConflictException(
        "Cannot delete job category with active vacancies"
      );
    }

    await this.jobCategoryRepository.softDelete(id);
  }

  async restore(id: string): Promise<JobCategoryResponseDto> {
    const category = await this.jobCategoryRepository.findOne({
      where: { id },
      withDeleted: true
    });

    if (!category) {
      throw new NotFoundException("Job category not found");
    }

    if (!category.deletedAt) {
      throw new ConflictException("Job category is not deleted");
    }

    await this.jobCategoryRepository.restore(id);
    const restoredCategory = await this.jobCategoryRepository.findOne({
      where: { id },
      relations: ["vacancies"]
    });

    if (!restoredCategory) {
      throw new NotFoundException("Job category not found after restore");
    }

    return this.mapToResponseDto(restoredCategory);
  }

  private mapToResponseDto(category: JobCategory): JobCategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      code: category.code,
      color: category.color,
      icon: category.icon,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      createdById: category.createdById,
      updatedById: category.updatedById,
      vacancyCount: category.vacancies?.length || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
  }
}
