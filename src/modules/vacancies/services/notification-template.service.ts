import {
  Injectable,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, IsNull } from "typeorm";
import { NotificationTemplate } from "../entities/notification-template.entity";
import {
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
  NotificationTemplateResponseDto
} from "../dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";
import { PaginationResultInterface } from "../../../shared/paginate/pagination.results.interface";

@Injectable()
export class NotificationTemplateService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly notificationTemplateRepository: Repository<NotificationTemplate>
  ) {}

  async create(
    createNotificationTemplateDto: CreateNotificationTemplateDto
  ): Promise<NotificationTemplateResponseDto> {
    try {
      const notificationTemplate = this.notificationTemplateRepository.create({
        ...createNotificationTemplateDto,
        isActive: createNotificationTemplateDto.isActive ?? true
      });

      const savedNotificationTemplate =
        await this.notificationTemplateRepository.save(notificationTemplate);

      return this.mapToResponseDto(savedNotificationTemplate);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create notification template: ${error.message}`
      );
    }
  }

  async findAll(
    paginationDto: BaseFindAllDto,
    filters?: {
      stageTemplateId?: string;
      triggerEvent?: string;
      isActive?: boolean;
      search?: string;
    }
  ): Promise<PaginationResultInterface<NotificationTemplateResponseDto>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationTemplateRepository
      .createQueryBuilder("notificationTemplate")
      .leftJoinAndSelect("notificationTemplate.stageTemplate", "stageTemplate")
      .where("notificationTemplate.deletedAt IS NULL");

    if (filters?.stageTemplateId) {
      queryBuilder.andWhere(
        "notificationTemplate.stageTemplateId = :stageTemplateId",
        {
          stageTemplateId: filters.stageTemplateId
        }
      );
    }

    if (filters?.triggerEvent) {
      queryBuilder.andWhere(
        "notificationTemplate.triggerEvent = :triggerEvent",
        {
          triggerEvent: filters.triggerEvent
        }
      );
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere("notificationTemplate.isActive = :isActive", {
        isActive: filters.isActive
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        "(notificationTemplate.name ILIKE :search OR notificationTemplate.subjectTemplate ILIKE :search OR notificationTemplate.bodyTemplate ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    queryBuilder.orderBy("notificationTemplate.createdAt", "DESC");

    const totalItems = await queryBuilder.getCount();

    queryBuilder.skip(skip).take(limit);

    const notificationTemplates = await queryBuilder.getMany();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: notificationTemplates.map((template) =>
        this.mapToResponseDto(template)
      ),
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages
    };
  }

  async findOne(id: string): Promise<NotificationTemplateResponseDto> {
    const notificationTemplate =
      await this.notificationTemplateRepository.findOne({
        where: {
          id,
          deletedAt: IsNull()
        } as FindOptionsWhere<NotificationTemplate>,
        relations: ["stageTemplate"]
      });

    if (!notificationTemplate) {
      throw new NotFoundException(
        `Notification template with ID ${id} not found`
      );
    }

    return this.mapToResponseDto(notificationTemplate);
  }

  async update(
    id: string,
    updateNotificationTemplateDto: UpdateNotificationTemplateDto
  ): Promise<NotificationTemplateResponseDto> {
    const notificationTemplate =
      await this.notificationTemplateRepository.findOne({
        where: {
          id,
          deletedAt: IsNull()
        } as FindOptionsWhere<NotificationTemplate>,
        relations: ["stageTemplate"]
      });

    if (!notificationTemplate) {
      throw new NotFoundException(
        `Notification template with ID ${id} not found`
      );
    }

    try {
      Object.assign(notificationTemplate, updateNotificationTemplateDto);

      const updatedNotificationTemplate =
        await this.notificationTemplateRepository.save(notificationTemplate);

      return this.mapToResponseDto(updatedNotificationTemplate);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update notification template: ${error.message}`
      );
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const notificationTemplate =
      await this.notificationTemplateRepository.findOne({
        where: {
          id,
          deletedAt: IsNull()
        } as FindOptionsWhere<NotificationTemplate>
      });

    if (!notificationTemplate) {
      throw new NotFoundException(
        `Notification template with ID ${id} not found`
      );
    }

    try {
      await this.notificationTemplateRepository.softDelete(id);

      return { message: "Notification template deleted successfully" };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete notification template: ${error.message}`
      );
    }
  }

  async findByStageTemplateId(
    stageTemplateId: string
  ): Promise<NotificationTemplateResponseDto[]> {
    const notificationTemplates =
      await this.notificationTemplateRepository.find({
        where: {
          stageTemplateId,
          isActive: true,
          deletedAt: IsNull()
        } as FindOptionsWhere<NotificationTemplate>,
        relations: ["stageTemplate"],
        order: { createdAt: "DESC" }
      });

    return notificationTemplates.map((template) =>
      this.mapToResponseDto(template)
    );
  }

  async findByTriggerEvent(
    triggerEvent: string
  ): Promise<NotificationTemplateResponseDto[]> {
    const notificationTemplates =
      await this.notificationTemplateRepository.find({
        where: {
          triggerEvent,
          isActive: true,
          deletedAt: IsNull()
        } as FindOptionsWhere<NotificationTemplate>,
        relations: ["stageTemplate"],
        order: { createdAt: "DESC" }
      });

    return notificationTemplates.map((template) =>
      this.mapToResponseDto(template)
    );
  }

  async getTriggerEvents(): Promise<string[]> {
    const result = await this.notificationTemplateRepository
      .createQueryBuilder("notificationTemplate")
      .select("DISTINCT notificationTemplate.triggerEvent", "triggerEvent")
      .where("notificationTemplate.deletedAt IS NULL")
      .getRawMany();

    return result.map((item) => item.triggerEvent).filter(Boolean);
  }

  async findByStageTemplateAndTrigger(
    stageTemplateId: string,
    triggerEvent: string
  ): Promise<NotificationTemplateResponseDto | null> {
    const notificationTemplate =
      await this.notificationTemplateRepository.findOne({
        where: {
          stageTemplateId,
          triggerEvent,
          isActive: true,
          deletedAt: IsNull()
        } as FindOptionsWhere<NotificationTemplate>,
        relations: ["stageTemplate"]
      });

    return notificationTemplate
      ? this.mapToResponseDto(notificationTemplate)
      : null;
  }

  async duplicate(
    id: string,
    newName: string
  ): Promise<NotificationTemplateResponseDto> {
    const originalTemplate = await this.notificationTemplateRepository.findOne({
      where: {
        id,
        deletedAt: IsNull()
      } as FindOptionsWhere<NotificationTemplate>
    });

    if (!originalTemplate) {
      throw new NotFoundException(
        `Notification template with ID ${id} not found`
      );
    }

    try {
      const duplicatedTemplate = this.notificationTemplateRepository.create({
        name: newName,
        stageTemplateId: originalTemplate.stageTemplateId,
        triggerEvent: originalTemplate.triggerEvent,
        subjectTemplate: originalTemplate.subjectTemplate,
        bodyTemplate: originalTemplate.bodyTemplate,
        isActive: originalTemplate.isActive
      });

      const savedTemplate =
        await this.notificationTemplateRepository.save(duplicatedTemplate);

      return this.mapToResponseDto(savedTemplate);
    } catch (error) {
      throw new BadRequestException(
        `Failed to duplicate notification template: ${error.message}`
      );
    }
  }

  private mapToResponseDto(
    notificationTemplate: NotificationTemplate
  ): NotificationTemplateResponseDto {
    return {
      id: notificationTemplate.id,
      name: notificationTemplate.name,
      stageTemplateId: notificationTemplate.stageTemplateId,
      triggerEvent: notificationTemplate.triggerEvent,
      subjectTemplate: notificationTemplate.subjectTemplate,
      bodyTemplate: notificationTemplate.bodyTemplate,
      isActive: notificationTemplate.isActive,
      createdAt: notificationTemplate.createdAt,
      updatedAt: notificationTemplate.updatedAt,
      deletedAt: notificationTemplate.deletedAt
    };
  }
}
