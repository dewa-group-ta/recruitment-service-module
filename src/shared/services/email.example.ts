/**
 * contoh penggunaan EmailService (tidak dipakai oleh kode aplikasi, referensi saja).
 */

import { Injectable, Logger } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailTemplateName } from "../enums/email.enum";

@Injectable()
export class EmailExampleService {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Example: Send a simple email
   */
  async sendSimpleEmail(): Promise<void> {
    const success = await this.emailService.sendEmail({
      to: { email: "applicant@example.com", name: "John Doe" },
      subject: "Welcome to Our Recruitment System",
      text: "Thank you for registering with our recruitment system.",
      html: "<h1>Welcome!</h1><p>Thank you for registering with our recruitment system.</p>"
    });

    if (success) {
      Logger.log("Email sent successfully");
    } else {
      Logger.log("Failed to send email");
    }
  }

  /**
   * Example: Send email to multiple recipients
   */
  async sendEmailToMultipleRecipients(): Promise<void> {
    const success = await this.emailService.sendEmail({
      to: [
        { email: "applicant1@example.com", name: "John Doe" },
        { email: "applicant2@example.com", name: "Jane Smith" }
      ],
      cc: { email: "hr@company.com", name: "HR Team" },
      subject: "Interview Schedule Update",
      html: "<p>Your interview has been scheduled for tomorrow at 2 PM.</p>"
    });

    Logger.log("Multiple recipients email sent:", success);
  }

  /**
   * Example: Send email with attachments
   */
  async sendEmailWithAttachments(): Promise<void> {
    const success = await this.emailService.sendEmail({
      to: { email: "applicant@example.com", name: "John Doe" },
      subject: "Interview Documents",
      text: "Please find attached the interview documents.",
      attachments: [
        {
          filename: "interview-guidelines.pdf",
          content: Buffer.from("PDF content here"), // di penggunaan nyata, baca dari file
          contentType: "application/pdf"
        },
        {
          filename: "company-profile.pdf",
          content: Buffer.from("Company profile content"), // di penggunaan nyata, baca dari file
          contentType: "application/pdf"
        }
      ]
    });

    Logger.log("Email with attachments sent:", success);
  }

  /**
   * Example: Send template email
   */
  async sendTemplateEmail(): Promise<void> {
    const success = await this.emailService.sendTemplateEmail(
      EmailTemplateName.APPLICATION_RECEIVED,
      { email: "applicant@example.com", name: "John Doe" },
      {
        applicantName: "John Doe",
        jobTitle: "Senior Software Engineer"
      }
    );

    Logger.log("Template email sent:", success);
  }

  /**
   * Example: Send application received email
   */
  async sendApplicationReceivedEmail(): Promise<void> {
    const success = await this.emailService.sendApplicationReceivedEmail(
      "applicant@example.com",
      "John Doe",
      "Senior Software Engineer",
      "https://example.com/application/123456"
    );

    Logger.log("Application received email sent:", success);
  }

  /**
   * Example: Send application status update email
   */
  async sendApplicationStatusUpdateEmail(): Promise<void> {
    const success = await this.emailService.sendApplicationStatusUpdateEmail(
      "applicant@example.com",
      "John Doe",
      "Senior Software Engineer",
      "Under Review"
    );

    Logger.log("Status update email sent:", success);
  }

  /**
   * Example: Send interview invitation email
   */
  async sendInterviewInvitationEmail(): Promise<void> {
    const success = await this.emailService.sendInterviewInvitationEmail(
      "applicant@example.com",
      "John Doe",
      "Senior Software Engineer",
      "2024-01-15 at 2:00 PM",
      "Office Building A, Room 101"
    );

    Logger.log("Interview invitation email sent:", success);
  }

  /**
   * Example: Verify email configuration
   */
  async verifyEmailConfiguration(): Promise<void> {
    const isValid = await this.emailService.verifyConnection();

    if (isValid) {
      Logger.log("Email configuration is valid");
    } else {
      Logger.log("Email configuration is invalid");
    }
  }
}

/**
 * Usage in a Controller Example:
 *
 * @Controller('applications')
 * export class ApplicationController {
 *   constructor(private readonly emailService: EmailService) {}
 *
 *   @Post()
 *   async createApplication(@Body() createApplicationDto: CreateApplicationDto) {
 *     // Create application logic here...
 *
 *     // Send confirmation email
 *     await this.emailService.sendApplicationReceivedEmail(
 *       createApplicationDto.email,
 *       createApplicationDto.name,
 *       createApplicationDto.jobTitle,
 *     );
 *
 *     return { message: 'Application created successfully' };
 *   }
 * }
 */

/**
 * Environment Variables Required:
 *
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=587
 * SMTP_SECURE=false
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASS=your-app-password
 * SMTP_FROM_NAME=Recruitment System
 * SMTP_FROM_EMAIL=noreply@yourcompany.com
 */
