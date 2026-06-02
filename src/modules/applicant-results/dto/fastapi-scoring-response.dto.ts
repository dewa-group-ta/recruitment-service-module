export class FastApiEducationDto {
  level!: number;
  major!: string;
  institution!: string;
}

export class FastApiExperienceDto {
  role!: string;
  description!: string;
  start!: string | null;
  end!: string | null;
  duration_years!: number | null;
  similarity!: number;
}

export class FastApiScoringResponseDto {
  application_id!: string;
  educations!: FastApiEducationDto[];
  experience!: FastApiExperienceDto[];
}