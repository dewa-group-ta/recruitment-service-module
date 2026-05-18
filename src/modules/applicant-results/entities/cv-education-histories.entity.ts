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
import { EducationLevel } from "../../../shared/enums/job-status.enum";

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

//baru
  @Column({ type: "enum", enum: EducationLevel, nullable: true })
    level!: EducationLevel | null;
//-----

  @Column({ type: "varchar", length: 255, nullable: true })
    major!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
    institution!: string | null;

  @Column({ name: "graduation_year", type: "int", nullable: true })
    graduationYear!: number | null;

  @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}