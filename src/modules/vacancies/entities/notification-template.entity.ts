import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { StageTemplate } from "./stage-template.entity";

@Entity("notification_templates")
export class NotificationTemplate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @ManyToOne(() => StageTemplate)
  @JoinColumn({ name: "stage_template_id" })
  stageTemplate: StageTemplate;

  @Column({ name: "stage_template_id", nullable: true })
  stageTemplateId: string;

  @Column({ type: "varchar", length: 100 })
  triggerEvent: string;

  @Column({ type: "text" })
  subjectTemplate: string;

  @Column({ type: "text" })
  bodyTemplate: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
