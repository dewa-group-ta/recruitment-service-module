import { DataSource } from "typeorm";
import { BaseSeeder } from "./base.seeder";
import { StageTemplateSeeder } from "./stage-template.seeder";
import { PipelineTemplateSeeder } from "./pipeline-template.seeder";
import { RecruitmentPipelineSeeder } from "./recruitment-pipeline.seeder";
import { VacancySeeder } from "./vacancy.seeder";
import { ApplicantSourceSeeder } from "./applicant-source.seeder";
import { ApplicationSeeder } from "./application.seeder";
import { ApplicantsSeeder } from "./applicant.seeder";
import { SystemConfigurationSeeder } from "./system-configuration.seeder";
import { JobCategorySeeder } from "./job-category.seeder";
import { DepartmentSeeder } from "./department.seeder";
import { StageActivity } from "../modules/vacancies/entities/stage-activity.entity";
import { Application } from "../modules/applicants/entities/application.entity";
import { Vacancy } from "../modules/vacancies/entities/vacancy.entity";
import { PipelineStage } from "../modules/vacancies/entities/pipeline-stage.entity";
import { RecruitmentPipeline } from "../modules/vacancies/entities/recruitment-pipeline.entity";
import { StageTemplate } from "../modules/vacancies/entities/stage-template.entity";
import { ApplicantSource } from "../modules/applicants/entities/applicant-source.entity";
import { SystemConfiguration } from "../modules/system-configurations/entities/system-configuration.entity";
import { JobCategory } from "../modules/vacancies/entities/job-category.entity";
import { Department } from "../modules/departments/entities/department.entity";
import { Applicant } from "../modules/applicants/entities/applicant.entity";

export class MainSeeder extends BaseSeeder {
  private seeders: BaseSeeder[] = [];

  constructor(dataSource: DataSource) {
    super(dataSource);
    this.initializeSeeders();
  }

  private initializeSeeders() {
    this.seeders = [
      new SystemConfigurationSeeder(this.dataSource),
      new JobCategorySeeder(this.dataSource),
      new DepartmentSeeder(this.dataSource),
      new StageTemplateSeeder(this.dataSource),
      new PipelineTemplateSeeder(this.dataSource),
      new ApplicantSourceSeeder(this.dataSource),
      new RecruitmentPipelineSeeder(this.dataSource),
      new VacancySeeder(this.dataSource),
      new ApplicantsSeeder(this.dataSource),
      new ApplicationSeeder(this.dataSource),
    ];
  }

  async run(): Promise<void> {
    console.log("🚀 Starting database seeding...");
    console.log("=====================================");

    try {
      for (const seeder of this.seeders) {
        await seeder.run();
        console.log(""); // Empty line for better readability
      }

      console.log("=====================================");
      console.log("✅ Database seeding completed successfully!");
      console.log("");
      console.log("📊 Seeded data summary:");
      console.log("   • System Configurations: 16 company settings");
      console.log("   • Job Categories: 8 job categories");
      console.log("   • Departments: 15 departments");
      console.log("   • Stage Templates: 8 reusable stage templates");
      console.log("   • Pipeline Templates: 5 pipeline templates");
      console.log("   • Applicant Sources: 5 source types");
      console.log("   • Recruitment Pipelines: 4 pipelines with stages");
      console.log("   • Vacancy Forms: 5 template forms with fields");
      console.log("   • Vacancies: 10 sample vacancies");
      console.log("   • Applicants: 50 sample applicants");
      console.log("   • Applications: 50 sample applications");
      console.log("");
      console.log("🎉 You can now start using the recruitment system!");
    } catch (error) {
      console.error("❌ Error during seeding:", error);
      throw error;
    }
  }

  async runSpecificSeeder(seederName: string): Promise<void> {
    const seeder = this.seeders.find((s) => {
      const className = s.constructor.name.toLowerCase();
      const searchName = seederName.toLowerCase();
      return (
        className.includes(searchName) ||
        searchName.includes(className.replace("seeder", ""))
      );
    });

    if (!seeder) {
      console.error(`❌ Seeder '${seederName}' not found.`);
      console.log("Available seeders:");
      this.seeders.forEach((s) => {
        const name = s.constructor.name.replace("Seeder", "").toLowerCase();
        console.log(`   • ${name}`);
      });
      return;
    }

    console.log(`🌱 Running ${seeder.constructor.name}...`);
    await seeder.run();
    console.log(`✅ ${seeder.constructor.name} completed successfully!`);
  }

  async clearAll(): Promise<void> {
    console.log("🧹 Clearing all seeded data...");

    try {
      // Clear in reverse order to respect foreign key constraints
      const clearOrder = [
        { entity: StageActivity, name: "Stage Activities" },
        { entity: Application, name: "Applications" },
        { entity: Vacancy, name: "Vacancies" },
        { entity: PipelineStage, name: "Pipeline Stages" },
        { entity: RecruitmentPipeline, name: "Recruitment Pipelines" },
        { entity: ApplicantSource, name: "Applicant Sources" },
        { entity: StageTemplate, name: "Stage Templates" },
        { entity: JobCategory, name: "Job Categories" },
        { entity: Department, name: "Departments" },
        { entity: Applicant, name: "Applicants" },
        { entity: SystemConfiguration, name: "System Configurations" }
      ];

      for (const { entity, name } of clearOrder) {
        try {
          console.log(`   Clearing ${name}...`);
          await this.clearTable(entity as any);
        } catch (error) {
          console.warn(`   Warning: Could not clear ${name}:`, error.message);
        }
      }

      console.log("✅ All seeded data cleared successfully!");
    } catch (error) {
      console.error("❌ Error during clearing:", error);
      throw error;
    }
  }
}
