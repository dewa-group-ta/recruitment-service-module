import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from "typeorm";
import { TokenType } from "../../../shared/enums/pipeline.enum";

@Entity("auth_tokens")
@Index(["email", "type"])
@Index(["token", "type"])
export class AuthToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "varchar", length: 255, unique: true })
  token: string;

  @Column({ type: "enum", enum: TokenType })
  type: TokenType;

  @Column({ type: "timestamp" })
  expiresAt: Date;

  @Column({ type: "boolean", default: false })
  isUsed: boolean;

  @Column({ type: "varchar", length: 500, nullable: true })
  applicantId: string;

  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  userAgent: string;

  @Column({ type: "timestamp", nullable: true })
  usedAt: Date; // kapan token digunakan

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
