import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { Application } from "../../applicants/entities/application.entity";
import { CvEducationHistory } from "./cv-education-histories.entity";
import { CvWorkExperience } from "./cv-work-experiences.entity";

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
    applicantName!: string;

  @Column({ type: "text", array: true, nullable: true })
    skills!: string[];

  @Column({ name: "parsed_at", type: "timestamp", nullable: true })
    parsedAt!: Date;

  @OneToMany(() => CvEducationHistory, (edu) => edu.cvDocument, {
        cascade: true
    })
    educations!: CvEducationHistory[];

  @OneToMany(() => CvWorkExperience, (exp) => exp.cvDocument, {
        cascade: true
    })
    workExperiences!: CvWorkExperience[];

  @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}