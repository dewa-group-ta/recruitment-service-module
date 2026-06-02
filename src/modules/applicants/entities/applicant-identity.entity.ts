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
import { IdentityTypeEnum } from "../../../shared/enums/applicant.enum";

@Entity("applicant_identities")
export class ApplicantIdentity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Applicant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ name: "applicant_id" })
  applicantId!: string;

  @Column({ type: "enum", enum: IdentityTypeEnum, nullable: true })
  identityType!: IdentityTypeEnum;

  @Column({ type: "varchar", length: 50, nullable: true })
  identityNumber!: string;

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt!: Date;
}
