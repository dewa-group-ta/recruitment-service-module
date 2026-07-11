import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsEnum,
  IsDateString,
  IsUUID,
  MaxLength,
  MinLength,
  IsOptional
} from "class-validator";
import {
  GenderEnum,
  MaritalStatusEnum
} from "../../../shared/enums/applicant.enum";

export class QuickApplyDto {
  @ApiProperty({ description: "Vacancy ID", example: "uuid-string" })
  @IsUUID()
  vacancyId: string;

  @ApiProperty({ description: "Full name", example: "Budi Santoso" })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ description: "Email address", example: "budi@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Phone number", example: "081234567890" })
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phone: string;

  @ApiProperty({ enum: GenderEnum, example: GenderEnum.MALE })
  @IsEnum(GenderEnum)
  gender: GenderEnum;

  @ApiProperty({ enum: MaritalStatusEnum, example: MaritalStatusEnum.SINGLE })
  @IsEnum(MaritalStatusEnum)
  maritalStatus: MaritalStatusEnum;

  @ApiProperty({ description: "Place of birth", example: "Jakarta" })
  @IsString()
  placeOfBirth: string;

  @ApiProperty({
    description: "Date of birth (YYYY-MM-DD)",
    example: "1998-01-15"
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({
    description: "Full address",
    example: "Jl. Merdeka No. 1, Jakarta"
  })
  @IsOptional()
  @IsString()
  address?: string;
}

export class QuickApplyResponseDto {
  applicant: {
    id: string;
    fullName: string;
    email: string;
  };
  application: {
    id: string;
    applicationNumber: string;
    registrationCode: string;
    status: string;
    appliedAt: Date;
  };
}
