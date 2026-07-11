import {
  Injectable,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, IsNull, In } from "typeorm";
import { StageTemplate } from "../entities/stage-template.entity";
import {
  CreateStageTemplateDto,
  UpdateStageTemplateDto,
  StageTemplateResponseDto
} from "../dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";
import { Pagination } from "../../../shared/paginate/pagination";

@Injectable()
export class StageTemplateService {
  constructor(
    @InjectRepository(StageTemplate)
    private readonly stageTemplateRepository: Repository<StageTemplate>
  ) {}

  async create(
    createStageTemplateDto: CreateStageTemplateDto
  ): Promise<StageTemplateResponseDto> {
    try {
      const stageTemplate = this.stageTemplateRepository.create({
        ...createStageTemplateDto,
        canScore: createStageTemplateDto.canScore ?? false,
        canNotify: createStageTemplateDto.canNotify ?? false,
        isActive: createStageTemplateDto.isActive ?? true
      });

      const savedStageTemplate =
        await this.stageTemplateRepository.save(stageTemplate);

      return this.mapToResponseDto(savedStageTemplate);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new BadRequestException(
        `Failed to create stage template: ${errorMessage}`
      );
    }
  }

  async findAll(
    paginationDto: BaseFindAllDto,
    filters?: {
      category?: string;
      isActive?: boolean;
      search?: string;
    }
  ): Promise<Pagination<StageTemplateResponseDto>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.stageTemplateRepository
      .createQueryBuilder("stageTemplate")
      .where("stageTemplate.deletedAt IS NULL");

    if (filters?.category) {
      queryBuilder.andWhere("stageTemplate.category = :category", {
        category: filters.category
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere("stageTemplate.isActive = :isActive", {
        isActive: filters.isActive
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        "(stageTemplate.name ILIKE :search OR stageTemplate.description ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    queryBuilder.orderBy("stageTemplate.createdAt", "DESC");

    const totalItems = await queryBuilder.getCount();

    queryBuilder.skip(skip).take(limit);

    const stageTemplates = await queryBuilder.getMany();

    const totalPages = Math.ceil(totalItems / limit);

    return new Pagination({
      data: stageTemplates.map((template) => this.mapToResponseDto(template)),
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages
    });
  }

  async findOne(id: string): Promise<StageTemplateResponseDto> {
    const stageTemplate = await this.stageTemplateRepository.findOne({
      where: { id, deletedAt: IsNull() } as FindOptionsWhere<StageTemplate>
    });

    if (!stageTemplate) {
      throw new NotFoundException(`Stage template with ID ${id} not found`);
    }

    return this.mapToResponseDto(stageTemplate);
  }

  async update(
    id: string,
    updateStageTemplateDto: UpdateStageTemplateDto
  ): Promise<StageTemplateResponseDto> {
    const stageTemplate = await this.stageTemplateRepository.findOne({
      where: { id, deletedAt: IsNull() } as FindOptionsWhere<StageTemplate>
    });

    if (!stageTemplate) {
      throw new NotFoundException(`Stage template with ID ${id} not found`);
    }

    try {
      Object.assign(stageTemplate, updateStageTemplateDto);

      const updatedStageTemplate =
        await this.stageTemplateRepository.save(stageTemplate);

      return this.mapToResponseDto(updatedStageTemplate);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new BadRequestException(
        `Failed to update stage template: ${errorMessage}`
      );
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const stageTemplate = await this.stageTemplateRepository.findOne({
      where: { id, deletedAt: IsNull() } as FindOptionsWhere<StageTemplate>
    });

    if (!stageTemplate) {
      throw new NotFoundException(`Stage template with ID ${id} not found`);
    }

    try {
      await this.stageTemplateRepository.softDelete(id);

      return { message: "Stage template deleted successfully" };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete stage template: ${error.message}`
      );
    }
  }

  async findByCategory(category: string): Promise<StageTemplateResponseDto[]> {
    const stageTemplates = await this.stageTemplateRepository.find({
      where: {
        category,
        isActive: true,
        deletedAt: IsNull()
      } as FindOptionsWhere<StageTemplate>,
      order: { createdAt: "DESC" }
    });

    return stageTemplates.map((template) => this.mapToResponseDto(template));
  }

  async findByIds(ids: string[]): Promise<StageTemplateResponseDto[]> {
    console.log(ids);
    if (!ids || ids.length === 0) {
      return [];
    }

    const stageTemplates = await this.stageTemplateRepository.find({
      where: {
        id: In(ids),
        isActive: true,
        deletedAt: IsNull()
      } as FindOptionsWhere<StageTemplate>,
      order: { createdAt: "DESC" }
    });

    return stageTemplates.map((template) => this.mapToResponseDto(template));
  }

  async getCategories(): Promise<string[]> {
    const result = await this.stageTemplateRepository
      .createQueryBuilder("stageTemplate")
      .select("DISTINCT stageTemplate.category", "category")
      .where("stageTemplate.category IS NOT NULL")
      .andWhere("stageTemplate.deletedAt IS NULL")
      .getRawMany<{ category: string }>();

    return result.map((item) => item.category).filter(Boolean);
  }

  private mapToResponseDto(
    stageTemplate: StageTemplate
  ): StageTemplateResponseDto {
    return {
      id: stageTemplate.id,
      name: stageTemplate.name,
      description: stageTemplate.description,
      maxDurationDays: stageTemplate.maxDurationDays,
      canScore: stageTemplate.canScore,
      canNotify: stageTemplate.canNotify,
      instructions: stageTemplate.instructions,
      isActive: stageTemplate.isActive,
      category: stageTemplate.category,
      createdById: stageTemplate.createdById,
      createdAt: stageTemplate.createdAt,
      updatedAt: stageTemplate.updatedAt,
      deletedAt: stageTemplate.deletedAt
    };
  }
}
