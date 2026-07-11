import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { PipelineStageService } from "./pipeline-stage.service";
import { PipelineStage } from "../entities/pipeline-stage.entity";
import { CreatePipelineStageDto } from "../dto/create-pipeline-stage.dto";
import { UpdatePipelineStageDto } from "../dto/update-pipeline-stage.dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";

describe("PipelineStageService", () => {
  let service: PipelineStageService;
  let pipelineStageRepository: jest.Mocked<Repository<PipelineStage>>;

  const mockPipelineStage = {
    id: "stage-1",
    pipelineId: "pipeline-1",
    stageTemplateId: "template-1",
    stageOrder: 1,
    name: "Initial Screening",
    description: "Initial screening stage",
    sendNotification: true,
    isActive: true,
    createdById: "user-1",
    updatedById: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedById: null,
    stageTemplate: {
      id: "template-1",
      name: "Initial Screening",
      stageType: "SCREENING"
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineStageService,
        {
          provide: getRepositoryToken(PipelineStage),
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
              getCount: jest.fn()
            }))
          }
        }
      ]
    }).compile();

    service = module.get<PipelineStageService>(PipelineStageService);
    pipelineStageRepository = module.get(getRepositoryToken(PipelineStage));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto: CreatePipelineStageDto = {
      pipelineId: "pipeline-1",
      stageTemplateId: "template-1",
      stageOrder: 1,
      name: "Initial Screening",
      description: "Initial screening stage"
    };

    it("should create a new pipeline stage successfully", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(null); // No existing stage with same order
      pipelineStageRepository.create.mockReturnValue(mockPipelineStage as any);
      pipelineStageRepository.save.mockResolvedValue(mockPipelineStage as any);

      const result = await service.create(createDto);

      expect(pipelineStageRepository.findOne).toHaveBeenCalledWith({
        where: {
          pipelineId: "pipeline-1",
          stageOrder: 1
        }
      });
      expect(pipelineStageRepository.create).toHaveBeenCalledWith({
        ...createDto,
        sendNotification: true
      });
      expect(pipelineStageRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe("Initial Screening");
    });

    it("should throw BadRequestException when stage order already exists", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(
        mockPipelineStage as any
      );

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException
      );
      expect(pipelineStageRepository.findOne).toHaveBeenCalledWith({
        where: {
          pipelineId: "pipeline-1",
          stageOrder: 1
        }
      });
    });

    it("should create stage with custom sendNotification value", async () => {
      const customDto = { ...createDto, sendNotification: false };
      const customStage = { ...mockPipelineStage, sendNotification: false };
      pipelineStageRepository.findOne.mockResolvedValue(null);
      pipelineStageRepository.create.mockReturnValue(customStage as any);
      pipelineStageRepository.save.mockResolvedValue(customStage as any);

      const result = await service.create(customDto);

      expect(pipelineStageRepository.create).toHaveBeenCalledWith(customDto);
      expect(result).toBeDefined();
      expect(result.sendNotification).toBe(false);
    });

    it("should throw BadRequestException when creation fails", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(null);
      pipelineStageRepository.create.mockReturnValue(mockPipelineStage as any);
      pipelineStageRepository.save.mockRejectedValue(
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

    it("should return paginated pipeline stages", async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPipelineStage]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      pipelineStageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      const result = await service.findAll(paginationDto);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "stage.stageTemplate",
        "stageTemplate"
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "stage.deletedAt IS NULL"
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total_items).toBe(1);
    });

    it("should apply filters correctly", async () => {
      const filters = {
        pipelineId: "pipeline-1",
        isActive: true,
        search: "screening"
      };
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPipelineStage]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      pipelineStageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      const result = await service.findAll(paginationDto, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "stage.pipelineId = :pipelineId",
        { pipelineId: "pipeline-1" }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "stage.isActive = :isActive",
        { isActive: true }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(stage.name ILIKE :search OR stage.description ILIKE :search)",
        { search: "%screening%" }
      );
      expect(result).toBeDefined();
    });
  });

  describe("findOne", () => {
    it("should return pipeline stage when found", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(
        mockPipelineStage as any
      );

      const result = await service.findOne("stage-1");

      expect(pipelineStageRepository.findOne).toHaveBeenCalledWith({
        where: { id: "stage-1" },
        relations: ["stageTemplate"]
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("stage-1");
    });

    it("should throw NotFoundException when pipeline stage not found", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    const updateDto: UpdatePipelineStageDto = {
      name: "Updated Initial Screening",
      description: "Updated description"
    };

    it("should update pipeline stage successfully", async () => {
      const updatedStage = { ...mockPipelineStage, ...updateDto };
      pipelineStageRepository.findOne
        .mockResolvedValueOnce(mockPipelineStage as any) // First call for finding existing stage
        .mockResolvedValueOnce(updatedStage as any); // Second call for fetching updated stage
      pipelineStageRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update("stage-1", updateDto);

      expect(pipelineStageRepository.findOne).toHaveBeenCalledWith({
        where: { id: "stage-1" }
      });
      expect(pipelineStageRepository.update).toHaveBeenCalledWith(
        "stage-1",
        updateDto
      );
      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Initial Screening");
    });

    it("should throw NotFoundException when pipeline stage not found", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(null);

      await expect(service.update("nonexistent-id", updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException when update fails", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(
        mockPipelineStage as any
      );
      pipelineStageRepository.update.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.update("stage-1", updateDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("remove", () => {
    it("should soft delete pipeline stage successfully", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(
        mockPipelineStage as any
      );
      pipelineStageRepository.softDelete.mockResolvedValue({
        affected: 1
      } as any);
      pipelineStageRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove("stage-1", "user-1");

      expect(pipelineStageRepository.findOne).toHaveBeenCalledWith({
        where: { id: "stage-1" }
      });
      expect(pipelineStageRepository.softDelete).toHaveBeenCalledWith(
        "stage-1"
      );
      expect(pipelineStageRepository.update).toHaveBeenCalledWith("stage-1", {
        deletedById: "user-1"
      });
    });

    it("should throw NotFoundException when pipeline stage not found", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(null);

      await expect(service.remove("nonexistent-id", "user-1")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findByPipelineId", () => {
    it("should return pipeline stages by pipeline ID", async () => {
      const stages = [mockPipelineStage];
      pipelineStageRepository.find.mockResolvedValue(stages as any);

      const result = await service.findByPipelineId("pipeline-1");

      expect(pipelineStageRepository.find).toHaveBeenCalledWith({
        where: { pipelineId: "pipeline-1", isActive: true },
        relations: ["stageTemplate"],
        order: { stageOrder: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].pipelineId).toBe("pipeline-1");
    });

    it("should return empty array when no stages found", async () => {
      pipelineStageRepository.find.mockResolvedValue([]);

      const result = await service.findByPipelineId("nonexistent-pipeline");

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("findByStageTemplateId", () => {
    it("should return pipeline stages by stage template ID", async () => {
      const stages = [mockPipelineStage];
      pipelineStageRepository.find.mockResolvedValue(stages as any);

      const result = await service.findByStageTemplateId("template-1");

      expect(pipelineStageRepository.find).toHaveBeenCalledWith({
        where: { stageTemplateId: "template-1", isActive: true },
        relations: ["stageTemplate"]
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].stageTemplateId).toBe("template-1");
    });

    it("should return empty array when no stages found", async () => {
      pipelineStageRepository.find.mockResolvedValue([]);

      const result = await service.findByStageTemplateId(
        "nonexistent-template"
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("updateStageOrder", () => {
    it("should update stage order successfully", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(
        mockPipelineStage as any
      );
      pipelineStageRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.updateStageOrder("stage-1", 2);

      expect(pipelineStageRepository.findOne).toHaveBeenCalledWith({
        where: { id: "stage-1" }
      });
      expect(pipelineStageRepository.update).toHaveBeenCalledWith("stage-1", {
        stageOrder: 2
      });
    });

    it("should throw NotFoundException when stage not found", async () => {
      pipelineStageRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStageOrder("nonexistent-id", 2)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findActive", () => {
    it("should return all active pipeline stages", async () => {
      const activeStages = [mockPipelineStage];
      pipelineStageRepository.find.mockResolvedValue(activeStages as any);

      const result = await service.findActive();

      expect(pipelineStageRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ["stageTemplate"],
        order: { stageOrder: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it("should return empty array when no active stages found", async () => {
      pipelineStageRepository.find.mockResolvedValue([]);

      const result = await service.findActive();

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });
});
