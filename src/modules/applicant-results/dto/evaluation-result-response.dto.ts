import { ApiProperty } from "@nestjs/swagger";
import { EvaluationDecision } from "../entities/evaluation-results.entity";

// ── Sub-DTO: Breakdown Pendidikan ─────────────────────────────────────────────

export class ScoreDetailEducationDto {
  @ApiProperty({
    example: 1.0,
    description: "Skor jenjang pendidikan (Rule-Based). 1.0 jika memenuhi, lebih rendah jika tidak."
  })
  levelScore!: number;

  @ApiProperty({
    example: 0.85,
    description: "Cosine similarity jurusan pelamar vs relevantMajor lowongan (SBERT)"
  })
  majorSimilarity!: number;
}

// ── Sub-DTO: Breakdown Pengalaman ─────────────────────────────────────────────

export class ScoreDetailExperienceDto {
  @ApiProperty({
    example: 0.75,
    description: "Skor durasi pengalaman relevan vs requiredExperienceYears (Rule-Based)"
  })
  durationScore!: number;

  @ApiProperty({
    example: 0.68,
    description: "Rata-rata similarityScore dari seluruh pengalaman yang is_relevant = true"
  })
  avgSimilarity!: number;

  @ApiProperty({
    example: 3.5,
    description: "Total durasi (tahun) dari pengalaman yang diklasifikasikan relevan"
  })
  relevantDurationYears!: number;
}

// ── Sub-DTO: Breakdown Skill ──────────────────────────────────────────────────

export class ScoreDetailSkillDto {
  @ApiProperty({
    example: "Node.js PostgreSQL Docker Kubernetes",
    description: "String gabungan seluruh skill lowongan yang dikirim ke SBERT"
  })
  vacancySkills!: string;

  @ApiProperty({
    example: "Node.js Express MongoDB Git",
    description: "String gabungan seluruh skill pelamar yang dikirim ke SBERT"
  })
  applicantSkills!: string;

  @ApiProperty({
    example: 0.79,
    description: "Cosine similarity antara vacancySkills dan applicantSkills"
  })
  similarityScore!: number;
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

  @ApiProperty({
    example: 0.85,
    nullable: true,
    description: "Skor komponen pendidikan (0.0–1.0). Bobot WSM: 15%"
  })
  educationScore!: number | null;

  @ApiProperty({
    example: 0.72,
    nullable: true,
    description: "Skor komponen pengalaman (0.0–1.0). Bobot WSM: 50%"
  })
  experienceScore!: number | null;

  @ApiProperty({
    example: 0.79,
    nullable: true,
    description: "Skor komponen skill (0.0–1.0). Bobot WSM: 35%"
  })
  skillScore!: number | null;

  @ApiProperty({
    example: 0.762,
    nullable: true,
    description: "Skor akhir WSM: (0.15 × edu) + (0.50 × exp) + (0.35 × skill)"
  })
  totalScore!: number | null;

  @ApiProperty({
    enum: EvaluationDecision,
    nullable: true,
    description: "Keputusan rekruter: 'lolos' | 'tidak_lolos' | null (belum ditentukan)"
  })
  decision!: EvaluationDecision | null;

  @ApiProperty({
    type: () => ScoreDetailDto,
    nullable: true,
    description: "Breakdown skor per sub-komponen"
  })
  scoreDetail!: ScoreDetailDto | null;

  @ApiProperty({ example: "2025-05-18T10:05:00Z", nullable: true })
  evaluatedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}