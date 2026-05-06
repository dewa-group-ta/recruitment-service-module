import { PartialType } from "@nestjs/swagger";
import { CreateSystemConfigurationDto } from "./create-system-configuration.dto";

export class UpdateSystemConfigurationDto extends PartialType(
  CreateSystemConfigurationDto
) {}
