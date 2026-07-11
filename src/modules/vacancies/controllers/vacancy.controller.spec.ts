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
      const createVacancyDto: CreateVacancyDto = {
        title: "Software Engineer"
      };

      vacancyService.create.mockResolvedValue(mockVacancyResponse);

      const result = await controller.create(createVacancyDto, mockRequest);

      expect(vacancyService.create).toHaveBeenCalledWith(
        createVacancyDto,
        "user-1"
      );
      expect(result).toEqual(mockVacancyResponse);
    });

    it("should throw BadRequestException when creation fails", async () => {
      const createVacancyDto: CreateVacancyDto = {} as CreateVacancyDto;
      vacancyService.create.mockRejectedValue(
        new BadRequestException("Invalid data")
      );

      await expect(
        controller.create(createVacancyDto, mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("update", () => {
    it("should update vacancy successfully", async () => {
      const updateVacancyDto: UpdateVacancyDto = {
        title: "Updated Software Engineer"
      };

      vacancyService.update.mockResolvedValue(mockVacancyResponse);

      const result = await controller.update(
        "vacancy-1",
        updateVacancyDto,
        mockRequest
      );

      expect(vacancyService.update).toHaveBeenCalledWith(
        "vacancy-1",
        updateVacancyDto,
        "user-1"
      );
      expect(result).toEqual(mockVacancyResponse);
    });

    it("should throw NotFoundException when vacancy not found", async () => {
      const updateVacancyDto: UpdateVacancyDto = {};
      vacancyService.update.mockRejectedValue(
        new NotFoundException("Vacancy not found")
      );

      await expect(
        controller.update("nonexistent-id", updateVacancyDto, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findOne", () => {
    it("should return vacancy when found", async () => {
      vacancyService.findOne.mockResolvedValue(mockVacancyResponse);

      const result = await controller.findOne("vacancy-1");

      expect(vacancyService.findOne).toHaveBeenCalledWith("vacancy-1");
      expect(result).toEqual(mockVacancyResponse);
    });

    it("should throw NotFoundException when vacancy not found", async () => {
      vacancyService.findOne.mockRejectedValue(
        new NotFoundException("Vacancy not found")
      );

      await expect(controller.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated vacancies with filters", async () => {
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

      const result = await controller.findAll(
        1,
        10,
        "cat-1",
        "PUBLISHED",
        "engineer"
      );

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

      const result = await controller.findAll();

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
      vacancyService.remove.mockResolvedValue(undefined);

      await controller.remove("vacancy-1", mockRequest);

      expect(vacancyService.remove).toHaveBeenCalledWith("vacancy-1", "user-1");
    });

    it("should throw NotFoundException when vacancy not found", async () => {
      vacancyService.remove.mockRejectedValue(
        new NotFoundException("Vacancy not found")
      );

      await expect(
        controller.remove("nonexistent-id", mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // catatan: method upload file belum diimplementasikan di service, jadi test-nya belum ditulis
});
