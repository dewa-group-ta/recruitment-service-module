import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  Logger
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In } from "typeorm";
import { Applicant } from "../entities/applicant.entity";
import { RegisterApplicantDto } from "../dto/register-applicant.dto";
import { TokenService } from "./token.service";
import { Vacancy } from "src/modules/vacancies/entities/vacancy.entity";
import { JobStatus } from "src/shared/enums/job-status.enum";
import { Application } from "../entities/application.entity";
import { ApplicantStatus } from "src/shared/enums/applicant.enum";
import { UpdateApplicantProfileDto } from "../dto/update-applicant-profile.dto";
import { CreateAddressDto, UpdateAddressDto } from "../dto/address.dto";
import { CreateIdentityDto, UpdateIdentityDto } from "../dto/identity.dto";
import { CreateEducationDto, UpdateEducationDto } from "../dto/education.dto";
import {
  CreateJobHistoryDto,
  UpdateJobHistoryDto
} from "../dto/job-history.dto";
import {
  CreateProjectHistoryDto,
  UpdateProjectHistoryDto
} from "../dto/project-history.dto";
import { ApplicantAddress } from "../entities/applicant-address.entity";
import { ApplicantIdentity } from "../entities/applicant-identity.entity";
import { ApplicantEducation } from "../entities/applicant-education.entity";
import { ApplicantJobHistory } from "../entities/applicant-job-history.entity";
import { ApplicantProjectHistory } from "../entities/applicant-project-history.entity";
import { ApplicantSource } from "../entities/applicant-source.entity";
import { ApplyApplicantDto } from "../dto/apply-applicant.dto";
import { PipelineStage } from "../../vacancies/entities/pipeline-stage.entity";
import { StageActivity } from "../../vacancies/entities/stage-activity.entity";
import { ApplicationTrackingResponseDto } from "../dto/application-tracking-response.dto";
import { IApplicantService } from "../../../shared/interfaces/applicant.interface";
import { StageActivityStatus } from "src/shared/enums/pipeline.enum";
import { ApplicantResultsService } from "src/modules/applicant-results/services/applicant-results.service";
import { File, FileType } from "../../../shared/entities/file.entity";
import { ApplyApplicantResponseDto } from "../dto/apply-applicant-response.dto";
import { EvaluationResultResponseDto } from "src/modules/applicant-results/dto/evaluation-result-response.dto";

/**
 * Service for managing applicant operations
 * Handles applicant registration, authentication, profile management, and application tracking
 *
 * @class ApplicantService
 * @implements {IApplicantService}
 */
@Injectable()
export class ApplicantService implements IApplicantService {
  private readonly logger = new Logger(ApplicantService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly tokenService: TokenService,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Vacancy)
    private readonly vacancyRepository: Repository<Vacancy>,
    @InjectRepository(ApplicantAddress)
    private readonly addressRepository: Repository<ApplicantAddress>,
    @InjectRepository(ApplicantIdentity)
    private readonly identityRepository: Repository<ApplicantIdentity>,
    @InjectRepository(ApplicantEducation)
    private readonly educationRepository: Repository<ApplicantEducation>,
    @InjectRepository(ApplicantJobHistory)
    private readonly jobHistoryRepository: Repository<ApplicantJobHistory>,
    @InjectRepository(ApplicantProjectHistory)
    private readonly projectHistoryRepository: Repository<ApplicantProjectHistory>,
    @InjectRepository(ApplicantSource)
    private readonly applicantSourceRepository: Repository<ApplicantSource>,
    @InjectRepository(PipelineStage)
    private readonly pipelineStageRepository: Repository<PipelineStage>,
    @InjectRepository(StageActivity)
    private readonly stageActivityRepository: Repository<StageActivity>,
    private readonly applicantResultsService: ApplicantResultsService,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  /**
   * Register a new applicant
   * Creates a new applicant record and associated application
   *
   * @param registerDto - Registration data containing applicant information and vacancy details
   * @returns Promise<boolean> - Registration success status
   * @throws BadRequestException - When validation fails or vacancy is not available
   * @throws ConflictException - When applicant already exists or has already applied
   *
   * @example
   * ```typescript
   * const registerDto = {
   *   fullName: 'John Doe',
   *   email: 'john@example.com',
   *   phone: '+6281234567890',
   *   vacancyId: 'uuid-string',
   *   applicantSourceIds: ['source-uuid-1', 'source-uuid-2']
   * };
   *
   * const success = await applicantService.registerApplicant(registerDto);
   * ```
   */
  async registerApplicant(registerDto: RegisterApplicantDto): Promise<{ applicantId: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate vacancy and application eligibility
      const vacancy = await this.validateVacancyAndEligibility(
        registerDto,
        queryRunner
      );

      // Find or create applicant
      const applicant = await this.findOrCreateApplicant(
        registerDto,
        queryRunner
      );

      // Check for existing application
      await this.checkExistingApplication(applicant.id, registerDto.vacancyId);

      // Create application
      await this.createApplication(
        applicant,
        vacancy,
        registerDto.customSource,
        queryRunner
      );

      await queryRunner.commitTransaction();

      await this.sendLoginToken(applicant.id, vacancy.title);  // tetap kirim token

      return { applicantId: applicant.id };  // ← return applicantId
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validate vacancy and check application eligibility
   */
  private async validateVacancyAndEligibility(
    registerDto: RegisterApplicantDto,
    queryRunner: any
  ): Promise<Vacancy> {
    const vacancy = await this.vacancyRepository.findOne({
      where: { id: registerDto.vacancyId },
      relations: ["pipeline"]
    });

    if (!vacancy) {
      throw new NotFoundException("Vacancy not found");
    }

    if (vacancy.status !== JobStatus.PUBLISHED) {
      throw new BadRequestException(
        "Vacancy is not available for applications"
      );
    }

    if (vacancy.endDate && new Date() > vacancy.endDate) {
      throw new BadRequestException("Application deadline has passed");
    }

    if (vacancy.applicantLimit) {
      const currentApplicationsCount = await this.applicationRepository.count({
        where: { vacancyId: registerDto.vacancyId }
      });

      if (currentApplicationsCount >= vacancy.applicantLimit) {
        throw new BadRequestException(
          "Application limit reached for this vacancy"
        );
      }
    }

    if (
      registerDto.applicantSourceIds &&
      registerDto.applicantSourceIds.length > 0
    ) {
      const applicantSources = await queryRunner.manager.find(ApplicantSource, {
        where: { id: In(registerDto.applicantSourceIds), isActive: true }
      });
      if (applicantSources.length !== registerDto.applicantSourceIds.length) {
        const foundIds = applicantSources.map(
          (source: ApplicantSource) => source.id
        );
        const missingIds = registerDto.applicantSourceIds.filter(
          (id) => !foundIds.includes(id)
        );
        throw new BadRequestException(
          `Invalid applicant sources: ${missingIds.join(", ")}`
        );
      }
    }

    return vacancy;
  }

  /**
   * Find or create applicant
   */
  private async findOrCreateApplicant(
    registerDto: RegisterApplicantDto,
    queryRunner: any
  ): Promise<Applicant> {
    let applicant = await this.applicantRepository.findOne({
      where: { email: registerDto.email },
      relations: ["applicantSources"]
    });

    if (!applicant) {
      applicant = this.applicantRepository.create({
        email: registerDto.email,
        fullName: registerDto.fullName,
        phone: registerDto.phone
      });
      applicant = await queryRunner.manager.save(applicant);
    }

    if (!applicant) {
      throw new BadRequestException("Failed to create or update applicant");
    }

    // Handle applicant sources if provided
    if (
      registerDto.applicantSourceIds &&
      registerDto.applicantSourceIds.length > 0
    ) {
      await this.handleApplicantSources(
        applicant,
        registerDto.applicantSourceIds,
        queryRunner
      );
    }

    return applicant;
  }

  /**
   * Handle applicant sources for an applicant
   */
  private async handleApplicantSources(
    applicant: Applicant,
    applicantSourceIds: string[],
    queryRunner: any
  ): Promise<void> {
    // Validate that all applicant source IDs exist
    const applicantSources = await this.applicantSourceRepository.findBy({
      id: In(applicantSourceIds)
    });

    if (applicantSources.length !== applicantSourceIds.length) {
      const foundIds = applicantSources.map((source) => source.id);
      const missingIds = applicantSourceIds.filter(
        (id) => !foundIds.includes(id)
      );
      throw new BadRequestException(
        `Applicant sources not found: ${missingIds.join(", ")}`
      );
    }

    // Update applicant sources relationship
    applicant.applicantSources = applicantSources;
    await queryRunner.manager.save(Applicant, applicant);
  }

  /**
   * Check if applicant already applied for this vacancy
   */
  private async checkExistingApplication(
    applicantId: string,
    vacancyId: string
  ): Promise<void> {
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        applicantId,
        vacancyId
      }
    });

    if (existingApplication) {
      throw new BadRequestException(
        "You have already applied for this vacancy"
      );
    }
  }

  /**
   * Create application
   */
  private async createApplication(
    applicant: Applicant,
    vacancy: Vacancy,
    customSource: string | undefined,
    queryRunner: any
  ): Promise<void> {
    const applicationNumber = await this.generateApplicationNumber(vacancy.jobCode);

    const application = this.applicationRepository.create({
      applicationNumber,
      applicantId: applicant.id,
      vacancyId: vacancy.id,
      pipelineId: vacancy.pipelineId,
      status: ApplicantStatus.NEW,
      appliedAt: new Date(),
      lastActivityAt: new Date(),
      customSource: customSource || undefined
    });

    await queryRunner.manager.save(application);
  }

  /**
   * Send login token
   */
  private async sendLoginToken(
    applicantId: string,
    vacancyTitle: string
  ): Promise<boolean> {
    try {
      await this.tokenService.generateAndSendLoginToken(
        applicantId,
        vacancyTitle
      );
      return true;
    } catch (error) {
      console.error("Failed to send login token:", error);
      return false;
    }
  }

  /**
   * Get current applicant profile with all related data
   * @param applicantId - Applicant ID from authenticated token
   * @returns Applicant profile with relations
   */
  async getMe(applicantId: string): Promise<Applicant> {
    const applicant = await this.applicantRepository.findOne({
      where: { id: applicantId },
      relations: {
        applications: {
          vacancy: {
            jobCategory: true
          }
        }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        applications: {
          id: true,
          applicationNumber: true,
          status: true,
          appliedAt: true,
          lastActivityAt: true,
          createdAt: true,
          vacancy: {
            id: true,
            title: true,
            jobCategory: {
              id: true,
              name: true
            }
          }
        }
      },
      order: {
        applications: {
          createdAt: "DESC"
        }
      }
    });

    if (!applicant) {
      throw new NotFoundException("Applicant not found");
    }

    return applicant;
  }

  /**
   * Generate unique application number
   * @returns Application number
   */
  private async generateApplicationNumber(jobCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const prefix = `${jobCode}${year}${month}`;

    // Get the last application number for this year
    const lastApplication = await this.applicationRepository
      .createQueryBuilder("application")
      .where("application.applicationNumber LIKE :prefix", {
        prefix: `${prefix}-%`
      })
      .orderBy("application.applicationNumber", "DESC")
      .getOne();

    let sequence = 1;
    if (lastApplication) {
      const lastSequence = parseInt(
        lastApplication.applicationNumber.split("-")[2]
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(3, "0")}`;
  }

  /**
   * Update applicant profile
   * @param applicantId - Applicant ID
   * @param updateDto - Update data
   */
  async updateProfile(
    applicantId: string,
    updateDto: UpdateApplicantProfileDto
  ): Promise<Applicant> {
    const applicant = await this.applicantRepository.findOne({
      where: { id: applicantId }
    });

    if (!applicant) {
      throw new NotFoundException("Applicant not found");
    }

    // Update only provided fields
    Object.assign(applicant, updateDto);

    return await this.applicantRepository.save(applicant);
  }

  // ========== ADDRESS MANAGEMENT ==========

  /**
   * Create new address for applicant
   * @param applicantId - Applicant ID
   * @param createDto - Address data
   */
  async createAddress(
    applicantId: string,
    createDto: CreateAddressDto
  ): Promise<ApplicantAddress> {
    const address = this.addressRepository.create({
      ...createDto,
      applicantId
    });

    return await this.addressRepository.save(address);
  }

  /**
   * Get all addresses for applicant
   * @param applicantId - Applicant ID
   */
  async getAddresses(applicantId: string): Promise<ApplicantAddress[]> {
    return await this.addressRepository.find({
      where: { applicantId },
      order: { createdAt: "ASC" }
    });
  }

  /**
   * Update address
   * @param addressId - Address ID
   * @param applicantId - Applicant ID
   * @param updateDto - Update data
   */
  async updateAddress(
    addressId: string,
    applicantId: string,
    updateDto: UpdateAddressDto
  ): Promise<ApplicantAddress> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, applicantId }
    });

    if (!address) {
      throw new NotFoundException("Address not found");
    }

    Object.assign(address, updateDto);
    return await this.addressRepository.save(address);
  }

  /**
   * Delete address
   * @param addressId - Address ID
   * @param applicantId - Applicant ID
   */
  async deleteAddress(addressId: string, applicantId: string): Promise<void> {
    const result = await this.addressRepository.softDelete({
      id: addressId,
      applicantId
    });

    if (result.affected === 0) {
      throw new NotFoundException("Address not found");
    }
  }

  // ========== IDENTITY MANAGEMENT ==========

  /**
   * Create new identity for applicant
   * @param applicantId - Applicant ID
   * @param createDto - Identity data
   */
  async createIdentity(
    applicantId: string,
    createDto: CreateIdentityDto
  ): Promise<ApplicantIdentity> {
    const identity = this.identityRepository.create({
      ...createDto,
      applicantId
    });

    return await this.identityRepository.save(identity);
  }

  /**
   * Get all identities for applicant
   * @param applicantId - Applicant ID
   */
  async getIdentities(applicantId: string): Promise<ApplicantIdentity[]> {
    return await this.identityRepository.find({
      where: { applicantId },
      order: { createdAt: "ASC" }
    });
  }

  /**
   * Update identity
   * @param identityId - Identity ID
   * @param applicantId - Applicant ID
   * @param updateDto - Update data
   */
  async updateIdentity(
    identityId: string,
    applicantId: string,
    updateDto: UpdateIdentityDto
  ): Promise<ApplicantIdentity> {
    const identity = await this.identityRepository.findOne({
      where: { id: identityId, applicantId }
    });

    if (!identity) {
      throw new NotFoundException("Identity not found");
    }

    Object.assign(identity, updateDto);
    return await this.identityRepository.save(identity);
  }

  /**
   * Delete identity
   * @param identityId - Identity ID
   * @param applicantId - Applicant ID
   */
  async deleteIdentity(identityId: string, applicantId: string): Promise<void> {
    const result = await this.identityRepository.softDelete({
      id: identityId,
      applicantId
    });

    if (result.affected === 0) {
      throw new NotFoundException("Identity not found");
    }
  }

  // ========== EDUCATION MANAGEMENT ==========

  /**
   * Create new education for applicant
   * @param applicantId - Applicant ID
   * @param createDto - Education data
   */
  async createEducation(
    applicantId: string,
    createDto: CreateEducationDto
  ): Promise<ApplicantEducation> {
    const education = this.educationRepository.create({
      ...createDto,
      applicantId
    });

    return await this.educationRepository.save(education);
  }

  /**
   * Get all educations for applicant
   * @param applicantId - Applicant ID
   */
  async getEducations(applicantId: string): Promise<ApplicantEducation[]> {
    return await this.educationRepository.find({
      where: { applicantId },
      order: { order: "ASC", createdAt: "ASC" }
    });
  }

  /**
   * Update education
   * @param educationId - Education ID
   * @param applicantId - Applicant ID
   * @param updateDto - Update data
   */
  async updateEducation(
    educationId: string,
    applicantId: string,
    updateDto: UpdateEducationDto
  ): Promise<ApplicantEducation> {
    const education = await this.educationRepository.findOne({
      where: { id: educationId, applicantId }
    });

    if (!education) {
      throw new NotFoundException("Education not found");
    }

    Object.assign(education, updateDto);
    return await this.educationRepository.save(education);
  }

  /**
   * Delete education
   * @param educationId - Education ID
   * @param applicantId - Applicant ID
   */
  async deleteEducation(
    educationId: string,
    applicantId: string
  ): Promise<void> {
    const result = await this.educationRepository.softDelete({
      id: educationId,
      applicantId
    });

    if (result.affected === 0) {
      throw new NotFoundException("Education not found");
    }
  }

  // ========== JOB HISTORY MANAGEMENT ==========

  /**
   * Create new job history for applicant
   * @param applicantId - Applicant ID
   * @param createDto - Job history data
   */
  async createJobHistory(
    applicantId: string,
    createDto: CreateJobHistoryDto
  ): Promise<ApplicantJobHistory> {
    const jobHistory = this.jobHistoryRepository.create({
      ...createDto,
      applicantId
    });

    return await this.jobHistoryRepository.save(jobHistory);
  }

  /**
   * Get all job histories for applicant
   * @param applicantId - Applicant ID
   */
  async getJobHistories(applicantId: string): Promise<ApplicantJobHistory[]> {
    return await this.jobHistoryRepository.find({
      where: { applicantId },
      order: { order: "ASC", createdAt: "ASC" }
    });
  }

  /**
   * Update job history
   * @param jobHistoryId - Job history ID
   * @param applicantId - Applicant ID
   * @param updateDto - Update data
   */
  async updateJobHistory(
    jobHistoryId: string,
    applicantId: string,
    updateDto: UpdateJobHistoryDto
  ): Promise<ApplicantJobHistory> {
    const jobHistory = await this.jobHistoryRepository.findOne({
      where: { id: jobHistoryId, applicantId }
    });

    if (!jobHistory) {
      throw new NotFoundException("Job history not found");
    }

    Object.assign(jobHistory, updateDto);
    return await this.jobHistoryRepository.save(jobHistory);
  }

  /**
   * Delete job history
   * @param jobHistoryId - Job history ID
   * @param applicantId - Applicant ID
   */
  async deleteJobHistory(
    jobHistoryId: string,
    applicantId: string
  ): Promise<void> {
    const result = await this.jobHistoryRepository.softDelete({
      id: jobHistoryId,
      applicantId
    });

    if (result.affected === 0) {
      throw new NotFoundException("Job history not found");
    }
  }

  // ========== PROJECT HISTORY MANAGEMENT ==========

  /**
   * Create new project history for applicant
   * @param applicantId - Applicant ID
   * @param createDto - Project history data
   */
  async createProjectHistory(
    applicantId: string,
    createDto: CreateProjectHistoryDto
  ): Promise<ApplicantProjectHistory> {
    const projectHistory = this.projectHistoryRepository.create({
      ...createDto,
      applicantId
    });

    return await this.projectHistoryRepository.save(projectHistory);
  }

  /**
   * Get all project histories for applicant
   * @param applicantId - Applicant ID
   */
  async getProjectHistories(
    applicantId: string
  ): Promise<ApplicantProjectHistory[]> {
    return await this.projectHistoryRepository.find({
      where: { applicantId },
      order: { order: "ASC", createdAt: "ASC" }
    });
  }

  /**
   * Update project history
   * @param projectHistoryId - Project history ID
   * @param applicantId - Applicant ID
   * @param updateDto - Update data
   */
  async updateProjectHistory(
    projectHistoryId: string,
    applicantId: string,
    updateDto: UpdateProjectHistoryDto
  ): Promise<ApplicantProjectHistory> {
    const projectHistory = await this.projectHistoryRepository.findOne({
      where: { id: projectHistoryId, applicantId }
    });

    if (!projectHistory) {
      throw new NotFoundException("Project history not found");
    }

    Object.assign(projectHistory, updateDto);
    return await this.projectHistoryRepository.save(projectHistory);
  }

  /**
   * Delete project history
   * @param projectHistoryId - Project history ID
   * @param applicantId - Applicant ID
   */
  async deleteProjectHistory(
    projectHistoryId: string,
    applicantId: string
  ): Promise<void> {
    const result = await this.projectHistoryRepository.softDelete({
      id: projectHistoryId,
      applicantId
    });

    if (result.affected === 0) {
      throw new NotFoundException("Project history not found");
    }
  }

  // =============================================================================
// FILE: applicant.service.ts
//
// Dua perubahan di file ini:
//
//  1. applyForPosition  → tambah blok pembuatan CV snapshot di dalam transaksi
//  2. isReferencedByApplication  → method baru, dipanggil dari controller
//
// Salin kedua method ini ke dalam class ApplicantService yang sudah ada.
// Tidak ada perubahan di bagian lain service.
// =============================================================================
 
// -----------------------------------------------------------------------------
// PERUBAHAN 1: applyForPosition
// Ganti seluruh method applyForPosition yang lama dengan versi di bawah ini.
//
// Yang ditambahkan:
//   - Blok "Buat snapshot File" di dalam transaksi, setelah stage activity dibuat.
//     Snapshot ini menyalin metadata file CV pelamar ke record baru dengan
//     relatedEntity='application', sehingga relasi Application → File (CV) menjadi
//     ada secara eksplisit dan bisa ditelusuri tanpa bergantung pada applicant.cvUrl.
// -----------------------------------------------------------------------------
 
async applyForPosition(
  applicationId: string,
  applyDto: ApplyApplicantDto
): Promise<ApplyApplicantResponseDto> {

  // 1. Cari application (tetap sama)
  const application = await this.applicationRepository.findOne({
    where: { id: applicationId },
    relations: ["applicant"]
  });

  if (!application) throw new NotFoundException("Application not found");

  if (application.status !== ApplicantStatus.NEW) {
    throw new BadRequestException(`Cannot apply...`);
  }

  const applicantId = application.applicantId;

  // 2. Validasi CV (tetap sama)
  const cvFile = await this.fileRepository.findOne({
    where: {
      relatedEntity:   "applicant",
      relatedEntityId: applicantId,
      fileType:        FileType.CV,
      isActive:        true
    }
  });

  if (!cvFile) {
    throw new BadRequestException("CV belum diupload...");
  }

  // 3. ✅ SCORING DULU sebelum transaksi DB
  const scoringResult = await this.applicantResultsService.runScoring(
    applicationId,
    cvFile.filePath
  );
  // Jika gagal → langsung throw error ke applicant, transaksi tidak pernah jalan

  // 4. ✅ Scoring berhasil → baru jalankan transaksi DB
  const result = await this.dataSource.transaction(async (manager) => {
    const applicant = await manager.findOne(Applicant, { where: { id: applicantId } });
    if (!applicant) throw new NotFoundException("Applicant not found");

    Object.assign(applicant, {
      fullName:         applyDto.fullName,
      phone:            applyDto.phone,
      alternativePhone: applyDto.alternativePhone,
      gender:           applyDto.gender,
      maritalStatus:    applyDto.maritalStatus,
      placeOfBirth:     applyDto.placeOfBirth,
      dateOfBirth:      new Date(applyDto.dateOfBirth),
      linkedinUrl:      applyDto.linkedinUrl,
      socialMediaUrl:   applyDto.socialMediaUrl,
      availability:     applyDto.availability,
      availabilityAt:   applyDto.availabilityAt ? new Date(applyDto.availabilityAt) : null
    });

    const updatedApplicant = await manager.save(Applicant, applicant);

    await manager.softDelete(ApplicantAddress, { applicantId });
    await manager.save(ApplicantAddress, applyDto.addresses.map(a =>
      manager.create(ApplicantAddress, { ...a, applicantId })
    ));

    await manager.softDelete(ApplicantIdentity, { applicantId });
    await manager.save(ApplicantIdentity, applyDto.identities.map(i =>
      manager.create(ApplicantIdentity, { ...i, applicantId })
    ));

    application.status    = ApplicantStatus.APPLIED;
    application.appliedAt = new Date();
    const updatedApplication = await manager.save(Application, application);

    const firstStage = await manager.findOne(PipelineStage, {
      where: { pipelineId: application.pipelineId },
      order: { stageOrder: "ASC" }
    });
    if (!firstStage) throw new NotFoundException("First stage not found");

    await manager.save(StageActivity, manager.create(StageActivity, {
      applicationId: application.id,
      stageId:       firstStage.id,
      createdAt:     new Date(),
      status:        StageActivityStatus.IN_PROGRESS
    }));

    application.currentStageId = firstStage.id;
    application.lastActivityAt = new Date();
    await manager.save(Application, application);

    await manager.save(File, manager.create(File, {
      fileName:        cvFile.fileName,
      originalName:    cvFile.originalName,
      filePath:        cvFile.filePath,
      fileSize:        cvFile.fileSize,
      mimeType:        cvFile.mimeType,
      bucket:          cvFile.bucket,
      fileType:        FileType.CV,
      relatedEntity:   "application",
      relatedEntityId: application.id,
      uploadedById:    applicantId,
      description:     `CV snapshot - ${application.applicationNumber}`
    }));

    return { applicant: updatedApplicant, application: updatedApplication };
  });

  // 5. ✅ Simpan hasil scoring ke DB (karena runScoring sekarang return hasil)
  await this.applicantResultsService.saveResults(scoringResult, applicantId);

  const maxScore = scoringResult.experience?.length
    ? Math.max(...scoringResult.experience.map(e => e.similarity ?? 0))
    : 0;

  const evaluationResult: EvaluationResultResponseDto = {
    maxExperienceScore: maxScore,
    evaluatedAt: new Date(),
    scoringBreakdown: {
      experiences: (scoringResult.experience ?? []).map(e => ({
        role:          e.role          ?? null,
        description:   e.description   ?? null,
        start:         e.start         ?? null,
        end:           e.end           ?? null,
        durationYears: e.duration_years ?? null,
        similarity:    e.similarity    ?? null,
        isTopMatch:    Math.abs((e.similarity ?? 0) - maxScore) < 0.0001
      })),
      educations: (scoringResult.educations ?? []).map(e => ({
        level:       e.level       ?? null,
        major:       e.major       ?? null,
        institution: e.institution ?? null
      }))
    }
  };

  return {
    applicant:       result.applicant,
    application:     result.application,
    evaluationResult
  };
}
 
// -----------------------------------------------------------------------------
// PERUBAHAN 2: isReferencedByApplication  (method BARU)
// Tambahkan method ini ke dalam class ApplicantService.
// Letakkan di bagian bawah class, bersama method-method helper lainnya.
//
// Digunakan oleh controller sebelum menghapus file CV lama dari MinIO,
// untuk memastikan tidak ada application-level snapshot yang masih mengandalkan
// file tersebut. Jika masih ada, file fisik di MinIO dibiarkan — hanya record
// di level applicant yang akan digantikan oleh upload baru.
// -----------------------------------------------------------------------------
 
/**
 * Memeriksa apakah suatu path file CV masih direferensikan oleh
 * application-level snapshot (relatedEntity = 'application').
 *
 * Dipanggil dari controller saat pelamar mengupload CV baru, sebelum
 * file lama dihapus dari MinIO, untuk mencegah penghapusan file yang
 * masih dipakai oleh lamaran sebelumnya.
 *
 * @param filePath - Path file di MinIO yang ingin diperiksa
 * @returns true jika masih ada snapshot aktif yang mereferensikan path ini
 */
async isReferencedByApplication(filePath: string): Promise<boolean> {
  const snapshot = await this.fileRepository.findOne({
    where: {
      filePath:      filePath,
      relatedEntity: "application",
      isActive:      true
    }
  });
  return snapshot !== null;
}

  /**
   * Parse date from DD-MM-YY format to Date object
   * @param dateString - Date string in DD-MM-YY format
   */
  private parseDate(dateString: string): Date | undefined {
    if (!dateString) return undefined;

    const [day, month, year] = dateString.split("-");
    // Convert 2-digit year to 4-digit year (assuming 20xx)
    const fullYear =
      parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
    return new Date(fullYear, parseInt(month) - 1, parseInt(day));
  }

  /**
   * Get application tracking information for the latest application
   * @param applicantId - Applicant ID
   * @returns Application tracking data with stages and progress
   */
  async getApplicationTracking(
    applicantId: string
  ): Promise<ApplicationTrackingResponseDto> {
    // 1. Get the latest application for this applicant
    const latestApplication = await this.applicationRepository.findOne({
      where: { applicantId },
      order: { createdAt: "DESC" },
      relations: ["vacancy", "pipeline", "currentStage", "activities"]
    });

    if (!latestApplication) {
      throw new NotFoundException("No application found for this applicant");
    }

    // 2. Get all stages from the pipeline
    const pipelineStages = await this.pipelineStageRepository.find({
      where: { pipelineId: latestApplication.pipelineId },
      order: { stageOrder: "ASC" },
      relations: ["stageTemplate"]
    });

    // 3. Get activities for this application
    const activities = await this.stageActivityRepository.find({
      where: { applicationId: latestApplication.id },
      order: { createdAt: "ASC" }
    });

    // 4. Map stages with status based on current stage and activities
    const stagesWithStatus = pipelineStages.map((stage) => {
      const stageActivities = activities.filter(
        (activity) => activity.stageId === stage.id
      );
      const status = stageActivities.length > 0 ? stageActivities[stageActivities.length - 1].status : "pending";

      return {
        id: stage.id,
        stageOrder: stage.stageOrder,
        stageName: stage.stageTemplate.name,
        status,
        startedAt:
          stageActivities.length > 0 ? stageActivities[0].createdAt : undefined,
        completedAt:
          status === "done"
            ? stageActivities[stageActivities.length - 1]?.createdAt
            : undefined,
        currentScore:
          stageActivities.length > 0
            ? stageActivities[stageActivities.length - 1].score
            : undefined,
        currentNotes:
          stageActivities.length > 0
            ? stageActivities[stageActivities.length - 1].notes
            : undefined
      };
    });

    // 5. Get current stage info
    const currentStage = this.getCurrentStageInfo(
      latestApplication,
      stagesWithStatus
    );

    // 6. Calculate progress
    const progress = this.calculateProgress(
      stagesWithStatus,
      latestApplication
    );

    return {
      application: {
        id: latestApplication.id,
        applicationNumber: latestApplication.applicationNumber,
        vacancyTitle: latestApplication.vacancy.title,
        status: latestApplication.status,
        appliedAt: latestApplication.appliedAt,
        lastActivityAt: latestApplication.lastActivityAt
      },
      stages: stagesWithStatus,
      currentStage,
      progress
    };
  }
  /**
   * Get current stage information
   */
  private getCurrentStageInfo(application: Application, stages: any[]): any {
    const currentStage = stages.find(
      (stage) => stage.id === application.currentStageId
    );

    if (!currentStage) {
      return null;
    }

    const daysInCurrentStage = application.lastActivityAt
      ? Math.floor(
          (new Date().getTime() - application.lastActivityAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const estimatedRemainingDays = currentStage.estimatedDurationDays || 5;
    const progressPercentage = Math.min(
      85,
      (daysInCurrentStage / estimatedRemainingDays) * 100
    );

    return {
      id: currentStage.id,
      stageOrder: currentStage.stageOrder,
      stageName: currentStage.stageName,
      stageType: currentStage.stageType,
      status: currentStage.status,
      daysInCurrentStage,
      estimatedRemainingDays: Math.max(
        0,
        estimatedRemainingDays - daysInCurrentStage
      ),
      progressPercentage: Math.round(progressPercentage)
    };
  }

  /**
   * Calculate overall progress
   */
  private calculateProgress(stages: any[], application: Application): any {
    const totalStages = stages.length;
    const completedStages = stages.filter(
      (stage) => stage.status === "completed"
    ).length;
    const currentStageOrder = application.currentStage?.stageOrder || 1;
    const overallProgressPercentage = Math.round(
      (completedStages / totalStages) * 100
    );

    const daysSinceApplication = application.appliedAt
      ? Math.floor(
          (new Date().getTime() - application.appliedAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    // Estimate completion date (rough calculation)
    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setDate(
      estimatedCompletionDate.getDate() + (totalStages - completedStages) * 3
    );

    return {
      totalStages,
      completedStages,
      currentStageOrder,
      overallProgressPercentage,
      estimatedCompletionDate,
      daysSinceApplication
    };
  }

  /**
   * Login applicant and generate token
   * @param email - Applicant email
   * @returns Promise<string> - JWT token
   * @throws UnauthorizedException - When credentials are invalid
   */
  async loginApplicant(email: string): Promise<string> {
    const applicant = await this.applicantRepository.findOne({
      where: { email }
    });

    if (!applicant) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return await this.tokenService.generateAndSendLoginToken(
      applicant.id,
      "Login"
    );
  }

  /**
   * Get applicant profile by ID
   * @param id - Applicant ID
   * @returns Promise<Applicant> - Applicant profile
   * @throws NotFoundException - When applicant not found
   */
  async findById(id: string): Promise<Applicant> {
    const applicant = await this.applicantRepository.findOne({
      where: { id }
    });

    if (!applicant) {
      throw new NotFoundException("Applicant not found");
    }

    return applicant;
  }

  /**
   * Apply for a vacancy
   * @param applicantId - Applicant ID
   * @param vacancyId - Vacancy ID
   * @returns Promise<Application> - Created application
   * @throws BadRequestException - When validation fails
   * @throws ConflictException - When already applied
   */
  async applyForVacancy(
    applicantId: string,
    vacancyId: string
  ): Promise<Application> {
    // Check if already applied
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        applicantId,
        vacancyId
      }
    });

    if (existingApplication) {
      throw new ConflictException("Already applied for this vacancy");
    }

    // Create new application
    const application = this.applicationRepository.create({
      applicantId,
      vacancyId,
      appliedAt: new Date()
    });

    return await this.applicationRepository.save(application);
  }

  /**
   * Get all applications for an applicant
   * @param applicantId - Applicant ID
   * @returns Promise<Application[]> - List of applications
   */
  async getApplicantApplications(applicantId: string): Promise<Application[]> {
    return await this.applicationRepository.find({
      where: { applicantId },
      relations: ["vacancy", "currentStage"]
    });
  }
}