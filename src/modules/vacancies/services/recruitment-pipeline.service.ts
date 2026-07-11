import {
  Injectable,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, IsNull, DataSource } from "typeorm";
import { RecruitmentPipeline } from "../entities/recruitment-pipeline.entity";
import {
  CreateRecruitmentPipelineDto,
  UpdateRecruitmentPipelineDto,
  RecruitmentPipelineResponseDto
} from "../dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";

@Injectable()
export class RecruitmentPipelineService {
  constructor(
    @InjectRepository(RecruitmentPipeline)
    private readonly recruitmentPipelineRepository: Repository<RecruitmentPipeline>,
    private readonly dataSource: DataSource
  ) {}

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
        `Failed to create recruitment pipeline: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findAll(
    paginationDto: BaseFindAllDto,
    filters?: {
      category?: string;
      isActive?: boolean;
      isTemplate?: boolean;
      isDefault?: boolean;
      search?: string;
    }
  ): Promise<{
    data: RecruitmentPipelineResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total_items: number;
      total_pages: number;
    };
  }> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.recruitmentPipelineRepository
      .createQueryBuilder("pipeline")
      .leftJoinAndSelect("pipeline.stages", "stages")
      .leftJoinAndSelect("stages.stageTemplate", "stageTemplate")
      .where("pipeline.deletedAt IS NULL");

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

    queryBuilder.orderBy("pipeline.createdAt", "DESC");

    const totalItems = await queryBuilder.getCount();

    queryBuilder.skip(skip).take(limit);

    const recruitmentPipelines = await queryBuilder.getMany();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: recruitmentPipelines.map((pipeline) =>
        this.mapToResponseDto(pipeline)
      ),
      pagination: {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages
      }
    };
  }

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
      Object.assign(recruitmentPipeline, updateRecruitmentPipelineDto);

      const updatedRecruitmentPipeline =
        await this.recruitmentPipelineRepository.save(recruitmentPipeline);

      return this.mapToResponseDto(updatedRecruitmentPipeline);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update recruitment pipeline: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

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
      await this.recruitmentPipelineRepository.softDelete(id);

      return { message: "Recruitment pipeline deleted successfully" };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete recruitment pipeline: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

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
      // dibungkus transaksi untuk mencegah race condition dua pipeline sama-sama jadi default
      return await this.dataSource.transaction(async (manager) => {
        await manager.update(
          RecruitmentPipeline,
          {
            isDefault: true,
            deletedAt: IsNull()
          } as FindOptionsWhere<RecruitmentPipeline>,
          { isDefault: false }
        );

        recruitmentPipeline.isDefault = true;
        const updatedPipeline = await manager.save(
          RecruitmentPipeline,
          recruitmentPipeline
        );
        return this.mapToResponseDto(updatedPipeline);
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to set recruitment pipeline as default: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

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
        `Failed to increment usage count: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createFromTemplate(
    templateId: string,
    createdById: string,
    customName?: string
  ): Promise<RecruitmentPipelineResponseDto> {
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

      // salin stages dari template
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

      await this.incrementUsageCount(templateId);

      return await this.findOne(savedPipeline.id);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create pipeline from template: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

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

  async replaceStagesFromTemplate(
    pipelineId: string,
    templateId: string
  ): Promise<RecruitmentPipelineResponseDto> {
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
      // hapus stages yang lama
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

      // salin stages dari template
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

      await this.incrementUsageCount(templateId);

      return await this.findOne(existingPipeline.id);
    } catch (error) {
      throw new BadRequestException(
        `Failed to replace stages from template: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getCategories(): Promise<string[]> {
    const result = await this.recruitmentPipelineRepository
      .createQueryBuilder("pipeline")
      .select("DISTINCT pipeline.category", "category")
      .where("pipeline.category IS NOT NULL")
      .andWhere("pipeline.deletedAt IS NULL")
      .getRawMany();

    return result.map((item) => item.category).filter(Boolean);
  }

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
