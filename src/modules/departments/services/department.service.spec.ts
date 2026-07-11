import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import {
  ConflictException,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import { DepartmentService } from "./department.service";
import { Department } from "../entities/department.entity";
import { CreateDepartmentDto } from "../dto/create-department.dto";
import { UpdateDepartmentDto } from "../dto/update-department.dto";
import { QueryDepartmentDto } from "../dto/query-department.dto";

describe("DepartmentService", () => {
  let service: DepartmentService;
  let departmentRepository: jest.Mocked<Repository<Department>>;

  const mockDepartment = {
    id: "dept-1",
    name: "Engineering",
    code: "ENG",
    description: "Software engineering department",
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
        DepartmentService,
        {
          provide: getRepositoryToken(Department),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            query: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
    departmentRepository = module.get(getRepositoryToken(Department));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDepartmentDto: CreateDepartmentDto = {
      name: "Engineering",
      code: "ENG",
      description: "Software engineering department",
      isActive: true
    };

    it("should create a new department successfully", async () => {
      departmentRepository.findOne.mockResolvedValue(null); // No existing department
      departmentRepository.create.mockReturnValue(mockDepartment as any);
      departmentRepository.save.mockResolvedValue(mockDepartment as any);

      const result = await service.create(createDepartmentDto);

      expect(departmentRepository.findOne).toHaveBeenCalledWith({
        where: { name: "Engineering", deletedAt: IsNull() }
      });
      expect(departmentRepository.create).toHaveBeenCalledWith(
        createDepartmentDto
      );
      expect(departmentRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe("Engineering");
    });

    it("should throw ConflictException when department with same name already exists", async () => {
      departmentRepository.findOne.mockResolvedValue(mockDepartment as any);

      await expect(service.create(createDepartmentDto)).rejects.toThrow(
        ConflictException
      );
      expect(departmentRepository.findOne).toHaveBeenCalledWith({
        where: { name: "Engineering", deletedAt: IsNull() }
      });
    });

    it("should throw ConflictException when department with same code already exists", async () => {
      const dtoWithCode = { ...createDepartmentDto, code: "ENG" };
      departmentRepository.findOne
        .mockResolvedValueOnce(null) // No existing department by name
        .mockResolvedValueOnce(mockDepartment as any); // Existing department by code

      await expect(service.create(dtoWithCode)).rejects.toThrow(
        ConflictException
      );
      expect(departmentRepository.findOne).toHaveBeenCalledWith({
        where: { code: "ENG", deletedAt: IsNull() }
      });
    });

    it("should throw BadRequestException when creation fails", async () => {
      departmentRepository.findOne.mockResolvedValue(null);
      departmentRepository.create.mockReturnValue(mockDepartment as any);
      departmentRepository.save.mockRejectedValue(new Error("Database error"));

      await expect(service.create(createDepartmentDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("findAll", () => {
    const queryDto: QueryDepartmentDto = {
      page: 1,
      limit: 10,
      keyword: "engineering",
      sort_by: "name",
      order: "ASC",
      isActive: true
    };

    it("should return paginated departments with filters", async () => {
      departmentRepository.findAndCount.mockResolvedValue([
        [mockDepartment],
        1
      ]);

      const result = await service.findAll(queryDto);

      expect(departmentRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          deletedAt: IsNull(),
          name: expect.any(Object), // Like pattern
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

    it("should return departments without filters when not provided", async () => {
      const simpleQueryDto = { page: 1, limit: 10 };
      departmentRepository.findAndCount.mockResolvedValue([
        [mockDepartment],
        1
      ]);

      const result = await service.findAll(simpleQueryDto);

      expect(departmentRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          deletedAt: IsNull()
        },
        skip: 0,
        take: 10,
        order: {
          createdAt: "DESC"
        }
      });
      expect(result).toBeDefined();
    });
  });

  describe("findOne", () => {
    it("should return department when found", async () => {
      departmentRepository.findOne.mockResolvedValue(mockDepartment as any);

      const result = await service.findOne("dept-1");

      expect(departmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: "dept-1", deletedAt: IsNull() }
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("dept-1");
      expect(result.name).toBe("Engineering");
    });

    it("should throw NotFoundException when department not found", async () => {
      departmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    const updateDepartmentDto: UpdateDepartmentDto = {
      name: "Software Engineering",
      description: "Updated description"
    };

    it("should update department successfully", async () => {
      const updatedDepartment = { ...mockDepartment, ...updateDepartmentDto };
      departmentRepository.findOne
        .mockResolvedValueOnce(mockDepartment as any) // First call for finding existing department
        .mockResolvedValueOnce(null); // No conflict with name
      departmentRepository.save.mockResolvedValue(updatedDepartment as any);

      const result = await service.update("dept-1", updateDepartmentDto);

      expect(departmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: "dept-1", deletedAt: IsNull() }
      });
      expect(departmentRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe("Software Engineering");
    });

    it("should throw NotFoundException when department not found", async () => {
      departmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update("nonexistent-id", updateDepartmentDto)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException when updating to existing name", async () => {
      const existingDepartment = { ...mockDepartment, id: "dept-2" };
      departmentRepository.findOne
        .mockResolvedValueOnce(mockDepartment as any) // First call for finding existing department
        .mockResolvedValueOnce(existingDepartment as any); // Conflict with name

      await expect(
        service.update("dept-1", updateDepartmentDto)
      ).rejects.toThrow(ConflictException);
    });

    it("should throw ConflictException when updating to existing code", async () => {
      const updateWithCode = { ...updateDepartmentDto, code: "SE" };
      const existingDepartment = {
        ...mockDepartment,
        id: "dept-2",
        code: "SE"
      };
      departmentRepository.findOne
        .mockResolvedValueOnce(mockDepartment as any) // First call for finding existing department
        .mockResolvedValueOnce(null) // No conflict with name
        .mockResolvedValueOnce(existingDepartment as any); // Conflict with code

      await expect(service.update("dept-1", updateWithCode)).rejects.toThrow(
        ConflictException
      );
    });

    it("should throw BadRequestException when update fails", async () => {
      departmentRepository.findOne.mockResolvedValue(mockDepartment as any);
      departmentRepository.save.mockRejectedValue(new Error("Database error"));

      await expect(
        service.update("dept-1", updateDepartmentDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("remove", () => {
    it("should soft delete department successfully", async () => {
      departmentRepository.findOne.mockResolvedValue(mockDepartment as any);
      departmentRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove("dept-1", "user-1");

      expect(departmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: "dept-1", deletedAt: IsNull() }
      });
      expect(departmentRepository.update).toHaveBeenCalledWith("dept-1", {
        deletedAt: expect.any(Date),
        deletedById: "user-1"
      });
      expect(result).toBeDefined();
      expect(result.message).toBe("Department deleted successfully");
    });

    it("should throw NotFoundException when department not found", async () => {
      departmentRepository.findOne.mockResolvedValue(null);

      await expect(service.remove("nonexistent-id", "user-1")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException when deletion fails", async () => {
      departmentRepository.findOne.mockResolvedValue(mockDepartment as any);
      departmentRepository.update.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.remove("dept-1", "user-1")).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("restore", () => {
    const deletedDepartment = {
      ...mockDepartment,
      deletedAt: new Date(),
      deletedById: "user-1"
    };

    it("should restore soft deleted department successfully", async () => {
      departmentRepository.findOne
        .mockResolvedValueOnce(deletedDepartment as any) // First call with deleted department
        .mockResolvedValueOnce(mockDepartment as any); // Second call after restore
      departmentRepository.query.mockResolvedValue({ affected: 1 } as any);

      const result = await service.restore("dept-1");

      expect(departmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: "dept-1" },
        withDeleted: true
      });
      expect(departmentRepository.query).toHaveBeenCalledWith(
        "UPDATE departments SET deleted_at = NULL, deleted_by = NULL WHERE id = $1",
        ["dept-1"]
      );
      expect(result).toBeDefined();
      expect(result.id).toBe("dept-1");
    });

    it("should throw NotFoundException when department not found", async () => {
      departmentRepository.findOne.mockResolvedValue(null);

      await expect(service.restore("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException when department is not deleted", async () => {
      departmentRepository.findOne.mockResolvedValue(mockDepartment as any);

      await expect(service.restore("dept-1")).rejects.toThrow(
        BadRequestException
      );
    });

    it("should throw NotFoundException when department not found after restore", async () => {
      departmentRepository.findOne
        .mockResolvedValueOnce(deletedDepartment as any) // First call with deleted department
        .mockResolvedValueOnce(null); // Second call after restore returns null
      departmentRepository.query.mockResolvedValue({ affected: 1 } as any);

      await expect(service.restore("dept-1")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException when restore fails", async () => {
      departmentRepository.findOne.mockResolvedValue(deletedDepartment as any);
      departmentRepository.query.mockRejectedValue(new Error("Database error"));

      await expect(service.restore("dept-1")).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("findActive", () => {
    it("should return all active departments", async () => {
      const activeDepartments = [mockDepartment];
      departmentRepository.find.mockResolvedValue(activeDepartments as any);

      const result = await service.findActive();

      expect(departmentRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: IsNull() },
        order: { name: "ASC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Engineering");
    });

    it("should return empty array when no active departments found", async () => {
      departmentRepository.find.mockResolvedValue([]);

      const result = await service.findActive();

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });
});
