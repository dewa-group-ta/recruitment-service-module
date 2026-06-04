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

@Entity("applicant_educations")
export class ApplicantEducation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Applicant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicant_id" })
  applicant: Applicant;

  @Column({ name: "applicant_id" })
  applicantId: string;

  @Column({ type: "varchar", length: 255 })
  schoolName: string;

  @Column({ type: "varchar", length: 100 })
  major: string;

  @Column({ type: "varchar", length: 100 })
  degree: string;

  @Column({ type: "decimal", precision: 3, scale: 2, nullable: true })
  gpa: number;

  @Column({ type: "varchar", length: 7 }) // Format: MM-YYYY
  startMonth: string;

  @Column({ type: "varchar", length: 7, nullable: true }) // Format: MM-YYYY
  endMonth: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  diplomaFileName: string;

  @Column({ type: "int", default: 1 })
  order: number; // untuk multiple education records

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
