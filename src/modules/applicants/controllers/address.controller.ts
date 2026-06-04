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
import { CreateAddressDto, UpdateAddressDto } from "../dto/address.dto";
import { AuthenticatedRequest } from "src/shared/interface";

@ApiTags("Applicant Addresses")
@Controller("applicants/addresses")
@ApiBearerAuth()
export class AddressController {
  constructor(private readonly applicantService: ApplicantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({
    summary: "Create new address",
    description: "Add a new address to the authenticated applicant's profile."
  })
  @ApiBody({
    type: CreateAddressDto,
    description: "Address data"
  })
  @ApiResponse({
    status: 201,
    description: "Address created successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
        responseDesc: "Address created successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async createAddress(
    @Req() request: AuthenticatedRequest,
    @Body() createDto: CreateAddressDto
  ) {
    const applicantId = request.applicantId;
    const address = await this.applicantService.createAddress(
      applicantId,
      createDto
    );
    return {
      responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
      responseDesc: "Address created successfully",
      data: address
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all addresses",
    description: "Retrieve all addresses for the authenticated applicant."
  })
  @ApiResponse({
    status: 200,
    description: "Addresses retrieved successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Addresses retrieved successfully",
        data: []
      }
    }
  })
  @IsRole(role.APPLICANT)
  async getAddresses(@Req() request: AuthenticatedRequest) {
    const applicantId = request.applicantId;
    const addresses = await this.applicantService.getAddresses(applicantId);
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Addresses retrieved successfully",
      data: addresses
    };
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Update address",
    description: "Update an existing address for the authenticated applicant."
  })
  @ApiParam({
    name: "id",
    description: "Address ID",
    example: "uuid-string"
  })
  @ApiBody({
    type: UpdateAddressDto,
    description: "Address update data"
  })
  @ApiResponse({
    status: 200,
    description: "Address updated successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Address updated successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async updateAddress(
    @Req() request: AuthenticatedRequest,
    @Param("id") addressId: string,
    @Body() updateDto: UpdateAddressDto
  ) {
    const applicantId = request.applicantId;
    const address = await this.applicantService.updateAddress(
      addressId,
      applicantId,
      updateDto
    );
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Address updated successfully",
      data: address
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Delete address",
    description: "Delete an address from the authenticated applicant's profile."
  })
  @ApiParam({
    name: "id",
    description: "Address ID",
    example: "uuid-string"
  })
  @ApiResponse({
    status: 200,
    description: "Address deleted successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Address deleted successfully",
        data: null
      }
    }
  })
  @IsRole(role.APPLICANT)
  async deleteAddress(
    @Req() request: AuthenticatedRequest,
    @Param("id") addressId: string
  ) {
    const applicantId = request.applicantId;
    await this.applicantService.deleteAddress(addressId, applicantId);
    return {
      responseCode: responseMessage.SUCCESS.caseCode,
      responseDesc: "Address deleted successfully",
      data: null
    };
  }
}
