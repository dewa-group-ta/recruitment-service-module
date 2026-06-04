import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery
} from "@nestjs/swagger";
import { NotificationTemplateService } from "../services/notification-template.service";
import {
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
  NotificationTemplateResponseDto
} from "../dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";
import { PaginationResultInterface } from "../../../shared/paginate/pagination.results.interface";
import { ResponseMessage } from "../../../shared/decorators/response.decorator";
import { responseMessage } from "../../../shared/utils/constant";

@ApiTags("Notification Templates")
@Controller("notification-templates")
export class NotificationTemplateController {
  constructor(
    private readonly notificationTemplateService: NotificationTemplateService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({ summary: "Create a new notification template" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Notification template created successfully",
    type: NotificationTemplateResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data"
  })
  async create(
    @Body() createNotificationTemplateDto: CreateNotificationTemplateDto
  ): Promise<NotificationTemplateResponseDto> {
    return await this.notificationTemplateService.create(
      createNotificationTemplateDto
    );
  }

  @Get()
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get all notification templates with pagination" })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number"
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page"
  })
  @ApiQuery({
    name: "stageTemplateId",
    required: false,
    type: String,
    description: "Filter by stage template ID"
  })
  @ApiQuery({
    name: "triggerEvent",
    required: false,
    type: String,
    description: "Filter by trigger event"
  })
  @ApiQuery({
    name: "isActive",
    required: false,
    type: Boolean,
    description: "Filter by active status"
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search in name, subject, and body templates"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notification templates retrieved successfully",
    type: Object
  })
  async findAll(
    @Query() paginationDto: BaseFindAllDto,
    @Query("stageTemplateId") stageTemplateId?: string,
    @Query("triggerEvent") triggerEvent?: string,
    @Query("isActive") isActive?: boolean,
    @Query("search") search?: string
  ): Promise<PaginationResultInterface<NotificationTemplateResponseDto>> {
    return await this.notificationTemplateService.findAll(paginationDto, {
      stageTemplateId,
      triggerEvent,
      isActive,
      search
    });
  }

  @Get("trigger-events")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get all available trigger events" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Trigger events retrieved successfully",
    type: [String]
  })
  async getTriggerEvents(): Promise<string[]> {
    return await this.notificationTemplateService.getTriggerEvents();
  }

  @Get("by-stage-template/:stageTemplateId")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get notification templates by stage template ID" })
  @ApiParam({ name: "stageTemplateId", description: "Stage template ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notification templates retrieved successfully",
    type: [NotificationTemplateResponseDto]
  })
  async findByStageTemplateId(
    @Param("stageTemplateId") stageTemplateId: string
  ): Promise<NotificationTemplateResponseDto[]> {
    return await this.notificationTemplateService.findByStageTemplateId(
      stageTemplateId
    );
  }

  @Get("by-trigger-event/:triggerEvent")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get notification templates by trigger event" })
  @ApiParam({ name: "triggerEvent", description: "Trigger event" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notification templates retrieved successfully",
    type: [NotificationTemplateResponseDto]
  })
  async findByTriggerEvent(
    @Param("triggerEvent") triggerEvent: string
  ): Promise<NotificationTemplateResponseDto[]> {
    return await this.notificationTemplateService.findByTriggerEvent(
      triggerEvent
    );
  }

  @Get("by-stage-template-and-trigger/:stageTemplateId/:triggerEvent")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get notification template by stage template and trigger event"
  })
  @ApiParam({ name: "stageTemplateId", description: "Stage template ID" })
  @ApiParam({ name: "triggerEvent", description: "Trigger event" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notification template retrieved successfully",
    type: NotificationTemplateResponseDto
  })
  async findByStageTemplateAndTrigger(
    @Param("stageTemplateId") stageTemplateId: string,
    @Param("triggerEvent") triggerEvent: string
  ): Promise<NotificationTemplateResponseDto | null> {
    return await this.notificationTemplateService.findByStageTemplateAndTrigger(
      stageTemplateId,
      triggerEvent
    );
  }

  @Get(":id")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get a notification template by ID" })
  @ApiParam({ name: "id", description: "Notification template ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notification template retrieved successfully",
    type: NotificationTemplateResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Notification template not found"
  })
  async findOne(
    @Param("id") id: string
  ): Promise<NotificationTemplateResponseDto> {
    return await this.notificationTemplateService.findOne(id);
  }

  @Patch(":id")
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({ summary: "Update a notification template" })
  @ApiParam({ name: "id", description: "Notification template ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notification template updated successfully",
    type: NotificationTemplateResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Notification template not found"
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data"
  })
  async update(
    @Param("id") id: string,
    @Body() updateNotificationTemplateDto: UpdateNotificationTemplateDto
  ): Promise<NotificationTemplateResponseDto> {
    return await this.notificationTemplateService.update(
      id,
      updateNotificationTemplateDto
    );
  }

  @Post(":id/duplicate")
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({ summary: "Duplicate a notification template" })
  @ApiParam({
    name: "id",
    description: "Notification template ID to duplicate"
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Notification template duplicated successfully",
    type: NotificationTemplateResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Notification template not found"
  })
  async duplicate(
    @Param("id") id: string,
    @Body() body: { newName: string }
  ): Promise<NotificationTemplateResponseDto> {
    return await this.notificationTemplateService.duplicate(id, body.newName);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_DELETED)
  @ApiOperation({ summary: "Delete a notification template" })
  @ApiParam({ name: "id", description: "Notification template ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notification template deleted successfully",
    type: Object
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Notification template not found"
  })
  async remove(@Param("id") id: string): Promise<{ message: string }> {
    return await this.notificationTemplateService.remove(id);
  }
}
