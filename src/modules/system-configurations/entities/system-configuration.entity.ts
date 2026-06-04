import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index
} from "typeorm";

export enum ConfigType {
  TEXT = "text",
  IMAGE = "image",
  EMAIL = "email",
  PHONE = "phone",
  URL = "url",
  JSON = "json",
  BOOLEAN = "boolean",
  NUMBER = "number"
}

@Entity("system_configurations")
@Index(["groupName"])
@Index(["isPublic"])
export class SystemConfiguration {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  configKey: string;

  @Column({ type: "text", nullable: true })
  configValue: string;

  @Column({ type: "json", nullable: true })
  configValueJson?: Record<string, any>;

  @Column({
    type: "enum",
    enum: ConfigType,
    default: ConfigType.TEXT
  })
  configType: ConfigType;

  @Column({ type: "varchar", length: 100 })
  groupName: string;

  @Column({ type: "varchar", length: 255 })
  label: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "boolean", default: false })
  isRequired: boolean;

  @Column({ type: "boolean", default: true })
  isPublic: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
