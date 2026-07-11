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
 * interceptor untuk auto-caching hasil method yang ditandai decorator @Cacheable.
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector
  ) {}

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
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult !== undefined) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return of(cachedResult);
      }

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
      return next.handle();
    }
  }

  private generateCacheKey(
    context: ExecutionContext,
    keyPrefix?: string
  ): string {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    const baseKey = keyPrefix || `${className}:${methodName}`;

    const params = this.extractCacheableParams(request);
    const paramString = params.length > 0 ? `:${params.join(":")}` : "";

    return `${baseKey}${paramString}`;
  }

  private extractCacheableParams(request: any): string[] {
    const params: string[] = [];

    if (request.params) {
      Object.values(request.params).forEach((param: any) => {
        if (param && typeof param === "string") {
          params.push(param);
        }
      });
    }

    if (request.method === "GET" && request.query) {
      Object.entries(request.query)
        .sort(([a], [b]) => a.localeCompare(b)) // diurutkan supaya cache key konsisten
        .forEach(([key, value]) => {
          if (value && typeof value === "string") {
            params.push(`${key}:${value}`);
          }
        });
    }

    return params;
  }
}
