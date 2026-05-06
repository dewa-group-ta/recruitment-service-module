import { PartialType } from "@nestjs/swagger";
import { CreateApplicantSourceDto } from "./create-applicant-source.dto";

export class UpdateApplicantSourceDto extends PartialType(
  CreateApplicantSourceDto
) {}
