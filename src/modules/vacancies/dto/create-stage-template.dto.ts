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

export class CreateStageTemplateDto {
  @ApiProperty({
    description: "Stage template name",
    example: "Technical Interview",
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: "Stage template description",
    example: "Technical interview stage for engineering positions"
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: "Maximum duration in days for this stage",
    example: 7
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxDurationDays?: number;

  @ApiPropertyOptional({
    description: "Can send notifications in this stage",
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  canNotify?: boolean;

  @ApiPropertyOptional({
    description: "Can give score/rating in this stage",
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  canScore?: boolean;

  @ApiPropertyOptional({
    description: "Instructions for HR in this stage",
    example: "Conduct technical assessment focusing on problem-solving skills"
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({
    description: "Whether this stage template is active",
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Category of stage template",
    example: "engineering",
    maxLength: 100
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    description: "ID of user creating this stage template",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @IsUUID()
  @IsNotEmpty()
  createdById: string;
}
