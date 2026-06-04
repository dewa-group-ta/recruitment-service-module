import {
  Controller,
  Get,
  Param,
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
import { VacancyService } from "../services/vacancy.service";
import { FileUploadService } from "../../../shared/services/file-upload.service";
import { PublicVacancyResponseDto } from "../dto/public-vacancy-response.dto";
import { ResponseMessage } from "../../../shared/decorators/response.decorator";
import { responseMessage } from "src/shared/utils/constant";
import { Public } from "src/shared/decorators/public.decorator";

@Public()
@ApiTags("Public Vacancies")
@Controller("public/vacancies")
export class PublicVacancyController {
  constructor(
    private readonly vacancyService: VacancyService,
    private readonly fileUploadService: FileUploadService
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all public job vacancies",
    description:
      "Retrieve all active and published job vacancies for public access. Only shows vacancies that are currently active and not expired."
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
  @ApiResponse({
    status: 200,
    description: "Public job vacancies retrieved successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Public job vacancies retrieved successfully",
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
            jobType: "RECRUITMENT",
            employmentType: "FULL_TIME",
            workModel: "hybrid",
            officeAddresses: ["Jakarta Office", "Surabaya Office"],
            applicationDeadline: "2024-12-31T23:59:59.000Z",
            expectedStartDate: "2024-01-15",
            requiredEducation: "BACHELOR",
            requiredExperienceYears: 3,
            jobCategory: {
              id: "uuid-string",
              name: "Software Engineering"
            },
            generatedPosterUrl: "vacancy-poster-123.jpg"
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
    @Query("jobCategory") jobCategory?: string
  ): Promise<{
    data: PublicVacancyResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const result = await this.vacancyService.findAllPublic(
      page || 1,
      limit || 10,
      jobCategory
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

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get public vacancy by ID",
    description:
      "Retrieve a specific active and published vacancy by its ID for public access."
  })
  @ApiParam({
    name: "id",
    description: "Vacancy ID",
    example: "uuid-string"
  })
  @ApiResponse({
    status: 200,
    description: "Public vacancy retrieved successfully",
    type: PublicVacancyResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Public vacancy not found"
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error"
  })
  async findOne(@Param("id") id: string): Promise<PublicVacancyResponseDto> {
    const vacancy = await this.vacancyService.findOnePublic(id);

    return vacancy;
  }
}
