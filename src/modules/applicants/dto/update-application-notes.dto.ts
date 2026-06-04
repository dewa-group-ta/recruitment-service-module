import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsIn } from "class-validator";

export class UpdateApplicationNotesDto {
  @ApiPropertyOptional({
    description: "Notes content",
    example: "Updated notes: Candidate shows strong technical skills during interview"
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: "HR who updated the notes",
    example: "jane.doe@company.com"
  })
  @IsString()
  @IsOptional()
  updatedBy?: string;

  @ApiPropertyOptional({
    description: "Whether notes are private (only visible to specific HR)",
    example: false
  })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: "Category of the notes",
    example: "interview",
    enum: ["interview", "assessment", "general", "follow_up", "rejection", "offer"]
  })
  @IsString()
  @IsOptional()
  @IsIn(["interview", "assessment", "general", "follow_up", "rejection", "offer"])
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
