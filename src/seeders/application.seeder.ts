import { BaseSeeder } from "./base.seeder";
import { Application } from "../modules/applicants/entities/application.entity";
import { Applicant } from "../modules/applicants/entities/applicant.entity";
import { Vacancy } from "../modules/vacancies/entities/vacancy.entity";
import { PipelineStage } from "../modules/vacancies/entities/pipeline-stage.entity";
import { StageActivity } from "../modules/vacancies/entities/stage-activity.entity";
import { RecruitmentPipeline } from "../modules/vacancies/entities/recruitment-pipeline.entity";
import { ApplicantStatus } from "../shared/enums/applicant.enum";
import { StageActivityStatus } from "../shared/enums/pipeline.enum";

export class ApplicationSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log("🌱 Seeding applications...");

    const applicantRepository = await this.getRepository(Applicant);
    const applicants = await applicantRepository.find();

    if (applicants.length === 0) {
      console.log("⚠️  No applicants found. Please run applicant seeder first.");
      return;
    }

    // Use the HCM Neuron pipeline (default) exclusively
    const pipelineRepository = await this.getRepository(RecruitmentPipeline);
    const hcmPipeline = await pipelineRepository.findOne({
      where: { name: "HCM Neuron" }
    });

    if (!hcmPipeline) {
      console.log("⚠️  HCM Neuron pipeline not found. Please run recruitment pipeline seeder first.");
      return;
    }

    // Get vacancies that use the HCM Neuron pipeline
    const vacancyRepository = await this.getRepository(Vacancy);
    const vacancies = await vacancyRepository.find({
      where: { pipelineId: hcmPipeline.id }
    });

    if (vacancies.length === 0) {
      console.log("⚠️  No vacancies found for HCM Neuron pipeline. Please run vacancy seeder first.");
      return;
    }

    // Get pipeline stages ordered by stageOrder
    const stageRepository = await this.getRepository(PipelineStage);
    const stages = await stageRepository.find({
      where: { pipelineId: hcmPipeline.id },
      order: { stageOrder: "ASC" }
    });

    if (stages.length === 0) {
      console.log("⚠️  No pipeline stages found. Please run pipeline seeder first.");
      return;
    }

    const firstStage = stages[0];

    // Clear existing data
    await this.clearTable(Application);

    const applicationData: any[] = [];
    const activityData: any[] = [];

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    for (let i = 0; i < 50; i++) {
      const applicant = applicants[i % applicants.length];
      const vacancy = vacancies[i % vacancies.length];

      // Assign a stage index: most in early stages, some further along
      const stageIndex = i < 30 ? 0 : i < 40 ? 1 : i < 47 ? 2 : 3;
      const currentStage = stages[Math.min(stageIndex, stages.length - 1)];

      const isLate = stageIndex >= stages.length - 1;
      const status = isLate
        ? (i % 3 === 0 ? ApplicantStatus.HIRED : i % 3 === 1 ? ApplicantStatus.REJECTED : ApplicantStatus.APPLIED)
        : ApplicantStatus.APPLIED;

      const applicationId = this.generateId();
      const applicationNumber = `HCM${year}${month}-${String(i + 1).padStart(4, '0')}`;

      applicationData.push({
        id: applicationId,
        applicationNumber,
        applicantId: applicant.id,
        vacancyId: vacancy.id,
        pipelineId: hcmPipeline.id,
        currentStageId: currentStage.id,
        status,
        coverLetter: `Dengan hormat, saya mengajukan lamaran untuk posisi ${vacancy.title}. Saya yakin kualifikasi dan pengalaman saya sesuai dengan kebutuhan perusahaan.`,
        source: ['linkedin', 'jobstreet', 'website', 'referral', 'indeed'][i % 5],
        appliedAt: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000),
        completedAt: status === ApplicantStatus.HIRED ? new Date() : null,
        currentScore: stageIndex > 0 ? 60 + (i % 35) : null,
        currentNotes: status === ApplicantStatus.HIRED
          ? 'Kandidat kuat, lolos semua tahap seleksi'
          : status === ApplicantStatus.REJECTED
          ? 'Tidak memenuhi kualifikasi minimum'
          : 'Sedang dalam proses seleksi',
        lastActivityAt: new Date(Date.now() - (7 - (i % 7)) * 24 * 60 * 60 * 1000),
        isTalentPool: status === ApplicantStatus.HIRED && i % 3 === 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create completed StageActivity records for each passed stage
      for (let s = 0; s < stageIndex; s++) {
        activityData.push({
          id: this.generateId(),
          applicationId,
          stageId: stages[s].id,
          status: StageActivityStatus.DONE,
          score: 65 + (i % 30),
          notes: 'Lolos seleksi tahap ini',
          createdAt: new Date(Date.now() - (stageIndex - s + 1) * 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        });
      }

      // Create IN_PROGRESS StageActivity for the current stage
      activityData.push({
        id: this.generateId(),
        applicationId,
        stageId: currentStage.id,
        status: status === ApplicantStatus.REJECTED
          ? StageActivityStatus.FAILED
          : status === ApplicantStatus.HIRED
          ? StageActivityStatus.DONE
          : StageActivityStatus.IN_PROGRESS,
        score: stageIndex > 0 ? 60 + (i % 35) : null,
        notes: status === ApplicantStatus.HIRED
          ? 'Lolos semua tahap seleksi'
          : status === ApplicantStatus.REJECTED
          ? 'Tidak memenuhi kualifikasi'
          : null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });
    }

    await this.saveEntities(Application, applicationData);
    await this.saveEntities(StageActivity, activityData);

    console.log(`✅ ${applicationData.length} applications and ${activityData.length} stage activities seeded successfully`);
  }
}
