import { EducationLevel } from "../../../shared/enums/job-status.enum";

// ── Sub-DTO: Riwayat Pendidikan dari Hasil Parsing LLM ───────────────────────

export class FastApiParsedEducationDto {
  /**
   * Jenjang pendidikan hasil ekstraksi LLM, dalam representasi EducationLevel enum.
   * null jika tidak dapat ditentukan dari teks CV.
   */
  level!: EducationLevel | null;

  /** Bidang studi / jurusan. null jika tidak ditemukan. */
  major!: string | null;

  /** Nama institusi pendidikan. null jika tidak ditemukan. */
  institution!: string | null;

  /** Tahun kelulusan. null jika tidak ditemukan. */
  graduationYear!: number | null;
}

// ── Sub-DTO: Pengalaman Kerja dari Hasil Parsing + Penilaian LLM/SBERT ───────

export class FastApiParsedWorkExperienceDto {
  /** Nama posisi / jabatan. null jika tidak ditemukan. */
  role!: string | null;

  /** Nama perusahaan. null jika tidak ditemukan. */
  company!: string | null;

  /**
   * Deskripsi tanggung jawab — teks yang dikirim ke SBERT.
   * null jika tidak ditemukan.
   */
  description!: string | null;

  /**
   * Tanggal mulai dalam format string variatif.
   * contoh: "Jan 2022", "2022-01", "Januari 2022"
   * null jika tidak ditemukan.
   */
  startDate!: string | null;

  /**
   * Tanggal selesai dalam format string variatif.
   * contoh: "Mar 2024", "sekarang", "present"
   * null jika tidak ditemukan.
   */
  endDate!: string | null;

  /**
   * Durasi dalam satuan tahun, hasil kalkulasi postprocess FastAPI.
   * 0 jika durasi < 12 bulan. null jika tanggal tidak dapat dikomputasi.
   */
  durationYears!: number | null;

  /**
   * Cosine similarity antara deskripsi pengalaman ini dengan roleDescription lowongan.
   * Nilai 0.0 – 1.0. null jika roleDescription lowongan tidak tersedia.
   */
  similarityScore!: number | null;

  /**
   * true jika similarityScore >= threshold (0.4).
   * Hanya pengalaman relevan yang dihitung dalam experience_score.
   * null jika similarityScore tidak tersedia.
   */
  isRelevant!: boolean | null;
}

// ── Sub-DTO: Hasil Parsing CV ─────────────────────────────────────────────────

export class FastApiCvParsedDto {
  /** Nama pelamar hasil ekstraksi LLM. null jika tidak ditemukan. */
  applicantName!: string | null;

  /**
   * Daftar skill hasil ekstraksi LLM dalam canonical name.
   * Contoh: ["Node.js", "PostgreSQL", "Docker"]
   */
  skills!: string[];

  /** Riwayat pendidikan hasil parsing */
  educations!: FastApiParsedEducationDto[];

  /** Riwayat pengalaman kerja hasil parsing + penilaian relevansi SBERT */
  workExperiences!: FastApiParsedWorkExperienceDto[];
}

// ── Sub-DTO: Breakdown Detail Skor ────────────────────────────────────────────

export class FastApiScoreDetailEducationDto {
  /**
   * Skor jenjang pendidikan (Rule-Based).
   * Membandingkan level pelamar dengan requiredEducation lowongan.
   */
  levelScore!: number;

  /**
   * Cosine similarity antara jurusan pelamar dengan relevantMajor lowongan (SBERT).
   */
  majorSimilarity!: number;
}

export class FastApiScoreDetailExperienceDto {
  /**
   * Skor durasi pengalaman (Rule-Based).
   * Membandingkan total relevant_duration_years dengan requiredExperienceYears.
   */
  durationScore!: number;

  /**
   * Rata-rata similarityScore dari seluruh pengalaman yang is_relevant = true.
   */
  avgSimilarity!: number;

  /**
   * Total durasi (tahun) dari pengalaman yang diklasifikasikan relevan.
   */
  relevantDurationYears!: number;
}

export class FastApiScoreDetailSkillDto {
  /** String gabungan seluruh skill lowongan yang dikirim ke SBERT */
  vacancySkills!: string;

  /** String gabungan seluruh skill pelamar yang dikirim ke SBERT */
  applicantSkills!: string;

  /** Cosine similarity antara vacancySkills dan applicantSkills */
  similarityScore!: number;
}

export class FastApiScoreDetailDto {
  education!: FastApiScoreDetailEducationDto;
  experience!: FastApiScoreDetailExperienceDto;
  skill!: FastApiScoreDetailSkillDto;
}

// ── Sub-DTO: Skor Komponen dan Final ─────────────────────────────────────────

export class FastApiScoresDto {
  /**
   * Skor komponen pendidikan (0.0 – 1.0)
   * Bobot WSM: 15%
   */
  educationScore!: number;

  /**
   * Skor komponen pengalaman (0.0 – 1.0)
   * Bobot WSM: 50%
   */
  experienceScore!: number;

  /**
   * Skor komponen skill (0.0 – 1.0)
   * Bobot WSM: 35%
   */
  skillScore!: number;

  /**
   * Skor akhir WSM (0.0 – 1.0)
   * total = (0.15 * education) + (0.50 * experience) + (0.35 * skill)
   */
  totalScore!: number;

  /** Breakdown per sub-komponen */
  scoreDetail!: FastApiScoreDetailDto;
}

// ── Root DTO: Seluruh Payload yang Diterima dari FastAPI ──────────────────────

/**
 * Payload lengkap yang dikirim FastAPI Scoring Service ke NestJS setelah
 * proses parsing dan scoring selesai.
 *
 * NestJS menerima payload ini, memetakannya ke entitas, lalu menyimpannya ke database.
 */
export class FastApiScoringResponseDto {
  /** UUID lamaran — digunakan NestJS untuk mengidentifikasi record yang akan dibuat */
  applicationId!: string;

  /** Hasil parsing CV oleh LLM */
  cvParsed!: FastApiCvParsedDto;

  /** Hasil penilaian WSM + SBERT */
  scores!: FastApiScoresDto;
}