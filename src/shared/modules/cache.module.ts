import { Module, Global } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from "@nestjs/config";

/**
 * Global cache module for the application
 * Provides caching functionality using Redis or in-memory cache
 *
 * @class CacheModule
 */
@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");

        if (redisUrl) {
          // Use Redis for caching in production
          return {
            ttl: 300, // 5 minutes default TTL
            max: 1000, // Maximum number of items in cache
            isGlobal: true
          };
        } else {
          // Use in-memory cache for development
          return {
            ttl: 300, // 5 minutes default TTL
            max: 1000, // Maximum number of items in cache
            isGlobal: true
          };
        }
      },
      inject: [ConfigService]
    })
  ],
  exports: [CacheModule]
})
export class AppCacheModule {}
