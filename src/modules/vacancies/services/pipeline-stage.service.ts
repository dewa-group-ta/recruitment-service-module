import {
  Injectable,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, In, DataSource } from "typeorm";
import { PipelineStage } from "../entities/pipeline-stage.entity";
import {
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
  PipelineStageResponseDto
} from "../dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";
import { PaginationResultInterface } from "../../../shared/paginate/pagination.results.interface";
import { Application } from "../../applicants/entities/application.entity";

@Injectable()
export class PipelineStageService {
  constructor(
    @InjectRepository(PipelineStage)
    private readonly pipelineStageRepository: Repository<PipelineStage>,
    private readonly dataSource: DataSource
  ) {}

  async create(
    createPipelineStageDto: CreatePipelineStageDto
  ): Promise<PipelineStageResponseDto> {
    try {
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
      const msg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to create pipeline stage: ${msg}`);
    }
  }

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

    queryBuilder.orderBy("pipelineStage.pipelineId", "ASC");
    queryBuilder.addOrderBy("pipelineStage.stageOrder", "ASC");

    const totalItems = await queryBuilder.getCount();

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

      Object.assign(pipelineStage, updatePipelineStageDto);

      const updatedPipelineStage =
        await this.pipelineStageRepository.save(pipelineStage);

      return this.mapToResponseDto(updatedPipelineStage);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to update pipeline stage: ${msg}`);
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const pipelineStage = await this.pipelineStageRepository.findOne({
      where: { id } as FindOptionsWhere<PipelineStage>
    });

    if (!pipelineStage) {
      throw new NotFoundException(`Pipeline stage with ID ${id} not found`);
    }

    // cegah hapus stage kalau masih ada application yang aktif di stage ini
    const activeApplicationCount = await this.dataSource
      .getRepository(Application)
      .count({ where: { currentStageId: id } });

    if (activeApplicationCount > 0) {
      throw new BadRequestException(
        `Cannot delete stage: ${activeApplicationCount} active application(s) are currently at this stage`
      );
    }

    try {
      await this.pipelineStageRepository.remove(pipelineStage);

      return { message: "Pipeline stage deleted successfully" };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to delete pipeline stage: ${msg}`);
    }
  }

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

  async reorderStages(
    pipelineId: string,
    stageOrders: { stageId: string; newOrder: number }[]
  ): Promise<{ message: string }> {
    const stageIds = stageOrders.map((so) => so.stageId);

    // pastikan semua stage id yang dikirim memang milik pipeline ini
    const existingStages = await this.pipelineStageRepository.find({
      where: { pipelineId, id: In(stageIds) } as FindOptionsWhere<PipelineStage>
    });

    if (existingStages.length !== stageIds.length) {
      throw new BadRequestException(
        "Some stages do not belong to this pipeline"
      );
    }

    // dibungkus transaksi supaya reorder yang gagal di tengah tidak meninggalkan urutan yang tidak konsisten
    await this.dataSource.transaction(async (manager) => {
      for (const stageOrder of stageOrders) {
        await manager.update(PipelineStage, stageOrder.stageId, {
          stageOrder: stageOrder.newOrder
        });
      }
    });

    return { message: "Pipeline stages reordered successfully" };
  }

  async getNextStageOrder(pipelineId: string): Promise<number> {
    const lastStage = await this.pipelineStageRepository.findOne({
      where: { pipelineId } as FindOptionsWhere<PipelineStage>,
      order: { stageOrder: "DESC" }
    });

    return lastStage ? lastStage.stageOrder + 1 : 1;
  }

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
