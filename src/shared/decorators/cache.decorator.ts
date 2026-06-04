import { SetMetadata } from "@nestjs/common";

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  /** Cache key prefix */
  key?: string;
  /** Time to live in seconds */
  ttl?: number;
  /** Whether to use cache for this method */
  enabled?: boolean;
}

/**
 * Cache key for storing cache configuration metadata
 */
export const CACHE_CONFIG_KEY = "cache_config";

/**
 * Decorator to configure caching for a method
 *
 * @param config - Cache configuration
 * @returns MethodDecorator - Cache decorator
 *
 * @example
 * ```typescript
 * @Cacheable({ key: 'user', ttl: 300 })
 * async findUser(id: string): Promise<User> {
 *   // Method implementation
 * }
 * ```
 */
export const Cacheable = (config: CacheConfig = {}): MethodDecorator => {
  return SetMetadata(CACHE_CONFIG_KEY, {
    key: config.key,
    ttl: config.ttl || 300,
    enabled: config.enabled !== false
  });
};

/**
 * Cache invalidation configuration interface
 */
export interface CacheInvalidationConfig {
  /** Cache keys to invalidate */
  keys?: string[];
  /** Pattern to match cache keys for invalidation */
  pattern?: string;
  /** Whether to invalidate all cache */
  all?: boolean;
}

/**
 * Cache invalidation key for storing invalidation metadata
 */
export const CACHE_INVALIDATION_KEY = "cache_invalidation";

/**
 * Decorator to configure cache invalidation for a method
 *
 * @param config - Cache invalidation configuration
 * @returns MethodDecorator - Cache invalidation decorator
 *
 * @example
 * ```typescript
 * @CacheInvalidate({ keys: ['user', 'users'] })
 * async updateUser(id: string, data: UpdateUserDto): Promise<User> {
 *   // Method implementation
 * }
 * ```
 */
export const CacheInvalidate = (
  config: CacheInvalidationConfig = {}
): MethodDecorator => {
  return SetMetadata(CACHE_INVALIDATION_KEY, {
    keys: config.keys || [],
    pattern: config.pattern,
    all: config.all || false
  });
};
