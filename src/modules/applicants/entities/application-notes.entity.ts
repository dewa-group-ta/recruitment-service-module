import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from "typeorm";
import { Application } from "./application.entity";

@Entity("application_notes")
@Index(["applicationId", "createdAt"])
export class ApplicationNotes {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: "application_id" })
  application: Application;

  @Column({ name: "application_id" })
  applicationId: string;

  @Column({ type: "text" })
  notes: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  createdBy: string; // HR yang membuat notes

  @Column({ type: "varchar", length: 100, nullable: true })
  updatedBy: string; // HR yang update notes

  @Column({ type: "boolean", default: false })
  isPrivate: boolean; // apakah notes ini private (hanya HR tertentu yang bisa lihat)

  @Column({ type: "varchar", length: 50, nullable: true })
  category: string; // kategori notes (interview, assessment, general, etc.)

  @Column({ type: "varchar", length: 50, nullable: true })
  priority: string; // priority notes (high, medium, low)

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
