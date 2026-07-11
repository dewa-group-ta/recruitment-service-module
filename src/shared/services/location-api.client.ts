import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ILocationApiClient,
  LocationApiConfig
} from "../interface/location.interface";

/**
 * client http untuk location api eksternal, pakai fetch dengan retry + timeout.
 */
@Injectable()
export class LocationApiClient implements ILocationApiClient {
  private readonly logger = new Logger(LocationApiClient.name);
  private readonly config: LocationApiConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      baseUrl: this.configService.get<string>(
        "LOCATION_API_BASE_URL",
        "https://dev-door-location.neuron.id"
      ),
      timeout: this.configService.get<number>("LOCATION_API_TIMEOUT", 10000),
      retries: this.configService.get<number>("LOCATION_API_RETRIES", 3)
    };
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(endpoint, params);

    this.logger.debug(`Making GET request to: ${url}`);

    const response = await this.makeRequest(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as T;
    this.logger.debug(`GET request successful: ${url}`);
    return data;
  }

  async post<T>(endpoint: string, data?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(endpoint);

    this.logger.debug(`Making POST request to: ${url}`);

    const response = await this.makeRequest(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = (await response.json()) as T;
    this.logger.debug(`POST request successful: ${url}`);
    return responseData;
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.config.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async makeRequest(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error: unknown) {
        lastError = error as Error;

        if (attempt < this.config.retries) {
          this.logger.warn(`Request attempt ${attempt} failed, retrying...`, {
            url,
            error: lastError?.message,
            attempt,
            maxRetries: this.config.retries
          });

          // tunggu sebelum retry (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 1000);
        } else {
          this.logger.error(
            `All ${this.config.retries} request attempts failed`,
            {
              url,
              error: lastError?.message,
              attempts: this.config.retries
            }
          );
        }
      }
    }

    clearTimeout(timeoutId);
    if (lastError) {
      throw lastError;
    }
    throw new Error("All request attempts failed");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getConfig(): LocationApiConfig {
    return { ...this.config };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.get("/api/health");
      this.logger.log("Location API connection test successful");
      return true;
    } catch (error: unknown) {
      this.logger.error("Location API connection test failed", error);
      return false;
    }
  }
}
