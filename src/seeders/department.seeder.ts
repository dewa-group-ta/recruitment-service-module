import { DataSource } from "typeorm";
import { Department } from "../modules/departments/entities/department.entity";
import { BaseSeeder } from "./base.seeder";

export class DepartmentSeeder extends BaseSeeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    const departmentRepository = await this.getRepository(Department);

    const existingDepartments = await departmentRepository.count();
    if (existingDepartments > 0) {
      console.log("Departments already exist, skipping seeder...");
      return;
    }

    const departments = [
      {
        name: "Engineering",
        code: "ENG",
        description:
          "Software development, system architecture, and technical innovation",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Product Management",
        code: "PM",
        description:
          "Product strategy, roadmap planning, and feature development",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Design",
        code: "DESIGN",
        description: "User experience, user interface, and visual design",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Marketing",
        code: "MKT",
        description:
          "Brand management, digital marketing, and customer acquisition",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Sales",
        code: "SALES",
        description:
          "Business development, client relations, and revenue generation",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Human Resources",
        code: "HR",
        description:
          "Talent acquisition, employee relations, and organizational development",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Finance",
        code: "FIN",
        description: "Financial planning, accounting, and business analytics",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Operations",
        code: "OPS",
        description:
          "Business operations, process optimization, and administrative support",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Customer Success",
        code: "CS",
        description:
          "Customer support, account management, and client satisfaction",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Data & Analytics",
        code: "DATA",
        description: "Data science, business intelligence, and analytics",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Quality Assurance",
        code: "QA",
        description:
          "Software testing, quality control, and process improvement",
        isActive: true,
        createdById: "system"
      },
      {
        name: "DevOps",
        code: "DEVOPS",
        description: "Infrastructure, deployment, and system reliability",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Security",
        code: "SEC",
        description: "Information security, compliance, and risk management",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Legal",
        code: "LEGAL",
        description:
          "Legal compliance, contract management, and regulatory affairs",
        isActive: true,
        createdById: "system"
      },
      {
        name: "Research & Development",
        code: "R&D",
        description: "Innovation, research, and experimental development",
        isActive: true,
        createdById: "system"
      }
    ];

    try {
      await this.saveEntities(Department, departments);
      console.log(`Seeded ${departments.length} departments`);
    } catch (error) {
      console.error("Error seeding departments:", error);
      throw error;
    }
  }
}
