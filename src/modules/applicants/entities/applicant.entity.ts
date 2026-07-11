import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable
} from "typeorm";
import { Application } from "./application.entity";
import { ApplicantAddress } from "./applicant-address.entity";
import { ApplicantEducation } from "./applicant-education.entity";
import { ApplicantJobHistory } from "./applicant-job-history.entity";
import { ApplicantProjectHistory } from "./applicant-project-history.entity";
import { ApplicantIdentity } from "./applicant-identity.entity";
import { ApplicantSource } from "./applicant-source.entity";
import {
  GenderEnum,
  MaritalStatusEnum,
  AvailabilityEnum
} from "../../../shared/enums/applicant.enum";

@Entity("applicants")
export class Applicant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 100 })
  fullName!: string;

  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  alternativePhone!: string;

  @Column({ type: "enum", enum: GenderEnum, nullable: true })
  gender!: GenderEnum;

  @Column({ type: "enum", enum: MaritalStatusEnum, nullable: true })
  maritalStatus!: MaritalStatusEnum;

  @Column({ type: "varchar", length: 100, nullable: true })
  placeOfBirth!: string;

  @Column({ type: "date", nullable: true })
  dateOfBirth!: Date;

  @Column({ type: "varchar", length: 500, nullable: true })
  photoUrl!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  cvUrl!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  linkedinUrl!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  portfolioUrl!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  socialMediaUrl!: string;

  @Column({ type: "boolean", default: false })
  isInternal!: boolean;

  @Column({ type: "enum", enum: AvailabilityEnum, nullable: true })
  availability!: AvailabilityEnum;

  @Column({ type: "date", nullable: true })
  availabilityAt!: Date;

  @ManyToMany(
    () => ApplicantSource,
    (applicantSource) => applicantSource.applicants
  )
  @JoinTable({
    name: "applicant_applicant_sources",
    joinColumn: { name: "applicant_id", referencedColumnName: "id" },
    inverseJoinColumn: {
      name: "applicant_source_id",
      referencedColumnName: "id"
    }
  })
  applicantSources!: ApplicantSource[];

  @OneToMany(() => Application, (application) => application.applicant)
  applications!: Application[];

  @OneToMany(() => ApplicantAddress, (address) => address.applicant, {
    cascade: true
  })
  addresses!: ApplicantAddress[];

  @OneToMany(() => ApplicantEducation, (education) => education.applicant, {
    cascade: true
  })
  educations!: ApplicantEducation[];

  @OneToMany(() => ApplicantJobHistory, (jobHistory) => jobHistory.applicant, {
    cascade: true
  })
  jobHistories!: ApplicantJobHistory[];

  @OneToMany(
    () => ApplicantProjectHistory,
    (projectHistory) => projectHistory.applicant,
    { cascade: true }
  )
  projectHistories!: ApplicantProjectHistory[];

  @OneToMany(() => ApplicantIdentity, (identity) => identity.applicant, {
    cascade: true
  })
  identities!: ApplicantIdentity[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt!: Date;
}
