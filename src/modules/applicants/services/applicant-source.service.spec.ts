import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { ApplicantSourceService } from "./applicant-source.service";
import { ApplicantSource } from "../entities/applicant-source.entity";
import { CreateApplicantSourceDto } from "../dto/create-applicant-source.dto";
import { UpdateApplicantSourceDto } from "../dto/update-applicant-source.dto";
import { QueryApplicantSourceDto } from "../dto/query-applicant-source.dto";

describe("ApplicantSourceService", () => {
  let service: ApplicantSourceService;
  let applicantSourceRepository: jest.Mocked<Repository<ApplicantSource>>;

  const mockApplicantSource = {
    id: "source-1",
    name: "LinkedIn",
    code: "LINKEDIN",
    description: "LinkedIn job postings",
    isActive: true,
    sortOrder: 1,
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
        ApplicantSourceService,
        {
          provide: getRepositoryToken(ApplicantSource),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<ApplicantSourceService>(ApplicantSourceService);
    applicantSourceRepository = module.get(getRepositoryToken(ApplicantSource));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto: CreateApplicantSourceDto = {
      name: "LinkedIn",
      code: "LINKEDIN",
      description: "LinkedIn job postings",
      isActive: true,
      sortOrder: 1
    };

    it("should create a new applicant source successfully", async () => {
      applicantSourceRepository.create.mockReturnValue(
        mockApplicantSource as any
      );
      applicantSourceRepository.save.mockResolvedValue(
        mockApplicantSource as any
      );

      const result = await service.create(createDto);

      expect(applicantSourceRepository.create).toHaveBeenCalledWith(createDto);
      expect(applicantSourceRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe("LinkedIn");
    });

    it("should handle creation errors", async () => {
      applicantSourceRepository.create.mockReturnValue(
        mockApplicantSource as any
      );
      applicantSourceRepository.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.create(createDto)).rejects.toThrow("Database error");
    });
  });

  describe("findAll", () => {
    it("should return all applicant sources ordered by sortOrder and name", async () => {
      const sources = [mockApplicantSource];
      applicantSourceRepository.find.mockResolvedValue(sources as any);

      const result = await service.findAll();

      expect(applicantSourceRepository.find).toHaveBeenCalledWith({
        order: { sortOrder: "ASC", name: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("LinkedIn");
    });

    it("should return empty array when no sources found", async () => {
      applicantSourceRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("findActive", () => {
    it("should return all active applicant sources", async () => {
      const activeSources = [mockApplicantSource];
      applicantSourceRepository.find.mockResolvedValue(activeSources as any);

      const result = await service.findActive();

      expect(applicantSourceRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortOrder: "ASC", name: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it("should return empty array when no active sources found", async () => {
      applicantSourceRepository.find.mockResolvedValue([]);

      const result = await service.findActive();

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("findOne", () => {
    it("should return applicant source when found", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(
        mockApplicantSource as any
      );

      const result = await service.findOne("source-1");

      expect(applicantSourceRepository.findOne).toHaveBeenCalledWith({
        where: { id: "source-1" }
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("source-1");
    });

    it("should throw NotFoundException when applicant source not found", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    const updateDto: UpdateApplicantSourceDto = {
      name: "Updated LinkedIn",
      description: "Updated description"
    };

    it("should update applicant source successfully", async () => {
      const updatedSource = { ...mockApplicantSource, ...updateDto };
      applicantSourceRepository.findOne
        .mockResolvedValueOnce(mockApplicantSource as any) // First call for finding existing source
        .mockResolvedValueOnce(updatedSource as any); // Second call for fetching updated source
      applicantSourceRepository.update.mockResolvedValue({
        affected: 1
      } as any);

      const result = await service.update("source-1", updateDto);

      expect(applicantSourceRepository.findOne).toHaveBeenCalledWith({
        where: { id: "source-1" }
      });
      expect(applicantSourceRepository.update).toHaveBeenCalledWith(
        "source-1",
        updateDto
      );
      expect(result).toBeDefined();
      expect(result.name).toBe("Updated LinkedIn");
    });

    it("should throw NotFoundException when applicant source not found", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(null);

      await expect(service.update("nonexistent-id", updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should handle update errors", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(
        mockApplicantSource as any
      );
      applicantSourceRepository.update.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.update("source-1", updateDto)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("remove", () => {
    it("should soft delete applicant source successfully", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(
        mockApplicantSource as any
      );
      applicantSourceRepository.softDelete.mockResolvedValue({
        affected: 1
      } as any);
      applicantSourceRepository.update.mockResolvedValue({
        affected: 1
      } as any);

      await service.remove("source-1", "user-1");

      expect(applicantSourceRepository.findOne).toHaveBeenCalledWith({
        where: { id: "source-1" }
      });
      expect(applicantSourceRepository.softDelete).toHaveBeenCalledWith(
        "source-1"
      );
      expect(applicantSourceRepository.update).toHaveBeenCalledWith(
        "source-1",
        { deletedById: "user-1" }
      );
    });

    it("should throw NotFoundException when applicant source not found", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(null);

      await expect(service.remove("nonexistent-id", "user-1")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should handle deletion errors", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(
        mockApplicantSource as any
      );
      applicantSourceRepository.softDelete.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.remove("source-1", "user-1")).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findAllWithPagination", () => {
    const queryDto: QueryApplicantSourceDto = {
      page: 1,
      limit: 10,
      keyword: "linkedin",
      sort_by: "name",
      order: "ASC",
      isActive: true
    };

    it("should return paginated applicant sources with filters", async () => {
      applicantSourceRepository.findAndCount.mockResolvedValue([
        [mockApplicantSource],
        1
      ]);

      const result = await service.findAllWithPagination(queryDto);

      expect(applicantSourceRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          name: Like("%linkedin%"),
          isActive: true
        },
        skip: 0,
        take: 10,
        order: {
          name: "ASC"
        }
      });
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total_items).toBe(1);
      expect(result.total_pages).toBe(1);
    });

    it("should return paginated sources without filters when not provided", async () => {
      const simpleQueryDto = { page: 1, limit: 10 };
      applicantSourceRepository.findAndCount.mockResolvedValue([
        [mockApplicantSource],
        1
      ]);

      const result = await service.findAllWithPagination(simpleQueryDto);

      expect(applicantSourceRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: {
          createdAt: "DESC"
        }
      });
      expect(result).toBeDefined();
    });

    it("should handle pagination errors", async () => {
      applicantSourceRepository.findAndCount.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.findAllWithPagination(queryDto)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findByCode", () => {
    it("should return applicant source by code", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(
        mockApplicantSource as any
      );

      const result = await service.findByCode("LINKEDIN");

      expect(applicantSourceRepository.findOne).toHaveBeenCalledWith({
        where: { code: "LINKEDIN" }
      });
      expect(result).toBeDefined();
      expect(result.code).toBe("LINKEDIN");
    });

    it("should return null when source not found by code", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(null);

      const result = await service.findByCode("NONEXISTENT");

      expect(result).toBeNull();
    });
  });

  describe("updateSortOrder", () => {
    it("should update sort order successfully", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(
        mockApplicantSource as any
      );
      applicantSourceRepository.update.mockResolvedValue({
        affected: 1
      } as any);

      await service.updateSortOrder("source-1", 2);

      expect(applicantSourceRepository.findOne).toHaveBeenCalledWith({
        where: { id: "source-1" }
      });
      expect(applicantSourceRepository.update).toHaveBeenCalledWith(
        "source-1",
        { sortOrder: 2 }
      );
    });

    it("should throw NotFoundException when source not found", async () => {
      applicantSourceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSortOrder("nonexistent-id", 2)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
