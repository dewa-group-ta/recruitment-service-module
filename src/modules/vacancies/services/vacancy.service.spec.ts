// src/modules/vacancies/services/vacancy.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
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