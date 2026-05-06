import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ILocationApiClient,
  LocationApiConfig
} from "../interface/location.interface";

/**
 * Location API client implementation using fetch
 * Handles HTTP requests to the location API service
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

  /**
   * Make GET request to location API
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns Promise<T> API response
   */
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

  /**
   * Make POST request to location API
   * @param endpoint API endpoint
   * @param data Request data
   * @returns Promise<T> API response
   */
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

  /**
   * Build full URL with query parameters
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns Full URL string
   * @private
   */
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

  /**
   * Make HTTP request with retry logic and timeout
   * @param url Request URL
   * @param options Request options
   * @returns Promise<Response> HTTP response
   * @private
   */
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

          // Wait before retry (exponential backoff)
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

  /**
   * Delay execution for specified milliseconds
   * @param ms Milliseconds to delay
   * @returns Promise<void>
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get API configuration
   * @returns LocationApiConfig Current configuration
   */
  getConfig(): LocationApiConfig {
    return { ...this.config };
  }

  /**
   * Test API connection
   * @returns Promise<boolean> Connection status
   */
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
