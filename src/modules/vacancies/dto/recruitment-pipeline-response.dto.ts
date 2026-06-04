import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PipelineStageResponseDto } from "./pipeline-stage-response.dto";

export class RecruitmentPipelineResponseDto {
  @ApiProperty({
    description: "Recruitment pipeline ID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  id: string;

  @ApiProperty({
    description: "Recruitment pipeline name",
    example: "Engineering Recruitment Pipeline"
  })
  name: string;

  @ApiPropertyOptional({
    description: "Recruitment pipeline description",
    example: "Standard recruitment process for engineering positions"
  })
  description?: string;

  @ApiProperty({
    description: "Pipeline version",
    example: "1.0"
  })
  version: string;

  @ApiProperty({
    description: "Whether this pipeline is the default pipeline",
    example: false
  })
  isDefault: boolean;

  @ApiProperty({
    description: "Whether this pipeline is active",
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: "Whether this pipeline is a template",
    example: true
  })
  isTemplate: boolean;

  @ApiPropertyOptional({
    description: "Category of the pipeline",
    example: "engineering"
  })
  category?: string;

  @ApiProperty({
    description: "Usage count of this pipeline template",
    example: 5
  })
  usageCount: number;

  @ApiProperty({
    description: "ID of user who created this pipeline",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  createdById: string;

  @ApiPropertyOptional({
    description: "Pipeline stages",
    type: [PipelineStageResponseDto]
  })
  stages?: PipelineStageResponseDto[];

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

  @ApiPropertyOptional({
    description: "Soft delete timestamp",
    example: null
  })
  deletedAt?: Date;
}
