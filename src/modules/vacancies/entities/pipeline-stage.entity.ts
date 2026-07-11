import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Check
} from "typeorm";
import { RecruitmentPipeline } from "./recruitment-pipeline.entity";
import { StageTemplate } from "./stage-template.entity";

@Entity("pipeline_stages")
@Unique(["pipeline", "stageOrder"])
@Check("stage_order > 0")
export class PipelineStage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => RecruitmentPipeline, (pipeline) => pipeline.stages, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "pipeline_id" })
  pipeline: RecruitmentPipeline;

  @Column({ name: "pipeline_id" })
  pipelineId: string;

  @ManyToOne(() => StageTemplate, (template) => template.pipelineStages, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "stage_template_id" })
  stageTemplate: StageTemplate;

  @Column({ name: "stage_template_id" })
  stageTemplateId: string;

  @Column({ name: "stage_order", type: "int" })
  stageOrder: number;

  @Column({ name: "estimated_duration_days", type: "int", nullable: true })
  estimatedDurationDays: number;

  @Column({ type: "boolean", default: true })
  sendNotification: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
