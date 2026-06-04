import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsUrl,
  IsBoolean,
  Length
} from "class-validator";
import {
  GenderEnum,
  MaritalStatusEnum,
  AvailabilityEnum
} from "../../../shared/enums/applicant.enum";
import { RegisterApplicantDto } from "./register-applicant.dto";

export class UpdateApplicantProfileDto extends PartialType(
  RegisterApplicantDto
) {
  @ApiPropertyOptional({
    description: "Full name of the applicant",
    example: "John Doe",
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  fullName?: string;

  @ApiPropertyOptional({
    description: "Alternative phone number",
    example: "+6281234567890",
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  alternativePhone?: string;

  @ApiPropertyOptional({
    description: "Gender of the applicant",
    enum: GenderEnum,
    example: GenderEnum.MALE
  })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({
    description: "Marital status of the applicant",
    enum: MaritalStatusEnum,
    example: MaritalStatusEnum.SINGLE
  })
  @IsOptional()
  @IsEnum(MaritalStatusEnum)
  maritalStatus?: MaritalStatusEnum;

  @ApiPropertyOptional({
    description: "Place of birth",
    example: "Jakarta",
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  placeOfBirth?: string;

  @ApiPropertyOptional({
    description: "Date of birth",
    example: "1990-01-01",
    format: "date"
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: "URL to applicant photo",
    example: "https://example.com/photo.jpg",
    maxLength: 500
  })
  @IsOptional()
  @IsUrl()
  @Length(1, 500)
  photoUrl?: string;

  @ApiPropertyOptional({
    description: "URL to applicant CV",
    example: "https://example.com/cv.pdf",
    maxLength: 500
  })
  @IsOptional()
  @IsUrl()
  @Length(1, 500)
  cvUrl?: string;

  @ApiPropertyOptional({
    description: "LinkedIn profile URL",
    example: "https://linkedin.com/in/johndoe",
    maxLength: 500
  })
  @IsOptional()
  @IsUrl()
  @Length(1, 500)
  linkedinUrl?: string;

  @ApiPropertyOptional({
    description: "Portfolio URL",
    example: "https://johndoe.dev",
    maxLength: 500
  })
  @IsOptional()
  @IsUrl()
  @Length(1, 500)
  portfolioUrl?: string;

  @ApiPropertyOptional({
    description: "Social media URL",
    example: "https://twitter.com/johndoe",
    maxLength: 500
  })
  @IsOptional()
  @IsUrl()
  @Length(1, 500)
  socialMediaUrl?: string;

  @ApiPropertyOptional({
    description: "Whether the applicant is internal employee",
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @ApiPropertyOptional({
    description: "Availability status of the applicant",
    enum: AvailabilityEnum,
    example: AvailabilityEnum.IMMEDIATELY
  })
  @IsOptional()
  @IsEnum(AvailabilityEnum)
  availability?: AvailabilityEnum;

  @ApiPropertyOptional({
    description: "Specific date when applicant will be available",
    example: "2024-02-01",
    format: "date"
  })
  @IsOptional()
  @IsDateString()
  availabilityAt?: string;
}
