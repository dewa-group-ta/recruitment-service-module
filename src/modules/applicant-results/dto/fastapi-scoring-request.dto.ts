import { EducationLevel } from "../../../shared/enums/job-status.enum";

/**
 * Payload yang dikirim NestJS ke FastAPI Scoring Service.
 * Tidak divalidasi class-validator karena ini adalah internal service-to-service call.
 * Didefinisikan sebagai plain interface/class untuk type-safety saat memanggil HttpService.
 */
export class FastApiScoringRequestDto {
  /** UUID lamaran — digunakan FastAPI untuk mengidentifikasi hasil yang dikembalikan */
  applicationId!: string;

  cvUrl!: string;

  requiredEducation!: EducationLevel | null;

  requiredExperienceYears!: number | null;

  relevantMajor!: string | null;

  roleDescription!: string | null;

  requiredSkills!: string[] | null;
}