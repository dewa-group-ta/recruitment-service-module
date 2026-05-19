import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CvDocument } from "./entities/cv-documents.entity";
import { EvaluationResult } from "./entities/evaluation-results.entity";
import { Application } from "../applicants/entities/application.entity";
import { Vacancy } from "../vacancies/entities/vacancy.entity";
import { HttpModule } from "@nestjs/axios";
import { ApplicantEducation, ApplicantJobHistory } from "../applicants";
import { ApplicantResultsService } from "./services/applicant-results.service";
import { ApplicantResultsController } from "./controllers/applicant-results.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CvDocument,
      ApplicantEducation,    // ganti dari CvEducationHistory
      ApplicantJobHistory,
      EvaluationResult,
      Application,
      Vacancy
    ]),
    HttpModule
  ],
  controllers: [ApplicantResultsController],
  providers: [ApplicantResultsService],
  exports: [TypeOrmModule, ApplicantResultsService]
})
export class ApplicantResultsModule {}