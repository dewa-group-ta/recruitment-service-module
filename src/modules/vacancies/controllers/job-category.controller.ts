import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery
} from "@nestjs/swagger";
import { JobCategoryService } from "../services/job-category.service";
import { CreateJobCategoryDto } from "../dto/create-job-category.dto";
import { UpdateJobCategoryDto } from "../dto/update-job-category.dto";
import { JobCategoryResponseDto } from "../dto/job-category-response.dto";
import { Pagination } from "../../../shared/paginate/pagination";
import { Public } from "../../../shared/decorators/public.decorator";
import { responseMessage } from "src/shared/utils/constant";
import { ResponseMessage } from "src/shared/decorators/response.decorator";
import { QueryJobCategoryDto } from "../dto/query-job-category.dto";

@ApiTags("Job Categories")
@Controller("job-categories")
export class JobCategoryController {
  constructor(private readonly jobCategoryService: JobCategoryService) {}

  @Post()
  @ApiOperation({ summary: "Create a new job category" })
  @ApiResponse({
    status: 201,
    description: "Job category created successfully",
    type: JobCategoryResponseDto
  })
  @ApiResponse({
    status: 409,
    description: "Job category with this name or code already exists"
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data"
  })
  async create(
    @Body() createJobCategoryDto: CreateJobCategoryDto
  ): Promise<JobCategoryResponseDto> {
    return this.jobCategoryService.create(createJobCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all job categories with pagination" })
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
    name: "keyword",
    required: false,
    type: String,
    description: "Search term"
  })
  @ApiQuery({
    name: "sort_by",
    required: false,
    type: String,
    description: "Sort field"
  })
  @ApiQuery({
    name: "order",
    required: false,
    enum: ["ASC", "DESC"],
    description: "Sort order"
  })
  @ApiResponse({
    status: 200,
    description: "Job categories retrieved successfully",
    type: Pagination<JobCategoryResponseDto>
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  async findAll(
    @Query() paginationDto: QueryJobCategoryDto
  ): Promise<Pagination<JobCategoryResponseDto>> {
    return this.jobCategoryService.findAll(paginationDto);
  }

  @Get("active")
  @Public()
  @ApiOperation({ summary: "Get all active job categories" })
  @ApiResponse({
    status: 200,
    description: "Active job categories retrieved successfully",
    type: [JobCategoryResponseDto]
  })
  async findAllActive(): Promise<JobCategoryResponseDto[]> {
    return this.jobCategoryService.findAllActive();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a job category by ID" })
  @ApiParam({ name: "id", description: "Job category ID" })
  @ApiResponse({
    status: 200,
    description: "Job category retrieved successfully",
    type: JobCategoryResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Job category not found"
  })
  async findOne(@Param("id") id: string): Promise<JobCategoryResponseDto> {
    return this.jobCategoryService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a job category" })
  @ApiParam({ name: "id", description: "Job category ID" })
  @ApiResponse({
    status: 200,
    description: "Job category updated successfully",
    type: JobCategoryResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Job category not found"
  })
  @ApiResponse({
    status: 409,
    description: "Job category with this name or code already exists"
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data"
  })
  async update(
    @Param("id") id: string,
    @Body() updateJobCategoryDto: UpdateJobCategoryDto
  ): Promise<JobCategoryResponseDto> {
    return this.jobCategoryService.update(id, updateJobCategoryDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a job category" })
  @ApiParam({ name: "id", description: "Job category ID" })
  @ApiResponse({
    status: 204,
    description: "Job category deleted successfully"
  })
  @ApiResponse({
    status: 404,
    description: "Job category not found"
  })
  @ApiResponse({
    status: 409,
    description: "Cannot delete job category with active vacancies"
  })
  async remove(@Param("id") id: string): Promise<void> {
    return this.jobCategoryService.remove(id);
  }

  @Post(":id/restore")
  @ApiOperation({ summary: "Restore a deleted job category" })
  @ApiParam({ name: "id", description: "Job category ID" })
  @ApiResponse({
    status: 200,
    description: "Job category restored successfully",
    type: JobCategoryResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Job category not found"
  })
  @ApiResponse({
    status: 409,
    description: "Job category is not deleted"
  })
  async restore(@Param("id") id: string): Promise<JobCategoryResponseDto> {
    return this.jobCategoryService.restore(id);
  }
}
