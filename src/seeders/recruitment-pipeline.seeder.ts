import { BaseSeeder } from "./base.seeder";
import { RecruitmentPipeline } from "../modules/vacancies/entities/recruitment-pipeline.entity";
import { PipelineStage } from "../modules/vacancies/entities/pipeline-stage.entity";
import { StageTemplate } from "../modules/vacancies/entities/stage-template.entity";

export class RecruitmentPipelineSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log("Seeding recruitment pipelines...");

    const stageTemplateRepository = await this.getRepository(StageTemplate);
    const stageTemplates = await stageTemplateRepository.find();

    if (stageTemplates.length === 0) {
      console.log(
        "No stage templates found. Please run stage template seeder first."
      );
      return;
    }

    const pipelines = await this.createPipelines();

    for (const pipeline of pipelines as any[]) {
      await this.createStagesForPipeline(pipeline, stageTemplates);
    }

    console.log("Recruitment pipelines seeded successfully");
  }

  private async createPipelines() {
    const pipelineData = [
      {
        id: this.generateId(),
        name: "HCM Neuron",
        description:
          "Standard recruitment pipeline for PT Neuronworks Indonesia",
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
        name: "Default Engineering Pipeline",
        description: "Standard recruitment pipeline for engineering positions",
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
        name: "Marketing Pipeline",
        description: "Recruitment pipeline for marketing positions",
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
        name: "Sales Pipeline",
        description: "Recruitment pipeline for sales positions",
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
        name: "Executive Pipeline",
        description: "Recruitment pipeline for executive positions",
        version: "1.0",
        isDefault: false,
        isActive: true,
        isTemplate: true,
        category: "executive",
        usageCount: 0,
        createdById: "system"
      }
    ];

    return await this.saveEntities(RecruitmentPipeline, pipelineData);
  }

  private async createStagesForPipeline(pipeline: any, stageTemplates: any[]) {
    const stagesData: any[] = [];
    let stageOrder = 1;

    const stageOrderMap = {
      "HCM Neuron": [
        "Administration Selection",
        "Psikotes",
        "Skill Test",
        "Interview User",
        "Interview HCM"
      ],
      engineering: [
        "Application Review",
        "Phone Screening",
        "Technical Assessment",
        "Panel Interview",
        "Final Interview",
        "Reference Check",
        "Offer"
      ],
      default: [
        "Application Review",
        "Phone Screening",
        "Panel Interview",
        "Final Interview",
        "Reference Check",
        "Offer"
      ]
    };

    const stagesToInclude =
      stageOrderMap[pipeline.name] ||
      stageOrderMap[pipeline.category] ||
      stageOrderMap["default"];

    for (const stageName of stagesToInclude) {
      const template = stageTemplates.find((t) => t.name === stageName);

      if (template) {
        stagesData.push({
          id: this.generateId(),
          pipelineId: pipeline.id,
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
      "Administration Selection": 3,
      Psikotes: 5,
      "Skill Test": 7,
      "Interview User": 7,
      "Interview HCM": 7,
      "Application Review": 3,
      "Phone Screening": 5,
      "Technical Assessment": 7,
      "Panel Interview": 10,
      "Final Interview": 14,
      "Reference Check": 5,
      Offer: 3
    };

    return durationMap[stageName] || 5;
  }
}
