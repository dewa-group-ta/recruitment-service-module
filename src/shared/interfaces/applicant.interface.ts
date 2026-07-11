import { RegisterApplicantDto } from "../../modules/applicants/dto/register-applicant.dto";
import { UpdateApplicantProfileDto } from "../../modules/applicants/dto/update-applicant-profile.dto";
import { ApplyApplicantDto } from "../../modules/applicants/dto/apply-applicant.dto";
import { Applicant } from "../../modules/applicants/entities/applicant.entity";
import { Application } from "../../modules/applicants/entities/application.entity";
import { ApplicationTrackingResponseDto } from "../../modules/applicants/dto/application-tracking-response.dto";
import {
  ApplicationTrackingPublicDto,
  ApplicationTrackingQueryDto
} from "../../modules/applicants/dto/application-tracking-public.dto";

export interface IApplicantService {
  registerApplicant(
    registerDto: RegisterApplicantDto
  ): Promise<{ applicantId: string }>;

  loginApplicant(email: string): Promise<string>;

  findById(id: string): Promise<Applicant>;

  updateProfile(
    id: string,
    updateDto: UpdateApplicantProfileDto
  ): Promise<Applicant>;

  applyForVacancy(applicantId: string, vacancyId: string): Promise<Application>;

  getApplicationTracking(
    applicantId: string,
    applicationId: string
  ): Promise<ApplicationTrackingResponseDto>;

  getApplicantApplications(applicantId: string): Promise<Application[]>;

  getApplicationTrackingByCode(
    query: ApplicationTrackingQueryDto
  ): Promise<ApplicationTrackingPublicDto>;
}

export interface ITokenService {
  generateToken(applicantId: string): Promise<string>;

  validateToken(token: string): Promise<string | null>;

  revokeToken(token: string): Promise<boolean>;
}

export interface IApplicantRepository {
  findByEmail(email: string): Promise<Applicant | null>;

  findById(id: string): Promise<Applicant | null>;

  create(applicant: Partial<Applicant>): Promise<Applicant>;

  update(id: string, updateData: Partial<Applicant>): Promise<Applicant>;

  delete(id: string): Promise<boolean>;
}
