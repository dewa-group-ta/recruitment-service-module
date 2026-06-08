import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean
} from "class-validator";
import { Type, Transform } from "class-transformer";
import {
  GenderEnum,
  MaritalStatusEnum,
  AvailabilityEnum,
  AddressTypeEnum,
  IdentityTypeEnum,
  EmployeeStatus
} from "../../../shared/enums/applicant.enum";
import {
  transformToNumber,
  transformToInteger,
} from "../../../shared/transformers";

export class ApplyAddressDto {
  @ApiPropertyOptional({ example: "JABAR" })
  @IsOptional()       // ← tambah
  @IsString()
  province?: string;  // ← tambah ?

  @ApiPropertyOptional({ example: "CIANJ" })
  @IsOptional()       // ← tambah
  @IsString()
  regency?: string;   // ← tambah ?

  @ApiPropertyOptional({ example: "CAMPA" })
  @IsOptional()       // ← tambah
  @IsString()
  district?: string;  // ← tambah ?

  @ApiPropertyOptional({ example: "CIJUN" })
  @IsOptional()       // ← tambah
  @IsString()
  village?: string;   // ← tambah ?

  @ApiPropertyOptional({ example: "Jl. Kramat Pela No. 123" })
  @IsOptional()       // ← tambah
  @IsString()
  fullAddress?: string; // ← tambah ?

  @ApiPropertyOptional({ example: "12345" })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ enum: AddressTypeEnum, example: AddressTypeEnum.REGISTERED })
  @IsOptional()       // ← tambah
  @IsEnum(AddressTypeEnum)
  addressType?: AddressTypeEnum; // ← tambah ?
}

export class ApplyEducationDto {
  @ApiProperty({
    description: "Institution name",
    example: "University of Example"
  })
  @IsString()
  institutionName: string;

  @ApiProperty({
    description: "Degree",
    example: "Bachelor of Science"
  })
  @IsString()
  degree: string;

  @ApiProperty({
    description: "Field of study",
    example: "Computer Science"
  })
  @IsString()
  fieldOfStudy: string;

  @ApiProperty({
    description: "Start date in MM-YYYY format",
    example: "10-2025"
  })
  @IsString()
  startDate: string;

  @ApiProperty({
    description: "End date in MM-YYYY format",
    example: "10-2025",
    required: false
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    description: "GPA",
    example: 3.56,
    required: false
  })
  @IsOptional()
  @Transform(transformToNumber)
  @IsNumber()
  gpa?: number;
}

export class ApplyJobHistoryDto {
  @ApiProperty({
    description: "Company name",
    example: "Example Inc."
  })
  @IsString()
  companyName: string;

  @ApiProperty({
    description: "Position",
    example: "Software Engineer"
  })
  @IsString()
  position: string;

  @ApiProperty({
    description: "Start date in DD-MM-YY format",
    example: "16-10-25"
  })
  @IsString()
  startDate: string;

  @ApiProperty({
    description: "End date in DD-MM-YY format",
    example: "",
    required: false
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    description: "Employment type",
    enum: EmployeeStatus,
    example: EmployeeStatus.FULL_TIME
  })
  @IsEnum(EmployeeStatus)
  employmentType: EmployeeStatus;

  @ApiProperty({
    description: "Location",
    example: "Jakarta"
  })
  @IsString()
  location: string;

  @ApiProperty({
    description: "Job description",
    example: "Software Engineer"
  })
  @IsString()
  description: string;
}

export class ApplyProjectHistoryDto {
  @ApiProperty({
    description: "Project name",
    example: "Example Project"
  })
  @IsString()
  @IsOptional()
  projectName?: string;

  @ApiProperty({
    description: "Position in project",
    example: "Software Engineer"
  })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({
    description: "Project URL",
    example: "https://www.example.com",
    required: false
  })
  @IsOptional()
  @IsString()
  projectUrl?: string;

  @ApiProperty({
    description: "Project year",
    example: 2024
  })
  @Transform(transformToInteger)
  @IsNumber()
  @IsOptional()
  year?: number;
}

export class ApplyIdentityDto {
  @ApiProperty({
    description: "Identity type",
    enum: IdentityTypeEnum,
    example: IdentityTypeEnum.KTP
  })
  @Transform(({ value }) => value?.toLowerCase())
  @IsEnum(IdentityTypeEnum)
  identityType: IdentityTypeEnum;

  @ApiProperty({
    description: "Identity number",
    example: "1234567890"
  })
  @IsString()
  identityNumber: string;
}

export class ApplyApplicantDto {
  @ApiProperty({
    description: "Full name",
    example: "Chandika Nurdiansyah"
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: "Phone number",
    example: "083821589132"
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: "Alternative phone number",
    example: "",
    required: false
  })
  @IsOptional()
  @IsString()
  alternativePhone?: string;

  @ApiProperty({
    description: "Gender",
    enum: GenderEnum,
    example: GenderEnum.MALE
  })
  @IsEnum(GenderEnum)
  gender: GenderEnum;

  @ApiProperty({
    description: "Marital status",
    enum: MaritalStatusEnum,
    example: MaritalStatusEnum.MARRIED
  })
  @IsEnum(MaritalStatusEnum)
  maritalStatus: MaritalStatusEnum;

  @ApiProperty({
    description: "Place of birth",
    example: "fdgdsfgdsfg"
  })
  @IsString()
  placeOfBirth: string;

  @ApiProperty({
    description: "Date of birth",
    example: "2005-10-15"
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    description: "LinkedIn URL",
    example: "5s65ts4fwe3",
    required: false
  })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiProperty({
    description: "Social media URL",
    example: "n354rfa 443ed5",
    required: false
  })
  @IsOptional()
  @IsString()
  socialMediaUrl?: string;

  @ApiProperty({
    description: "Availability",
    enum: AvailabilityEnum,
    example: AvailabilityEnum.IMMEDIATELY,
    required: false
  })
  @IsOptional()
  @IsEnum(AvailabilityEnum)
  availability?: AvailabilityEnum;

  @ApiProperty({
    description: "Availability date",
    example: "",
    required: false
  })
  @IsOptional()
  @IsString()
  availabilityAt?: string;

  @ApiProperty({
    description: "Addresses",
    type: [ApplyAddressDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplyAddressDto)
  addresses: ApplyAddressDto[];

  @ApiProperty({
    description: "Education history",
    type: [ApplyEducationDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplyEducationDto)
  educations: ApplyEducationDto[];

  @ApiProperty({
    description: "Job history",
    type: [ApplyJobHistoryDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplyJobHistoryDto)
  jobHistories: ApplyJobHistoryDto[];

  @ApiProperty({
    description: "Project history",
    type: [ApplyProjectHistoryDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplyProjectHistoryDto)
  projectHistories: ApplyProjectHistoryDto[];

  @ApiProperty({
    description: "Identities",
    type: [ApplyIdentityDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplyIdentityDto)
  identities: ApplyIdentityDto[];
}
