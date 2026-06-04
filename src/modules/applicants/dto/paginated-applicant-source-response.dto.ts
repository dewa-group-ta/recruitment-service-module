import { ApplicantSourceResponseDto } from "./applicant-source-response.dto";

export class PaginatedApplicantSourceResponseDto {
  data: ApplicantSourceResponseDto[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
