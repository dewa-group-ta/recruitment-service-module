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

@Entity("applicant_project_histories")
export class ApplicantProjectHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Applicant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicant_id" })
  applicant: Applicant;

  @Column({ name: "applicant_id" })
  applicantId: string;

  @Column({ type: "varchar", length: 255 })
  projectName: string;

  @Column({ type: "varchar", length: 255 })
  position: string;

  @Column({ type: "varchar", length: 4, nullable: true }) // Format: YYYY
  year: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  projectLink: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  technologies: string; // comma-separated technologies used

  @Column({ type: "text", nullable: true })
  achievements: string;

  @Column({ type: "int", default: 1 })
  order: number; // untuk multiple project records

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
