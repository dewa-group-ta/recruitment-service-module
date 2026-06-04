import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { TokenService } from "./token.service";
import { AuthToken } from "../entities/auth-token.entity";
import { Applicant } from "../entities/applicant.entity";
import { EmailService } from "../../../shared/services/email.service";
import { TokenType } from "../../../shared/enums/pipeline.enum";

// Mock bcrypt
jest.mock("bcrypt");
const mockBcrypt = require("bcrypt");

// Mock crypto
jest.mock("crypto");
const mockCrypto = require("crypto");

describe("TokenService", () => {
  let service: TokenService;
  let tokenRepository: jest.Mocked<Repository<AuthToken>>;
  let applicantRepository: jest.Mocked<Repository<Applicant>>;
  let emailService: jest.Mocked<EmailService>;

  const mockApplicant = {
    id: "applicant-1",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe"
  };

  const mockAuthToken = {
    id: "token-1",
    email: "john@example.com",
    token: "hashed-token",
    tokenType: TokenType.LOGIN,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    isUsed: false,
    createdAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: getRepositoryToken(AuthToken),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(Applicant),
          useValue: {
            findOne: jest.fn()
          }
        },
        {
          provide: EmailService,
          useValue: {
            sendApplicationReceivedEmail: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<TokenService>(TokenService);
    tokenRepository = module.get(getRepositoryToken(AuthToken));
    applicantRepository = module.get(getRepositoryToken(Applicant));
    emailService = module.get(EmailService);

    // Setup default mocks
    mockBcrypt.hash.mockResolvedValue("hashed-token");
    mockCrypto.randomBytes.mockReturnValue({
      toString: () => "random-token-string"
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateAndSendLoginToken", () => {
    it("should generate and send login token successfully", async () => {
      // Arrange
      applicantRepository.findOne.mockResolvedValue(mockApplicant as any);
      tokenRepository.create.mockReturnValue(mockAuthToken as any);
      tokenRepository.save.mockResolvedValue(mockAuthToken as any);
      emailService.sendApplicationReceivedEmail.mockResolvedValue(true);

      // Act
      const result = await service.generateAndSendLoginToken(
        "applicant-1",
        "Software Engineer"
      );

      // Assert
      expect(applicantRepository.findOne).toHaveBeenCalledWith({
        where: { id: "applicant-1" }
      });
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
      expect(mockBcrypt.hash).toHaveBeenCalledWith("random-token-string", 10);
      expect(tokenRepository.create).toHaveBeenCalledWith({
        email: "john@example.com",
        token: "hashed-token",
        tokenType: TokenType.LOGIN,
        expiresAt: expect.any(Date),
        isUsed: false
      });
      expect(tokenRepository.save).toHaveBeenCalled();
      expect(emailService.sendApplicationReceivedEmail).toHaveBeenCalledWith(
        "john@example.com",
        "John Doe",
        "Software Engineer",
        expect.stringContaining("token=")
      );
      expect(result).toBe("random-token-string");
    });

    it("should throw error when applicant not found", async () => {
      // Arrange
      applicantRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateAndSendLoginToken("nonexistent-id", "Software Engineer")
      ).rejects.toThrow("Applicant not found");
    });

    it("should handle email sending failure gracefully", async () => {
      // Arrange
      applicantRepository.findOne.mockResolvedValue(mockApplicant as any);
      tokenRepository.create.mockReturnValue(mockAuthToken as any);
      tokenRepository.save.mockResolvedValue(mockAuthToken as any);
      emailService.sendApplicationReceivedEmail.mockResolvedValue(false);

      // Act
      const result = await service.generateAndSendLoginToken(
        "applicant-1",
        "Software Engineer"
      );

      // Assert
      expect(result).toBe("random-token-string");
      expect(emailService.sendApplicationReceivedEmail).toHaveBeenCalled();
    });
  });

  describe("validateToken", () => {
    it("should validate token successfully", async () => {
      // Arrange
      const token = "valid-token";
      const hashedToken = "hashed-valid-token";
      tokenRepository.findOne.mockResolvedValue({
        ...mockAuthToken,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      } as any);
      mockBcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await service.validateToken(token);

      // Assert
      expect(tokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          token: hashedToken,
          isUsed: false,
          expiresAt: MoreThan(new Date())
        }
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(token, hashedToken);
      expect(result).toBeDefined();
      expect(result.email).toBe("john@example.com");
    });

    it("should return null when token not found", async () => {
      // Arrange
      const token = "invalid-token";
      const hashedToken = "hashed-invalid-token";
      tokenRepository.findOne.mockResolvedValue(null);
      mockBcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await service.validateToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when token is expired", async () => {
      // Arrange
      const token = "expired-token";
      const hashedToken = "hashed-expired-token";
      tokenRepository.findOne.mockResolvedValue({
        ...mockAuthToken,
        token: hashedToken,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      } as any);

      // Act
      const result = await service.validateToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when token is already used", async () => {
      // Arrange
      const token = "used-token";
      const hashedToken = "hashed-used-token";
      tokenRepository.findOne.mockResolvedValue({
        ...mockAuthToken,
        token: hashedToken,
        isUsed: true
      } as any);

      // Act
      const result = await service.validateToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when token comparison fails", async () => {
      // Arrange
      const token = "wrong-token";
      const hashedToken = "hashed-token";
      tokenRepository.findOne.mockResolvedValue({
        ...mockAuthToken,
        token: hashedToken
      } as any);
      mockBcrypt.compare.mockResolvedValue(false);

      // Act
      const result = await service.validateToken(token);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("markTokenAsUsed", () => {
    it("should mark token as used successfully", async () => {
      // Arrange
      const token = "valid-token";
      const hashedToken = "hashed-valid-token";
      tokenRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Act
      await service.markTokenAsUsed(token);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith(token, 10);
      expect(tokenRepository.update).toHaveBeenCalledWith(
        { token: hashedToken },
        { isUsed: true }
      );
    });

    it("should handle token marking failure gracefully", async () => {
      // Arrange
      const token = "valid-token";
      tokenRepository.update.mockResolvedValue({ affected: 0 } as any);

      // Act
      await service.markTokenAsUsed(token);

      // Assert
      expect(tokenRepository.update).toHaveBeenCalled();
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should cleanup expired tokens successfully", async () => {
      // Arrange
      tokenRepository.delete.mockResolvedValue({ affected: 5 } as any);

      // Act
      const result = await service.cleanupExpiredTokens();

      // Assert
      expect(tokenRepository.delete).toHaveBeenCalledWith({
        expiresAt: MoreThan(new Date())
      });
      expect(result).toBe(5);
    });

    it("should return 0 when no expired tokens found", async () => {
      // Arrange
      tokenRepository.delete.mockResolvedValue({ affected: 0 } as any);

      // Act
      const result = await service.cleanupExpiredTokens();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe("generateToken", () => {
    it("should generate unique token", () => {
      // Act
      const token1 = (service as any).generateToken();
      const token2 = (service as any).generateToken();

      // Assert
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
      expect(token1).toBe("random-token-string");
      expect(token2).toBe("random-token-string");
    });
  });

  describe("hashToken", () => {
    it("should hash token successfully", async () => {
      // Arrange
      const token = "plain-token";
      mockBcrypt.hash.mockResolvedValue("hashed-token");

      // Act
      const result = await (service as any).hashToken(token);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith(token, 10);
      expect(result).toBe("hashed-token");
    });
  });

  describe("compareToken", () => {
    it("should compare token successfully", async () => {
      // Arrange
      const plainToken = "plain-token";
      const hashedToken = "hashed-token";
      mockBcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await (service as any).compareToken(
        plainToken,
        hashedToken
      );

      // Assert
      expect(mockBcrypt.compare).toHaveBeenCalledWith(plainToken, hashedToken);
      expect(result).toBe(true);
    });

    it("should return false when tokens do not match", async () => {
      // Arrange
      const plainToken = "plain-token";
      const hashedToken = "different-hashed-token";
      mockBcrypt.compare.mockResolvedValue(false);

      // Act
      const result = await (service as any).compareToken(
        plainToken,
        hashedToken
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
