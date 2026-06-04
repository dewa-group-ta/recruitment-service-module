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
import { Applicant } from "../../modules/applicants/entities/applicant.entity";

export enum FileType {
  PHOTO = "photo",
  CV = "cv",
  COVER_LETTER = "cover_letter",
  PORTFOLIO = "portfolio",
  CERTIFICATE = "certificate",
  IDENTITY_DOCUMENT = "identity_document",
  JOB_DESCRIPTION = "job_description",
  COMPANY_LOGO = "company_logo",
  OTHER = "other"
}

@Entity("files")
export class File {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  fileName!: string;

  @Column({ type: "varchar", length: 255 })
  originalName!: string;

  @Column({ type: "varchar", length: 500 })
  filePath!: string;

  @Column({ type: "bigint" })
  fileSize!: number;

  @Column({ type: "varchar", length: 100 })
  mimeType!: string;

  @Column({ type: "varchar", length: 100 })
  bucket!: string;

  @Column({ type: "enum", enum: FileType })
  fileType!: FileType;

  @Column({ type: "varchar", length: 500, nullable: true })
  description!: string;

  @ManyToOne(() => Applicant, { nullable: true })
  @JoinColumn({ name: "uploaded_by" })
  uploadedBy!: Applicant;

  @Column({ name: "uploaded_by", nullable: true })
  uploadedById!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  relatedEntity!: string; // 'application', 'applicant', 'vacancy', etc.

  @Column({ type: "uuid", nullable: true })
  relatedEntityId!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt!: Date;
}
