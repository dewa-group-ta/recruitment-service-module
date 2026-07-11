import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { VacancyService } from "./vacancy.service";
import { Vacancy } from "../entities/vacancy.entity";
import { Application } from "../../applicants/entities/application.entity";
import { RecruitmentPipelineService } from "./recruitment-pipeline.service";
import { CreateVacancyDto } from "../dto/create-vacancy.dto";
import { UpdateVacancyDto } from "../dto/update-vacancy.dto";
import {
  JobStatus,
  EmploymentType,
  WorkModel,
  JobType,
  SalaryPeriod,
  EducationLevel
} from "../../../shared/enums/job-status.enum";

describe("VacancyService", () => {
  let service: VacancyService;
  let vacancyRepository: jest.Mocked<Repository<Vacancy>>;
  let applicationRepository: jest.Mocked<Repository<Application>>;
  let recruitmentPipelineService: jest.Mocked<RecruitmentPipelineService>;

  const mockDefaultTemplate = {
    id: "template-1",
    name: "Default Template",
    description: "Default recruitment template",
    version: "1.0",
    isDefault: true,
    isTemplate: true,
    category: "general",
    usageCount: 0,
    createdById: "user-1",
    stages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined
  };

  const mockPipelineInstanceDto = {
    id: "pipeline-1",
    name: "Software Engineer - Pipeline",
    description: "Pipeline for software engineer positions",
    version: "1.0",
    isDefault: false,
    isTemplate: false,
    category: "engineering",
    usageCount: 0,
    createdById: "user-1",
    stages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined
  };

  const mockPipelineInstance = {
    id: "pipeline-1",
    name: "Software Engineer - Pipeline",
    description: "Pipeline for software engineer positions",
    version: "1.0",
    isDefault: false,
    isTemplate: false,
    category: "engineering",
    usageCount: 0,
    createdById: "user-1",
    stages: [],
    vacancies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date()
  };

  const mockVacancy = {
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
    department: { id: "dept-1", name: "Engineering" } as any,
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
    deletedAt: new Date(),
    deletedById: "",
    generatedPosterUrl: "",
    posterConfiguration: null as any,
    jobCategory: { id: "cat-1", name: "Technology" } as any,
    applications: [],
    pipeline: mockPipelineInstance
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacancyService,
        {
          provide: getRepositoryToken(Vacancy),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
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
        },
        {
          provide: getRepositoryToken(Application),
          useValue: {
            count: jest.fn()
          }
        },
        {
          provide: RecruitmentPipelineService,
          useValue: {
            getDefaultTemplate: jest.fn(),
            createFromTemplate: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<VacancyService>(VacancyService);
    vacancyRepository = module.get(getRepositoryToken(Vacancy));
    applicationRepository = module.get(getRepositoryToken(Application));
    recruitmentPipelineService = module.get(RecruitmentPipelineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createVacancyDto: CreateVacancyDto = {
      title: "Software Engineer"
    };

    it("should create a new vacancy successfully", async () => {
      recruitmentPipelineService.getDefaultTemplate.mockResolvedValue(
        mockDefaultTemplate
      );
      recruitmentPipelineService.createFromTemplate.mockResolvedValue(
        mockPipelineInstanceDto
      );
      vacancyRepository.create.mockReturnValue(mockVacancy as any);
      vacancyRepository.save.mockResolvedValue(mockVacancy as any);

      const result = await service.create(createVacancyDto, "user-1");

      expect(recruitmentPipelineService.getDefaultTemplate).toHaveBeenCalled();
      expect(
        recruitmentPipelineService.createFromTemplate
      ).toHaveBeenCalledWith(
        "template-1",
        "user-1",
        "Software Engineer - Pipeline"
      );
      expect(vacancyRepository.create).toHaveBeenCalledWith({
        title: "Software Engineer",
        status: JobStatus.DRAFT,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.ON_SITE,
        currency: "IDR",
        pipelineId: "pipeline-1",
        createdById: "user-1"
      });
      expect(vacancyRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.title).toBe("Software Engineer");
    });

    it("should throw BadRequestException when no default template is found", async () => {
      recruitmentPipelineService.getDefaultTemplate.mockResolvedValue(null);

      await expect(service.create(createVacancyDto, "user-1")).rejects.toThrow(
        BadRequestException
      );
      expect(recruitmentPipelineService.getDefaultTemplate).toHaveBeenCalled();
      expect(
        recruitmentPipelineService.createFromTemplate
      ).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when pipeline creation fails", async () => {
      recruitmentPipelineService.getDefaultTemplate.mockResolvedValue(
        mockDefaultTemplate
      );
      recruitmentPipelineService.createFromTemplate.mockRejectedValue(
        new Error("Pipeline creation failed")
      );

      await expect(service.create(createVacancyDto, "user-1")).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("update", () => {
    const updateVacancyDto: UpdateVacancyDto = {
      title: "Senior Software Engineer",
      description: "Updated description"
    };

    it("should update vacancy successfully", async () => {
      vacancyRepository.findOne
        .mockResolvedValueOnce(mockVacancy as any) // First call for finding existing vacancy
        .mockResolvedValueOnce({ ...mockVacancy, ...updateVacancyDto } as any); // Second call for fetching updated vacancy
      vacancyRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update(
        "vacancy-1",
        updateVacancyDto,
        "user-1"
      );

      expect(vacancyRepository.findOne).toHaveBeenCalledWith({
        where: { id: "vacancy-1" }
      });
      expect(vacancyRepository.update).toHaveBeenCalledWith(
        "vacancy-1",
        expect.objectContaining({
          title: "Senior Software Engineer",
          description: "Updated description",
          updatedById: "user-1"
        })
      );
      expect(result).toBeDefined();
      expect(result.title).toBe("Senior Software Engineer");
    });

    it("should throw NotFoundException when vacancy not found", async () => {
      vacancyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update("nonexistent-id", updateVacancyDto, "user-1")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException for invalid pipeline ID format", async () => {
      const invalidUpdateDto = {
        ...updateVacancyDto,
        pipelineId: "invalid-uuid"
      };
      vacancyRepository.findOne.mockResolvedValue(mockVacancy as any);

      await expect(
        service.update("vacancy-1", invalidUpdateDto, "user-1")
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when minimum salary is greater than maximum salary", async () => {
      const invalidSalaryDto = {
        ...updateVacancyDto,
        salaryMin: 10000,
        salaryMax: 5000
      };
      vacancyRepository.findOne.mockResolvedValue(mockVacancy as any);

      await expect(
        service.update("vacancy-1", invalidSalaryDto, "user-1")
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findOne", () => {
    it("should return vacancy when found", async () => {
      vacancyRepository.findOne.mockResolvedValue(mockVacancy as any);

      const result = await service.findOne("vacancy-1");

      expect(vacancyRepository.findOne).toHaveBeenCalledWith({
        where: { id: "vacancy-1" },
        relations: ["pipeline", "jobCategory"]
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("vacancy-1");
    });

    it("should throw NotFoundException when vacancy not found", async () => {
      vacancyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated vacancies with applicant counts", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockVacancy]),
        getCount: jest.fn().mockResolvedValue(1)
      };
      vacancyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );
      applicationRepository.count
        .mockResolvedValueOnce(5) // Total applicants
        .mockResolvedValueOnce(2); // Rejected applicants

      const result = await service.findAll(1, 10);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].totalApplicants).toBe(5);
      expect(result.data[0].hiredApplicants).toBe(3); // 5 - 2
      expect(result.data[0].rejectedApplicants).toBe(2);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should apply filters correctly", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0)
      };
      vacancyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      await service.findAll(1, 10, "cat-1", JobStatus.PUBLISHED, "engineer");

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "vacancy.jobCategoryId = :jobCategory",
        { jobCategory: "cat-1" }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "vacancy.status = :status",
        { status: JobStatus.PUBLISHED }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(vacancy.title ILIKE :search OR vacancy.description ILIKE :search OR vacancy.department ILIKE :search)",
        { search: "%engineer%" }
      );
    });
  });

  describe("remove", () => {
    it("should soft delete vacancy successfully", async () => {
      vacancyRepository.findOne.mockResolvedValue(mockVacancy as any);
      vacancyRepository.softDelete.mockResolvedValue({ affected: 1 } as any);
      vacancyRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove("vacancy-1", "user-1");

      expect(vacancyRepository.findOne).toHaveBeenCalledWith({
        where: { id: "vacancy-1" }
      });
      expect(vacancyRepository.softDelete).toHaveBeenCalledWith("vacancy-1");
      expect(vacancyRepository.update).toHaveBeenCalledWith("vacancy-1", {
        deletedById: "user-1"
      });
    });

    it("should throw NotFoundException when vacancy not found", async () => {
      vacancyRepository.findOne.mockResolvedValue(null);

      await expect(service.remove("nonexistent-id", "user-1")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findAllPublic", () => {
    it("should return public vacancies with PUBLISHED status only", async () => {
      const publishedVacancy = { ...mockVacancy, status: JobStatus.PUBLISHED };
      vacancyRepository.findAndCount.mockResolvedValue([[publishedVacancy], 1]);

      const result = await service.findAllPublic(1, 10);

      expect(vacancyRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          status: JobStatus.PUBLISHED,
          endDate: expect.any(Object) // MoreThan(new Date())
        },
        skip: 0,
        take: 10,
        order: { createdAt: "DESC" },
        relations: ["jobCategory"]
      });
      expect(result.data).toHaveLength(1);
    });

    it("should filter by job category when provided", async () => {
      vacancyRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllPublic(1, 10, "cat-1");

      expect(vacancyRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          status: JobStatus.PUBLISHED,
          endDate: expect.any(Object),
          jobCategoryId: "cat-1"
        },
        skip: 0,
        take: 10,
        order: { createdAt: "DESC" },
        relations: ["jobCategory"]
      });
    });
  });

  describe("findOnePublic", () => {
    it("should return public vacancy when found and active", async () => {
      const publishedVacancy = { ...mockVacancy, status: JobStatus.PUBLISHED };
      vacancyRepository.findOne.mockResolvedValue(activeVacancy as any);

      const result = await service.findOnePublic("vacancy-1");

      expect(vacancyRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: "vacancy-1",
          status: JobStatus.PUBLISHED,
          endDate: expect.any(Object)
        },
        relations: ["jobCategory"]
      });
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException when public vacancy not found", async () => {
      vacancyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOnePublic("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("updateFromJobForm", () => {
    it("should update vacancy from job form data successfully", async () => {
      const jobFormData = {
        jobTitle: "Senior Developer",
        jobCode: "SD001",
        description: "Senior development role",
        responsibilities: "Lead development",
        requirements: "5+ years experience",
        jobType: JobType.RECRUITMENT,
        employeeType: EmploymentType.FULL_TIME,
        workModel: WorkModel.REMOTE,
        currency: "USD",
        pipelineId: "pipeline-1",
        jobCategory: "cat-1"
      };

      vacancyRepository.findOne
        .mockResolvedValueOnce(mockVacancy as any) // First call in findOne
        .mockResolvedValueOnce({ ...mockVacancy, ...jobFormData } as any); // Second call after update
      vacancyRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateFromJobForm(
        "vacancy-1",
        jobFormData,
        "user-1"
      );

      expect(vacancyRepository.update).toHaveBeenCalledWith(
        "vacancy-1",
        expect.objectContaining({
          title: "Senior Developer",
          jobCode: "SD001",
          description: "Senior development role",
          updatedById: "user-1"
        })
      );
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException when vacancy not found in updateFromJobForm", async () => {
      vacancyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateFromJobForm("nonexistent-id", {}, "user-1")
      ).rejects.toThrow(NotFoundException);
    });
  });
});
