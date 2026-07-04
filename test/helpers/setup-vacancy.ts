import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export interface PublishedVacancy {
  vacancyId: string;
}

export async function createPublishedVacancy(
  app: INestApplication,
  hrToken: string,
  responsibilities: string,
  titleSuffix = '',
): Promise<PublishedVacancy> {
  const created = await request(app.getHttpServer())
    .post('/vacancies')
    .set('Authorization', `Bearer ${hrToken}`)
    .send({ title: `Backend Developer ${titleSuffix} ${Date.now()}`.trim() });

  if (created.status !== 201) {
    throw new Error(`Gagal membuat vacancy (status ${created.status}): ${JSON.stringify(created.body)}`);
  }
  const vacancyId = created.body.data.id;

  const updated = await request(app.getHttpServer())
    .put(`/vacancies/${vacancyId}`)
    .set('Authorization', `Bearer ${hrToken}`)
    .send({
      jobCode: `BE-${Date.now()}`,
      responsibilities,
      requirements: 'Min 2 tahun pengalaman',
      employmentType: 'full_time',
      workModel: 'hybrid',
    });

  if (updated.status !== 200) {
    throw new Error(`Gagal update vacancy (status ${updated.status}): ${JSON.stringify(updated.body)}`);
  }

  const published = await request(app.getHttpServer())
    .patch(`/vacancies/${vacancyId}/publish`)
    .set('Authorization', `Bearer ${hrToken}`);

  if (published.status !== 200) {
    throw new Error(`Gagal publish vacancy (status ${published.status}): ${JSON.stringify(published.body)}`);
  }

  return { vacancyId };
}