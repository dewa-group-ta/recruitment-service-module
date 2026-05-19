import { EducationLevel } from "../../../shared/enums/job-status.enum";

// ── CV Parsed ─────────────────────────────────────────────────────────────────

export class FastApiParsedEducationDto {
  level!: EducationLevel | null;
  major!: string | null;
  institution!: string | null;
  graduationYear!: number | null;
}

export class FastApiParsedWorkExperienceDto {
  role!: string | null;
  company!: string | null;
  description!: string | null;
  startDate!: Date | null;
  endDate!: Date | null;
  durationYears!: number | null;
  similarityScore!: number | null;
  isRelevant!: boolean | null;
}

export class FastApiCvParsedDto {
  applicantName!: string | null;
  skills!: string[];
  educations!: FastApiParsedEducationDto[];
  workExperiences!: FastApiParsedWorkExperienceDto[];
}

// ── Score Detail ──────────────────────────────────────────────────────────────

export class FastApiScoreDetailEducationEntryDto {
  level!: EducationLevel | null;
  major!: string | null;
  levelScore!: number;
  majorSimilarity!: number;
}

export class FastApiScoreDetailEducationDto {
  selectedLevel!: EducationLevel | null;
  selectedMajor!: string | null;
  levelScore!: number;
  majorSimilarity!: number;
  entries!: FastApiScoreDetailEducationEntryDto[];
}

export class FastApiScoreDetailExperienceEntryDto {
  role!: string | null;
  durationYears!: number | null;
  similarityScore!: number | null;
  isRelevant!: boolean | null;
}

export class FastApiScoreDetailExperienceDto {
  durationScore!: number;
  avgSimilarity!: number;
  relevantDurationYears!: number;
  entries!: FastApiScoreDetailExperienceEntryDto[];
}

// Jaccard-based — bukan lagi string joined + cosine similarity
export class FastApiScoreDetailSkillDto {
  vacancySkills!: string[];
  applicantSkills!: string[];
  matchedSkills!: string[];
  jaccardScore!: number;
}

export class FastApiScoreDetailDto {
  education!: FastApiScoreDetailEducationDto;
  experience!: FastApiScoreDetailExperienceDto;
  skill!: FastApiScoreDetailSkillDto;
}

// ── Scores ────────────────────────────────────────────────────────────────────

export class FastApiScoresDto {
  /** Bobot WSM: 20% */
  educationScore!: number;

  /** Bobot WSM: 50% */
  experienceScore!: number;

  /** Bobot WSM: 30% — Jaccard similarity */
  skillScore!: number;

  /** total = (0.20 × edu) + (0.50 × exp) + (0.30 × skill) */
  totalScore!: number;

  scoreDetail!: FastApiScoreDetailDto;
}

// ── Root ──────────────────────────────────────────────────────────────────────

export class FastApiScoringResponseDto {
  applicationId!: string;
  cvParsed!: FastApiCvParsedDto;
  scores!: FastApiScoresDto;
}