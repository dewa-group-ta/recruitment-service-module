import { EvaluationResultResponseDto } from "../../applicant-results/dto/evaluation-result-response.dto";

export class ApplyApplicantResponseDto {
  applicant!: {
        id: string;
        email: string;
        fullName: string;
        phone: string;
        alternativePhone: string | null;
        gender: string | null;
        maritalStatus: string | null;
        placeOfBirth: string | null;
        dateOfBirth: Date | null;
        photoUrl: string | null;
        cvUrl: string | null;
        linkedinUrl: string | null;
        availability: string | null;
        createdAt: Date;
        updatedAt: Date;
    };

  application!: {
        id: string;
        applicationNumber: string;
        vacancyId: string;
        pipelineId: string;
        currentStageId: string;
        status: string;
        appliedAt: Date;
        lastActivityAt: Date;
    };

  evaluationResult!: EvaluationResultResponseDto;
}