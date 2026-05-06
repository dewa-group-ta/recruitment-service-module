import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  Length,
  IsUrl,
  IsInt,
  Min
} from "class-validator";

export class CreateProjectHistoryDto {
  @ApiProperty({
    description: "Project name",
    example: "E-commerce Platform",
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  projectName: string;

  @ApiProperty({
    description: "Role/position in the project",
    example: "Full Stack Developer",
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  position: string;

  @ApiPropertyOptional({
    description: "Project year",
    example: "2023",
    maxLength: 4
  })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  year?: string;

  @ApiPropertyOptional({
    description: "Project URL or repository link",
    example: "https://github.com/user/ecommerce-platform",
    maxLength: 500
  })
  @IsOptional()
  @IsUrl()
  @Length(1, 500)
  projectLink?: string;

  @ApiPropertyOptional({
    description: "Project description and details",
    example:
      "Developed a full-stack e-commerce platform with React frontend and Node.js backend"
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Technologies used in the project (comma-separated)",
    example: "React, Node.js, PostgreSQL, Redis, Docker"
  })
  @IsOptional()
  @IsString()
  technologies?: string;

  @ApiPropertyOptional({
    description: "Project achievements and outcomes",
    example:
      "Successfully launched the platform with 1000+ active users in the first month"
  })
  @IsOptional()
  @IsString()
  achievements?: string;

  @ApiPropertyOptional({
    description: "Order for multiple project records",
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

export class UpdateProjectHistoryDto extends PartialType(
  CreateProjectHistoryDto
) {}
