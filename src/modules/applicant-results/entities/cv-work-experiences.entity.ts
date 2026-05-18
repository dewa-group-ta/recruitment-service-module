import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { CvDocument } from "./cv-documents.entity";

@Entity("cv_work_experiences")
export class CvWorkExperience {
  @PrimaryGeneratedColumn("uuid")
    id!: string;

  @ManyToOne(() => CvDocument, (doc: CvDocument) => doc.workExperiences, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "cv_document_id" })
    cvDocument!: CvDocument;

  @Column({ name: "cv_document_id" })
    cvDocumentId!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
    role!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
    company!: string;

  /**
   * Deskripsi tanggung jawab — input SBERT untuk perhitungan
   * cosine similarity terhadap role_description lowongan
   */
  @Column({ type: "text", nullable: true })
    description!: string;

  /**
   * Disimpan sebagai string karena format tanggal di CV sangat variatif
   * contoh: "Jan 2022", "2022-01", "Januari 2022", "sekarang", "present"
   */
  @Column({ name: "start_date", type: "varchar", length: 30, nullable: true })
    startDate!: string;

  @Column({ name: "end_date", type: "varchar", length: 30, nullable: true })
    endDate!: string;

  /**
   * Durasi dalam satuan tahun, hasil kalkulasi postprocess LLM
   * Nilai 0 jika durasi < 12 bulan (sesuai BR-10)
   * null jika tanggal tidak dapat dikomputasi
   */
  @Column({ name: "duration_years", type: "float", nullable: true })
    durationYears!: number;

  @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}