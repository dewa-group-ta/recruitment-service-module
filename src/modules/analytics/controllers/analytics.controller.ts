import { Controller, Get, Query, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { AnalyticsService } from "../services/analytics.service";
import { AnalyticsQueryDto } from "../dto/analytics-query.dto";
import {
  RecruitmentTrendResponseDto,
  StageDistributionResponseDto,
  ExperienceDistributionResponseDto,
  HiringStatsResponseDto,
  DepartmentStatsResponseDto,
  JobCategoryStatsResponseDto,
  AssessmentTrendResponseDto,
  TimeToHireStatsResponseDto,
  SourceEffectivenessResponseDto
} from "../dto/analytics-response.dto";
import { IsRole } from "src/shared/decorators/roles.decorator";
import { role } from "src/shared/utils/constant";
import { StageDistributionData } from "../entities/analytics.entity";

@ApiTags("Analytics")
@Controller("analytics")
@IsRole(role.HR_MANAGER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get recruitment trend data
   */
  @Get("recruitment-trend")
  @ApiOperation({ summary: "Get recruitment trend data" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "period",
    required: false,
    enum: ["daily", "weekly", "monthly", "yearly"],
    description: "Period type"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Recruitment trend data retrieved successfully",
    type: RecruitmentTrendResponseDto
  })
  async getRecruitmentTrend(
    @Query() query: AnalyticsQueryDto
  ): Promise<RecruitmentTrendResponseDto> {
    const data = await this.analyticsService.getRecruitmentTrend(query);

    return {
      responseCode: HttpStatus.OK,
      responseDesc: "Success",
      data
    };
  }

  /**
   * Get stage distribution data
   */
  @Get("stage-distribution")
  @ApiOperation({ summary: "Get stage distribution data" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "pipelineId",
    required: false,
    type: String,
    description: "Recruitment pipeline ID"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Stage distribution data retrieved successfully",
    type: StageDistributionResponseDto
  })
  async getStageDistribution(
    @Query() query: AnalyticsQueryDto
  ): Promise<StageDistributionData[]> {
    const data = await this.analyticsService.getStageDistribution(query);

    return data;
  }

  /**
   * Get experience distribution data
   */
  @Get("experience-distribution")
  @ApiOperation({ summary: "Get experience distribution data" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date (YYYY-MM-DD)"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Experience distribution data retrieved successfully",
    type: ExperienceDistributionResponseDto
  })
  async getExperienceDistribution(
    @Query() query: AnalyticsQueryDto
  ): Promise<ExperienceDistributionResponseDto> {
    const data = await this.analyticsService.getExperienceDistribution(query);

    return {
      responseCode: HttpStatus.OK,
      responseDesc: "Success",
      data
    };
  }

  /**
   * Get hiring statistics
   */
  @Get("hiring-stats")
  @ApiOperation({ summary: "Get hiring statistics" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date (YYYY-MM-DD)"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Hiring statistics retrieved successfully",
    type: HiringStatsResponseDto
  })
  async getHiringStats(
    @Query() query: AnalyticsQueryDto
  ): Promise<HiringStatsResponseDto> {
    const data = await this.analyticsService.getHiringStats(query);

    return {
      responseCode: HttpStatus.OK,
      responseDesc: "Success",
      data
    };
  }

  /**
   * Get department statistics
   */
  @Get("department-stats")
  @ApiOperation({ summary: "Get department statistics" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date (YYYY-MM-DD)"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Department statistics retrieved successfully",
    type: DepartmentStatsResponseDto
  })
  async getDepartmentStats(
    @Query() query: AnalyticsQueryDto
  ): Promise<DepartmentStatsResponseDto> {
    const data = await this.analyticsService.getDepartmentStats(query);

    return {
      responseCode: HttpStatus.OK,
      responseDesc: "Success",
      data
    };
  }

  /**
   * Get job category statistics
   */
  @Get("job-category-stats")
  @ApiOperation({ summary: "Get job category statistics" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date (YYYY-MM-DD)"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Job category statistics retrieved successfully",
    type: JobCategoryStatsResponseDto
  })
  async getJobCategoryStats(
    @Query() query: AnalyticsQueryDto
  ): Promise<JobCategoryStatsResponseDto> {
    const data = await this.analyticsService.getJobCategoryStats(query);

    return {
      responseCode: HttpStatus.OK,
      responseDesc: "Success",
      data
    };
  }

  /**
   * Get assessment trend data
   */
  @Get("assessment-trend")
  @ApiOperation({ summary: "Get assessment trend data" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "period",
    required: false,
    enum: ["daily", "weekly", "monthly", "yearly"],
    description: "Period type"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Assessment trend data retrieved successfully",
    type: AssessmentTrendResponseDto
  })
  async getAssessmentTrend(
    @Query() query: AnalyticsQueryDto
  ): Promise<AssessmentTrendResponseDto> {
    const data = await this.analyticsService.getAssessmentTrend(query);

    return {
      responseCode: HttpStatus.OK,
      responseDesc: "Success",
      data
    };
  }

  /**
   * Get time to hire statistics
   */
  @Get("time-to-hire-stats")
  @ApiOperation({ summary: "Get time to hire statistics" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "period",
    required: false,
    enum: ["daily", "weekly", "monthly", "yearly"],
    description: "Period type"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Time to hire statistics retrieved successfully",
    type: TimeToHireStatsResponseDto
  })
  async getTimeToHireStats(
    @Query() query: AnalyticsQueryDto
  ): Promise<TimeToHireStatsResponseDto> {
    const data = await this.analyticsService.getTimeToHireStats(query);

    return {
      responseCode: HttpStatus.OK,
      responseDesc: "Success",
      data
    };
  }

  /**
   * Get source effectiveness data
   */
  @Get("source-effectiveness")
  @ApiOperation({ summary: "Get source effectiveness data" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date (YYYY-MM-DD)"
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date (YYYY-MM-DD)"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Source effectiveness data retrieved successfully",
    type: SourceEffectivenessResponseDto
  })
  async getSourceEffectiveness(
    @Query() query: AnalyticsQueryDto
  ): Promise<SourceEffectivenessResponseDto> {
    const data = await this.analyticsService.getSourceEffectiveness(query);

    return {
      responseCode: HttpStatus.OK,
      responseDesc: "Success",
      data
    };
  }
}
