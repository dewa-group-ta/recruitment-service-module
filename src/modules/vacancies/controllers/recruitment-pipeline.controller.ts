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
  HttpCode,
  Req,
  BadRequestException
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody
} from "@nestjs/swagger";
import { RecruitmentPipelineService } from "../services/recruitment-pipeline.service";
import {
  CreateRecruitmentPipelineDto,
  UpdateRecruitmentPipelineDto,
  RecruitmentPipelineResponseDto
} from "../dto";
import { FindAllPipelinesDto } from "../dto/find-all-pipelines.dto";

import { ResponseMessage } from "../../../shared/decorators/response.decorator";
import { responseMessage } from "../../../shared/utils/constant";
import { AuthenticatedRequest } from "../../../shared/interface";

@ApiTags("Recruitment Pipelines")
@Controller("recruitment-pipelines")
export class RecruitmentPipelineController {
  constructor(
    private readonly recruitmentPipelineService: RecruitmentPipelineService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({ summary: "Create a new recruitment pipeline" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Recruitment pipeline created successfully",
    type: RecruitmentPipelineResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data"
  })
  async create(
    @Body() createRecruitmentPipelineDto: CreateRecruitmentPipelineDto,
    @Req() req: AuthenticatedRequest
  ): Promise<RecruitmentPipelineResponseDto> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }
    createRecruitmentPipelineDto.createdById = req.user.id;
    return await this.recruitmentPipelineService.create(
      createRecruitmentPipelineDto
    );
  }

  @Get()
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get all recruitment pipelines with pagination" })
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
    name: "category",
    required: false,
    type: String,
    description: "Filter by category"
  })
  @ApiQuery({
    name: "isActive",
    required: false,
    type: Boolean,
    description: "Filter by active status"
  })
  @ApiQuery({
    name: "isTemplate",
    required: false,
    type: Boolean,
    description: "Filter by template status"
  })
  @ApiQuery({
    name: "isDefault",
    required: false,
    type: Boolean,
    description: "Filter by default status"
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search in name and description"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Recruitment pipelines retrieved successfully",
    type: Object
  })
  async findAll(
    @Query() query: FindAllPipelinesDto
  ): Promise<{ data: RecruitmentPipelineResponseDto[]; pagination: object }> {
    const { isActive, isTemplate, isDefault, category, search, ...paginationDto } = query;
    return await this.recruitmentPipelineService.findAll(paginationDto, {
      category,
      isActive,
      isTemplate,
      isDefault,
      search
    });
  }

  @Get("categories")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get all available categories" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Categories retrieved successfully",
    type: [String]
  })
  async getCategories(): Promise<string[]> {
    return await this.recruitmentPipelineService.getCategories();
  }

  @Get("templates")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get all template recruitment pipelines" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Template pipelines retrieved successfully",
    type: [RecruitmentPipelineResponseDto]
  })
  async findTemplates(): Promise<RecruitmentPipelineResponseDto[]> {
    return await this.recruitmentPipelineService.findTemplates();
  }

  @Get("default")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get the default recruitment pipeline" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Default pipeline retrieved successfully",
    type: RecruitmentPipelineResponseDto
  })
  async getDefault(): Promise<RecruitmentPipelineResponseDto | null> {
    return await this.recruitmentPipelineService.getDefault();
  }

  @Get("by-category/:category")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get recruitment pipelines by category" })
  @ApiParam({ name: "category", description: "Category name" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Recruitment pipelines retrieved successfully",
    type: [RecruitmentPipelineResponseDto]
  })
  async findByCategory(
    @Param("category") category: string
  ): Promise<RecruitmentPipelineResponseDto[]> {
    return await this.recruitmentPipelineService.findByCategory(category);
  }

  // ─── PINDAHAN: harus di atas @Get(":id") agar tidak tertangkap sebagai :id ───
  @Get("default-template")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get the default template pipeline" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Default template pipeline retrieved successfully",
    type: Object
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "No default template pipeline found"
  })
  async getDefaultTemplate(): Promise<RecruitmentPipelineResponseDto | null> {
    return await this.recruitmentPipelineService.getDefaultTemplate();
  }

  @Get(":id")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get a recruitment pipeline by ID" })
  @ApiParam({ name: "id", description: "Recruitment pipeline ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Recruitment pipeline retrieved successfully",
    type: RecruitmentPipelineResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Recruitment pipeline not found"
  })
  async findOne(
    @Param("id") id: string
  ): Promise<RecruitmentPipelineResponseDto> {
    return await this.recruitmentPipelineService.findOne(id);
  }

  @Patch(":id")
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({ summary: "Update a recruitment pipeline" })
  @ApiParam({ name: "id", description: "Recruitment pipeline ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Recruitment pipeline updated successfully",
    type: RecruitmentPipelineResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Recruitment pipeline not found"
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data"
  })
  async update(
    @Param("id") id: string,
    @Body() updateRecruitmentPipelineDto: UpdateRecruitmentPipelineDto
  ): Promise<RecruitmentPipelineResponseDto> {
    return await this.recruitmentPipelineService.update(
      id,
      updateRecruitmentPipelineDto
    );
  }

  @Patch(":id/set-default")
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({ summary: "Set a recruitment pipeline as default" })
  @ApiParam({ name: "id", description: "Recruitment pipeline ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Recruitment pipeline set as default successfully",
    type: RecruitmentPipelineResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Recruitment pipeline not found"
  })
  async setAsDefault(
    @Param("id") id: string
  ): Promise<RecruitmentPipelineResponseDto> {
    return await this.recruitmentPipelineService.setAsDefault(id);
  }

  @Patch(":id/increment-usage")
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({ summary: "Increment usage count for a template pipeline" })
  @ApiParam({ name: "id", description: "Recruitment pipeline ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Usage count incremented successfully",
    type: RecruitmentPipelineResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Recruitment pipeline not found"
  })
  async incrementUsageCount(
    @Param("id") id: string
  ): Promise<RecruitmentPipelineResponseDto> {
    return await this.recruitmentPipelineService.incrementUsageCount(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_DELETED)
  @ApiOperation({ summary: "Delete a recruitment pipeline" })
  @ApiParam({ name: "id", description: "Recruitment pipeline ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Recruitment pipeline deleted successfully",
    type: Object
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Recruitment pipeline not found"
  })
  async remove(@Param("id") id: string): Promise<{ message: string }> {
    return await this.recruitmentPipelineService.remove(id);
  }

  @Post(":id/create-from-template")
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Create a pipeline instance from a template" })
  @ApiParam({
    name: "id",
    description: "Template pipeline ID",
    type: String
  })
  @ApiBody({
    description: "Custom name for the new pipeline instance",
    schema: {
      type: "object",
      properties: {
        customName: {
          type: "string",
          description: "Optional custom name for the new pipeline",
          example: "Engineering Pipeline - Q1 2024"
        }
      }
    },
    required: false
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Pipeline instance created successfully from template",
    type: Object
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Template pipeline not found"
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid request data"
  })
  async createFromTemplate(
    @Param("id") templateId: string,
    @Body() body: { customName?: string },
    @Req() req: AuthenticatedRequest
  ): Promise<RecruitmentPipelineResponseDto> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.recruitmentPipelineService.createFromTemplate(
      templateId,
      req.user.id,
      body.customName
    );
  }

  @Patch(":id/replace-stages-from-template/:templateId")
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({
    summary: "Replace stages in existing pipeline with stages from template"
  })
  @ApiParam({ name: "id", description: "Existing pipeline ID" })
  @ApiParam({
    name: "templateId",
    description: "Template pipeline ID to copy stages from"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Pipeline stages replaced successfully",
    type: RecruitmentPipelineResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Pipeline or template not found"
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid request data"
  })
  async replaceStagesFromTemplate(
    @Param("id") pipelineId: string,
    @Param("templateId") templateId: string
  ): Promise<RecruitmentPipelineResponseDto> {
    return await this.recruitmentPipelineService.replaceStagesFromTemplate(
      pipelineId,
      templateId
    );
  }
}