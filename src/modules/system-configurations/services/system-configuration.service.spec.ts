import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { SystemConfigurationService } from "./system-configuration.service";
import { SystemConfiguration } from "../entities/system-configuration.entity";
import { CreateSystemConfigurationDto } from "../dto/create-system-configuration.dto";
import { UpdateSystemConfigurationDto } from "../dto/update-system-configuration.dto";
import { QuerySystemConfigurationDto } from "../dto/query-system-configuration.dto";

describe("SystemConfigurationService", () => {
  let service: SystemConfigurationService;
  let systemConfigurationRepository: jest.Mocked<
    Repository<SystemConfiguration>
  >;

  const mockSystemConfiguration = {
    id: "config-1",
    configKey: "app.name",
    configValue: "Recruitment System",
    description: "Application name",
    category: "GENERAL",
    isActive: true,
    isEncrypted: false,
    createdById: "user-1",
    updatedById: "user-1",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigurationService,
        {
          provide: getRepositoryToken(SystemConfiguration),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<SystemConfigurationService>(
      SystemConfigurationService
    );
    systemConfigurationRepository = module.get(
      getRepositoryToken(SystemConfiguration)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto: CreateSystemConfigurationDto = {
      configKey: "app.name",
      configValue: "Recruitment System",
      description: "Application name",
      category: "GENERAL",
      isActive: true,
      isEncrypted: false
    };

    it("should create a new system configuration successfully", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(null); // No existing config
      systemConfigurationRepository.create.mockReturnValue(
        mockSystemConfiguration as any
      );
      systemConfigurationRepository.save.mockResolvedValue(
        mockSystemConfiguration as any
      );

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(systemConfigurationRepository.findOne).toHaveBeenCalledWith({
        where: { configKey: "app.name" }
      });
      expect(systemConfigurationRepository.create).toHaveBeenCalledWith(
        createDto
      );
      expect(systemConfigurationRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.configKey).toBe("app.name");
    });

    it("should throw ConflictException when config key already exists", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(
        mockSystemConfiguration as any
      );

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      expect(systemConfigurationRepository.findOne).toHaveBeenCalledWith({
        where: { configKey: "app.name" }
      });
    });

    it("should handle creation errors", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(null);
      systemConfigurationRepository.create.mockReturnValue(
        mockSystemConfiguration as any
      );
      systemConfigurationRepository.save.mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow("Database error");
    });
  });

  describe("findAll", () => {
    const queryDto: QuerySystemConfigurationDto = {
      page: 1,
      limit: 10,
      keyword: "app",
      category: "GENERAL",
      isActive: true
    };

    it("should return paginated system configurations with filters", async () => {
      // Arrange
      systemConfigurationRepository.findAndCount.mockResolvedValue([
        [mockSystemConfiguration],
        1
      ]);

      // Act
      const result = await service.findAll(queryDto);

      // Assert
      expect(systemConfigurationRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          configKey: Like("%app%"),
          category: "GENERAL",
          isActive: true
        },
        skip: 0,
        take: 10,
        order: {
          configKey: "ASC"
        }
      });
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total_items).toBe(1);
      expect(result.total_pages).toBe(1);
    });

    it("should return configurations without filters when not provided", async () => {
      // Arrange
      const simpleQueryDto = { page: 1, limit: 10 };
      systemConfigurationRepository.findAndCount.mockResolvedValue([
        [mockSystemConfiguration],
        1
      ]);

      // Act
      const result = await service.findAll(simpleQueryDto);

      // Assert
      expect(systemConfigurationRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: {
          configKey: "ASC"
        }
      });
      expect(result).toBeDefined();
    });

    it("should handle pagination errors", async () => {
      // Arrange
      systemConfigurationRepository.findAndCount.mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(service.findAll(queryDto)).rejects.toThrow("Database error");
    });
  });

  describe("findOne", () => {
    it("should return system configuration when found", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(
        mockSystemConfiguration as any
      );

      // Act
      const result = await service.findOne("config-1");

      // Assert
      expect(systemConfigurationRepository.findOne).toHaveBeenCalledWith({
        where: { id: "config-1" }
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("config-1");
    });

    it("should throw NotFoundException when system configuration not found", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findByKey", () => {
    it("should return system configuration by key", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(
        mockSystemConfiguration as any
      );

      // Act
      const result = await service.findByKey("app.name");

      // Assert
      expect(systemConfigurationRepository.findOne).toHaveBeenCalledWith({
        where: { configKey: "app.name" }
      });
      expect(result).toBeDefined();
      expect(result.configKey).toBe("app.name");
    });

    it("should return null when configuration not found by key", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByKey("nonexistent.key");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    const updateDto: UpdateSystemConfigurationDto = {
      configValue: "Updated Recruitment System",
      description: "Updated description"
    };

    it("should update system configuration successfully", async () => {
      // Arrange
      const updatedConfig = { ...mockSystemConfiguration, ...updateDto };
      systemConfigurationRepository.findOne
        .mockResolvedValueOnce(mockSystemConfiguration as any) // First call for finding existing config
        .mockResolvedValueOnce(updatedConfig as any); // Second call for fetching updated config
      systemConfigurationRepository.update.mockResolvedValue({
        affected: 1
      } as any);

      // Act
      const result = await service.update("config-1", updateDto);

      // Assert
      expect(systemConfigurationRepository.findOne).toHaveBeenCalledWith({
        where: { id: "config-1" }
      });
      expect(systemConfigurationRepository.update).toHaveBeenCalledWith(
        "config-1",
        updateDto
      );
      expect(result).toBeDefined();
      expect(result.configValue).toBe("Updated Recruitment System");
    });

    it("should throw NotFoundException when system configuration not found", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update("nonexistent-id", updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should handle update errors", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(
        mockSystemConfiguration as any
      );
      systemConfigurationRepository.update.mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(service.update("config-1", updateDto)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("remove", () => {
    it("should delete system configuration successfully", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(
        mockSystemConfiguration as any
      );
      systemConfigurationRepository.delete.mockResolvedValue({
        affected: 1
      } as any);

      // Act
      await service.remove("config-1");

      // Assert
      expect(systemConfigurationRepository.findOne).toHaveBeenCalledWith({
        where: { id: "config-1" }
      });
      expect(systemConfigurationRepository.delete).toHaveBeenCalledWith(
        "config-1"
      );
    });

    it("should throw NotFoundException when system configuration not found", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should handle deletion errors", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(
        mockSystemConfiguration as any
      );
      systemConfigurationRepository.delete.mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(service.remove("config-1")).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findByCategory", () => {
    it("should return system configurations by category", async () => {
      // Arrange
      const configs = [mockSystemConfiguration];
      systemConfigurationRepository.find.mockResolvedValue(configs as any);

      // Act
      const result = await service.findByCategory("GENERAL");

      // Assert
      expect(systemConfigurationRepository.find).toHaveBeenCalledWith({
        where: { category: "GENERAL", isActive: true },
        order: { configKey: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("GENERAL");
    });

    it("should return empty array when no configurations found", async () => {
      // Arrange
      systemConfigurationRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findByCategory("NONEXISTENT");

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("findActive", () => {
    it("should return all active system configurations", async () => {
      // Arrange
      const activeConfigs = [mockSystemConfiguration];
      systemConfigurationRepository.find.mockResolvedValue(
        activeConfigs as any
      );

      // Act
      const result = await service.findActive();

      // Assert
      expect(systemConfigurationRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { configKey: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it("should return empty array when no active configurations found", async () => {
      // Arrange
      systemConfigurationRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findActive();

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("getConfigValue", () => {
    it("should return configuration value by key", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(
        mockSystemConfiguration as any
      );

      // Act
      const result = await service.getConfigValue("app.name");

      // Assert
      expect(systemConfigurationRepository.findOne).toHaveBeenCalledWith({
        where: { configKey: "app.name", isActive: true }
      });
      expect(result).toBe("Recruitment System");
    });

    it("should return default value when configuration not found", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getConfigValue(
        "nonexistent.key",
        "default-value"
      );

      // Assert
      expect(result).toBe("default-value");
    });

    it("should return null when configuration not found and no default provided", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getConfigValue("nonexistent.key");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("setConfigValue", () => {
    it("should update configuration value by key", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(
        mockSystemConfiguration as any
      );
      systemConfigurationRepository.update.mockResolvedValue({
        affected: 1
      } as any);

      // Act
      await service.setConfigValue("app.name", "New Value");

      // Assert
      expect(systemConfigurationRepository.findOne).toHaveBeenCalledWith({
        where: { configKey: "app.name" }
      });
      expect(systemConfigurationRepository.update).toHaveBeenCalledWith(
        { configKey: "app.name" },
        { configValue: "New Value" }
      );
    });

    it("should throw NotFoundException when configuration not found", async () => {
      // Arrange
      systemConfigurationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.setConfigValue("nonexistent.key", "value")
      ).rejects.toThrow(NotFoundException);
    });
  });
});
