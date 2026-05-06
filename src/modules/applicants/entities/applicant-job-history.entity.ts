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
import { Applicant } from "./applicant.entity";
import { EmployeeStatus } from "../../../shared/enums/applicant.enum";

@Entity("applicant_job_histories")
export class ApplicantJobHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Applicant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicant_id" })
  applicant: Applicant;

  @Column({ name: "applicant_id" })
  applicantId: string;

  @Column({ type: "varchar", length: 255 })
  position: string;

  @Column({ type: "enum", enum: EmployeeStatus })
  employeeStatus: EmployeeStatus;

  @Column({ type: "varchar", length: 255 })
  company: string;

  @Column({ type: "date" })
  startDate: Date;

  @Column({ type: "date", nullable: true })
  endDate: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  location: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  achievements: string;

  @Column({ type: "int", default: 1 })
  order: number; // untuk multiple job history records

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
