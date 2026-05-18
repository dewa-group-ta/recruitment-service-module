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
   * Bobot WSM: 15%
   */
  @Column({ name: "education_score", type: "float", nullable: true })
    educationScore!: number;

  /**
   * Skor komponen pengalaman (0.0 – 1.0)
   * Agregasi: duration_score (Rule-Based, bobot intra 40%)
   *         + relevance_similarity (SBERT, bobot intra 60%)
   * Bobot WSM: 50%
   */
  @Column({ name: "experience_score", type: "float", nullable: true })
    experienceScore!: number;

  /**
   * Skor komponen skill (0.0 – 1.0)
   * Mekanisme: seluruh skill lowongan digabung menjadi satu string,
   * seluruh skill pelamar digabung menjadi satu string,
   * lalu dihitung cosine similarity antar keduanya menggunakan SBERT.
   * Bobot WSM: 35%
   */
  @Column({ name: "skill_score", type: "float", nullable: true })
    skillScore!: number;

  /**
   * Skor akhir WSM (0.0 – 1.0)
   * total_score = (0.15 * education) + (0.50 * experience) + (0.35 * skill)
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
   * Breakdown detail skor per sub-komponen dalam format JSON
   * Struktur:
   * {
   *   education: {
   *     level_score: float,
   *     major_similarity: float
   *   },
   *   experience: {
   *     duration_score: float,
   *     avg_similarity: float,
   *     relevant_duration_years: float
   *   },
   *   skill: {
   *     vacancy_skills: string,
   *     applicant_skills: string,
   *     similarity_score: float
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