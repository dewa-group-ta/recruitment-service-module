import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LocationService } from "../services/location.service";
import { LocationApiClient } from "../services/location-api.client";
import { LOCATION_API_CLIENT } from "../interface/location.interface";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LOCATION_API_CLIENT,
      useClass: LocationApiClient
    },
    LocationService
  ],
  exports: [LocationService, LOCATION_API_CLIENT]
})
export class LocationModule {}
