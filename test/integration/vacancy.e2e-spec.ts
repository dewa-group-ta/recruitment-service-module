import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getHrToken } from '../helpers/auth';

describe('Integration — Vacancy Setup (ITC-01 s.d. ITC-05)', () => {
  let app: INestApplication;
  let hrToken: string;
  let vacancyId: string;
  const RESPONSIBILITIES_TEXT =
    'Membangun dan memelihara REST API menggunakan NestJS, berkolaborasi dengan tim frontend.';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    hrToken = getHrToken();
  });

  afterAll(async () => {
    await app.close();
  });

  it('[ITC-01] membuat lowongan baru sebagai draft', async () => {
    const res = await request(app.getHttpServer())
      .post('/vacancies')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ title: `Backend Developer ${Date.now()}` });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toEqual(expect.any(String));
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.pipelineId).toEqual(expect.any(String));

    vacancyId = res.body.data.id;
  });

  it('[ITC-02] update lowongan mengisi field responsibilities (sumber teks SBERT)', async () => {
    const res = await request(app.getHttpServer())
      .put(`/vacancies/${vacancyId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        jobCode: `BE-${Date.now()}`,
        responsibilities: RESPONSIBILITIES_TEXT,
        requirements: 'Min 2 tahun Node.js',
        employmentType: 'full_time',
        workModel: 'hybrid',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.responsibilities).toBe(RESPONSIBILITIES_TEXT);
  });

  it('[ITC-03] mempublish lowongan DRAFT ke PUBLISHED', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/vacancies/${vacancyId}/publish`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('published');
  });

  it('[ITC-04] daftar lowongan publik hanya menampilkan status PUBLISHED', async () => {
    // Precondition: buat 1 vacancy DRAFT tambahan untuk memastikan tidak ikut tampil
    const draftVacancy = await request(app.getHttpServer())
      .post('/vacancies')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ title: `Draft Tidak Boleh Tampil ${Date.now()}` });

    const res = await request(app.getHttpServer())
      .get('/public/vacancies') // lihat catatan: endpoint ini terbukti PASS di sistem nyata Anda,
      .query({ page: 1, limit: 50 }); // meski controller yg saya baca belum memuatnya

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const publishedItem = res.body.data.find((v: any) => v.id === vacancyId);
    expect(publishedItem).toBeDefined();
    expect(typeof publishedItem.responsibilities).toBe('string');

    const draftItem = res.body.data.find((v: any) => v.id === draftVacancy.body.data.id);
    expect(draftItem).toBeUndefined();
  });

  it('[ITC-05] detail lowongan publik menampilkan responsibilities identik dengan database', async () => {
    const res = await request(app.getHttpServer()).get(`/public/vacancies/${vacancyId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.responsibilities).toBe(RESPONSIBILITIES_TEXT);
  });
});

// Export vacancyId & responsibilities text agar bisa dipakai file lain kalau perlu.
// (Tidak dipakai langsung — quick-apply.e2e-spec.ts & ranking.e2e-spec.ts sengaja
// membuat vacancy SENDIRI via createPublishedVacancy() supaya tiap file independen
// dan tidak rapuh terhadap urutan eksekusi file lain.)