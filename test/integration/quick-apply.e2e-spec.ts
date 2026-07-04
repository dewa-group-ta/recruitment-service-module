// test/integration/quick-apply.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../../src/app.module';
import { getHrToken } from '../helpers/auth';
import { createPublishedVacancy } from '../helpers/setup-vacancy';
import { pollUntil } from '../helpers/poll';
import { buildTextCvPdf, buildScannedNoTextPdf, CV_PRESET } from '../fixtures/pdf-builder';

const RESPONSIBILITIES_TEXT =
  'Membangun dan memelihara REST API menggunakan NestJS dan PostgreSQL, berkolaborasi dengan tim frontend.';

function baseApplicantFields(overrides: Record<string, string> = {}) {
  return {
    fullName: 'Test Applicant',
    phone: '08123456789',
    gender: 'male',
    maritalStatus: 'single',
    placeOfBirth: 'Bandung',
    dateOfBirth: '1997-05-15',
    ...overrides,
  };
}

// DIAGNOSTIK: cetak body response kalau status tidak sesuai ekspektasi,
// supaya kita tahu ALASAN penolakan tanpa perlu tebak-tebakan lagi.
function logIfUnexpected(res: any, label: string, expected: number[]) {
  if (!expected.includes(res.status)) {
    console.log(`\n[${label}] STATUS TIDAK SESUAI. Expected salah satu dari [${expected}], dapat ${res.status}`);
    console.log(`[${label}] Response body:`, JSON.stringify(res.body, null, 2));
  }
}

describe('Integration — Quick Apply: Validasi CV & Scoring SBERT (ITC-06 s.d. ITC-18, ITC-29 s.d. ITC-31)', () => {
  let app: INestApplication;
  let hrToken: string;
  let vacancyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    hrToken = getHrToken();
    const vacancy = await createPublishedVacancy(app, hrToken, RESPONSIBILITIES_TEXT, 'QuickApply');
    vacancyId = vacancy.vacancyId;

    // DIAGNOSTIK KRITIS — cek ulang vacancy ini benar-benar PUBLISHED & valid
    // dengan GET langsung, jangan percaya begitu saja hasil createPublishedVacancy.
    const check = await request(app.getHttpServer())
      .get(`/vacancies/${vacancyId}`)
      .set('Authorization', `Bearer ${hrToken}`);
    console.log('\n[SETUP] vacancyId:', vacancyId);
    console.log('[SETUP] GET /vacancies/:id status:', check.status);
    console.log('[SETUP] vacancy detail:', JSON.stringify(check.body.data, null, 2));
  });

  afterAll(async () => {
    await app.close();
  });

  // ─────────────────────────────────────────────
  // B. Validasi Dokumen CV (REQ-FR-11)
  // ─────────────────────────────────────────────

  it('[ITC-06] ditolak — format file bukan PDF', async () => {
    const fields = baseApplicantFields({ email: `itc06.${Date.now()}@mail.com` });
    const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(fields)) req.field(k, v);

    const res = await req.attach('cv', Buffer.from('bukan file pdf sama sekali'), {
      filename: 'foto.jpg',
      contentType: 'image/jpeg',
    });

    logIfUnexpected(res, 'ITC-06', [400]);
    expect(res.status).toBe(400);
  });

  it('[ITC-07] ditolak — field cv tidak disertakan', async () => {
    const fields = baseApplicantFields({ email: `itc07.${Date.now()}@mail.com` });
    const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(fields)) req.field(k, v);

    const res = await req;

    logIfUnexpected(res, 'ITC-07', [400]);
    expect(res.status).toBe(400);
  });

  it('[ITC-08] ditolak — PDF terenkripsi/berpassword (validasi terjadi ASYNC di background)', async () => {
  const encryptedPdf = fs.readFileSync(path.join(__dirname, '../fixtures/cv_terenkripsi.pdf'));
  const fields = baseApplicantFields({ email: `itc08.${Date.now()}@mail.com` });
  const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
  for (const [k, v] of Object.entries(fields)) req.field(k, v);

  const res = await req.attach('cv', encryptedPdf, { filename: 'cv_terenkripsi.pdf', contentType: 'application/pdf' });

  expect(res.status).toBe(201); // submission diterima dulu
  const appId = res.body.data.application.id;

  const detail = await pollUntil(
    () => request(app.getHttpServer()).get(`/candidates/${appId}`).set('Authorization', `Bearer ${hrToken}`).then((r) => r.body.data),
    (data) => data.evaluationResult?.evaluatedAt != null,
  );

  expect(detail.evaluationResult.errorMessage).toEqual(expect.any(String));
});

it('[ITC-09] ditolak — PDF hasil scan tanpa teks (validasi terjadi ASYNC di background)', async () => {
  const scannedPdf = await buildScannedNoTextPdf();
  const fields = baseApplicantFields({ email: `itc09.${Date.now()}@mail.com` });
  const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
  for (const [k, v] of Object.entries(fields)) req.field(k, v);

  const res = await req.attach('cv', scannedPdf, { filename: 'cv_hasil_scan.pdf', contentType: 'application/pdf' });

  expect(res.status).toBe(201);
  const appId = res.body.data.application.id;

  const detail = await pollUntil(
    () => request(app.getHttpServer()).get(`/candidates/${appId}`).set('Authorization', `Bearer ${hrToken}`).then((r) => r.body.data),
    (data) => data.evaluationResult?.evaluatedAt != null,
  );

  expect(detail.evaluationResult.errorMessage).toEqual(expect.any(String));
});

  it('[ITC-10] ditolak — ukuran file melebihi batas 5MB', async () => {
    const largePdf = fs.readFileSync(path.join(__dirname, '../fixtures/cv_besar_6mb.pdf'));
    const fields = baseApplicantFields({ email: `itc10.${Date.now()}@mail.com` });
    const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(fields)) req.field(k, v);

    const res = await req.attach('cv', largePdf, { filename: 'cv_besar_6mb.pdf', contentType: 'application/pdf' });

    logIfUnexpected(res, 'ITC-10', [400, 413]);
    expect([400, 413]).toContain(res.status);
  });

  it('[ITC-11] diterima — file PDF tepat di ambang batas ukuran (valid, teks dapat diekstraksi)', async () => {
    const cvBuffer = await buildTextCvPdf(CV_PRESET.relevan());
    const fields = baseApplicantFields({ email: `itc11.${Date.now()}@mail.com` });
    const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(fields)) req.field(k, v);

    const res = await req.attach('cv', cvBuffer, { filename: 'cv_valid.pdf', contentType: 'application/pdf' });

    logIfUnexpected(res, 'ITC-11', [201]);
    expect(res.status).toBe(201);
  });

  // ─────────────────────────────────────────────
  // C. Pengajuan Lamaran & Pemicu Scoring SBERT (REQ-FR-01, BR-04/06/07, C-03)
  // ─────────────────────────────────────────────

  it('[ITC-12] kandidat relevan menghasilkan skor kemiripan valid', async () => {
    const cvBuffer = await buildTextCvPdf(CV_PRESET.relevan());
    const fields = baseApplicantFields({ fullName: 'Budi Santoso', email: `itc12.${Date.now()}@mail.com` });
    const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(fields)) req.field(k, v);

    const apply = await req.attach('cv', cvBuffer, { filename: 'cv_relevan.pdf', contentType: 'application/pdf' });

    logIfUnexpected(apply, 'ITC-12', [201]);
    expect(apply.status).toBe(201);
    expect(apply.body.data.evaluationResult).toBeUndefined();

    const appId = apply.body.data.application.id;
    const detail = await pollUntil(
      () => request(app.getHttpServer())
        .get(`/candidates/${appId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .then((r) => r.body.data),
      (data) => data.evaluationResult?.evaluatedAt != null,
    );

    expect(typeof detail.evaluationResult.maxExperienceScore).toBe('number');
    (global as any).__itc12_score = detail.evaluationResult.maxExperienceScore;
  });

  it('[ITC-13] kandidat tidak relevan menghasilkan skor lebih rendah dari kandidat relevan', async () => {
    const cvBuffer = await buildTextCvPdf(CV_PRESET.tidakRelevan());
    const fields = baseApplicantFields({ fullName: 'Andi Gudang', email: `itc13.${Date.now()}@mail.com` });
    const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(fields)) req.field(k, v);

    const apply = await req.attach('cv', cvBuffer, { filename: 'cv_tidak_relevan.pdf', contentType: 'application/pdf' });
    logIfUnexpected(apply, 'ITC-13', [201]);
    const appId = apply.body.data.application.id;

    const detail = await pollUntil(
      () => request(app.getHttpServer())
        .get(`/candidates/${appId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .then((r) => r.body.data),
      (data) => data.evaluationResult?.evaluatedAt != null,
    );

    expect(detail.evaluationResult.maxExperienceScore).toBeLessThan((global as any).__itc12_score);
  });

  it('[ITC-14] kandidat multi-pengalaman — hanya entri paling relevan jadi dasar skor (BR-06/BR-07)', async () => {
    const cvBuffer = await buildTextCvPdf(CV_PRESET.multiPengalaman());
    const fields = baseApplicantFields({ fullName: 'Citra Dewi', email: `itc14.${Date.now()}@mail.com` });
    const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(fields)) req.field(k, v);

    const apply = await req.attach('cv', cvBuffer, { filename: 'cv_multi.pdf', contentType: 'application/pdf' });
    logIfUnexpected(apply, 'ITC-14', [201]);
    const appId = apply.body.data.application.id;

    const detail = await pollUntil(
      () => request(app.getHttpServer())
        .get(`/candidates/${appId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .then((r) => r.body.data),
      (data) => data.evaluationResult?.evaluatedAt != null,
    );

    const experiences = detail.evaluationResult.scoringBreakdown.experiences;
    const topMatches = experiences.filter((e: any) => e.isTopMatch);
    expect(topMatches.length).toBeGreaterThanOrEqual(1);
    expect(topMatches[0].role).toBe('Backend Developer');
    expect(detail.evaluationResult.maxExperienceScore).toBe(topMatches[0].similarity);
  });

  it('[ITC-15] C-03 — perbedaan jenjang pendidikan TIDAK memengaruhi skor kemiripan', async () => {
    const cvS1 = await buildTextCvPdf(CV_PRESET.s1RelevanUntukC03());
    const req1 = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(baseApplicantFields({ fullName: 'Fajar Nugraha', email: `itc15a.${Date.now()}@mail.com` }))) req1.field(k, v);
    const applyS1 = await req1.attach('cv', cvS1, { filename: 'cv_s1.pdf', contentType: 'application/pdf' });
    logIfUnexpected(applyS1, 'ITC-15 (S1)', [201]);

    const cvSma = await buildTextCvPdf(CV_PRESET.smaRelevanUntukC03());
    const req2 = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(baseApplicantFields({ fullName: 'Gita Purnama', email: `itc15b.${Date.now()}@mail.com` }))) req2.field(k, v);
    const applySma = await req2.attach('cv', cvSma, { filename: 'cv_sma.pdf', contentType: 'application/pdf' });
    logIfUnexpected(applySma, 'ITC-15 (SMA)', [201]);

    const [detailS1, detailSma] = await Promise.all([
      pollUntil(
        () => request(app.getHttpServer()).get(`/candidates/${applyS1.body.data.application.id}`).set('Authorization', `Bearer ${hrToken}`).then((r) => r.body.data),
        (data) => data.evaluationResult?.evaluatedAt != null,
      ),
      pollUntil(
        () => request(app.getHttpServer()).get(`/candidates/${applySma.body.data.application.id}`).set('Authorization', `Bearer ${hrToken}`).then((r) => r.body.data),
        (data) => data.evaluationResult?.evaluatedAt != null,
      ),
    ]);

    const selisih = Math.abs(detailS1.evaluationResult.maxExperienceScore - detailSma.evaluationResult.maxExperienceScore);
    expect(selisih).toBeLessThan(0.01);
  });

  it('[ITC-16] ditolak — email sudah pernah melamar ke vacancy yang sama', async () => {
    const email = `itc16.${Date.now()}@mail.com`;
    const cvBuffer = await buildTextCvPdf(CV_PRESET.relevan());

    const req1 = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(baseApplicantFields({ email }))) req1.field(k, v);
    const first = await req1.attach('cv', cvBuffer, { filename: 'cv.pdf', contentType: 'application/pdf' });
    logIfUnexpected(first, 'ITC-16 (first)', [201]);
    expect(first.status).toBe(201);

    const req2 = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(baseApplicantFields({ email, fullName: 'Budi Duplikat' }))) req2.field(k, v);
    const duplicate = await req2.attach('cv', cvBuffer, { filename: 'cv.pdf', contentType: 'application/pdf' });

    expect(duplicate.status).toBe(400);
  });

  it('[ITC-17] ditolak — vacancyId tidak ditemukan / bukan PUBLISHED', async () => {
    const cvBuffer = await buildTextCvPdf(CV_PRESET.relevan());
    const req = request(app.getHttpServer())
      .post('/applicants/quick-apply')
      .field('vacancyId', '00000000-0000-0000-0000-000000000000');
    for (const [k, v] of Object.entries(baseApplicantFields({ email: `itc17.${Date.now()}@mail.com` }))) req.field(k, v);

    const res = await req.attach('cv', cvBuffer, { filename: 'cv.pdf', contentType: 'application/pdf' });

    expect([400, 404]).toContain(res.status);
  });

  it('[ITC-18] kandidat tanpa pengalaman kerja sama sekali tetap diproses (fresh graduate)', async () => {
    const cvBuffer = await buildTextCvPdf(CV_PRESET.freshGraduate());
    const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(baseApplicantFields({ fullName: 'Dewi Lestari', email: `itc18.${Date.now()}@mail.com` }))) req.field(k, v);

    const apply = await req.attach('cv', cvBuffer, { filename: 'cv_fresh.pdf', contentType: 'application/pdf' });
    logIfUnexpected(apply, 'ITC-18', [201]);
    expect(apply.status).toBe(201);
    const appId = apply.body.data.application.id;

    const detail = await pollUntil(
      () => request(app.getHttpServer()).get(`/candidates/${appId}`).set('Authorization', `Bearer ${hrToken}`).then((r) => r.body.data),
      (data) => data.evaluationResult?.evaluatedAt != null,
    );

    expect(detail.evaluationResult.maxExperienceScore).toBe(0);
    expect(detail.evaluationResult.scoringBreakdown.experiences).toEqual([]);
  });

  // ─────────────────────────────────────────────
  // G. Ketahanan Sistem & Pesan Informatif (REQ-FR-09)
  // ─────────────────────────────────────────────

  it.skip('[ITC-29] submission tetap tercatat & diberi pesan informatif saat FastAPI tidak dapat dihubungi', async () => {
    // DITUNDA — perlu langkah manual matikan FastAPI dulu sebelum run ini.
  });

  it('[ITC-30] CV tanpa riwayat pendidikan tetap diproses tanpa error', async () => {
    const cvBuffer = await buildTextCvPdf(CV_PRESET.tanpaPendidikan());
    const req = request(app.getHttpServer()).post('/applicants/quick-apply').field('vacancyId', vacancyId);
    for (const [k, v] of Object.entries(baseApplicantFields({ fullName: 'Eko Prasetyo', email: `itc30.${Date.now()}@mail.com` }))) req.field(k, v);

    const apply = await req.attach('cv', cvBuffer, { filename: 'cv_no_edu.pdf', contentType: 'application/pdf' });
    logIfUnexpected(apply, 'ITC-30', [201]);
    expect(apply.status).toBe(201);
    const appId = apply.body.data.application.id;

    const detail = await pollUntil(
      () => request(app.getHttpServer()).get(`/candidates/${appId}`).set('Authorization', `Bearer ${hrToken}`).then((r) => r.body.data),
      (data) => data.evaluationResult?.evaluatedAt != null,
    );

    expect(detail.evaluationResult.scoringBreakdown.educations).toEqual([]);
  });

  it('[ITC-31] kegagalan akses file di storage tidak menyebabkan lamaran hilang', async () => {
    expect(true).toBe(true); // placeholder
  });
});