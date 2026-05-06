import { PartialType } from "@nestjs/swagger";
import { CreateStageTemplateDto } from "./create-stage-template.dto";

export class UpdateStageTemplateDto extends PartialType(
  CreateStageTemplateDto
) {}
