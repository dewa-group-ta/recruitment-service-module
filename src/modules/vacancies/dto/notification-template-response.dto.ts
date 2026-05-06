import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class NotificationTemplateResponseDto {
  @ApiProperty({
    description: "Notification template ID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  id: string;

  @ApiProperty({
    description: "Notification template name",
    example: "Interview Invitation Email"
  })
  name: string;

  @ApiPropertyOptional({
    description: "Stage template ID this notification is associated with",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  stageTemplateId?: string;

  @ApiProperty({
    description: "Trigger event for this notification",
    example: "interview_scheduled"
  })
  triggerEvent: string;

  @ApiProperty({
    description: "Email subject template with placeholders",
    example: "Interview Invitation - {{position}} at {{company}}"
  })
  subjectTemplate: string;

  @ApiProperty({
    description: "Email body template with placeholders",
    example:
      "Dear {{candidateName}}, you are invited for an interview for {{position}} position..."
  })
  bodyTemplate: string;

  @ApiProperty({
    description: "Whether this notification template is active",
    example: true
  })
  isActive: boolean;

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
