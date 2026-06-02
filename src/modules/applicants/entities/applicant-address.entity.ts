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
import { AddressTypeEnum } from "../../../shared/enums/applicant.enum";

@Entity("applicant_addresses")
export class ApplicantAddress {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Applicant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ name: "applicant_id" })
  applicantId!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  province!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  regency!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  district!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  village!: string;

  @Column({ type: "text" })
  fullAddress!: string;

  @Column({ type: "varchar", length: 10, default: "ID", nullable: true })
  postalCode!: string;

  @Column({ type: "enum", enum: AddressTypeEnum, nullable: true })
  addressType!: AddressTypeEnum;

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt!: Date;
}
