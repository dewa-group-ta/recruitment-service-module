// src/modules/candidates/services/candidates.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { Application } from '../../applicants/entities/application.entity';
import { Applicant } from '../../applicants/entities/applicant.entity';
import { Vacancy } from '../../vacancies/entities/vacancy.entity';
import { PipelineStage } from '../../vacancies/entities/pipeline-stage.entity';
import { StageActivity } from '../../vacancies/entities/stage-activity.entity';
import { ApplicationNotes } from '../../applicants/entities/application-notes.entity';
import { EvaluationResult } from '../../applicant-results/entities/evaluation-results.entity';
import { File } from '../../../shared/entities/file.entity';
import { NotificationService } from '../../../shared/services/notification.service';
import { MinioService } from '../../../shared/services/minio.service';

// ─────────────────────────────────────────────────────────────────────────────
// Mock application minimal yang memenuhi semua field yang diakses
// transformToApplicantTableItem: application.applicant, application.vacancy,
// application.currentStage, application.status, application.isTalentPool, dll.
// ─────────────────────────────────────────────────────────────────────────────
function makeApplication(id: string): any {
  return {
    id,
    status: 'applied',
    isTalentPool: false,
    appliedAt: new Date(),
    lastActivityAt: null,
    currentScore: null,
    source: null,
    expectedStartDate: null,
    coverLetter: null,
    currentStage: null,
    applicant: {
      id: `cand-${id}`,
      fullName: 'Test Kandidat',
      email: `test-${id}@mail.com`,
      phone: '0800',
      photoUrl: null,
      dateOfBirth: null,
    },
    vacancy: {
      id: 'vac-1',
      title: 'Backend Developer',
      status: 'published',
      department: null,
      officeAddresses: [],
    },
  };
}

// Helper: bikin mock QueryBuilder TypeORM yang chainable
function createMockQueryBuilder(applications: any[], total: number) {
  const qb: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(total),
    getMany: jest.fn().mockResolvedValue(applications),
  };
  qb.clone = jest.fn().mockReturnValue(qb);
  return qb;
}

describe('CandidatesService', () => {
  let service: CandidatesService;
  let applicationRepository: any;
  let evaluationResultRepository: any;
  let fileRepository: any;

  beforeEach(async () => {
    applicationRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };
    evaluationResultRepository = { find: jest.fn(), findOne: jest.fn() };
    fileRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        { provide: getRepositoryToken(Application), useValue: applicationRepository },
        { provide: getRepositoryToken(Applicant), useValue: {} },
        { provide: getRepositoryToken(Vacancy), useValue: {} },
        { provide: getRepositoryToken(PipelineStage), useValue: {} },
        { provide: getRepositoryToken(StageActivity), useValue: {} },
        { provide: getRepositoryToken(ApplicationNotes), useValue: {} },
        { provide: getRepositoryToken(EvaluationResult), useValue: evaluationResultRepository },
        { provide: getRepositoryToken(File), useValue: fileRepository },
        { provide: DataSource, useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: MinioService, useValue: { getFileUrl: jest.fn() } },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ───────────────────────────────────────────────────────────────────────────
  // SORTING TABEL PEMERINGKATAN (UTC-70 s.d. UTC-73, UTC-83)
  // ───────────────────────────────────────────────────────────────────────────
  describe('getApplicantsTable — sorting berdasarkan Skor Shortlist', () => {
    it('[UTC-70] harus LEFT JOIN ke evaluation_results dan sort DESC + NULLS LAST saat sortBy=maxExperienceScore', async () => {
      const qb = createMockQueryBuilder(
        [makeApplication('app-1'), makeApplication('app-2')],
        2,
      );
      applicationRepository.createQueryBuilder.mockReturnValue(qb);
      evaluationResultRepository.find.mockResolvedValue([
        { applicationId: 'app-1', maxExperienceScore: 0.91 },
        { applicationId: 'app-2', maxExperienceScore: null },
      ]);

      await service.getApplicantsTable({ sortBy: 'maxExperienceScore', sortOrder: 'desc' } as any);

      expect(qb.leftJoin).toHaveBeenCalledWith(
        EvaluationResult,
        'evalSort',
        expect.stringContaining('evalSort.applicationId = application.id'),
      );
      expect(qb.orderBy).toHaveBeenCalledWith('evalSort.maxExperienceScore', 'DESC', 'NULLS LAST');
    });

    it('[UTC-71] kandidat tanpa hasil evaluasi harus mendapat maxExperienceScore = null pada hasil akhir', async () => {
      const qb = createMockQueryBuilder([makeApplication('app-3')], 1);
      applicationRepository.createQueryBuilder.mockReturnValue(qb);
      evaluationResultRepository.find.mockResolvedValue([]); // belum ada hasil scoring

      const result = await service.getApplicantsTable({ sortBy: 'maxExperienceScore', sortOrder: 'desc' } as any);

      expect(result.data[0].maxExperienceScore).toBeNull();
    });

    it('[UTC-72] harus sort by kolom biasa (mis. name) tanpa LEFT JOIN ke evaluation_results', async () => {
      const qb = createMockQueryBuilder([], 0);
      applicationRepository.createQueryBuilder.mockReturnValue(qb);
      evaluationResultRepository.find.mockResolvedValue([]);

      await service.getApplicantsTable({ sortBy: 'name', sortOrder: 'asc' } as any);

      expect(qb.orderBy).toHaveBeenCalledWith('applicant.fullName', 'ASC');
      expect(qb.leftJoin).not.toHaveBeenCalled();
    });

    it('[UTC-73] harus tetap menerapkan filter vacancyId saat menampilkan pemeringkatan per lowongan', async () => {
      const qb = createMockQueryBuilder([], 0);
      applicationRepository.createQueryBuilder.mockReturnValue(qb);
      evaluationResultRepository.find.mockResolvedValue([]);

      await service.getApplicantsTable({ vacancyId: 'vac-1', sortBy: 'maxExperienceScore', sortOrder: 'desc' } as any);

      expect(qb.andWhere).toHaveBeenCalledWith('application.vacancyId = :vacancyId', { vacancyId: 'vac-1' });
    });

    it('[UTC-83] skor harus terpasang ke applicationId yang benar saat ada beberapa kandidat (verifikasi integritas pemetaan, bukan asumsi urutan array)', async () => {
      const qb = createMockQueryBuilder(
        [makeApplication('app-x'), makeApplication('app-y'), makeApplication('app-z')],
        3,
      );
      applicationRepository.createQueryBuilder.mockReturnValue(qb);
      // Sengaja dikembalikan TIDAK seurutan dengan application di atas,
      // dan app-y sengaja tidak punya hasil evaluasi sama sekali
      evaluationResultRepository.find.mockResolvedValue([
        { applicationId: 'app-z', maxExperienceScore: 0.30 },
        { applicationId: 'app-x', maxExperienceScore: 0.99 },
      ]);

      const result = await service.getApplicantsTable({ sortBy: 'maxExperienceScore', sortOrder: 'desc' } as any);

      const scoreOf = (id: string) => result.data.find((d: any) => d.id === id)?.maxExperienceScore;
      expect(scoreOf('app-x')).toBe(0.99);
      expect(scoreOf('app-z')).toBe(0.30);
      expect(scoreOf('app-y')).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // MAPPING KOLOM SORT (UTC-74 s.d. UTC-79)
  // akses private method untuk verifikasi mapping murni
  // ───────────────────────────────────────────────────────────────────────────
  describe('getSortField — mapping nama kolom sort', () => {
    it('[UTC-74] sortBy="name" harus dipetakan ke "applicant.fullName"', () => {
      const result = (service as any).getSortField('name');
      expect(result).toBe('applicant.fullName');
    });

    it('[UTC-75] sortBy="applyDate" harus dipetakan ke "application.appliedAt"', () => {
      const result = (service as any).getSortField('applyDate');
      expect(result).toBe('application.appliedAt');
    });

    it('[UTC-76] sortBy="currentScore" harus dipetakan ke "application.currentScore"', () => {
      const result = (service as any).getSortField('currentScore');
      expect(result).toBe('application.currentScore');
    });

    it('[UTC-77] sortBy="stage" harus dipetakan ke "stageTemplate.name"', () => {
      const result = (service as any).getSortField('stage');
      expect(result).toBe('stageTemplate.name');
    });

    it('[UTC-78] sortBy dengan kolom tidak dikenal harus fallback ke "application.appliedAt" (default)', () => {
      const result = (service as any).getSortField('kolom_tidak_dikenal');
      expect(result).toBe('application.appliedAt');
    });

    it('[UTC-79] harus mengembalikan null untuk sortBy=maxExperienceScore (ditangani khusus via LEFT JOIN, bukan kolom biasa)', () => {
      const result = (service as any).getSortField('maxExperienceScore');
      expect(result).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // isTopMatch: entri pengalaman mana yang jadi dasar Skor Shortlist (UTC-80 s.d. UTC-82, UTC-84 s.d. UTC-86)
  // ───────────────────────────────────────────────────────────────────────────
  describe('getCandidateDetail — isTopMatch pada breakdown pengalaman', () => {
    const baseApplication = {
      id: 'app-20',
      applicationNumber: 'TECH-BE-001',
      status: 'applied',
      appliedAt: new Date(),
      currentScore: null,
      coverLetter: null,
      expectedStartDate: null,
      source: null,
      isTalentPool: false,
      currentStage: null,
      vacancy: null,
      applicant: {
        id: 'cand-20',
        fullName: 'Budi Santoso',
        email: 'budi@mail.com',
        phone: '0800',
        gender: null,
        placeOfBirth: null,
        dateOfBirth: null,
        availability: null,
        linkedinUrl: null,
        portfolioUrl: null,
        socialMediaUrl: null,
        photoUrl: null,
        educations: [],
        jobHistories: [],
        addresses: [],
      },
    };

    beforeEach(() => {
      fileRepository.findOne.mockResolvedValue(null); // tidak ada file CV → skip pemanggilan MinIO
    });

    it('[UTC-80] hanya entri dengan similarity == maxExperienceScore yang ditandai isTopMatch=true', async () => {
      applicationRepository.findOne.mockResolvedValue(baseApplication);
      evaluationResultRepository.findOne.mockResolvedValue({
        maxExperienceScore: 0.91,
        decision: null,
        evaluatedAt: new Date(),
        evaluateDetail: {
          experience: [
            { role: 'Staff Gudang', similarity: 0.12, description: '', start: '', end: '', duration_years: 1 },
            { role: 'Backend Developer', similarity: 0.91, description: '', start: '', end: '', duration_years: 1 },
          ],
          educations: [],
        },
      });

      const result = await service.getCandidateDetail('app-20');
      const breakdown = result.evaluationResult!.scoringBreakdown!;

      expect(breakdown.experiences.find((e) => e.role === 'Backend Developer')!.isTopMatch).toBe(true);
      expect(breakdown.experiences.find((e) => e.role === 'Staff Gudang')!.isTopMatch).toBe(false);
    });

    it('[UTC-81] isTopMatch tetap valid walau ada selisih floating point kecil (toleransi < 0.0001)', async () => {
      applicationRepository.findOne.mockResolvedValue(baseApplication);
      evaluationResultRepository.findOne.mockResolvedValue({
        maxExperienceScore: 0.91,
        decision: null,
        evaluatedAt: new Date(),
        evaluateDetail: {
          experience: [
            { role: 'Backend Developer', similarity: 0.9100001, description: '', start: '', end: '', duration_years: 1 },
          ],
          educations: [],
        },
      });

      const result = await service.getCandidateDetail('app-20');
      expect(result.evaluationResult!.scoringBreakdown!.experiences[0].isTopMatch).toBe(true);
    });

    it('[UTC-82] jika belum ada hasil evaluasi, scoringBreakdown harus null tanpa error', async () => {
      applicationRepository.findOne.mockResolvedValue(baseApplication);
      evaluationResultRepository.findOne.mockResolvedValue(null);

      const result = await service.getCandidateDetail('app-20');
      expect(result.evaluationResult).toBeNull();
    });

    it('[UTC-84] harus melempar NotFoundException jika application tidak ditemukan', async () => {
      applicationRepository.findOne.mockResolvedValue(null);
      await expect(service.getCandidateDetail('app-tidak-ada')).rejects.toThrow(NotFoundException);
    });

    it('[UTC-85] evaluateDetail yang tersimpan sebagai JSON string (bukan object) harus tetap berhasil di-parse dan breakdown tetap benar', async () => {
      applicationRepository.findOne.mockResolvedValue(baseApplication);
      evaluationResultRepository.findOne.mockResolvedValue({
        maxExperienceScore: 0.7,
        decision: null,
        evaluatedAt: new Date(),
        evaluateDetail: JSON.stringify({
          experience: [
            { role: 'Backend Developer', similarity: 0.7, description: '', start: '', end: '', duration_years: 1 },
          ],
          educations: [],
        }),
      });

      const result = await service.getCandidateDetail('app-20');
      const breakdown = result.evaluationResult!.scoringBreakdown!;

      expect(breakdown.experiences[0].role).toBe('Backend Developer');
      expect(breakdown.experiences[0].isTopMatch).toBe(true);
    });

    it('[UTC-86] scoringBreakdown.experiences harus berupa array kosong (bukan error) jika evaluateDetail.experience tidak ada', async () => {
      applicationRepository.findOne.mockResolvedValue(baseApplication);
      evaluationResultRepository.findOne.mockResolvedValue({
        maxExperienceScore: 0,
        decision: null,
        evaluatedAt: new Date(),
        evaluateDetail: { educations: [] }, // tidak ada key 'experience' sama sekali
      });

      const result = await service.getCandidateDetail('app-20');
      expect(result.evaluationResult!.scoringBreakdown!.experiences).toEqual([]);
    });
  });
});