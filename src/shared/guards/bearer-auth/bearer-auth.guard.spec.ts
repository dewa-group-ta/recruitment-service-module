import { Test, TestingModule } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import {
  ExecutionContext,
  UnauthorizedException,
  BadRequestException
} from "@nestjs/common";
import { BearerAuthGuard } from "./bearer-auth.guard";
import { TokenService } from "../../../modules/applicants/services/token.service";
import { IS_PUBLIC_KEY } from "../../../decorators/public.decorator";
import { ROLES } from "../../../decorators/roles.decorator";
import { role } from "../../../utils/constant";
import { Request } from "express";

describe("BearerAuthGuard", () => {
  let guard: BearerAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let tokenService: jest.Mocked<TokenService>;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn()
    }))
  } as unknown as ExecutionContext;

  const mockRequest = {
    headers: {
      authorization: "Bearer valid-token",
      "user-agent": "test-agent"
    },
    ip: "127.0.0.1"
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BearerAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn()
          }
        },
        {
          provide: TokenService,
          useValue: {
            validateToken: jest.fn()
          }
        }
      ]
    }).compile();

    guard = module.get<BearerAuthGuard>(BearerAuthGuard);
    reflector = module.get(Reflector);
    tokenService = module.get(TokenService);

    mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("canActivate", () => {
    it("should return true for public routes", async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(true) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined); // ROLES

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass()
      ]);
    });

    it("should throw UnauthorizedException when no token provided", async () => {
      const requestWithoutToken = {
        ...mockRequest,
        headers: {}
      };
      mockExecutionContext
        .switchToHttp()
        .getRequest.mockReturnValue(requestWithoutToken);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined); // ROLES

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException when invalid token format", async () => {
      const requestWithInvalidToken = {
        ...mockRequest,
        headers: {
          authorization: "InvalidFormat token"
        }
      };
      mockExecutionContext
        .switchToHttp()
        .getRequest.mockReturnValue(requestWithInvalidToken);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined); // ROLES

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should validate applicant token successfully", async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce([role.APPLICANT]); // ROLES
      tokenService.validateToken.mockResolvedValue("applicant-1");

      const result = await guard.canActivate(mockExecutionContext);

      expect(tokenService.validateToken).toHaveBeenCalledWith(
        "valid-token",
        "127.0.0.1",
        "test-agent"
      );
      expect(result).toBe(true);
      expect(mockRequest["applicantId"]).toBe("applicant-1");
    });

    it("should throw UnauthorizedException when applicant token validation fails", async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce([role.APPLICANT]); // ROLES
      tokenService.validateToken.mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw BadRequestException when applicant token validation throws error", async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce([role.APPLICANT]); // ROLES
      tokenService.validateToken.mockRejectedValue(
        new Error("Token validation failed")
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        BadRequestException
      );
    });

    it("should set user from token for non-applicant routes", async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined); // ROLES

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest["user"]).toEqual({
        id: "valid-token"
      });
      expect(tokenService.validateToken).not.toHaveBeenCalled();
    });

    it("should handle routes with other roles", async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(["ADMIN"]); // ROLES

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest["user"]).toEqual({
        id: "valid-token"
      });
      expect(tokenService.validateToken).not.toHaveBeenCalled();
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from Bearer authorization header", () => {
      const request = {
        headers: {
          authorization: "Bearer valid-token"
        }
      } as Request;

      const token = (guard as any).extractTokenFromHeader(request);

      expect(token).toBe("valid-token");
    });

    it("should return undefined for non-Bearer authorization", () => {
      const request = {
        headers: {
          authorization: "Basic dXNlcjpwYXNz"
        }
      } as Request;

      const token = (guard as any).extractTokenFromHeader(request);

      expect(token).toBeUndefined();
    });

    it("should return undefined when no authorization header", () => {
      const request = {
        headers: {}
      } as Request;

      const token = (guard as any).extractTokenFromHeader(request);

      expect(token).toBeUndefined();
    });

    it("should return undefined for malformed authorization header", () => {
      const request = {
        headers: {
          authorization: "Bearer"
        }
      } as Request;

      const token = (guard as any).extractTokenFromHeader(request);

      expect(token).toBeUndefined();
    });

    it("should handle authorization header with multiple spaces", () => {
      const request = {
        headers: {
          authorization: "Bearer  valid-token  "
        }
      } as Request;

      const token = (guard as any).extractTokenFromHeader(request);

      expect(token).toBe("valid-token  ");
    });
  });
});
