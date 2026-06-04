import { IsOptional, IsString, IsBoolean, IsEnum } from "class-validator";
import { ConfigType } from "../entities/system-configuration.entity";
import { TransformToBoolean } from "../../../shared/transformers/boolean.transformer";

export class QuerySystemConfigurationDto {
  @IsOptional()
  @IsString()
  groupName?: string;

  @IsOptional()
  @TransformToBoolean
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsEnum(ConfigType)
  configType?: ConfigType;

  @IsOptional()
  @IsString()
  search?: string;
}
