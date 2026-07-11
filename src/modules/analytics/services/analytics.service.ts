import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Application } from "../../applicants/entities/application.entity";
import { ApplicantStatus } from "../../../shared/enums/applicant.enum";
import { Vacancy } from "../../vacancies/entities/vacancy.entity";
import { Department } from "../../departments/entities/department.entity";
import { JobCategory } from "../../vacancies/entities/job-category.entity";
import { ApplicantSource } from "../../applicants/entities/applicant-source.entity";
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
import { AnalyticsQueryDto, PeriodType } from "../dto/analytics-query.dto";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Vacancy)
    private readonly vacancyRepository: Repository<Vacancy>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(JobCategory)
    private readonly jobCategoryRepository: Repository<JobCategory>,
    @InjectRepository(ApplicantSource)
    private readonly applicantSourceRepository: Repository<ApplicantSource>
  ) {}

  async getRecruitmentTrend(
    query: AnalyticsQueryDto
  ): Promise<RecruitmentTrendData[]> {
    const { startDate, endDate, period } = query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    let dateFormat: string;
    let groupBy: string;

    switch (period) {
      case PeriodType.DAILY:
        dateFormat = "YYYY-MM-DD";
        groupBy = "DATE(application.appliedAt)";
        break;
      case PeriodType.WEEKLY:
        dateFormat = 'YYYY-"W"WW';
        groupBy = "DATE_TRUNC('week', application.appliedAt)";
        break;
      case PeriodType.YEARLY:
        dateFormat = "YYYY";
        groupBy = "DATE_TRUNC('year', application.appliedAt)";
        break;
      default: // MONTHLY
        dateFormat = "YYYY-MM";
        groupBy = "DATE_TRUNC('month', application.appliedAt)";
    }

    const queryBuilder = this.applicationRepository
      .createQueryBuilder("application")
      .select([
        `TO_CHAR(application.appliedAt, '${dateFormat}') as period`,
        "COUNT(*) as applications",
        `COUNT(CASE WHEN application.status = '${ApplicantStatus.HIRED}' THEN 1 END) as hired`,
        `COUNT(CASE WHEN application.status = '${ApplicantStatus.REJECTED}' THEN 1 END) as rejected`,
        `COUNT(CASE WHEN application.status = '${ApplicantStatus.REJECTED}' THEN 1 END) as withdrawn`
      ])
      .where("application.appliedAt BETWEEN :start AND :end", { start, end })
      .groupBy(groupBy)
      .orderBy("period", "ASC");

    const results = await queryBuilder.getRawMany();

    return results.map((row) => ({
      period: row.period,
      applications: parseInt(row.applications),
      hired: parseInt(row.hired),
      rejected: parseInt(row.rejected),
      withdrawn: parseInt(row.withdrawn)
    }));
  }

  async getStageDistribution(
    query: AnalyticsQueryDto
  ): Promise<StageDistributionData[]> {
    const { startDate, endDate, pipelineId } = query;

    const whereConditions: any = {};
    if (startDate && endDate) {
      whereConditions.appliedAt = Between(
        new Date(startDate),
        new Date(endDate)
      );
    }
    if (pipelineId) {
      whereConditions.vacancy = { pipelineId: pipelineId };
    }

    const applications = await this.applicationRepository.find({
      where: whereConditions,
      relations: [
        "vacancy",
        "vacancy.pipeline",
        "vacancy.pipeline.stages",
        "currentStage",
        "currentStage.stageTemplate"
      ]
    });

    const stageStats = new Map<
      string,
      { passed: number; not_passed: number; total: number }
    >();

    applications.forEach((app) => {
      const currentStage = app.currentStage?.stageTemplate?.name || "Applied";
      if (!stageStats.has(currentStage)) {
        stageStats.set(currentStage, { passed: 0, not_passed: 0, total: 0 });
      }

      const stats = stageStats.get(currentStage)!;
      stats.total++;

      if (app.status === ApplicantStatus.HIRED) {
        stats.passed++;
      } else if (app.status === ApplicantStatus.REJECTED) {
        stats.not_passed++;
      }
    });

    return Array.from(stageStats.entries()).map(([stage, stats]) => ({
      stage,
      passed: stats.passed,
      not_passed: stats.not_passed,
      total: stats.total
    }));
  }

  async getExperienceDistribution(
    query: AnalyticsQueryDto
  ): Promise<ExperienceDistributionData[]> {
    const { startDate, endDate } = query;

    const whereConditions: any = {};
    if (startDate && endDate) {
      whereConditions.appliedAt = Between(
        new Date(startDate),
        new Date(endDate)
      );
    }

    const applications = await this.applicationRepository.find({
      where: whereConditions,
      relations: ["applicant", "applicant.jobHistories"]
    });

    const experienceRanges = {
      "0-1 years": 0,
      "1-3 years": 0,
      "3-5 years": 0,
      "5-10 years": 0,
      "10+ years": 0
    };

    applications.forEach((app) => {
      const totalExperience =
        app.applicant.jobHistories?.reduce((total, job) => {
          const startDate = new Date(job.startDate);
          const endDate = job.endDate ? new Date(job.endDate) : new Date();
          const years =
            (endDate.getTime() - startDate.getTime()) /
            (1000 * 60 * 60 * 24 * 365);
          return total + years;
        }, 0) || 0;

      if (totalExperience <= 1) {
        experienceRanges["0-1 years"]++;
      } else if (totalExperience <= 3) {
        experienceRanges["1-3 years"]++;
      } else if (totalExperience <= 5) {
        experienceRanges["3-5 years"]++;
      } else if (totalExperience <= 10) {
        experienceRanges["5-10 years"]++;
      } else {
        experienceRanges["10+ years"]++;
      }
    });

    return Object.entries(experienceRanges).map(([range, count]) => ({
      experience_range: range,
      count
    }));
  }

  async getHiringStats(query: AnalyticsQueryDto): Promise<HiringStatsData> {
    const { startDate, endDate } = query;

    const whereConditions: any = {};
    if (startDate && endDate) {
      whereConditions.appliedAt = Between(
        new Date(startDate),
        new Date(endDate)
      );
    }

    const [
      totalApplications,
      hiredApplications,
      rejectedApplications,
      withdrawnApplications
    ] = await Promise.all([
      this.applicationRepository.count({ where: whereConditions }),
      this.applicationRepository.count({
        where: { ...whereConditions, status: ApplicantStatus.HIRED }
      }),
      this.applicationRepository.count({
        where: { ...whereConditions, status: ApplicantStatus.REJECTED }
      }),
      this.applicationRepository.count({
        where: { ...whereConditions, status: ApplicantStatus.REJECTED }
      })
    ]);

    const hiredApps = await this.applicationRepository.find({
      where: { ...whereConditions, status: ApplicantStatus.HIRED },
      select: ["appliedAt", "updatedAt"]
    });

    const averageProcessingTime =
      hiredApps.length > 0
        ? hiredApps.reduce((total, app) => {
            const processingTime =
              new Date(app.updatedAt).getTime() -
              new Date(app.appliedAt).getTime();
            return total + processingTime;
          }, 0) /
          hiredApps.length /
          (1000 * 60 * 60 * 24)
        : 0;

    const conversionRate =
      totalApplications > 0 ? (hiredApplications / totalApplications) * 100 : 0;

    return {
      totalApplications,
      totalHired: hiredApplications,
      totalRejected: rejectedApplications,
      totalWithdrawn: withdrawnApplications,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }

  async getDepartmentStats(
    query: AnalyticsQueryDto
  ): Promise<DepartmentStatsData[]> {
    const { startDate, endDate } = query;

    const whereConditions: any = {};
    if (startDate && endDate) {
      whereConditions.appliedAt = Between(
        new Date(startDate),
        new Date(endDate)
      );
    }

    const applications = await this.applicationRepository.find({
      where: whereConditions,
      relations: ["vacancy", "vacancy.department"]
    });

    const departmentStats = new Map<
      string,
      { applications: number; hired: number }
    >();

    applications.forEach((app) => {
      const department = app.vacancy.department?.name || "Unknown";
      if (!departmentStats.has(department)) {
        departmentStats.set(department, { applications: 0, hired: 0 });
      }

      const stats = departmentStats.get(department)!;
      stats.applications++;

      if (app.status === ApplicantStatus.HIRED) {
        stats.hired++;
      }
    });

    return Array.from(departmentStats.entries()).map(([department, stats]) => ({
      department,
      applications: stats.applications,
      hired: stats.hired,
      conversion_rate:
        stats.applications > 0
          ? Math.round((stats.hired / stats.applications) * 100 * 100) / 100
          : 0
    }));
  }

  async getJobCategoryStats(
    query: AnalyticsQueryDto
  ): Promise<JobCategoryStatsData[]> {
    const { startDate, endDate } = query;

    const whereConditions: any = {};
    if (startDate && endDate) {
      whereConditions.appliedAt = Between(
        new Date(startDate),
        new Date(endDate)
      );
    }

    const applications = await this.applicationRepository.find({
      where: whereConditions,
      relations: ["vacancy", "vacancy.jobCategory"]
    });

    const categoryStats = new Map<
      string,
      { applications: number; hired: number }
    >();

    applications.forEach((app) => {
      const category = app.vacancy.jobCategory?.name || "Unknown";
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { applications: 0, hired: 0 });
      }

      const stats = categoryStats.get(category)!;
      stats.applications++;

      if (app.status === ApplicantStatus.HIRED) {
        stats.hired++;
      }
    });

    return Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      applications: stats.applications,
      hired: stats.hired,
      conversion_rate:
        stats.applications > 0
          ? Math.round((stats.hired / stats.applications) * 100 * 100) / 100
          : 0
    }));
  }

  async getAssessmentTrend(
    query: AnalyticsQueryDto
  ): Promise<AssessmentTrendData[]> {
    const { startDate, endDate, period } = query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    let dateFormat: string;
    let groupBy: string;

    switch (period) {
      case PeriodType.DAILY:
        dateFormat = "YYYY-MM-DD";
        groupBy = "DATE(application.appliedAt)";
        break;
      case PeriodType.WEEKLY:
        dateFormat = 'YYYY-"W"WW';
        groupBy = "DATE_TRUNC('week', application.appliedAt)";
        break;
      case PeriodType.YEARLY:
        dateFormat = "YYYY";
        groupBy = "DATE_TRUNC('year', application.appliedAt)";
        break;
      default: // MONTHLY
        dateFormat = "YYYY-MM";
        groupBy = "DATE_TRUNC('month', application.appliedAt)";
    }

    const queryBuilder = this.applicationRepository
      .createQueryBuilder("application")
      .select([
        `TO_CHAR(application.appliedAt, '${dateFormat}') as period`,
        "COUNT(*) as totalAssessments",
        `COUNT(CASE WHEN application.status = '${ApplicantStatus.HIRED}' THEN 1 END) as passed`,
        `COUNT(CASE WHEN application.status = '${ApplicantStatus.REJECTED}' THEN 1 END) as failed`,
        "AVG(COALESCE(application.score, 0)) as averageScore"
      ])
      .where("application.appliedAt BETWEEN :start AND :end", { start, end })
      .groupBy(groupBy)
      .orderBy("period", "ASC");

    const results = await queryBuilder.getRawMany();

    return results.map((row) => ({
      period: row.period,
      totalAssessments: parseInt(row.totalassessments),
      passed: parseInt(row.passed),
      failed: parseInt(row.failed),
      averageScore: parseFloat(row.averagescore) || 0
    }));
  }

  async getTimeToHireStats(
    query: AnalyticsQueryDto
  ): Promise<TimeToHireStatsData[]> {
    const { startDate, endDate, period } = query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    let dateFormat: string;
    let groupBy: string;

    switch (period) {
      case PeriodType.DAILY:
        dateFormat = "YYYY-MM-DD";
        groupBy = "DATE(application.appliedAt)";
        break;
      case PeriodType.WEEKLY:
        dateFormat = 'YYYY-"W"WW';
        groupBy = "DATE_TRUNC('week', application.appliedAt)";
        break;
      case PeriodType.YEARLY:
        dateFormat = "YYYY";
        groupBy = "DATE_TRUNC('year', application.appliedAt)";
        break;
      default: // MONTHLY
        dateFormat = "YYYY-MM";
        groupBy = "DATE_TRUNC('month', application.appliedAt)";
    }

    const queryBuilder = this.applicationRepository
      .createQueryBuilder("application")
      .select([
        `TO_CHAR(application.appliedAt, '${dateFormat}') as period`,
        "AVG(EXTRACT(EPOCH FROM (application.updatedAt - application.appliedAt)) / 86400) as averageDays",
        "PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (application.updatedAt - application.appliedAt)) / 86400) as medianDays",
        "MIN(EXTRACT(EPOCH FROM (application.updatedAt - application.appliedAt)) / 86400) as minDays",
        "MAX(EXTRACT(EPOCH FROM (application.updatedAt - application.appliedAt)) / 86400) as maxDays"
      ])
      .where("application.appliedAt BETWEEN :start AND :end", { start, end })
      .andWhere("application.status = :status", {
        status: ApplicantStatus.HIRED
      })
      .groupBy(groupBy)
      .orderBy("period", "ASC");

    const results = await queryBuilder.getRawMany();

    return results.map((row) => ({
      period: row.period,
      averageDays: Math.round((parseFloat(row.averagedays) || 0) * 100) / 100,
      medianDays: Math.round((parseFloat(row.mediandays) || 0) * 100) / 100,
      minDays: Math.round((parseFloat(row.mindays) || 0) * 100) / 100,
      maxDays: Math.round((parseFloat(row.maxdays) || 0) * 100) / 100
    }));
  }

  async getSourceEffectiveness(
    query: AnalyticsQueryDto
  ): Promise<SourceEffectivenessData[]> {
    const { startDate, endDate } = query;

    const whereConditions: any = {};
    if (startDate && endDate) {
      whereConditions.appliedAt = Between(
        new Date(startDate),
        new Date(endDate)
      );
    }

    const applications = await this.applicationRepository.find({
      where: whereConditions,
      relations: ["applicant", "applicant.applicantSources"]
    });

    const sourceStats = new Map<
      string,
      { applications: number; hired: number }
    >();

    applications.forEach((app) => {
      const source = app.applicant.applicantSources?.[0]?.name || "Unknown";
      if (!sourceStats.has(source)) {
        sourceStats.set(source, { applications: 0, hired: 0 });
      }

      const stats = sourceStats.get(source)!;
      stats.applications++;

      if (app.status === ApplicantStatus.HIRED) {
        stats.hired++;
      }
    });

    return Array.from(sourceStats.entries()).map(([source, stats]) => ({
      source,
      applications: stats.applications,
      hired: stats.hired,
      conversion_rate:
        stats.applications > 0
          ? Math.round((stats.hired / stats.applications) * 100 * 100) / 100
          : 0,
      cost_per_hire: 0 // belum dihitung dari data biaya aktual
    }));
  }
}
