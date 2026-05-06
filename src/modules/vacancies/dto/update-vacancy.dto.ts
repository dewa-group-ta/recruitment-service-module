import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  MaxLength,
  Min,
  IsUUID,
  IsArray
} from "class-validator";
import {
  JobStatus,
  EmploymentType,
  WorkModel,
  JobType,
  SalaryPeriod,
  EducationLevel
} from "../../../shared/enums/job-status.enum";
import { PosterConfiguration } from "../../../shared/interface";
import { IsEnumOrNull } from "../../../shared/validators/enum-or-null.validator";
import { EmptyStringToNull } from "../../../shared/transformers/empty-string-to-null.transformer";

export class UpdateVacancyDto {
  @ApiProperty({
    description: "Vacancy title",
    example: "Senior Software Engineer",
    maxLength: 255,
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: "Vacancy description",
    example: "We are looking for an experienced software engineer...",
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: "Job responsibilities",
    example:
      "Develop and maintain web applications, collaborate with cross-functional teams...",
    required: false
  })
  @IsString()
  @IsOptional()
  responsibilities?: string;

  @ApiProperty({
    description: "Job requirements",
    example:
      "Bachelor degree in Computer Science, 3+ years experience with React and Node.js...",
    required: false
  })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiProperty({
    description: "Vacancy status",
    enum: JobStatus,
    example: JobStatus.DRAFT,
    required: false
  })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @ApiProperty({
    description: "Job type (recruitment or assessment)",
    enum: JobType,
    example: JobType.RECRUITMENT,
    required: false
  })
  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;

  @ApiProperty({
    description: "Employment type",
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
    required: false
  })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiProperty({
    description: "Work model",
    enum: WorkModel,
    example: WorkModel.HYBRID,
    required: false
  })
  @IsEnum(WorkModel)
  @IsOptional()
  workModel?: WorkModel;

  @ApiProperty({
    description: "Maximum number of applicants",
    example: 100,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  applicantLimit?: number;

  @ApiProperty({
    description: "Maximum number of hires",
    example: 5,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  hiredLimit?: number;

  @ApiProperty({
    description: "Office addresses (array of office locations)",
    example: ["Jakarta Office", "Surabaya Office"],
    required: false,
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  officeAddresses?: string[];

  @ApiProperty({
    description: "Minimum salary",
    example: 10000000,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  salaryMin?: number;

  @ApiProperty({
    description: "Maximum salary",
    example: 20000000,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  salaryMax?: number;

  @ApiProperty({
    description: "Salary period",
    enum: SalaryPeriod,
    example: SalaryPeriod.MONTHLY,
    required: false
  })
  @IsEnumOrNull(SalaryPeriod)
  @EmptyStringToNull()
  @IsOptional()
  salaryPeriod?: SalaryPeriod | null;

  @ApiProperty({
    description: "Currency code",
    example: "IDR",
    maxLength: 3,
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({
    description: "Application deadline",
    example: "2024-12-31T23:59:59.000Z",
    required: false
  })
  @IsDateString()
  @IsOptional()
  applicationDeadline?: string;

  @ApiProperty({
    description: "Expected start date",
    example: "2024-01-15",
    required: false
  })
  @IsDateString()
  @IsOptional()
  expectedStartDate?: string;

  @ApiProperty({
    description: "Published date",
    example: "2024-01-01T00:00:00.000Z",
    required: false
  })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @ApiProperty({
    description: "Archived date",
    example: "2024-12-31T23:59:59.000Z",
    required: false
  })
  @IsDateString()
  @IsOptional()
  archivedAt?: string;

  @ApiProperty({
    description: "Closed date",
    example: "2024-12-31T23:59:59.000Z",
    required: false
  })
  @IsDateString()
  @IsOptional()
  closedAt?: string;

  @ApiProperty({
    description: "Recruitment pipeline ID",
    example: "uuid-string",
    required: false
  })
  @IsUUID()
  @IsOptional()
  pipelineId?: string;

  @ApiProperty({
    description: "Department ID",
    example: "uuid-string",
    required: false
  })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({
    description: "Required education level",
    enum: EducationLevel,
    example: EducationLevel.BACHELOR,
    required: false
  })
  @IsEnumOrNull(EducationLevel)
  @EmptyStringToNull()
  @IsOptional()
  requiredEducation?: EducationLevel | null;

  @ApiProperty({
    description: "Required experience in years",
    example: 3,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  requiredExperienceYears?: number;

  @ApiProperty({
    description: "Minimum hours per week",
    example: 40,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  hoursPerWeekMin?: number;

  @ApiProperty({
    description: "Maximum hours per week",
    example: 40,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  hoursPerWeekMax?: number;

  @ApiProperty({
    description: "Generated poster URL",
    example: "vacancy-poster-123.jpg",
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  generatedPosterUrl?: string;

  @ApiProperty({
    description:
      "Poster configuration - defines which fields to include in job poster",
    example: {
      jobDetails: {
        dueDate: true,
        jobTitle: true,
        jobType: true,
        applicantLimit: false
      },
      employmentDetails: {
        employmentType: true,
        category: true,
        education: true,
        experience: true
      },
      jobOverview: {
        description: true,
        responsibilities: true,
        requirements: true
      },
      locations: {
        locations: true
      },
      workModel: {
        workModel: true
      },
      salary: {
        salary: true
      }
    },
    required: false
  })
  @IsOptional()
  posterConfiguration?: PosterConfiguration;
}
