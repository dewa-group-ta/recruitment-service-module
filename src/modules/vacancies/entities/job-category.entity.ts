import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany
} from "typeorm";
import { Vacancy } from "./vacancy.entity";

@Entity("job_categories")
export class JobCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  code: string; // Short code for the category (e.g., 'ENG', 'MKT', 'SALES')

  @Column({ type: "varchar", length: 7, nullable: true })
  color: string; // Hex color code for UI display

  @Column({ type: "varchar", length: 255, nullable: true })
  icon: string; // Icon name or path for UI display

  @Column({ type: "int", default: 0 })
  sortOrder: number; // For ordering categories in UI

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "created_by" })
  createdById: string;

  @Column({ name: "updated_by", nullable: true })
  updatedById: string;

  // Relations
  @OneToMany(() => Vacancy, (vacancy) => vacancy.jobCategory)
  vacancies: Vacancy[];

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
