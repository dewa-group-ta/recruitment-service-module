import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AnalyticsController } from "./controllers/analytics.controller";
import { AnalyticsService } from "./services/analytics.service";
import { Application } from "../applicants/entities/application.entity";
import { Vacancy } from "../vacancies/entities/vacancy.entity";
import { Department } from "../departments/entities/department.entity";
import { JobCategory } from "../vacancies/entities/job-category.entity";
import { ApplicantSource } from "../applicants/entities/applicant-source.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      Vacancy,
      Department,
      JobCategory,
      ApplicantSource
    ])
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
