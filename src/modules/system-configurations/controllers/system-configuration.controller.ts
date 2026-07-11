import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpStatus,
  HttpCode,
  UploadedFile,
  BadRequestException
} from "@nestjs/common";
import { SystemConfigurationService } from "../services/system-configuration.service";
import {
  CreateSystemConfigurationDto,
  UpdateSystemConfigurationDto,
  QuerySystemConfigurationDto,
  SystemConfigurationResponseDto
} from "../dto";
import { Public } from "src/shared/decorators/public.decorator";
import { responseMessage } from "src/shared/utils/constant";
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiTags,
  ApiParam,
  ApiQuery
} from "@nestjs/swagger";
import { ResponseMessage } from "src/shared/decorators/response.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileValidationPipe } from "src/shared/pipes/file-validation.pipe";

@ApiTags("System Configurations")
@Controller("system-configurations")
@UseInterceptors(ClassSerializerInterceptor)
export class SystemConfigurationController {
  constructor(
    private readonly systemConfigurationService: SystemConfigurationService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({
    summary: "Create a new system configuration",
    description: "Create a new system configuration with the given data"
  })
  @ApiBody({
    type: CreateSystemConfigurationDto,
    description: "System configuration data including key, value, and type"
  })
  @ApiResponse({
    status: 201,
    description: "System configuration created successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
        responseDesc: "System configuration created successfully",
        data: null
      }
    }
  })
  async create(@Body() createDto: CreateSystemConfigurationDto) {
    const result = await this.systemConfigurationService.create(createDto);

    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get all system configurations",
    description:
      "Retrieve all system configurations with optional filtering, pagination, and sorting"
  })
  @ApiQuery({
    type: QuerySystemConfigurationDto,
    description: "Query parameters for filtering and pagination"
  })
  @ApiResponse({
    status: 200,
    description: "System configurations retrieved successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "System configurations retrieved successfully",
        data: {
          items: [
            {
              id: "uuid",
              configKey: "company_name",
              configValue: "Neuronworks",
              configType: "text",
              groupName: "company",
              label: "Company Name",
              description: "Main company name",
              isRequired: true,
              isPublic: true,
              sortOrder: 1,
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z"
            }
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      }
    }
  })
  async findAll(@Query() queryDto: QuerySystemConfigurationDto) {
    const result = await this.systemConfigurationService.findAll(queryDto);

    return result;
  }

  @Get("public")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get public system configurations only",
    description: "Get public system configurations only"
  })
  @ApiResponse({
    status: 200,
    description: "Public system configurations retrieved successfully",
    type: SystemConfigurationResponseDto
  })
  async findPublic() {
    const result = await this.systemConfigurationService.findPublic();

    return result;
  }

  @Get("group/:groupName")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get configurations by group name",
    description: "Get configurations by group name"
  })
  @ApiResponse({
    status: 200,
    description: "Configurations retrieved successfully",
    type: SystemConfigurationResponseDto
  })
  async findByGroup(@Param("groupName") groupName: string) {
    const result = await this.systemConfigurationService.findByGroup(groupName);

    return result;
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get configuration by ID",
    description:
      "Retrieve a specific system configuration by its unique identifier"
  })
  @ApiParam({
    name: "id",
    description: "Configuration ID",
    type: "string",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @ApiResponse({
    status: 200,
    description: "Configuration retrieved successfully",
    type: SystemConfigurationResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Configuration not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Configuration not found",
        data: null
      }
    }
  })
  async findOne(@Param("id") id: string) {
    const result = await this.systemConfigurationService.findOne(id);

    return result;
  }

  @Get("key/:configKey")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get configuration by key",
    description: "Get configuration by key"
  })
  @ApiResponse({
    status: 200,
    description: "System configuration retrieved successfully",
    type: SystemConfigurationResponseDto,
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "System configuration retrieved successfully",
        data: {
          id: "1",
          configKey: "configKey",
          configValue: "configValue",
          configType: "configType",
          groupName: "groupName"
        }
      }
    }
  })
  async findByKey(@Param("configKey") configKey: string) {
    const result = await this.systemConfigurationService.findByKey(configKey);

    return result;
  }

  @Post("key/:configKey/file")
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({
    summary: "Upload file by configuration key",
    description:
      "Upload file for system configuration by key. Maximum file size: 10MB. Supported formats depend on configuration type (image: JPG, PNG, GIF, WEBP; file: PDF, DOC, DOCX, etc.)"
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "File to upload - Max 10MB"
        }
      },
      required: ["file"]
    }
  })
  @ApiResponse({
    status: 200,
    description: "File uploaded successfully",
    type: SystemConfigurationResponseDto,
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "File uploaded successfully",
        data: {
          id: "uuid",
          configKey: "company_logo",
          configValue: "system-configurations/branding/1234567890-abc123.jpg",
          configValueJson: null,
          configType: "image",
          groupName: "branding",
          label: "Company Logo",
          description: "Main company logo",
          isRequired: true,
          isPublic: true,
          sortOrder: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad request - Invalid file, configuration not found, or validation error",
    schema: {
      example: {
        responseCode: responseMessage.BAD_REQUEST.caseCode,
        responseDesc:
          "File upload failed: Configuration type 'text' does not support file upload",
        data: null
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: "Configuration not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Configuration with key 'invalid_key' not found",
        data: null
      }
    }
  })
  async uploadFileByKey(
    @Param("configKey") configKey: string,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 10 * 1024 * 1024,
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp"
        ],
        allowedExtensions: ["jpg", "jpeg", "png", "gif", "webp"]
      })
    )
    file: Express.Multer.File
  ) {
    try {
      const result = await this.systemConfigurationService.uploadFileByKey(
        configKey,
        file
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new BadRequestException(`File upload failed: ${errorMessage}`);
    }
  }
  @Patch("key/:configKey")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({
    summary: "Update configuration by key",
    description: "Update a system configuration using its configuration key"
  })
  @ApiParam({
    name: "configKey",
    description: "Configuration key",
    type: "string",
    example: "company_name"
  })
  @ApiBody({
    type: UpdateSystemConfigurationDto,
    description: "Configuration update data"
  })
  @ApiResponse({
    status: 200,
    description: "Configuration updated successfully",
    type: SystemConfigurationResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Configuration not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Configuration with key 'invalid_key' not found",
        data: null
      }
    }
  })
  async updateByKey(
    @Param("configKey") configKey: string,
    @Body() updateDto: UpdateSystemConfigurationDto
  ) {
    const result = await this.systemConfigurationService.updateByKey(
      configKey,
      updateDto
    );

    return result;
  }

  @Get("key/:configKey/json")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get configuration JSON value by key",
    description: "Retrieve the JSON value of a system configuration by its key"
  })
  @ApiParam({
    name: "configKey",
    description: "Configuration key",
    type: "string",
    example: "company_settings"
  })
  @ApiResponse({
    status: 200,
    description: "JSON value retrieved successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "JSON value retrieved successfully",
        data: {
          theme: "dark",
          language: "en",
          features: ["feature1", "feature2"]
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: "Configuration not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Configuration with key 'invalid_key' not found",
        data: null
      }
    }
  })
  async getJsonValue(@Param("configKey") configKey: string) {
    const result =
      await this.systemConfigurationService.getJsonValue(configKey);

    return result;
  }

  @Patch("key/:configKey/json")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({
    summary: "Update configuration JSON value by key",
    description: "Update the JSON value of a system configuration by its key"
  })
  @ApiParam({
    name: "configKey",
    description: "Configuration key",
    type: "string",
    example: "company_settings"
  })
  @ApiBody({
    description: "JSON value to update",
    schema: {
      type: "object",
      example: {
        theme: "dark",
        language: "en",
        features: ["feature1", "feature2"]
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: "JSON value updated successfully",
    type: SystemConfigurationResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Configuration not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Configuration with key 'invalid_key' not found",
        data: null
      }
    }
  })
  async updateJsonValue(
    @Param("configKey") configKey: string,
    @Body() jsonValue: Record<string, any>
  ) {
    const result = await this.systemConfigurationService.updateJsonValue(
      configKey,
      jsonValue
    );

    return result;
  }

  @Patch(":id/json")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({
    summary: "Update configuration JSON value by ID",
    description: "Update the JSON value of a system configuration by its ID"
  })
  @ApiParam({
    name: "id",
    description: "Configuration ID",
    type: "string",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @ApiBody({
    description: "JSON value to update",
    schema: {
      type: "object",
      example: {
        theme: "dark",
        language: "en",
        features: ["feature1", "feature2"]
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: "JSON value updated successfully",
    type: SystemConfigurationResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Configuration not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Configuration not found",
        data: null
      }
    }
  })
  async updateJsonValueById(
    @Param("id") id: string,
    @Body() jsonValue: Record<string, any>
  ) {
    const result = await this.systemConfigurationService.updateJsonValueById(
      id,
      jsonValue
    );

    return result;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage(responseMessage.SUCCESSFULLY_DELETED)
  @ApiOperation({
    summary: "Delete configuration by ID",
    description: "Delete a system configuration by its unique identifier"
  })
  @ApiParam({
    name: "id",
    description: "Configuration ID",
    type: "string",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @ApiResponse({
    status: 204,
    description: "Configuration deleted successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESSFULLY_DELETED.caseCode,
        responseDesc: "Configuration deleted successfully",
        data: null
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: "Configuration not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Configuration not found",
        data: null
      }
    }
  })
  async remove(@Param("id") id: string) {
    await this.systemConfigurationService.remove(id);

    return null;
  }
}
