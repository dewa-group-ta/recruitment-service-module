import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany
} from "typeorm";
import { Vacancy } from "../../vacancies/entities/vacancy.entity";

@Entity("departments")
export class Department {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  name: string;

  @Column({ type: "varchar", length: 50, unique: true, nullable: true })
  code: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "created_by" })
  createdById: string;

  @Column({ name: "updated_by", nullable: true })
  updatedById: string;

  @OneToMany(() => Vacancy, (vacancy) => vacancy.department)
  vacancies: Vacancy[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date | null;

  @Column({ name: "deleted_by", nullable: true })
  deletedById?: string;
}
