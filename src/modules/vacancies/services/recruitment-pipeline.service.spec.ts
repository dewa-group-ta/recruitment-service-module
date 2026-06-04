import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { RecruitmentPipelineService } from "./recruitment-pipeline.service";
import { RecruitmentPipeline } from "../entities/recruitment-pipeline.entity";
import { CreateRecruitmentPipelineDto } from "../dto/create-recruitment-pipeline.dto";
import { UpdateRecruitmentPipelineDto } from "../dto/update-recruitment-pipeline.dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";

describe("RecruitmentPipelineService", () => {
  let service: RecruitmentPipelineService;
  let recruitmentPipelineRepository: jest.Mocked<
    Repository<RecruitmentPipeline>
  >;

  const mockPipeline = {
    id: "pipeline-1",
    name: "Software Engineer Pipeline",
    description: "Pipeline for software engineering positions",
    category: "TECHNICAL",
    version: "1.0",
    isDefault: false,
    isActive: true,
    isTemplate: true,
    usageCount: 0,
    createdById: "user-1",
    updatedById: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedById: null,
    stages: []
  };

  const mockDefaultTemplate = {
    ...mockPipeline,
    isDefault: true,
    isTemplate: true
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecruitmentPipelineService,
        {
          provide: getRepositoryToken(RecruitmentPipeline),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
              getCount: jest.fn(),
              getOne: jest.fn()
            }))
          }
        }
      ]
    }).compile();

    service = module.get<RecruitmentPipelineService>(
      RecruitmentPipelineService
    );
    recruitmentPipelineRepository = module.get(
      getRepositoryToken(RecruitmentPipeline)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto: CreateRecruitmentPipelineDto = {
      name: "Software Engineer Pipeline",
      description: "Pipeline for software engineering positions",
      category: "TECHNICAL"
    };

    it("should create a new recruitment pipeline successfully", async () => {
      // Arrange
      recruitmentPipelineRepository.create.mockReturnValue(mockPipeline as any);
      recruitmentPipelineRepository.save.mockResolvedValue(mockPipeline as any);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(recruitmentPipelineRepository.create).toHaveBeenCalledWith({
        ...createDto,
        version: "1.0",
        isDefault: false,
        isActive: true,
        isTemplate: false,
        usageCount: 0
      });
      expect(recruitmentPipelineRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe("Software Engineer Pipeline");
    });

    it("should create pipeline with custom values", async () => {
      // Arrange
      const customDto = {
        ...createDto,
        version: "2.0",
        isDefault: true,
        isActive: false,
        isTemplate: true,
        usageCount: 5
      };
      const customPipeline = { ...mockPipeline, ...customDto };
      recruitmentPipelineRepository.create.mockReturnValue(
        customPipeline as any
      );
      recruitmentPipelineRepository.save.mockResolvedValue(
        customPipeline as any
      );

      // Act
      const result = await service.create(customDto);

      // Assert
      expect(recruitmentPipelineRepository.create).toHaveBeenCalledWith(
        customDto
      );
      expect(result).toBeDefined();
      expect(result.version).toBe("2.0");
      expect(result.isDefault).toBe(true);
    });

    it("should throw BadRequestException when creation fails", async () => {
      // Arrange
      recruitmentPipelineRepository.create.mockReturnValue(mockPipeline as any);
      recruitmentPipelineRepository.save.mockRejectedValue(
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

    it("should return paginated pipelines without filters", async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPipeline]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      recruitmentPipelineRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      // Act
      const result = await service.findAll(paginationDto);

      // Assert
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "pipeline.deletedAt IS NULL"
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
        category: "TECHNICAL",
        isActive: true,
        isTemplate: true,
        isDefault: false,
        search: "software"
      };
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPipeline]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      recruitmentPipelineRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      // Act
      const result = await service.findAll(paginationDto, filters);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "pipeline.category = :category",
        { category: "TECHNICAL" }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "pipeline.isActive = :isActive",
        { isActive: true }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "pipeline.isTemplate = :isTemplate",
        { isTemplate: true }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "pipeline.isDefault = :isDefault",
        { isDefault: false }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(pipeline.name ILIKE :search OR pipeline.description ILIKE :search)",
        { search: "%software%" }
      );
      expect(result).toBeDefined();
    });
  });

  describe("findOne", () => {
    it("should return pipeline when found", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(
        mockPipeline as any
      );

      // Act
      const result = await service.findOne("pipeline-1");

      // Assert
      expect(recruitmentPipelineRepository.findOne).toHaveBeenCalledWith({
        where: { id: "pipeline-1", deletedAt: IsNull() },
        relations: ["stages"]
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("pipeline-1");
    });

    it("should throw NotFoundException when pipeline not found", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    const updateDto: UpdateRecruitmentPipelineDto = {
      name: "Updated Pipeline Name",
      description: "Updated description"
    };

    it("should update pipeline successfully", async () => {
      // Arrange
      const updatedPipeline = { ...mockPipeline, ...updateDto };
      recruitmentPipelineRepository.findOne
        .mockResolvedValueOnce(mockPipeline as any) // First call for finding existing pipeline
        .mockResolvedValueOnce(updatedPipeline as any); // Second call for fetching updated pipeline
      recruitmentPipelineRepository.update.mockResolvedValue({
        affected: 1
      } as any);

      // Act
      const result = await service.update("pipeline-1", updateDto);

      // Assert
      expect(recruitmentPipelineRepository.findOne).toHaveBeenCalledWith({
        where: { id: "pipeline-1", deletedAt: IsNull() }
      });
      expect(recruitmentPipelineRepository.update).toHaveBeenCalledWith(
        "pipeline-1",
        updateDto
      );
      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Pipeline Name");
    });

    it("should throw NotFoundException when pipeline not found", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update("nonexistent-id", updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException when update fails", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(
        mockPipeline as any
      );
      recruitmentPipelineRepository.update.mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(service.update("pipeline-1", updateDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("remove", () => {
    it("should soft delete pipeline successfully", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(
        mockPipeline as any
      );
      recruitmentPipelineRepository.softDelete.mockResolvedValue({
        affected: 1
      } as any);
      recruitmentPipelineRepository.update.mockResolvedValue({
        affected: 1
      } as any);

      // Act
      await service.remove("pipeline-1", "user-1");

      // Assert
      expect(recruitmentPipelineRepository.findOne).toHaveBeenCalledWith({
        where: { id: "pipeline-1", deletedAt: IsNull() }
      });
      expect(recruitmentPipelineRepository.softDelete).toHaveBeenCalledWith(
        "pipeline-1"
      );
      expect(recruitmentPipelineRepository.update).toHaveBeenCalledWith(
        "pipeline-1",
        { deletedById: "user-1" }
      );
    });

    it("should throw NotFoundException when pipeline not found", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove("nonexistent-id", "user-1")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("getDefaultTemplate", () => {
    it("should return default template when found", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(
        mockDefaultTemplate as any
      );

      // Act
      const result = await service.getDefaultTemplate();

      // Assert
      expect(recruitmentPipelineRepository.findOne).toHaveBeenCalledWith({
        where: { isDefault: true, isTemplate: true, deletedAt: IsNull() }
      });
      expect(result).toBeDefined();
      expect(result.isDefault).toBe(true);
      expect(result.isTemplate).toBe(true);
    });

    it("should return null when no default template found", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getDefaultTemplate();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("createFromTemplate", () => {
    it("should create pipeline instance from template successfully", async () => {
      // Arrange
      const templateId = "template-1";
      const createdById = "user-1";
      const instanceName = "New Pipeline Instance";
      const pipelineInstance = {
        ...mockPipeline,
        id: "instance-1",
        name: instanceName,
        isTemplate: false,
        templateId
      };

      recruitmentPipelineRepository.findOne.mockResolvedValue(
        mockDefaultTemplate as any
      );
      recruitmentPipelineRepository.create.mockReturnValue(
        pipelineInstance as any
      );
      recruitmentPipelineRepository.save.mockResolvedValue(
        pipelineInstance as any
      );

      // Act
      const result = await service.createFromTemplate(
        templateId,
        createdById,
        instanceName
      );

      // Assert
      expect(recruitmentPipelineRepository.findOne).toHaveBeenCalledWith({
        where: { id: templateId, isTemplate: true, deletedAt: IsNull() }
      });
      expect(recruitmentPipelineRepository.create).toHaveBeenCalledWith({
        ...mockDefaultTemplate,
        id: undefined,
        name: instanceName,
        isTemplate: false,
        templateId,
        createdById,
        updatedById: createdById,
        createdAt: undefined,
        updatedAt: undefined
      });
      expect(result).toBeDefined();
      expect(result.name).toBe(instanceName);
      expect(result.isTemplate).toBe(false);
    });

    it("should throw NotFoundException when template not found", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createFromTemplate("nonexistent-template", "user-1", "Instance")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when creation fails", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(
        mockDefaultTemplate as any
      );
      recruitmentPipelineRepository.create.mockReturnValue(mockPipeline as any);
      recruitmentPipelineRepository.save.mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(
        service.createFromTemplate("template-1", "user-1", "Instance")
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findTemplates", () => {
    it("should return all template pipelines", async () => {
      // Arrange
      const templates = [mockDefaultTemplate];
      recruitmentPipelineRepository.find.mockResolvedValue(templates as any);

      // Act
      const result = await service.findTemplates();

      // Assert
      expect(recruitmentPipelineRepository.find).toHaveBeenCalledWith({
        where: { isTemplate: true, deletedAt: IsNull() },
        order: { createdAt: "DESC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].isTemplate).toBe(true);
    });

    it("should return empty array when no templates found", async () => {
      // Arrange
      recruitmentPipelineRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findTemplates();

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("incrementUsageCount", () => {
    it("should increment usage count successfully", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(
        mockPipeline as any
      );
      recruitmentPipelineRepository.update.mockResolvedValue({
        affected: 1
      } as any);

      // Act
      await service.incrementUsageCount("pipeline-1");

      // Assert
      expect(recruitmentPipelineRepository.findOne).toHaveBeenCalledWith({
        where: { id: "pipeline-1", deletedAt: IsNull() }
      });
      expect(recruitmentPipelineRepository.update).toHaveBeenCalledWith(
        "pipeline-1",
        {
          usageCount: 1
        }
      );
    });

    it("should throw NotFoundException when pipeline not found", async () => {
      // Arrange
      recruitmentPipelineRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.incrementUsageCount("nonexistent-id")
      ).rejects.toThrow(NotFoundException);
    });
  });
});
