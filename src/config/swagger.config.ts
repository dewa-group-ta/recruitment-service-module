import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Recruitment Service API")
    .setDescription(
      `
      ## Core Features
      - **Applicant Management**: Registration, authentication, profile management, and application tracking
      - **Vacancy Management**: Job posting, pipeline management, and recruitment workflows
      - **System Configuration**: Dynamic configuration management for system settings
      - **Analytics & Reporting**: Recruitment metrics, trends, and performance analytics
      - **Department & Location Management**: Organizational structure and location data
      - **File Management**: Document upload and management for CVs, certificates, and photos
    `
    )
    .setVersion("1.0.0")
    .addServer("http://localhost:3000", "Development Server")
    .addTag("Applicants", "Applicant management and authentication")
    .addTag("Applicant Sources", "Manage applicant source tracking")
    .addTag("Applicant Educations", "Manage applicant education records")
    .addTag("Applicant Identities", "Manage applicant identity documents")
    .addTag("Applicant Project History", "Manage applicant project experience")
    .addTag("Applicant Job History", "Manage applicant work experience")
    .addTag("Applicant Addresses", "Manage applicant address information")
    .addTag("Vacancies", "Job vacancy management")
    .addTag("Recruitment Pipelines", "Recruitment workflow management")
    .addTag("Pipeline Stages", "Individual pipeline stage management")
    .addTag("Job Categories", "Job category management")
    .addTag("Stage Templates", "Pipeline stage template management")
    .addTag(
      "Notification Templates",
      "Email and notification template management"
    )
    .addTag("Public Vacancies", "Public job vacancy listings")
    .addTag("System Configurations", "System configuration management")
    .addTag("Departments", "Department management")
    .addTag("Locations", "Location and geographical data")
    .addTag("Candidates", "Candidate management and tracking")
    .addTag("Analytics", "Recruitment analytics and reporting")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "bearer",
        description: "Bearer token authentication for API access"
      },
      "bearer"
    )
    .build();

  const apiContract = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey
  });

  SwaggerModule.setup("docs", app, apiContract, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: "none",
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2
    },
    customSiteTitle: "Recruitment Service API Documentation",
    customfavIcon: "/favicon.ico"
  });
}
