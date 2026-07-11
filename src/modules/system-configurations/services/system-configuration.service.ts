import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindManyOptions, Like } from "typeorm";
import {
  SystemConfiguration,
  ConfigType
} from "../entities/system-configuration.entity";
import {
  CreateSystemConfigurationDto,
  UpdateSystemConfigurationDto,
  QuerySystemConfigurationDto,
  SystemConfigurationResponseDto
} from "../dto";
import { FileUploadService } from "src/shared/services/file-upload.service";
import { FileUploadDto } from "src/shared/dto/file-upload.dto";
import { FileType } from "src/shared/entities/file.entity";

@Injectable()
export class SystemConfigurationService {
  constructor(
    @InjectRepository(SystemConfiguration)
    private readonly systemConfigurationRepository: Repository<SystemConfiguration>,
    private readonly fileUploadService: FileUploadService
  ) {}

  async create(
    createDto: CreateSystemConfigurationDto
  ): Promise<SystemConfigurationResponseDto> {
    const existingConfig = await this.systemConfigurationRepository.findOne({
      where: { configKey: createDto.configKey }
    });

    if (existingConfig) {
      throw new ConflictException(
        `Configuration with key '${createDto.configKey}' already exists`
      );
    }

    const config = this.systemConfigurationRepository.create(createDto);
    const savedConfig = await this.systemConfigurationRepository.save(config);

    return new SystemConfigurationResponseDto(savedConfig);
  }

  async findAll(
    queryDto: QuerySystemConfigurationDto
  ): Promise<SystemConfigurationResponseDto[]> {
    const where: FindManyOptions<SystemConfiguration>["where"] = {};

    if (queryDto.groupName) {
      where.groupName = queryDto.groupName;
    }

    if (queryDto.isPublic !== undefined) {
      where.isPublic = queryDto.isPublic;
    }

    if (queryDto.configType) {
      where.configType = queryDto.configType;
    }

    if (queryDto.search) {
      where.label = Like(`%${queryDto.search}%`);
    }

    const configs = await this.systemConfigurationRepository.find({
      where,
      order: { sortOrder: "ASC", createdAt: "ASC" }
    });

    return configs.map((config) => new SystemConfigurationResponseDto(config));
  }

  async findByGroup(
    groupName: string
  ): Promise<SystemConfigurationResponseDto[]> {
    const configs = await this.systemConfigurationRepository.find({
      where: { groupName },
      order: { sortOrder: "ASC", createdAt: "ASC" }
    });

    return configs.map((config) => new SystemConfigurationResponseDto(config));
  }

  async findPublic(): Promise<SystemConfigurationResponseDto[]> {
    const configs = await this.systemConfigurationRepository.find({
      where: { isPublic: true },
      order: { groupName: "ASC", sortOrder: "ASC" }
    });

    return configs.map((config) => new SystemConfigurationResponseDto(config));
  }

  async findOne(id: string): Promise<SystemConfigurationResponseDto> {
    const config = await this.systemConfigurationRepository.findOne({
      where: { id }
    });

    if (!config) {
      throw new NotFoundException(`Configuration with ID '${id}' not found`);
    }

    return new SystemConfigurationResponseDto(config);
  }

  async findByKey(configKey: string): Promise<SystemConfigurationResponseDto> {
    const config = await this.systemConfigurationRepository.findOne({
      where: { configKey }
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration with key '${configKey}' not found`
      );
    }

    return new SystemConfigurationResponseDto(config);
  }

  async update(
    id: string,
    updateDto: UpdateSystemConfigurationDto
  ): Promise<SystemConfigurationResponseDto> {
    const config = await this.systemConfigurationRepository.findOne({
      where: { id }
    });

    if (!config) {
      throw new NotFoundException(`Configuration with ID '${id}' not found`);
    }

    if (updateDto.configKey && updateDto.configKey !== config.configKey) {
      const existingConfig = await this.systemConfigurationRepository.findOne({
        where: { configKey: updateDto.configKey }
      });

      if (existingConfig) {
        throw new ConflictException(
          `Configuration with key '${updateDto.configKey}' already exists`
        );
      }
    }

    Object.assign(config, updateDto);
    const savedConfig = await this.systemConfigurationRepository.save(config);

    return new SystemConfigurationResponseDto(savedConfig);
  }

  async updateByKey(
    configKey: string,
    updateDto: UpdateSystemConfigurationDto
  ): Promise<SystemConfigurationResponseDto> {
    const config = await this.systemConfigurationRepository.findOne({
      where: { configKey }
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration with key '${configKey}' not found`
      );
    }

    if (updateDto.configKey && updateDto.configKey !== config.configKey) {
      const existingConfig = await this.systemConfigurationRepository.findOne({
        where: { configKey: updateDto.configKey }
      });

      if (existingConfig) {
        throw new ConflictException(
          `Configuration with key '${updateDto.configKey}' already exists`
        );
      }
    }

    Object.assign(config, updateDto);
    const savedConfig = await this.systemConfigurationRepository.save(config);

    return new SystemConfigurationResponseDto(savedConfig);
  }

  async remove(id: string): Promise<void> {
    const config = await this.systemConfigurationRepository.findOne({
      where: { id }
    });

    if (!config) {
      throw new NotFoundException(`Configuration with ID '${id}' not found`);
    }

    await this.systemConfigurationRepository.softDelete(id);
  }

  async getValue(configKey: string): Promise<string | null> {
    const config = await this.systemConfigurationRepository.findOne({
      where: { configKey }
    });

    return config?.configValue || null;
  }

  async getValueOrDefault(
    configKey: string,
    defaultValue: string
  ): Promise<string> {
    const value = await this.getValue(configKey);
    return value || defaultValue;
  }

  async getJsonValue(configKey: string): Promise<Record<string, any> | null> {
    const config = await this.systemConfigurationRepository.findOne({
      where: { configKey }
    });

    return config?.configValueJson || null;
  }

  async getJsonValueOrDefault(
    configKey: string,
    defaultValue: Record<string, any>
  ): Promise<Record<string, any>> {
    const value = await this.getJsonValue(configKey);
    return value || defaultValue;
  }

  async updateJsonValue(
    configKey: string,
    jsonValue: Record<string, any>
  ): Promise<SystemConfigurationResponseDto> {
    const config = await this.systemConfigurationRepository.findOne({
      where: { configKey }
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration with key '${configKey}' not found`
      );
    }

    config.configValueJson = jsonValue;
    const savedConfig = await this.systemConfigurationRepository.save(config);

    return new SystemConfigurationResponseDto(savedConfig);
  }

  async updateJsonValueById(
    id: string,
    jsonValue: Record<string, any>
  ): Promise<SystemConfigurationResponseDto> {
    const config = await this.systemConfigurationRepository.findOne({
      where: { id }
    });

    if (!config) {
      throw new NotFoundException(`Configuration with ID '${id}' not found`);
    }

    config.configValueJson = jsonValue;
    const savedConfig = await this.systemConfigurationRepository.save(config);

    return new SystemConfigurationResponseDto(savedConfig);
  }

  async uploadFileByKey(
    configKey: string,
    file: Express.Multer.File
  ): Promise<SystemConfigurationResponseDto> {
    const config = await this.systemConfigurationRepository.findOne({
      where: { configKey }
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration with key '${configKey}' not found`
      );
    }

    if (config.configType !== ConfigType.IMAGE) {
      throw new BadRequestException(
        `Configuration type '${config.configType}' does not support file upload. Only 'image' type is supported.`
      );
    }

    try {
      const fileUploadData: FileUploadDto = {
        fileType: FileType.COMPANY_LOGO,
        description: `System configuration file for ${configKey}`,
        folder: `system-configurations/${config.groupName}`,
        relatedEntity: "system_configuration",
        relatedEntityId: config.id
      };

      if (config.configValue) {
        try {
          await this.fileUploadService.deleteFileByPath(config.configValue);
        } catch (error) {
          console.error("Error deleting old file:", error);
        }
      }

      const uploadResult = await this.fileUploadService.uploadFile(
        file,
        fileUploadData
      );

      config.configValue = uploadResult.filePath;
      const savedConfig = await this.systemConfigurationRepository.save(config);

      return new SystemConfigurationResponseDto(savedConfig);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new BadRequestException(`File upload failed: ${errorMessage}`);
    }
  }
}
