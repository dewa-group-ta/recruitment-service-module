import { MiddlewareConsumer, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GlobalModule } from "./modules/global.module";
import { ConfigModule } from "@nestjs/config";
import * as dotenv from "dotenv";
import { LoggerModule } from "nestjs-pino";
import { pinoConfig } from "src/config/logger.config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { HttpExceptionFilter } from "src/shared/filter/http-exceptions";
import { ResponseInterceptor } from "src/shared/interceptors/response.interceptor";
import { RequestMiddleware } from "src/shared/middleware/request.middleware";
import { LoggerMiddleware } from "src/shared/middleware/logger.middleware";
import { databaseConfig } from "./config/database.config";
import { BearerAuthGuard } from "./shared/guards/bearer-auth/bearer-auth.guard";
import { VacancyModule } from "./modules/vacancies";
import { ApplicantModule } from "./modules/applicants/applicant.module";
import { EmailModule } from "./shared/modules/email.module";
import { LocationModule } from "./shared/modules/location.module";
import { LocationModule as LocationApiModule } from "./modules/locations/location.module";
import { SystemConfigurationModule } from "./modules/system-configurations";
import { FileUploadModule } from "./shared/modules/file-upload.module";
import { DepartmentModule } from "./modules/departments";
import { AnalyticsModule } from "./modules/analytics";
import { CandidatesModule } from "./modules/candidates";
import { AppCacheModule } from "./shared/modules/cache.module";
import { CacheService } from "./shared/services/cache.service";
import { CacheInterceptor } from "./shared/interceptors/cache.interceptor";
import minioConfig from "./config/minio.config";
import { Applicant } from "./modules/applicants";
import { ApplicantResultsModule } from "./modules/applicant-results/applicant-results.module";

dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ConfigModule.forFeature(minioConfig),
    TypeOrmModule.forRoot(databaseConfig),
    LoggerModule.forRoot(pinoConfig),
    AppCacheModule,
    GlobalModule,
    EmailModule,
    LocationModule,
    LocationApiModule,
    FileUploadModule,
    VacancyModule,
    ApplicantModule,
    SystemConfigurationModule,
    DepartmentModule,
    AnalyticsModule,
    CandidatesModule,
    ApplicantResultsModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: BearerAuthGuard
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor
    },
    CacheService
  ]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestMiddleware).forRoutes("*");
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
