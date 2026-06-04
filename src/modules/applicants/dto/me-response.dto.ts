import { ApiProperty } from "@nestjs/swagger";
import {
  GenderEnum,
  MaritalStatusEnum,
  AvailabilityEnum
} from "../../../shared/enums/applicant.enum";
import { ApplicationResponseDto } from "./application-response.dto";

export class ApplicantAddressDto {
  @ApiProperty({
    description: "Address ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Province",
    example: "DKI Jakarta"
  })
  province: string;

  @ApiProperty({
    description: "Regency/City",
    example: "Jakarta Selatan"
  })
  regency: string;

  @ApiProperty({
    description: "District",
    example: "Kebayoran Baru"
  })
  district: string;

  @ApiProperty({
    description: "Village",
    example: "Kramat Pela"
  })
  village: string;

  @ApiProperty({
    description: "Full address",
    example: "Jl. Kramat Pela No. 123, RT 01/RW 02"
  })
  fullAddress: string;

  @ApiProperty({
    description: "Postal code",
    example: "12130"
  })
  postalCode: string;

  @ApiProperty({
    description: "Address type",
    example: "HOME"
  })
  addressType: string;

  @ApiProperty({
    description: "Created at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  updatedAt: Date;
}

export class ApplicantEducationDto {
  @ApiProperty({
    description: "Education ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Institution name",
    example: "Universitas Indonesia"
  })
  institutionName: string;

  @ApiProperty({
    description: "Degree level",
    example: "Bachelor"
  })
  degree: string;

  @ApiProperty({
    description: "Field of study",
    example: "Computer Science"
  })
  fieldOfStudy: string;

  @ApiProperty({
    description: "Graduation year",
    example: 2020
  })
  graduationYear: number;

  @ApiProperty({
    description: "GPA",
    example: 3.5,
    nullable: true
  })
  gpa: number;

  @ApiProperty({
    description: "Created at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  updatedAt: Date;
}

export class ApplicantJobHistoryDto {
  @ApiProperty({
    description: "Job history ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Company name",
    example: "PT. Example Company"
  })
  companyName: string;

  @ApiProperty({
    description: "Position",
    example: "Software Developer"
  })
  position: string;

  @ApiProperty({
    description: "Start date",
    example: "2020-01-01"
  })
  startDate: Date;

  @ApiProperty({
    description: "End date",
    example: "2022-12-31",
    nullable: true
  })
  endDate: Date;

  @ApiProperty({
    description: "Is current job",
    example: false
  })
  isCurrent: boolean;

  @ApiProperty({
    description: "Job description",
    example: "Developed web applications using React and Node.js",
    nullable: true
  })
  description: string;

  @ApiProperty({
    description: "Created at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  updatedAt: Date;
}

export class ApplicantProjectHistoryDto {
  @ApiProperty({
    description: "Project history ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Project name",
    example: "E-commerce Platform"
  })
  projectName: string;

  @ApiProperty({
    description: "Project description",
    example: "Built a full-stack e-commerce platform"
  })
  description: string;

  @ApiProperty({
    description: "Technologies used",
    example: "React, Node.js, PostgreSQL",
    nullable: true
  })
  technologies: string;

  @ApiProperty({
    description: "Project URL",
    example: "https://example.com",
    nullable: true
  })
  projectUrl: string;

  @ApiProperty({
    description: "Start date",
    example: "2021-01-01"
  })
  startDate: Date;

  @ApiProperty({
    description: "End date",
    example: "2021-06-30",
    nullable: true
  })
  endDate: Date;

  @ApiProperty({
    description: "Created at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  updatedAt: Date;
}

export class ApplicantIdentityDto {
  @ApiProperty({
    description: "Identity ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Identity type",
    example: "KTP"
  })
  identityType: string;

  @ApiProperty({
    description: "Identity number",
    example: "1234567890123456"
  })
  identityNumber: string;

  @ApiProperty({
    description: "Created at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  updatedAt: Date;
}

export class MeResponseDto {
  @ApiProperty({
    description: "Applicant ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Email address",
    example: "john.doe@example.com"
  })
  email: string;

  @ApiProperty({
    description: "Full name",
    example: "John Doe"
  })
  fullName: string;

  @ApiProperty({
    description: "Phone number",
    example: "+6281234567890"
  })
  phone: string;

  @ApiProperty({
    description: "Alternative phone number",
    example: "+6281234567891",
    nullable: true
  })
  alternativePhone: string;

  @ApiProperty({
    description: "Gender",
    enum: GenderEnum,
    example: GenderEnum.MALE,
    nullable: true
  })
  gender: GenderEnum;

  @ApiProperty({
    description: "Marital status",
    enum: MaritalStatusEnum,
    example: MaritalStatusEnum.SINGLE,
    nullable: true
  })
  maritalStatus: MaritalStatusEnum;

  @ApiProperty({
    description: "Place of birth",
    example: "Jakarta",
    nullable: true
  })
  placeOfBirth: string;

  @ApiProperty({
    description: "Date of birth",
    example: "1990-01-01",
    nullable: true
  })
  dateOfBirth: Date;

  @ApiProperty({
    description: "Photo URL",
    example: "https://example.com/photo.jpg",
    nullable: true
  })
  photoUrl: string;

  @ApiProperty({
    description: "CV URL",
    example: "https://example.com/cv.pdf",
    nullable: true
  })
  cvUrl: string;

  @ApiProperty({
    description: "LinkedIn URL",
    example: "https://linkedin.com/in/johndoe",
    nullable: true
  })
  linkedinUrl: string;

  @ApiProperty({
    description: "Portfolio URL",
    example: "https://johndoe.dev",
    nullable: true
  })
  portfolioUrl: string;

  @ApiProperty({
    description: "Social media URL",
    example: "https://twitter.com/johndoe",
    nullable: true
  })
  socialMediaUrl: string;

  @ApiProperty({
    description: "Is internal employee",
    example: false
  })
  isInternal: boolean;

  @ApiProperty({
    description: "Availability status of the applicant",
    enum: AvailabilityEnum,
    example: AvailabilityEnum.IMMEDIATELY,
    nullable: true
  })
  availability: AvailabilityEnum;

  @ApiProperty({
    description: "Specific date when applicant will be available",
    example: "2024-02-01",
    nullable: true
  })
  availabilityAt: Date;

  @ApiProperty({
    description: "Applicant addresses",
    type: [ApplicantAddressDto]
  })
  addresses: ApplicantAddressDto[];

  @ApiProperty({
    description: "Applicant education history",
    type: [ApplicantEducationDto]
  })
  educations: ApplicantEducationDto[];

  @ApiProperty({
    description: "Applicant job history",
    type: [ApplicantJobHistoryDto]
  })
  jobHistories: ApplicantJobHistoryDto[];

  @ApiProperty({
    description: "Applicant project history",
    type: [ApplicantProjectHistoryDto]
  })
  projectHistories: ApplicantProjectHistoryDto[];

  @ApiProperty({
    description: "Applicant identities",
    type: [ApplicantIdentityDto]
  })
  identities: ApplicantIdentityDto[];

  @ApiProperty({
    description: "Applications",
    type: [ApplicationResponseDto]
  })
  applications: ApplicationResponseDto[];

  @ApiProperty({
    description: "Created at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  updatedAt: Date;
}
