import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsUUID,
  MaxLength
} from "class-validator";

export class CreateNotificationTemplateDto {
  @ApiProperty({
    description: "Notification template name",
    example: "Interview Invitation Email",
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: "Stage template ID this notification is associated with",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @IsUUID()
  @IsOptional()
  stageTemplateId?: string;

  @ApiProperty({
    description: "Trigger event for this notification",
    example: "interview_scheduled",
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  triggerEvent: string;

  @ApiProperty({
    description: "Email subject template with placeholders",
    example: "Interview Invitation - {{position}} at {{company}}"
  })
  @IsString()
  @IsNotEmpty()
  subjectTemplate: string;

  @ApiProperty({
    description: "Email body template with placeholders",
    example:
      "Dear {{candidateName}}, you are invited for an interview for {{position}} position..."
  })
  @IsString()
  @IsNotEmpty()
  bodyTemplate: string;

  @ApiPropertyOptional({
    description: "Whether this notification template is active",
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
