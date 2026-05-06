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
  BadRequestException
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery
} from "@nestjs/swagger";
import { StageTemplateService } from "../services/stage-template.service";
import {
  CreateStageTemplateDto,
  UpdateStageTemplateDto,
  StageTemplateResponseDto
} from "../dto";
import { Pagination } from "../../../shared/paginate/pagination";
import { QueryStageTemplateDto } from "../dto/query-stage-template.dto";
import { ResponseMessage } from "../../../shared/decorators/response.decorator";
import { responseMessage } from "../../../shared/utils/constant";

@ApiTags("Stage Templates")
@Controller("stage-templates")
export class StageTemplateController {
  constructor(private readonly stageTemplateService: StageTemplateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({ summary: "Create a new stage template" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Stage template created successfully",
    type: StageTemplateResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data"
  })
  async create(
    @Body() createStageTemplateDto: CreateStageTemplateDto
  ): Promise<StageTemplateResponseDto> {
    return await this.stageTemplateService.create(createStageTemplateDto);
  }

  @Get()
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get all stage templates with pagination" })
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
    name: "search",
    required: false,
    type: String,
    description: "Search in name and description"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Stage templates retrieved successfully",
    type: Object
  })
  async findAll(
    @Query() queryDto: QueryStageTemplateDto
  ): Promise<Pagination<StageTemplateResponseDto>> {
    const { category, isActive, search, ...paginationDto } = queryDto;
    return await this.stageTemplateService.findAll(paginationDto, {
      category,
      isActive,
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
    return await this.stageTemplateService.getCategories();
  }

  @Get("by-category/:category")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get stage templates by category" })
  @ApiParam({ name: "category", description: "Category name" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Stage templates retrieved successfully",
    type: [StageTemplateResponseDto]
  })
  async findByCategory(
    @Param("category") category: string
  ): Promise<StageTemplateResponseDto[]> {
    return await this.stageTemplateService.findByCategory(category);
  }

  @Get("bulk")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get stage templates by IDs (bulk fetch)" })
  @ApiQuery({
    name: "ids",
    required: true,
    type: [String],
    description: "Array of stage template IDs",
    isArray: true,
    example: [
      "cd4570cb-14a4-4ea5-98f3-b25791abff97",
      "21b81fcd-0b4a-4310-8577-5da452b6b245"
    ]
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Stage templates retrieved successfully",
    type: [StageTemplateResponseDto]
  })
  async findByIds(
    @Query("ids") ids: string | string[]
  ): Promise<StageTemplateResponseDto[]> {
    // Handle both single value and array values
    const idsArray = Array.isArray(ids) ? ids : [ids];

    // Filter out any undefined or empty values
    const validIds = idsArray.filter((id) => id && id.trim() !== "");

    if (validIds.length === 0) {
      throw new BadRequestException("At least one valid ID must be provided");
    }

    return await this.stageTemplateService.findByIds(validIds);
  }

  @Get(":id")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get a stage template by ID" })
  @ApiParam({ name: "id", description: "Stage template ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Stage template retrieved successfully",
    type: StageTemplateResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Stage template not found"
  })
  async findOne(@Param("id") id: string): Promise<StageTemplateResponseDto> {
    return await this.stageTemplateService.findOne(id);
  }

  @Patch(":id")
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({ summary: "Update a stage template" })
  @ApiParam({ name: "id", description: "Stage template ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Stage template updated successfully",
    type: StageTemplateResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Stage template not found"
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data"
  })
  async update(
    @Param("id") id: string,
    @Body() updateStageTemplateDto: UpdateStageTemplateDto
  ): Promise<StageTemplateResponseDto> {
    return await this.stageTemplateService.update(id, updateStageTemplateDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_DELETED)
  @ApiOperation({ summary: "Delete a stage template" })
  @ApiParam({ name: "id", description: "Stage template ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Stage template deleted successfully",
    type: Object
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Stage template not found"
  })
  async remove(@Param("id") id: string): Promise<{ message: string }> {
    return await this.stageTemplateService.remove(id);
  }
}
