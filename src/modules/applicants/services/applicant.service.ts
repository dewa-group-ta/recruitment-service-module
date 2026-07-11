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
import { QuickApplyDto, QuickApplyResponseDto } from "../dto/quick-apply.dto";
import {
  ApplyFormBasedDto,
  ApplyFormBasedResponseDto
} from "../dto/apply-form-based.dto";
import { PipelineStage } from "../../vacancies/entities/pipeline-stage.entity";
import { StageActivity } from "../../vacancies/entities/stage-activity.entity";
import { ApplicationTrackingResponseDto } from "../dto/application-tracking-response.dto";
import { IApplicantService } from "../../../shared/interfaces/applicant.interface";
import { StageActivityStatus } from "src/shared/enums/pipeline.enum";
import { ApplicantResultsService } from "src/modules/applicant-results/services/applicant-results.service";
import { FileUploadService } from "../../../shared/services/file-upload.service";
import { FileUploadDto } from "../../../shared/dto/file-upload.dto";
import { File, FileType } from "../../../shared/entities/file.entity";
import { ApplyApplicantResponseDto } from "../dto/apply-applicant-response.dto";
import { EvaluationResultResponseDto } from "src/modules/applicant-results/dto/evaluation-result-response.dto";
import { EvaluationResult } from "src/modules/applicant-results/entities/evaluation-results.entity";
import {
  ApplicationTrackingPublicDto,
  ApplicationTrackingQueryDto
} from "../dto/application-tracking-public.dto";
import { EmailService } from "../../../shared/services/email.service";
import { SystemConfigEmailService } from "../../../shared/services/system-config-email.service";

/**
 * mengelola operasi pelamar: registrasi, autentikasi, profil, dan tracking aplikasi.
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
    @InjectRepository(EvaluationResult)
    private readonly evaluationResultRepository: Repository<EvaluationResult>,
    private readonly applicantResultsService: ApplicantResultsService,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly fileUploadService: FileUploadService,
    private readonly emailService: EmailService,
    private readonly systemConfigEmailService: SystemConfigEmailService
  ) {}

  /**
   * registrasi pelamar baru: buat record applicant + application terkait.
   * @throws BadRequestException - validasi gagal atau vacancy tidak tersedia
   * @throws ConflictException - pelamar sudah pernah apply ke vacancy ini
   */
  async registerApplicant(
    registerDto: RegisterApplicantDto
  ): Promise<{ applicantId: string; applicationId: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // validasi vacancy dan eligibility application (tanpa batasan kuota)
      const vacancy = await this.validateVacancyAndEligibility(
        registerDto,
        queryRunner
      );

      // cari atau buat applicant
      const applicant = await this.findOrCreateApplicant(
        registerDto,
        queryRunner
      );

      // cek application yang sudah ada di dalam transaksi untuk mencegah race condition
      const existingApplication = await queryRunner.manager.findOne(
        Application,
        {
          where: { applicantId: applicant.id, vacancyId: registerDto.vacancyId }
        }
      );
      if (existingApplication) {
        throw new BadRequestException(
          "You have already applied for this vacancy"
        );
      }

      // buat application — tangkap entity yang dikembalikan untuk dapat applicationId
      const application = await this.createApplication(
        applicant,
        vacancy,
        registerDto.customSource,
        queryRunner
      );

      await queryRunner.commitTransaction();

      await this.sendLoginToken(applicant.id, vacancy.title); // tetap kirim token

      return { applicantId: applicant.id, applicationId: application.id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

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

    // proses applicant source kalau disediakan
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

  private async handleApplicantSources(
    applicant: Applicant,
    applicantSourceIds: string[],
    queryRunner: any
  ): Promise<void> {
    // validasi semua id applicant source ada
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

    // update relasi applicant sources
    applicant.applicantSources = applicantSources;
    await queryRunner.manager.save(Applicant, applicant);
  }

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

  private async createApplication(
    applicant: Applicant,
    vacancy: Vacancy,
    customSource: string | undefined,
    queryRunner: any
  ): Promise<Application> {
    const applicationNumber = await this.generateApplicationNumberWithManager(
      queryRunner.manager,
      vacancy.jobCode
    );

    const application = queryRunner.manager.create(Application, {
      applicationNumber,
      applicantId: applicant.id,
      vacancyId: vacancy.id,
      pipelineId: vacancy.pipelineId,
      status: ApplicantStatus.APPLIED,
      appliedAt: new Date(),
      lastActivityAt: new Date(),
      customSource: customSource || undefined
    });

    return queryRunner.manager.save(application);
  }

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
      this.logger.error("Failed to send login token:", error);
      return false;
    }
  }

  // ambil profil applicant beserta relasi terkait (applications, vacancy, jobCategory)
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

  private async generateApplicationNumber(jobCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const prefix = `${jobCode}${year}${month}`;

    // ambil nomor aplikasi terakhir untuk tahun ini
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

    Object.assign(applicant, updateDto);

    return await this.applicantRepository.save(applicant);
  }

  // ========== manajemen alamat ==========

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

  async getAddresses(applicantId: string): Promise<ApplicantAddress[]> {
    return await this.addressRepository.find({
      where: { applicantId },
      order: { createdAt: "ASC" }
    });
  }

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

  async deleteAddress(addressId: string, applicantId: string): Promise<void> {
    const result = await this.addressRepository.softDelete({
      id: addressId,
      applicantId
    });

    if (result.affected === 0) {
      throw new NotFoundException("Address not found");
    }
  }

  // ========== manajemen identitas ==========

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

  async getIdentities(applicantId: string): Promise<ApplicantIdentity[]> {
    return await this.identityRepository.find({
      where: { applicantId },
      order: { createdAt: "ASC" }
    });
  }

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

  async deleteIdentity(identityId: string, applicantId: string): Promise<void> {
    const result = await this.identityRepository.softDelete({
      id: identityId,
      applicantId
    });

    if (result.affected === 0) {
      throw new NotFoundException("Identity not found");
    }
  }

  // ========== manajemen pendidikan ==========

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

  async getEducations(applicantId: string): Promise<ApplicantEducation[]> {
    return await this.educationRepository.find({
      where: { applicantId },
      order: { order: "ASC", createdAt: "ASC" }
    });
  }

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

  // ========== manajemen riwayat pekerjaan ==========

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

  async getJobHistories(applicantId: string): Promise<ApplicantJobHistory[]> {
    return await this.jobHistoryRepository.find({
      where: { applicantId },
      order: { order: "ASC", createdAt: "ASC" }
    });
  }

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

  // ========== manajemen riwayat proyek ==========

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

  async getProjectHistories(
    applicantId: string
  ): Promise<ApplicantProjectHistory[]> {
    return await this.projectHistoryRepository.find({
      where: { applicantId },
      order: { order: "ASC", createdAt: "ASC" }
    });
  }

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

  async applyForPosition(
    applicationId: string,
    applyDto: ApplyApplicantDto
  ): Promise<ApplyApplicantResponseDto> {
    // 1. cari application
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ["applicant"]
    });

    if (!application) throw new NotFoundException("Application not found");

    if (
      application.status === ApplicantStatus.HIRED ||
      application.status === ApplicantStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot apply for this position. Application has already been finalized.`
      );
    }

    const applicantId = application.applicantId;

    // 2. validasi cv
    const cvFile = await this.fileRepository.findOne({
      where: {
        relatedEntity: "applicant",
        relatedEntityId: applicantId,
        fileType: FileType.CV,
        isActive: true
      }
    });

    if (!cvFile) {
      throw new BadRequestException("CV belum diupload...");
    }

    // 3. scoring dulu sebelum transaksi db
    let scoringResult: any = null;
    let scoringError: string | null = null;
    try {
      scoringResult = await this.applicantResultsService.runScoring(
        applicationId,
        cvFile.filePath,
        cvFile.mimeType ?? "application/pdf"
      );
    } catch (err) {
      scoringError = err instanceof Error ? err.message : "CV analysis failed";
      this.logger.error(
        `Scoring failed for applicationId=${applicationId}: ${scoringError}`
      );
      // lanjut dengan transaksi, simpan error message nanti
    }

    // 4. scoring berhasil → baru jalankan transaksi db
    const result = await this.dataSource.transaction(async (manager) => {
      const applicant = await manager.findOne(Applicant, {
        where: { id: applicantId }
      });
      if (!applicant) throw new NotFoundException("Applicant not found");

      Object.assign(applicant, {
        fullName: applyDto.fullName,
        phone: applyDto.phone,
        alternativePhone: applyDto.alternativePhone,
        gender: applyDto.gender,
        maritalStatus: applyDto.maritalStatus,
        placeOfBirth: applyDto.placeOfBirth,
        dateOfBirth: new Date(applyDto.dateOfBirth),
        linkedinUrl: applyDto.linkedinUrl,
        socialMediaUrl: applyDto.socialMediaUrl,
        availability: applyDto.availability,
        availabilityAt: applyDto.availabilityAt
          ? new Date(applyDto.availabilityAt)
          : null
      });

      const updatedApplicant = await manager.save(Applicant, applicant);

      await manager.softDelete(ApplicantAddress, { applicantId });
      await manager.save(
        ApplicantAddress,
        applyDto.addresses.map((a) =>
          manager.create(ApplicantAddress, { ...a, applicantId })
        )
      );

      await manager.softDelete(ApplicantIdentity, { applicantId });
      await manager.save(
        ApplicantIdentity,
        applyDto.identities.map((i) =>
          manager.create(ApplicantIdentity, { ...i, applicantId })
        )
      );

      application.status = ApplicantStatus.APPLIED;
      application.appliedAt = new Date();
      const updatedApplication = await manager.save(Application, application);

      const firstStage = await manager.findOne(PipelineStage, {
        where: { pipelineId: application.pipelineId },
        order: { stageOrder: "ASC" }
      });
      if (!firstStage) throw new NotFoundException("First stage not found");

      await manager.save(
        StageActivity,
        manager.create(StageActivity, {
          applicationId: application.id,
          stageId: firstStage.id,
          createdAt: new Date(),
          status: StageActivityStatus.IN_PROGRESS
        })
      );

      application.currentStageId = firstStage.id;
      application.lastActivityAt = new Date();
      await manager.save(Application, application);

      await manager.save(
        File,
        manager.create(File, {
          fileName: cvFile.fileName,
          originalName: cvFile.originalName,
          filePath: cvFile.filePath,
          fileSize: cvFile.fileSize,
          mimeType: cvFile.mimeType,
          bucket: cvFile.bucket,
          fileType: FileType.CV,
          relatedEntity: "application",
          relatedEntityId: application.id,
          uploadedById: applicantId,
          description: `CV snapshot - ${application.applicationNumber}`
        })
      );

      return { applicant: updatedApplicant, application: updatedApplication };
    });

    // 5. simpan hasil scoring ke db atau error message
    if (scoringError) {
      // scoring gagal, simpan error message
      await this.applicantResultsService.saveEvaluationError(
        applicationId,
        scoringError
      );
    } else if (scoringResult) {
      // scoring berhasil, simpan hasil
      try {
        await this.applicantResultsService.saveResults(
          scoringResult,
          applicantId
        );
      } catch (err) {
        this.logger.error("Failed to persist scoring results", err);
      }
    }

    const maxScore = scoringResult.experience?.length
      ? Math.max(...scoringResult.experience.map((e) => e.similarity ?? 0))
      : 0;

    const evaluationResult: EvaluationResultResponseDto = {
      maxExperienceScore: maxScore,
      evaluatedAt: new Date(),
      scoringBreakdown: {
        experiences: (scoringResult.experience ?? []).map((e) => ({
          role: e.role ?? null,
          description: e.description ?? null,
          start: e.start ?? null,
          end: e.end ?? null,
          durationYears: e.duration_years ?? null,
          similarity: e.similarity ?? null,
          isTopMatch: Math.abs((e.similarity ?? 0) - maxScore) < 0.0001
        })),
        educations: (scoringResult.educations ?? []).map((e) => ({
          level: e.level ?? null,
          major: e.major ?? null,
          institution: e.institution ?? null
        }))
      }
    };

    return {
      applicant: result.applicant,
      application: result.application,
      evaluationResult
    };
  }

  // quick apply — satu endpoint atomik, gabungkan register + upload cv + apply. tidak butuh auth (@Public di controller).
  async quickApply(
    dto: QuickApplyDto,
    cvFile: Express.Multer.File,
    photoFile?: Express.Multer.File
  ): Promise<QuickApplyResponseDto> {
    // ── 1. validasi vacancy (read-only, sebelum ada side effect) ───────────
    const vacancy = await this.vacancyRepository.findOne({
      where: { id: dto.vacancyId },
      relations: ["pipeline"]
    });
    if (!vacancy) throw new NotFoundException("Vacancy not found");
    if (vacancy.status !== JobStatus.PUBLISHED) {
      throw new BadRequestException(
        "Vacancy is not currently accepting applications"
      );
    }
    if (vacancy.endDate && new Date(vacancy.endDate) < new Date()) {
      throw new BadRequestException("Application deadline has passed");
    }

    // ── 2. guard duplikat awal berdasarkan email (read-only, sebelum upload file) ──
    // kalau email sudah punya application untuk vacancy ini, tolak lebih awal
    // supaya tidak buang waktu upload file yang tidak akan terpakai.
    const existingApplicantByEmail = await this.applicantRepository.findOne({
      where: { email: dto.email }
    });
    if (existingApplicantByEmail) {
      const existingApplication = await this.applicationRepository.findOne({
        where: {
          applicantId: existingApplicantByEmail.id,
          vacancyId: dto.vacancyId
        }
      });
      if (existingApplication) {
        throw new BadRequestException(
          "You have already applied to this vacancy"
        );
      }
    }

    // ── 3. generate registration code (dengan retry kalau collision) ───────
    let registrationCode = this.generateRegistrationCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const collision = await this.applicationRepository.findOne({
        where: { registrationCode }
      });
      if (!collision) break;
      if (attempt === 2)
        throw new Error(
          "Failed to generate unique registration code after 3 attempts"
        );
      registrationCode = this.generateRegistrationCode();
    }

    // ── 4. upload file ke minio (harus di luar transaksi) ──────────────────
    // minio tidak transactional. file diupload duluan supaya path-nya
    // tersedia di dalam transaksi db. kalau ada kegagalan setelahnya, cleanup
    // dilakukan di blok catch di bawah.
    // relatedEntityId sengaja dikosongkan untuk applicant baru (belum tersimpan).
    // relatedEntityId record File akan tetap NULL sampai applicant dibuat
    // di dalam transaksi di bawah. ini aman — cv snapshot yang dibuat di dalam
    // transaksi (step 4h) sudah punya relatedEntityId='application' yang benar.
    const cvUploadDto: FileUploadDto = {
      fileType: FileType.CV,
      folder: "applicants/cv",
      relatedEntity: "applicant",
      relatedEntityId: existingApplicantByEmail?.id
    };
    const uploadedFile = await this.fileUploadService.uploadFile(
      cvFile,
      cvUploadDto,
      existingApplicantByEmail?.id
    );

    let photoUrl: string | null = null;
    if (photoFile) {
      const photoUploadDto: FileUploadDto = {
        fileType: FileType.PHOTO,
        folder: "applicants/photos",
        relatedEntity: "applicant",
        relatedEntityId: existingApplicantByEmail?.id
      };
      const uploadedPhoto = await this.fileUploadService.uploadFile(
        photoFile,
        photoUploadDto,
        existingApplicantByEmail?.id
      );
      photoUrl = uploadedPhoto.filePath ?? null;
    }

    // ── 5. transaksi atomik tunggal ─────────────────────────────────────────
    // semua db write terjadi di sini. kalau ada yang gagal, seluruh transaksi
    // di-rollback dan file minio yang sudah terupload dibersihkan di blok catch.
    let txResult!: { applicant: Applicant; application: Application };
    try {
      txResult = await this.dataSource.transaction(async (manager) => {
        // 4a. cari atau buat applicant di dalam transaksi
        let applicant = await manager.findOne(Applicant, {
          where: { email: dto.email }
        });
        if (!applicant) {
          applicant = manager.create(Applicant, {
            email: dto.email,
            fullName: dto.fullName,
            phone: dto.phone
          });
          applicant = await manager.save(Applicant, applicant);
        }

        // 4b. guard duplikat kedua di dalam transaksi (mencegah race condition)
        const duplicate = await manager.findOne(Application, {
          where: { applicantId: applicant.id, vacancyId: dto.vacancyId }
        });
        if (duplicate) {
          throw new BadRequestException(
            "You have already applied to this vacancy"
          );
        }

        // 4c. update profil applicant dengan data yang disubmit
        Object.assign(applicant, {
          fullName: dto.fullName,
          phone: dto.phone,
          gender: dto.gender,
          maritalStatus: dto.maritalStatus,
          placeOfBirth: dto.placeOfBirth,
          dateOfBirth: new Date(dto.dateOfBirth),
          cvUrl: uploadedFile.filePath,
          ...(photoUrl ? { photoUrl } : {})
        });
        const savedApplicant = await manager.save(Applicant, applicant);

        // 4d. simpan address kalau disediakan
        if (dto.address) {
          await manager.save(
            ApplicantAddress,
            manager.create(ApplicantAddress, {
              fullAddress: dto.address,
              applicantId: savedApplicant.id
            })
          );
        }

        // 4e. generate application number (di dalam tx — pakai manager untuk baca data yang sudah commit)
        const applicationNumber =
          await this.generateApplicationNumberWithManager(
            manager,
            vacancy.jobCode
          );

        // 4f. buat application
        const now = new Date();
        let application = manager.create(Application, {
          applicationNumber,
          registrationCode,
          applicantId: savedApplicant.id,
          vacancyId: vacancy.id,
          pipelineId: vacancy.pipelineId,
          status: ApplicantStatus.APPLIED,
          appliedAt: now,
          lastActivityAt: now
        });
        application = await manager.save(Application, application);

        // 4g. cari stage pipeline pertama dan buat StageActivity
        const firstStage = await manager.findOne(PipelineStage, {
          where: { pipelineId: vacancy.pipelineId },
          order: { stageOrder: "ASC" }
        });
        if (!firstStage)
          throw new BadRequestException(
            "This vacancy has no pipeline stages configured"
          );

        await manager.save(
          StageActivity,
          manager.create(StageActivity, {
            applicationId: application.id,
            stageId: firstStage.id,
            createdAt: now,
            status: StageActivityStatus.IN_PROGRESS
          })
        );

        application.currentStageId = firstStage.id;
        application.lastActivityAt = now;
        const finalApplication = await manager.save(Application, application);

        // 4h. cv snapshot untuk audit trail permanen
        await manager.save(
          File,
          manager.create(File, {
            fileName: uploadedFile.fileName,
            originalName: uploadedFile.originalName ?? uploadedFile.fileName,
            filePath: uploadedFile.filePath,
            fileSize: uploadedFile.fileSize,
            mimeType: uploadedFile.mimeType,
            bucket: "recruitment-files",
            fileType: FileType.CV,
            relatedEntity: "application",
            relatedEntityId: finalApplication.id,
            uploadedById: savedApplicant.id,
            description: `CV snapshot - ${finalApplication.applicationNumber}`
          })
        );

        // 4i. buat placeholder EvaluationResult untuk menjamin konsistensi struktur data.
        // ini memastikan evaluationResult SELALU ada untuk frontend, bahkan
        // sebelum scoring async selesai. scoring akan update record ini dengan data asli.
        // penting untuk data binding frontend yang robust.
        const placeholder = manager.create(EvaluationResult);
        placeholder.applicationId = finalApplication.id;
        placeholder.evaluateDetail = { experiences: [], educations: [] };
        await manager.save(EvaluationResult, placeholder);

        return { applicant: savedApplicant, application: finalApplication };
      });
    } catch (txError) {
      // transaksi di-rollback — bersihkan file minio supaya tidak jadi orphan
      await this.fileUploadService
        .deleteFileByPath(uploadedFile.filePath)
        .catch((e) =>
          this.logger.error("Failed to delete orphaned CV after tx failure", e)
        );
      if (photoUrl) {
        await this.fileUploadService
          .deleteFileByPath(photoUrl)
          .catch((e) =>
            this.logger.error(
              "Failed to delete orphaned photo after tx failure",
              e
            )
          );
      }
      throw txError;
    }

    // ── 6. fire-and-forget: cv scoring (non-blocking) ──────────────────────
    // scoring jalan setelah application fully committed. kalau gagal di sini
    // TIDAK mempengaruhi application — kandidat sudah teregistrasi.
    // EvaluationResult akan tetap absen sampai scoring berhasil (atau di-retry).
    void this.runScoringAsync(
      txResult.application.id,
      uploadedFile.filePath,
      cvFile.mimetype,
      txResult.applicant.id
    );

    // ── 7. fire-and-forget: email konfirmasi (non-blocking) ────────────────
    // kegagalan email TIDAK BOLEH menggagalkan response quick apply. kandidat
    // sudah punya registrationCode di halaman submitted sebelum emailnya sampai.
    const trackingLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/tracking-application?email=${encodeURIComponent(txResult.applicant.email)}&code=${txResult.application.registrationCode}`;
    void this.systemConfigEmailService
      .sendEmailFromConfig(
        "notification_applicant_apply",
        { email: txResult.applicant.email, name: txResult.applicant.fullName },
        {
          applicant_name: txResult.applicant.fullName,
          vacancy_name: vacancy.title,
          registration_code: txResult.application.registrationCode,
          tracking_link: trackingLink,
          application_link: trackingLink
        }
      )
      .catch((err) =>
        this.logger.error("Failed to send quick apply confirmation email", err)
      );

    return {
      applicant: {
        id: txResult.applicant.id,
        fullName: txResult.applicant.fullName,
        email: txResult.applicant.email
      },
      application: {
        id: txResult.application.id,
        applicationNumber: txResult.application.applicationNumber,
        registrationCode: txResult.application.registrationCode,
        status: txResult.application.status,
        appliedAt: txResult.application.appliedAt
      }
    };
  }

  async applyFormBased(
    dto: ApplyFormBasedDto
  ): Promise<ApplyFormBasedResponseDto> {
    // ── 1. validasi vacancy ─────────────────────────────────────────────────
    const vacancy = await this.vacancyRepository.findOne({
      where: { id: dto.vacancyId },
      relations: ["pipeline"]
    });
    if (!vacancy) throw new NotFoundException("Vacancy not found");
    if (vacancy.status !== JobStatus.PUBLISHED) {
      throw new BadRequestException(
        "Vacancy is not currently accepting applications"
      );
    }
    if (vacancy.endDate && new Date(vacancy.endDate) < new Date()) {
      throw new BadRequestException("Application deadline has passed");
    }

    // ── 2. guard duplikat awal ──────────────────────────────────────────────
    const existingApplicant = await this.applicantRepository.findOne({
      where: { email: dto.email }
    });
    if (existingApplicant) {
      const existingApplication = await this.applicationRepository.findOne({
        where: { applicantId: existingApplicant.id, vacancyId: dto.vacancyId }
      });
      if (existingApplication) {
        throw new BadRequestException(
          "You have already applied to this vacancy"
        );
      }
    }

    // ── 3. generate registration code ───────────────────────────────────────
    let registrationCode = this.generateRegistrationCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const collision = await this.applicationRepository.findOne({
        where: { registrationCode }
      });
      if (!collision) break;
      if (attempt === 2)
        throw new Error(
          "Failed to generate unique registration code after 3 attempts"
        );
      registrationCode = this.generateRegistrationCode();
    }

    // ── 4. transaksi db atomik ──────────────────────────────────────────────
    const txResult = await this.dataSource.transaction(async (manager) => {
      // 4a. cari atau buat applicant
      let applicant = await manager.findOne(Applicant, {
        where: { email: dto.email }
      });
      if (!applicant) {
        applicant = manager.create(Applicant, {
          email: dto.email,
          fullName: dto.fullName,
          phone: dto.phone
        });
        applicant = await manager.save(Applicant, applicant);
      }

      // 4b. guard duplikat kedua (proteksi race condition)
      const duplicate = await manager.findOne(Application, {
        where: { applicantId: applicant.id, vacancyId: dto.vacancyId }
      });
      if (duplicate)
        throw new BadRequestException(
          "You have already applied to this vacancy"
        );

      // 4c. update profil applicant
      Object.assign(applicant, {
        fullName: dto.fullName,
        phone: dto.phone,
        gender: dto.gender,
        maritalStatus: dto.maritalStatus,
        placeOfBirth: dto.placeOfBirth,
        dateOfBirth: new Date(dto.dateOfBirth),
        availability: dto.availability,
        ...(dto.availabilityAt
          ? { availabilityAt: new Date(dto.availabilityAt) }
          : {}),
        ...(dto.photoUrl ? { photoUrl: dto.photoUrl } : {}),
        ...(dto.cvUrl ? { cvUrl: dto.cvUrl } : {}),
        ...(dto.socialMediaUrl ? { socialMediaUrl: dto.socialMediaUrl } : {}),
        ...(dto.linkedinUrl ? { linkedinUrl: dto.linkedinUrl } : {})
      });
      const savedApplicant = await manager.save(Applicant, applicant);

      // 4d. simpan address
      await manager.save(
        ApplicantAddress,
        manager.create(ApplicantAddress, {
          applicantId: savedApplicant.id,
          province: dto.address.province,
          regency: dto.address.regency,
          district: dto.address.district,
          village: dto.address.village,
          fullAddress: dto.address.fullAddress
        })
      );

      // 4e. simpan education
      await manager.save(
        ApplicantEducation,
        manager.create(ApplicantEducation, {
          applicantId: savedApplicant.id,
          schoolName: dto.education.institutionName,
          degree: dto.education.degree,
          major: dto.education.major ?? null,
          startMonth: dto.education.monthStart,
          endMonth: dto.education.monthEnd
        })
      );

      // 4f. simpan experiences sebagai job history
      for (let i = 0; i < dto.experiences.length; i++) {
        const exp = dto.experiences[i];
        await manager.save(
          ApplicantJobHistory,
          manager.create(ApplicantJobHistory, {
            applicantId: savedApplicant.id,
            position: exp.position,
            company: exp.company || null,
            employeeStatus: exp.employeeStatus,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            description: exp.description,
            order: i + 1
          })
        );
      }

      // 4g. generate application number dan buat application
      const applicationNumber = await this.generateApplicationNumberWithManager(
        manager,
        vacancy.jobCode
      );
      const now = new Date();
      let application = manager.create(Application, {
        applicationNumber,
        registrationCode,
        applicantId: savedApplicant.id,
        vacancyId: vacancy.id,
        pipelineId: vacancy.pipelineId,
        status: ApplicantStatus.APPLIED,
        appliedAt: now,
        lastActivityAt: now
      });
      application = await manager.save(Application, application);

      // 4h. inisialisasi stage pipeline pertama
      const firstStage = await manager.findOne(PipelineStage, {
        where: { pipelineId: vacancy.pipelineId },
        order: { stageOrder: "ASC" }
      });
      if (!firstStage)
        throw new BadRequestException(
          "This vacancy has no pipeline stages configured"
        );

      await manager.save(
        StageActivity,
        manager.create(StageActivity, {
          applicationId: application.id,
          stageId: firstStage.id,
          createdAt: now,
          status: StageActivityStatus.IN_PROGRESS
        })
      );

      application.currentStageId = firstStage.id;
      application.lastActivityAt = now;
      const finalApplication = await manager.save(Application, application);

      // 4i. buat placeholder EvaluationResult — jaminan yang sama seperti quickApply (step 4i).
      // frontend deteksi evaluatedAt === null untuk tampilkan "Processing..." selama scoring jalan.
      const placeholder = manager.create(EvaluationResult);
      placeholder.applicationId = finalApplication.id;
      placeholder.evaluateDetail = { experiences: [], educations: [] };
      await manager.save(EvaluationResult, placeholder);

      return { applicant: savedApplicant, application: finalApplication };
    });

    // ── 5. fire-and-forget: sbert scoring ───────────────────────────────────
    const experiencesWithCompany = dto.experiences.filter((e) => e.company);
    if (experiencesWithCompany.length > 0) {
      void this.runFormBasedScoringAsync(
        txResult.application.id,
        vacancy.responsibilities ?? "",
        experiencesWithCompany.map((e) => ({
          position: e.position,
          company: e.company!,
          description: e.description,
          startDate: e.startDate,
          endDate: e.endDate
        }))
      );
    }

    // ── 6. fire-and-forget: email konfirmasi ────────────────────────────────
    const trackingLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/tracking-application?email=${encodeURIComponent(txResult.applicant.email)}&code=${txResult.application.registrationCode}`;
    void this.systemConfigEmailService
      .sendEmailFromConfig(
        "notification_applicant_apply",
        { email: txResult.applicant.email, name: txResult.applicant.fullName },
        {
          applicant_name: txResult.applicant.fullName,
          vacancy_name: vacancy.title,
          registration_code: txResult.application.registrationCode,
          tracking_link: trackingLink,
          application_link: trackingLink
        }
      )
      .catch((err) =>
        this.logger.error(
          "Failed to send form-based apply confirmation email",
          err
        )
      );

    return {
      applicant: {
        id: txResult.applicant.id,
        fullName: txResult.applicant.fullName,
        email: txResult.applicant.email
      },
      application: {
        id: txResult.application.id,
        applicationNumber: txResult.application.applicationNumber,
        registrationCode: txResult.application.registrationCode,
        status: txResult.application.status,
        appliedAt: txResult.application.appliedAt
      }
    };
  }

  async getApplicationTrackingByCode(
    query: ApplicationTrackingQueryDto
  ): Promise<ApplicationTrackingPublicDto> {
    const { email, registrationCode } = query;

    const application = await this.applicationRepository
      .createQueryBuilder("app")
      .leftJoinAndSelect("app.applicant", "applicant")
      .leftJoinAndSelect("app.vacancy", "vacancy")
      .leftJoinAndSelect("app.currentStage", "currentStage")
      .leftJoinAndSelect("currentStage.stageTemplate", "currentStageTemplate")
      .where("applicant.email = :email", { email })
      .andWhere("app.registrationCode = :registrationCode", {
        registrationCode
      })
      .getOne();

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const stageActivities = await this.stageActivityRepository
      .createQueryBuilder("sa")
      .leftJoinAndSelect("sa.stage", "stage")
      .leftJoinAndSelect("stage.stageTemplate", "stageTemplate")
      .where("sa.applicationId = :applicationId", {
        applicationId: application.id
      })
      .orderBy("stage.stageOrder", "ASC")
      .getMany();

    const stageStatusMap: Record<string, string> = {
      pending: "Pending",
      in_progress: "In Progress",
      done: "Completed",
      failed: "Failed"
    };

    const currentStageActivity = stageActivities.find(
      (sa) => sa.stageId === application.currentStageId
    );

    return {
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        registrationCode: application.registrationCode,
        vacancyTitle: application.vacancy?.title ?? "",
        status: application.status,
        appliedAt: application.appliedAt,
        lastActivityAt: application.lastActivityAt ?? null,
        applicantName: application.applicant?.fullName ?? ""
      },
      currentStage: application.currentStage
        ? {
            name: application.currentStage.stageTemplate?.name ?? "",
            status:
              stageStatusMap[currentStageActivity?.status ?? ""] ??
              "In Progress"
          }
        : null,
      stages: stageActivities.map((sa) => ({
        name: sa.stage?.stageTemplate?.name ?? "",
        status: stageStatusMap[sa.status] ?? sa.status,
        notes: sa.notes ?? null,
        completedAt:
          sa.status === "done" || sa.status === "failed" ? sa.createdAt : null
      }))
    };
  }

  private generateRegistrationCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from(
      { length: 8 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    return `REG-${code}`;
  }

  private async runFormBasedScoringAsync(
    applicationId: string,
    jobResponsibilities: string,
    experiences: {
      position: string;
      company: string;
      description: string;
      startDate?: string;
      endDate?: string;
    }[]
  ): Promise<void> {
    try {
      await this.applicantResultsService.runFormBasedScoring(
        applicationId,
        jobResponsibilities,
        experiences
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "CV analysis failed";
      this.logger.error(
        `Form-based scoring failed for applicationId=${applicationId}: ${message}`
      );
      await this.applicantResultsService
        .saveEvaluationError(applicationId, message)
        .catch((saveErr) =>
          this.logger.error(
            `Failed to persist evaluation error for applicationId=${applicationId}`,
            saveErr
          )
        );
    }
  }

  private async runScoringAsync(
    applicationId: string,
    cvFilePath: string,
    cvMimeType: string,
    applicantId: string
  ): Promise<void> {
    try {
      const scoringResult = await this.applicantResultsService.runScoring(
        applicationId,
        cvFilePath,
        cvMimeType
      );
      await this.applicantResultsService.saveResults(
        scoringResult,
        applicantId
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "CV analysis failed";
      this.logger.error(
        `Background scoring failed for applicationId=${applicationId}: ${message}`
      );
      await this.applicantResultsService
        .saveEvaluationError(applicationId, message)
        .catch((saveErr) =>
          this.logger.error(
            `Failed to persist evaluation error for applicationId=${applicationId}`,
            saveErr
          )
        );
    }
  }

  private async generateApplicationNumberWithManager(
    manager: import("typeorm").EntityManager,
    jobCode: string
  ): Promise<string> {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const prefix = `${jobCode}${year}${month}`;

    const lastApplication = await manager
      .createQueryBuilder(Application, "application")
      .where("application.applicationNumber LIKE :prefix", {
        prefix: `${prefix}-%`
      })
      .orderBy("application.applicationNumber", "DESC")
      .getOne();

    let sequence = 1;
    if (lastApplication) {
      const parts = lastApplication.applicationNumber.split("-");
      const last = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(last)) sequence = last + 1;
    }

    return `${prefix}-${sequence.toString().padStart(3, "0")}`;
  }

  /**
   * Memeriksa apakah suatu path file CV masih direferensikan oleh
   * application-level snapshot (relatedEntity = 'application').
   *
   * Dipanggil dari controller saat pelamar mengupload CV baru, sebelum
   * file lama dihapus dari MinIO, untuk mencegah penghapusan file yang
   * masih dipakai oleh lamaran sebelumnya.
   *
   * @returns true jika masih ada snapshot aktif yang mereferensikan path ini
   */
  async isReferencedByApplication(filePath: string): Promise<boolean> {
    const snapshot = await this.fileRepository.findOne({
      where: {
        filePath: filePath,
        relatedEntity: "application",
        isActive: true
      }
    });
    return snapshot !== null;
  }

  // parse tanggal dari format dd-mm-yy ke objek date
  private parseDate(dateString: string): Date | undefined {
    if (!dateString) return undefined;

    const [day, month, year] = dateString.split("-");
    // konversi tahun 2 digit ke 4 digit (asumsi 20xx)
    const fullYear =
      parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
    return new Date(fullYear, parseInt(month) - 1, parseInt(day));
  }

  async getApplicationTracking(
    applicantId: string
  ): Promise<ApplicationTrackingResponseDto> {
    // 1. ambil application terbaru milik applicant ini
    const latestApplication = await this.applicationRepository.findOne({
      where: { applicantId },
      order: { createdAt: "DESC" },
      relations: ["vacancy", "pipeline", "currentStage", "activities"]
    });

    if (!latestApplication) {
      throw new NotFoundException("No application found for this applicant");
    }

    // 2. ambil semua stage dari pipeline
    const pipelineStages = await this.pipelineStageRepository.find({
      where: { pipelineId: latestApplication.pipelineId },
      order: { stageOrder: "ASC" },
      relations: ["stageTemplate"]
    });

    // 3. ambil activities untuk application ini
    const activities = await this.stageActivityRepository.find({
      where: { applicationId: latestApplication.id },
      order: { createdAt: "ASC" }
    });

    // 4. petakan stage dengan status berdasarkan current stage dan activities
    const stagesWithStatus = pipelineStages.map((stage) => {
      const stageActivities = activities.filter(
        (activity) => activity.stageId === stage.id
      );
      const status =
        stageActivities.length > 0
          ? stageActivities[stageActivities.length - 1].status
          : "pending";

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

    // 5. ambil info current stage
    const currentStage = this.getCurrentStageInfo(
      latestApplication,
      stagesWithStatus
    );

    // 6. hitung progress
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

    // estimasi tanggal selesai (perhitungan kasar)
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

  async findById(id: string): Promise<Applicant> {
    const applicant = await this.applicantRepository.findOne({
      where: { id }
    });

    if (!applicant) {
      throw new NotFoundException("Applicant not found");
    }

    return applicant;
  }

  async applyForVacancy(
    applicantId: string,
    vacancyId: string
  ): Promise<Application> {
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        applicantId,
        vacancyId
      }
    });

    if (existingApplication) {
      throw new ConflictException("Already applied for this vacancy");
    }

    const application = this.applicationRepository.create({
      applicantId,
      vacancyId,
      appliedAt: new Date()
    });

    return await this.applicationRepository.save(application);
  }

  async getApplicantApplications(applicantId: string): Promise<Application[]> {
    return await this.applicationRepository.find({
      where: { applicantId },
      relations: ["vacancy", "currentStage"]
    });
  }
}
