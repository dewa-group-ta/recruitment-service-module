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
import { PipelineStageService } from "../services/pipeline-stage.service";
import {
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
  PipelineStageResponseDto
} from "../dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";
import { PaginationResultInterface } from "../../../shared/paginate/pagination.results.interface";
import { ResponseMessage } from "../../../shared/decorators/response.decorator";
import { responseMessage } from "../../../shared/utils/constant";

@ApiTags("Pipeline Stages")
@Controller("pipeline-stages")
export class PipelineStageController {
  constructor(private readonly pipelineStageService: PipelineStageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({ summary: "Create a new pipeline stage" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Pipeline stage created successfully",
    type: PipelineStageResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data"
  })
  async create(
    @Body() createPipelineStageDto: CreatePipelineStageDto
  ): Promise<PipelineStageResponseDto> {
    return await this.pipelineStageService.create(createPipelineStageDto);
  }

  @Get()
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get all pipeline stages with pagination" })
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
    name: "pipelineId",
    required: false,
    type: String,
    description: "Filter by pipeline ID"
  })
  @ApiQuery({
    name: "stageTemplateId",
    required: false,
    type: String,
    description: "Filter by stage template ID"
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search in pipeline and stage template names"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Pipeline stages retrieved successfully",
    type: Object
  })
  async findAll(
    @Query() paginationDto: BaseFindAllDto,
    @Query("pipelineId") pipelineId?: string,
    @Query("stageTemplateId") stageTemplateId?: string,
    @Query("search") search?: string
  ): Promise<PaginationResultInterface<PipelineStageResponseDto>> {
    return await this.pipelineStageService.findAll(paginationDto, {
      pipelineId,
      stageTemplateId,
      search
    });
  }

  @Get("by-pipeline/:pipelineId")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get pipeline stages by pipeline ID" })
  @ApiParam({ name: "pipelineId", description: "Pipeline ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Pipeline stages retrieved successfully",
    type: [PipelineStageResponseDto]
  })
  async findByPipelineId(
    @Param("pipelineId") pipelineId: string
  ): Promise<PipelineStageResponseDto[]> {
    return await this.pipelineStageService.findByPipelineId(pipelineId);
  }

  @Get("by-stage-template/:stageTemplateId")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get pipeline stages by stage template ID" })
  @ApiParam({ name: "stageTemplateId", description: "Stage template ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Pipeline stages retrieved successfully",
    type: [PipelineStageResponseDto]
  })
  async findByStageTemplateId(
    @Param("stageTemplateId") stageTemplateId: string
  ): Promise<PipelineStageResponseDto[]> {
    return await this.pipelineStageService.findByStageTemplateId(
      stageTemplateId
    );
  }

  @Get("next-order/:pipelineId")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get next available stage order for a pipeline" })
  @ApiParam({ name: "pipelineId", description: "Pipeline ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Next stage order retrieved successfully",
    type: Number
  })
  async getNextStageOrder(
    @Param("pipelineId") pipelineId: string
  ): Promise<number> {
    return await this.pipelineStageService.getNextStageOrder(pipelineId);
  }

  @Get(":id")
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Get a pipeline stage by ID" })
  @ApiParam({ name: "id", description: "Pipeline stage ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Pipeline stage retrieved successfully",
    type: PipelineStageResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Pipeline stage not found"
  })
  async findOne(@Param("id") id: string): Promise<PipelineStageResponseDto> {
    return await this.pipelineStageService.findOne(id);
  }

  @Patch(":id")
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({ summary: "Update a pipeline stage" })
  @ApiParam({ name: "id", description: "Pipeline stage ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Pipeline stage updated successfully",
    type: PipelineStageResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Pipeline stage not found"
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data"
  })
  async update(
    @Param("id") id: string,
    @Body() updatePipelineStageDto: UpdatePipelineStageDto
  ): Promise<PipelineStageResponseDto> {
    return await this.pipelineStageService.update(id, updatePipelineStageDto);
  }

  @Patch("reorder/:pipelineId")
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({ summary: "Reorder pipeline stages" })
  @ApiParam({ name: "pipelineId", description: "Pipeline ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Pipeline stages reordered successfully",
    type: Object
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid reorder data"
  })
  async reorderStages(
    @Param("pipelineId") pipelineId: string,
    @Body() stageOrders: { stageId: string; newOrder: number }[]
  ): Promise<{ message: string }> {
    return await this.pipelineStageService.reorderStages(
      pipelineId,
      stageOrders
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_DELETED)
  @ApiOperation({ summary: "Delete a pipeline stage" })
  @ApiParam({ name: "id", description: "Pipeline stage ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Pipeline stage deleted successfully",
    type: Object
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Pipeline stage not found"
  })
  async remove(@Param("id") id: string): Promise<{ message: string }> {
    return await this.pipelineStageService.remove(id);
  }
}
