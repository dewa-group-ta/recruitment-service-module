import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "./email.service";
import { EMAIL_TEMPLATE_PROVIDER } from "../interface/email.interface";
import { EmailTemplateName } from "../enums/email.enum";
import * as nodemailer from "nodemailer";

jest.mock("nodemailer");
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe("EmailService", () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;
  let templateProvider: jest.Mocked<any>;
  let mockTransporter: jest.Mocked<any>;

  const mockTemplate = {
    subject: "Test Subject {{applicantName}}",
    text: "Test text content {{applicantName}}",
    html: "<p>Test HTML content {{applicantName}}</p>"
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn()
    };

    mockNodemailer.createTransport.mockReturnValue(mockTransporter);

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config = {
          SMTP_USER: "test@example.com",
          SMTP_PASS: "password123",
          SMTP_FROM_EMAIL: "test@example.com",
          SMTP_HOST: "smtp.example.com",
          SMTP_PORT: 587,
          SMTP_SECURE: false,
          SMTP_FROM_NAME: "Recruitment System"
        };
        return config[key] || defaultValue;
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: EMAIL_TEMPLATE_PROVIDER,
          useValue: {
            getTemplate: jest.fn(),
            renderTemplate: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);
    templateProvider = module.get(EMAIL_TEMPLATE_PROVIDER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor and initialization", () => {
    it("should initialize email service successfully with valid config", () => {
      expect(service).toBeDefined();
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: {
          user: "test@example.com",
          pass: "password123"
        }
      });
    });

    it("should throw error when required SMTP config is missing", () => {
      configService.get.mockReturnValue(undefined);

      expect(() => new EmailService(configService, templateProvider)).toThrow();
    });
  });

  describe("sendEmail", () => {
    const mockEmailOptions = {
      to: { email: "recipient@example.com", name: "Test Recipient" },
      subject: "Test Subject",
      text: "Test content",
      html: "<p>Test HTML content</p>"
    };

    it("should send email successfully", async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id"
      });

      const result = await service.sendEmail(mockEmailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: "Recruitment System <test@example.com>",
        to: "Test Recipient <recipient@example.com>",
        cc: undefined,
        bcc: undefined,
        subject: "Test Subject",
        text: "Test content",
        html: "<p>Test HTML content</p>",
        attachments: undefined,
        replyTo: undefined,
        priority: "normal"
      });
      expect(result).toBe(true);
    });

    it("should send email with multiple recipients", async () => {
      const multipleRecipients = [
        { email: "recipient1@example.com", name: "Recipient 1" },
        { email: "recipient2@example.com", name: "Recipient 2" }
      ];
      const optionsWithMultipleRecipients = {
        ...mockEmailOptions,
        to: multipleRecipients
      };
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id"
      });

      const result = await service.sendEmail(optionsWithMultipleRecipients);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "Recipient 1 <recipient1@example.com>, Recipient 2 <recipient2@example.com>"
        })
      );
      expect(result).toBe(true);
    });

    it("should send email with CC and BCC recipients", async () => {
      const optionsWithCCBCC = {
        ...mockEmailOptions,
        cc: { email: "cc@example.com", name: "CC Recipient" },
        bcc: { email: "bcc@example.com", name: "BCC Recipient" }
      };
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id"
      });

      const result = await service.sendEmail(optionsWithCCBCC);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: "CC Recipient <cc@example.com>",
          bcc: "BCC Recipient <bcc@example.com>"
        })
      );
      expect(result).toBe(true);
    });

    it("should return false when email sending fails", async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error("SMTP Error"));

      const result = await service.sendEmail(mockEmailOptions);

      expect(result).toBe(false);
    });

    it("should handle recipients without names", async () => {
      const optionsWithoutNames = {
        ...mockEmailOptions,
        to: { email: "recipient@example.com" }
      };
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id"
      });

      const result = await service.sendEmail(optionsWithoutNames);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "recipient@example.com"
        })
      );
      expect(result).toBe(true);
    });
  });

  describe("sendTemplateEmail", () => {
    const templateData = {
      applicantName: "John Doe",
      jobTitle: "Software Engineer"
    };

    it("should send template email successfully", async () => {
      templateProvider.getTemplate.mockReturnValue(mockTemplate);
      templateProvider.renderTemplate
        .mockReturnValueOnce("Test Subject John Doe") // For subject
        .mockReturnValueOnce("Test text content John Doe") // For text
        .mockReturnValueOnce("<p>Test HTML content John Doe</p>"); // For html
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id"
      });

      const result = await service.sendTemplateEmail(
        EmailTemplateName.APPLICATION_RECEIVED,
        { email: "recipient@example.com", name: "Test Recipient" },
        templateData
      );

      expect(templateProvider.getTemplate).toHaveBeenCalledWith(
        EmailTemplateName.APPLICATION_RECEIVED
      );
      expect(templateProvider.renderTemplate).toHaveBeenCalledTimes(3);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Test Subject John Doe",
          text: "Test text content John Doe",
          html: "<p>Test HTML content John Doe</p>"
        })
      );
      expect(result).toBe(true);
    });

    it("should return false when template is not found", async () => {
      templateProvider.getTemplate.mockReturnValue(null);

      const result = await service.sendTemplateEmail(
        "nonexistent-template",
        { email: "recipient@example.com" },
        templateData
      );

      expect(templateProvider.getTemplate).toHaveBeenCalledWith(
        "nonexistent-template"
      );
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("should return false when template rendering fails", async () => {
      templateProvider.getTemplate.mockReturnValue(mockTemplate);
      templateProvider.renderTemplate.mockImplementation(() => {
        throw new Error("Template rendering error");
      });

      const result = await service.sendTemplateEmail(
        EmailTemplateName.APPLICATION_RECEIVED,
        { email: "recipient@example.com" },
        templateData
      );

      expect(result).toBe(false);
    });

    it("should handle template without text content", async () => {
      const templateWithoutText = {
        subject: "Test Subject {{applicantName}}",
        html: "<p>Test HTML content {{applicantName}}</p>"
      };
      templateProvider.getTemplate.mockReturnValue(templateWithoutText);
      templateProvider.renderTemplate
        .mockReturnValueOnce("Test Subject John Doe")
        .mockReturnValueOnce("<p>Test HTML content John Doe</p>");
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id"
      });

      const result = await service.sendTemplateEmail(
        EmailTemplateName.APPLICATION_RECEIVED,
        { email: "recipient@example.com" },
        templateData
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Test Subject John Doe",
          text: undefined,
          html: "<p>Test HTML content John Doe</p>"
        })
      );
      expect(result).toBe(true);
    });
  });

  describe("verifyConnection", () => {
    it("should verify email connection successfully", async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await service.verifyConnection();

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false when connection verification fails", async () => {
      mockTransporter.verify.mockRejectedValue(new Error("Connection failed"));

      const result = await service.verifyConnection();

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe("sendApplicationReceivedEmail", () => {
    it("should send application received email successfully", async () => {
      templateProvider.getTemplate.mockReturnValue(mockTemplate);
      templateProvider.renderTemplate
        .mockReturnValueOnce("Application Received - John Doe")
        .mockReturnValueOnce(
          "Your application for Software Engineer has been received"
        )
        .mockReturnValueOnce(
          "<p>Your application for Software Engineer has been received</p>"
        );
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id"
      });

      const result = await service.sendApplicationReceivedEmail(
        "john@example.com",
        "John Doe",
        "Software Engineer",
        "https://example.com/application/123"
      );

      expect(templateProvider.getTemplate).toHaveBeenCalledWith(
        EmailTemplateName.APPLICATION_RECEIVED
      );
      expect(templateProvider.renderTemplate).toHaveBeenCalledWith(
        mockTemplate.subject,
        {
          applicantName: "John Doe",
          jobTitle: "Software Engineer",
          applicationLink: "https://example.com/application/123"
        }
      );
      expect(result).toBe(true);
    });
  });

  describe("sendApplicationStatusUpdateEmail", () => {
    it("should send application status update email successfully", async () => {
      templateProvider.getTemplate.mockReturnValue(mockTemplate);
      templateProvider.renderTemplate
        .mockReturnValueOnce("Application Status Update - John Doe")
        .mockReturnValueOnce(
          "Your application status has been updated to HIRED"
        )
        .mockReturnValueOnce(
          "<p>Your application status has been updated to HIRED</p>"
        );
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id"
      });

      const result = await service.sendApplicationStatusUpdateEmail(
        "john@example.com",
        "John Doe",
        "Software Engineer",
        "HIRED"
      );

      expect(templateProvider.getTemplate).toHaveBeenCalledWith(
        EmailTemplateName.APPLICATION_STATUS_UPDATE
      );
      expect(templateProvider.renderTemplate).toHaveBeenCalledWith(
        mockTemplate.subject,
        {
          applicantName: "John Doe",
          jobTitle: "Software Engineer",
          status: "HIRED"
        }
      );
      expect(result).toBe(true);
    });
  });

  describe("sendInterviewInvitationEmail", () => {
    it("should send interview invitation email successfully", async () => {
      templateProvider.getTemplate.mockReturnValue(mockTemplate);
      templateProvider.renderTemplate
        .mockReturnValueOnce("Interview Invitation - John Doe")
        .mockReturnValueOnce("You are invited for an interview on 2024-01-15")
        .mockReturnValueOnce(
          "<p>You are invited for an interview on 2024-01-15</p>"
        );
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id"
      });

      const result = await service.sendInterviewInvitationEmail(
        "john@example.com",
        "John Doe",
        "Software Engineer",
        "2024-01-15",
        "Office Building A"
      );

      expect(templateProvider.getTemplate).toHaveBeenCalledWith(
        EmailTemplateName.INTERVIEW_INVITATION
      );
      expect(templateProvider.renderTemplate).toHaveBeenCalledWith(
        mockTemplate.subject,
        {
          applicantName: "John Doe",
          jobTitle: "Software Engineer",
          interviewDate: "2024-01-15",
          interviewLocation: "Office Building A"
        }
      );
      expect(result).toBe(true);
    });
  });
});
