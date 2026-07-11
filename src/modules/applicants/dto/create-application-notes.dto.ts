import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsUUID, IsIn } from "class-validator";

export class CreateApplicationNotesDto {
  @ApiProperty({
    description: "Application ID",
    example: "uuid-string"
  })
  @IsUUID()
  applicationId: string;

  @ApiProperty({
    description: "Notes content",
    example: "Candidate shows strong technical skills during interview"
  })
  @IsString()
  notes: string;

  @ApiPropertyOptional({
    description: "HR who created the notes",
    example: "john.doe@company.com"
  })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({
    description: "Whether notes are private (only visible to specific HR)",
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: "Category of the notes",
    example: "interview",
    enum: [
      "interview",
      "assessment",
      "general",
      "follow_up",
      "rejection",
      "offer"
    ]
  })
  @IsString()
  @IsOptional()
  @IsIn([
    "interview",
    "assessment",
    "general",
    "follow_up",
    "rejection",
    "offer"
  ])
  category?: string;

  @ApiPropertyOptional({
    description: "Priority level of the notes",
    example: "high",
    enum: ["high", "medium", "low"]
  })
  @IsString()
  @IsOptional()
  @IsIn(["high", "medium", "low"])
  priority?: string;
}
