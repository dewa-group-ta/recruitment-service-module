import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes
} from "@nestjs/swagger";
import { VacancyService } from "../services/vacancy.service";
import { CreateVacancyDto } from "../dto/create-vacancy.dto";
import { UpdateVacancyDto } from "../dto/update-vacancy.dto";
import { VacancyResponseDto } from "../dto/vacancy-response.dto";
import { ResponseMessage } from "../../../shared/decorators/response.decorator";
import { responseMessage } from "../../../shared/utils/constant";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileUploadService } from "../../../shared/services/file-upload.service";
import { FileValidationPipe } from "../../../shared/pipes/file-validation.pipe";
import { FileType } from "../../../shared/entities/file.entity";
import { FileUploadDto } from "../../../shared/dto/file-upload.dto";
import { AuthenticatedRequest } from "src/shared/interface";

@ApiTags("Vacancies")
@Controller("vacancies")
export class VacancyController {
  constructor(
    private readonly vacancyService: VacancyService,
    private readonly fileUploadService: FileUploadService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({
    summary: "Create a new vacancy",
    description:
      "Create a new vacancy with only title validation. This is the first step in the vacancy creation flow."
  })
  @ApiBody({
    type: CreateVacancyDto,
    description: "Vacancy data with title"
  })
  @ApiResponse({
    status: 201,
    description: "Vacancy created successfully",
    type: VacancyResponseDto
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input data"
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing authentication token"
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error"
  })
  async create(
    @Body() createVacancyDto: CreateVacancyDto,
    @Request() req: AuthenticatedRequest
  ): Promise<VacancyResponseDto> {
    const createdById = req.user?.id || "placeholder-user-id";

    return await this.vacancyService.create(createVacancyDto, createdById);
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({
    summary: "Update vacancy details",
    description:
      "Update vacancy with detailed information including pipeline, department, salary, and other details. This is the second step in the vacancy creation flow. Can handle both standard UpdateVacancyDto and job form data from InputJobDetails.vue."
  })
  @ApiParam({
    name: "id",
    description: "Vacancy ID",
    example: "uuid-string"
  })
  @ApiBody({
    type: UpdateVacancyDto,
    description: "Updated vacancy data - can be standard DTO or job form data"
  })
  @ApiResponse({
    status: 200,
    description: "Vacancy updated successfully",
    type: VacancyResponseDto
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input data or validation errors"
  })
  @ApiResponse({
    status: 404,
    description: "Vacancy not found"
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing authentication token"
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error"
  })
  async update(
    @Param("id") id: string,
    @Body() updateData: UpdateVacancyDto | Record<string, any>,
    @Request() req: AuthenticatedRequest
  ): Promise<VacancyResponseDto> {
    // In a real implementation, you would get the user ID from the authenticated request
    const updatedById = req.user?.id || "placeholder-user-id";

    // Check if this is job form data (has jobTitle field)
    if ((updateData as any).jobTitle) {
      // This is job form data from InputJobDetails.vue
      const vacancy = await this.vacancyService.updateFromJobForm(
        id,
        updateData,
        updatedById
      );
      return vacancy;
    } else {
      // This is standard UpdateVacancyDto
      const vacancy = await this.vacancyService.update(
        id,
        updateData,
        updatedById
      );
      return vacancy;
    }
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get vacancy by ID",
    description: "Retrieve a specific vacancy by its ID."
  })
  @ApiParam({
    name: "id",
    description: "Vacancy ID",
    example: "uuid-string"
  })
  @ApiResponse({
    status: 200,
    description: "Vacancy retrieved successfully",
    type: VacancyResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Vacancy not found"
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error"
  })
  async findOne(@Param("id") id: string): Promise<VacancyResponseDto> {
    const vacancy = await this.vacancyService.findOne(id);

    return vacancy;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all job vacancies",
    description: "Retrieve all job vacancies with pagination support."
  })
  @ApiQuery({
    name: "page",
    description: "Page number",
    required: false,
    example: 1,
    type: Number
  })
  @ApiQuery({
    name: "limit",
    description: "Number of items per page",
    required: false,
    example: 10,
    type: Number
  })
  @ApiQuery({
    name: "jobCategory",
    description: "Filter by job category ID",
    required: false,
    example: "uuid-string",
    type: String
  })
  @ApiQuery({
    name: "status",
    description: "Filter by job status",
    required: false,
    example: "published",
    type: String,
    enum: ["draft", "published", "paused", "closed", "archived"]
  })
  @ApiQuery({
    name: "search",
    description: "Search in job title, description, and department",
    required: false,
    example: "software engineer",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Job vacancies retrieved successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Job vacancies retrieved successfully",
        data: [
          {
            id: "uuid-string",
            title: "Senior Software Engineer",
            description:
              "We are looking for an experienced software engineer...",
            responsibilities:
              "Develop and maintain web applications, collaborate with cross-functional teams...",
            requirements:
              "Bachelor degree in Computer Science, 3+ years experience with React and Node.js...",
            status: "DRAFT",
            jobType: "RECRUITMENT",
            employmentType: "FULL_TIME",
            workModel: "hybrid",
            applicantLimit: 100,
            hiredLimit: 5,
            officeAddresses: ["Jakarta Office", "Surabaya Office"],
            salaryMin: 10000000,
            salaryMax: 20000000,
            salaryPeriod: "MONTHLY",
            currency: "IDR",
            requiredEducation: "BACHELOR",
            requiredExperienceYears: 3,
            hoursPerWeekMin: 40,
            hoursPerWeekMax: 40,
            applicationDeadline: "2024-12-31T23:59:59.000Z",
            expectedStartDate: "2024-01-15",
            publishedAt: "2024-01-01T00:00:00.000Z",
            archivedAt: null,
            closedAt: null,
            pipelineId: "uuid-string",
            departmentId: "uuid-string",
            createdById: "uuid-string",
            updatedById: "uuid-string",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
            totalApplicants: 25,
            hiredApplicants: 3,
            rejectedApplicants: 8
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error"
  })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("jobCategory") jobCategory?: string,
    @Query("status") status?: string,
    @Query("search") search?: string
  ): Promise<{
    data: (VacancyResponseDto & {
      totalApplicants: number;
      hiredApplicants: number;
      rejectedApplicants: number;
    })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const result = await this.vacancyService.findAll(
      page || 1,
      limit || 10,
      jobCategory,
      status,
      search
    );

    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage(responseMessage.SUCCESSFULLY_DELETED)
  @ApiOperation({
    summary: "Delete vacancy",
    description: "Soft delete a vacancy by its ID."
  })
  @ApiParam({
    name: "id",
    description: "Vacancy ID",
    example: "uuid-string"
  })
  @ApiResponse({
    status: 204,
    description: "Vacancy deleted successfully"
  })
  @ApiResponse({
    status: 404,
    description: "Vacancy not found"
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing authentication token"
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error"
  })
  async remove(@Param("id") id: string, @Request() req: any): Promise<void> {
    // In a real implementation, you would get the user ID from the authenticated request
    const deletedById = req.user?.id || "placeholder-user-id";

    await this.vacancyService.remove(id, deletedById);
  }

  @Post(":id/upload-job-description")
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Upload job description file",
    description: "Upload job description file for a specific vacancy"
  })
  @ApiParam({
    name: "id",
    description: "Vacancy ID",
    example: "uuid-string"
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary"
        },
        description: {
          type: "string"
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: "Job description file uploaded successfully"
  })
  async uploadJobDescription(
    @Param("id", ParseUUIDPipe) vacancyId: string,
    @Request() req: AuthenticatedRequest,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ],
        allowedExtensions: ["pdf", "doc", "docx"]
      })
    )
    file: Express.Multer.File,
    @Body() uploadDto: Partial<FileUploadDto>
  ) {
    const uploadedById = req.user?.id || "placeholder-user-id";

    const fileUploadData: FileUploadDto = {
      fileType: FileType.JOB_DESCRIPTION,
      description: uploadDto.description,
      folder: "vacancies/job-descriptions",
      relatedEntity: "vacancy",
      relatedEntityId: vacancyId
    };

    const result = await this.fileUploadService.uploadFile(
      file,
      fileUploadData,
      uploadedById
    );

    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Job description file uploaded successfully",
      data: result
    };
  }

  @Post(":id/upload-company-logo")
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Upload company logo",
    description: "Upload company logo for a specific vacancy"
  })
  @ApiParam({
    name: "id",
    description: "Vacancy ID",
    example: "uuid-string"
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary"
        },
        description: {
          type: "string"
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: "Company logo uploaded successfully"
  })
  async uploadCompanyLogo(
    @Param("id", ParseUUIDPipe) vacancyId: string,
    @Request() req: AuthenticatedRequest,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp"
        ],
        allowedExtensions: ["jpg", "jpeg", "png", "gif", "webp"]
      })
    )
    file: Express.Multer.File,
    @Body() uploadDto: Partial<FileUploadDto>
  ) {
    const uploadedById = req.user?.id || "placeholder-user-id";

    const fileUploadData: FileUploadDto = {
      fileType: FileType.COMPANY_LOGO,
      description: uploadDto.description,
      folder: "vacancies/company-logos",
      relatedEntity: "vacancy",
      relatedEntityId: vacancyId
    };

    const result = await this.fileUploadService.uploadFile(
      file,
      fileUploadData,
      uploadedById
    );

    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Company logo uploaded successfully",
      data: result
    };
  }

  @Get(":id/files")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get vacancy files",
    description: "Get all files uploaded for a specific vacancy"
  })
  @ApiParam({
    name: "id",
    description: "Vacancy ID",
    example: "uuid-string"
  })
  @ApiResponse({
    status: 200,
    description: "Files retrieved successfully"
  })
  async getVacancyFiles(@Param("id", ParseUUIDPipe) vacancyId: string) {
    const files = await this.fileUploadService.getFilesByEntity(
      "vacancy",
      vacancyId
    );

    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Files retrieved successfully",
      data: files
    };
  }

  @Delete(":id/files/:fileId")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Delete vacancy file",
    description: "Delete a file uploaded for a specific vacancy"
  })
  @ApiParam({
    name: "id",
    description: "Vacancy ID",
    example: "uuid-string"
  })
  @ApiParam({
    name: "fileId",
    description: "File ID to delete",
    type: "string",
    format: "uuid"
  })
  @ApiResponse({
    status: 200,
    description: "File deleted successfully"
  })
  async deleteVacancyFile(
    @Param("id", ParseUUIDPipe) vacancyId: string,
    @Param("fileId", ParseUUIDPipe) fileId: string
  ) {
    await this.fileUploadService.deleteFile(fileId);

    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "File deleted successfully",
      data: null
    };
  }
}
