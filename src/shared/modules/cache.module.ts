import { Module, Global } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from "@nestjs/config";

/**
 * cache module global, pakai redis kalau REDIS_URL di-set, kalau tidak fallback in-memory.
 */
@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");

        if (redisUrl) {
          // pakai redis untuk caching di production
          return {
            ttl: 300, // ttl default 5 menit
            max: 1000, // jumlah maksimum item di cache
            isGlobal: true
          };
        } else {
          // pakai in-memory cache untuk development
          return {
            ttl: 300, // ttl default 5 menit
            max: 1000, // jumlah maksimum item di cache
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
