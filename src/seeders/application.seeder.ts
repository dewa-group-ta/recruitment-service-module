import { BaseSeeder } from "./base.seeder";
import { Application } from "../modules/applicants/entities/application.entity";
import { Applicant } from "../modules/applicants/entities/applicant.entity";
import { Vacancy } from "../modules/vacancies/entities/vacancy.entity";
import { PipelineStage } from "../modules/vacancies/entities/pipeline-stage.entity";
import { ApplicantStatus } from "../shared/enums/applicant.enum";

export class ApplicationSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log("🌱 Seeding applications...");

    // Get available applicants
    const applicantRepository = await this.getRepository(Applicant);
    const applicants = await applicantRepository.find();

    if (applicants.length === 0) {
      console.log("⚠️  No applicants found. Please run applicant seeder first.");
      return;
    }

    // Get available vacancies
    const vacancyRepository = await this.getRepository(Vacancy);
    const vacancies = await vacancyRepository.find();

    if (vacancies.length === 0) {
      console.log("⚠️  No vacancies found. Please run vacancy seeder first.");
      return;
    }

    // Get available pipeline stages
    const stageRepository = await this.getRepository(PipelineStage);
    const stages = await stageRepository.find();

    if (stages.length === 0) {
      console.log("⚠️  No pipeline stages found. Please run pipeline seeder first.");
      return;
    }

    // Clear existing data
    await this.clearTable(Application);

    // Create sample applications
    const applications = await this.createApplications(applicants, vacancies, stages);

    console.log(`✅ ${applications.length} applications seeded successfully`);
  }

  private async createApplications(applicants: any[], vacancies: any[], stages: any[]) {
    const applicationData: any[] = [];

    // Sample names for applicants
    const sampleNames = [
      'John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Wilson', 'David Brown',
      'Emily Davis', 'Robert Garcia', 'Lisa Rodriguez', 'William Anderson', 'Maria Lopez',
      'James Taylor', 'Jennifer Martinez', 'Christopher Lee', 'Amanda White', 'Daniel Harris',
      'Ashley Clark', 'Matthew Lewis', 'Jessica Walker', 'Andrew Hall', 'Stephanie Young',
      'Joshua Allen', 'Nicole King', 'Ryan Wright', 'Samantha Scott', 'Kevin Green',
      'Rachel Adams', 'Brandon Baker', 'Lauren Nelson', 'Justin Carter', 'Megan Mitchell'
    ];

    // Create applicants if they don't exist
    const applicantRepository = await this.getRepository(Applicant);
    const existingApplicants = await applicantRepository.find();
    
    if (existingApplicants.length < 30) {
      const newApplicants: any[] = [];
      for (let i = existingApplicants.length; i < 30; i++) {
        const applicant = {
          id: this.generateId(),
          fullName: sampleNames[i],
          email: `${sampleNames[i].toLowerCase().replace(' ', '.')}@example.com`,
          phone: `+6281${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          photoUrl: `https://i.pravatar.cc/150?u=${i + 1}`,
          dateOfBirth: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: Math.random() > 0.5 ? 'male' : 'female',
          address: `Jl. Example Street No. ${i + 1}, Jakarta`,
          city: 'Jakarta',
          province: 'DKI Jakarta',
          postalCode: `10${String(Math.floor(Math.random() * 900) + 100)}`,
          country: 'Indonesia',
          nationality: 'Indonesian',
          maritalStatus: Math.random() > 0.7 ? 'married' : 'single',
          religion: ['Islam', 'Christian', 'Catholic', 'Hindu', 'Buddhist'][Math.floor(Math.random() * 5)],
          emergencyContactName: `Emergency Contact ${i + 1}`,
          emergencyContactPhone: `+6281${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          emergencyContactRelationship: ['Parent', 'Spouse', 'Sibling', 'Friend'][Math.floor(Math.random() * 4)],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        newApplicants.push(applicant);
      }
      await applicantRepository.save(newApplicants);
    }

    // Get all applicants (including newly created ones)
    const allApplicants = await applicantRepository.find();

    // Create applications for different vacancies
    for (let i = 0; i < 50; i++) {
      const applicant = allApplicants[Math.floor(Math.random() * allApplicants.length)];
      const vacancy = vacancies[Math.floor(Math.random() * vacancies.length)];
      
      // Get stages for this vacancy's pipeline
      const vacancyStages = stages.filter(stage => stage.pipelineId === vacancy.pipelineId);
      const currentStage = vacancyStages[Math.floor(Math.random() * vacancyStages.length)];

      // Random status based on stage
      let status: ApplicantStatus;
      const stageName = currentStage?.stageTemplate?.name?.toLowerCase() || 'applied';
      
      if (stageName.includes('applied') || stageName.includes('screening')) {
        status = ApplicantStatus.APPLIED;
      } else if (stageName.includes('interview') || stageName.includes('assessment')) {
        status = Math.random() > 0.3 ? ApplicantStatus.APPLIED : ApplicantStatus.HIRED;
      } else if (stageName.includes('offer') || stageName.includes('final')) {
        status = Math.random() > 0.5 ? ApplicantStatus.HIRED : ApplicantStatus.REJECTED;
      } else if (stageName.includes('hired')) {
        status = ApplicantStatus.HIRED;
      } else {
        status = Math.random() > 0.4 ? ApplicantStatus.APPLIED : ApplicantStatus.REJECTED;
      }

      const application = {
        id: this.generateId(),
        applicationNumber: `APP-${String(i + 1).padStart(4, '0')}-${new Date().getFullYear()}`,
        applicantId: applicant.id,
        vacancyId: vacancy.id,
        pipelineId: vacancy.pipelineId,
        currentStageId: currentStage?.id,
        status: status,
        coverLetter: `I am writing to express my interest in the ${vacancy.title} position. I believe my skills and experience make me a strong candidate for this role.`,
        expectedStartDate: new Date(Date.now() + Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000), // Random date in next 90 days
        source: ['linkedin', 'jobstreet', 'company_website', 'referral', 'indeed'][Math.floor(Math.random() * 5)],
        customSource: Math.random() > 0.7 ? 'Employee Referral' : null,
        appliedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date in last 30 days
        completedAt: status === ApplicantStatus.HIRED ? new Date() : null,
        currentScore: Math.floor(Math.random() * 40) + 60, // Score between 60-100
        currentNotes: status === ApplicantStatus.HIRED ? 'Strong candidate, good technical skills' : 
                     status === ApplicantStatus.REJECTED ? 'Does not meet requirements' : 
                     'Under review',
        lastActivityAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Random date in last 7 days
        isTalentPool: status === ApplicantStatus.HIRED && Math.random() > 0.6, // 40% chance for talent pool if hired
        createdAt: new Date(),
        updatedAt: new Date()
      };

      applicationData.push(application);
    }

    return await this.saveEntities(Application, applicationData);
  }
}
