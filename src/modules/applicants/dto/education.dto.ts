import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  Length,
  Min,
  Max,
  IsInt
} from "class-validator";

export class CreateEducationDto {
  @ApiProperty({
    description: "Name of the educational institution",
    example: "Universitas Indonesia",
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  schoolName: string;

  @ApiProperty({
    description: "Field of study or major",
    example: "Computer Science",
    maxLength: 100
  })
  @IsString()
  @Length(1, 100)
  major: string;

  @ApiProperty({
    description: "Degree level",
    example: "Bachelor",
    maxLength: 100
  })
  @IsString()
  @Length(1, 100)
  degree: string;

  @ApiPropertyOptional({
    description: "Grade Point Average (GPA)",
    example: 3.75,
    minimum: 0,
    maximum: 4
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  gpa?: number;

  @ApiProperty({
    description: "Start month in MM-YYYY format",
    example: "08-2018",
    maxLength: 7
  })
  @IsString()
  @Length(7, 7)
  startMonth: string;

  @ApiPropertyOptional({
    description: "End month in MM-YYYY format (null for ongoing)",
    example: "06-2022",
    maxLength: 7
  })
  @IsOptional()
  @IsString()
  @Length(7, 7)
  endMonth?: string;

  @ApiPropertyOptional({
    description: "Diploma file name",
    example: "diploma_bachelor.pdf",
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  diplomaFileName?: string;

  @ApiPropertyOptional({
    description: "Order for multiple education records",
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

export class UpdateEducationDto {
  @ApiPropertyOptional({
    description: "Name of the educational institution",
    example: "Universitas Indonesia",
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  schoolName?: string;

  @ApiPropertyOptional({
    description: "Field of study or major",
    example: "Computer Science",
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  major?: string;

  @ApiPropertyOptional({
    description: "Degree level",
    example: "Bachelor",
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  degree?: string;

  @ApiPropertyOptional({
    description: "Grade Point Average (GPA)",
    example: 3.75,
    minimum: 0,
    maximum: 4
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  gpa?: number;

  @ApiPropertyOptional({
    description: "Start month in MM-YYYY format",
    example: "08-2018",
    maxLength: 7
  })
  @IsOptional()
  @IsString()
  @Length(7, 7)
  startMonth?: string;

  @ApiPropertyOptional({
    description: "End month in MM-YYYY format (null for ongoing)",
    example: "06-2022",
    maxLength: 7
  })
  @IsOptional()
  @IsString()
  @Length(7, 7)
  endMonth?: string;

  @ApiPropertyOptional({
    description: "Diploma file name",
    example: "diploma_bachelor.pdf",
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  diplomaFileName?: string;

  @ApiPropertyOptional({
    description: "Order for multiple education records",
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
