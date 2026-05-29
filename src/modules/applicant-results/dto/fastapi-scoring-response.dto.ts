// ─── cv_parsed ────────────────────────────────────────────────────────────────

export class FastApiEducationParsedDto {
  level!: number;
  major!: string;
  graduation_year!: number;
}

export class FastApiWorkExperienceDto {
  position!: string;
  company!: string;
  start_date!: string;
  end_date!: string | null;
  duration_years!: number;
  description!: string;
}

export class FastApiCvParsedDto {
  applicant_name!: string;
  educations!: FastApiEducationParsedDto[];
  work_experiences!: FastApiWorkExperienceDto[];
}

// ─── evaluation.details.experience ────────────────────────────────────────────

/**
 * Satu entri hasil scoring pengalaman.
 * FastAPI sekarang mengembalikan company + description langsung di sini
 * (enriched dari cv_parsed.work_experiences di sisi FastAPI),
 * sehingga NestJS tidak perlu cross-reference lagi.
 */
export class FastApiExperienceEntryDto {
  position!: string;
  company!: string;
  description!: string;
  similarity_score!: number;
}

export class FastApiExperienceDetailDto {
  method!: string;
  entries!: FastApiExperienceEntryDto[];
}

// ─── evaluation.details.education ─────────────────────────────────────────────

/**
 * Hasil evaluasi pendidikan menggunakan Rule-Based Level Matching.
 * Mencocokkan tingkat pendidikan tertinggi pelamar dengan
 * required_education_level dari vacancy.
 */
export class FastApiEducationEvaluationDto {
  method!: string;                  // "Rule-Based Level Matching"
  vacancy_required_level!: number;  // nilai numerik EducationLevel dari vacancy
  applicant_highest_level!: number; // nilai numerik EducationLevel tertinggi pelamar
  is_level_fulfilled!: boolean;     // true jika applicant_highest_level >= vacancy_required_level
}

// ─── evaluation ───────────────────────────────────────────────────────────────

export class FastApiEvaluationDetailsDto {
  experience!: FastApiExperienceDetailDto;
  education!: FastApiEducationEvaluationDto;
}

export class FastApiEvaluationDto {
  shortlist_score!: number;
  details!: FastApiEvaluationDetailsDto;
}

// ─── root ─────────────────────────────────────────────────────────────────────

export class FastApiScoringDataDto {
  application_id!: string;
  cv_parsed!: FastApiCvParsedDto;
  evaluation!: FastApiEvaluationDto;
}

export class FastApiScoringResponseDto {
  success!: boolean;
  message!: string;
  data!: FastApiScoringDataDto;
  error_code!: string | null;
  error_details!: string | null;
  metadata!: any | null;
}