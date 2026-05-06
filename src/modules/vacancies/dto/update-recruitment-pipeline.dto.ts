import { PartialType } from "@nestjs/swagger";
import { CreateRecruitmentPipelineDto } from "./create-recruitment-pipeline.dto";

export class UpdateRecruitmentPipelineDto extends PartialType(
  CreateRecruitmentPipelineDto
) {}
