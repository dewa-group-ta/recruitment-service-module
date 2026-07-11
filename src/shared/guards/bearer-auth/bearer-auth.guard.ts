import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "src/shared/decorators/public.decorator";
import { TokenService } from "src/modules/applicants/services/token.service";
import { ROLES } from "src/shared/decorators/roles.decorator";
import { role } from "src/shared/utils/constant";
import { Request } from "express";

/**
 * guard autentikasi bearer token, termasuk validasi khusus untuk role applicant.
 */
@Injectable()
export class BearerAuthGuard implements CanActivate {
  private readonly logger = new Logger(BearerAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()]
      );

      if (isPublic) {
        this.logger.debug("Public endpoint accessed, skipping authentication");
        return true;
      }

      const request = context.switchToHttp().getRequest<Request>();
      const token = this.extractTokenFromHeader(request);

      if (!token) {
        this.logger.warn("No authorization token provided", {
          ip: request.ip,
          userAgent: request.headers["user-agent"],
          path: request.path
        });
        throw new UnauthorizedException("Authorization token is required");
      }

      // role applicant divalidasi lewat token service, bukan sekadar dipakai sebagai id
      const roles = this.reflector.getAllAndOverride<string[]>(ROLES, [
        context.getHandler(),
        context.getClass()
      ]);

      if (roles?.includes(role.APPLICANT)) {
        return await this.validateApplicantToken(token, request);
      }

      // untuk role lain, token langsung dipakai sebagai user id
      request["user"] = {
        id: token
      };

      this.logger.debug("Token validated successfully", {
        userId: token,
        path: request.path
      });

      return true;
    } catch (error) {
      this.logger.error("Authentication failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new UnauthorizedException("Authentication failed");
    }
  }

  private async validateApplicantToken(
    token: string,
    request: Request
  ): Promise<boolean> {
    try {
      const applicantId = await this.tokenService.validateToken(token);

      if (!applicantId) {
        this.logger.warn("Invalid applicant token", {
          token: token.substring(0, 10) + "...",
          ip: request.ip
        });
        throw new UnauthorizedException("Invalid token");
      }

      request["applicantId"] = applicantId;

      this.logger.debug("Applicant token validated successfully", {
        applicantId,
        ip: request.ip,
        path: request.path
      });

      return true;
    } catch (error) {
      this.logger.error("Applicant token validation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        token: token.substring(0, 10) + "...",
        ip: request.ip
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new BadRequestException("Token validation failed");
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(" ");
    return type === "Bearer" ? token : undefined;
  }
}
