import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { NotificationTemplateService } from "./notification-template.service";
import { NotificationTemplate } from "../entities/notification-template.entity";
import { CreateNotificationTemplateDto } from "../dto/create-notification-template.dto";
import { UpdateNotificationTemplateDto } from "../dto/update-notification-template.dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";

describe("NotificationTemplateService", () => {
  let service: NotificationTemplateService;
  let notificationTemplateRepository: jest.Mocked<
    Repository<NotificationTemplate>
  >;

  const mockNotificationTemplate = {
    id: "template-1",
    name: "Application Received",
    subject: "Application Received - {{jobTitle}}",
    content: "Dear {{applicantName}}, your application has been received.",
    templateType: "EMAIL",
    isActive: true,
    createdById: "user-1",
    updatedById: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedById: null
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationTemplateService,
        {
          provide: getRepositoryToken(NotificationTemplate),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
              getCount: jest.fn()
            }))
          }
        }
      ]
    }).compile();

    service = module.get<NotificationTemplateService>(
      NotificationTemplateService
    );
    notificationTemplateRepository = module.get(
      getRepositoryToken(NotificationTemplate)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto: CreateNotificationTemplateDto = {
      name: "Application Received",
      subject: "Application Received - {{jobTitle}}",
      content: "Dear {{applicantName}}, your application has been received.",
      templateType: "EMAIL"
    };

    it("should create a new notification template successfully", async () => {
      // Arrange
      notificationTemplateRepository.create.mockReturnValue(
        mockNotificationTemplate as any
      );
      notificationTemplateRepository.save.mockResolvedValue(
        mockNotificationTemplate as any
      );

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(notificationTemplateRepository.create).toHaveBeenCalledWith({
        ...createDto,
        isActive: true
      });
      expect(notificationTemplateRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe("Application Received");
    });

    it("should create template with custom isActive value", async () => {
      // Arrange
      const customDto = { ...createDto, isActive: false };
      const customTemplate = { ...mockNotificationTemplate, isActive: false };
      notificationTemplateRepository.create.mockReturnValue(
        customTemplate as any
      );
      notificationTemplateRepository.save.mockResolvedValue(
        customTemplate as any
      );

      // Act
      const result = await service.create(customDto);

      // Assert
      expect(notificationTemplateRepository.create).toHaveBeenCalledWith(
        customDto
      );
      expect(result).toBeDefined();
      expect(result.isActive).toBe(false);
    });

    it("should throw BadRequestException when creation fails", async () => {
      // Arrange
      notificationTemplateRepository.create.mockReturnValue(
        mockNotificationTemplate as any
      );
      notificationTemplateRepository.save.mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("findAll", () => {
    const paginationDto: BaseFindAllDto = {
      page: 1,
      limit: 10
    };

    it("should return paginated notification templates", async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockNotificationTemplate]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      notificationTemplateRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      // Act
      const result = await service.findAll(paginationDto);

      // Assert
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "template.deletedAt IS NULL"
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total_items).toBe(1);
    });

    it("should apply filters correctly", async () => {
      // Arrange
      const filters = {
        templateType: "EMAIL",
        isActive: true,
        search: "application"
      };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockNotificationTemplate]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      notificationTemplateRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      // Act
      const result = await service.findAll(paginationDto, filters);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "template.templateType = :templateType",
        { templateType: "EMAIL" }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "template.isActive = :isActive",
        { isActive: true }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(template.name ILIKE :search OR template.subject ILIKE :search OR template.content ILIKE :search)",
        { search: "%application%" }
      );
      expect(result).toBeDefined();
    });
  });

  describe("findOne", () => {
    it("should return notification template when found", async () => {
      // Arrange
      notificationTemplateRepository.findOne.mockResolvedValue(
        mockNotificationTemplate as any
      );

      // Act
      const result = await service.findOne("template-1");

      // Assert
      expect(notificationTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: "template-1", deletedAt: IsNull() }
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("template-1");
    });

    it("should throw NotFoundException when notification template not found", async () => {
      // Arrange
      notificationTemplateRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    const updateDto: UpdateNotificationTemplateDto = {
      name: "Updated Application Received",
      subject: "Updated subject"
    };

    it("should update notification template successfully", async () => {
      // Arrange
      const updatedTemplate = { ...mockNotificationTemplate, ...updateDto };
      notificationTemplateRepository.findOne
        .mockResolvedValueOnce(mockNotificationTemplate as any) // First call for finding existing template
        .mockResolvedValueOnce(updatedTemplate as any); // Second call for fetching updated template
      notificationTemplateRepository.update.mockResolvedValue({
        affected: 1
      } as any);

      // Act
      const result = await service.update("template-1", updateDto);

      // Assert
      expect(notificationTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: "template-1", deletedAt: IsNull() }
      });
      expect(notificationTemplateRepository.update).toHaveBeenCalledWith(
        "template-1",
        updateDto
      );
      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Application Received");
    });

    it("should throw NotFoundException when notification template not found", async () => {
      // Arrange
      notificationTemplateRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update("nonexistent-id", updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException when update fails", async () => {
      // Arrange
      notificationTemplateRepository.findOne.mockResolvedValue(
        mockNotificationTemplate as any
      );
      notificationTemplateRepository.update.mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(service.update("template-1", updateDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("remove", () => {
    it("should soft delete notification template successfully", async () => {
      // Arrange
      notificationTemplateRepository.findOne.mockResolvedValue(
        mockNotificationTemplate as any
      );
      notificationTemplateRepository.softDelete.mockResolvedValue({
        affected: 1
      } as any);
      notificationTemplateRepository.update.mockResolvedValue({
        affected: 1
      } as any);

      // Act
      await service.remove("template-1", "user-1");

      // Assert
      expect(notificationTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: "template-1", deletedAt: IsNull() }
      });
      expect(notificationTemplateRepository.softDelete).toHaveBeenCalledWith(
        "template-1"
      );
      expect(notificationTemplateRepository.update).toHaveBeenCalledWith(
        "template-1",
        { deletedById: "user-1" }
      );
    });

    it("should throw NotFoundException when notification template not found", async () => {
      // Arrange
      notificationTemplateRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove("nonexistent-id", "user-1")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findByTemplateType", () => {
    it("should return notification templates by template type", async () => {
      // Arrange
      const templates = [mockNotificationTemplate];
      notificationTemplateRepository.find.mockResolvedValue(templates as any);

      // Act
      const result = await service.findByTemplateType("EMAIL");

      // Assert
      expect(notificationTemplateRepository.find).toHaveBeenCalledWith({
        where: { templateType: "EMAIL", isActive: true, deletedAt: IsNull() },
        order: { name: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].templateType).toBe("EMAIL");
    });

    it("should return empty array when no templates found", async () => {
      // Arrange
      notificationTemplateRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findByTemplateType("SMS");

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("findActive", () => {
    it("should return all active notification templates", async () => {
      // Arrange
      const activeTemplates = [mockNotificationTemplate];
      notificationTemplateRepository.find.mockResolvedValue(
        activeTemplates as any
      );

      // Act
      const result = await service.findActive();

      // Assert
      expect(notificationTemplateRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: IsNull() },
        order: { name: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it("should return empty array when no active templates found", async () => {
      // Arrange
      notificationTemplateRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findActive();

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("renderTemplate", () => {
    it("should render template with variables", async () => {
      // Arrange
      const template = {
        ...mockNotificationTemplate,
        subject: "Application Received - {{jobTitle}}",
        content:
          "Dear {{applicantName}}, your application has been received for {{jobTitle}}."
      };
      notificationTemplateRepository.findOne.mockResolvedValue(template as any);

      // Act
      const result = await service.renderTemplate("template-1", {
        applicantName: "John Doe",
        jobTitle: "Software Engineer"
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.subject).toBe("Application Received - Software Engineer");
      expect(result.content).toBe(
        "Dear John Doe, your application has been received for Software Engineer."
      );
    });

    it("should throw NotFoundException when template not found", async () => {
      // Arrange
      notificationTemplateRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.renderTemplate("nonexistent-id", {})
      ).rejects.toThrow(NotFoundException);
    });

    it("should handle missing variables by leaving placeholders unchanged", async () => {
      // Arrange
      const template = {
        ...mockNotificationTemplate,
        subject: "Application Received - {{jobTitle}}",
        content: "Dear {{applicantName}}, your application has been received."
      };
      notificationTemplateRepository.findOne.mockResolvedValue(template as any);

      // Act
      const result = await service.renderTemplate("template-1", {
        applicantName: "John Doe"
        // jobTitle is missing
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.subject).toBe("Application Received - {{jobTitle}}");
      expect(result.content).toBe(
        "Dear John Doe, your application has been received."
      );
    });
  });
});
