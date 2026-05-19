import { ApiProperty } from "@nestjs/swagger";
import { EvaluationDecision } from "../entities/evaluation-results.entity";
import { EducationLevel } from "src/shared/enums/job-status.enum";

// ── Sub-DTO: Breakdown Pendidikan ─────────────────────────────────────────────

export class ScoreDetailEducationEntryDto {
  @ApiProperty({ enum: EducationLevel, nullable: true })
  level!: EducationLevel | null;

  @ApiProperty({ example: "Teknik Informatika", nullable: true })
  major!: string | null;

  @ApiProperty({ example: 1.0 })
  levelScore!: number;

  @ApiProperty({ example: 0.85 })
  majorSimilarity!: number;
}

export class ScoreDetailEducationDto {
  @ApiProperty({ enum: EducationLevel, nullable: true })
  selectedLevel!: EducationLevel | null;

  @ApiProperty({ example: "Teknik Informatika", nullable: true })
  selectedMajor!: string | null;

  @ApiProperty({ example: 1.0 })
  levelScore!: number;

  @ApiProperty({ example: 0.85 })
  majorSimilarity!: number;

  @ApiProperty({ type: () => [ScoreDetailEducationEntryDto] })
  entries!: ScoreDetailEducationEntryDto[];
}

// ── Sub-DTO: Breakdown Pengalaman ─────────────────────────────────────────────

export class ScoreDetailExperienceEntryDto {
  @ApiProperty({ example: "Full-Stack Developer", nullable: true })
  role!: string | null;

  @ApiProperty({ example: 1.0, nullable: true })
  durationYears!: number | null;

  @ApiProperty({ example: 0.82, nullable: true })
  similarityScore!: number | null;

  @ApiProperty({ example: true, nullable: true })
  isRelevant!: boolean | null;
}

export class ScoreDetailExperienceDto {
  @ApiProperty({ example: 1.0 })
  durationScore!: number;

  @ApiProperty({ example: 0.72 })
  avgSimilarity!: number;

  @ApiProperty({ example: 2.0 })
  relevantDurationYears!: number;

  @ApiProperty({ type: () => [ScoreDetailExperienceEntryDto] })
  entries!: ScoreDetailExperienceEntryDto[];
}

// ── Sub-DTO: Breakdown Skill ──────────────────────────────────────────────────

export class ScoreDetailSkillDto {
  @ApiProperty({
    type: [String],
    example: ["NestJS", "PostgreSQL", "Docker"],
    description: "Skill yang disyaratkan lowongan"
  })
  vacancySkills!: string[];

  @ApiProperty({
    type: [String],
    example: ["PHP", "Laravel", "Node.js", "PostgreSQL"],
    description: "Skill yang dimiliki pelamar hasil parsing CV"
  })
  applicantSkills!: string[];

  @ApiProperty({
    type: [String],
    example: ["PostgreSQL"],
    description: "Skill yang cocok (interseksi)"
  })
  matchedSkills!: string[];

  @ApiProperty({
    example: 0.2,
    description: "Jaccard score = |interseksi| / |gabungan|"
  })
  jaccardScore!: number;
}

// ── Sub-DTO: Score Detail (full breakdown) ────────────────────────────────────

export class ScoreDetailDto {
  @ApiProperty({ type: () => ScoreDetailEducationDto })
  education!: ScoreDetailEducationDto;

  @ApiProperty({ type: () => ScoreDetailExperienceDto })
  experience!: ScoreDetailExperienceDto;

  @ApiProperty({ type: () => ScoreDetailSkillDto })
  skill!: ScoreDetailSkillDto;
}

// ── Root DTO: Evaluation Result ───────────────────────────────────────────────

export class EvaluationResultResponseDto {
  @ApiProperty({ example: "uuid-..." })
  id!: string;

  @ApiProperty({ example: "uuid-..." })
  applicationId!: string;

  @ApiProperty({ example: 0.85, nullable: true, description: "Bobot WSM: 20%" })
  educationScore!: number | null;

  @ApiProperty({ example: 0.72, nullable: true, description: "Bobot WSM: 50%" })
  experienceScore!: number | null;

  @ApiProperty({ example: 0.79, nullable: true, description: "Bobot WSM: 30%" })
  skillScore!: number | null;

  @ApiProperty({
    example: 0.762,
    nullable: true,
    description: "Skor akhir WSM: (0.20 × edu) + (0.50 × exp) + (0.30 × skill)"
  })
  totalScore!: number | null;

  @ApiProperty({ enum: EvaluationDecision, nullable: true })
  decision!: EvaluationDecision | null;

  @ApiProperty({ type: () => ScoreDetailDto, nullable: true })
  scoreDetail!: ScoreDetailDto | null;

  @ApiProperty({ nullable: true })
  evaluatedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}