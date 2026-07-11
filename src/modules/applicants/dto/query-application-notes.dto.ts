import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsBoolean, IsIn } from "class-validator";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";

export class QueryApplicationNotesDto extends BaseFindAllDto {
  @ApiPropertyOptional({
    description: "Filter by application ID",
    example: "uuid-string"
  })
  @IsString()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional({
    description: "Filter by category",
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
    description: "Filter by priority",
    example: "high",
    enum: ["high", "medium", "low"]
  })
  @IsString()
  @IsOptional()
  @IsIn(["high", "medium", "low"])
  priority?: string;

  @ApiPropertyOptional({
    description: "Filter by private notes",
    example: false
  })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: "Filter by HR who created the notes",
    example: "john.doe@company.com"
  })
  @IsString()
  @IsOptional()
  createdBy?: string;
}
