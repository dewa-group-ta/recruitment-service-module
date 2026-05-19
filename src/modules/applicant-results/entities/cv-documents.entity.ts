import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToOne, OneToMany, JoinColumn
} from "typeorm";
import { Application } from "../../applicants/entities/application.entity";
import { ApplicantEducation } from "../../applicants/entities/applicant-education.entity";
import { ApplicantJobHistory } from "../../applicants/entities/applicant-job-history.entity";

@Entity("cv_documents")
export class CvDocument {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => Application, { onDelete: "CASCADE" })
  @JoinColumn({ name: "application_id" })
  application!: Application;

  @Column({ name: "application_id", unique: true })
  applicationId!: string;

  @Column({ name: "applicant_name", type: "varchar", length: 255, nullable: true })
  applicantName!: string | null;

  // Skills disimpan sebagai array — digunakan Jaccard similarity
  @Column({ type: "text", array: true, nullable: true })
  skills!: string[] | null;

  @Column({ name: "parsed_at", type: "timestamp", nullable: true })
  parsedAt!: Date | null;

  // Relasi ke education dan job history yang di-parse dari CV ini
  @OneToMany(() => ApplicantEducation, (edu) => edu.cvDocument)
  educations!: ApplicantEducation[];

  @OneToMany(() => ApplicantJobHistory, (job) => job.cvDocument)
  jobHistories!: ApplicantJobHistory[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}