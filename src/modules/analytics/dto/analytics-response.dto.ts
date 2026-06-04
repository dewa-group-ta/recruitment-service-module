import {
  RecruitmentTrendData,
  StageDistributionData,
  ExperienceDistributionData,
  HiringStatsData,
  DepartmentStatsData,
  JobCategoryStatsData,
  AssessmentTrendData,
  TimeToHireStatsData,
  SourceEffectivenessData
} from "../entities/analytics.entity";

export class RecruitmentTrendResponseDto {
  responseCode: number;
  responseDesc: string;
  data: RecruitmentTrendData[];
}

export class StageDistributionResponseDto {
  responseCode: number;
  responseDesc: string;
  data: StageDistributionData[];
}

export class ExperienceDistributionResponseDto {
  responseCode: number;
  responseDesc: string;
  data: ExperienceDistributionData[];
}

export class HiringStatsResponseDto {
  responseCode: number;
  responseDesc: string;
  data: HiringStatsData;
}

export class DepartmentStatsResponseDto {
  responseCode: number;
  responseDesc: string;
  data: DepartmentStatsData[];
}

export class JobCategoryStatsResponseDto {
  responseCode: number;
  responseDesc: string;
  data: JobCategoryStatsData[];
}

export class AssessmentTrendResponseDto {
  responseCode: number;
  responseDesc: string;
  data: AssessmentTrendData[];
}

export class TimeToHireStatsResponseDto {
  responseCode: number;
  responseDesc: string;
  data: TimeToHireStatsData[];
}

export class SourceEffectivenessResponseDto {
  responseCode: number;
  responseDesc: string;
  data: SourceEffectivenessData[];
}
