// src/modules/vacancies/services/vacancy.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VacancyService } from './vacancy.service';
import { Vacancy } from '../entities/vacancy.entity';
import { Application } from '../../applicants/entities/application.entity';
import { RecruitmentPipelineService } from './recruitment-pipeline.service';
import { JobStatus } from '../../../shared/enums/job-status.enum';
// PERBAIKAN: baris import dari 'node:test' sudah dihapus agar tidak bertabrakan dengan global Jest

describe('VacancyService — Public Vacancy (sumber teks job_responsibilities untuk SBERT)', () => {
  let service: VacancyService;
  let vacancyRepository: any;

  beforeEach(async () => {
    vacancyRepository = { findOne: jest.fn(), findAndCount: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacancyService,
        { provide: getRepositoryToken(Vacancy), useValue: vacancyRepository },
        { provide: getRepositoryToken(Application), useValue: {} },
        { provide: RecruitmentPipelineService, useValue: {} },
      ],
    }).compile();

    service = module.get<VacancyService>(VacancyService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────────────────────────────────────────
  // UTC-29 s.d. UTC-32: findOnePublic
  // ─────────────────────────────────────────────────────────────────────────────
  describe('findOnePublic', () => {
    it('[UTC-29] harus mengembalikan responsibilities utuh tanpa modifikasi (teks ini yang dikirim sebagai job_responsibilities ke FastAPI)', async () => {
      const teksAsli = 'Membangun dan memelihara REST API menggunakan NestJS, berkolaborasi dengan tim frontend.';
      vacancyRepository.findOne.mockResolvedValue({
        id: 'vac-1', title: 'Backend Developer', description: '', responsibilities: teksAsli,
        requirements: '', jobType: 'full_time', employmentType: 'permanent', workModel: 'hybrid',
        officeAddresses: [], endDate: null, startDate: null, requiredEducation: null,
        requiredExperienceYears: 1, jobCategory: { id: 'cat-1', name: 'Engineering' },
        generatedPosterUrl: null, status: JobStatus.PUBLISHED, posterConfiguration: null,
      });

      const result = await service.findOnePublic('vac-1');

      expect(result.responsibilities).toBe(teksAsli);
    });

    it('[UTC-30] query harus mengombinasikan id DAN status=PUBLISHED (vacancy draft/closed tidak boleh terekspos publik)', async () => {
      vacancyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOnePublic('vac-draft')).rejects.toThrow(NotFoundException);
      expect(vacancyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'vac-draft', status: JobStatus.PUBLISHED },
        relations: ['jobCategory'],
      });
    });

    it('[UTC-31] harus melempar NotFoundException jika vacancy tidak ditemukan / belum published', async () => {
      vacancyRepository.findOne.mockResolvedValue(null);
      await expect(service.findOnePublic('vac-tidak-ada')).rejects.toThrow(NotFoundException);
    });

    it('[UTC-32] jika relasi jobCategory null, harus fallback ke objek kosong tanpa crash', async () => {
      vacancyRepository.findOne.mockResolvedValue({
        id: 'vac-2', title: 'QA Engineer', description: '', responsibilities: 'Menguji aplikasi web',
        requirements: '', jobType: 'full_time', employmentType: 'permanent', workModel: 'remote',
        officeAddresses: null, endDate: null, startDate: null, requiredEducation: null,
        requiredExperienceYears: null, jobCategory: null, generatedPosterUrl: null,
        status: JobStatus.PUBLISHED, posterConfiguration: null,
      });

      const result = await service.findOnePublic('vac-2');
      expect(result.jobCategory).toEqual({ id: '', name: '' });
      expect(result.officeAddresses).toEqual([]);
    });

    it('[UTC-37] responsibilities null harus dikembalikan apa adanya — fallback string kosong terjadi di layer ApplicantResultsService, bukan di sini', async () => {
      vacancyRepository.findOne.mockResolvedValue({
        id: 'vac-37', title: 'Posisi Tanpa Deskripsi Tugas', description: '', responsibilities: null,
        requirements: '', jobType: 'full_time', employmentType: 'permanent', workModel: 'remote',
        officeAddresses: [], endDate: null, startDate: null, requiredEducation: null,
        requiredExperienceYears: null, jobCategory: null, generatedPosterUrl: null,
        status: JobStatus.PUBLISHED, posterConfiguration: null,
      });

      const result = await service.findOnePublic('vac-37');
      expect(result.responsibilities).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UTC-33 s.d. UTC-36: findAllPublic
  // ─────────────────────────────────────────────────────────────────────────────
  describe('findAllPublic', () => {
    it('[UTC-33] harus hanya mengambil vacancy dengan status PUBLISHED', async () => {
      vacancyRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllPublic(1, 10);

      expect(vacancyRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: JobStatus.PUBLISHED } }),
      );
    });

    it('[UTC-34] select query wajib menyertakan field responsibilities (input scoring saat applicant melamar)', async () => {
      vacancyRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllPublic(1, 10);

      const callArg = vacancyRepository.findAndCount.mock.calls[0][0];
      expect(callArg.select.responsibilities).toBe(true);
    });

    it('[UTC-35] harus menghitung totalPages dengan benar berdasarkan total & limit', async () => {
      vacancyRepository.findAndCount.mockResolvedValue([[], 25]);

      const result = await service.findAllPublic(1, 10);

      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
    });

    it('[UTC-36] harus memfilter berdasarkan jobCategory jika parameter diberikan', async () => {
      vacancyRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllPublic(1, 10, 'cat-engineering');

      expect(vacancyRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: JobStatus.PUBLISHED, jobCategoryId: 'cat-engineering' } }),
      );
    });
  });
});

const makeVacancyWithRelations = (overrides: Partial<Vacancy> = {}): Partial<Vacancy> => ({
  id: 'vac-new',
  title: 'Backend Developer',
  jobCode: 'JOB-001',
  status: JobStatus.DRAFT,
  description: undefined,
  responsibilities: undefined,
  requirements: undefined,
  jobType: 'full_time' as any,
  employmentType: 'full_time' as any,
  workModel: 'on_site' as any,
  currency: 'IDR',
  pipelineId: 'pipe-1',
  createdById: 'user-hr',
  updatedById: undefined,
  department: undefined,
  pipeline: { id: 'pipe-1', name: 'Backend Developer - Pipeline' } as any,
  jobCategory: undefined,
  officeAddresses: [],
  startDate: undefined,
  endDate: undefined,
  isLimitApplicantEnabled: false,
  applicantLimit: undefined,
  isLimitHiredEnabled: false,
  hiredLimit: undefined,
  salaryMin: undefined,
  salaryMax: undefined,
  salaryPeriod: undefined,
  departmentId: undefined,
  jobCategoryId: undefined,
  requiredEducation: undefined,
  requiredExperienceYears: undefined,
  hoursPerWeekMin: undefined,
  hoursPerWeekMax: undefined,
  generatedPosterUrl: undefined,
  posterConfiguration: undefined,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
 
// ─────────────────────────────────────────────────────────────────────────────
// Suite: create() dan publishVacancy()
// ─────────────────────────────────────────────────────────────────────────────
 
describe('VacancyService — create() dan publishVacancy()', () => {
  let service: VacancyService;
  let vacancyRepository: any;
  let recruitmentPipelineService: any;
 
  beforeEach(async () => {
    vacancyRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };
 
    recruitmentPipelineService = {
      getDefaultTemplate: jest.fn(),
      createFromTemplate: jest.fn(),
    };
 
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacancyService,
        { provide: getRepositoryToken(Vacancy), useValue: vacancyRepository },
        { provide: getRepositoryToken(Application), useValue: {} },
        { provide: RecruitmentPipelineService, useValue: recruitmentPipelineService },
      ],
    }).compile();
 
    service = module.get<VacancyService>(VacancyService);
  });
 
  afterEach(() => jest.clearAllMocks());
 
  // ─────────────────────────────────────────────────────────────────────────────
  // UTC-87 s.d. UTC-91: create()
  // ─────────────────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('[UTC-87] vacancy yang berhasil dibuat harus berstatus DRAFT secara default', async () => {
      recruitmentPipelineService.getDefaultTemplate.mockResolvedValue({ id: 'tpl-1' });
      recruitmentPipelineService.createFromTemplate.mockResolvedValue({ id: 'pipe-1' });
 
      const savedVacancy = { id: 'vac-new' };
      vacancyRepository.create.mockReturnValue(savedVacancy);
      vacancyRepository.save.mockResolvedValue(savedVacancy);
 
      const vacancyWithRelations = makeVacancyWithRelations({ status: JobStatus.DRAFT });
      vacancyRepository.findOne.mockResolvedValue(vacancyWithRelations);
 
      const result = await service.create({ title: 'Backend Developer' } as any, 'user-hr');
 
      expect(result.status).toBe(JobStatus.DRAFT);
    });
 
    it('[UTC-88] createFromTemplate dipanggil dengan id template default dan nama pipeline yang dibentuk dari judul vacancy', async () => {
      const defaultTemplate = { id: 'tpl-default' };
      recruitmentPipelineService.getDefaultTemplate.mockResolvedValue(defaultTemplate);
      recruitmentPipelineService.createFromTemplate.mockResolvedValue({ id: 'pipe-new' });
 
      vacancyRepository.create.mockReturnValue({ id: 'vac-88' });
      vacancyRepository.save.mockResolvedValue({ id: 'vac-88' });
      vacancyRepository.findOne.mockResolvedValue(makeVacancyWithRelations({ id: 'vac-88', title: 'Data Engineer' }));
 
      await service.create({ title: 'Data Engineer' } as any, 'user-admin');
 
      expect(recruitmentPipelineService.createFromTemplate).toHaveBeenCalledWith(
        'tpl-default',
        'user-admin',
        'Data Engineer - Pipeline',
      );
    });
 
    it('[UTC-89] BadRequestException dilempar jika tidak ada default template yang dikonfigurasi', async () => {
      recruitmentPipelineService.getDefaultTemplate.mockResolvedValue(null);
 
      await expect(
        service.create({ title: 'QA Engineer' } as any, 'user-hr'),
      ).rejects.toThrow(BadRequestException);
    });
 
    it('[UTC-90] error non-NestJS (mis. DB connection lost) di-wrap menjadi BadRequestException dengan pesan "Failed to create vacancy"', async () => {
      recruitmentPipelineService.getDefaultTemplate.mockResolvedValue({ id: 'tpl-1' });
      recruitmentPipelineService.createFromTemplate.mockResolvedValue({ id: 'pipe-1' });
      vacancyRepository.create.mockReturnValue({ id: 'vac-90' });
      vacancyRepository.save.mockRejectedValue(new Error('DB connection lost'));
 
      const error = await service
        .create({ title: 'DevOps' } as any, 'user-hr')
        .catch((e) => e);
 
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toContain('Failed to create vacancy');
    });
 
    it('[UTC-91] NotFoundException dari layer pipeline service di-re-throw apa adanya (tidak di-wrap menjadi BadRequestException)', async () => {
      recruitmentPipelineService.getDefaultTemplate.mockResolvedValue({ id: 'tpl-1' });
      recruitmentPipelineService.createFromTemplate.mockRejectedValue(
        new NotFoundException('Template pipeline tidak ditemukan'),
      );
 
      await expect(
        service.create({ title: 'Mobile Dev' } as any, 'user-hr'),
      ).rejects.toThrow(NotFoundException);
    });
  });
 
  // ─────────────────────────────────────────────────────────────────────────────
  // UTC-92 s.d. UTC-96: publishVacancy()
  // ─────────────────────────────────────────────────────────────────────────────
  describe('publishVacancy', () => {
    it('[UTC-92] vacancy DRAFT yang sudah punya jobCode berhasil di-publish; status pada response menjadi PUBLISHED', async () => {
      // preCheck
      vacancyRepository.findOne
        .mockResolvedValueOnce(makeVacancyWithRelations({ status: JobStatus.DRAFT, jobCode: 'JOB-001' }))
        // reload setelah update
        .mockResolvedValueOnce(makeVacancyWithRelations({ status: JobStatus.PUBLISHED, jobCode: 'JOB-001' }));
 
      vacancyRepository.update.mockResolvedValue({ affected: 1 });
 
      const result = await service.publishVacancy('vac-new', 'user-hr');
 
      expect(result.status).toBe(JobStatus.PUBLISHED);
    });
 
    it('[UTC-93] BadRequestException dilempar jika vacancy belum memiliki jobCode sebelum di-publish', async () => {
      vacancyRepository.findOne.mockResolvedValue(
        makeVacancyWithRelations({ status: JobStatus.DRAFT, jobCode: null as any }),
      );
 
      await expect(service.publishVacancy('vac-93', 'user-hr')).rejects.toThrow(BadRequestException);
    });
 
    it('[UTC-94] NotFoundException dilempar jika vacancy dengan id yang diberikan tidak ditemukan', async () => {
      vacancyRepository.findOne.mockResolvedValue(null);
 
      await expect(service.publishVacancy('vac-tidak-ada', 'user-hr')).rejects.toThrow(NotFoundException);
    });
 
    it('[UTC-95] BadRequestException dilempar jika vacancy bukan berstatus DRAFT (mis. sudah PUBLISHED atau CLOSED)', async () => {
      // preCheck — sudah PUBLISHED (ada jobCode)
      vacancyRepository.findOne
        .mockResolvedValueOnce(makeVacancyWithRelations({ status: JobStatus.PUBLISHED, jobCode: 'JOB-001' }))
        // fallback findOne untuk pesan error
        .mockResolvedValueOnce(makeVacancyWithRelations({ status: JobStatus.PUBLISHED, jobCode: 'JOB-001' }));
 
      // update tidak match (WHERE status=DRAFT tidak cocok) → affected 0
      vacancyRepository.update.mockResolvedValue({ affected: 0 });
 
      await expect(service.publishVacancy('vac-95', 'user-hr')).rejects.toThrow(BadRequestException);
    });
 
    it('[UTC-96] vacancyRepository.update dipanggil dengan updatedById yang benar saat publish berhasil', async () => {
      vacancyRepository.findOne
        .mockResolvedValueOnce(makeVacancyWithRelations({ status: JobStatus.DRAFT, jobCode: 'JOB-001' }))
        .mockResolvedValueOnce(makeVacancyWithRelations({ status: JobStatus.PUBLISHED, jobCode: 'JOB-001' }));
 
      vacancyRepository.update.mockResolvedValue({ affected: 1 });
 
      await service.publishVacancy('vac-new', 'user-manager');
 
      expect(vacancyRepository.update).toHaveBeenCalledWith(
        { id: 'vac-new', status: JobStatus.DRAFT },
        { status: JobStatus.PUBLISHED, updatedById: 'user-manager' },
      );
    });
  });
});