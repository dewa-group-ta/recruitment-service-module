import { ApiProperty } from '@nestjs/swagger';
import { StageActivityStatus } from 'src/shared/enums/pipeline.enum';

export class StageProgressDto {
  @ApiProperty({
    description: 'Stage title',
    example: 'Applied'
  })
  title: string;

  @ApiProperty({
    description: 'Stage completion date',
    example: '2024-01-15T10:30:00Z',
    required: false
  })
  date?: string;

  @ApiProperty({
    description: 'Stage status',
    enum: ['done', 'in-progress', 'pending'],
    example: 'done'
  })
  status: StageActivityStatus;

  @ApiProperty({
    description: 'Stage score',
    example: 90,
    required: false
  })
  score?: number;

  @ApiProperty({
    description: 'Stage notes',
    example: 'Application submitted successfully',
    required: false
  })
  notes?: string;

  @ApiProperty({
    description: 'Whether this stage can accept scores',
    example: true
  })
  canScore: boolean;
}

export class HiringProgressDto {
  @ApiProperty({
    description: 'Current stage name',
    example: 'Interview'
  })
  currentStage: string;

  @ApiProperty({
    description: 'Upcoming stage name',
    example: 'Offering'
  })
  upcomingStage: string;

  @ApiProperty({
    description: 'Overall candidate score',
    example: 87.5
  })
  overallScore: number;

  @ApiProperty({
    description: 'Whether current stage can accept scores',
    example: true
  })
  currentStageCanScore: boolean;

  @ApiProperty({
    description: 'Whether upcoming stage can accept scores',
    example: false
  })
  upcomingStageCanScore: boolean;

  @ApiProperty({
    description: 'List of stages with their progress',
    type: [StageProgressDto]
  })
  stages: StageProgressDto[];
}
