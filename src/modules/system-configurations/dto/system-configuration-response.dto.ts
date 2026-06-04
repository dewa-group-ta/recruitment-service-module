import { SystemConfiguration } from "../entities/system-configuration.entity";

export class SystemConfigurationResponseDto {
  id: string;
  configKey: string;
  configValue: string;
  configValueJson?: Record<string, any>;
  configType: string;
  groupName: string;
  label: string;
  description: string;
  isRequired: boolean;
  isPublic: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(config: SystemConfiguration) {
    this.id = config.id;
    this.configKey = config.configKey;
    this.configValue = config.configValue;
    this.configValueJson = config.configValueJson;
    this.configType = config.configType;
    this.groupName = config.groupName;
    this.label = config.label;
    this.description = config.description;
    this.isRequired = config.isRequired;
    this.isPublic = config.isPublic;
    this.sortOrder = config.sortOrder;
    this.createdAt = config.createdAt;
    this.updatedAt = config.updatedAt;
  }
}
