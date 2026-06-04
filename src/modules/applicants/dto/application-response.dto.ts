import { ApiProperty } from "@nestjs/swagger";
import { ApplicantStatus } from "../../../shared/enums/applicant.enum";

export class ApplicationResponseDto {
  @ApiProperty({
    description: "Application ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Application number",
    example: "APP-2024-001"
  })
  applicationNumber: string;

  @ApiProperty({
    description: "Applicant ID",
    example: "uuid-string"
  })
  applicantId: string;

  @ApiProperty({
    description: "Vacancy ID",
    example: "uuid-string"
  })
  vacancyId: string;

  @ApiProperty({
    description: "Pipeline ID",
    example: "uuid-string"
  })
  pipelineId: string;

  @ApiProperty({
    description: "Current stage ID",
    example: "uuid-string",
    nullable: true
  })
  currentStageId: string;

  @ApiProperty({
    description: "Application status",
    enum: ApplicantStatus,
    example: ApplicantStatus.APPLIED
  })
  status: ApplicantStatus;

  @ApiProperty({
    description: "Cover letter",
    example: "I am very interested in this position...",
    nullable: true
  })
  coverLetter: string;

  @ApiProperty({
    description: "Expected start date",
    example: "2024-02-01",
    nullable: true
  })
  expectedStartDate: Date;

  @ApiProperty({
    description: "Application source",
    example: "Company Website",
    nullable: true
  })
  source: string;

  @ApiProperty({
    description: "Custom source description (when Others is selected)",
    example: "Company website",
    nullable: true
  })
  customSource: string;

  @ApiProperty({
    description: "Applied at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  appliedAt: Date;

  @ApiProperty({
    description: "Completed at timestamp",
    example: "2024-01-15T00:00:00.000Z",
    nullable: true
  })
  completedAt: Date;

  @ApiProperty({
    description: "Current score",
    example: 85,
    nullable: true
  })
  currentScore: number;

  @ApiProperty({
    description: "Current notes",
    example: "Good candidate, passed initial screening",
    nullable: true
  })
  currentNotes: string;

  @ApiProperty({
    description: "Last activity timestamp",
    example: "2024-01-10T00:00:00.000Z",
    nullable: true
  })
  lastActivityAt: Date;

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
