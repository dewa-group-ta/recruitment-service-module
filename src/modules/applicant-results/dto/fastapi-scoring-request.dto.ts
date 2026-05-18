import { EducationLevel } from "../../../shared/enums/job-status.enum";

/**
 * Payload yang dikirim NestJS ke FastAPI Scoring Service.
 * Tidak divalidasi class-validator karena ini adalah internal service-to-service call.
 * Didefinisikan sebagai plain interface/class untuk type-safety saat memanggil HttpService.
 */
export class FastApiScoringRequestDto {
  /** UUID lamaran — digunakan FastAPI untuk mengidentifikasi hasil yang dikembalikan */
  applicationId!: string;

  /** URL ke file CV yang diunggah */
  cvUrl!: string;

  // ── Data lowongan untuk keperluan penilaian ──────────────────────────────

  /** Jenjang pendidikan minimum yang disyaratkan lowongan (Rule-Based) */
  requiredEducation!: EducationLevel | null;

  /** Lama pengalaman kerja minimum yang disyaratkan (Rule-Based), dalam tahun */
  requiredExperienceYears!: number | null;

  /**
   * Bidang studi yang diharapkan — input SBERT komponen pendidikan
   * contoh: "Teknik Informatika", "Computer Science"
   */
  relevantMajor!: string | null;

  /**
   * Deskripsi peran yang diharapkan — input SBERT komponen pengalaman
   * Dicocokkan terhadap deskripsi tiap pengalaman kerja pelamar
   */
  roleDescription!: string | null;

  /**
   * Daftar skill yang disyaratkan lowongan
   * Akan digabung menjadi satu string, dihitung cosine similarity-nya
   * terhadap string gabungan skill pelamar
   */
  requiredSkills!: string[] | null;
}