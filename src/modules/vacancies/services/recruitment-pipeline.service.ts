import {
  Injectable,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, IsNull } from "typeorm";
import { RecruitmentPipeline } from "../entities/recruitment-pipeline.entity";
import {
  CreateRecruitmentPipelineDto,
  UpdateRecruitmentPipelineDto,
  RecruitmentPipelineResponseDto
} from "../dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";
import { PaginationResultInterface } from "../../../shared/paginate/pagination.results.interface";

@Injectable()
export class RecruitmentPipelineService {
  constructor(
    @InjectRepository(RecruitmentPipeline)
    private readonly recruitmentPipelineRepository: Repository<RecruitmentPipeline>
  ) {}

  /**
   * Create a new recruitment pipeline
   * @param createRecruitmentPipelineDto - Data for creating recruitment pipeline
   * @returns Created recruitment pipeline
   */
  async create(
    createRecruitmentPipelineDto: CreateRecruitmentPipelineDto
  ): Promise<RecruitmentPipelineResponseDto> {
    try {
      const recruitmentPipeline = this.recruitmentPipelineRepository.create({
        ...createRecruitmentPipelineDto,
        version: createRecruitmentPipelineDto.version ?? "1.0",
        isDefault: createRecruitmentPipelineDto.isDefault ?? false,
        isActive: createRecruitmentPipelineDto.isActive ?? true,
        isTemplate: createRecruitmentPipelineDto.isTemplate ?? false,
        usageCount: createRecruitmentPipelineDto.usageCount ?? 0
      });

      const savedRecruitmentPipeline =
        await this.recruitmentPipelineRepository.save(recruitmentPipeline);

      return this.mapToResponseDto(savedRecruitmentPipeline);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create recruitment pipeline: ${error.message}`
      );
    }
  }

  /**
   * Find all recruitment pipelines with pagination and filtering
   * @param paginationDto - Pagination parameters
   * @param filters - Optional filters
   * @returns Paginated list of recruitment pipelines
   */
  async findAll(
    paginationDto: BaseFindAllDto,
    filters?: {
      category?: string;
      isActive?: boolean;
      isTemplate?: boolean;
      isDefault?: boolean;
      search?: string;
    }
  ): Promise<PaginationResultInterface<RecruitmentPipelineResponseDto>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.recruitmentPipelineRepository
      .createQueryBuilder("pipeline")
      .leftJoinAndSelect("pipeline.stages", "stages")
      .where("pipeline.deletedAt IS NULL");

    // Apply filters
    if (filters?.category) {
      queryBuilder.andWhere("pipeline.category = :category", {
        category: filters.category
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere("pipeline.isActive = :isActive", {
        isActive: filters.isActive
      });
    }

    if (filters?.isTemplate !== undefined) {
      queryBuilder.andWhere("pipeline.isTemplate = :isTemplate", {
        isTemplate: filters.isTemplate
      });
    }

    if (filters?.isDefault !== undefined) {
      queryBuilder.andWhere("pipeline.isDefault = :isDefault", {
        isDefault: filters.isDefault
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        "(pipeline.name ILIKE :search OR pipeline.description ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy("pipeline.createdAt", "DESC");

    // Get total count
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const recruitmentPipelines = await queryBuilder.getMany();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: recruitmentPipelines.map((pipeline) =>
        this.mapToResponseDto(pipeline)
      ),
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages
    };
  }

  /**
   * Find a recruitment pipeline by ID
   * @param id - Recruitment pipeline ID
   * @returns Recruitment pipeline
   */
  async findOne(id: string): Promise<RecruitmentPipelineResponseDto> {
    const recruitmentPipeline =
      await this.recruitmentPipelineRepository.findOne({
        where: {
          id,
          deletedAt: IsNull()
        } as FindOptionsWhere<RecruitmentPipeline>,
        relations: ["stages", "stages.stageTemplate"]
      });

    if (!recruitmentPipeline) {
      throw new NotFoundException(
        `Recruitment pipeline with ID ${id} not found`
      );
    }

    return this.mapToResponseDto(recruitmentPipeline);
  }

  /**
   * Update a recruitment pipeline
   * @param id - Recruitment pipeline ID
   * @param updateRecruitmentPipelineDto - Data for updating recruitment pipeline
   * @returns Updated recruitment pipeline
   */
  async update(
    id: string,
    updateRecruitmentPipelineDto: UpdateRecruitmentPipelineDto
  ): Promise<RecruitmentPipelineResponseDto> {
    const recruitmentPipeline =
      await this.recruitmentPipelineRepository.findOne({
        where: {
          id,
          deletedAt: IsNull()
        } as FindOptionsWhere<RecruitmentPipeline>,
        relations: ["stages"]
      });

    if (!recruitmentPipeline) {
      throw new NotFoundException(
        `Recruitment pipeline with ID ${id} not found`
      );
    }

    try {
      // Update the recruitment pipeline
      Object.assign(recruitmentPipeline, updateRecruitmentPipelineDto);

      const updatedRecruitmentPipeline =
        await this.recruitmentPipelineRepository.save(recruitmentPipeline);

      return this.mapToResponseDto(updatedRecruitmentPipeline);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update recruitment pipeline: ${error.message}`
      );
    }
  }

  /**
   * Soft delete a recruitment pipeline
   * @param id - Recruitment pipeline ID
   * @returns Success message
   */
  async remove(id: string): Promise<{ message: string }> {
    const recruitmentPipeline =
      await this.recruitmentPipelineRepository.findOne({
        where: {
          id,
          deletedAt: IsNull()
        } as FindOptionsWhere<RecruitmentPipeline>
      });

    if (!recruitmentPipeline) {
      throw new NotFoundException(
        `Recruitment pipeline with ID ${id} not found`
      );
    }

    try {
      // Soft delete
      await this.recruitmentPipelineRepository.softDelete(id);

      return { message: "Recruitment pipeline deleted successfully" };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete recruitment pipeline: ${error.message}`
      );
    }
  }

  /**
   * Find recruitment pipelines by category
   * @param category - Category name
   * @returns List of recruitment pipelines in the category
   */
  async findByCategory(
    category: string
  ): Promise<RecruitmentPipelineResponseDto[]> {
    const recruitmentPipelines = await this.recruitmentPipelineRepository.find({
      where: {
        category,
        isActive: true,
        deletedAt: IsNull()
      } as FindOptionsWhere<RecruitmentPipeline>,
      relations: ["stages"],
      order: { createdAt: "DESC" }
    });

    return recruitmentPipelines.map((pipeline) =>
      this.mapToResponseDto(pipeline)
    );
  }

  /**
   * Find template recruitment pipelines
   * @returns List of template recruitment pipelines
   */
  async findTemplates(): Promise<RecruitmentPipelineResponseDto[]> {
    const recruitmentPipelines = await this.recruitmentPipelineRepository.find({
      where: {
        isTemplate: true,
        isActive: true,
        deletedAt: IsNull()
      } as FindOptionsWhere<RecruitmentPipeline>,
      relations: ["stages"],
      order: { usageCount: "DESC", createdAt: "DESC" }
    });

    return recruitmentPipelines.map((pipeline) =>
      this.mapToResponseDto(pipeline)
    );
  }

  /**
   * Get the default recruitment pipeline
   * @returns Default recruitment pipeline
   */
  async getDefault(): Promise<RecruitmentPipelineResponseDto | null> {
    const defaultPipeline = await this.recruitmentPipelineRepository.findOne({
      where: {
        isDefault: true,
        isActive: true,
        deletedAt: IsNull()
      } as FindOptionsWhere<RecruitmentPipeline>,
      relations: ["stages"]
    });

    return defaultPipeline ? this.mapToResponseDto(defaultPipeline) : null;
  }

  /**
   * Set a recruitment pipeline as default
   * @param id - Recruitment pipeline ID
   * @returns Updated recruitment pipeline
   */
  async setAsDefault(id: string): Promise<RecruitmentPipelineResponseDto> {
    const recruitmentPipeline =
      await this.recruitmentPipelineRepository.findOne({
        where: {
          id,
          deletedAt: IsNull()
        } as FindOptionsWhere<RecruitmentPipeline>,
        relations: ["stages"]
      });

    if (!recruitmentPipeline) {
      throw new NotFoundException(
        `Recruitment pipeline with ID ${id} not found`
      );
    }

    try {
      // First, unset all other default pipelines
      await this.recruitmentPipelineRepository.update(
        {
          isDefault: true,
          deletedAt: IsNull()
        } as FindOptionsWhere<RecruitmentPipeline>,
        { isDefault: false }
      );

      // Set this pipeline as default
      recruitmentPipeline.isDefault = true;
      const updatedPipeline =
        await this.recruitmentPipelineRepository.save(recruitmentPipeline);

      return this.mapToResponseDto(updatedPipeline);
    } catch (error) {
      throw new BadRequestException(
        `Failed to set recruitment pipeline as default: ${error.message}`
      );
    }
  }

  /**
   * Increment usage count for a template pipeline
   * @param id - Recruitment pipeline ID
   * @returns Updated recruitment pipeline
   */
  async incrementUsageCount(
    id: string
  ): Promise<RecruitmentPipelineResponseDto> {
    const recruitmentPipeline =
      await this.recruitmentPipelineRepository.findOne({
        where: {
          id,
          deletedAt: IsNull()
        } as FindOptionsWhere<RecruitmentPipeline>,
        relations: ["stages"]
      });

    if (!recruitmentPipeline) {
      throw new NotFoundException(
        `Recruitment pipeline with ID ${id} not found`
      );
    }

    try {
      recruitmentPipeline.usageCount += 1;
      const updatedPipeline =
        await this.recruitmentPipelineRepository.save(recruitmentPipeline);

      return this.mapToResponseDto(updatedPipeline);
    } catch (error) {
      throw new BadRequestException(
        `Failed to increment usage count: ${error.message}`
      );
    }
  }

  /**
   * Create a pipeline from a template
   * @param templateId - Template pipeline ID
   * @param createdById - ID of the user creating the pipeline
   * @param customName - Optional custom name for the new pipeline
   * @returns Created pipeline instance
   */
  async createFromTemplate(
    templateId: string,
    createdById: string,
    customName?: string
  ): Promise<RecruitmentPipelineResponseDto> {
    // Find the template pipeline
    const templatePipeline = await this.recruitmentPipelineRepository.findOne({
      where: {
        id: templateId,
        isTemplate: true,
        isActive: true,
        deletedAt: IsNull()
      } as FindOptionsWhere<RecruitmentPipeline>,
      relations: ["stages"]
    });

    if (!templatePipeline) {
      throw new NotFoundException(
        `Template pipeline with ID ${templateId} not found or not active`
      );
    }

    try {
      // Create new pipeline instance from template
      const newPipeline = this.recruitmentPipelineRepository.create({
        name: customName || `${templatePipeline.name} - Instance`,
        description: templatePipeline.description,
        version: templatePipeline.version,
        isDefault: false,
        isActive: true,
        isTemplate: false,
        category: templatePipeline.category,
        usageCount: 0,
        createdById
      });

      const savedPipeline =
        await this.recruitmentPipelineRepository.save(newPipeline);

      // Copy stages from template
      if (templatePipeline.stages && templatePipeline.stages.length > 0) {
        const { PipelineStage } = await import(
          "../entities/pipeline-stage.entity"
        );
        const pipelineStageRepository =
          this.recruitmentPipelineRepository.manager.getRepository(
            PipelineStage
          );

        const newStages = templatePipeline.stages.map((stage) =>
          pipelineStageRepository.create({
            pipelineId: savedPipeline.id,
            stageTemplateId: stage.stageTemplateId,
            stageOrder: stage.stageOrder,
            estimatedDurationDays: stage.estimatedDurationDays,
            sendNotification: stage.sendNotification
          })
        );

        await pipelineStageRepository.save(newStages);
      }

      // Increment usage count of the template
      await this.incrementUsageCount(templateId);

      // Return the created pipeline with stages
      return await this.findOne(savedPipeline.id);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create pipeline from template: ${error.message}`
      );
    }
  }

  /**
   * Get the default template pipeline
   * @returns Default template pipeline
   */
  async getDefaultTemplate(): Promise<RecruitmentPipelineResponseDto | null> {
    const defaultTemplate = await this.recruitmentPipelineRepository.findOne({
      where: {
        isTemplate: true,
        isDefault: true,
        isActive: true,
        deletedAt: IsNull()
      } as FindOptionsWhere<RecruitmentPipeline>,
      relations: ["stages"]
    });

    return defaultTemplate ? this.mapToResponseDto(defaultTemplate) : null;
  }

  /**
   * Replace stages in an existing pipeline with stages from a template
   * @param pipelineId - Existing pipeline ID
   * @param templateId - Template pipeline ID to copy stages from
   * @returns Updated pipeline with new stages
   */
  async replaceStagesFromTemplate(
    pipelineId: string,
    templateId: string
  ): Promise<RecruitmentPipelineResponseDto> {
    // Find the existing pipeline
    const existingPipeline = await this.recruitmentPipelineRepository.findOne({
      where: {
        id: pipelineId,
        deletedAt: IsNull()
      } as FindOptionsWhere<RecruitmentPipeline>,
      relations: ["stages"]
    });

    if (!existingPipeline) {
      throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
    }

    // Find the template pipeline
    const templatePipeline = await this.recruitmentPipelineRepository.findOne({
      where: {
        id: templateId,
        isTemplate: true,
        isActive: true,
        deletedAt: IsNull()
      } as FindOptionsWhere<RecruitmentPipeline>,
      relations: ["stages"]
    });

    if (!templatePipeline) {
      throw new NotFoundException(
        `Template pipeline with ID ${templateId} not found or not active`
      );
    }

    try {
      // Delete existing stages
      if (existingPipeline.stages && existingPipeline.stages.length > 0) {
        const { PipelineStage } = await import(
          "../entities/pipeline-stage.entity"
        );
        const pipelineStageRepository =
          this.recruitmentPipelineRepository.manager.getRepository(
            PipelineStage
          );
        await pipelineStageRepository.delete({ pipelineId });
      }

      // Copy stages from template
      if (templatePipeline.stages && templatePipeline.stages.length > 0) {
        const { PipelineStage } = await import(
          "../entities/pipeline-stage.entity"
        );
        const pipelineStageRepository =
          this.recruitmentPipelineRepository.manager.getRepository(
            PipelineStage
          );

        const newStages = templatePipeline.stages.map((stage) =>
          pipelineStageRepository.create({
            pipelineId: existingPipeline.id,
            stageTemplateId: stage.stageTemplateId,
            stageOrder: stage.stageOrder,
            estimatedDurationDays: stage.estimatedDurationDays,
            sendNotification: stage.sendNotification
          })
        );

        await pipelineStageRepository.save(newStages);
      }

      // Increment usage count of the template
      await this.incrementUsageCount(templateId);

      // Return the updated pipeline with new stages
      return await this.findOne(existingPipeline.id);
    } catch (error) {
      throw new BadRequestException(
        `Failed to replace stages from template: ${error.message}`
      );
    }
  }

  /**
   * Get available categories
   * @returns List of unique categories
   */
  async getCategories(): Promise<string[]> {
    const result = await this.recruitmentPipelineRepository
      .createQueryBuilder("pipeline")
      .select("DISTINCT pipeline.category", "category")
      .where("pipeline.category IS NOT NULL")
      .andWhere("pipeline.deletedAt IS NULL")
      .getRawMany();

    return result.map((item) => item.category).filter(Boolean);
  }

  /**
   * Map entity to response DTO
   * @param recruitmentPipeline - Recruitment pipeline entity
   * @returns Recruitment pipeline response DTO
   */
  private mapToResponseDto(
    recruitmentPipeline: RecruitmentPipeline
  ): RecruitmentPipelineResponseDto {
    return {
      id: recruitmentPipeline.id,
      name: recruitmentPipeline.name,
      description: recruitmentPipeline.description,
      version: recruitmentPipeline.version,
      isDefault: recruitmentPipeline.isDefault,
      isActive: recruitmentPipeline.isActive,
      isTemplate: recruitmentPipeline.isTemplate,
      category: recruitmentPipeline.category,
      usageCount: recruitmentPipeline.usageCount,
      createdById: recruitmentPipeline.createdById,
      stages: recruitmentPipeline.stages?.map((stage) => ({
        id: stage.id,
        pipelineId: stage.pipelineId,
        stageTemplateId: stage.stageTemplateId,
        stageTemplate: stage.stageTemplate,
        stageOrder: stage.stageOrder,
        estimatedDurationDays: stage.estimatedDurationDays,
        sendNotification: stage.sendNotification,
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt
      })),
      createdAt: recruitmentPipeline.createdAt,
      updatedAt: recruitmentPipeline.updatedAt,
      deletedAt: recruitmentPipeline.deletedAt
    };
  }
}
