import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { JobCategoryService } from "./job-category.service";
import { JobCategory } from "../entities/job-category.entity";
import { CreateJobCategoryDto } from "../dto/create-job-category.dto";
import { UpdateJobCategoryDto } from "../dto/update-job-category.dto";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";

describe("JobCategoryService", () => {
  let service: JobCategoryService;
  let jobCategoryRepository: jest.Mocked<Repository<JobCategory>>;

  const mockJobCategory = {
    id: "category-1",
    name: "Software Engineering",
    code: "SE",
    description: "Software development and engineering roles",
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
        JobCategoryService,
        {
          provide: getRepositoryToken(JobCategory),
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

    service = module.get<JobCategoryService>(JobCategoryService);
    jobCategoryRepository = module.get(getRepositoryToken(JobCategory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto: CreateJobCategoryDto = {
      name: "Software Engineering",
      code: "SE",
      description: "Software development and engineering roles"
    };

    it("should create a new job category successfully", async () => {
      jobCategoryRepository.findOne.mockResolvedValue(null); // No existing category
      jobCategoryRepository.create.mockReturnValue(mockJobCategory as any);
      jobCategoryRepository.save.mockResolvedValue(mockJobCategory as any);

      const result = await service.create(createDto);

      expect(jobCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { name: "Software Engineering" },
        withDeleted: false
      });
      expect(jobCategoryRepository.create).toHaveBeenCalledWith(createDto);
      expect(jobCategoryRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe("Software Engineering");
    });

    it("should throw ConflictException when category with same name already exists", async () => {
      jobCategoryRepository.findOne.mockResolvedValue(mockJobCategory as any);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      expect(jobCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { name: "Software Engineering" },
        withDeleted: false
      });
    });

    it("should throw ConflictException when category with same code already exists", async () => {
      jobCategoryRepository.findOne
        .mockResolvedValueOnce(null) // No existing category by name
        .mockResolvedValueOnce(mockJobCategory as any); // Existing category by code

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      expect(jobCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { code: "SE" },
        withDeleted: false
      });
    });

    it("should create category without code when not provided", async () => {
      const dtoWithoutCode = {
        name: "Software Engineering",
        description: "Description"
      };
      jobCategoryRepository.findOne.mockResolvedValue(null);
      jobCategoryRepository.create.mockReturnValue(mockJobCategory as any);
      jobCategoryRepository.save.mockResolvedValue(mockJobCategory as any);

      const result = await service.create(dtoWithoutCode);

      expect(jobCategoryRepository.findOne).toHaveBeenCalledTimes(1); // Only name check
      expect(result).toBeDefined();
    });
  });

  describe("findAll", () => {
    const paginationDto: BaseFindAllDto = {
      page: 1,
      limit: 10
    };

    it("should return paginated job categories", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockJobCategory]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      jobCategoryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      const result = await service.findAll(paginationDto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "category.deletedAt IS NULL"
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total_items).toBe(1);
    });

    it("should apply search filter correctly", async () => {
      const searchDto = { ...paginationDto, search: "software" };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockJobCategory]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      jobCategoryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      const result = await service.findAll(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(category.name ILIKE :search OR category.description ILIKE :search)",
        { search: "%software%" }
      );
      expect(result).toBeDefined();
    });
  });

  describe("findOne", () => {
    it("should return job category when found", async () => {
      jobCategoryRepository.findOne.mockResolvedValue(mockJobCategory as any);

      const result = await service.findOne("category-1");

      expect(jobCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: "category-1" }
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("category-1");
    });

    it("should throw NotFoundException when job category not found", async () => {
      jobCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    const updateDto: UpdateJobCategoryDto = {
      name: "Updated Software Engineering",
      description: "Updated description"
    };

    it("should update job category successfully", async () => {
      const updatedCategory = { ...mockJobCategory, ...updateDto };
      jobCategoryRepository.findOne
        .mockResolvedValueOnce(mockJobCategory as any) // First call for finding existing category
        .mockResolvedValueOnce(null); // No conflict with name
      jobCategoryRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update("category-1", updateDto);

      expect(jobCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: "category-1" }
      });
      expect(jobCategoryRepository.update).toHaveBeenCalledWith(
        "category-1",
        updateDto
      );
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException when job category not found", async () => {
      jobCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update("nonexistent-id", updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw ConflictException when updating to existing name", async () => {
      const existingCategory = { ...mockJobCategory, id: "category-2" };
      jobCategoryRepository.findOne
        .mockResolvedValueOnce(mockJobCategory as any) // First call for finding existing category
        .mockResolvedValueOnce(existingCategory as any); // Conflict with name

      await expect(service.update("category-1", updateDto)).rejects.toThrow(
        ConflictException
      );
    });

    it("should throw ConflictException when updating to existing code", async () => {
      const updateWithCode = { ...updateDto, code: "SE" };
      const existingCategory = {
        ...mockJobCategory,
        id: "category-2",
        code: "SE"
      };
      jobCategoryRepository.findOne
        .mockResolvedValueOnce(mockJobCategory as any) // First call for finding existing category
        .mockResolvedValueOnce(null) // No conflict with name
        .mockResolvedValueOnce(existingCategory as any); // Conflict with code

      await expect(
        service.update("category-1", updateWithCode)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("remove", () => {
    it("should soft delete job category successfully", async () => {
      jobCategoryRepository.findOne.mockResolvedValue(mockJobCategory as any);
      jobCategoryRepository.softDelete.mockResolvedValue({
        affected: 1
      } as any);
      jobCategoryRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove("category-1", "user-1");

      expect(jobCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: "category-1" }
      });
      expect(jobCategoryRepository.softDelete).toHaveBeenCalledWith(
        "category-1"
      );
      expect(jobCategoryRepository.update).toHaveBeenCalledWith("category-1", {
        deletedById: "user-1"
      });
    });

    it("should throw NotFoundException when job category not found", async () => {
      jobCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.remove("nonexistent-id", "user-1")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findActive", () => {
    it("should return all active job categories", async () => {
      const activeCategories = [mockJobCategory];
      jobCategoryRepository.find.mockResolvedValue(activeCategories as any);

      const result = await service.findActive();

      expect(jobCategoryRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Software Engineering");
    });

    it("should return empty array when no active categories found", async () => {
      jobCategoryRepository.find.mockResolvedValue([]);

      const result = await service.findActive();

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("getCategoryStats", () => {
    it("should return category statistics", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockJobCategory])
      };
      jobCategoryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      const result = await service.getCategoryStats();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "category.deletedAt IS NULL"
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "category.isActive = :isActive",
        { isActive: true }
      );
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });
  });
});
