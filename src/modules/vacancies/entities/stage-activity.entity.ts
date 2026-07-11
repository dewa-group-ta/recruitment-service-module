import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Application } from "../../applicants/entities/application.entity";
import { PipelineStage } from "./pipeline-stage.entity";
import { StageActivityStatus } from "../../../shared/enums/pipeline.enum";

@Entity("stage_activities")
export class StageActivity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: "application_id" })
  application: Application;

  @Column({ name: "application_id" })
  applicationId: string;

  @ManyToOne(() => PipelineStage)
  @JoinColumn({ name: "stage_id" })
  stage: PipelineStage;

  @Column({ name: "stage_id" })
  stageId: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  score?: number;

  @Column({ name: "performed_by", nullable: true })
  performedBy: string;

  @Column({
    type: "enum",
    enum: StageActivityStatus,
    default: StageActivityStatus.PENDING,
    name: "status"
  })
  status: StageActivityStatus;

  @CreateDateColumn({ name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
