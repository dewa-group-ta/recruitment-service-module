import { BaseSeeder } from "./base.seeder";
import { RecruitmentPipeline } from "../modules/vacancies/entities/recruitment-pipeline.entity";
import { PipelineStage } from "../modules/vacancies/entities/pipeline-stage.entity";
import { StageTemplate } from "../modules/vacancies/entities/stage-template.entity";

export class PipelineTemplateSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log("🌱 Seeding pipeline templates...");

    // Get stage templates
    const stageTemplateRepository = await this.getRepository(StageTemplate);
    const stageTemplates = await stageTemplateRepository.find();

    if (stageTemplates.length === 0) {
      console.log(
        "⚠️  No stage templates found. Please run stage template seeder first."
      );
      return;
    }

    // Create pipeline templates
    const pipelineTemplates = await this.createPipelineTemplates();

    // Create stages for each pipeline template using stage templates
    for (const pipelineTemplate of pipelineTemplates as any[]) {
      await this.createStagesForPipelineTemplate(pipelineTemplate, stageTemplates);
    }

    console.log("✅ Pipeline templates seeded successfully");
  }

  private async createPipelineTemplates() {
    const pipelineTemplateData = [
      {
        id: this.generateId(),
        name: "Default",
        description: "Default recruitment pipeline template for general positions",
        version: "1.0",
        isDefault: true,
        isActive: true,
        isTemplate: true,
        category: "general",
        usageCount: 0,
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Engineering Template",
        description: "Recruitment pipeline template for engineering positions",
        version: "1.0",
        isDefault: false,
        isActive: true,
        isTemplate: true,
        category: "engineering",
        usageCount: 0,
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Marketing Template",
        description: "Recruitment pipeline template for marketing positions",
        version: "1.0",
        isDefault: false,
        isActive: true,
        isTemplate: true,
        category: "marketing",
        usageCount: 0,
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Sales Template",
        description: "Recruitment pipeline template for sales positions",
        version: "1.0",
        isDefault: false,
        isActive: true,
        isTemplate: true,
        category: "sales",
        usageCount: 0,
        createdById: "system"
      },
      {
        id: this.generateId(),
        name: "Executive Template",
        description: "Recruitment pipeline template for executive positions",
        version: "1.0",
        isDefault: false,
        isActive: true,
        isTemplate: true,
        category: "executive",
        usageCount: 0,
        createdById: "system"
      }
    ];

    return await this.saveEntities(RecruitmentPipeline, pipelineTemplateData);
  }

  private async createStagesForPipelineTemplate(pipelineTemplate: any, stageTemplates: any[]) {
    const stagesData: any[] = [];
    let stageOrder = 1;

    // Define stage order based on pipeline template category
    const stageOrderMap = {
      engineering: [
        "Application Review",
        "Phone Screening",
        "Technical Assessment",
        "Panel Interview",
        "Final Interview",
        "Reference Check",
        "Offer"
      ],
      marketing: [
        "Application Review",
        "Phone Screening",
        "Portfolio Review",
        "Panel Interview",
        "Final Interview",
        "Reference Check",
        "Offer"
      ],
      sales: [
        "Application Review",
        "Phone Screening",
        "Sales Assessment",
        "Panel Interview",
        "Final Interview",
        "Reference Check",
        "Offer"
      ],
      executive: [
        "Application Review",
        "Executive Screening",
        "Board Interview",
        "Final Interview",
        "Reference Check",
        "Offer"
      ],
      general: [
        "Application Review",
        "Phone Screening",
        "Panel Interview",
        "Final Interview",
        "Reference Check",
        "Offer"
      ]
    };

    const stagesToInclude =
      stageOrderMap[pipelineTemplate.category] || stageOrderMap["general"];

    for (const stageName of stagesToInclude) {
      const template = stageTemplates.find((t) => t.name === stageName);

      if (template) {
        stagesData.push({
          id: this.generateId(),
          pipelineId: pipelineTemplate.id,
          stageTemplateId: template.id,
          stageOrder: stageOrder++,
          estimatedDurationDays: this.getEstimatedDurationForStage(stageName),
          sendNotification: true
        });
      }
    }

    return await this.saveEntities(PipelineStage, stagesData);
  }

  private getEstimatedDurationForStage(stageName: string): number {
    const durationMap = {
      "Application Review": 3,
      "Phone Screening": 5,
      "Technical Assessment": 7,
      "Portfolio Review": 5,
      "Sales Assessment": 7,
      "Executive Screening": 10,
      "Board Interview": 14,
      "Panel Interview": 10,
      "Final Interview": 14,
      "Reference Check": 5,
      Offer: 3
    };

    return durationMap[stageName] || 5;
  }
}
