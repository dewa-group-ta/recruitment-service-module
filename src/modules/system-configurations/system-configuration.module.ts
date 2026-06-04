import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SystemConfigurationService } from "./services/system-configuration.service";
import { SystemConfigurationController } from "./controllers/system-configuration.controller";
import { SystemConfiguration } from "./entities/system-configuration.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfiguration])],
  controllers: [SystemConfigurationController],
  providers: [SystemConfigurationService],
  exports: [SystemConfigurationService]
})
export class SystemConfigurationModule {}
