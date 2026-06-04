import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { CacheService } from "../services/cache.service";
import { CACHE_CONFIG_KEY, CacheConfig } from "../decorators/cache.decorator";

/**
 * Interceptor for automatic caching of method results
 * Caches method results based on configuration from @Cacheable decorator
 *
 * @class CacheInterceptor
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector
  ) {}

  /**
   * Intercept method calls and handle caching
   * @param context - Execution context
   * @param next - Call handler
   * @returns Observable<any> - Cached or fresh result
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const cacheConfig = this.reflector.get<CacheConfig>(
      CACHE_CONFIG_KEY,
      context.getHandler()
    );

    if (!cacheConfig?.enabled) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(context, cacheConfig.key);

    try {
      // Try to get from cache first
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult !== undefined) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return of(cachedResult);
      }

      // Cache miss, execute method and cache result
      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      return next.handle().pipe(
        tap(async (result) => {
          try {
            await this.cacheService.set(cacheKey, result, cacheConfig.ttl);
            this.logger.debug(`Cached result for key: ${cacheKey}`);
          } catch (error) {
            this.logger.error(
              `Error caching result for key ${cacheKey}:`,
              error
            );
          }
        })
      );
    } catch (error) {
      this.logger.error(
        `Error in cache interceptor for key ${cacheKey}:`,
        error
      );
      // Fallback to normal execution
      return next.handle();
    }
  }

  /**
   * Generate cache key based on context and configuration
   * @param context - Execution context
   * @param keyPrefix - Key prefix from decorator
   * @returns string - Generated cache key
   */
  private generateCacheKey(
    context: ExecutionContext,
    keyPrefix?: string
  ): string {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    // Use provided key prefix or generate from class and method
    const baseKey = keyPrefix || `${className}:${methodName}`;

    // Include relevant parameters in cache key
    const params = this.extractCacheableParams(request);
    const paramString = params.length > 0 ? `:${params.join(":")}` : "";

    return `${baseKey}${paramString}`;
  }

  /**
   * Extract cacheable parameters from request
   * @param request - HTTP request object
   * @returns string[] - Array of parameter values
   */
  private extractCacheableParams(request: any): string[] {
    const params: string[] = [];

    // Add route parameters
    if (request.params) {
      Object.values(request.params).forEach((param: any) => {
        if (param && typeof param === "string") {
          params.push(param);
        }
      });
    }

    // Add query parameters (only for GET requests)
    if (request.method === "GET" && request.query) {
      Object.entries(request.query)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistent key generation
        .forEach(([key, value]) => {
          if (value && typeof value === "string") {
            params.push(`${key}:${value}`);
          }
        });
    }

    return params;
  }
}
