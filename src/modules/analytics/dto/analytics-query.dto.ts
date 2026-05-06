import { IsOptional, IsString, IsEnum } from "class-validator";
import { Transform } from "class-transformer";

export enum PeriodType {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly"
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(PeriodType)
  @Transform(({ value }) => value || PeriodType.MONTHLY)
  period?: PeriodType = PeriodType.MONTHLY;

  @IsOptional()
  @IsString()
  pipelineId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  jobCategoryId?: string;
}
