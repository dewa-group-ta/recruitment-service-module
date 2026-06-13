import { RegisterApplicantDto } from "../../modules/applicants/dto/register-applicant.dto";
import { UpdateApplicantProfileDto } from "../../modules/applicants/dto/update-applicant-profile.dto";
import { ApplyApplicantDto } from "../../modules/applicants/dto/apply-applicant.dto";
import { Applicant } from "../../modules/applicants/entities/applicant.entity";
import { Application } from "../../modules/applicants/entities/application.entity";
import { ApplicationTrackingResponseDto } from "../../modules/applicants/dto/application-tracking-response.dto";
import { ApplicationTrackingPublicDto, ApplicationTrackingQueryDto } from "../../modules/applicants/dto/application-tracking-public.dto";

/**
 * Interface for applicant service operations
 * Defines the contract for applicant-related business logic
 */
export interface IApplicantService {
  /**
   * Register a new applicant
   * @param registerDto - Registration data
   * @returns Promise<{ applicantId: string }> - Registration result with applicant ID
   * @throws BadRequestException - When validation fails
   * @throws ConflictException - When applicant already exists
   */
  registerApplicant(registerDto: RegisterApplicantDto): Promise<{ applicantId: string }>;

  /**
   * Login applicant and generate token
   * @param email - Applicant email
   * @returns Promise<string> - JWT token
   * @throws UnauthorizedException - When credentials are invalid
   */
  loginApplicant(email: string): Promise<string>;

  /**
   * Get applicant profile by ID
   * @param id - Applicant ID
   * @returns Promise<Applicant> - Applicant profile
   * @throws NotFoundException - When applicant not found
   */
  findById(id: string): Promise<Applicant>;

  /**
   * Update applicant profile
   * @param id - Applicant ID
   * @param updateDto - Update data
   * @returns Promise<Applicant> - Updated applicant
   * @throws NotFoundException - When applicant not found
   * @throws BadRequestException - When validation fails
   */
  updateProfile(
    id: string,
    updateDto: UpdateApplicantProfileDto
  ): Promise<Applicant>;

  /**
   * Apply for a vacancy
   * @param applicantId - Applicant ID
   * @param vacancyId - Vacancy ID
   * @returns Promise<Application> - Created application
   * @throws BadRequestException - When validation fails
   * @throws ConflictException - When already applied
   */
  applyForVacancy(applicantId: string, vacancyId: string): Promise<Application>;

  /**
   * Get application tracking information
   * @param applicantId - Applicant ID
   * @param applicationId - Application ID
   * @returns Promise<ApplicationTrackingResponseDto> - Tracking information
   * @throws NotFoundException - When application not found
   */
  getApplicationTracking(
    applicantId: string,
    applicationId: string
  ): Promise<ApplicationTrackingResponseDto>;

  /**
   * Get all applications for an applicant
   * @param applicantId - Applicant ID
   * @returns Promise<Application[]> - List of applications
   */
  getApplicantApplications(applicantId: string): Promise<Application[]>;

  /**
   * Get public tracking data by registration code + email (no auth required)
   * @param query - Email and registrationCode
   * @returns Promise<ApplicationTrackingPublicDto> - Candidate-safe tracking data
   * @throws NotFoundException - When no matching application found
   */
  getApplicationTrackingByCode(query: ApplicationTrackingQueryDto): Promise<ApplicationTrackingPublicDto>;
}

/**
 * Interface for token service operations
 * Defines the contract for JWT token management
 */
export interface ITokenService {
  /**
   * Generate JWT token for applicant
   * @param applicantId - Applicant ID
   * @returns Promise<string> - JWT token
   */
  generateToken(applicantId: string): Promise<string>;

  /**
   * Validate JWT token
   * @param token - JWT token to validate
   * @returns Promise<string | null> - Applicant ID if valid, null otherwise
   * @throws UnauthorizedException - When token is invalid or expired
   */
  validateToken(token: string): Promise<string | null>;

  /**
   * Revoke token (logout)
   * @param token - JWT token to revoke
   * @returns Promise<boolean> - Success status
   */
  revokeToken(token: string): Promise<boolean>;
}

/**
 * Interface for applicant repository operations
 * Defines the contract for data access layer
 */
export interface IApplicantRepository {
  /**
   * Find applicant by email
   * @param email - Applicant email
   * @returns Promise<Applicant | null> - Applicant or null if not found
   */
  findByEmail(email: string): Promise<Applicant | null>;

  /**
   * Find applicant by ID
   * @param id - Applicant ID
   * @returns Promise<Applicant | null> - Applicant or null if not found
   */
  findById(id: string): Promise<Applicant | null>;

  /**
   * Create new applicant
   * @param applicant - Applicant data
   * @returns Promise<Applicant> - Created applicant
   */
  create(applicant: Partial<Applicant>): Promise<Applicant>;

  /**
   * Update applicant
   * @param id - Applicant ID
   * @param updateData - Update data
   * @returns Promise<Applicant> - Updated applicant
   */
  update(id: string, updateData: Partial<Applicant>): Promise<Applicant>;

  /**
   * Delete applicant (soft delete)
   * @param id - Applicant ID
   * @returns Promise<boolean> - Success status
   */
  delete(id: string): Promise<boolean>;
}
