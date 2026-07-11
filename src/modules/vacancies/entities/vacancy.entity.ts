import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from "typeorm";
import { RecruitmentPipeline } from "./recruitment-pipeline.entity";
import { JobCategory } from "./job-category.entity";
import { Application } from "../../applicants/entities/application.entity";
import { Department } from "../../departments/entities/department.entity";
import {
  JobStatus,
  EmploymentType,
  WorkModel,
  JobType,
  SalaryPeriod,
  EducationLevel
} from "../../../shared/enums/job-status.enum";
import { PosterConfiguration } from "../../../shared/interface";

@Entity("vacancies")
export class Vacancy {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 50, unique: true, nullable: true })
  jobCode!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "text", nullable: true })
  responsibilities!: string;

  @Column({ type: "text", nullable: true })
  requirements!: string;

  @Column({ type: "enum", enum: JobStatus, default: JobStatus.DRAFT })
  status!: JobStatus;

  @Column({ type: "enum", enum: JobType, default: JobType.RECRUITMENT })
  jobType!: JobType;

  @Column({ type: "enum", enum: EmploymentType })
  employmentType!: EmploymentType;

  @Column({ type: "enum", enum: WorkModel, default: WorkModel.ON_SITE })
  workModel!: WorkModel;

  @Column({ type: "date", nullable: true })
  startDate!: Date;

  @Column({ type: "date", nullable: true })
  endDate!: Date;

  @Column({ type: "boolean", default: false })
  isLimitApplicantEnabled!: boolean;

  @Column({ type: "int", nullable: true })
  applicantLimit!: number;

  @Column({ type: "boolean", default: false })
  isLimitHiredEnabled!: boolean;

  @Column({ type: "int", nullable: true })
  hiredLimit!: number;

  @Column({ type: "json", nullable: true })
  officeAddresses!: string[];

  @ManyToOne(() => Department)
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Column({ name: "department_id", nullable: true })
  departmentId!: string;

  @Column({ type: "int", nullable: true })
  salaryMin!: number;

  @Column({ type: "int", nullable: true })
  salaryMax!: number;

  @Column({ type: "enum", enum: SalaryPeriod, nullable: true })
  salaryPeriod!: SalaryPeriod;

  @Column({ type: "varchar", length: 3, default: "IDR" })
  currency!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  generatedPosterUrl!: string;

  @Column({ type: "json", nullable: true })
  posterConfiguration!: PosterConfiguration;

  @ManyToOne(() => RecruitmentPipeline)
  @JoinColumn({ name: "pipeline_id" })
  pipeline!: RecruitmentPipeline;

  @Column({ name: "pipeline_id", nullable: true })
  pipelineId!: string;

  @ManyToOne(() => JobCategory)
  @JoinColumn({ name: "job_category_id" })
  jobCategory!: JobCategory;

  @Column({ name: "job_category_id", nullable: true })
  jobCategoryId!: string;

  @Column({ type: "enum", enum: EducationLevel, nullable: true })
  requiredEducation!: EducationLevel;

  @Column({ type: "int", nullable: true })
  requiredExperienceYears!: number;

  @Column({ type: "int", nullable: true })
  hoursPerWeekMin!: number;

  @Column({ type: "int", nullable: true })
  hoursPerWeekMax!: number;

  @Column({ name: "created_by" })
  createdById!: string;

  @Column({ name: "updated_by", nullable: true })
  updatedById!: string;

  @OneToMany(() => Application, (application) => application.vacancy)
  applications!: Application[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt!: Date;

  @Column({ name: "deleted_by", nullable: true })
  deletedById!: string;
}
