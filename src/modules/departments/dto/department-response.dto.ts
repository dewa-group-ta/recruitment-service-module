import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DepartmentResponseDto {
  @ApiProperty({
    description: "Department ID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  id: string;

  @ApiProperty({
    description: "Department name",
    example: "Engineering"
  })
  name: string;

  @ApiPropertyOptional({
    description: "Department code",
    example: "ENG"
  })
  code?: string;

  @ApiPropertyOptional({
    description: "Department description",
    example: "Software development and engineering team"
  })
  description?: string;

  @ApiProperty({
    description: "Whether the department is active",
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: "ID of user who created this department",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  createdById: string;

  @ApiPropertyOptional({
    description: "ID of user who last updated this department",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  updatedById?: string;

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
    description: "Deletion timestamp (if soft deleted)",
    example: "2024-01-15T10:30:00.000Z"
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: "ID of user who deleted this department",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  deletedById?: string;
}
