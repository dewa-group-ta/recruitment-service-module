import { ApiProperty } from "@nestjs/swagger";
import { EducationLevel } from "../../../shared/enums/job-status.enum";

// ── Sub-DTO: Pendidikan ───────────────────────────────────────────────────────

export class CvEducationHistoryResponseDto {
  @ApiProperty({ example: "uuid-..." })
  id!: string;

  @ApiProperty({
    enum: EducationLevel,
    nullable: true,
    description: "Jenjang pendidikan hasil ekstraksi LLM",
    example: EducationLevel.BACHELOR
  })
  level!: EducationLevel | null;

  @ApiProperty({ example: "Teknik Informatika", nullable: true })
  major!: string | null;

  @ApiProperty({ example: "Universitas Padjadjaran", nullable: true })
  institution!: string | null;

  @ApiProperty({ example: 2022, nullable: true })
  graduationYear!: number | null;
}

// ── Sub-DTO: Pengalaman Kerja ─────────────────────────────────────────────────

export class CvWorkExperienceResponseDto {
  @ApiProperty({ example: "uuid-..." })
  id!: string;

  @ApiProperty({ example: "Backend Developer", nullable: true })
  role!: string | null;

  @ApiProperty({ example: "PT. Contoh Sejahtera", nullable: true })
  company!: string | null;

  @ApiProperty({
    example: "Membangun REST API menggunakan NestJS dan PostgreSQL...",
    nullable: true
  })
  description!: string | null;

  @ApiProperty({ example: "Jan 2022", nullable: true })
  startDate!: string | null;

  @ApiProperty({ example: "Mar 2024", nullable: true })
  endDate!: string | null;

  @ApiProperty({
    example: 2.17,
    nullable: true,
    description: "Durasi dalam tahun. 0 jika < 12 bulan. null jika tidak dapat dihitung."
  })
  durationYears!: number | null;

  @ApiProperty({
    example: 0.72,
    nullable: true,
    description: "Cosine similarity terhadap role_description lowongan (0.0–1.0)"
  })
  similarityScore!: number | null;

  @ApiProperty({
    example: true,
    nullable: true,
    description: "true jika similarityScore >= 0.4, null jika belum dinilai"
  })
  isRelevant!: boolean | null;
}

// ── Root DTO: CV Document ─────────────────────────────────────────────────────

export class CvDocumentResponseDto {
  @ApiProperty({ example: "uuid-..." })
  id!: string;

  @ApiProperty({ example: "uuid-..." })
  applicationId!: string;

  @ApiProperty({ example: "Budi Santoso", nullable: true })
  applicantName!: string | null;

  @ApiProperty({
    type: [String],
    example: ["Node.js", "PostgreSQL", "Docker"],
    nullable: true,
    description: "Daftar skill hasil ekstraksi LLM"
  })
  skills!: string[] | null;

  @ApiProperty({ example: "2025-05-18T10:00:00Z", nullable: true })
  parsedAt!: Date | null;

  @ApiProperty({ type: () => [CvEducationHistoryResponseDto] })
  educations!: CvEducationHistoryResponseDto[];

  @ApiProperty({ type: () => [CvWorkExperienceResponseDto] })
  workExperiences!: CvWorkExperienceResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}