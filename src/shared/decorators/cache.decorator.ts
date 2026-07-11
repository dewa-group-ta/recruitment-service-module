import { SetMetadata } from "@nestjs/common";

export interface CacheConfig {
  key?: string;
  ttl?: number;
  enabled?: boolean;
}

export const CACHE_CONFIG_KEY = "cache_config";

/**
 * decorator untuk konfigurasi caching pada method.
 */
export const Cacheable = (config: CacheConfig = {}): MethodDecorator => {
  return SetMetadata(CACHE_CONFIG_KEY, {
    key: config.key,
    ttl: config.ttl || 300,
    enabled: config.enabled !== false
  });
};

export interface CacheInvalidationConfig {
  keys?: string[];
  pattern?: string;
  all?: boolean;
}

export const CACHE_INVALIDATION_KEY = "cache_invalidation";

/**
 * decorator untuk konfigurasi invalidasi cache pada method.
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
