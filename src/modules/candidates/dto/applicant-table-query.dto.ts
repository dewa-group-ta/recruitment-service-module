import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export enum SortBy {
  NAME = 'name',
  APPLY_DATE = 'applyDate',
  CURRENT_SCORE = 'currentScore',
  STAGE = 'stage',
  TOTAL_SCORE = 'totalScore'
}

export class ApplicantTableQueryDto {
  @ApiProperty({
    description: 'Page number',
    required: false,
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    example: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Search in candidate name, email, or job title',
    required: false,
    example: 'john doe'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by applicant status',
    required: false,
    example: ['new', 'qualified'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  status?: string[];

  @ApiProperty({
    description: 'Filter by job status',
    required: false,
    example: ['published', 'draft'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  jobStatus?: string[];

  @ApiProperty({
    description: 'Filter by recruitment stage',
    required: false,
    example: ['applied', 'interview'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  stage?: string[];

  @ApiProperty({
    description: 'Filter by vacancy ID',
    required: false,
    example: 'uuid-string'
  })
  @IsOptional()
  @IsString()
  vacancyId?: string;

  @ApiProperty({
    description: 'Sort by field',
    required: false,
    enum: SortBy,
    example: 'applyDate'
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.APPLY_DATE;

  @ApiProperty({
    description: 'Sort order',
    required: false,
    enum: SortOrder,
    example: 'desc'
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class ApplicantSummaryQueryDto {
  @ApiProperty({
    description: 'Filter by applicant status',
    required: false,
    example: ['new', 'qualified'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  status?: string[];

  @ApiProperty({
    description: 'Filter by job status',
    required: false,
    example: ['published', 'draft'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  jobStatus?: string[];

  @ApiProperty({
    description: 'Filter by recruitment stage',
    required: false,
    example: ['applied', 'interview'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  stage?: string[];

  @ApiProperty({
    description: 'Filter by vacancy ID',
    required: false,
    example: 'uuid-string'
  })
  @IsOptional()
  @IsString()
  vacancyId?: string;

  @ApiProperty({
    description: 'Filter from date (ISO string)',
    required: false,
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Filter to date (ISO string)',
    required: false,
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsString()
  dateTo?: string;
}