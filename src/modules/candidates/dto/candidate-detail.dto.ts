import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export class CandidateDetailDto {
  @ApiProperty({
    description: 'Candidate ID',
    example: 'uuid-string'
  })
  id!: string;

  @ApiProperty({
    description: 'Application ID',
    example: 'uuid-string'
  })
  applicationId!: string;

  @ApiProperty({
    description: 'Application number',
    example: 'APP-2024-001'
  })
  applicationNumber!: string;

  @ApiProperty({
    description: 'Applicant ID',
    example: 'uuid-string'
  })
  applicantId!: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe'
  })
  fullName!: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com'
  })
  email!: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+62 812-3456-7890'
  })
  phone!: string;

  @ApiProperty({
    description: 'Application status',
    example: 'applied',
    enum: ['applied', 'hired', 'rejected']
  })
  status!: string;

  @ApiProperty({
    description: 'Current recruitment stage',
    example: 'Interview'
  })
  currentStage!: string;

  @ApiProperty({
    description: 'Current score',
    example: 85,
    required: false
  })
  score?: number;

  @ApiProperty({
    description: 'Application date',
    example: '2024-01-15T10:30:00Z'
  })
  appliedAt!: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false
  })
  avatar?: string;

  @ApiProperty({
    description: 'Education level',
    example: 'Bachelor Degree',
    required: false
  })
  education?: string;

  @ApiProperty({
    description: 'Experience level',
    example: '3 years',
    required: false
  })
  experience?: string;

  @ApiProperty({
    description: 'Cover letter',
    example: 'I am interested in this position...',
    required: false
  })
  coverLetter?: string;

  @ApiProperty({
    description: 'Expected start date',
    example: '2024-02-01',
    required: false
  })
  expectedStartDate?: string;

  @ApiProperty({
    description: 'Application source',
    example: 'LinkedIn',
    required: false
  })
  source?: string;

  @ApiProperty({
    description: 'Vacancy information',
    required: false
  })
  vacancy?: {
    id: string;
    title: string;
    status: string;
    department?: string;
    workLocation?: string;
  };

  @ApiProperty({
    description: 'Address information',
    required: false
  })
  @ApiProperty({ type: () => EvaluationScoreDetailDto, nullable: true, description: 'Hasil scoring WSM — null jika scoring belum selesai' })
  evaluationResult?: EvaluationScoreDetailDto | null;

  address?: Array<{
    id: string;
    applicantId: string;
    province: string;
    regency: string;
    district: string;
    village: string;
    fullAddress: string;
    postalCode: string;
    addressType: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }>;
}


export class EvaluationScoreDetailDto {
  @ApiProperty({ example: 0.729, nullable: true })
  maxExperienceScore!: number | null;

  @ApiProperty({
    enum: ['lolos', 'tidak_lolos'],
    nullable: true,
    description: 'Keputusan rekruter — null jika belum ditetapkan'
  })
  decision!: string | null;

  @ApiProperty({ nullable: true, description: 'Breakdown skor per komponen (JSON)' })
  evaluateDetail!: Record<string, any> | null;

  @ApiProperty({ nullable: true })
  evaluatedAt!: Date | null;
}

export class UpdateCandidateStatusDto {
  @ApiProperty({
    description: 'New status',
    example: 'hired',
    enum: ['applied', 'hired', 'rejected']
  })
  @IsString()
  status!: string;

  @ApiProperty({
    description: 'Notes about the status change',
    example: 'Candidate passed all interviews',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Score for the current stage (used when rejecting)',
    example: 45,
    required: false
  })
  @IsOptional()
  @IsNumber()
  score?: number;
}

export class MoveToNextStageDto {
  @ApiProperty({
    description: 'Notes about the stage change',
    example: 'Moving to final interview',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Score value',
    example: 'Moving to final interview',
    required: false
  })
  @IsOptional()
  @IsNumber()
  score!: number;
}

export class AddCandidateScoreDto {
  @ApiProperty({
    description: 'Score value',
    example: 85,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  score!: number;

  @ApiProperty({
    description: 'Notes about the score',
    example: 'Excellent technical skills',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTalentPoolDto {
  @ApiProperty({
    description: 'Talent pool status',
    example: true
  })
  @IsBoolean()
  isTalentPool!: boolean;

  @ApiProperty({
    description: 'Notes about the talent pool status change',
    example: 'Candidate added to talent pool for future opportunities',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}