import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EvaluationResult } from "./entities/evaluation-results.entity";
import { Application } from "../applicants/entities/application.entity";
import { Vacancy } from "../vacancies/entities/vacancy.entity";
import { HttpModule } from "@nestjs/axios";
import { ApplicantEducation, ApplicantJobHistory } from "../applicants";
import { ApplicantResultsService } from "./services/applicant-results.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicantEducation, 
      ApplicantJobHistory,
      EvaluationResult,
      Application,
      Vacancy
    ]),
    HttpModule
  ],
  controllers: [],
  providers: [ApplicantResultsService],
  exports: [TypeOrmModule, ApplicantResultsService]
})
export class ApplicantResultsModule {}