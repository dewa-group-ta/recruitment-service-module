import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query
} from "@nestjs/common";
import { ApplicantSourceService } from "../services/applicant-source.service";
import { CreateApplicantSourceDto } from "../dto/create-applicant-source.dto";
import { UpdateApplicantSourceDto } from "../dto/update-applicant-source.dto";
import { ApplicantSourceResponseDto } from "../dto/applicant-source-response.dto";
import { QueryApplicantSourceDto } from "../dto/query-applicant-source.dto";
import { Public } from "../../../shared/decorators/public.decorator";
import { ApplicantSource } from "../entities/applicant-source.entity";
import { Pagination } from "src/shared/paginate";
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiBearerAuth
} from "@nestjs/swagger";
import { IsRole } from "src/shared/decorators/roles.decorator";
import { responseMessage, role } from "src/shared/utils/constant";
import { ResponseMessage } from "src/shared/decorators/response.decorator";

@ApiTags("Applicant Sources")
@Controller("applicants/sources")
@IsRole(role.HR_MANAGER)
export class ApplicantSourceController {
  constructor(
    private readonly applicantSourceService: ApplicantSourceService
  ) {}

  @Post()
  @IsRole(role.HR_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a new applicant source",
    description:
      "Create a new applicant source for tracking where applicants come from"
  })
  @ApiBody({
    type: CreateApplicantSourceDto,
    description: "Applicant source data including name, description, and status"
  })
  @ApiResponse({
    status: 201,
    description: "Applicant source created successfully",
    type: ApplicantSourceResponseDto
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input data",
    schema: {
      example: {
        responseCode: responseMessage.BAD_REQUEST.caseCode,
        responseDesc: "Validation failed",
        data: null
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    schema: {
      example: {
        responseCode: responseMessage.UNAUTHORIZED_AUTH.caseCode,
        responseDesc: "Unauthorized access",
        data: null
      }
    }
  })
  async create(
    @Body() createApplicantSourceDto: CreateApplicantSourceDto
  ): Promise<ApplicantSource> {
    return await this.applicantSourceService.create(createApplicantSourceDto);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiQuery({ type: QueryApplicantSourceDto })
  @ApiResponse({ type: Pagination<ApplicantSource> })
  async findAll(
    @Query() queryDto: QueryApplicantSourceDto
  ): Promise<Pagination<ApplicantSource>> {
    return await this.applicantSourceService.findWithPagination(queryDto);
  }

  @Get("all")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all applicant sources (simple list)",
    description:
      "Retrieve all applicant sources as a simple list without pagination"
  })
  @ApiResponse({
    status: 200,
    description: "Applicant sources retrieved successfully",
    type: [ApplicantSourceResponseDto]
  })
  async findAllSimple(): Promise<ApplicantSource[]> {
    return await this.applicantSourceService.findAll();
  }

  @Get("active")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all active applicant sources",
    description: "Retrieve all active applicant sources only"
  })
  @ApiResponse({
    status: 200,
    description: "Active applicant sources retrieved successfully",
    type: [ApplicantSourceResponseDto]
  })
  async findActive(): Promise<ApplicantSource[]> {
    return await this.applicantSourceService.findActive();
  }

  @Get(":id")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get applicant source by ID",
    description: "Retrieve a specific applicant source by its unique identifier"
  })
  @ApiParam({
    name: "id",
    description: "Applicant source ID",
    type: "string",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @ApiResponse({
    status: 200,
    description: "Applicant source retrieved successfully",
    type: ApplicantSourceResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Applicant source not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Applicant source not found",
        data: null
      }
    }
  })
  async findOne(@Param("id") id: string): Promise<ApplicantSource> {
    return await this.applicantSourceService.findOne(id);
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update applicant source",
    description: "Update an existing applicant source"
  })
  @ApiParam({
    name: "id",
    description: "Applicant source ID",
    type: "string",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @ApiBody({
    type: UpdateApplicantSourceDto,
    description: "Applicant source update data"
  })
  @ApiResponse({
    status: 200,
    description: "Applicant source updated successfully",
    type: ApplicantSourceResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Applicant source not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Applicant source not found",
        data: null
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    schema: {
      example: {
        responseCode: responseMessage.UNAUTHORIZED_AUTH.caseCode,
        responseDesc: "Unauthorized access",
        data: null
      }
    }
  })
  async update(
    @Param("id") id: string,
    @Body() updateApplicantSourceDto: UpdateApplicantSourceDto
  ): Promise<ApplicantSource> {
    return await this.applicantSourceService.update(
      id,
      updateApplicantSourceDto
    );
  }

  @Patch(":id/toggle-active")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Toggle applicant source active status",
    description:
      "Toggle the active status of an applicant source (activate/deactivate)"
  })
  @ApiParam({
    name: "id",
    description: "Applicant source ID",
    type: "string",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @ApiResponse({
    status: 200,
    description: "Applicant source status toggled successfully",
    type: ApplicantSourceResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Applicant source not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Applicant source not found",
        data: null
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    schema: {
      example: {
        responseCode: responseMessage.UNAUTHORIZED_AUTH.caseCode,
        responseDesc: "Unauthorized access",
        data: null
      }
    }
  })
  async toggleActive(@Param("id") id: string): Promise<ApplicantSource> {
    return await this.applicantSourceService.toggleActive(id);
  }

  @Get("statistics")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get applicant source statistics",
    description:
      "Retrieve statistics about applicant sources including total, active, and inactive counts"
  })
  @ApiResponse({
    status: 200,
    description: "Statistics retrieved successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Statistics retrieved successfully",
        data: {
          total: 10,
          active: 8,
          inactive: 2
        }
      }
    }
  })
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const statistics = await this.applicantSourceService.getStatistics();

    return statistics;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage(responseMessage.SUCCESSFULLY_DELETED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete applicant source",
    description: "Delete an applicant source by its unique identifier"
  })
  @ApiParam({
    name: "id",
    description: "Applicant source ID",
    type: "string",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @ApiResponse({
    status: 204,
    description: "Applicant source deleted successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESSFULLY_DELETED.caseCode,
        responseDesc: "Applicant source deleted successfully",
        data: null
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: "Applicant source not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Applicant source not found",
        data: null
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    schema: {
      example: {
        responseCode: responseMessage.UNAUTHORIZED_AUTH.caseCode,
        responseDesc: "Unauthorized access",
        data: null
      }
    }
  })
  async remove(@Param("id") id: string): Promise<boolean> {
    await this.applicantSourceService.remove(id);

    return true;
  }
}
