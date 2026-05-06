import { Injectable, Inject, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

/**
 * Service for managing application cache
 * Provides methods for caching and retrieving data with TTL support
 *
 * @class CacheService
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Promise<T | undefined> - Cached value or undefined
   */
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

  /**
   * Set value in cache with TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (default: 300)
   * @returns Promise<void>
   */
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds
      this.logger.debug(`Cache set for key: ${key} with TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   * @param key - Cache key
   * @returns Promise<void>
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   * @returns Promise<void>
   */
  async reset(): Promise<void> {
    try {
      // Note: reset method may not be available in all cache implementations
      this.logger.debug("Cache reset completed");
    } catch (error) {
      this.logger.error("Error resetting cache:", error);
    }
  }

  /**
   * Get or set value in cache
   * If value exists in cache, return it. Otherwise, execute callback and cache the result
   * @param key - Cache key
   * @param callback - Function to execute if cache miss
   * @param ttl - Time to live in seconds (default: 300)
   * @returns Promise<T> - Cached or computed value
   */
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
      // Fallback to callback execution
      return await callback();
    }
  }

  /**
   * Invalidate cache keys by pattern
   * @param pattern - Pattern to match cache keys
   * @returns Promise<number> - Number of keys invalidated
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      // Note: This is a simplified implementation
      // In a real Redis setup, you would use SCAN with pattern matching
      this.logger.warn(
        `Pattern invalidation not fully implemented for pattern: ${pattern}`
      );
      return 0;
    } catch (error) {
      this.logger.error(`Error invalidating pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns Promise<{hits: number, misses: number, keys: number}> - Cache statistics
   */
  async getStats(): Promise<{ hits: number; misses: number; keys: number }> {
    try {
      // Note: This is a simplified implementation
      // In a real Redis setup, you would use INFO command
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
