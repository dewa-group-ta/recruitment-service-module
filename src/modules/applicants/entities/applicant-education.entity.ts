import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn
} from "typeorm";
import { Applicant } from "./applicant.entity";
import { EducationLevel } from "../../../shared/enums/job-status.enum";

@Entity("applicant_educations")
export class ApplicantEducation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Applicant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ name: "applicant_id" })
  applicantId!: string;

  @Column({ type: "enum", enum: EducationLevel, nullable: true })
  level!: EducationLevel | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  schoolName!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  major!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  degree!: string | null;

  @Column({ type: "decimal", precision: 3, scale: 2, nullable: true })
  gpa!: number | null;

  @Column({ type: "varchar", length: 7, nullable: true })
  startMonth!: string | null;

  @Column({ type: "varchar", length: 7, nullable: true })
  endMonth!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  diplomaFileName!: string | null;

  @Column({ type: "int", default: 1 })
  order!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt!: Date;
}