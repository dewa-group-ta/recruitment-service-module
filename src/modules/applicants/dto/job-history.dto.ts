import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  Length,
  IsInt,
  Min
} from "class-validator";
import { EmployeeStatus } from "../../../shared/enums/applicant.enum";

export class CreateJobHistoryDto {
  @ApiProperty({
    description: "Job position title",
    example: "Software Engineer",
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  position: string;

  @ApiProperty({
    description: "Employment status",
    enum: EmployeeStatus,
    example: EmployeeStatus.FULL_TIME
  })
  @IsEnum(EmployeeStatus)
  employeeStatus: EmployeeStatus;

  @ApiProperty({
    description: "Company name",
    example: "PT. Tech Company",
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  company: string;

  @ApiProperty({
    description: "Start date of employment",
    example: "2022-01-01",
    format: "date"
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: "End date of employment (null for current job)",
    example: "2023-12-31",
    format: "date"
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: "Work location",
    example: "Jakarta, Indonesia",
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  location?: string;

  @ApiPropertyOptional({
    description: "Job description and responsibilities",
    example: "Developed web applications using React and Node.js"
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Key achievements and accomplishments",
    example: "Led a team of 5 developers and improved system performance by 40%"
  })
  @IsOptional()
  @IsString()
  achievements?: string;

  @ApiPropertyOptional({
    description: "Order for multiple job history records",
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

export class UpdateJobHistoryDto extends PartialType(CreateJobHistoryDto) {}
