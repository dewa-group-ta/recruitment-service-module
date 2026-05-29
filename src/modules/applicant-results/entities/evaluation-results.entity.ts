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

  @Column({ name: "max_experience_score", type: "float", nullable: true })
  maxExperienceScore!: number;

  @Column({
        type: "enum",
        enum: EvaluationDecision,
        nullable: true
    })
    decision!: EvaluationDecision;

  // Snapshot hasil parsing dan scoring bendasarkan application pada saat evaluasi
  @Column({ name: "evaluate_detail", type: "json", nullable: true })
  evaluateDetail!: Record<string, any>;

  @Column({ name: "evaluated_at", type: "timestamp", nullable: true })
    evaluatedAt!: Date;

  @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}