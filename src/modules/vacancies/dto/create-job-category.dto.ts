import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsHexColor,
  MaxLength
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateJobCategoryDto {
  @ApiProperty({
    description: "Name of the job category",
    example: "Engineering",
    maxLength: 100
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: "Description of the job category",
    example: "Software development and engineering positions",
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: "Short code for the category",
    example: "ENG",
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({
    description: "Hex color code for UI display",
    example: "#3B82F6",
    maxLength: 7
  })
  @IsOptional()
  @IsString()
  @IsHexColor()
  @MaxLength(7)
  color?: string;

  @ApiPropertyOptional({
    description: "Icon name or path for UI display",
    example: "code",
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiPropertyOptional({
    description: "Sort order for UI display",
    example: 1,
    default: 0
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: "Whether the category is active",
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: "ID of the user creating the category",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @IsString()
  createdById: string;
}
