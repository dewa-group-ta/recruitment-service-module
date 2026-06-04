import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class StageTemplateResponseDto {
  @ApiProperty({
    description: "Stage template ID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  id: string;

  @ApiProperty({
    description: "Stage template name",
    example: "Technical Interview"
  })
  name: string;

  @ApiPropertyOptional({
    description: "Stage template description",
    example: "Technical interview stage for engineering positions"
  })
  description?: string;

  @ApiPropertyOptional({
    description: "Maximum duration in days for this stage",
    example: 7
  })
  maxDurationDays?: number;

  @ApiProperty({
    description: "Can send notifications in this stage",
    example: true
  })
  canNotify: boolean;

  @ApiProperty({
    description: "Can give score/rating in this stage",
    example: true
  })
  canScore: boolean;

  @ApiPropertyOptional({
    description: "Instructions for HR in this stage",
    example: "Conduct technical assessment focusing on problem-solving skills"
  })
  instructions?: string;

  @ApiProperty({
    description: "Whether this stage template is active",
    example: true
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: "Category of stage template",
    example: "engineering"
  })
  category?: string;

  @ApiProperty({
    description: "ID of user who created this stage template",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  createdById: string;

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
