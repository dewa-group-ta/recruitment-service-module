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
import { Vacancy } from "../../vacancies/entities/vacancy.entity";

@Entity("recruitment_pipelines")
export class RecruitmentPipeline {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 20, default: "1.0" })
  version: string;

  @Column({ type: "boolean", default: false })
  isDefault: boolean;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "boolean", default: false })
  isTemplate: boolean;

  @Column({ type: "varchar", length: 100, nullable: true })
  category: string; // engineering, marketing, sales, etc.

  @Column({ type: "int", default: 0 })
  usageCount: number; // berapa kali template ini digunakan

  @Column({ name: "created_by" })
  createdById: string;

  // Relations
  @OneToMany(() => PipelineStage, (stage) => stage.pipeline, {
    cascade: true,
    eager: true
  })
  stages: PipelineStage[];

  @OneToMany(() => Vacancy, (vacancy) => vacancy.pipeline)
  vacancies: Vacancy[];

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
  