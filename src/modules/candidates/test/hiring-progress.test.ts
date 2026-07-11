import { Test, TestingModule } from "@nestjs/testing";
import { CandidatesService } from "../services/candidates.service";
import { CandidatesController } from "../controllers/candidates.controller";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Application } from "../../applicants/entities/application.entity";
import { Applicant } from "../../applicants/entities/applicant.entity";
import { Vacancy } from "../../vacancies/entities/vacancy.entity";
import { PipelineStage } from "../../vacancies/entities/pipeline-stage.entity";
import { ApplicationNotes } from "../../applicants/entities/application-notes.entity";

describe("Hiring Progress API", () => {
  let service: CandidatesService;
  let controller: CandidatesController;

  const mockApplicationRepository = {
    findOne: jest.fn()
  };

  const mockApplicantRepository = {
    findOne: jest.fn()
  };

  const mockVacancyRepository = {
    findOne: jest.fn()
  };

  const mockPipelineStageRepository = {
    findOne: jest.fn()
  };

  const mockApplicationNotesRepository = {
    findOne: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatesController],
      providers: [
        CandidatesService,
        {
          provide: getRepositoryToken(Application),
          useValue: mockApplicationRepository
        },
        {
          provide: getRepositoryToken(Applicant),
          useValue: mockApplicantRepository
        },
        {
          provide: getRepositoryToken(Vacancy),
          useValue: mockVacancyRepository
        },
        {
          provide: getRepositoryToken(PipelineStage),
          useValue: mockPipelineStageRepository
        },
        {
          provide: getRepositoryToken(ApplicationNotes),
          useValue: mockApplicationNotesRepository
        }
      ]
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
    controller = module.get<CandidatesController>(CandidatesController);
  });

  it("should return hiring progress for a valid application", async () => {
    const mockApplication = {
      id: "app-123",
      applicationNumber: "APP-001",
      status: "applied",
      appliedAt: new Date(),
      currentStage: {
        id: "stage-1",
        stageTemplate: { name: "Applied" }
      },
      pipeline: {
        stages: [
          {
            id: "stage-1",
            order: 1,
            stageTemplate: { name: "Applied" }
          },
          {
            id: "stage-2",
            order: 2,
            stageTemplate: { name: "Screening CV" }
          }
        ]
      },
      activities: [],
      applicant: {
        id: "applicant-123",
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1234567890"
      }
    };

    mockApplicationRepository.findOne.mockResolvedValue(mockApplication);

    const result = await service.getHiringProgress("app-123");

    expect(result).toHaveProperty("currentStage");
    expect(result).toHaveProperty("upcomingStage");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("stages");
    expect(Array.isArray(result.stages)).toBe(true);
  });

  it("should handle application not found", async () => {
    mockApplicationRepository.findOne.mockResolvedValue(null);

    await expect(service.getHiringProgress("invalid-id")).rejects.toThrow(
      "Application with ID invalid-id not found"
    );
  });
});
