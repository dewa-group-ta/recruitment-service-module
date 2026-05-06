import {
  Injectable,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { PipelineStage } from "../entities/pipeline-stage.entity";
import {
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
  PipelineStageResponseDto
} from "../dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";
import { PaginationResultInterface } from "../../../shared/paginate/pagination.results.interface";

@Injectable()
export class PipelineStageService {
  constructor(
    @InjectRepository(PipelineStage)
    private readonly pipelineStageRepository: Repository<PipelineStage>
  ) {}

  /**
   * Create a new pipeline stage
   * @param createPipelineStageDto - Data for creating pipeline stage
   * @returns Created pipeline stage
   */
  async create(
    createPipelineStageDto: CreatePipelineStageDto
  ): Promise<PipelineStageResponseDto> {
    try {
      // Check if stage order already exists for this pipeline
      const existingStage = await this.pipelineStageRepository.findOne({
        where: {
          pipelineId: createPipelineStageDto.pipelineId,
          stageOrder: createPipelineStageDto.stageOrder
        }
      });

      if (existingStage) {
        throw new BadRequestException(
          `Stage order ${createPipelineStageDto.stageOrder} already exists for this pipeline`
        );
      }

      const pipelineStage = this.pipelineStageRepository.create({
        ...createPipelineStageDto,
        sendNotification: createPipelineStageDto.sendNotification ?? true
      });

      const savedPipelineStage =
        await this.pipelineStageRepository.save(pipelineStage);

      return this.mapToResponseDto(savedPipelineStage);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create pipeline stage: ${error.message}`
      );
    }
  }

  /**
   * Find all pipeline stages with pagination and filtering
   * @param paginationDto - Pagination parameters
   * @param filters - Optional filters
   * @returns Paginated list of pipeline stages
   */
  async findAll(
    paginationDto: BaseFindAllDto,
    filters?: {
      pipelineId?: string;
      stageTemplateId?: string;
      search?: string;
    }
  ): Promise<PaginationResultInterface<PipelineStageResponseDto>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.pipelineStageRepository
      .createQueryBuilder("pipelineStage")
      .leftJoinAndSelect("pipelineStage.pipeline", "pipeline")
      .leftJoinAndSelect("pipelineStage.stageTemplate", "stageTemplate")
      .where("1=1");

    // Apply filters
    if (filters?.pipelineId) {
      queryBuilder.andWhere("pipelineStage.pipelineId = :pipelineId", {
        pipelineId: filters.pipelineId
      });
    }

    if (filters?.stageTemplateId) {
      queryBuilder.andWhere(
        "pipelineStage.stageTemplateId = :stageTemplateId",
        {
          stageTemplateId: filters.stageTemplateId
        }
      );
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        "(pipeline.name ILIKE :search OR stageTemplate.name ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    // Order by pipeline and stage order
    queryBuilder.orderBy("pipelineStage.pipelineId", "ASC");
    queryBuilder.addOrderBy("pipelineStage.stageOrder", "ASC");

    // Get total count
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const pipelineStages = await queryBuilder.getMany();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: pipelineStages.map((stage) => this.mapToResponseDto(stage)),
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages
    };
  }

  /**
   * Find a pipeline stage by ID
   * @param id - Pipeline stage ID
   * @returns Pipeline stage
   */
  async findOne(id: string): Promise<PipelineStageResponseDto> {
    const pipelineStage = await this.pipelineStageRepository.findOne({
      where: { id } as FindOptionsWhere<PipelineStage>,
      relations: ["pipeline", "stageTemplate"]
    });

    if (!pipelineStage) {
      throw new NotFoundException(`Pipeline stage with ID ${id} not found`);
    }

    return this.mapToResponseDto(pipelineStage);
  }

  /**
   * Update a pipeline stage
   * @param id - Pipeline stage ID
   * @param updatePipelineStageDto - Data for updating pipeline stage
   * @returns Updated pipeline stage
   */
  async update(
    id: string,
    updatePipelineStageDto: UpdatePipelineStageDto
  ): Promise<PipelineStageResponseDto> {
    const pipelineStage = await this.pipelineStageRepository.findOne({
      where: { id } as FindOptionsWhere<PipelineStage>,
      relations: ["pipeline", "stageTemplate"]
    });

    if (!pipelineStage) {
      throw new NotFoundException(`Pipeline stage with ID ${id} not found`);
    }

    try {
      // If stage order is being updated, check for conflicts
      if (
        updatePipelineStageDto.stageOrder &&
        updatePipelineStageDto.stageOrder !== pipelineStage.stageOrder
      ) {
        const existingStage = await this.pipelineStageRepository.findOne({
          where: {
            pipelineId:
              updatePipelineStageDto.pipelineId || pipelineStage.pipelineId,
            stageOrder: updatePipelineStageDto.stageOrder
          }
        });

        if (existingStage && existingStage.id !== id) {
          throw new BadRequestException(
            `Stage order ${updatePipelineStageDto.stageOrder} already exists for this pipeline`
          );
        }
      }

      // Update the pipeline stage
      Object.assign(pipelineStage, updatePipelineStageDto);

      const updatedPipelineStage =
        await this.pipelineStageRepository.save(pipelineStage);

      return this.mapToResponseDto(updatedPipelineStage);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update pipeline stage: ${error.message}`
      );
    }
  }

  /**
   * Delete a pipeline stage
   * @param id - Pipeline stage ID
   * @returns Success message
   */
  async remove(id: string): Promise<{ message: string }> {
    const pipelineStage = await this.pipelineStageRepository.findOne({
      where: { id } as FindOptionsWhere<PipelineStage>
    });

    if (!pipelineStage) {
      throw new NotFoundException(`Pipeline stage with ID ${id} not found`);
    }

    try {
      await this.pipelineStageRepository.remove(pipelineStage);

      return { message: "Pipeline stage deleted successfully" };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete pipeline stage: ${error.message}`
      );
    }
  }

  /**
   * Find pipeline stages by pipeline ID
   * @param pipelineId - Pipeline ID
   * @returns List of pipeline stages ordered by stage order
   */
  async findByPipelineId(
    pipelineId: string
  ): Promise<PipelineStageResponseDto[]> {
    const pipelineStages = await this.pipelineStageRepository.find({
      where: { pipelineId } as FindOptionsWhere<PipelineStage>,
      relations: ["pipeline", "stageTemplate"],
      order: { stageOrder: "ASC" }
    });

    return pipelineStages.map((stage) => this.mapToResponseDto(stage));
  }

  /**
   * Find pipeline stages by stage template ID
   * @param stageTemplateId - Stage template ID
   * @returns List of pipeline stages using this template
   */
  async findByStageTemplateId(
    stageTemplateId: string
  ): Promise<PipelineStageResponseDto[]> {
    const pipelineStages = await this.pipelineStageRepository.find({
      where: { stageTemplateId } as FindOptionsWhere<PipelineStage>,
      relations: ["pipeline", "stageTemplate"],
      order: { stageOrder: "ASC" }
    });

    return pipelineStages.map((stage) => this.mapToResponseDto(stage));
  }

  /**
   * Reorder pipeline stages
   * @param pipelineId - Pipeline ID
   * @param stageOrders - Array of stage IDs with their new orders
   * @returns Success message
   */
  async reorderStages(
    pipelineId: string,
    stageOrders: { stageId: string; newOrder: number }[]
  ): Promise<{ message: string }> {
    try {
      // Validate that all stages belong to the pipeline
      const stageIds = stageOrders.map((so) => so.stageId);
      const existingStages = await this.pipelineStageRepository.find({
        where: {
          pipelineId,
          id: stageIds[0]
        } as FindOptionsWhere<PipelineStage>
      });

      if (existingStages.length !== stageIds.length) {
        throw new BadRequestException(
          "Some stages do not belong to this pipeline"
        );
      }

      // Update stage orders
      for (const stageOrder of stageOrders) {
        await this.pipelineStageRepository.update(stageOrder.stageId, {
          stageOrder: stageOrder.newOrder
        });
      }

      return { message: "Pipeline stages reordered successfully" };
    } catch (error) {
      throw new BadRequestException(
        `Failed to reorder pipeline stages: ${error.message}`
      );
    }
  }

  /**
   * Get next stage order for a pipeline
   * @param pipelineId - Pipeline ID
   * @returns Next available stage order
   */
  async getNextStageOrder(pipelineId: string): Promise<number> {
    const lastStage = await this.pipelineStageRepository.findOne({
      where: { pipelineId } as FindOptionsWhere<PipelineStage>,
      order: { stageOrder: "DESC" }
    });

    return lastStage ? lastStage.stageOrder + 1 : 1;
  }

  /**
   * Map entity to response DTO
   * @param pipelineStage - Pipeline stage entity
   * @returns Pipeline stage response DTO
   */
  private mapToResponseDto(
    pipelineStage: PipelineStage
  ): PipelineStageResponseDto {
    return {
      id: pipelineStage.id,
      pipelineId: pipelineStage.pipelineId,
      stageTemplateId: pipelineStage.stageTemplateId,
      stageTemplate: pipelineStage.stageTemplate,
      stageOrder: pipelineStage.stageOrder,
      estimatedDurationDays: pipelineStage.estimatedDurationDays,
      sendNotification: pipelineStage.sendNotification,
      createdAt: pipelineStage.createdAt,
      updatedAt: pipelineStage.updatedAt
    };
  }
}
