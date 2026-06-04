/**
 * Analytics Entity
 * This is a virtual entity for analytics data aggregation
 * No actual database table is created for this entity
 */

export interface RecruitmentTrendData {
  period: string;
  applications: number;
  hired: number;
  rejected: number;
  withdrawn: number;
}

export interface StageDistributionData {
  stage: string;
  passed: number;
  not_passed: number;
  total: number;
}

export interface ExperienceDistributionData {
  experience_range: string;
  count: number;
}

export interface HiringStatsData {
  totalApplications: number;
  totalHired: number;
  totalRejected: number;
  totalWithdrawn: number;
  averageProcessingTime: number;
  conversionRate: number;
}

export interface DepartmentStatsData {
  department: string;
  applications: number;
  hired: number;
  conversion_rate: number;
}

export interface JobCategoryStatsData {
  category: string;
  applications: number;
  hired: number;
  conversion_rate: number;
}

export interface AssessmentTrendData {
  period: string;
  totalAssessments: number;
  passed: number;
  failed: number;
  averageScore: number;
}

export interface TimeToHireStatsData {
  period: string;
  averageDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
}

export interface SourceEffectivenessData {
  source: string;
  applications: number;
  hired: number;
  conversion_rate: number;
  cost_per_hire: number;
}
