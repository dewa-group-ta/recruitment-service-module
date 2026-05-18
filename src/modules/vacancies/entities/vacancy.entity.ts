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

  // Date fields
  @Column({ type: "date", nullable: true })
  startDate!: Date;

  @Column({ type: "date", nullable: true })
  endDate!: Date;

  // Applicant and hired limits with enable flags
  @Column({ type: "boolean", default: false })
  isLimitApplicantEnabled!: boolean;

  @Column({ type: "int", nullable: true })
  applicantLimit!: number;

  @Column({ type: "boolean", default: false })
  isLimitHiredEnabled!: boolean;

  @Column({ type: "int", nullable: true })
  hiredLimit!: number;

  // Office addresses
  @Column({ type: "json", nullable: true })
  officeAddresses!: string[];

  // Department
  @ManyToOne(() => Department)
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Column({ name: "department_id", nullable: true })
  departmentId!: string;

  // salary
  @Column({ type: "int", nullable: true })
  salaryMin!: number;

  @Column({ type: "int", nullable: true })
  salaryMax!: number;

  @Column({ type: "enum", enum: SalaryPeriod, nullable: true })
  salaryPeriod!: SalaryPeriod;

  @Column({ type: "varchar", length: 3, default: "IDR" })
  currency!: string;

  // Generated poster URL
  @Column({ type: "varchar", length: 500, nullable: true })
  generatedPosterUrl!: string;

  // Poster Configuration - stores which fields to include in job poster
  @Column({ type: "json", nullable: true })
  posterConfiguration!: PosterConfiguration;

  // Relations
  @ManyToOne(() => RecruitmentPipeline)
  @JoinColumn({ name: "pipeline_id" })
  pipeline!: RecruitmentPipeline;

  @Column({ name: "pipeline_id", nullable: true })
  pipelineId!: string;

  // Job Category
  @ManyToOne(() => JobCategory)
  @JoinColumn({ name: "job_category_id" })
  jobCategory!: JobCategory;

  @Column({ name: "job_category_id", nullable: true })
  jobCategoryId!: string;

  // Required qualifications
  @Column({ type: "enum", enum: EducationLevel, nullable: true })
  requiredEducation!: EducationLevel;

  @Column({ type: "int", nullable: true })
  requiredExperienceYears!: number;

  // tambahan
  //----------------------------------------------------------------
  
  @Column({ name: "relevant_major", type: "varchar", length: 255, nullable: true })
  relevantMajor!: string;

  @Column({ name: "role_description", type: "text", nullable: true })
  roleDescription!: string;

  @Column({ name: "required_skills", type: "text", array: true, nullable: true })
  requiredSkills!: string[];
  
  //----------------------------------------------------------------

  // Working hours
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

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt!: Date;

  @Column({ name: "deleted_by", nullable: true })
  deletedById!: string;
}
