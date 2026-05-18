import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CvDocument } from "./entities/cv-documents.entity";
import { CvEducationHistory } from "./entities/cv-education-histories.entity";
import { CvWorkExperience } from "./entities/cv-work-experiences.entity";
import { EvaluationResult } from "./entities/evaluation-results.entity";
import { Application } from "../applicants/entities/application.entity";
import { Vacancy } from "../vacancies/entities/vacancy.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CvDocument,
      CvEducationHistory,
      CvWorkExperience,
      EvaluationResult,
      Application,
      Vacancy
    ])
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule]
})
export class ApplicantResultsModule {}