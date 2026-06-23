// src/modules/applicants/services/applicant.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { ApplicantService } from './applicant.service';
import { Applicant } from '../entities/applicant.entity';
import { Application } from '../entities/application.entity';
import { Vacancy } from '../../vacancies/entities/vacancy.entity';
import { ApplicantAddress } from '../entities/applicant-address.entity';
import { ApplicantIdentity } from '../entities/applicant-identity.entity';
import { ApplicantEducation } from '../entities/applicant-education.entity';
import { ApplicantJobHistory } from '../entities/applicant-job-history.entity';
import { ApplicantProjectHistory } from '../entities/applicant-project-history.entity';
import { ApplicantSource } from '../entities/applicant-source.entity';
import { PipelineStage } from '../../vacancies/entities/pipeline-stage.entity';
import { StageActivity } from '../../vacancies/entities/stage-activity.entity';
import { File } from '../../../shared/entities/file.entity';
import { TokenService } from './token.service';
import { ApplicantResultsService } from '../../applicant-results/services/applicant-results.service';
import { FileUploadService } from '../../../shared/services/file-upload.service';
import { EmailService } from '../../../shared/services/email.service';
import { SystemConfigEmailService } from '../../../shared/services/system-config-email.service';
import { ApplicantStatus } from '../../../shared/enums/applicant.enum';
import { JobStatus } from '../../../shared/enums/job-status.enum';

// =============================================================================
// DESCRIBE BLOCK 1: applyForPosition — UTC-62 s.d. UTC-69
// Entry point SBERT scoring via CV yang sudah diupload sebelumnya
// =============================================================================
describe('ApplicantService — applyForPosition (trigger pemeringkatan SBERT)', () => {
  let service: ApplicantService;
  let applicationRepository: any;
  let fileRepository: any;
  let applicantResultsService: any;
  let dataSource: any;

  // Mock EntityManager untuk dataSource.transaction(async (manager) => {...})
  const mockManager = {
    findOne: jest.fn(),
    save: jest.fn((_entity, data) => Promise.resolve(data)),
    softDelete: jest.fn(),
    create: jest.fn((_entity, data) => data),
  };

  const baseApplyDto: any = {
    fullName: 'Budi Santoso',
    phone: '0800',
    gender: 'male',
    maritalStatus: 'single',
    placeOfBirth: 'Bandung',
    dateOfBirth: '1995-05-15',
    linkedinUrl: null,
    socialMediaUrl: null,
    availability: 'immediately',
    availabilityAt: null,
    addresses: [],
    identities: [],
  };

  beforeEach(async () => {
    applicationRepository = { findOne: jest.fn() };
    fileRepository = { findOne: jest.fn() };
    applicantResultsService = { runScoring: jest.fn(), saveResults: jest.fn() };
    dataSource = { transaction: jest.fn((cb) => cb(mockManager)) };

    mockManager.findOne.mockImplementation((entity: any) => {
      if (entity === Applicant) return Promise.resolve({ id: 'applicant-1' });
      if (entity === PipelineStage) return Promise.resolve({ id: 'stage-1' });
      return Promise.resolve(null);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantService,
        { provide: DataSource, useValue: dataSource },
        { provide: TokenService, useValue: {} },
        { provide: getRepositoryToken(Applicant), useValue: {} },
        { provide: getRepositoryToken(Application), useValue: applicationRepository },
        { provide: getRepositoryToken(Vacancy), useValue: {} },
        { provide: getRepositoryToken(ApplicantAddress), useValue: {} },
        { provide: getRepositoryToken(ApplicantIdentity), useValue: {} },
        { provide: getRepositoryToken(ApplicantEducation), useValue: {} },
        { provide: getRepositoryToken(ApplicantJobHistory), useValue: {} },
        { provide: getRepositoryToken(ApplicantProjectHistory), useValue: {} },
        { provide: getRepositoryToken(ApplicantSource), useValue: {} },
        { provide: getRepositoryToken(PipelineStage), useValue: {} },
        { provide: getRepositoryToken(StageActivity), useValue: {} },
        { provide: ApplicantResultsService, useValue: applicantResultsService },
        { provide: getRepositoryToken(File), useValue: fileRepository },
        { provide: FileUploadService, useValue: {} },
        { provide: EmailService, useValue: {} },
        { provide: SystemConfigEmailService, useValue: {} },
      ],
    }).compile();

    service = module.get<ApplicantService>(ApplicantService);
  });

  afterEach(() => jest.clearAllMocks());

  it('[UTC-62] harus melempar NotFoundException jika application tidak ditemukan', async () => {
    applicationRepository.findOne.mockResolvedValue(null);

    await expect(service.applyForPosition('app-x', baseApplyDto)).rejects.toThrow(NotFoundException);
  });

  it('[UTC-63] harus melempar BadRequestException jika application sudah HIRED', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.HIRED,
    });

    await expect(service.applyForPosition('app-1', baseApplyDto)).rejects.toThrow(BadRequestException);
  });

  it('[UTC-64] harus melempar BadRequestException jika application sudah REJECTED', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.REJECTED,
    });

    await expect(service.applyForPosition('app-1', baseApplyDto)).rejects.toThrow(BadRequestException);
  });

  it('[UTC-65] harus melempar BadRequestException jika CV belum diupload, dan TIDAK memanggil runScoring', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.APPLIED,
    });
    fileRepository.findOne.mockResolvedValue(null);

    await expect(service.applyForPosition('app-1', baseApplyDto)).rejects.toThrow(BadRequestException);
    expect(applicantResultsService.runScoring).not.toHaveBeenCalled();
  });

  it('[UTC-66] runScoring HARUS dipanggil sebelum transaksi DB — jika scoring gagal, transaksi tidak boleh pernah dijalankan', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.APPLIED, pipelineId: 'pipe-1',
    });
    fileRepository.findOne.mockResolvedValue({ filePath: 'cv/budi.pdf', mimeType: 'application/pdf' });
    applicantResultsService.runScoring.mockRejectedValue(new Error('FastAPI down'));

    await expect(service.applyForPosition('app-1', baseApplyDto)).rejects.toThrow('FastAPI down');

    // Bukti integritas data: kalau scoring gagal, data applicant/application tidak boleh tersentuh
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('[UTC-67] harus tetap mengembalikan response sukses walau saveResults gagal disimpan (non-blocking, hanya dicatat log)', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.APPLIED, pipelineId: 'pipe-1',
    });
    fileRepository.findOne.mockResolvedValue({ filePath: 'cv/budi.pdf', mimeType: 'application/pdf' });
    applicantResultsService.runScoring.mockResolvedValue({
      application_id: 'app-1',
      educations: [],
      experience: [{ role: 'Dev', similarity: 0.7, description: '', start: '', end: '', duration_years: 1 }],
    });
    applicantResultsService.saveResults.mockRejectedValue(new Error('DB write failed'));

    const result = await service.applyForPosition('app-1', baseApplyDto);

    expect(result.evaluationResult.maxExperienceScore).toBe(0.7);
  });

  it('[UTC-68] harus menghitung maxExperienceScore = MAX similarity dan isTopMatch yang benar di response apply', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.APPLIED, pipelineId: 'pipe-1',
    });
    fileRepository.findOne.mockResolvedValue({ filePath: 'cv/budi.pdf', mimeType: 'application/pdf' });
    applicantResultsService.runScoring.mockResolvedValue({
      application_id: 'app-1',
      educations: [],
      experience: [
        { role: 'Staff Gudang', similarity: 0.1, description: '', start: '', end: '', duration_years: 1 },
        { role: 'Backend Developer', similarity: 0.85, description: '', start: '', end: '', duration_years: 1 },
      ],
    });
    applicantResultsService.saveResults.mockResolvedValue(undefined);

    const result = await service.applyForPosition('app-1', baseApplyDto);

    expect(result.evaluationResult.maxExperienceScore).toBe(0.85);
    const breakdown = result.evaluationResult.scoringBreakdown.experiences;
    const backendMatch = breakdown.find((e: any) => e.role === 'Backend Developer');
    const staffMatch = breakdown.find((e: any) => e.role === 'Staff Gudang');
    expect(backendMatch).toBeDefined();
    expect(backendMatch!.isTopMatch).toBe(true);
    expect(staffMatch).toBeDefined();
    expect(staffMatch!.isTopMatch).toBe(false);
  });

  it('[UTC-69] harus mengembalikan maxExperienceScore = 0 jika kandidat tidak punya pengalaman kerja sama sekali', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.APPLIED, pipelineId: 'pipe-1',
    });
    fileRepository.findOne.mockResolvedValue({ filePath: 'cv/budi.pdf', mimeType: 'application/pdf' });
    applicantResultsService.runScoring.mockResolvedValue({ application_id: 'app-1', educations: [], experience: [] });
    applicantResultsService.saveResults.mockResolvedValue(undefined);

    const result = await service.applyForPosition('app-1', baseApplyDto);

    expect(result.evaluationResult.maxExperienceScore).toBe(0);
  });
});

// =============================================================================
// DESCRIBE BLOCK 2: quickApply — UTC-55 s.d. UTC-61
// Entry point scoring otomatis (fire-and-forget) via pendaftaran mandiri kandidat
// =============================================================================
describe('ApplicantService — quickApply (entry point pemicu scoring otomatis)', () => {
  let service: ApplicantService;
  let vacancyRepository: any;
  let applicantRepository: any;
  let applicationRepository: any;
  let fileUploadService: any;
  let systemConfigEmailService: any;
  let applicantResultsService: any;
  let dataSource: any;

  const mockManager: any = {
    findOne: jest.fn(),
    create: jest.fn((_entity: any, data: any) => data),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null), // belum ada nomor lamaran sebelumnya -> sequence 1
    })),
  };
  mockManager.save = jest.fn((entity: any, data: any) => {
    if (entity === Applicant && !data.id) return Promise.resolve({ ...data, id: 'applicant-new-id' });
    if (entity === Application && !data.id) return Promise.resolve({ ...data, id: 'app-new-id' });
    return Promise.resolve(data);
  });

  const baseDto: any = {
    vacancyId: 'vac-1',
    email: 'budi.quickapply@mail.com',
    fullName: 'Budi Santoso',
    phone: '08123456789',
    gender: 'male',
    maritalStatus: 'single',
    placeOfBirth: 'Bandung',
    dateOfBirth: '1997-05-15',
    address: null,
  };

  const cvFile: any = {
    originalname: 'cv.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('dummy'),
    size: 100,
  };

  const uploadedFile = {
    filePath: 'applicants/cv/budi.pdf',
    fileName: 'budi.pdf',
    originalName: 'cv.pdf',
    fileSize: 100,
    mimeType: 'application/pdf',
  };

  const publishedVacancy = {
    id: 'vac-1',
    title: 'Backend Developer',
    status: JobStatus.PUBLISHED,
    pipelineId: 'pipeline-1',
    pipeline: { id: 'pipeline-1' },
    jobCode: 'BE',
    endDate: null,
    isLimitApplicantEnabled: false,
    applicantLimit: null,
  };

  beforeEach(async () => {
    vacancyRepository = { findOne: jest.fn() };
    applicantRepository = { findOne: jest.fn() };
    applicationRepository = { findOne: jest.fn(), count: jest.fn() };
    fileUploadService = {
      uploadFile: jest.fn(),
      deleteFileByPath: jest.fn().mockResolvedValue(undefined),
    };
    systemConfigEmailService = { sendEmailFromConfig: jest.fn().mockResolvedValue(undefined) };
    applicantResultsService = { runScoring: jest.fn(), saveResults: jest.fn() };
    dataSource = { transaction: jest.fn((cb: any) => cb(mockManager)) };

    mockManager.findOne.mockImplementation((entity: any) => {
      if (entity === Applicant) return Promise.resolve(null);      // default: applicant baru
      if (entity === Application) return Promise.resolve(null);    // default: tidak ada duplikat
      if (entity === PipelineStage) return Promise.resolve({ id: 'stage-1' });
      return Promise.resolve(null);
    });

    vacancyRepository.findOne.mockResolvedValue(publishedVacancy);
    applicantRepository.findOne.mockResolvedValue(null);
    applicationRepository.findOne.mockResolvedValue(null);
    fileUploadService.uploadFile.mockResolvedValue(uploadedFile);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantService,
        { provide: DataSource, useValue: dataSource },
        { provide: TokenService, useValue: {} },
        { provide: getRepositoryToken(Applicant), useValue: applicantRepository },
        { provide: getRepositoryToken(Application), useValue: applicationRepository },
        { provide: getRepositoryToken(Vacancy), useValue: vacancyRepository },
        { provide: getRepositoryToken(ApplicantAddress), useValue: {} },
        { provide: getRepositoryToken(ApplicantIdentity), useValue: {} },
        { provide: getRepositoryToken(ApplicantEducation), useValue: {} },
        { provide: getRepositoryToken(ApplicantJobHistory), useValue: {} },
        { provide: getRepositoryToken(ApplicantProjectHistory), useValue: {} },
        { provide: getRepositoryToken(ApplicantSource), useValue: {} },
        { provide: getRepositoryToken(PipelineStage), useValue: {} },
        { provide: getRepositoryToken(StageActivity), useValue: {} },
        { provide: ApplicantResultsService, useValue: applicantResultsService },
        { provide: getRepositoryToken(File), useValue: { findOne: jest.fn() } },
        { provide: FileUploadService, useValue: fileUploadService },
        { provide: EmailService, useValue: {} },
        { provide: SystemConfigEmailService, useValue: systemConfigEmailService },
      ],
    }).compile();

    service = module.get<ApplicantService>(ApplicantService);
  });

  afterEach(() => jest.clearAllMocks());

  // Tunggu microtask queue selesai, supaya promise fire-and-forget
  // (void this.runScoringAsync(...)) sempat tereksekusi sebelum assertion
  const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

  it('[UTC-55] harus melempar NotFoundException jika vacancy tidak ditemukan', async () => {
    vacancyRepository.findOne.mockResolvedValue(null);
    await expect(service.quickApply(baseDto, cvFile)).rejects.toThrow(NotFoundException);
  });

  it('[UTC-56] harus melempar BadRequestException jika vacancy belum berstatus PUBLISHED', async () => {
    vacancyRepository.findOne.mockResolvedValue({ ...publishedVacancy, status: JobStatus.DRAFT });
    await expect(service.quickApply(baseDto, cvFile)).rejects.toThrow(BadRequestException);
  });

  it('[UTC-57] harus melempar BadRequestException jika email sudah pernah melamar ke vacancy yang sama, dan TIDAK pernah mengunggah file', async () => {
    applicantRepository.findOne.mockResolvedValue({ id: 'applicant-existing', email: baseDto.email });
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-existing', applicantId: 'applicant-existing', vacancyId: baseDto.vacancyId,
    });

    await expect(service.quickApply(baseDto, cvFile)).rejects.toThrow(BadRequestException);
    expect(fileUploadService.uploadFile).not.toHaveBeenCalled();
  });

  it('[UTC-58] berhasil submit harus memicu background scoring dengan applicationId, filePath, mimeType, dan applicantId yang benar', async () => {
    applicantResultsService.runScoring.mockResolvedValue({
      application_id: 'app-new',
      educations: [],
      experience: [{ role: 'Backend Developer', similarity: 0.8, description: '', start: '', end: '', duration_years: 1 }],
    });
    applicantResultsService.saveResults.mockResolvedValue(undefined);

    const result = await service.quickApply(baseDto, cvFile);
    await flushMicrotasks();

    expect(applicantResultsService.runScoring).toHaveBeenCalledWith(
      result.application.id, uploadedFile.filePath, cvFile.mimetype,
    );
    expect(applicantResultsService.saveResults).toHaveBeenCalledWith(
      expect.objectContaining({ application_id: 'app-new' }), result.applicant.id,
    );
  });

  it('[UTC-59] kegagalan background scoring tidak boleh menggagalkan response quickApply (fire-and-forget)', async () => {
    applicantResultsService.runScoring.mockRejectedValue(new Error('FastAPI tidak dapat dihubungi'));

    const result = await service.quickApply(baseDto, cvFile);
    await flushMicrotasks();

    expect(result.application).toBeDefined();
    expect(result.applicant).toBeDefined();
    expect(applicantResultsService.saveResults).not.toHaveBeenCalled();
  });

  it('[UTC-60] response quickApply TIDAK boleh menyertakan field evaluationResult — beda dari applyForPosition karena scoring berjalan asynchronous', async () => {
    applicantResultsService.runScoring.mockResolvedValue({ application_id: 'app-new', educations: [], experience: [] });
    applicantResultsService.saveResults.mockResolvedValue(undefined);

    const result = await service.quickApply(baseDto, cvFile);
    await flushMicrotasks();

    expect((result as any).evaluationResult).toBeUndefined();
  });

  it('[UTC-61] duplikat yang terdeteksi di dalam transaksi (race condition) harus membersihkan file CV yang sudah terunggah ke MinIO', async () => {
    mockManager.findOne.mockImplementation((entity: any) => {
      if (entity === Applicant) return Promise.resolve(null);
      if (entity === Application) return Promise.resolve({ id: 'app-race-condition' }); // duplikat baru ketahuan di dalam tx
      return Promise.resolve(null);
    });

    await expect(service.quickApply(baseDto, cvFile)).rejects.toThrow(BadRequestException);
    expect(fileUploadService.deleteFileByPath).toHaveBeenCalledWith(uploadedFile.filePath);
  });
});