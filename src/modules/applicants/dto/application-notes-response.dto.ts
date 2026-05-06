import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApplicationNotesResponseDto {
  @ApiProperty({
    description: "Notes ID",
    example: "uuid-string"
  })
  id: string;

  @ApiProperty({
    description: "Application ID",
    example: "uuid-string"
  })
  applicationId: string;

  @ApiProperty({
    description: "Notes content",
    example: "Candidate shows strong technical skills during interview"
  })
  notes: string;

  @ApiPropertyOptional({
    description: "HR who created the notes",
    example: "john.doe@company.com"
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: "HR who last updated the notes",
    example: "jane.doe@company.com"
  })
  updatedBy?: string;

  @ApiProperty({
    description: "Whether notes are private",
    example: false
  })
  isPrivate: boolean;

  @ApiPropertyOptional({
    description: "Category of the notes",
    example: "interview"
  })
  category?: string;

  @ApiPropertyOptional({
    description: "Priority level of the notes",
    example: "high"
  })
  priority?: string;

  @ApiProperty({
    description: "Created at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at timestamp",
    example: "2024-01-01T00:00:00.000Z"
  })
  updatedAt: Date;
}
