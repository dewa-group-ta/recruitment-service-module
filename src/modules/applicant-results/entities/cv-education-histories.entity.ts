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
import { CvEducationLevel } from "../../../shared/enums/job-status.enum";

@Entity("cv_education_histories")
export class CvEducationHistory {
  @PrimaryGeneratedColumn("uuid")
    id!: string;

  @ManyToOne(() => CvDocument, (doc: CvDocument) => doc.educations, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "cv_document_id" })
    cvDocument!: CvDocument;

  @Column({ name: "cv_document_id" })
    cvDocumentId!: string;

  /**
   * Jenjang pendidikan hasil ekstraksi LLM
   * SMA = 1, D3 = 2, S1/D4 = 3, S2 = 4, S3 = 5
   * null jika tidak dapat ditentukan dari teks CV
   * Disimpan sebagai smallint, enum hanya untuk type safety di TypeScript
   */
  @Column({ type: "enum", enum: CvEducationLevel, nullable: true })
    level!: CvEducationLevel;

  @Column({ type: "varchar", length: 255, nullable: true })
    major!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
    institution!: string;

  @Column({ name: "graduation_year", type: "int", nullable: true })
    graduationYear!: number;

  @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}