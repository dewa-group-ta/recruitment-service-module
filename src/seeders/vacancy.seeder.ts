import { BaseSeeder } from "./base.seeder";
import { Vacancy } from "../modules/vacancies/entities/vacancy.entity";
import { RecruitmentPipeline } from "../modules/vacancies/entities/recruitment-pipeline.entity";
import { JobCategory } from "../modules/vacancies/entities/job-category.entity";
import {
  JobStatus,
  EmploymentType,
  WorkModel,
  JobType,
  SalaryPeriod,
  EducationLevel
} from "../shared/enums/job-status.enum";

export class VacancySeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log("🌱 Seeding vacancies...");

    // Get available pipelines
    const pipelineRepository = await this.getRepository(RecruitmentPipeline);
    const pipelines = await pipelineRepository.find();

    if (pipelines.length === 0) {
      console.log("⚠️  No pipelines found. Please run pipeline seeder first.");
      return;
    }

    // Get available job categories
    const jobCategoryRepository = await this.getRepository(JobCategory);
    const jobCategories = await jobCategoryRepository.find();

    if (jobCategories.length === 0) {
      console.log(
        "⚠️  No job categories found. Please run job category seeder first."
      );
      return;
    }

    // Clear existing data
    await this.clearTable(Vacancy);

    // Create sample vacancies
    const vacancies = await this.createVacancies(pipelines, jobCategories);

    console.log(`✅ ${vacancies.length} job vacancies seeded successfully`);
  }

  private async createVacancies(pipelines: any[], jobCategories: any[]) {
    const engineeringPipeline = pipelines.find(
      (p) => p.category === "engineering"
    );
    const marketingPipeline = pipelines.find((p) => p.category === "marketing");
    const salesPipeline = pipelines.find((p) => p.category === "sales");
    const executivePipeline = pipelines.find((p) => p.category === "executive");

    // Map job categories by name
    const engineeringCategory = jobCategories.find(
      (c) => c.name === "Engineering"
    );
    const marketingCategory = jobCategories.find((c) => c.name === "Marketing");
    const salesCategory = jobCategories.find((c) => c.name === "Sales");
    const productCategory = jobCategories.find((c) => c.name === "Product");

    const vacancyData = [
      // Engineering Positions
      {
        id: this.generateId(),
        title: "Senior Software Engineer",
        jobCode: "SWE-001",
        description:
          "We are looking for an experienced software engineer to join our development team. You will be responsible for designing, developing, and maintaining high-quality software solutions.",
        responsibilities: "Design and develop scalable software solutions, collaborate with cross-functional teams, mentor junior developers, participate in code reviews and technical discussions.",
        requirements: "Bachelor's degree in Computer Science or related field, 3+ years of experience in software development, proficiency in React, Node.js, and TypeScript, experience with cloud platforms (AWS/Azure).",
        status: JobStatus.PUBLISHED,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.HYBRID,
        startDate: new Date("2025-11-01"),
        endDate: new Date("2025-12-31"),
        isLimitApplicantEnabled: true,
        applicantLimit: 100,
        officeAddresses: ["Jakarta Office", "Bandung Office - Jl. Asia Afrika No. 456"],
        department: "engineering",
        salaryMin: 15000000,
        salaryMax: 25000000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        currency: "IDR",
        requiredEducation: EducationLevel.BACHELOR,
        requiredExperienceYears: 3,
        hoursPerWeekMin: 40,
        hoursPerWeekMax: 40,
        generatedPosterUrl: "senior-software-engineer-poster.jpg",
        posterConfiguration: {
          jobDetails: {
            dueDate: true,
            jobTitle: true,
            jobType: true,
            applicantLimit: true
          },
          employmentDetails: {
            employmentType: true,
            category: true,
            education: true,
            experience: true
          },
          jobOverview: {
            description: true,
            responsibilities: true,
            requirements: true
          },
          locations: {
            locations: true
          },
          workModel: {
            workModel: true
          },
          salary: {
            salary: true
          }
        },
        pipelineId: engineeringPipeline?.id,
        jobCategoryId: engineeringCategory?.id,
        createdById: "hr-team",
        updatedById: "hr-team"
      },
      {
        id: this.generateId(),
        title: "Frontend Developer",
        jobCode: "FE-001",
        description:
          "Join our frontend team to build amazing user experiences. We use React, TypeScript, and modern web technologies.",
        responsibilities: "Develop responsive web applications using React and TypeScript, collaborate with UI/UX designers, optimize application performance, write clean and maintainable code.",
        requirements: "Bachelor's degree in Computer Science or related field, 2+ years of experience in frontend development, proficiency in React, TypeScript, HTML5, CSS3, and JavaScript ES6+.",
        status: JobStatus.PUBLISHED,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.REMOTE,
        startDate: new Date("2025-11-15"),
        endDate: new Date("2025-12-15"),
        isLimitApplicantEnabled: true,
        applicantLimit: 80,
        officeAddresses: ["Remote Work"],
        department: "engineering",
        salaryMin: 12000000,
        salaryMax: 20000000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        currency: "IDR",
        requiredEducation: EducationLevel.BACHELOR,
        requiredExperienceYears: 2,
        hoursPerWeekMin: 40,
        hoursPerWeekMax: 40,
        generatedPosterUrl: "frontend-developer-poster.jpg",
        posterConfiguration: {
          jobDetails: {
            dueDate: true,
            jobTitle: true,
            jobType: true,
            applicantLimit: true
          },
          employmentDetails: {
            employmentType: true,
            category: true,
            education: true,
            experience: true
          },
          jobOverview: {
            description: true,
            responsibilities: true,
            requirements: true
          },
          locations: {
            locations: true
          },
          workModel: {
            workModel: true
          },
          salary: {
            salary: true
          }
        },
        pipelineId: engineeringPipeline?.id,
        jobCategoryId: engineeringCategory?.id,
        createdById: "hr-team",
        updatedById: "hr-team"
      },
      {
        id: this.generateId(),
        title: "DevOps Engineer",
        jobCode: "DEVOPS-001",
        description:
          "We need a DevOps engineer to help us scale our infrastructure and improve our deployment processes.",
        responsibilities: "Design and implement CI/CD pipelines, manage cloud infrastructure, monitor system performance, automate deployment processes, ensure system security and compliance.",
        requirements: "Bachelor's degree in Computer Science or related field, 4+ years of experience in DevOps, proficiency in AWS/Azure, Docker, Kubernetes, and infrastructure as code tools.",
        status: JobStatus.DRAFT,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.HYBRID,
        startDate: new Date("2025-12-01"),
        endDate: new Date("2026-01-31"),
        isLimitApplicantEnabled: true,
        applicantLimit: 50,
        officeAddresses: ["Jakarta Office"],
        department: "engineering",
        salaryMin: 18000000,
        salaryMax: 28000000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        currency: "IDR",
        requiredEducation: EducationLevel.BACHELOR,
        requiredExperienceYears: 4,
        hoursPerWeekMin: 40,
        hoursPerWeekMax: 40,
        generatedPosterUrl: "devops-engineer-poster.jpg",
        posterConfiguration: {
          jobDetails: {
            dueDate: true,
            jobTitle: true,
            jobType: true,
            applicantLimit: false
          },
          employmentDetails: {
            employmentType: true,
            category: true,
            education: true,
            experience: true
          },
          jobOverview: {
            description: true,
            responsibilities: true,
            requirements: true
          },
          locations: {
            locations: true
          },
          workModel: {
            workModel: true
          },
          salary: {
            salary: true
          }
        },
        pipelineId: engineeringPipeline?.id,
        jobCategoryId: engineeringCategory?.id,
        createdById: "hr-team",
        updatedById: "hr-team"
      },
      // Marketing Positions
      {
        id: this.generateId(),
        title: "Digital Marketing Specialist",
        jobCode: "DMS-001",
        description:
          "Lead our digital marketing efforts including SEO, SEM, social media, and content marketing.",
        responsibilities: "Develop and execute digital marketing campaigns, manage social media accounts, create content for various platforms, analyze campaign performance and optimize ROI.",
        requirements: "Bachelor's degree in Marketing or related field, 2+ years of experience in digital marketing, proficiency in Google Analytics, Facebook Ads, and SEO tools.",
        status: JobStatus.PUBLISHED,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.HYBRID,
        startDate: new Date("2025-11-20"),
        endDate: new Date("2025-12-20"),
        isLimitApplicantEnabled: true,
        applicantLimit: 60,
        officeAddresses: ["Jakarta Office"],
        department: "marketing",
        salaryMin: 10000000,
        salaryMax: 18000000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        currency: "IDR",
        requiredEducation: EducationLevel.BACHELOR,
        requiredExperienceYears: 2,
        hoursPerWeekMin: 40,
        hoursPerWeekMax: 40,
        generatedPosterUrl: "digital-marketing-specialist-poster.jpg",
        posterConfiguration: {
          jobDetails: {
            dueDate: true,
            jobTitle: true,
            jobType: true,
            applicantLimit: true
          },
          employmentDetails: {
            employmentType: true,
            category: true,
            education: true,
            experience: true
          },
          jobOverview: {
            description: true,
            responsibilities: true,
            requirements: true
          },
          locations: {
            locations: true
          },
          workModel: {
            workModel: true
          },
          salary: {
            salary: true
          }
        },
        pipelineId: marketingPipeline?.id,
        jobCategoryId: marketingCategory?.id,
        createdById: "hr-team",
        updatedById: "hr-team"
      },
      {
        id: this.generateId(),
        title: "Content Marketing Manager",
        jobCode: "CMM-001",
        description:
          "Create and execute content marketing strategies to drive brand awareness and lead generation.",
        responsibilities: "Develop content marketing strategies, manage content calendar, create engaging content for various channels, collaborate with design and development teams.",
        requirements: "Bachelor's degree in Marketing, Communications, or related field, 3+ years of experience in content marketing, excellent writing and editing skills, experience with CMS platforms.",
        status: JobStatus.PUBLISHED,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.ON_SITE,
        startDate: new Date("2025-11-10"),
        endDate: new Date("2025-12-10"),
        isLimitApplicantEnabled: true,
        applicantLimit: 40,
        officeAddresses: ["Jakarta Office"],
        department: "marketing",
        salaryMin: 12000000,
        salaryMax: 20000000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        currency: "IDR",
        requiredEducation: EducationLevel.BACHELOR,
        requiredExperienceYears: 3,
        hoursPerWeekMin: 40,
        hoursPerWeekMax: 40,
        generatedPosterUrl: "content-marketing-manager-poster.jpg",
        posterConfiguration: {
          jobDetails: {
            dueDate: true,
            jobTitle: true,
            jobType: true,
            applicantLimit: true
          },
          employmentDetails: {
            employmentType: true,
            category: true,
            education: true,
            experience: true
          },
          jobOverview: {
            description: true,
            responsibilities: true,
            requirements: true
          },
          locations: {
            locations: true
          },
          workModel: {
            workModel: true
          },
          salary: {
            salary: true
          }
        },
        pipelineId: marketingPipeline?.id,
        jobCategoryId: marketingCategory?.id,
        createdById: "hr-team",
        updatedById: "hr-team"
      },
      // Sales Positions
      {
        id: this.generateId(),
        title: "Sales Manager",
        jobCode: "SM-001",
        description:
          "Lead our sales team and drive revenue growth through strategic planning and team management.",
        responsibilities: "Lead and manage sales team, develop sales strategies, build and maintain client relationships, analyze sales data and performance, achieve sales targets.",
        requirements: "Bachelor's degree in Business or related field, 5+ years of experience in sales management, proven track record of achieving sales targets, excellent communication and leadership skills.",
        status: JobStatus.PUBLISHED,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.ON_SITE,
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-25"),
        isLimitApplicantEnabled: true,
        applicantLimit: 30,
        officeAddresses: ["Jakarta Office"],
        department: "sales",
        salaryMin: 20000000,
        salaryMax: 35000000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        currency: "IDR",
        requiredEducation: EducationLevel.BACHELOR,
        requiredExperienceYears: 5,
        hoursPerWeekMin: 40,
        hoursPerWeekMax: 40,
        generatedPosterUrl: "sales-manager-poster.jpg",
        posterConfiguration: {
          jobDetails: {
            dueDate: true,
            jobTitle: true,
            jobType: true,
            applicantLimit: true
          },
          employmentDetails: {
            employmentType: true,
            category: true,
            education: true,
            experience: true
          },
          jobOverview: {
            description: true,
            responsibilities: true,
            requirements: true
          },
          locations: {
            locations: true
          },
          workModel: {
            workModel: true
          },
          salary: {
            salary: true
          }
        },
        pipelineId: salesPipeline?.id,
        jobCategoryId: salesCategory?.id,
        createdById: "hr-team",
        updatedById: "hr-team"
      },
      {
        id: this.generateId(),
        title: "Business Development Representative",
        jobCode: "BDR-001",
        description:
          "Identify and develop new business opportunities to expand our market reach.",
        responsibilities: "Identify potential clients and business opportunities, conduct market research, develop business proposals, maintain client relationships, support sales team.",
        requirements: "Bachelor's degree in Business or related field, 1+ years of experience in business development, excellent communication skills, ability to work independently.",
        status: JobStatus.PUBLISHED,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.HYBRID,
        startDate: new Date("2025-11-15"),
        endDate: new Date("2025-12-18"),
        isLimitApplicantEnabled: true,
        applicantLimit: 50,
        officeAddresses: ["Jakarta Office"],
        department: "sales",
        salaryMin: 8000000,
        salaryMax: 15000000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        currency: "IDR",
        requiredEducation: EducationLevel.BACHELOR,
        requiredExperienceYears: 1,
        hoursPerWeekMin: 40,
        hoursPerWeekMax: 40,
        generatedPosterUrl: "business-development-representative-poster.jpg",
        posterConfiguration: {
          jobDetails: {
            dueDate: true,
            jobTitle: true,
            jobType: true,
            applicantLimit: true
          },
          employmentDetails: {
            employmentType: true,
            category: true,
            education: true,
            experience: true
          },
          jobOverview: {
            description: true,
            responsibilities: true,
            requirements: true
          },
          locations: {
            locations: true
          },
          workModel: {
            workModel: true
          },
          salary: {
            salary: true
          }
        },
        pipelineId: salesPipeline?.id,
        jobCategoryId: salesCategory?.id,
        createdById: "hr-team",
        updatedById: "hr-team"
      },
      // Executive Positions
      {
        id: this.generateId(),
        title: "Chief Technology Officer",
        jobCode: "CTO-001",
        description:
          "Lead our technology strategy and engineering teams to drive innovation and technical excellence.",
        responsibilities: "Define and execute technology strategy, lead engineering teams, oversee technical architecture decisions, drive innovation and digital transformation, ensure technical excellence.",
        requirements: "Master's degree in Computer Science or related field, 10+ years of experience in technology leadership, proven track record of scaling engineering teams, strong technical background.",
        status: JobStatus.PUBLISHED,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.HYBRID,
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-31"),
        isLimitApplicantEnabled: true,
        applicantLimit: 20,
        officeAddresses: ["Jakarta Office"],
        department: "executive",
        salaryMin: 50000000,
        salaryMax: 80000000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        currency: "IDR",
        requiredEducation: EducationLevel.MASTER,
        requiredExperienceYears: 10,
        hoursPerWeekMin: 40,
        hoursPerWeekMax: 50,
        generatedPosterUrl: "cto-poster.jpg",
        posterConfiguration: {
          jobDetails: {
            dueDate: true,
            jobTitle: true,
            jobType: true,
            applicantLimit: true
          },
          employmentDetails: {
            employmentType: true,
            category: true,
            education: true,
            experience: true
          },
          jobOverview: {
            description: true,
            responsibilities: true,
            requirements: true
          },
          locations: {
            locations: true
          },
          workModel: {
            workModel: true
          },
          salary: {
            salary: true
          }
        },
        pipelineId: executivePipeline?.id,
        jobCategoryId: engineeringCategory?.id,
        createdById: "hr-team",
        updatedById: "hr-team"
      },
      // Closed Position
      {
        id: this.generateId(),
        title: "Product Manager",
        jobCode: "PM-001",
        description: "This position has been filled.",
        responsibilities: "Define product strategy and roadmap, collaborate with cross-functional teams, analyze market trends and user needs, prioritize features and requirements.",
        requirements: "Bachelor's degree in Business or related field, 4+ years of experience in product management, strong analytical and communication skills, experience with agile methodologies.",
        status: JobStatus.CLOSED,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.HYBRID,
        startDate: new Date("2025-10-01"),
        endDate: new Date("2025-10-31"),
        isLimitApplicantEnabled: true,
        applicantLimit: 40,
        officeAddresses: ["Jakarta Office"],
        department: "product",
        salaryMin: 15000000,
        salaryMax: 25000000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        currency: "IDR",
        requiredEducation: EducationLevel.BACHELOR,
        requiredExperienceYears: 4,
        hoursPerWeekMin: 40,
        hoursPerWeekMax: 40,
        generatedPosterUrl: "product-manager-poster.jpg",
        posterConfiguration: {
          jobDetails: {
            dueDate: true,
            jobTitle: true,
            jobType: true,
            applicantLimit: true
          },
          employmentDetails: {
            employmentType: true,
            category: true,
            education: true,
            experience: true
          },
          jobOverview: {
            description: true,
            responsibilities: true,
            requirements: true
          },
          locations: {
            locations: true
          },
          workModel: {
            workModel: true
          },
          salary: {
            salary: true
          }
        },
        pipelineId: engineeringPipeline?.id,
        jobCategoryId: productCategory?.id,
        createdById: "hr-team",
        updatedById: "hr-team"
      },
      // Archived Position
      {
        id: this.generateId(),
        title: "Junior Developer",
        jobCode: "JD-001",
        description: "This position has been archived.",
        responsibilities: "Assist in software development tasks, learn from senior developers, participate in code reviews, contribute to team projects.",
        requirements: "Bachelor's degree in Computer Science or related field, basic programming skills, willingness to learn, good communication skills.",
        status: JobStatus.ARCHIVED,
        jobType: JobType.RECRUITMENT,
        employmentType: EmploymentType.FULL_TIME,
        workModel: WorkModel.ON_SITE,
        startDate: new Date("2025-09-01"),
        endDate: new Date("2025-09-30"),
        isLimitApplicantEnabled: true,
        applicantLimit: 60,
        officeAddresses: ["Jakarta Office"],
        department: "engineering",
        salaryMin: 8000000,
        salaryMax: 12000000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        currency: "IDR",
        requiredEducation: EducationLevel.BACHELOR,
        requiredExperienceYears: 0,
        hoursPerWeekMin: 40,
        hoursPerWeekMax: 40,
        generatedPosterUrl: "junior-developer-poster.jpg",
        posterConfiguration: {
          jobDetails: {
            dueDate: true,
            jobTitle: true,
            jobType: true,
            applicantLimit: true
          },
          employmentDetails: {
            employmentType: true,
            category: true,
            education: true,
            experience: true
          },
          jobOverview: {
            description: true,
            responsibilities: true,
            requirements: true
          },
          locations: {
            locations: true
          },
          workModel: {
            workModel: true
          },
          salary: {
            salary: true
          }
        },
        pipelineId: engineeringPipeline?.id,
        jobCategoryId: engineeringCategory?.id,
        createdById: "hr-team",
        updatedById: "hr-team"
      }
    ];

    return await this.saveEntities(Vacancy, vacancyData);
  }
}