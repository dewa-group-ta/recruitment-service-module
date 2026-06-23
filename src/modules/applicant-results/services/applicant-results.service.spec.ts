// src/modules/applicant-results/services/applicant-results.service.spec.ts

// PENTING: jest.mock harus diletakkan sebelum semua import agar hoisting bekerja dengan benar
jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
  }));
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import FormData from 'form-data';

import { ApplicantResultsService } from './applicant-results.service';
import { EvaluationResult } from '../entities/evaluation-results.entity';
import { Application } from '../../applicants/entities/application.entity';
import { Vacancy } from '../../vacancies/entities/vacancy.entity';
import { ApplicantEducation } from '../../applicants/entities/applicant-education.entity';
import { ApplicantJobHistory } from '../../applicants/entities/applicant-job-history.entity';
import { MinioService } from '../../../shared/services/minio.service';
import { EducationLevel } from '../../../shared/enums/job-status.enum';

describe('ApplicantResultsService', () => {
  let service: ApplicantResultsService;
  let httpService: HttpService;
  let applicationRepository: any;
  let evaluationResultRepository: any;
  let minioService: any;

  // Mock EntityManager yang dipakai di dalam dataSource.transaction(async (manager) => {...})
  const mockManager = {
    delete: jest.fn(),
    softDelete: jest.fn(),
    save: jest.fn((_entity, data) => Promise.resolve(data)),
  };

  beforeEach(async () => {
    applicationRepository = { findOne: jest.fn() };
    evaluationResultRepository = { findOne: jest.fn() };
    minioService = { getFileBuffer: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantResultsService,
        {
          provide: DataSource,
          useValue: { transaction: jest.fn((cb) => cb(mockManager)) },
        },
        { provide: HttpService, useValue: { post: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:8000') },
        },
        { provide: MinioService, useValue: minioService },
        { provide: getRepositoryToken(EvaluationResult), useValue: evaluationResultRepository },
        { provide: getRepositoryToken(Application), useValue: applicationRepository },
        { provide: getRepositoryToken(Vacancy), useValue: {} },
        { provide: getRepositoryToken(ApplicantEducation), useValue: {} },
        { provide: getRepositoryToken(ApplicantJobHistory), useValue: {} },
      ],
    }).compile();

    service = module.get<ApplicantResultsService>(ApplicantResultsService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => jest.clearAllMocks());

  // ───────────────────────────────────────────────────────────────────────────
  // INTI SKOR SHORTLIST: MAX cosine similarity (UTC-38 s.d. UTC-42, UTC-53, UTC-54)
  // ───────────────────────────────────────────────────────────────────────────
  describe('saveResults — kalkulasi maxExperienceScore', () => {
    it('[UTC-38] harus mengambil nilai MAX similarity dari beberapa entri pengalaman sebagai maxExperienceScore', async () => {
      const scoringResult = {
        application_id: 'app-1',
        educations: [],
        experience: [
          { role: 'Staff Gudang', description: 'Mengelola gudang', start: '01-2021', end: '01-2022', duration_years: 1, similarity: 0.12 },
          { role: 'Backend Developer', description: 'Membangun REST API', start: '01-2022', end: '01-2023', duration_years: 1, similarity: 0.91 },
        ],
      } as any;

      await service.saveResults(scoringResult, 'applicant-1');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];

      expect(savedEvalResult.maxExperienceScore).toBe(0.91);
      expect(savedEvalResult.applicationId).toBe('app-1');
    });

    it('[UTC-39] harus menyimpan maxExperienceScore = 0 jika kandidat tidak punya pengalaman kerja sama sekali', async () => {
      const scoringResult = { application_id: 'app-2', educations: [], experience: [] } as any;

      await service.saveResults(scoringResult, 'applicant-2');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.maxExperienceScore).toBe(0);
    });

    it('[UTC-40] harus tetap menghitung MAX dengan benar walau ada entri tanpa similarity (treated as 0)', async () => {
      const scoringResult = {
        application_id: 'app-3',
        educations: [],
        experience: [
          { role: 'Tanpa skor', description: 'X', start: null, end: null, duration_years: null, similarity: null },
          { role: 'Ada skor', description: 'Y', start: null, end: null, duration_years: null, similarity: 0.45 },
        ],
      } as any;

      await service.saveResults(scoringResult, 'applicant-3');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.maxExperienceScore).toBe(0.45);
    });

    it('[UTC-41] harus menyimpan snapshot educations & experience persis seperti diterima dari FastAPI (tanpa modifikasi nilai)', async () => {
      const scoringResult = {
        application_id: 'app-4',
        educations: [{ level: 3, major: 'Sistem Informasi', institution: 'Universitas X' }],
        experience: [{ role: 'QA Engineer', description: 'Menguji aplikasi', start: '01-2020', end: '01-2021', duration_years: 1, similarity: 0.55 }],
      } as any;

      await service.saveResults(scoringResult, 'applicant-4');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.evaluateDetail.educations).toEqual(scoringResult.educations);
      expect(savedEvalResult.evaluateDetail.experience).toEqual(scoringResult.experience);
    });

    it('[UTC-42] harus melakukan soft delete data pendidikan & pengalaman lama sebelum menyimpan hasil scoring baru', async () => {
      const scoringResult = { application_id: 'app-5', educations: [], experience: [] } as any;

      await service.saveResults(scoringResult, 'applicant-5');

      expect(mockManager.softDelete).toHaveBeenCalledWith(ApplicantEducation, { applicantId: 'applicant-5' });
      expect(mockManager.softDelete).toHaveBeenCalledWith(ApplicantJobHistory, { applicantId: 'applicant-5' });
    });

    it('[UTC-53] harus tetap menemukan MAX yang benar walau entri similarity tertinggi berada di tengah array', async () => {
      const scoringResult = {
        application_id: 'app-53',
        educations: [],
        experience: [
          { role: 'A', similarity: 0.30, description: '', start: null, end: null, duration_years: null },
          { role: 'B', similarity: 0.95, description: '', start: null, end: null, duration_years: null },
          { role: 'C', similarity: 0.60, description: '', start: null, end: null, duration_years: null },
        ],
      } as any;

      await service.saveResults(scoringResult, 'applicant-53');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.maxExperienceScore).toBe(0.95);
    });

    it('[UTC-54] harus menghapus baris EvaluationResult lama untuk applicationId yang sama sebelum menyimpan hasil baru (cegah duplikasi saat re-scoring)', async () => {
      const scoringResult = { application_id: 'app-54', educations: [], experience: [] } as any;

      await service.saveResults(scoringResult, 'applicant-54');

      expect(mockManager.delete).toHaveBeenCalledWith(EvaluationResult, { applicationId: 'app-54' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PENDIDIKAN: murni mapping tampilan, BUKAN komponen skor (UTC-43 s.d. UTC-45)
  // ───────────────────────────────────────────────────────────────────────────
  describe('mapEducationLevel — pendidikan sebagai data tampilan saja', () => {
    it('[UTC-43] harus memetakan level numerik 3 ke EducationLevel.BACHELOR', async () => {
      const scoringResult = {
        application_id: 'app-6',
        educations: [{ level: 3, major: 'Teknik Informatika', institution: 'Universitas X' }],
        experience: [],
      } as any;

      await service.saveResults(scoringResult, 'applicant-6');

      const savedEducations = mockManager.save.mock.calls.find((c) => c[0] === ApplicantEducation)?.[1];
      expect(savedEducations[0].level).toBe(EducationLevel.BACHELOR);
    });

    it('[UTC-44] harus mengembalikan null jika level pendidikan tidak ada dalam mapping (mis. 99)', async () => {
      const scoringResult = {
        application_id: 'app-7',
        educations: [{ level: 99, major: 'Tidak diketahui', institution: 'Entah' }],
        experience: [],
      } as any;

      await service.saveResults(scoringResult, 'applicant-7');

      const savedEducations = mockManager.save.mock.calls.find((c) => c[0] === ApplicantEducation)?.[1];
      expect(savedEducations[0].level).toBeNull();
    });

    it('[UTC-45] pendidikan tidak boleh memengaruhi nilai maxExperienceScore walau ada beberapa entri', async () => {
      const scoringResult = {
        application_id: 'app-8',
        educations: [
          { level: 1, major: 'A', institution: 'X' },
          { level: 5, major: 'B', institution: 'Y' },
        ],
        experience: [{ role: 'Dev', description: 'Z', start: null, end: null, duration_years: null, similarity: 0.6 }],
      } as any;

      await service.saveResults(scoringResult, 'applicant-8');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      // skor harus tetap 0.6 (dari experience), tidak terpengaruh jumlah/level pendidikan
      expect(savedEvalResult.maxExperienceScore).toBe(0.6);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ORKESTRASI: panggilan ke FastAPI (UTC-46 s.d. UTC-48, UTC-51, UTC-52)
  // ───────────────────────────────────────────────────────────────────────────
  describe('runScoring', () => {
    it('[UTC-46] harus melempar NotFoundException jika application tidak ditemukan', async () => {
      applicationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.runScoring('app-not-exist', 'cv/path.pdf', 'application/pdf')
      ).rejects.toThrow(NotFoundException);
    });

    it('[UTC-47] harus mengirim job_responsibilities dari vacancy dan mengembalikan hasil scoring dari FastAPI', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 'app-9',
        vacancy: { responsibilities: 'Membangun REST API dengan Node.js' },
      });
      minioService.getFileBuffer.mockResolvedValue(Buffer.from('dummy pdf'));

      const fastApiResponse = {
        application_id: 'app-9',
        educations: [],
        experience: [{ role: 'Backend Developer', similarity: 0.8, description: '', start: '', end: '', duration_years: 1 }],
      };
      (httpService.post as jest.Mock).mockReturnValue(of({ data: fastApiResponse }));

      const result = await service.runScoring('app-9', 'cv/path.pdf', 'application/pdf');

      expect(result).toEqual(fastApiResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/parse-and-evaluate/'),
        expect.anything(),
        expect.objectContaining({ timeout: 120_000 }),
      );
    });

    it('[UTC-48] harus melempar InternalServerErrorException jika FastAPI gagal dihubungi', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 'app-10',
        vacancy: { responsibilities: 'Backend Developer' },
      });
      minioService.getFileBuffer.mockResolvedValue(Buffer.from('dummy pdf'));
      (httpService.post as jest.Mock).mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

      await expect(
        service.runScoring('app-10', 'cv/path.pdf', 'application/pdf')
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('[UTC-51] callFastApiScoring harus mengirim job_responsibilities="" jika vacancy.responsibilities null/undefined', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 'app-51',
        vacancy: { responsibilities: null }, // HR belum mengisi field ini
      });
      minioService.getFileBuffer.mockResolvedValue(Buffer.from('dummy pdf'));
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: { application_id: 'app-51', educations: [], experience: [] } }),
      );

      await service.runScoring('app-51', 'cv/path.pdf', 'application/pdf');

      const formInstance = (FormData as unknown as jest.Mock).mock.results[0].value;
      expect(formInstance.append).toHaveBeenCalledWith('job_responsibilities', '');
    });

    it('[UTC-52] runScoring harus tetap melempar error asli jika file CV tidak ditemukan di MinIO, bukan ditelan diam-diam', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 'app-52',
        vacancy: { responsibilities: 'Backend Developer' },
      });
      minioService.getFileBuffer.mockRejectedValue(new Error('NoSuchKey: file tidak ditemukan di bucket'));

      await expect(
        service.runScoring('app-52', 'cv/hilang.pdf', 'application/pdf'),
      ).rejects.toThrow('NoSuchKey: file tidak ditemukan di bucket');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // QUERY HASIL EVALUASI (UTC-49 s.d. UTC-50)
  // ───────────────────────────────────────────────────────────────────────────
  describe('getEvaluationResult', () => {
    it('[UTC-49] harus melempar NotFoundException jika hasil evaluasi belum tersedia', async () => {
      evaluationResultRepository.findOne.mockResolvedValue(null);
      await expect(service.getEvaluationResult('app-11')).rejects.toThrow(NotFoundException);
    });

    it('[UTC-50] harus mengembalikan hasil evaluasi jika ditemukan', async () => {
      const mockResult = { applicationId: 'app-12', maxExperienceScore: 0.5 };
      evaluationResultRepository.findOne.mockResolvedValue(mockResult);

      const result = await service.getEvaluationResult('app-12');
      expect(result).toEqual(mockResult);
    });
  });
});