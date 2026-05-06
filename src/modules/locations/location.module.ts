import { Module } from "@nestjs/common";
import { LocationController } from "./controllers/location.controller";
import { LocationModule as SharedLocationModule } from "../../shared/modules/location.module";

/**
 * Location module
 * Provides location-related endpoints and services
 */
@Module({
  imports: [SharedLocationModule],
  controllers: [LocationController],
  providers: [],
  exports: []
})
export class LocationModule {}
