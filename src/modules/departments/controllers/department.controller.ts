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
import { DepartmentService } from "../services/department.service";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentResponseDto,
  QueryDepartmentDto
} from "../dto";
import { PaginationResultInterface } from "../../../shared/paginate/pagination.results.interface";
import { AuthenticatedRequest } from "../../../shared/interface";
import { responseMessage } from "src/shared/utils/constant";
import { ResponseMessage } from "src/shared/decorators/response.decorator";
import { Pagination } from "src/shared/paginate";

@ApiTags("Departments")
@Controller("departments")
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({ summary: "Create a new department" })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Department created successfully",
    type: DepartmentResponseDto
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Department with same name or code already exists"
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data"
  })
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @Req() req: AuthenticatedRequest
  ): Promise<DepartmentResponseDto> {
    // Set createdById from authenticated user
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }
    createDepartmentDto.createdById = req.user.id;
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all departments with pagination and filtering"
  })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiQuery({ name: "keyword", required: false, type: String })
  @ApiQuery({
    name: "sort_by",
    required: false,
    type: String,
    example: "createdAt"
  })
  @ApiQuery({
    name: "order",
    required: false,
    enum: ["ASC", "DESC"],
    example: "DESC"
  })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Departments retrieved successfully",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { $ref: "#/components/schemas/DepartmentResponseDto" }
        },
        page: { type: "number", example: 1 },
        limit: { type: "number", example: 10 },
        total_items: { type: "number", example: 25 },
        total_pages: { type: "number", example: 3 }
      }
    }
  })
  async findAll(
    @Query() queryDto: QueryDepartmentDto
  ): Promise<Pagination<DepartmentResponseDto>> {
    return this.departmentService.findAll(queryDto);
  }

  @Get("active")
  @ApiOperation({ summary: "Get all active departments" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Active departments retrieved successfully",
    type: [DepartmentResponseDto]
  })
  async findActive(): Promise<DepartmentResponseDto[]> {
    return this.departmentService.findActive();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get department by ID" })
  @ApiParam({ name: "id", description: "Department ID", type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Department retrieved successfully",
    type: DepartmentResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Department not found"
  })
  async findOne(@Param("id") id: string): Promise<DepartmentResponseDto> {
    return this.departmentService.findOne(id);
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({ summary: "Update department" })
  @ApiParam({ name: "id", description: "Department ID", type: String })
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Department updated successfully",
    type: DepartmentResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Department not found"
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Department with same name or code already exists"
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data"
  })
  async update(
    @Param("id") id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Req() req: AuthenticatedRequest
  ): Promise<DepartmentResponseDto> {
    // Set updatedById from authenticated user
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }
    updateDepartmentDto.updatedById = req.user.id;
    return this.departmentService.update(id, updateDepartmentDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete department (soft delete)" })
  @ApiParam({ name: "id", description: "Department ID", type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Department deleted successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Department deleted successfully" }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Department not found"
  })
  async remove(
    @Param("id") id: string,
    @Req() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }
    return this.departmentService.remove(id, req.user.id);
  }

  @Patch(":id/restore")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Restore soft deleted department" })
  @ApiParam({ name: "id", description: "Department ID", type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Department restored successfully",
    type: DepartmentResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Department not found"
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Department is not deleted"
  })
  async restore(@Param("id") id: string): Promise<DepartmentResponseDto> {
    return this.departmentService.restore(id);
  }
}
