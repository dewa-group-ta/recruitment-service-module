import { ApiProperty } from "@nestjs/swagger";
import {
  JobStatus,
  EmploymentType,
  WorkModel,
  JobType,
  SalaryPeriod,
  EducationLevel
} from "../../../shared/enums/job-status.enum";
import { PosterConfiguration } from "../../../shared/interface";

export class VacancyResponseDto {
  @ApiProperty({
    description: "Vacancy ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Vacancy title",
    example: "Senior Software Engineer"
  })
  title: string;

  @ApiProperty({
    description: "Job code (unique identifier for the job)",
    example: "SWE-001",
    nullable: true
  })
  jobCode: string;

  @ApiProperty({
    description: "Vacancy description",
    example: "We are looking for an experienced software engineer...",
    nullable: true
  })
  description: string;

  @ApiProperty({
    description: "Job responsibilities",
    example:
      "Develop and maintain web applications, collaborate with cross-functional teams...",
    nullable: true
  })
  responsibilities: string;

  @ApiProperty({
    description: "Job requirements",
    example:
      "Bachelor degree in Computer Science, 3+ years experience with React and Node.js...",
    nullable: true
  })
  requirements: string;

  @ApiProperty({
    description: "Vacancy status",
    enum: JobStatus,
    example: JobStatus.DRAFT
  })
  status: JobStatus;

  @ApiProperty({
    description: "Job type (recruitment or assessment)",
    enum: JobType,
    example: JobType.RECRUITMENT
  })
  jobType: JobType;

  @ApiProperty({
    description: "Employment type",
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME
  })
  employmentType: EmploymentType;

  @ApiProperty({
    description: "Work model",
    enum: WorkModel,
    example: WorkModel.HYBRID,
    nullable: true
  })
  workModel: WorkModel;

  @ApiProperty({
    description: "Job start date",
    example: "2024-01-15",
    nullable: true
  })
  startDate: Date;

  @ApiProperty({
    description: "Job end date",
    example: "2024-12-31",
    nullable: true
  })
  endDate: Date;

  @ApiProperty({
    description: "Enable applicant limit",
    example: true
  })
  isLimitApplicantEnabled: boolean;

  @ApiProperty({
    description: "Maximum number of applicants",
    example: 100,
    nullable: true
  })
  applicantLimit: number;

  @ApiProperty({
    description: "Enable hired limit",
    example: true
  })
  isLimitHiredEnabled: boolean;

  @ApiProperty({
    description: "Maximum number of hires",
    example: 5,
    nullable: true
  })
  hiredLimit: number;

  @ApiProperty({
    description: "Office addresses (array of office locations)",
    example: ["Jakarta Office", "Surabaya Office"],
    nullable: true,
    type: [String]
  })
  officeAddresses: string[];

  @ApiProperty({
    description: "Department",
    example: "it",
    nullable: true
  })
  department: string;

  @ApiProperty({
    description: "Minimum salary",
    example: 10000000,
    nullable: true
  })
  salaryMin: number;

  @ApiProperty({
    description: "Maximum salary",
    example: 20000000,
    nullable: true
  })
  salaryMax: number;

  @ApiProperty({
    description: "Salary period",
    enum: SalaryPeriod,
    example: SalaryPeriod.MONTHLY,
    nullable: true
  })
  salaryPeriod: SalaryPeriod;

  @ApiProperty({
    description: "Currency code",
    example: "IDR"
  })
  currency: string;

  @ApiProperty({
    description: "Recruitment pipeline ID",
    example: "uuid-string"
  })
  pipelineId: string;

  @ApiProperty({
    description: "Job category ID",
    example: "uuid-string"
  })
  jobCategoryId: string;

  @ApiProperty({
    description: "Department ID",
    example: "uuid-string",
    nullable: true
  })
  departmentId: string;

  @ApiProperty({
    description: "Required education level",
    enum: EducationLevel,
    example: EducationLevel.BACHELOR,
    nullable: true
  })
  requiredEducation: EducationLevel;

  @ApiProperty({
    description: "Required experience in years",
    example: 3,
    nullable: true
  })
  requiredExperienceYears: number;

  @ApiProperty({
    description: "Minimum hours per week",
    example: 40,
    nullable: true
  })
  hoursPerWeekMin: number;

  @ApiProperty({
    description: "Maximum hours per week",
    example: 40,
    nullable: true
  })
  hoursPerWeekMax: number;

  @ApiProperty({
    description: "Created by user ID",
    example: "uuid-string"
  })
  createdById: string;

  @ApiProperty({
    description: "Updated by user ID",
    example: "uuid-string",
    nullable: true
  })
  updatedById: string;

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

  @ApiProperty({
    description: "Generated poster URL",
    example: "vacancy-poster-123.jpg",
    nullable: true
  })
  generatedPosterUrl: string;

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
    nullable: true
  })
  posterConfiguration: PosterConfiguration;
}
