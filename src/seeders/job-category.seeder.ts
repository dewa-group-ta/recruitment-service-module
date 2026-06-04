import { DataSource } from "typeorm";
import { JobCategory } from "../modules/vacancies/entities/job-category.entity";
import { BaseSeeder } from "./base.seeder";

export class JobCategorySeeder extends BaseSeeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    const jobCategoryRepository = await this.getRepository(JobCategory);

    // Check if categories already exist
    const existingCategories = await jobCategoryRepository.count();
    if (existingCategories > 0) {
      console.log("Job categories already exist, skipping seeder...");
      return;
    }

    const categories = [
      {
        name: "Engineering",
        description: "Software development and engineering positions",
        code: "ENG",
        color: "#3B82F6",
        icon: "code",
        sortOrder: 1,
        isActive: true,
        createdById: "system"
      },
      {
        name: "Marketing",
        description: "Marketing and communications roles",
        code: "MKT",
        color: "#10B981",
        icon: "megaphone",
        sortOrder: 2,
        isActive: true,
        createdById: "system"
      },
      {
        name: "Sales",
        description: "Sales and business development positions",
        code: "SALES",
        color: "#F59E0B",
        icon: "trending-up",
        sortOrder: 3,
        isActive: true,
        createdById: "system"
      },
      {
        name: "Human Resources",
        description: "HR and people operations roles",
        code: "HR",
        color: "#8B5CF6",
        icon: "users",
        sortOrder: 4,
        isActive: true,
        createdById: "system"
      },
      {
        name: "Finance",
        description: "Finance and accounting positions",
        code: "FIN",
        color: "#EF4444",
        icon: "calculator",
        sortOrder: 5,
        isActive: true,
        createdById: "system"
      },
      {
        name: "Operations",
        description: "Operations and administrative roles",
        code: "OPS",
        color: "#6B7280",
        icon: "settings",
        sortOrder: 6,
        isActive: true,
        createdById: "system"
      },
      {
        name: "Design",
        description: "UI/UX and graphic design positions",
        code: "DESIGN",
        color: "#EC4899",
        icon: "palette",
        sortOrder: 7,
        isActive: true,
        createdById: "system"
      },
      {
        name: "Product",
        description: "Product management and strategy roles",
        code: "PROD",
        color: "#06B6D4",
        icon: "layers",
        sortOrder: 8,
        isActive: true,
        createdById: "system"
      }
    ];

    try {
      await this.saveEntities(JobCategory, categories);
      console.log(`✅ Seeded ${categories.length} job categories`);
    } catch (error) {
      console.error("❌ Error seeding job categories:", error);
      throw error;
    }
  }
}
