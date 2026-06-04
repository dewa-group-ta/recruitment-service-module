import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsUUID,
  MaxLength
} from "class-validator";

export class CreateDepartmentDto {
  @ApiProperty({
    description: "Department name",
    example: "Engineering",
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: "Department code (unique identifier)",
    example: "ENG",
    maxLength: 50
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({
    description: "Department description",
    example: "Software development and engineering team"
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: "Whether the department is active",
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: "ID of user creating this department",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @IsUUID()
  @IsNotEmpty()
  createdById: string;
}
