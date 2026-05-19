import { ApiProperty } from '@nestjs/swagger';

export class JobVacancyDto {
  @ApiProperty({
    description: 'Job vacancy ID',
    example: 'uuid-string'
  })
  id!: string;

  @ApiProperty({
    description: 'Job title',
    example: 'Frontend Developer'
  })
  title!: string;

  @ApiProperty({
    description: 'Job status',
    example: 'published',
    enum: ['published', 'draft', 'closed', 'archived']
  })
  status!: string;

  @ApiProperty({
    description: 'Department name',
    example: 'Engineering',
    required: false
  })
  department?: string;

  @ApiProperty({
    description: 'Work location',
    example: 'Jakarta',
    required: false
  })
  workLocation?: string;
}

export class ApplicantTableItemDto {
  @ApiProperty({
    description: 'Application ID',
    example: 'app-001'
  })
  id!: string;

  @ApiProperty({
    description: 'Application ID (alias)',
    example: 'app-001'
  })
  applicationId!: string;

  @ApiProperty({
    description: 'Applicant ID',
    example: 'user-123'
  })
  applicantId!: string;

  @ApiProperty({
    description: 'Applicant name',
    example: 'John Doe'
  })
  name!: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@email.com'
  })
  email!: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+6281234567890'
  })
  phone!: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatars/john.jpg',
    required: false
  })
  avatar?: string;

  @ApiProperty({
    description: 'Age',
    example: 28,
    required: false
  })
  age?: number;

  @ApiProperty({
    description: 'Job vacancy information',
    type: JobVacancyDto
  })
  jobVacancy!: JobVacancyDto;

  @ApiProperty({
    description: 'Application status',
    example: 'qualified',
    enum: ['new', 'qualified', 'disqualified']
  })
  status!: string;

  @ApiProperty({
    description: 'Current recruitment stage',
    example: 'Interview'
  })
  currentStage!: string;

  @ApiProperty({
    description: 'Current stage score',
    example: 85,
    required: false
  })
  currentScore?: number;

  @ApiProperty({
    description: 'Is in talent pool',
    example: true
  })
  isTalentPool!: boolean;

  @ApiProperty({
    description: 'Application date',
    example: '2024-01-15T10:30:00Z'
  })
  applyDate!: string;

  @ApiProperty({
    description: 'Last activity date',
    example: '2024-01-20T14:15:00Z',
    required: false
  })
  lastActivityAt?: string;

  @ApiProperty({
    description: 'Application source',
    example: 'linkedin',
    required: false
  })
  source?: string;

  @ApiProperty({
    description: 'Expected start date',
    example: '2024-02-01',
    required: false
  })
  expectedStartDate?: string;

  @ApiProperty({
    description: 'Cover letter',
    example: 'I am very interested in this position...',
    required: false
  })
  coverLetter?: string;

  @ApiProperty({
    description: 'Skor total WSM hasil screening CV otomatis (0.0–1.0). Null jika scoring belum selesai.',
    example: 0.82,
    required: false
  })
  totalScore?: number | null;
}

export class ApplicantTableResponseDto {
  @ApiProperty({
    description: 'Response code',
    example: 200
  })
  responseCode!: number;

  @ApiProperty({
    description: 'Response description',
    example: 'Success'
  })
  responseDesc!: string;

  @ApiProperty({
    description: 'Applicant data',
    type: [ApplicantTableItemDto]
  })
  data!: ApplicantTableItemDto[];

  @ApiProperty({
    description: 'Pagination information',
    example: {
      page: 1,
      limit: 10,
      total: 150,
      totalPages: 15,
      hasNext: true,
      hasPrev: false
    }
  })
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ApplicantSummaryDataDto {
  @ApiProperty({
    description: 'Total number of applicants',
    example: 150
  })
  total!: number;

  @ApiProperty({
    description: 'Count by status',
    example: {
      new: 45,
      qualified: 78,
      disqualified: 27,
      talentPool: 12
    }
  })
  byStatus!: {
    new: number;
    qualified: number;
    disqualified: number;
    talentPool: number;
  };

  @ApiProperty({
    description: 'Count by stage',
    example: {
      'Applied': 45,
      'Screening': 23,
      'Interview': 15,
      'Final Review': 8,
      'Offered': 5,
      'Hired': 2
    }
  })
  byStage!: {
    [stageName: string]: number;
  };

  @ApiProperty({
    description: 'Count by job status',
    example: {
      published: 120,
      draft: 20,
      closed: 8,
      archived: 2
    }
  })
  byJobStatus!: {
    published: number;
    draft: number;
    closed: number;
    archived: number;
  };


  @ApiProperty({
    description: 'Recent applications (last 7 days)',
    example: 12
  })
  recentApplications!: number;

  @ApiProperty({
    description: 'Application trends by day',
    required: false,
    example: [
      { date: '2024-01-15', count: 5 },
      { date: '2024-01-16', count: 8 },
      { date: '2024-01-17', count: 3 }
    ]
  })
  trends?: {
    applicationsByDay: Array<{
      date: string;
      count: number;
    }>;
  };

  @ApiProperty({
    description: 'Top application sources',
    required: false,
    example: [
      { source: 'linkedin', count: 45 },
      { source: 'jobstreet', count: 32 },
      { source: 'direct', count: 28 }
    ]
  })
  topSources?: Array<{
    source: string;
    count: number;
  }>;
}

export class ApplicantSummaryResponseDto {
  @ApiProperty({
    description: 'Response code',
    example: 200
  })
  responseCode!: number;

  @ApiProperty({
    description: 'Response description',
    example: 'Success'
  })
  responseDesc!: string;

  @ApiProperty({
    description: 'Summary data',
    type: ApplicantSummaryDataDto
  })
  data!: ApplicantSummaryDataDto;
}