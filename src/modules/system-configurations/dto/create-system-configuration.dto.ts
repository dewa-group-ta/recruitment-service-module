import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  IsObject
} from "class-validator";
import { ConfigType } from "../entities/system-configuration.entity";

export class CreateSystemConfigurationDto {
  @IsString()
  @MaxLength(100)
  configKey: string;

  @IsString()
  @IsOptional()
  configValue?: string;

  @IsObject()
  @IsOptional()
  configValueJson?: Record<string, any>;

  @IsEnum(ConfigType)
  configType: ConfigType;

  @IsString()
  @MaxLength(100)
  groupName: string;

  @IsString()
  @MaxLength(255)
  label: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
