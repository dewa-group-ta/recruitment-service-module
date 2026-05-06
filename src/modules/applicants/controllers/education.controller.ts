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
import { CreateEducationDto, UpdateEducationDto } from "../dto/education.dto";
import { AuthenticatedRequest } from "src/shared/interface";

@ApiTags("Applicant Educations")
@Controller("applicants/educations")
@ApiBearerAuth()
export class EducationController {
  constructor(private readonly applicantService: ApplicantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({
    summary: "Create new education",
    description:
      "Add a new education record to the authenticated applicant's profile."
  })
  @ApiBody({
    type: CreateEducationDto,
    description: "Education data"
  })
  @ApiResponse({
    status: 201,
    description: "Education created successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
        responseDesc: "Education created successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async createEducation(
    @Req() request: AuthenticatedRequest,
    @Body() createDto: CreateEducationDto
  ) {
    const applicantId = request.applicantId;
    const education = await this.applicantService.createEducation(
      applicantId,
      createDto
    );
    return {
      responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
      responseDesc: "Education created successfully",
      data: education
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all educations",
    description:
      "Retrieve all education records for the authenticated applicant."
  })
  @ApiResponse({
    status: 200,
    description: "Educations retrieved successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Educations retrieved successfully",
        data: []
      }
    }
  })
  @IsRole(role.APPLICANT)
  async getEducations(@Req() request: AuthenticatedRequest) {
    const applicantId = request.applicantId;
    const educations = await this.applicantService.getEducations(applicantId);
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Educations retrieved successfully",
      data: educations
    };
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Update education",
    description:
      "Update an existing education record for the authenticated applicant."
  })
  @ApiParam({
    name: "id",
    description: "Education ID",
    example: "uuid-string"
  })
  @ApiBody({
    type: UpdateEducationDto,
    description: "Education update data"
  })
  @ApiResponse({
    status: 200,
    description: "Education updated successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Education updated successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async updateEducation(
    @Req() request: AuthenticatedRequest,
    @Param("id") educationId: string,
    @Body() updateDto: UpdateEducationDto
  ) {
    const applicantId = request.applicantId;
    const education = await this.applicantService.updateEducation(
      educationId,
      applicantId,
      updateDto
    );
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Education updated successfully",
      data: education
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Delete education",
    description:
      "Delete an education record from the authenticated applicant's profile."
  })
  @ApiParam({
    name: "id",
    description: "Education ID",
    example: "uuid-string"
  })
  @ApiResponse({
    status: 200,
    description: "Education deleted successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Education deleted successfully",
        data: null
      }
    }
  })
  @IsRole(role.APPLICANT)
  async deleteEducation(
    @Req() request: AuthenticatedRequest,
    @Param("id") educationId: string
  ) {
    const applicantId = request.applicantId;
    await this.applicantService.deleteEducation(educationId, applicantId);
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Education deleted successfully",
      data: null
    };
  }
}
