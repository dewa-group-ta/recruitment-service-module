export class PublicTrackingApplicationDto {
  id: string;
  applicationNumber: string;
  registrationCode: string;
  vacancyTitle: string;
  status: string;
  appliedAt: Date;
  lastActivityAt: Date | null;
  applicantName: string;
}

export class PublicTrackingStageDto {
  name: string;
  status: string;
  notes: string | null;
  completedAt: Date | null;
}

export class PublicTrackingCurrentStageDto {
  name: string;
  status: string;
}

export class ApplicationTrackingPublicDto {
  application: PublicTrackingApplicationDto;
  currentStage: PublicTrackingCurrentStageDto | null;
  stages: PublicTrackingStageDto[];
}

export class ApplicationTrackingQueryDto {
  email: string;
  registrationCode: string;
}
