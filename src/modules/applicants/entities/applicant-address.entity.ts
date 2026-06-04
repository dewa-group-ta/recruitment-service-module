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
  id: string;

  @ManyToOne(() => Applicant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicant_id" })
  applicant: Applicant;

  @Column({ name: "applicant_id" })
  applicantId: string;

  @Column({ type: "varchar", length: 100 })
  province: string;

  @Column({ type: "varchar", length: 100 })
  regency: string;

  @Column({ type: "varchar", length: 100 })
  district: string;

  @Column({ type: "varchar", length: 100 })
  village: string;

  @Column({ type: "text" })
  fullAddress: string;

  @Column({ type: "varchar", length: 10, default: "ID" })
  postalCode: string;

  @Column({ type: "enum", enum: AddressTypeEnum })
  addressType: AddressTypeEnum;

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
