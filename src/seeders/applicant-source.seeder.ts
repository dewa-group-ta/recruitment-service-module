import { BaseSeeder } from "./base.seeder";
import { ApplicantSource } from "../modules/applicants/entities/applicant-source.entity";

export class ApplicantSourceSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log("Seeding applicant sources...");

    const repository = await this.getRepository(ApplicantSource);
    const existingSources = await repository.find();
    if (existingSources.length > 0) {
      console.log("Applicant sources already exist, skipping seeder...");
      return;
    }

    const applicantSourceData = [
      {
        id: this.generateId(),
        name: "Job Portals",
        description:
          "Applications received through job posting websites and portals",
        isActive: true,
        sortOrder: 1
      },
      {
        id: this.generateId(),
        name: "Career Fair",
        description: "Applications received from career fairs and job expos",
        isActive: true,
        sortOrder: 2
      },
      {
        id: this.generateId(),
        name: "Social Media",
        description: "Applications received through social media platforms",
        isActive: true,
        sortOrder: 3
      },
      {
        id: this.generateId(),
        name: "LinkedIn",
        description: "Applications received through LinkedIn platform",
        isActive: true,
        sortOrder: 4
      },
      {
        id: this.generateId(),
        name: "Others",
        description: "Applications received through other platforms",
        isActive: true,
        sortOrder: 5
      }
    ];

    await this.saveEntities(ApplicantSource, applicantSourceData);

    console.log("Applicant sources seeded successfully");
  }
}
