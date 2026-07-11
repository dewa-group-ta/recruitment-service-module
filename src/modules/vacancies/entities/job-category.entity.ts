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
  code: string; // kode singkat kategori (mis. 'ENG', 'MKT', 'SALES')

  @Column({ type: "varchar", length: 7, nullable: true })
  color: string; // kode warna hex untuk tampilan ui

  @Column({ type: "varchar", length: 255, nullable: true })
  icon: string; // nama atau path icon untuk tampilan ui

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "created_by" })
  createdById: string;

  @Column({ name: "updated_by", nullable: true })
  updatedById: string;

  @OneToMany(() => Vacancy, (vacancy) => vacancy.jobCategory)
  vacancies: Vacancy[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
