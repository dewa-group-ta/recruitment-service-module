import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn
} from "typeorm";
import { Applicant } from "./applicant.entity";
import { EmployeeStatus } from "../../../shared/enums/applicant.enum";

@Entity("applicant_job_histories")
export class ApplicantJobHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Applicant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ name: "applicant_id" })
  applicantId!: string;

  // Nullable karena LLM tidak tahu tipe employment
  @Column({ type: "enum", enum: EmployeeStatus, nullable: true })
  employeeStatus!: EmployeeStatus | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  position!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  company!: string | null;


  @Column({ type: "date" })
  startDate!: Date;

  @Column({ type: "date", nullable: true })
  endDate!: Date | null;

  @Column({ name: "duration_years", type: "float", nullable: true })
  durationYears!: number | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  location!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text", nullable: true })
  achievements!: string | null;

  @Column({ type: "int", default: 1 })
  order!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt!: Date;
}