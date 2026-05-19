import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn
} from "typeorm";
import { Applicant } from "./applicant.entity";
import { CvDocument } from "../../applicant-results/entities/cv-documents.entity";
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

  // Relasi ke cv_documents — null jika diisi manual
  @ManyToOne(() => CvDocument, (doc) => doc.jobHistories, {
    onDelete: "CASCADE",
    nullable: true
  })
  @JoinColumn({ name: "cv_document_id" })
  cvDocument!: CvDocument | null;

  @Column({ name: "cv_document_id", nullable: true })
  cvDocumentId!: string | null;

  // Nullable karena LLM tidak tahu tipe employment
  @Column({ type: "enum", enum: EmployeeStatus, nullable: true })
  employeeStatus!: EmployeeStatus | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  position!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  company!: string | null;

  // Diubah dari Date ke varchar — format dari LLM sangat variatif
  // contoh: "Jan 2022", "2024-11", "sekarang", null
  @Column({ type: "date" })
  startDate!: Date;

  @Column({ type: "date", nullable: true })
  endDate!: Date;

  /**
   * Hasil kalkulasi postprocess LLM dalam satuan tahun
   * 0 jika durasi < 12 bulan (BR-10)
   * null jika tanggal tidak dapat dikomputasi
   */
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