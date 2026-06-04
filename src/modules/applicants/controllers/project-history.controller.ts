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
  CreateProjectHistoryDto,
  UpdateProjectHistoryDto
} from "../dto/project-history.dto";
import { AuthenticatedRequest } from "src/shared/interface";

@ApiTags("Applicant Project Histories")
@Controller("applicants/project-histories")
@ApiBearerAuth()
export class ProjectHistoryController {
  constructor(private readonly applicantService: ApplicantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({
    summary: "Create new project history",
    description:
      "Add a new project history record to the authenticated applicant's profile."
  })
  @ApiBody({
    type: CreateProjectHistoryDto,
    description: "Project history data"
  })
  @ApiResponse({
    status: 201,
    description: "Project history created successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
        responseDesc: "Project history created successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async createProjectHistory(
    @Req() request: AuthenticatedRequest,
    @Body() createDto: CreateProjectHistoryDto
  ) {
    const applicantId = request.applicantId;
    const projectHistory = await this.applicantService.createProjectHistory(
      applicantId,
      createDto
    );
    return {
      responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
      responseDesc: "Project history created successfully",
      data: projectHistory
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all project histories",
    description:
      "Retrieve all project history records for the authenticated applicant."
  })
  @ApiResponse({
    status: 200,
    description: "Project histories retrieved successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Project histories retrieved successfully",
        data: []
      }
    }
  })
  @IsRole(role.APPLICANT)
  async getProjectHistories(@Req() request: AuthenticatedRequest) {
    const applicantId = request.applicantId;
    const projectHistories =
      await this.applicantService.getProjectHistories(applicantId);
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Project histories retrieved successfully",
      data: projectHistories
    };
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Update project history",
    description:
      "Update an existing project history record for the authenticated applicant."
  })
  @ApiParam({
    name: "id",
    description: "Project history ID",
    example: "uuid-string"
  })
  @ApiBody({
    type: UpdateProjectHistoryDto,
    description: "Project history update data"
  })
  @ApiResponse({
    status: 200,
    description: "Project history updated successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Project history updated successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async updateProjectHistory(
    @Req() request: AuthenticatedRequest,
    @Param("id") projectHistoryId: string,
    @Body() updateDto: UpdateProjectHistoryDto
  ) {
    const applicantId = request.applicantId;
    const projectHistory = await this.applicantService.updateProjectHistory(
      projectHistoryId,
      applicantId,
      updateDto
    );
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Project history updated successfully",
      data: projectHistory
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Delete project history",
    description:
      "Delete a project history record from the authenticated applicant's profile."
  })
  @ApiParam({
    name: "id",
    description: "Project history ID",
    example: "uuid-string"
  })
  @ApiResponse({
    status: 200,
    description: "Project history deleted successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Project history deleted successfully",
        data: null
      }
    }
  })
  @IsRole(role.APPLICANT)
  async deleteProjectHistory(
    @Req() request: AuthenticatedRequest,
    @Param("id") projectHistoryId: string
  ) {
    const applicantId = request.applicantId;
    await this.applicantService.deleteProjectHistory(
      projectHistoryId,
      applicantId
    );
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Project history deleted successfully",
      data: null
    };
  }
}
