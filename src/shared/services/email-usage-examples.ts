/**
 * Contoh penggunaan sistem email dengan system configuration templates
 * File ini berisi contoh implementasi untuk berbagai skenario email
 */

import { Injectable } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { SystemConfigEmailService } from "./system-config-email.service";

@Injectable()
export class EmailUsageExamples {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly systemConfigEmailService: SystemConfigEmailService
  ) {}

  /**
   * Contoh 1: Send applicant registration notification
   */
  async sendRegistrationNotification() {
    const applicantEmail = "john.doe@example.com";
    const applicantName = "John Doe";
    const applyLink = "https://recruitment.company.com/apply";

    const result =
      await this.notificationService.sendApplicantRegistrationNotification(
        applicantEmail,
        applicantName,
        applyLink
      );

    console.log("Registration notification sent:", result);
  }

  /**
   * Contoh 2: Send application received notification
   */
  async sendApplicationReceivedNotification() {
    const applicantEmail = "jane.smith@example.com";
    const applicantName = "Jane Smith";
    const vacancyName = "Senior Software Engineer";
    const applicationLink = "https://recruitment.company.com/application/123";

    const result =
      await this.notificationService.sendApplicantApplicationNotification(
        applicantEmail,
        applicantName,
        vacancyName,
        applicationLink
      );

    console.log("Application notification sent:", result);
  }

  /**
   * Contoh 3: Send status update notification
   */
  async sendStatusUpdateNotification() {
    const applicantEmail = "bob.wilson@example.com";
    const applicantName = "Bob Wilson";
    const vacancyName = "Product Manager";
    const loginUrl = "https://recruitment.company.com/track";

    const result =
      await this.notificationService.sendApplicantStatusUpdateNotification(
        applicantEmail,
        applicantName,
        vacancyName,
        loginUrl
      );

    console.log("Status update notification sent:", result);
  }

  /**
   * Contoh 4: Send custom notification dengan template khusus
   */
  async sendCustomNotification() {
    const result = await this.notificationService.sendCustomNotification(
      "notification_applicant_login_token",
      { email: "alice.johnson@example.com", name: "Alice Johnson" },
      {
        applicant_name: "Alice Johnson",
        application_link: "https://recruitment.company.com/login?token=abc123"
      }
    );

    console.log("Custom notification sent:", result);
  }

  /**
   * Contoh 5: Send bulk notifications
   */
  async sendBulkNotifications() {
    const recipients = [
      {
        email: "user1@example.com",
        name: "User One",
        data: {
          applicant_name: "User One",
          vacancy_name: "Frontend Developer",
          application_link: "https://recruitment.company.com/application/1"
        }
      },
      {
        email: "user2@example.com",
        name: "User Two",
        data: {
          applicant_name: "User Two",
          vacancy_name: "Backend Developer",
          application_link: "https://recruitment.company.com/application/2"
        }
      }
    ];

    const result = await this.notificationService.sendBulkNotifications(
      "notification_applicant_apply",
      recipients
    );

    console.log("Bulk notifications result:", result);
  }

  /**
   * Contoh 6: Send email dengan template dari system configuration
   */
  async sendEmailWithSystemConfigTemplate() {
    const result = await this.systemConfigEmailService.sendEmailFromConfig(
      "notification_applicant_register",
      { email: "test@example.com", name: "Test User" },
      {
        applicant_name: "Test User",
        application_link: "https://recruitment.company.com/apply",
        company_name: "PT Neuronworks",
        company_website: "https://neuronworks.com"
      }
    );

    console.log("System config email sent:", result);
  }

  /**
   * Contoh 7: Get available templates
   */
  async getAvailableTemplates() {
    const templates = await this.notificationService.getAvailableTemplates();
    console.log("Available templates:", templates);
  }

  /**
   * Contoh 8: Validate template
   */
  async validateTemplate() {
    const isValid = await this.notificationService.validateTemplate(
      "notification_applicant_register"
    );
    console.log("Template is valid:", isValid);
  }

  /**
   * Contoh 9: Send email dengan multiple recipients
   */
  async sendToMultipleRecipients() {
    const recipients = [
      { email: "hr@company.com", name: "HR Team" },
      { email: "manager@company.com", name: "Hiring Manager" }
    ];

    const result = await this.notificationService.sendCustomNotification(
      "notification_applicant_apply",
      recipients,
      {
        applicant_name: "John Doe",
        vacancy_name: "Software Engineer",
        application_link: "https://recruitment.company.com/application/123"
      }
    );

    console.log("Multi-recipient email sent:", result);
  }

  /**
   * Contoh 10: Error handling dan fallback
   */
  async sendWithErrorHandling() {
    try {
      const result = await this.notificationService.sendCustomNotification(
        "non_existent_template",
        { email: "test@example.com", name: "Test User" },
        { test_data: "value" }
      );

      if (!result) {
        console.log("Template not found, using fallback method");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
}

/**
 * Contoh penggunaan di Controller
 */
export class ExampleController {
  constructor(private readonly notificationService: NotificationService) {}

  async handleApplicantRegistration(applicantData: any) {
    await this.notificationService.sendApplicantRegistrationNotification(
      applicantData.email,
      applicantData.fullName,
      `https://recruitment.company.com/apply?ref=${applicantData.id}`
    );

    return { message: "Registration notification sent" };
  }

  async handleApplicationSubmission(applicationData: any) {
    await this.notificationService.sendApplicantApplicationNotification(
      applicationData.applicantEmail,
      applicationData.applicantName,
      applicationData.vacancyName,
      `https://recruitment.company.com/application/${applicationData.id}`
    );

    return { message: "Application notification sent" };
  }

  async handleStatusUpdate(statusData: any) {
    await this.notificationService.sendApplicantStatusUpdateNotification(
      statusData.applicantEmail,
      statusData.applicantName,
      statusData.vacancyName,
      "https://recruitment.company.com/track"
    );

    return { message: "Status update notification sent" };
  }
}

/**
 * Contoh penggunaan di Service
 */
export class ExampleService {
  constructor(
    private readonly systemConfigEmailService: SystemConfigEmailService
  ) {}

  async processApplication(application: any) {
    const emailSent = await this.systemConfigEmailService.sendEmailFromConfig(
      "notification_applicant_apply",
      { email: application.applicantEmail, name: application.applicantName },
      {
        applicant_name: application.applicantName,
        vacancy_name: application.vacancyName,
        application_link: `https://recruitment.company.com/application/${application.id}`
      }
    );

    if (emailSent) {
      console.log("Application notification sent successfully");
    } else {
      console.log("Failed to send application notification");
    }

    return application;
  }
}
