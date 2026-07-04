// src/modules/applicants/services/applicant.service.spec.ts
//
// Cakupan: HANYA bagian yang memicu/mengorkestrasi pemeringkatan SBERT via
// jalur upload CV (applyForPosition, quickApply, runScoringAsync). Method
// lain (CRUD address/identity/education/project-history, application
// tracking, apply berbasis form manual, dsb.) di luar scope tugas akhir ini.

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
import { EvaluationResult } from '../../applicant-results/entities/evaluation-results.entity';
import { File } from '../../../shared/entities/file.entity';
import { TokenService } from './token.service';
import { ApplicantResultsService } from '../../applicant-results/services/applicant-results.service';
import { FileUploadService } from '../../../shared/services/file-upload.service';
import { EmailService } from '../../../shared/services/email.service';
import { SystemConfigEmailService } from '../../../shared/services/system-config-email.service';
import { ApplicantStatus } from '../../../shared/enums/applicant.enum';
import { JobStatus } from '../../../shared/enums/job-status.enum';

// Tunggu microtask/macrotask queue selesai supaya fire-and-forget
// (void this.runScoringAsync(...)) sempat tereksekusi sebelum assertion dijalankan.
const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

// =============================================================================
// BLOCK 1: applyForPosition — scoring SINKRON (flow upload CV manual, bukan quickApply)
// =============================================================================
describe('ApplicantService — applyForPosition (scoring sinkron sebelum response)', () => {
  let service: ApplicantService;
  let applicationRepository: any;
  let fileRepository: any;
  let applicantResultsService: any;
  let dataSource: any;

  const mockManager = {
    findOne: jest.fn(),
    save: jest.fn((_entity, data) => Promise.resolve(data)),
    softDelete: jest.fn(),
    create: jest.fn((_entity, data) => data),
  };

  const baseApplyDto: any = {
    fullName: 'Budi Santoso', phone: '0800', gender: 'male', maritalStatus: 'single',
    placeOfBirth: 'Bandung', dateOfBirth: '1995-05-15', linkedinUrl: null, socialMediaUrl: null,
    availability: 'immediately', availabilityAt: null, addresses: [], identities: [],
  };

  beforeEach(async () => {
    applicationRepository = { findOne: jest.fn() };
    fileRepository = { findOne: jest.fn() };
    applicantResultsService = { runScoring: jest.fn(), saveResults: jest.fn(), saveEvaluationError: jest.fn() };
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
        { provide: getRepositoryToken(EvaluationResult), useValue: {} },
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

  it('[UTC-103] harus melempar NotFoundException jika application tidak ditemukan', async () => {
    applicationRepository.findOne.mockResolvedValue(null);
    await expect(service.applyForPosition('app-x', baseApplyDto)).rejects.toThrow(NotFoundException);
  });

  it('[UTC-104] harus melempar BadRequestException jika application sudah HIRED', async () => {
    applicationRepository.findOne.mockResolvedValue({ id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.HIRED });
    await expect(service.applyForPosition('app-1', baseApplyDto)).rejects.toThrow(BadRequestException);
  });

  it('[UTC-105] harus melempar BadRequestException jika application sudah REJECTED', async () => {
    applicationRepository.findOne.mockResolvedValue({ id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.REJECTED });
    await expect(service.applyForPosition('app-1', baseApplyDto)).rejects.toThrow(BadRequestException);
  });

  it('[UTC-106] harus melempar BadRequestException jika CV belum diupload, dan TIDAK memanggil runScoring', async () => {
    applicationRepository.findOne.mockResolvedValue({ id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.APPLIED });
    fileRepository.findOne.mockResolvedValue(null);

    await expect(service.applyForPosition('app-1', baseApplyDto)).rejects.toThrow(BadRequestException);
    expect(applicantResultsService.runScoring).not.toHaveBeenCalled();
  });

  it('[UTC-107] BUG DITEMUKAN: jika runScoring gagal, transaksi DB TETAP berjalan (data applicant/application tetap tersimpan) — bukan dibatalkan seperti asumsi sebelumnya', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.APPLIED, pipelineId: 'pipe-1',
    });
    fileRepository.findOne.mockResolvedValue({ filePath: 'cv/budi.pdf', mimeType: 'application/pdf' });
    applicantResultsService.runScoring.mockRejectedValue(new Error('FastAPI down'));

    try {
      await service.applyForPosition('app-1', baseApplyDto);
    } catch (e) {
      // diabaikan, fokus pengecekan ada di bawah
    }
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(applicantResultsService.saveEvaluationError).toHaveBeenCalledWith('app-1', 'FastAPI down');
  });

  it('[UTC-108] BUG DITEMUKAN: jika runScoring gagal, method CRASH dengan TypeError saat membangun response ("Cannot read properties of null (reading \'experience\')"), bukan gracefully mengembalikan maxExperienceScore=0 seperti maksud komentar kode', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.APPLIED, pipelineId: 'pipe-1',
    });
    fileRepository.findOne.mockResolvedValue({ filePath: 'cv/budi.pdf', mimeType: 'application/pdf' });
    applicantResultsService.runScoring.mockRejectedValue(new Error('FastAPI down'));

    await expect(service.applyForPosition('app-1', baseApplyDto)).rejects.toThrow(TypeError);
  });

  it('[UTC-109] harus tetap mengembalikan response sukses walau saveResults gagal disimpan (non-blocking, hanya dicatat log)', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.APPLIED, pipelineId: 'pipe-1',
    });
    fileRepository.findOne.mockResolvedValue({ filePath: 'cv/budi.pdf', mimeType: 'application/pdf' });
    applicantResultsService.runScoring.mockResolvedValue({
      application_id: 'app-1', educations: [],
      experience: [{ role: 'Dev', similarity: 0.7, description: '', start: '', end: '', duration_years: 1 }],
    });
    applicantResultsService.saveResults.mockRejectedValue(new Error('DB write failed'));

    const result = await service.applyForPosition('app-1', baseApplyDto);
    expect(result.evaluationResult.maxExperienceScore).toBe(0.7);
  });

  it('[UTC-110] harus menghitung maxExperienceScore = MAX similarity dan isTopMatch yang benar di response apply', async () => {
    applicationRepository.findOne.mockResolvedValue({
      id: 'app-1', applicantId: 'applicant-1', status: ApplicantStatus.APPLIED, pipelineId: 'pipe-1',
    });
    fileRepository.findOne.mockResolvedValue({ filePath: 'cv/budi.pdf', mimeType: 'application/pdf' });
    applicantResultsService.runScoring.mockResolvedValue({
      application_id: 'app-1', educations: [],
      experience: [
        { role: 'Staff Gudang', similarity: 0.1, description: '', start: '', end: '', duration_years: 1 },
        { role: 'Backend Developer', similarity: 0.85, description: '', start: '', end: '', duration_years: 1 },
      ],
    });
    applicantResultsService.saveResults.mockResolvedValue(undefined);

    const result = await service.applyForPosition('app-1', baseApplyDto);

    expect(result.evaluationResult.maxExperienceScore).toBe(0.85);
    const breakdown = result.evaluationResult.scoringBreakdown.experiences;
    expect(breakdown.find((e: any) => e.role === 'Backend Developer')!.isTopMatch).toBe(true);
    expect(breakdown.find((e: any) => e.role === 'Staff Gudang')!.isTopMatch).toBe(false);
  });

  it('[UTC-111] harus mengembalikan maxExperienceScore = 0 jika kandidat tidak punya pengalaman kerja sama sekali', async () => {
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
// BLOCK 2: quickApply — scoring ASYNC fire-and-forget (pendaftaran mandiri)
// =============================================================================
describe('ApplicantService — quickApply (pemicu scoring asynchronous)', () => {
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
    create: jest.fn((_entity: any, data: any) => data ?? {}),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    })),
  };
  mockManager.save = jest.fn((entity: any, data: any) => {
    if (entity === Applicant && !data.id) return Promise.resolve({ ...data, id: 'applicant-new-id' });
    if (entity === Application && !data.id) return Promise.resolve({ ...data, id: 'app-new-id' });
    return Promise.resolve(data);
  });

  const baseDto: any = {
    vacancyId: 'vac-1', email: 'budi.quickapply@mail.com', fullName: 'Budi Santoso',
    phone: '08123456789', gender: 'male', maritalStatus: 'single', placeOfBirth: 'Bandung',
    dateOfBirth: '1997-05-15', address: null,
  };

  const cvFile: any = { originalname: 'cv.pdf', mimetype: 'application/pdf', buffer: Buffer.from('dummy'), size: 100 };
  const uploadedFile = { filePath: 'applicants/cv/budi.pdf', fileName: 'budi.pdf', originalName: 'cv.pdf', fileSize: 100, mimeType: 'application/pdf' };
  const publishedVacancy = {
    id: 'vac-1', title: 'Backend Developer', status: JobStatus.PUBLISHED,
    pipelineId: 'pipeline-1', pipeline: { id: 'pipeline-1' }, jobCode: 'BE', endDate: null,
  };

  beforeEach(async () => {
    vacancyRepository = { findOne: jest.fn() };
    applicantRepository = { findOne: jest.fn() };
    applicationRepository = { findOne: jest.fn(), count: jest.fn() };
    fileUploadService = { uploadFile: jest.fn(), deleteFileByPath: jest.fn().mockResolvedValue(undefined) };
    systemConfigEmailService = { sendEmailFromConfig: jest.fn().mockResolvedValue(undefined) };
    applicantResultsService = { runScoring: jest.fn(), saveResults: jest.fn(), saveEvaluationError: jest.fn().mockResolvedValue(undefined) };
    dataSource = { transaction: jest.fn((cb: any) => cb(mockManager)) };

    mockManager.findOne.mockImplementation((entity: any) => {
      if (entity === Applicant) return Promise.resolve(null);
      if (entity === Application) return Promise.resolve(null);
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
        { provide: getRepositoryToken(EvaluationResult), useValue: {} },
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

  it('[UTC-112] harus melempar NotFoundException jika vacancy tidak ditemukan', async () => {
    vacancyRepository.findOne.mockResolvedValue(null);
    await expect(service.quickApply(baseDto, cvFile)).rejects.toThrow(NotFoundException);
  });

  it('[UTC-113] harus melempar BadRequestException jika vacancy belum berstatus PUBLISHED', async () => {
    vacancyRepository.findOne.mockResolvedValue({ ...publishedVacancy, status: JobStatus.DRAFT });
    await expect(service.quickApply(baseDto, cvFile)).rejects.toThrow(BadRequestException);
  });

  it('[UTC-114] harus melempar BadRequestException jika email sudah pernah melamar ke vacancy yang sama, dan TIDAK pernah mengunggah file', async () => {
    applicantRepository.findOne.mockResolvedValue({ id: 'applicant-existing', email: baseDto.email });
    applicationRepository.findOne.mockResolvedValue({ id: 'app-existing', applicantId: 'applicant-existing', vacancyId: baseDto.vacancyId });

    await expect(service.quickApply(baseDto, cvFile)).rejects.toThrow(BadRequestException);
    expect(fileUploadService.uploadFile).not.toHaveBeenCalled();
  });

  it('[UTC-115] harus membuat placeholder EvaluationResult (evaluateDetail kosong) sebelum scoring berjalan, agar frontend selalu punya struktur data konsisten', async () => {
    applicantResultsService.runScoring.mockResolvedValue({ application_id: 'app-new', educations: [], experience: [] });
    applicantResultsService.saveResults.mockResolvedValue(undefined);

    await service.quickApply(baseDto, cvFile);
    await flushMicrotasks();

    const placeholderCall = mockManager.save.mock.calls.find((c: any) => c[0] === EvaluationResult);
    expect(placeholderCall).toBeDefined();
    expect(placeholderCall![1].evaluateDetail).toEqual({ experiences: [], educations: [] });
  });

  it('[UTC-116] berhasil submit harus memicu background scoring dengan applicationId, filePath, mimeType, dan applicantId yang benar', async () => {
    applicantResultsService.runScoring.mockResolvedValue({
      application_id: 'app-new', educations: [],
      experience: [{ role: 'Backend Developer', similarity: 0.8, description: '', start: '', end: '', duration_years: 1 }],
    });
    applicantResultsService.saveResults.mockResolvedValue(undefined);

    const result = await service.quickApply(baseDto, cvFile);
    await flushMicrotasks();

    expect(applicantResultsService.runScoring).toHaveBeenCalledWith(result.application.id, uploadedFile.filePath, cvFile.mimetype);
    expect(applicantResultsService.saveResults).toHaveBeenCalledWith(expect.objectContaining({ application_id: 'app-new' }), result.applicant.id);
  });

  it('[UTC-117] kegagalan background scoring tidak boleh menggagalkan response quickApply (fire-and-forget), dan error harus dicatat via saveEvaluationError', async () => {
    applicantResultsService.runScoring.mockRejectedValue(new Error('FastAPI tidak dapat dihubungi'));

    const result = await service.quickApply(baseDto, cvFile);
    await flushMicrotasks();

    expect(result.application).toBeDefined();
    expect(result.applicant).toBeDefined();
    expect(applicantResultsService.saveResults).not.toHaveBeenCalled();
    expect(applicantResultsService.saveEvaluationError).toHaveBeenCalledWith(result.application.id, 'FastAPI tidak dapat dihubungi');
  });

  it('[UTC-118] response quickApply TIDAK boleh menyertakan field evaluationResult — beda dari applyForPosition karena scoring berjalan asynchronous', async () => {
    applicantResultsService.runScoring.mockResolvedValue({ application_id: 'app-new', educations: [], experience: [] });
    applicantResultsService.saveResults.mockResolvedValue(undefined);

    const result = await service.quickApply(baseDto, cvFile);
    await flushMicrotasks();

    expect((result as any).evaluationResult).toBeUndefined();
  });

  it('[UTC-119] duplikat yang terdeteksi di dalam transaksi (race condition) harus membersihkan file CV yang sudah terunggah ke MinIO', async () => {
    mockManager.findOne.mockImplementation((entity: any) => {
      if (entity === Applicant) return Promise.resolve(null);
      if (entity === Application) return Promise.resolve({ id: 'app-race-condition' });
      return Promise.resolve(null);
    });

    await expect(service.quickApply(baseDto, cvFile)).rejects.toThrow(BadRequestException);
    expect(fileUploadService.deleteFileByPath).toHaveBeenCalledWith(uploadedFile.filePath);
  });
});

// =============================================================================
// BLOCK 4: runScoringAsync (private) — akses langsung
// =============================================================================
describe('ApplicantService — runScoringAsync (private method)', () => {
  let service: ApplicantService;
  let applicantResultsService: any;

  beforeEach(async () => {
    applicantResultsService = {
      runScoring: jest.fn(),
      saveResults: jest.fn(),
      saveEvaluationError: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantService,
        { provide: DataSource, useValue: {} },
        { provide: TokenService, useValue: {} },
        { provide: getRepositoryToken(Applicant), useValue: {} },
        { provide: getRepositoryToken(Application), useValue: {} },
        { provide: getRepositoryToken(Vacancy), useValue: {} },
        { provide: getRepositoryToken(ApplicantAddress), useValue: {} },
        { provide: getRepositoryToken(ApplicantIdentity), useValue: {} },
        { provide: getRepositoryToken(ApplicantEducation), useValue: {} },
        { provide: getRepositoryToken(ApplicantJobHistory), useValue: {} },
        { provide: getRepositoryToken(ApplicantProjectHistory), useValue: {} },
        { provide: getRepositoryToken(ApplicantSource), useValue: {} },
        { provide: getRepositoryToken(PipelineStage), useValue: {} },
        { provide: getRepositoryToken(StageActivity), useValue: {} },
        { provide: getRepositoryToken(EvaluationResult), useValue: {} },
        { provide: ApplicantResultsService, useValue: applicantResultsService },
        { provide: getRepositoryToken(File), useValue: {} },
        { provide: FileUploadService, useValue: {} },
        { provide: EmailService, useValue: {} },
        { provide: SystemConfigEmailService, useValue: {} },
      ],
    }).compile();

    service = module.get<ApplicantService>(ApplicantService);
  });

  afterEach(() => jest.clearAllMocks());

  it('[UTC-120] runScoringAsync: berhasil — runScoring lalu saveResults dipanggil berurutan dengan parameter yang benar', async () => {
    const scoringResult = { application_id: 'app-1', educations: [], experience: [] };
    applicantResultsService.runScoring.mockResolvedValue(scoringResult);
    applicantResultsService.saveResults.mockResolvedValue(undefined);

    await (service as any).runScoringAsync('app-1', 'cv/path.pdf', 'application/pdf', 'applicant-1');

    expect(applicantResultsService.runScoring).toHaveBeenCalledWith('app-1', 'cv/path.pdf', 'application/pdf');
    expect(applicantResultsService.saveResults).toHaveBeenCalledWith(scoringResult, 'applicant-1');
  });

  it('[UTC-121] runScoringAsync: gagal — harus memanggil saveEvaluationError dengan pesan error yang benar, TIDAK melempar exception ke pemanggil', async () => {
    applicantResultsService.runScoring.mockRejectedValue(new Error('Timeout menghubungi FastAPI'));

    await expect(
      (service as any).runScoringAsync('app-2', 'cv/path.pdf', 'application/pdf', 'applicant-2')
    ).resolves.toBeUndefined();

    expect(applicantResultsService.saveEvaluationError).toHaveBeenCalledWith('app-2', 'Timeout menghubungi FastAPI');
    expect(applicantResultsService.saveResults).not.toHaveBeenCalled();
  });
});