import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { EvaluationDecision } from "../entities/evaluation-results.entity";

/**
 * DTO untuk endpoint PATCH /applicant-results/:applicationId/decision
 * Digunakan rekruter untuk menetapkan keputusan akhir terhadap hasil scoring.
 * Keputusan bersifat manual — tidak ditetapkan otomatis oleh sistem (BR-09).
 */
export class UpdateDecisionDto {
  @ApiProperty({
    enum: EvaluationDecision,
    description: "Keputusan rekruter: 'lolos' atau 'tidak_lolos'",
    example: EvaluationDecision.PASSED
  })
  @IsEnum(EvaluationDecision)
  @IsNotEmpty()
  decision!: EvaluationDecision;
}
