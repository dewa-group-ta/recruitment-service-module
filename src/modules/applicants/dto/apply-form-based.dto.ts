import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsEnum,
  IsDateString,
  IsUUID,
  MaxLength,
  MinLength,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty
} from "class-validator";
import { Type } from "class-transformer";
import {
  GenderEnum,
  MaritalStatusEnum,
  AvailabilityEnum,
  EmployeeStatus
} from "../../../shared/enums/applicant.enum";

export class AddressFormDto {
  @ApiProperty() @IsString() @IsNotEmpty() province: string;
  @ApiProperty() @IsString() @IsNotEmpty() regency: string;
  @ApiProperty() @IsString() @IsNotEmpty() district: string;
  @ApiProperty() @IsString() @IsNotEmpty() village: string;
  @ApiProperty() @IsString() @IsNotEmpty() fullAddress: string;
}

export class EducationFormDto {
  @ApiProperty() @IsString() @IsNotEmpty() institutionName: string;
  @ApiProperty() @IsString() @IsNotEmpty() degree: string;
  @ApiPropertyOptional() @IsOptional() @IsString() major?: string;
  @ApiProperty() @IsString() @IsNotEmpty() monthStart: string;
  @ApiProperty() @IsString() @IsNotEmpty() monthEnd: string;
}

export class ExperienceFormDto {
  @ApiProperty() @IsString() @IsNotEmpty() position: string;
  @ApiPropertyOptional() @IsOptional() @IsString() company?: string;
  @ApiProperty({ enum: EmployeeStatus })
  @IsEnum(EmployeeStatus)
  employeeStatus: EmployeeStatus;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) description: string;
}

export class ApplyFormBasedDto {
  @ApiProperty() @IsUUID() vacancyId: string;

  // data pribadi
  @ApiProperty() @IsString() @MaxLength(100) fullName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(9) @MaxLength(20) phone: string;
  @ApiProperty({ enum: GenderEnum }) @IsEnum(GenderEnum) gender: GenderEnum;
  @ApiProperty({ enum: MaritalStatusEnum })
  @IsEnum(MaritalStatusEnum)
  maritalStatus: MaritalStatusEnum;
  @ApiProperty() @IsString() placeOfBirth: string;
  @ApiProperty() @IsDateString() dateOfBirth: string;

  @ApiPropertyOptional() @IsOptional() @IsString() identityType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() identityNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cvUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() socialMediaUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() linkedinUrl?: string;

  // alamat
  @ApiProperty({ type: AddressFormDto })
  @ValidateNested()
  @Type(() => AddressFormDto)
  address: AddressFormDto;

  // pendidikan
  @ApiProperty({ type: EducationFormDto })
  @ValidateNested()
  @Type(() => EducationFormDto)
  education: EducationFormDto;

  // pengalaman kerja
  @ApiProperty({ type: [ExperienceFormDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceFormDto)
  experiences: ExperienceFormDto[];

  // ketersediaan
  @ApiProperty({ enum: AvailabilityEnum })
  @IsEnum(AvailabilityEnum)
  availability: AvailabilityEnum;
  @ApiPropertyOptional() @IsOptional() @IsDateString() availabilityAt?: string;
}

export class ApplyFormBasedResponseDto {
  applicant: { id: string; fullName: string; email: string };
  application: {
    id: string;
    applicationNumber: string;
    registrationCode: string;
    status: string;
    appliedAt: Date;
  };
}
