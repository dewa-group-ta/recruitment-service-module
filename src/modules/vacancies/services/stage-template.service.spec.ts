import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, IsNull, In } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { StageTemplateService } from "./stage-template.service";
import { StageTemplate } from "../entities/stage-template.entity";
import { CreateStageTemplateDto } from "../dto/create-stage-template.dto";
import { UpdateStageTemplateDto } from "../dto/update-stage-template.dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";

describe("StageTemplateService", () => {
  let service: StageTemplateService;
  let stageTemplateRepository: jest.Mocked<Repository<StageTemplate>>;

  const mockStageTemplate = {
    id: "template-1",
    name: "Initial Screening",
    description: "Initial screening stage",
    stageType: "SCREENING",
    isRequired: true,
    isAutomatic: false,
    canSendMeeting: true,
    canScore: true,
    canUploadDocument: false,
    canAddNotes: true,
    canReject: true,
    canApprove: false,
    canSchedule: true,
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
        StageTemplateService,
        {
          provide: getRepositoryToken(StageTemplate),
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

    service = module.get<StageTemplateService>(StageTemplateService);
    stageTemplateRepository = module.get(getRepositoryToken(StageTemplate));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto: CreateStageTemplateDto = {
      name: "Initial Screening",
      description: "Initial screening stage",
      stageType: "SCREENING"
    };

    it("should create a new stage template successfully", async () => {
      stageTemplateRepository.create.mockReturnValue(mockStageTemplate as any);
      stageTemplateRepository.save.mockResolvedValue(mockStageTemplate as any);

      const result = await service.create(createDto);

      expect(stageTemplateRepository.create).toHaveBeenCalledWith({
        ...createDto,
        isRequired: true,
        isAutomatic: false,
        canSendMeeting: false,
        canScore: false,
        canUploadDocument: false,
        canAddNotes: false,
        canReject: false,
        canApprove: false,
        canSchedule: false,
        isActive: true
      });
      expect(stageTemplateRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe("Initial Screening");
    });

    it("should create stage template with custom values", async () => {
      const customDto = {
        ...createDto,
        isRequired: false,
        isAutomatic: true,
        canSendMeeting: true,
        canScore: true,
        canUploadDocument: true,
        canAddNotes: true,
        canReject: true,
        canApprove: true,
        canSchedule: true,
        isActive: false
      };
      const customTemplate = { ...mockStageTemplate, ...customDto };
      stageTemplateRepository.create.mockReturnValue(customTemplate as any);
      stageTemplateRepository.save.mockResolvedValue(customTemplate as any);

      const result = await service.create(customDto);

      expect(stageTemplateRepository.create).toHaveBeenCalledWith(customDto);
      expect(result).toBeDefined();
      expect(result.isRequired).toBe(false);
      expect(result.isAutomatic).toBe(true);
    });

    it("should throw BadRequestException when creation fails", async () => {
      stageTemplateRepository.create.mockReturnValue(mockStageTemplate as any);
      stageTemplateRepository.save.mockRejectedValue(
        new Error("Database error")
      );

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

    it("should return paginated stage templates", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStageTemplate]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      stageTemplateRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      const result = await service.findAll(paginationDto);

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
      const filters = {
        stageType: "SCREENING",
        isActive: true,
        search: "screening"
      };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStageTemplate]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      stageTemplateRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      const result = await service.findAll(paginationDto, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "template.stageType = :stageType",
        { stageType: "SCREENING" }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "template.isActive = :isActive",
        { isActive: true }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(template.name ILIKE :search OR template.description ILIKE :search)",
        { search: "%screening%" }
      );
      expect(result).toBeDefined();
    });
  });

  describe("findOne", () => {
    it("should return stage template when found", async () => {
      stageTemplateRepository.findOne.mockResolvedValue(
        mockStageTemplate as any
      );

      const result = await service.findOne("template-1");

      expect(stageTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: "template-1", deletedAt: IsNull() }
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("template-1");
    });

    it("should throw NotFoundException when stage template not found", async () => {
      stageTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    const updateDto: UpdateStageTemplateDto = {
      name: "Updated Initial Screening",
      description: "Updated description"
    };

    it("should update stage template successfully", async () => {
      const updatedTemplate = { ...mockStageTemplate, ...updateDto };
      stageTemplateRepository.findOne
        .mockResolvedValueOnce(mockStageTemplate as any) // First call for finding existing template
        .mockResolvedValueOnce(updatedTemplate as any); // Second call for fetching updated template
      stageTemplateRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update("template-1", updateDto);

      expect(stageTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: "template-1", deletedAt: IsNull() }
      });
      expect(stageTemplateRepository.update).toHaveBeenCalledWith(
        "template-1",
        updateDto
      );
      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Initial Screening");
    });

    it("should throw NotFoundException when stage template not found", async () => {
      stageTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.update("nonexistent-id", updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException when update fails", async () => {
      stageTemplateRepository.findOne.mockResolvedValue(
        mockStageTemplate as any
      );
      stageTemplateRepository.update.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.update("template-1", updateDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("remove", () => {
    it("should soft delete stage template successfully", async () => {
      stageTemplateRepository.findOne.mockResolvedValue(
        mockStageTemplate as any
      );
      stageTemplateRepository.softDelete.mockResolvedValue({
        affected: 1
      } as any);
      stageTemplateRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove("template-1", "user-1");

      expect(stageTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: "template-1", deletedAt: IsNull() }
      });
      expect(stageTemplateRepository.softDelete).toHaveBeenCalledWith(
        "template-1"
      );
      expect(stageTemplateRepository.update).toHaveBeenCalledWith(
        "template-1",
        { deletedById: "user-1" }
      );
    });

    it("should throw NotFoundException when stage template not found", async () => {
      stageTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.remove("nonexistent-id", "user-1")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findByStageType", () => {
    it("should return stage templates by stage type", async () => {
      const templates = [mockStageTemplate];
      stageTemplateRepository.find.mockResolvedValue(templates as any);

      const result = await service.findByStageType("SCREENING");

      expect(stageTemplateRepository.find).toHaveBeenCalledWith({
        where: { stageType: "SCREENING", isActive: true, deletedAt: IsNull() },
        order: { createdAt: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].stageType).toBe("SCREENING");
    });

    it("should return empty array when no templates found", async () => {
      stageTemplateRepository.find.mockResolvedValue([]);

      const result = await service.findByStageType("NONEXISTENT");

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("findByIds", () => {
    it("should return stage templates by IDs", async () => {
      const templates = [mockStageTemplate];
      stageTemplateRepository.find.mockResolvedValue(templates as any);

      const result = await service.findByIds(["template-1", "template-2"]);

      expect(stageTemplateRepository.find).toHaveBeenCalledWith({
        where: { id: In(["template-1", "template-2"]), deletedAt: IsNull() }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });

    it("should return empty array when no templates found", async () => {
      stageTemplateRepository.find.mockResolvedValue([]);

      const result = await service.findByIds([
        "nonexistent-1",
        "nonexistent-2"
      ]);

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("findActive", () => {
    it("should return all active stage templates", async () => {
      const activeTemplates = [mockStageTemplate];
      stageTemplateRepository.find.mockResolvedValue(activeTemplates as any);

      const result = await service.findActive();

      expect(stageTemplateRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: IsNull() },
        order: { name: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it("should return empty array when no active templates found", async () => {
      stageTemplateRepository.find.mockResolvedValue([]);

      const result = await service.findActive();

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });
});
