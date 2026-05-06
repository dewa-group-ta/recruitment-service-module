import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  MaxLength,
  IsOptional,
  IsUUID,
  IsArray,
  MinLength
} from "class-validator";
import { IsCustomSourceRequired } from "../validators/custom-source.validator";

export class RegisterApplicantDto {
  @ApiProperty({
    description: "Full name of the applicant",
    example: "John Doe",
    maxLength: 100
  })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: "Email address of the applicant",
    example: "john.doe@example.com"
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Phone number of the applicant",
    example: "+6281234567890"
  })
  @IsString()
  @MaxLength(20)
  @MinLength(9)
  phone: string;

  @ApiProperty({
    description: "Please select the position you are applying for",
    example: "uuid-string"
  })
  @IsUUID()
  vacancyId: string;

  @ApiProperty({
    description: "Address ID for the position (optional)",
    example: "uuid-string",
    required: false
  })
  @IsUUID()
  @IsOptional()
  addressId?: string;

  @ApiProperty({
    description:
      "Applicant source IDs (how the applicant found out about the job)",
    example: ["uuid-string-1", "uuid-string-2"],
    required: false,
    type: [String]
  })
  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  applicantSourceIds?: string[];

  @ApiProperty({
    description: "Custom source description (required when Others is selected)",
    example: "Company website",
    required: false,
    maxLength: 255
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  @IsCustomSourceRequired()
  customSource?: string;
}
