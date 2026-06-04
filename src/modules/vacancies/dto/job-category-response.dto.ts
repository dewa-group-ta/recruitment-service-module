import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class JobCategoryResponseDto {
  @ApiProperty({
    description: "Unique identifier of the job category",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  id: string;

  @ApiProperty({
    description: "Name of the job category",
    example: "Engineering"
  })
  name: string;

  @ApiPropertyOptional({
    description: "Description of the job category",
    example: "Software development and engineering positions"
  })
  description?: string;

  @ApiPropertyOptional({
    description: "Short code for the category",
    example: "ENG"
  })
  code?: string;

  @ApiPropertyOptional({
    description: "Hex color code for UI display",
    example: "#3B82F6"
  })
  color?: string;

  @ApiPropertyOptional({
    description: "Icon name or path for UI display",
    example: "code"
  })
  icon?: string;

  @ApiProperty({
    description: "Sort order for UI display",
    example: 1
  })
  sortOrder: number;

  @ApiProperty({
    description: "Whether the category is active",
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: "ID of the user who created the category",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  createdById: string;

  @ApiPropertyOptional({
    description: "ID of the user who last updated the category",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  updatedById?: string;

  @ApiProperty({
    description: "Number of vacancies in this category",
    example: 15
  })
  vacancyCount: number;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-15T10:30:00Z"
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-15T10:30:00Z"
  })
  updatedAt: Date;
}
