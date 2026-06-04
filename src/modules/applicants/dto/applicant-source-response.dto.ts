export class ApplicantSourceResponseDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
