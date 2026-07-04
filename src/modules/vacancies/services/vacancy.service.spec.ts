import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { VacancyService } from './vacancy.service';
import { Vacancy } from '../entities/vacancy.entity';
import { Application } from '../../applicants/entities/application.entity';
import { RecruitmentPipelineService } from './recruitment-pipeline.service';
import { JobStatus } from '../../../shared/enums/job-status.enum';

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

  // ═══════════════════════════════════════════════════════════════════════════
  // findOnePublic
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findOnePublic', () => {
    it('[UTC-140] harus mengembalikan responsibilities utuh tanpa modifikasi (teks ini yang dikirim sebagai job_responsibilities ke FastAPI)', async () => {
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

    it('[UTC-141] query harus mengombinasikan id DAN status=PUBLISHED (vacancy draft/closed tidak boleh terekspos publik, mencegah pelamar menargetkan lowongan yang belum/tidak dibuka)', async () => {
      vacancyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOnePublic('vac-draft')).rejects.toThrow(NotFoundException);
      expect(vacancyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'vac-draft', status: JobStatus.PUBLISHED },
        relations: ['jobCategory'],
      });
    });

    it('[UTC-142] harus melempar NotFoundException jika vacancy tidak ditemukan / belum published', async () => {
      vacancyRepository.findOne.mockResolvedValue(null);
      await expect(service.findOnePublic('vac-tidak-ada')).rejects.toThrow(NotFoundException);
    });

    it('[UTC-143] jika relasi jobCategory null, harus fallback ke objek kosong tanpa crash', async () => {
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

    it('[UTC-144] responsibilities null harus dikembalikan apa adanya — fallback ke string kosong terjadi di layer ApplicantResultsService (callFastApiScoring), bukan di sini', async () => {
      vacancyRepository.findOne.mockResolvedValue({
        id: 'vac-3', title: 'Posisi Tanpa Deskripsi Tugas', description: '', responsibilities: null,
        requirements: '', jobType: 'full_time', employmentType: 'permanent', workModel: 'remote',
        officeAddresses: [], endDate: null, startDate: null, requiredEducation: null,
        requiredExperienceYears: null, jobCategory: null, generatedPosterUrl: null,
        status: JobStatus.PUBLISHED, posterConfiguration: null,
      });

      const result = await service.findOnePublic('vac-3');
      expect(result.responsibilities).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findAllPublic
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAllPublic', () => {
    it('[UTC-145] harus hanya mengambil vacancy dengan status PUBLISHED', async () => {
      vacancyRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllPublic(1, 10);

      expect(vacancyRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: JobStatus.PUBLISHED } }),
      );
    });

    it('[UTC-146] select query wajib menyertakan field responsibilities (input scoring saat applicant melamar)', async () => {
      vacancyRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllPublic(1, 10);

      const callArg = vacancyRepository.findAndCount.mock.calls[0][0];
      expect(callArg.select.responsibilities).toBe(true);
    });

    it('[UTC-147] harus menghitung totalPages dengan benar berdasarkan total & limit', async () => {
      vacancyRepository.findAndCount.mockResolvedValue([[], 25]);

      const result = await service.findAllPublic(1, 10);

      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
    });

    it('[UTC-148] harus memfilter berdasarkan jobCategory jika parameter diberikan', async () => {
      vacancyRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllPublic(1, 10, 'cat-engineering');

      expect(vacancyRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: JobStatus.PUBLISHED, jobCategoryId: 'cat-engineering' } }),
      );
    });
  });
});