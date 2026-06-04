import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from "typeorm";
import { Vacancy } from "../../vacancies/entities/vacancy.entity";
import { Applicant } from "./applicant.entity";
import { RecruitmentPipeline } from "../../vacancies/entities/recruitment-pipeline.entity";
import { PipelineStage } from "../../vacancies/entities/pipeline-stage.entity";
import { StageActivity } from "../../vacancies/entities/stage-activity.entity";
import { ApplicationNotes } from "./application-notes.entity";
import { ApplicantStatus } from "../../../shared/enums/applicant.enum";

@Entity("applications")
@Index(["vacancyId", "status"])
export class Application {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  applicationNumber: string;

  @ManyToOne(() => Applicant)
  @JoinColumn({ name: "applicant_id" })
  applicant: Applicant;

  @Column({ name: "applicant_id" })
  applicantId: string;

  @ManyToOne(() => Vacancy)
  @JoinColumn({ name: "vacancy_id" })
  vacancy: Vacancy;

  @Column({ name: "vacancy_id" })
  vacancyId: string;

  @ManyToOne(() => RecruitmentPipeline)
  @JoinColumn({ name: "pipeline_id" })
  pipeline: RecruitmentPipeline;

  @Column({ name: "pipeline_id" })
  pipelineId: string;

  @ManyToOne(() => PipelineStage)
  @JoinColumn({ name: "current_stage_id" })
  currentStage: PipelineStage;

  @Column({ name: "current_stage_id", nullable: true })
  currentStageId: string;

  @Column({
    type: "enum",
    enum: ApplicantStatus,
    default: ApplicantStatus.APPLIED
  })
  status: ApplicantStatus;

  @Column({ type: "text", nullable: true })
  coverLetter: string;

  @Column({ type: "date", nullable: true })
  expectedStartDate: Date;

  @Column({ type: "varchar", length: 100, nullable: true })
  source: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  customSource: string;

  @Column({
    name: "applied_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP"
  })
  appliedAt: Date;

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt: Date;

  // Tracking fields
  @Column({ type: "int", nullable: true })
  currentScore: number; // score terakhir di stage saat ini

  @Column({ type: "text", nullable: true })
  currentNotes: string; // catatan terakhir di stage saat ini

  @Column({ type: "timestamp", nullable: true })
  lastActivityAt: Date; // kapan terakhir ada aktivitas

  @Column({ type: "boolean", default: false })
  isTalentPool: boolean; // flag untuk talent pool

  @OneToMany(() => StageActivity, (activity) => activity.application)
  activities: StageActivity[];

  @OneToMany(() => ApplicationNotes, (notes) => notes.application, {
    cascade: true
  })
  notes: ApplicationNotes[];

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
