import { ApiProperty } from "@nestjs/swagger";
import { ApplicantStatus } from "../../../shared/enums/applicant.enum";

export class ApplicationBasicInfoDto {
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
    description: "Vacancy title",
    example: "Senior Software Engineer"
  })
  vacancyTitle: string;

  @ApiProperty({
    description: "Application status",
    enum: ApplicantStatus,
    example: ApplicantStatus.APPLIED
  })
  status: ApplicantStatus;

  @ApiProperty({
    description: "Applied at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  appliedAt: Date;

  @ApiProperty({
    description: "Last activity timestamp",
    example: "2024-01-15T10:30:00.000Z"
  })
  lastActivityAt: Date;
}

export class StageTrackingDto {
  @ApiProperty({
    description: "Stage ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Stage order in pipeline",
    example: 1
  })
  stageOrder: number;

  @ApiProperty({
    description: "Stage name",
    example: "Application Review"
  })
  stageName: string;

  @ApiProperty({
    description: "Stage status",
    enum: ["pending", "in_progress", "completed", "rejected"],
    example: "completed"
  })
  status: string;

  @ApiProperty({
    description: "Stage started at",
    example: "2024-01-01T00:00:00.000Z",
    nullable: true
  })
  startedAt?: Date;

  @ApiProperty({
    description: "Stage completed at",
    example: "2024-01-03T00:00:00.000Z",
    nullable: true
  })
  completedAt?: Date;

  @ApiProperty({
    description: "Current score in this stage",
    example: 90,
    nullable: true
  })
  currentScore?: number;

  @ApiProperty({
    description: "Current notes in this stage",
    example: "Application looks good",
    nullable: true
  })
  currentNotes?: string;
}

export class CurrentStageInfoDto {
  @ApiProperty({
    description: "Current stage ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Current stage order",
    example: 2
  })
  stageOrder: number;

  @ApiProperty({
    description: "Current stage name",
    example: "Technical Test"
  })
  stageName: string;

  @ApiProperty({
    description: "Current stage status",
    enum: ["pending", "in_progress", "completed", "rejected"],
    example: "in_progress"
  })
  status: string;

  @ApiProperty({
    description: "Days in current stage",
    example: 12
  })
  daysInCurrentStage: number;

  @ApiProperty({
    description: "Estimated remaining days",
    example: 2
  })
  estimatedRemainingDays: number;

  @ApiProperty({
    description: "Progress percentage in current stage",
    example: 85
  })
  progressPercentage: number;
}

export class ProgressInfoDto {
  @ApiProperty({
    description: "Total stages in pipeline",
    example: 5
  })
  totalStages: number;

  @ApiProperty({
    description: "Number of completed stages",
    example: 1
  })
  completedStages: number;

  @ApiProperty({
    description: "Current stage order",
    example: 2
  })
  currentStageOrder: number;

  @ApiProperty({
    description: "Overall progress percentage",
    example: 20
  })
  overallProgressPercentage: number;

  @ApiProperty({
    description: "Estimated completion date",
    example: "2024-01-25T00:00:00.000Z"
  })
  estimatedCompletionDate: Date;

  @ApiProperty({
    description: "Days since application",
    example: 14
  })
  daysSinceApplication: number;
}

export class ApplicationTrackingResponseDto {
  @ApiProperty({
    description: "Application basic information",
    type: ApplicationBasicInfoDto
  })
  application: ApplicationBasicInfoDto;

  @ApiProperty({
    description: "List of stages with tracking information",
    type: [StageTrackingDto]
  })
  stages: StageTrackingDto[];

  @ApiProperty({
    description: "Current stage information",
    type: CurrentStageInfoDto
  })
  currentStage: CurrentStageInfoDto;

  @ApiProperty({
    description: "Overall progress information",
    type: ProgressInfoDto
  })
  progress: ProgressInfoDto;
}
