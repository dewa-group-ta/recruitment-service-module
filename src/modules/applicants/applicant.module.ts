import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Applicant,
  Application,
  ApplicantAddress,
  ApplicantEducation,
  ApplicantJobHistory,
  ApplicantProjectHistory,
  ApplicantIdentity,
  ApplicantSource
} from "./entities";
import { ApplicantService } from "./services/applicant.service";
import { TokenService } from "./services/token.service";
import { ApplicationController } from "./controllers/applicant.controller";
import { AddressController } from "./controllers/address.controller";
import { IdentityController } from "./controllers/identity.controller";
import { EducationController } from "./controllers/education.controller";
import { JobHistoryController } from "./controllers/job-history.controller";
import { ProjectHistoryController } from "./controllers/project-history.controller";
import { Vacancy } from "../vacancies/entities/vacancy.entity";
import { RecruitmentPipeline } from "../vacancies/entities/recruitment-pipeline.entity";
import { PipelineStage } from "../vacancies/entities/pipeline-stage.entity";
import { StageActivity } from "../vacancies/entities/stage-activity.entity";
import { AuthToken } from "./entities/auth-token.entity";
import { EmailModule } from "../../shared/modules/email.module";
import { IsCustomSourceRequiredConstraint } from "./validators/custom-source.validator";
import { ApplicantSourceService } from "./services/applicant-source.service";
import { ApplicantSourceController } from "./controllers/applicant-source.controller";
import { ApplicantResultsModule } from "../applicant-results/applicant-results.module";
import { File } from "src/shared/entities/file.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Applicant,
      Application,
      ApplicantAddress,
      ApplicantEducation,
      ApplicantJobHistory,
      ApplicantProjectHistory,
      ApplicantIdentity,
      Vacancy,
      RecruitmentPipeline,
      PipelineStage,
      StageActivity,
      ApplicantSource,
      AuthToken,
      File
    ]),
    EmailModule,
    ApplicantResultsModule
  ],
  controllers: [
    ApplicationController,
    AddressController,
    IdentityController,
    EducationController,
    JobHistoryController,
    ProjectHistoryController,
    ApplicantSourceController
  ],
  providers: [
    ApplicantService,
    TokenService,
    IsCustomSourceRequiredConstraint,
    ApplicantSourceService
  ],
  exports: [ApplicantService, TokenService]
})
export class ApplicantModule {}
