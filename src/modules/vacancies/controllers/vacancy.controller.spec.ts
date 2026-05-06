import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { VacancyController } from "./vacancy.controller";
import { VacancyService } from "../services/vacancy.service";
import { FileUploadService } from "../../../shared/services/file-upload.service";
import {
  JobStatus,
  EmploymentType,
  WorkModel,
  JobType,
  SalaryPeriod,
  EducationLevel
} from "../../../shared/enums/job-status.enum";
import { CreateVacancyDto } from "../dto/create-vacancy.dto";
import { UpdateVacancyDto } from "../dto/update-vacancy.dto";
import { VacancyResponseDto } from "../dto/vacancy-response.dto";
import { AuthenticatedRequest } from "../../../shared/interface";
import { FileType } from "../../../shared/entities/file.entity";

describe("VacancyController", () => {
  let controller: VacancyController;
  let vacancyService: jest.Mocked<VacancyService>;
  let fileUploadService: jest.Mocked<FileUploadService>;

  const mockVacancyResponse: VacancyResponseDto = {
    id: "vacancy-1",
    title: "Software Engineer",
    jobCode: "SE001",
    description: "Software development role",
    responsibilities: "Develop software",
    requirements: "Bachelor degree",
    status: JobStatus.DRAFT,
    jobType: JobType.RECRUITMENT,
    employmentType: EmploymentType.FULL_TIME,
    workModel: WorkModel.ON_SITE,
    startDate: new Date(),
    endDate: new Date(),
    isLimitApplicantEnabled: false,
    applicantLimit: 0,
    isLimitHiredEnabled: false,
    hiredLimit: 0,
    officeAddresses: [],
    department: "Engineering",
    departmentId: "dept-1",
    salaryMin: 5000,
    salaryMax: 8000,
    salaryPeriod: SalaryPeriod.MONTHLY,
    currency: "IDR",
    jobCategoryId: "cat-1",
    requiredEducation: EducationLevel.BACHELOR,
    requiredExperienceYears: 2,
    hoursPerWeekMin: 40,
    hoursPerWeekMax: 40,
    pipelineId: "pipeline-1",
    createdById: "user-1",
    updatedById: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    generatedPosterUrl: "",
    posterConfiguration: null as any,
    applicationDeadline: new Date(),
    expectedStartDate: new Date(),
    publishedAt: new Date(),
    archivedAt: new Date(),
    closedAt: new Date()
  };

  const mockRequest: AuthenticatedRequest = {
    user: { id: "user-1", email: "test@example.com" }
  } as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VacancyController],
      providers: [
        {
          provide: VacancyService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            remove: jest.fn()
          }
        },
        {
          provide: FileUploadService,
          useValue: {
            uploadFile: jest.fn(),
            getFileById: jest.fn(),
            deleteFile: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<VacancyController>(VacancyController);
    vacancyService = module.get(VacancyService);
    fileUploadService = module.get(FileUploadService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new vacancy", async () => {
      // Arrange
      const createVacancyDto: CreateVacancyDto = {
        title: "Software Engineer"
      };

      vacancyService.create.mockResolvedValue(mockVacancyResponse);

      // Act
      const result = await controller.create(createVacancyDto, mockRequest);

      // Assert
      expect(vacancyService.create).toHaveBeenCalledWith(
        createVacancyDto,
        "user-1"
      );
      expect(result).toEqual(mockVacancyResponse);
    });

    it("should throw BadRequestException when creation fails", async () => {
      // Arrange
      const createVacancyDto: CreateVacancyDto = {} as CreateVacancyDto;
      vacancyService.create.mockRejectedValue(
        new BadRequestException("Invalid data")
      );

      // Act & Assert
      await expect(
        controller.create(createVacancyDto, mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("update", () => {
    it("should update vacancy successfully", async () => {
      // Arrange
      const updateVacancyDto: UpdateVacancyDto = {
        title: "Updated Software Engineer"
      };

      vacancyService.update.mockResolvedValue(mockVacancyResponse);

      // Act
      const result = await controller.update(
        "vacancy-1",
        updateVacancyDto,
        mockRequest
      );

      // Assert
      expect(vacancyService.update).toHaveBeenCalledWith(
        "vacancy-1",
        updateVacancyDto,
        "user-1"
      );
      expect(result).toEqual(mockVacancyResponse);
    });

    it("should throw NotFoundException when vacancy not found", async () => {
      // Arrange
      const updateVacancyDto: UpdateVacancyDto = {};
      vacancyService.update.mockRejectedValue(
        new NotFoundException("Vacancy not found")
      );

      // Act & Assert
      await expect(
        controller.update("nonexistent-id", updateVacancyDto, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findOne", () => {
    it("should return vacancy when found", async () => {
      // Arrange
      vacancyService.findOne.mockResolvedValue(mockVacancyResponse);

      // Act
      const result = await controller.findOne("vacancy-1");

      // Assert
      expect(vacancyService.findOne).toHaveBeenCalledWith("vacancy-1");
      expect(result).toEqual(mockVacancyResponse);
    });

    it("should throw NotFoundException when vacancy not found", async () => {
      // Arrange
      vacancyService.findOne.mockRejectedValue(
        new NotFoundException("Vacancy not found")
      );

      // Act & Assert
      await expect(controller.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated vacancies with filters", async () => {
      // Arrange
      const mockPaginatedResponse = {
        data: [
          {
            ...mockVacancyResponse,
            totalApplicants: 5,
            hiredApplicants: 1,
            rejectedApplicants: 2
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      vacancyService.findAll.mockResolvedValue(mockPaginatedResponse);

      // Act
      const result = await controller.findAll(
        1,
        10,
        "cat-1",
        "PUBLISHED",
        "engineer"
      );

      // Assert
      expect(vacancyService.findAll).toHaveBeenCalledWith(
        1,
        10,
        "cat-1",
        "PUBLISHED",
        "engineer"
      );
      expect(result.data).toEqual(mockPaginatedResponse.data);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      });
    });

    it("should return paginated vacancies with default parameters", async () => {
      // Arrange
      const mockPaginatedResponse = {
        data: [
          {
            ...mockVacancyResponse,
            totalApplicants: 3,
            hiredApplicants: 0,
            rejectedApplicants: 1
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      vacancyService.findAll.mockResolvedValue(mockPaginatedResponse);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(vacancyService.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
        undefined
      );
      expect(result.data).toEqual(mockPaginatedResponse.data);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      });
    });
  });

  describe("remove", () => {
    it("should soft delete vacancy successfully", async () => {
      // Arrange
      vacancyService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove("vacancy-1", mockRequest);

      // Assert
      expect(vacancyService.remove).toHaveBeenCalledWith("vacancy-1", "user-1");
    });

    it("should throw NotFoundException when vacancy not found", async () => {
      // Arrange
      vacancyService.remove.mockRejectedValue(
        new NotFoundException("Vacancy not found")
      );

      // Act & Assert
      await expect(
        controller.remove("nonexistent-id", mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // Note: File upload methods are not implemented in the service yet
  // These tests are commented out until the service methods are implemented
});
