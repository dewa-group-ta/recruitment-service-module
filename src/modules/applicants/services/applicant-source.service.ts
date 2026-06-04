import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, FindManyOptions, FindOptionsWhere } from "typeorm";
import { ApplicantSource } from "../entities/applicant-source.entity";
import { CreateApplicantSourceDto } from "../dto/create-applicant-source.dto";
import { UpdateApplicantSourceDto } from "../dto/update-applicant-source.dto";
import { QueryApplicantSourceDto } from "../dto/query-applicant-source.dto";
import { Pagination } from "src/shared/paginate";

@Injectable()
export class ApplicantSourceService {
  constructor(
    @InjectRepository(ApplicantSource)
    private readonly applicantSourceRepository: Repository<ApplicantSource>
  ) {}

  /**
   * Create a new applicant source
   */
  async create(
    createApplicantSourceDto: CreateApplicantSourceDto
  ): Promise<ApplicantSource> {
    const applicantSource = this.applicantSourceRepository.create(
      createApplicantSourceDto
    );
    return await this.applicantSourceRepository.save(applicantSource);
  }

  /**
   * Get all applicant sources
   */
  async findAll(): Promise<ApplicantSource[]> {
    return await this.applicantSourceRepository.find({
      order: { sortOrder: "ASC", name: "ASC" }
    });
  }

  /**
   * Get all active applicant sources
   */
  async findActive(): Promise<ApplicantSource[]> {
    return await this.applicantSourceRepository.find({
      where: { isActive: true },
      order: { sortOrder: "ASC", name: "ASC" }
    });
  }

  /**
   * Get applicant source by ID
   */
  async findOne(id: string): Promise<ApplicantSource> {
    const applicantSource = await this.applicantSourceRepository.findOne({
      where: { id }
    });

    if (!applicantSource) {
      throw new NotFoundException(`Applicant source with ID ${id} not found`);
    }

    return applicantSource;
  }

  /**
   * Update applicant source
   */
  async update(
    id: string,
    updateApplicantSourceDto: UpdateApplicantSourceDto
  ): Promise<ApplicantSource> {
    const applicantSource = await this.findOne(id);

    Object.assign(applicantSource, updateApplicantSourceDto);
    return await this.applicantSourceRepository.save(applicantSource);
  }

  /**
   * Soft delete applicant source
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists before deleting
    await this.applicantSourceRepository.softDelete(id);
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string): Promise<ApplicantSource> {
    const applicantSource = await this.findOne(id);
    applicantSource.isActive = !applicantSource.isActive;
    return await this.applicantSourceRepository.save(applicantSource);
  }

  /**
   * Find applicant sources with pagination and filtering
   */
  async findWithPagination(
    queryDto: QueryApplicantSourceDto
  ): Promise<Pagination<ApplicantSource>> {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = "sortOrder",
      sortOrder = "ASC"
    } = queryDto;

    const whereConditions: FindOptionsWhere<ApplicantSource> = {};

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    if (search) {
      whereConditions.name = Like(`%${search}%`);
    }

    const findOptions: FindManyOptions<ApplicantSource> = {
      where: whereConditions,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    };

    const [data, totalItems] =
      await this.applicantSourceRepository.findAndCount(findOptions);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages
      }
    };
  }

  /**
   * Get applicant source statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const [total, active] = await Promise.all([
      this.applicantSourceRepository.count(),
      this.applicantSourceRepository.count({ where: { isActive: true } })
    ]);

    return {
      total,
      active,
      inactive: total - active
    };
  }

  /**
   * Validates if custom source is required based on selected applicant sources
   * @param customSource The custom source value
   * @param applicantSourceIds Array of selected applicant source IDs
   * @returns Promise<boolean> True if validation passes, false otherwise
   */
  async validateCustomSource(
    customSource: string,
    applicantSourceIds: string[]
  ): Promise<boolean> {
    // If no applicant sources selected, custom source is not required
    if (!applicantSourceIds || applicantSourceIds.length === 0) {
      return true;
    }

    try {
      // Check if "Others" is selected
      const othersSource = await this.applicantSourceRepository.findOneBy({
        name: "Others"
      });

      if (!othersSource) {
        return true; // If Others source doesn't exist, validation passes
      }

      const isOthersSelected = applicantSourceIds.includes(othersSource.id);

      // If Others is selected, customSource is required
      if (isOthersSelected) {
        return Boolean(customSource && customSource.trim().length > 0);
      }

      // If Others is not selected, customSource should not be provided
      return Boolean(!customSource || customSource.trim().length === 0);
    } catch (error) {
      console.error("Error in custom source validation:", error);
      return true; // Allow validation to pass on error
    }
  }

  /**
   * Gets the appropriate error message for custom source validation
   * @param applicantSourceIds Array of selected applicant source IDs
   * @returns string Error message
   */
  getErrorMessage(applicantSourceIds: string[]): string {
    if (!applicantSourceIds || applicantSourceIds.length === 0) {
      return "Custom source is not required when no applicant sources are selected";
    }

    // Check if Others is selected (simplified check for error message)
    const hasOthers = applicantSourceIds.some(
      (id: string) =>
        typeof id === "string" &&
        (id === "others" || id.toLowerCase().includes("others"))
    );

    if (hasOthers) {
      return "Custom source is required when Others is selected";
    }

    return "Custom source should not be provided when Others is not selected";
  }
}
