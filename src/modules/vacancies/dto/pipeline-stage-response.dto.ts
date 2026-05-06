import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StageTemplate } from "../entities/stage-template.entity";

export class PipelineStageResponseDto {
  @ApiProperty({
    description: "Pipeline stage ID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  id: string;

  @ApiProperty({
    description: "Pipeline ID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  pipelineId: string;

  @ApiProperty({
    description: "Stage template ID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  stageTemplateId: string;

  @ApiPropertyOptional({
    description: "Stage template",
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Stage 1"
    }
  })
  stageTemplate?: StageTemplate;

  @ApiProperty({
    description: "Stage order in pipeline",
    example: 1
  })
  stageOrder: number;

  @ApiPropertyOptional({
    description: "Estimated duration in days",
    example: 7
  })
  estimatedDurationDays?: number;

  @ApiProperty({
    description: "Whether to send notification",
    example: true
  })
  sendNotification: boolean;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-15T10:30:00.000Z"
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-15T10:30:00.000Z"
  })
  updatedAt: Date;
}
