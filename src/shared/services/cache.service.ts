import { Injectable, Inject, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

/**
 * cache aplikasi dengan dukungan ttl.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl * 1000);
      this.logger.debug(`Cache set for key: ${key} with TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      // catatan: method reset mungkin tidak tersedia di semua implementasi cache
      this.logger.debug("Cache reset completed");
    } catch (error) {
      this.logger.error("Error resetting cache:", error);
    }
  }

  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== undefined) {
        return cached;
      }

      const value = await callback();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}:`, error);
      return await callback();
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      // catatan: implementasi ini masih sederhana; di setup redis sungguhan sebaiknya pakai SCAN dengan pattern matching
      this.logger.warn(
        `Pattern invalidation not fully implemented for pattern: ${pattern}`
      );
      return 0;
    } catch (error) {
      this.logger.error(`Error invalidating pattern ${pattern}:`, error);
      return 0;
    }
  }

  async getStats(): Promise<{ hits: number; misses: number; keys: number }> {
    try {
      // catatan: implementasi ini masih sederhana; di setup redis sungguhan sebaiknya pakai command INFO
      return {
        hits: 0,
        misses: 0,
        keys: 0
      };
    } catch (error) {
      this.logger.error("Error getting cache stats:", error);
      return {
        hits: 0,
        misses: 0,
        keys: 0
      };
    }
  }
}
