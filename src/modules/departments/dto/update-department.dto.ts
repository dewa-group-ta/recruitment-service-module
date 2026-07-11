import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, MaxLength } from "class-validator";

export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: "Department name",
    example: "Engineering",
    maxLength: 255
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

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
    example: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "ID of user updating this department"
  })
  @IsString()
  @IsOptional()
  updatedById?: string;
}
