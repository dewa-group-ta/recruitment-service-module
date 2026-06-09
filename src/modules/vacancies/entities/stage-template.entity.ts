import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany
} from "typeorm";
import { PipelineStage } from "./pipeline-stage.entity";

@Entity("stage_templates")
export class StageTemplate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "max_duration_days", type: "int", nullable: true })
  maxDurationDays: number;

  @Column({ type: "boolean", default: false })
  canNotify: boolean;

  @Column({ type: "boolean", default: false })
  canScore: boolean;

  @Column({ type: "text", nullable: true })
  instructions: string; // instruksi untuk HR di stage ini

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "varchar", length: 100, nullable: true })
  category: string; // engineering, marketing, sales, etc.

  @Column({ name: "created_by" })
  createdById: string;

  // Relations
  @OneToMany(() => PipelineStage, (stage) => stage.stageTemplate)
  pipelineStages: PipelineStage[];

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
