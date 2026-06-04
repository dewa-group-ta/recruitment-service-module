import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Get,
  Put,
  Delete,
  Param
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam
} from "@nestjs/swagger";
import { ApplicantService } from "../services/applicant.service";
import { ResponseMessage } from "../../../shared/decorators/response.decorator";
import { responseMessage, role } from "src/shared/utils/constant";
import { IsRole } from "src/shared/decorators/roles.decorator";
import {
  CreateJobHistoryDto,
  UpdateJobHistoryDto
} from "../dto/job-history.dto";
import { AuthenticatedRequest } from "src/shared/interface";

@ApiTags("Applicant Job Histories")
@Controller("applicants/job-histories")
@ApiBearerAuth()
export class JobHistoryController {
  constructor(private readonly applicantService: ApplicantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({
    summary: "Create new job history",
    description:
      "Add a new job history record to the authenticated applicant's profile."
  })
  @ApiBody({
    type: CreateJobHistoryDto,
    description: "Job history data"
  })
  @ApiResponse({
    status: 201,
    description: "Job history created successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
        responseDesc: "Job history created successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async createJobHistory(
    @Req() request: AuthenticatedRequest,
    @Body() createDto: CreateJobHistoryDto
  ) {
    const applicantId = request.applicantId;
    const jobHistory = await this.applicantService.createJobHistory(
      applicantId,
      createDto
    );
    return {
      responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
      responseDesc: "Job history created successfully",
      data: jobHistory
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all job histories",
    description:
      "Retrieve all job history records for the authenticated applicant."
  })
  @ApiResponse({
    status: 200,
    description: "Job histories retrieved successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Job histories retrieved successfully",
        data: []
      }
    }
  })
  @IsRole(role.APPLICANT)
  async getJobHistories(@Req() request: AuthenticatedRequest) {
    const applicantId = request.applicantId;
    const jobHistories =
      await this.applicantService.getJobHistories(applicantId);
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Job histories retrieved successfully",
      data: jobHistories
    };
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Update job history",
    description:
      "Update an existing job history record for the authenticated applicant."
  })
  @ApiParam({
    name: "id",
    description: "Job history ID",
    example: "uuid-string"
  })
  @ApiBody({
    type: UpdateJobHistoryDto,
    description: "Job history update data"
  })
  @ApiResponse({
    status: 200,
    description: "Job history updated successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Job history updated successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async updateJobHistory(
    @Req() request: AuthenticatedRequest,
    @Param("id") jobHistoryId: string,
    @Body() updateDto: UpdateJobHistoryDto
  ) {
    const applicantId = request.applicantId;
    const jobHistory = await this.applicantService.updateJobHistory(
      jobHistoryId,
      applicantId,
      updateDto
    );
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Job history updated successfully",
      data: jobHistory
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Delete job history",
    description:
      "Delete a job history record from the authenticated applicant's profile."
  })
  @ApiParam({
    name: "id",
    description: "Job history ID",
    example: "uuid-string"
  })
  @ApiResponse({
    status: 200,
    description: "Job history deleted successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Job history deleted successfully",
        data: null
      }
    }
  })
  @IsRole(role.APPLICANT)
  async deleteJobHistory(
    @Req() request: AuthenticatedRequest,
    @Param("id") jobHistoryId: string
  ) {
    const applicantId = request.applicantId;
    await this.applicantService.deleteJobHistory(jobHistoryId, applicantId);
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Job history deleted successfully",
      data: null
    };
  }
}
