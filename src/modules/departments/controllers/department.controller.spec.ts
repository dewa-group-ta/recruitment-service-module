import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  ConflictException,
  NotFoundException
} from "@nestjs/common";
import { DepartmentController } from "./department.controller";
import { DepartmentService } from "../services/department.service";
import { CreateDepartmentDto } from "../dto/create-department.dto";
import { UpdateDepartmentDto } from "../dto/update-department.dto";
import { DepartmentResponseDto } from "../dto/department-response.dto";
import { QueryDepartmentDto } from "../dto/query-department.dto";
import { AuthenticatedRequest } from "../../../shared/interface";

describe("DepartmentController", () => {
  let controller: DepartmentController;
  let departmentService: jest.Mocked<DepartmentService>;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User"
  };

  const mockRequest: AuthenticatedRequest = {
    user: mockUser
  } as any;

  const mockDepartmentResponse: DepartmentResponseDto = {
    id: "dept-1",
    name: "Engineering",
    code: "ENG",
    description: "Software engineering department",
    isActive: true,
    createdById: "user-1",
    updatedById: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    deletedById: undefined
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [
        {
          provide: DepartmentService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            restore: jest.fn(),
            findActive: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<DepartmentController>(DepartmentController);
    departmentService = module.get(DepartmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto: CreateDepartmentDto = {
      name: "Engineering",
      code: "ENG",
      description: "Software engineering department",
      isActive: true
    };

    it("should create a new department successfully", async () => {
      // Arrange
      departmentService.create.mockResolvedValue(mockDepartmentResponse);

      // Act
      const result = await controller.create(createDto, mockRequest);

      // Assert
      expect(departmentService.create).toHaveBeenCalledWith({
        ...createDto,
        createdById: "user-1"
      });
      expect(result).toBeDefined();
      expect(result.name).toBe("Engineering");
    });

    it("should throw BadRequestException when user not authenticated", async () => {
      // Arrange
      const requestWithoutUser = {} as AuthenticatedRequest;

      // Act & Assert
      await expect(
        controller.create(createDto, requestWithoutUser)
      ).rejects.toThrow(BadRequestException);
      expect(departmentService.create).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when department with same name exists", async () => {
      // Arrange
      departmentService.create.mockRejectedValue(
        new ConflictException("Department with same name already exists")
      );

      // Act & Assert
      await expect(controller.create(createDto, mockRequest)).rejects.toThrow(
        ConflictException
      );
    });

    it("should throw BadRequestException when creation fails", async () => {
      // Arrange
      departmentService.create.mockRejectedValue(
        new BadRequestException("Creation failed")
      );

      // Act & Assert
      await expect(controller.create(createDto, mockRequest)).rejects.toThrow(
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

    it("should return paginated departments", async () => {
      // Arrange
      const mockPaginatedResponse = {
        data: [mockDepartmentResponse],
        page: 1,
        limit: 10,
        total_items: 1,
        total_pages: 1
      };
      departmentService.findAll.mockResolvedValue(mockPaginatedResponse);

      // Act
      const result = await controller.findAll(queryDto);

      // Assert
      expect(departmentService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total_items).toBe(1);
    });

    it("should return departments with default query parameters", async () => {
      // Arrange
      const defaultQueryDto = { page: 1, limit: 10 };
      const mockPaginatedResponse = {
        data: [mockDepartmentResponse],
        page: 1,
        limit: 10,
        total_items: 1,
        total_pages: 1
      };
      departmentService.findAll.mockResolvedValue(mockPaginatedResponse);

      // Act
      const result = await controller.findAll(defaultQueryDto);

      // Assert
      expect(departmentService.findAll).toHaveBeenCalledWith(defaultQueryDto);
      expect(result).toBeDefined();
    });
  });

  describe("findActive", () => {
    it("should return all active departments", async () => {
      // Arrange
      const activeDepartments = [mockDepartmentResponse];
      departmentService.findActive.mockResolvedValue(activeDepartments);

      // Act
      const result = await controller.findActive();

      // Assert
      expect(departmentService.findActive).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it("should return empty array when no active departments found", async () => {
      // Arrange
      departmentService.findActive.mockResolvedValue([]);

      // Act
      const result = await controller.findActive();

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe("findOne", () => {
    it("should return department when found", async () => {
      // Arrange
      departmentService.findOne.mockResolvedValue(mockDepartmentResponse);

      // Act
      const result = await controller.findOne("dept-1");

      // Assert
      expect(departmentService.findOne).toHaveBeenCalledWith("dept-1");
      expect(result).toBeDefined();
      expect(result.id).toBe("dept-1");
    });

    it("should throw NotFoundException when department not found", async () => {
      // Arrange
      departmentService.findOne.mockRejectedValue(
        new NotFoundException("Department not found")
      );

      // Act & Assert
      await expect(controller.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    const updateDto: UpdateDepartmentDto = {
      name: "Updated Engineering",
      description: "Updated description"
    };

    it("should update department successfully", async () => {
      // Arrange
      const updatedDepartment = { ...mockDepartmentResponse, ...updateDto };
      departmentService.update.mockResolvedValue(updatedDepartment);

      // Act
      const result = await controller.update("dept-1", updateDto);

      // Assert
      expect(departmentService.update).toHaveBeenCalledWith(
        "dept-1",
        updateDto
      );
      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Engineering");
    });

    it("should throw NotFoundException when department not found", async () => {
      // Arrange
      departmentService.update.mockRejectedValue(
        new NotFoundException("Department not found")
      );

      // Act & Assert
      await expect(
        controller.update("nonexistent-id", updateDto)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException when updating to existing name", async () => {
      // Arrange
      departmentService.update.mockRejectedValue(
        new ConflictException("Department with same name already exists")
      );

      // Act & Assert
      await expect(controller.update("dept-1", updateDto)).rejects.toThrow(
        ConflictException
      );
    });

    it("should throw BadRequestException when update fails", async () => {
      // Arrange
      departmentService.update.mockRejectedValue(
        new BadRequestException("Update failed")
      );

      // Act & Assert
      await expect(controller.update("dept-1", updateDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("remove", () => {
    it("should delete department successfully", async () => {
      // Arrange
      const deleteResponse = { message: "Department deleted successfully" };
      departmentService.remove.mockResolvedValue(deleteResponse);

      // Act
      const result = await controller.remove("dept-1", mockRequest);

      // Assert
      expect(departmentService.remove).toHaveBeenCalledWith("dept-1", "user-1");
      expect(result).toBeDefined();
      expect(result.message).toBe("Department deleted successfully");
    });

    it("should throw NotFoundException when department not found", async () => {
      // Arrange
      departmentService.remove.mockRejectedValue(
        new NotFoundException("Department not found")
      );

      // Act & Assert
      await expect(
        controller.remove("nonexistent-id", mockRequest)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when deletion fails", async () => {
      // Arrange
      departmentService.remove.mockRejectedValue(
        new BadRequestException("Deletion failed")
      );

      // Act & Assert
      await expect(controller.remove("dept-1", mockRequest)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("restore", () => {
    it("should restore department successfully", async () => {
      // Arrange
      departmentService.restore.mockResolvedValue(mockDepartmentResponse);

      // Act
      const result = await controller.restore("dept-1");

      // Assert
      expect(departmentService.restore).toHaveBeenCalledWith("dept-1");
      expect(result).toBeDefined();
      expect(result.id).toBe("dept-1");
    });

    it("should throw NotFoundException when department not found", async () => {
      // Arrange
      departmentService.restore.mockRejectedValue(
        new NotFoundException("Department not found")
      );

      // Act & Assert
      await expect(controller.restore("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException when department is not deleted", async () => {
      // Arrange
      departmentService.restore.mockRejectedValue(
        new BadRequestException("Department is not deleted")
      );

      // Act & Assert
      await expect(controller.restore("dept-1")).rejects.toThrow(
        BadRequestException
      );
    });

    it("should throw BadRequestException when restore fails", async () => {
      // Arrange
      departmentService.restore.mockRejectedValue(
        new BadRequestException("Restore failed")
      );

      // Act & Assert
      await expect(controller.restore("dept-1")).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
