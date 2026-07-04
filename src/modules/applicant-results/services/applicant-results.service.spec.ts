// src/modules/applicant-results/services/applicant-results.service.spec.ts

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

  const mockManager = {
    findOne: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    save: jest.fn((_entity, data) => Promise.resolve(data)),
    create: jest.fn((_entity) => new EvaluationResult()),
  };

  beforeEach(async () => {
    applicationRepository = { findOne: jest.fn() };
    evaluationResultRepository = { findOne: jest.fn(), save: jest.fn() };
    minioService = { getFileBuffer: jest.fn() };

    mockManager.findOne.mockResolvedValue(null);

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

  // ═══════════════════════════════════════════════════════════════════════════
  // saveResults — dua cabang perilaku: UPDATE placeholder vs FALLBACK create
  // (REQ-FR-01-04: hasil pemeringkatan yang telah dihasilkan sebelumnya harus
  //  tersedia sejak submission, lewat placeholder EvaluationResult)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('saveResults — cabang placeholder vs fallback', () => {
    it('[UTC-79] jika placeholder EvaluationResult SUDAH ADA (dibuat saat quickApply), harus UPDATE in-place dan TIDAK memanggil delete', async () => {
      const existingPlaceholder: any = { applicationId: 'app-1', evaluateDetail: { experiences: [], educations: [] } };
      mockManager.findOne.mockResolvedValue(existingPlaceholder);

      const scoringResult = {
        application_id: 'app-1',
        educations: [],
        experience: [{ role: 'Backend Developer', description: 'Membangun API', start: '01-2022', end: '01-2023', duration_years: 1, similarity: 0.85 }],
      } as any;

      await service.saveResults(scoringResult, 'applicant-1');

      expect(mockManager.delete).not.toHaveBeenCalled();
      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult).toBe(existingPlaceholder);
      expect(savedEvalResult.maxExperienceScore).toBe(0.85);
    });

    it('[UTC-80] jika placeholder TIDAK DITEMUKAN (fallback), harus memanggil delete lalu membuat record BARU', async () => {
      mockManager.findOne.mockResolvedValue(null);

      const scoringResult = { application_id: 'app-2', educations: [], experience: [] } as any;

      await service.saveResults(scoringResult, 'applicant-2');

      expect(mockManager.delete).toHaveBeenCalledWith(EvaluationResult, { applicationId: 'app-2' });
      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.applicationId).toBe('app-2');
      expect(savedEvalResult.maxExperienceScore).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // saveResults — kalkulasi maxExperienceScore (inti REQ-FR-01-02/BR-06/BR-07)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('saveResults — kalkulasi maxExperienceScore', () => {
    it('[UTC-81] harus mengambil nilai MAX similarity dari beberapa entri pengalaman', async () => {
      const scoringResult = {
        application_id: 'app-3',
        educations: [],
        experience: [
          { role: 'Staff Gudang', description: 'Mengelola gudang', start: '01-2021', end: '01-2022', duration_years: 1, similarity: 0.12 },
          { role: 'Backend Developer', description: 'Membangun REST API', start: '01-2022', end: '01-2023', duration_years: 1, similarity: 0.91 },
        ],
      } as any;

      await service.saveResults(scoringResult, 'applicant-3');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.maxExperienceScore).toBe(0.91);
    });

    it('[UTC-82] entri tanpa similarity (null) harus diperlakukan sebagai 0 saat MAX dihitung', async () => {
      const scoringResult = {
        application_id: 'app-4',
        educations: [],
        experience: [
          { role: 'Tanpa skor', description: 'X', start: null, end: null, duration_years: null, similarity: null },
          { role: 'Ada skor', description: 'Y', start: null, end: null, duration_years: null, similarity: 0.45 },
        ],
      } as any;

      await service.saveResults(scoringResult, 'applicant-4');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.maxExperienceScore).toBe(0.45);
    });

    it('[UTC-83] harus tetap menemukan MAX yang benar walau entri tertinggi berada di tengah array', async () => {
      const scoringResult = {
        application_id: 'app-5',
        educations: [],
        experience: [
          { role: 'A', similarity: 0.30, description: '', start: null, end: null, duration_years: null },
          { role: 'B', similarity: 0.95, description: '', start: null, end: null, duration_years: null },
          { role: 'C', similarity: 0.60, description: '', start: null, end: null, duration_years: null },
        ],
      } as any;

      await service.saveResults(scoringResult, 'applicant-5');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.maxExperienceScore).toBe(0.95);
    });

    it('[UTC-84] harus menyimpan maxExperienceScore = 0 jika kandidat tidak punya pengalaman kerja sama sekali', async () => {
      const scoringResult = { application_id: 'app-6', educations: [], experience: [] } as any;

      await service.saveResults(scoringResult, 'applicant-6');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.maxExperienceScore).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // saveResults — integritas snapshot & housekeeping data lama
  // ═══════════════════════════════════════════════════════════════════════════
  describe('saveResults — snapshot & soft delete', () => {
    it('[UTC-85] harus menyimpan snapshot educations & experience persis seperti diterima dari FastAPI (tanpa modifikasi nilai)', async () => {
      const scoringResult = {
        application_id: 'app-7',
        educations: [{ level: 3, major: 'Sistem Informasi', institution: 'Universitas X' }],
        experience: [{ role: 'QA Engineer', description: 'Menguji aplikasi', start: '01-2020', end: '01-2021', duration_years: 1, similarity: 0.55 }],
      } as any;

      await service.saveResults(scoringResult, 'applicant-7');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.evaluateDetail.educations).toEqual(scoringResult.educations);
      expect(savedEvalResult.evaluateDetail.experience).toEqual(scoringResult.experience);
    });

    it('[UTC-86] harus melakukan soft delete data pendidikan & pengalaman lama sebelum menyimpan hasil scoring baru', async () => {
      const scoringResult = { application_id: 'app-8', educations: [], experience: [] } as any;

      await service.saveResults(scoringResult, 'applicant-8');

      expect(mockManager.softDelete).toHaveBeenCalledWith(ApplicantEducation, { applicantId: 'applicant-8' });
      expect(mockManager.softDelete).toHaveBeenCalledWith(ApplicantJobHistory, { applicantId: 'applicant-8' });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // saveResults — mapEducationLevel (pendidikan murni tampilan, BUKAN skor)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('saveResults — mapEducationLevel (bukan komponen skor)', () => {
    it('[UTC-87] harus memetakan level numerik 3 ke EducationLevel.BACHELOR', async () => {
      const scoringResult = {
        application_id: 'app-9',
        educations: [{ level: 3, major: 'Teknik Informatika', institution: 'Universitas X' }],
        experience: [],
      } as any;

      await service.saveResults(scoringResult, 'applicant-9');

      const savedEducations = mockManager.save.mock.calls.find((c) => c[0] === ApplicantEducation)?.[1];
      expect(savedEducations[0].level).toBe(EducationLevel.BACHELOR);
    });

    it('[UTC-88] harus mengembalikan null jika level pendidikan tidak ada dalam mapping (mis. 99)', async () => {
      const scoringResult = {
        application_id: 'app-10',
        educations: [{ level: 99, major: 'Tidak diketahui', institution: 'Entah' }],
        experience: [],
      } as any;

      await service.saveResults(scoringResult, 'applicant-10');

      const savedEducations = mockManager.save.mock.calls.find((c) => c[0] === ApplicantEducation)?.[1];
      expect(savedEducations[0].level).toBeNull();
    });

    it('[UTC-89] pendidikan tidak boleh memengaruhi maxExperienceScore walau ada beberapa entri (C-03)', async () => {
      const scoringResult = {
        application_id: 'app-11',
        educations: [
          { level: 1, major: 'A', institution: 'X' },
          { level: 5, major: 'B', institution: 'Y' },
        ],
        experience: [{ role: 'Dev', description: 'Z', start: null, end: null, duration_years: null, similarity: 0.6 }],
      } as any;

      await service.saveResults(scoringResult, 'applicant-11');

      const savedEvalResult = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(savedEvalResult.maxExperienceScore).toBe(0.6);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // parseMonthYear (private) — konversi format "MM-YYYY" dari FastAPI ke Date
  // ═══════════════════════════════════════════════════════════════════════════
  describe('parseMonthYear (private) — konsistensi format tanggal lintas boundary', () => {
    it('[UTC-90] format "MM-YYYY" valid harus dikonversi ke Date pada tanggal 1', () => {
      const result = (service as any).parseMonthYear('01-2024');
      expect(result).toEqual(new Date(2024, 0, 1));
    });

    it('[UTC-91] format tidak valid (bukan "MM-YYYY") harus mengembalikan null', () => {
      const result = (service as any).parseMonthYear('2024');
      expect(result).toBeNull();
    });

    it('[UTC-92] input null harus mengembalikan null tanpa error', () => {
      const result = (service as any).parseMonthYear(null);
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // runScoring — orkestrasi panggilan FastAPI /parse-and-evaluate (flow upload CV)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('runScoring', () => {
    it('[UTC-93] harus melempar NotFoundException jika application tidak ditemukan', async () => {
      applicationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.runScoring('app-not-exist', 'cv/path.pdf', 'application/pdf')
      ).rejects.toThrow(NotFoundException);
    });

    it('[UTC-94] harus mengirim job_responsibilities dari vacancy dan mengembalikan hasil scoring dari FastAPI apa adanya', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 'app-12',
        vacancy: { responsibilities: 'Membangun REST API dengan Node.js' },
      });
      minioService.getFileBuffer.mockResolvedValue(Buffer.from('dummy pdf'));

      const fastApiResponse = {
        application_id: 'app-12',
        educations: [],
        experience: [{ role: 'Backend Developer', similarity: 0.8, description: '', start: '', end: '', duration_years: 1 }],
      };
      (httpService.post as jest.Mock).mockReturnValue(of({ data: fastApiResponse }));

      const result = await service.runScoring('app-12', 'cv/path.pdf', 'application/pdf');

      expect(result).toEqual(fastApiResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/parse-and-evaluate/'),
        expect.anything(),
        expect.objectContaining({ timeout: 120_000 }),
      );
    });

    it('[UTC-95] BUG DITEMUKAN: URL yang dipanggil TIDAK memiliki trailing slash, padahal endpoint FastAPI adalah "/parse-and-evaluate/" (dengan slash). Berpotensi 307 redirect/404 tergantung konfigurasi FastAPI', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 'app-95', vacancy: { responsibilities: 'Backend Developer' },
      });
      minioService.getFileBuffer.mockResolvedValue(Buffer.from('dummy pdf'));
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: { application_id: 'app-95', educations: [], experience: [] } }),
      );

      await service.runScoring('app-95', 'cv/path.pdf', 'application/pdf');

      const calledUrl = (httpService.post as jest.Mock).mock.calls[0][0] as string;
      expect(calledUrl.endsWith('/parse-and-evaluate/')).toBe(true);
      expect(calledUrl.endsWith('/parse-and-evaluate')).toBe(false);
    });

    it('[UTC-96] harus mengirim job_responsibilities="" jika vacancy.responsibilities null/undefined', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 'app-96',
        vacancy: { responsibilities: null },
      });
      minioService.getFileBuffer.mockResolvedValue(Buffer.from('dummy pdf'));
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: { application_id: 'app-96', educations: [], experience: [] } }),
      );

      await service.runScoring('app-96', 'cv/path.pdf', 'application/pdf');

      const formInstance = (FormData as unknown as jest.Mock).mock.results[0].value;
      expect(formInstance.append).toHaveBeenCalledWith('job_responsibilities', '');
    });

    it('[UTC-97] harus melempar InternalServerErrorException jika FastAPI gagal dihubungi', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 'app-97', vacancy: { responsibilities: 'Backend Developer' },
      });
      minioService.getFileBuffer.mockResolvedValue(Buffer.from('dummy pdf'));
      (httpService.post as jest.Mock).mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

      await expect(
        service.runScoring('app-97', 'cv/path.pdf', 'application/pdf')
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('[UTC-98] harus tetap melempar error asli jika file CV tidak ditemukan di MinIO, bukan ditelan diam-diam', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 'app-98', vacancy: { responsibilities: 'Backend Developer' },
      });
      minioService.getFileBuffer.mockRejectedValue(new Error('NoSuchKey: file tidak ditemukan di bucket'));

      await expect(
        service.runScoring('app-98', 'cv/hilang.pdf', 'application/pdf'),
      ).rejects.toThrow('NoSuchKey: file tidak ditemukan di bucket');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // saveEvaluationError
  // ═══════════════════════════════════════════════════════════════════════════
  describe('saveEvaluationError', () => {
    it('[UTC-99] harus mengisi errorMessage pada placeholder yang sudah ada (update in-place)', async () => {
      const existing: any = { applicationId: 'app-104' };
      mockManager.findOne.mockResolvedValue(existing);

      await service.saveEvaluationError('app-104', 'FastAPI tidak dapat dihubungi');

      const saved = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(saved).toBe(existing);
      expect(saved.errorMessage).toBe('FastAPI tidak dapat dihubungi');
    });

    it('[UTC-100] harus membuat record BARU jika belum ada EvaluationResult sama sekali', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await service.saveEvaluationError('app-105', 'CV analysis failed');

      const saved = mockManager.save.mock.calls.find((c) => c[0] === EvaluationResult)?.[1];
      expect(saved.applicationId).toBe('app-105');
      expect(saved.errorMessage).toBe('CV analysis failed');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getEvaluationResult — query hasil evaluasi (REQ-FR-01-04)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getEvaluationResult', () => {
    it('[UTC-101] harus melempar NotFoundException jika hasil evaluasi belum tersedia', async () => {
      evaluationResultRepository.findOne.mockResolvedValue(null);
      await expect(service.getEvaluationResult('app-108')).rejects.toThrow(NotFoundException);
    });

    it('[UTC-102] harus mengembalikan hasil evaluasi jika ditemukan', async () => {
      const mockResult = { applicationId: 'app-109', maxExperienceScore: 0.5 };
      evaluationResultRepository.findOne.mockResolvedValue(mockResult);

      const result = await service.getEvaluationResult('app-109');
      expect(result).toEqual(mockResult);
    });
  });
});