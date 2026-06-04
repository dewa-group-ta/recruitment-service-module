import { ApiProperty } from "@nestjs/swagger";
import {
  EmploymentType,
  WorkModel,
  JobType,
  EducationLevel,
  JobStatus
} from "../../../shared/enums/job-status.enum";
import { PosterConfiguration } from "../../../shared/interface";

export class PublicVacancyResponseDto {
  @ApiProperty({
    description: "Vacancy ID",
    example: "uuid-string"
  })
  id!: string;

  @ApiProperty({
    description: "Vacancy title",
    example: "Senior Software Engineer"
  })
  title!: string;

  @ApiProperty({
    description: "Vacancy description",
    example: "We are looking for an experienced software engineer...",
    nullable: true
  })
  description!: string;

  @ApiProperty({
    description: "Job responsibilities",
    example: "Develop and maintain web applications, collaborate with cross-functional teams...",
    nullable: true
  })
  responsibilities!: string;

  @ApiProperty({
    description: "Job requirements",
    example: "Bachelor degree in Computer Science, 3+ years experience with React and Node.js...",
    nullable: true
  })
  requirements!: string;

  @ApiProperty({
    description: "Job type (recruitment or assessment)",
    enum: JobType,
    example: JobType.RECRUITMENT
  })
  jobType!: JobType;

  @ApiProperty({
    description: "Employment type",
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME
  })
  employmentType!: EmploymentType;

  @ApiProperty({
    description: "Work model",
    enum: WorkModel,
    example: WorkModel.HYBRID
  })
  workModel!: WorkModel;

  @ApiProperty({
    description: "Office addresses (array of office locations)",
    example: ["Jakarta Office", "Surabaya Office"],
    nullable: true,
    type: [String]
  })
  officeAddresses!: string[];

  @ApiProperty({
    description: "Application deadline",
    example: "2024-12-31T23:59:59.000Z",
    nullable: true
  })
  applicationDeadline!: Date;

  @ApiProperty({
    description: "Expected start date",
    example: "2024-01-15",
    nullable: true
  })
  expectedStartDate!: Date;

  @ApiProperty({
    description: "Required education level",
    enum: EducationLevel,
    example: EducationLevel.BACHELOR,
    nullable: true
  })
  requiredEducation!: EducationLevel;

  @ApiProperty({
    description: "Required experience in years",
    example: 3,
    nullable: true
  })
  requiredExperienceYears!: number;

  @ApiProperty({
    description: "Job category information",
    example: {
      id: "uuid-string",
      name: "Software Engineering"
    }
  })
  jobCategory!: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: "Generated poster URL",
    example: "vacancy-poster-123.jpg",
    nullable: true
  })
  generatedPosterUrl!: string;

  @ApiProperty({
    description: "Vacancy status",
    enum: JobStatus,
    example: JobStatus.PUBLISHED
  })
  status!: JobStatus;

  @ApiProperty({
    description: "Vacancy start date",
    example: "2024-01-15",
    nullable: true
  })
  startDate!: Date;

  @ApiProperty({
    description: "Vacancy end date",
    example: "2024-12-31",
    nullable: true
  })
  endDate!: Date;

  @ApiProperty({
    description: "Poster configuration - defines which fields to include in job poster",
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
  posterConfiguration!: PosterConfiguration;
}
