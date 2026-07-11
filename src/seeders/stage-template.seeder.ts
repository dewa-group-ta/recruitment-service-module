import { BaseSeeder } from "./base.seeder";
import { StageTemplate } from "../modules/vacancies/entities/stage-template.entity";

export class StageTemplateSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log("Seeding stage templates...");

    await this.clearTable(StageTemplate);

    const stageTemplates = await this.createStageTemplates();

    console.log(
      `${stageTemplates.length} stage templates seeded successfully`
    );
  }

  private async createStageTemplates() {
    const stageTemplateData = [
      {
        id: this.generateId(),
        name: "Application Review",
        description: "Initial review of submitted applications",
        maxDurationDays: 5,
        canScore: true,
        canNotify: true,
        instructions:
          "Review application materials and initial screening criteria",
        isActive: true,
        category: "general",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Phone Screening",
        description: "Initial phone interview with HR",
        maxDurationDays: 7,
        canScore: true,
        canNotify: true,
        instructions:
          "Conduct initial phone screening to assess basic qualifications",
        isActive: true,
        category: "general",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Technical Assessment",
        description: "Technical skills evaluation",
        maxDurationDays: 10,
        canScore: true,
        canNotify: true,
        instructions:
          "Evaluate technical skills through coding test or technical questions",
        isActive: true,
        category: "engineering",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Panel Interview",
        description: "Interview with team members and managers",
        maxDurationDays: 14,
        canScore: true,
        canNotify: true,
        instructions:
          "Conduct panel interview with team members and direct manager",
        isActive: true,
        category: "general",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Final Interview",
        description: "Final interview with department head",
        maxDurationDays: 14,
        canScore: true,
        canNotify: true,
        instructions:
          "Final interview with department head or senior leadership",
        isActive: true,
        category: "general",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Reference Check",
        description: "Contact and verify references",
        maxDurationDays: 7,
        canScore: false,
        canNotify: true,
        instructions:
          "Contact provided references to verify applicant background",
        isActive: true,
        category: "general",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Offer",
        description: "Job offer extended to applicant",
        maxDurationDays: 5,
        canScore: false,
        canNotify: true,
        instructions: "Extend job offer and discuss terms with applicant",
        isActive: true,
        category: "general",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Administration Selection",
        description:
          "Initial administrative screening and document verification",
        maxDurationDays: 5,
        canScore: true,
        canNotify: true,
        instructions:
          "Review submitted documents and verify administrative requirements",
        isActive: true,
        category: "general",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Psikotes",
        description: "Psychological assessment test",
        maxDurationDays: 7,
        canScore: true,
        canNotify: true,
        instructions:
          "Administer psychological assessment to evaluate candidate suitability",
        isActive: true,
        category: "general",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Skill Test",
        description: "Role-specific skill and competency assessment",
        maxDurationDays: 7,
        canScore: true,
        canNotify: true,
        instructions: "Evaluate role-specific technical and functional skills",
        isActive: true,
        category: "general",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Interview User",
        description: "Interview with the hiring department or direct user",
        maxDurationDays: 10,
        canScore: true,
        canNotify: true,
        instructions:
          "Conduct interview with the hiring team or direct manager",
        isActive: true,
        category: "general",
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Interview HCM",
        description: "Final interview with Human Capital Management",
        maxDurationDays: 10,
        canScore: true,
        canNotify: true,
        instructions:
          "Conduct final interview with HCM team for culture fit and offer discussion",
        isActive: true,
        category: "general",
        createdById: "system"
      }
    ];

    return await this.saveEntities(StageTemplate, stageTemplateData);
  }
}
