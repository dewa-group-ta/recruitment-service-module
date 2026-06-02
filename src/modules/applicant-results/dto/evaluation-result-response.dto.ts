export class EvaluationExperienceEntryDto {
  role!: string | null;
  description!: string | null;
  start!: string | null;
  end!: string | null;
  durationYears!: number | null;
  similarity!: number | null;
  isTopMatch!: boolean;
}

export class EvaluationEducationEntryDto {
  level!: number | null;
  major!: string | null;
  institution!: string | null;
}

export class EvaluationScoringBreakdownDto {
  experiences!: EvaluationExperienceEntryDto[];
  educations!: EvaluationEducationEntryDto[];
}

export class EvaluationResultResponseDto {
  maxExperienceScore!: number;
  evaluatedAt!: Date;
  scoringBreakdown!: EvaluationScoringBreakdownDto;
}