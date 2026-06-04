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
import { CreateIdentityDto, UpdateIdentityDto } from "../dto/identity.dto";
import { AuthenticatedRequest } from "src/shared/interface";

@ApiTags("Applicant Identities")
@Controller("applicants/identities")
@ApiBearerAuth()
export class IdentityController {
  constructor(private readonly applicantService: ApplicantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({
    summary: "Create new identity",
    description:
      "Add a new identity document to the authenticated applicant's profile."
  })
  @ApiBody({
    type: CreateIdentityDto,
    description: "Identity data"
  })
  @ApiResponse({
    status: 201,
    description: "Identity created successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
        responseDesc: "Identity created successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async createIdentity(
    @Req() request: AuthenticatedRequest,
    @Body() createDto: CreateIdentityDto
  ) {
    const applicantId = request.applicantId;
    const identity = await this.applicantService.createIdentity(
      applicantId,
      createDto
    );
    return {
      responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
      responseDesc: "Identity created successfully",
      data: identity
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all identities",
    description:
      "Retrieve all identity documents for the authenticated applicant."
  })
  @ApiResponse({
    status: 200,
    description: "Identities retrieved successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Identities retrieved successfully",
        data: []
      }
    }
  })
  @IsRole(role.APPLICANT)
  async getIdentities(@Req() request: AuthenticatedRequest) {
    const applicantId = request.applicantId;
    const identities = await this.applicantService.getIdentities(applicantId);
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Identities retrieved successfully",
      data: identities
    };
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Update identity",
    description:
      "Update an existing identity document for the authenticated applicant."
  })
  @ApiParam({
    name: "id",
    description: "Identity ID",
    example: "uuid-string"
  })
  @ApiBody({
    type: UpdateIdentityDto,
    description: "Identity update data"
  })
  @ApiResponse({
    status: 200,
    description: "Identity updated successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Identity updated successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async updateIdentity(
    @Req() request: AuthenticatedRequest,
    @Param("id") identityId: string,
    @Body() updateDto: UpdateIdentityDto
  ) {
    const applicantId = request.applicantId;
    const identity = await this.applicantService.updateIdentity(
      identityId,
      applicantId,
      updateDto
    );
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Identity updated successfully",
      data: identity
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Delete identity",
    description:
      "Delete an identity document from the authenticated applicant's profile."
  })
  @ApiParam({
    name: "id",
    description: "Identity ID",
    example: "uuid-string"
  })
  @ApiResponse({
    status: 200,
    description: "Identity deleted successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Identity deleted successfully",
        data: null
      }
    }
  })
  @IsRole(role.APPLICANT)
  async deleteIdentity(
    @Req() request: AuthenticatedRequest,
    @Param("id") identityId: string
  ) {
    const applicantId = request.applicantId;
    await this.applicantService.deleteIdentity(identityId, applicantId);
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Identity deleted successfully",
      data: null
    };
  }
}
