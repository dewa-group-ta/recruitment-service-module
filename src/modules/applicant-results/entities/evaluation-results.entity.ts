import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn
} from "typeorm";
import { Application } from "../../applicants/entities/application.entity";

export enum EvaluationDecision {
  PASSED = "lolos",
  FAILED = "tidak_lolos"
}

@Entity("evaluation_results")
export class EvaluationResult {
  @PrimaryGeneratedColumn("uuid")
    id!: string;

  @OneToOne(() => Application, { onDelete: "CASCADE" })
    @JoinColumn({ name: "application_id" })
    application!: Application;

  @Column({ name: "application_id", unique: true })
    applicationId!: string;

  /**
   * Skor komponen pendidikan (0.0 – 1.0)
   * Agregasi: level_score (Rule-Based, bobot intra 60%)
   *         + major_similarity (SBERT, bobot intra 40%)
   * Bobot WSM: 20%
   */
  @Column({ name: "education_score", type: "float", nullable: true })
  educationScore!: number;

  /**
   * Skor komponen pengalaman (0.0 – 1.0)
   * Agregasi: duration_score (Rule-Based, bobot intra 40%)
   *         + avg_similarity (SBERT, bobot intra 60%)
   * Bobot WSM: 50%
   */
  @Column({ name: "experience_score", type: "float", nullable: true })
  experienceScore!: number;

  /**
   * Skor komponen skill (0.0 – 1.0)
   * Mekanisme: Jaccard Similarity antara
   *   skill set lowongan (array) vs skill set pelamar (array)
   * jaccard = |interseksi| / |gabungan|
   * Bobot WSM: 30%
   */
  @Column({ name: "skill_score", type: "float", nullable: true })
  skillScore!: number;

  /**
   * Skor akhir WSM (0.0 – 1.0)
   * total_score = (0.20 * education) + (0.50 * experience) + (0.30 * skill)
   */
  @Column({ name: "total_score", type: "float", nullable: true })
  totalScore!: number;

  /**
   * Keputusan akhir yang ditetapkan rekruter — bukan otomatis sistem (BR-09)
   * null = belum ditentukan
   */
  @Column({
        type: "enum",
        enum: EvaluationDecision,
        nullable: true
    })
    decision!: EvaluationDecision;

  /**
   * Breakdown detail skor per sub-komponen
   * {
   *   education: {
   *     selected_level: EducationLevel,
   *     selected_major: string,
   *     level_score: float,
   *     major_similarity: float,
   *     entries: [{ level, major, level_score, major_similarity }]
   *   },
   *   experience: {
   *     duration_score: float,
   *     avg_similarity: float,
   *     relevant_duration_years: float,
   *     entries: [{ role, duration_years, similarity_score, is_relevant }]
   *   },
   *   skill: {
   *     vacancy_skills: string[],
   *     applicant_skills: string[],
   *     matched_skills: string[],
   *     jaccard_score: float
   *   }
   * }
   */
  @Column({ name: "score_detail", type: "json", nullable: true })
  scoreDetail!: Record<string, any>;

  @Column({ name: "evaluated_at", type: "timestamp", nullable: true })
    evaluatedAt!: Date;

  @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}