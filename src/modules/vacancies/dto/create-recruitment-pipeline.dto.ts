import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUUID,
  MaxLength,
  Min
} from "class-validator";

export class CreateRecruitmentPipelineDto {
  @ApiProperty({
    description: "Recruitment pipeline name",
    example: "Engineering Recruitment Pipeline",
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: "Recruitment pipeline description",
    example: "Standard recruitment process for engineering positions"
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: "Pipeline version",
    example: "1.0",
    maxLength: 20,
    default: "1.0"
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  version?: string;

  @ApiPropertyOptional({
    description: "Whether this pipeline is the default pipeline",
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: "Whether this pipeline is active",
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Whether this pipeline is a template",
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;

  @ApiPropertyOptional({
    description: "Category of the pipeline",
    example: "engineering",
    maxLength: 100
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: "Usage count of this pipeline template",
    example: 0,
    default: 0
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  usageCount?: number;

  @ApiProperty({
    description: "ID of user creating this pipeline",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @IsUUID()
  @IsNotEmpty()
  createdById: string;
}
