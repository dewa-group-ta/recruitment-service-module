export class FastApiEducationParsedDto {
  level!: number;
  major!: string;
  graduation_year!: number;
}

export class FastApiWorkExperienceDto {
  role!: string;
  company!: string;
  start_date!: string;
  end_date!: string | null;
  duration_years!: number;
  description!: string;
}

export class FastApiCvParsedDto {
  applicant_name!: string;
  skills!: string[];
  educations!: FastApiEducationParsedDto[];
  work_experiences!: FastApiWorkExperienceDto[];
}

export class FastApiExperienceEntryDto {
  role!: string;
  similarity_score!: number;
}

export class FastApiExperienceDetailDto {
  method!: string;
  entries!: FastApiExperienceEntryDto[];
}

export class FastApiEvaluationDetailsDto {
  experience!: FastApiExperienceDetailDto;
}

export class FastApiEvaluationDto {
  shortlist_score!: number;
  details!: FastApiEvaluationDetailsDto;
}

export class FastApiScoringDataDto {
  application_id!: string;
  cv_parsed!: FastApiCvParsedDto;
  evaluation!: FastApiEvaluationDto;
}

export class FastApiScoringResponseDto {
  success!: boolean;
  message!: string;
  data!: FastApiScoringDataDto;
  error_code!: string | null;
  error_details!: string | null;
  metadata!: any | null;
}