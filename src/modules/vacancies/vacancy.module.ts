import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Vacancy } from "./entities/vacancy.entity";
import { JobCategory } from "./entities/job-category.entity";
import { StageTemplate } from "./entities/stage-template.entity";
import { RecruitmentPipeline } from "./entities/recruitment-pipeline.entity";
import { PipelineStage } from "./entities/pipeline-stage.entity";
import { NotificationTemplate } from "./entities/notification-template.entity";
import { Application } from "../applicants/entities/application.entity";
import { VacancyService } from "./services/vacancy.service";
import { JobCategoryService } from "./services/job-category.service";
import { StageTemplateService } from "./services/stage-template.service";
import { RecruitmentPipelineService } from "./services/recruitment-pipeline.service";
import { PipelineStageService } from "./services/pipeline-stage.service";
import { NotificationTemplateService } from "./services/notification-template.service";
import { VacancyController } from "./controllers/vacancy.controller";
import { PublicVacancyController } from "./controllers/public-vacancy.controller";
import { JobCategoryController } from "./controllers/job-category.controller";
import { StageTemplateController } from "./controllers/stage-template.controller";
import { RecruitmentPipelineController } from "./controllers/recruitment-pipeline.controller";
import { PipelineStageController } from "./controllers/pipeline-stage.controller";
import { NotificationTemplateController } from "./controllers/notification-template.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vacancy,
      JobCategory,
      StageTemplate,
      RecruitmentPipeline,
      PipelineStage,
      NotificationTemplate,
      Application
    ])
  ],
  controllers: [
    VacancyController,
    PublicVacancyController,
    JobCategoryController,
    StageTemplateController,
    RecruitmentPipelineController,
    PipelineStageController,
    NotificationTemplateController
  ],
  providers: [
    VacancyService,
    JobCategoryService,
    StageTemplateService,
    RecruitmentPipelineService,
    PipelineStageService,
    NotificationTemplateService
  ],
  exports: [
    VacancyService,
    JobCategoryService,
    StageTemplateService,
    RecruitmentPipelineService,
    PipelineStageService,
    NotificationTemplateService
  ]
})
export class VacancyModule {}
