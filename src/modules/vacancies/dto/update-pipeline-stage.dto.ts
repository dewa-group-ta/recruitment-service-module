import { PartialType } from "@nestjs/swagger";
import { CreatePipelineStageDto } from "./create-pipeline-stage.dto";

export class UpdatePipelineStageDto extends PartialType(
  CreatePipelineStageDto
) {}
