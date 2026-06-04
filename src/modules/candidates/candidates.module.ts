import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CandidatesController } from "./controllers/candidates.controller";
import { CandidatesService } from "./services/candidates.service";
import { Application } from "../applicants/entities/application.entity";
import { Applicant } from "../applicants/entities/applicant.entity";
import { Vacancy } from "../vacancies/entities/vacancy.entity";
import { PipelineStage } from "../vacancies/entities/pipeline-stage.entity";
import { StageActivity } from "../vacancies/entities/stage-activity.entity";
import { ApplicationNotes } from "../applicants/entities/application-notes.entity";
import { EmailModule } from "../../shared/modules/email.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, Applicant, Vacancy, PipelineStage, StageActivity, ApplicationNotes]),
    EmailModule
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService]
})
export class CandidatesModule {}
