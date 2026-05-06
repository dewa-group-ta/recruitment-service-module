import { Injectable, Logger } from "@nestjs/common";
import { SystemConfigEmailService } from "./system-config-email.service";
import { EmailRecipient } from "../interface/email.interface";

/**
 * Notification service that handles various types of notifications
 * Integrates with system configuration email templates
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly systemConfigEmailService: SystemConfigEmailService
  ) {}

  /**
   * Send applicant registration notification
   * @param applicantEmail - Applicant email address
   * @param applicantName - Applicant name
   * @param applyLink - Link to apply for job
   * @returns Promise<boolean> Success status
   */
  async sendApplicantRegistrationNotification(
    applicantEmail: string,
    applicantName: string,
    applyLink: string
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Sending registration notification to: ${applicantEmail}`
      );

      const result =
        await this.systemConfigEmailService.sendApplicantRegistrationNotification(
          applicantEmail,
          applicantName,
          applyLink
        );

      if (result) {
        this.logger.log(
          `Registration notification sent successfully to: ${applicantEmail}`
        );
      } else {
        this.logger.error(
          `Failed to send registration notification to: ${applicantEmail}`
        );
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Error sending registration notification to ${applicantEmail}`,
        {
          error: errorMessage
        }
      );
      return false;
    }
  }

  /**
   * Send applicant application notification
   * @param applicantEmail - Applicant email address
   * @param applicantName - Applicant name
   * @param vacancyName - Vacancy name
   * @param applicationLink - Link to application
   * @returns Promise<boolean> Success status
   */
  async sendApplicantApplicationNotification(
    applicantEmail: string,
    applicantName: string,
    vacancyName: string,
    applicationLink: string
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Sending application notification to: ${applicantEmail} for vacancy: ${vacancyName}`
      );

      const result =
        await this.systemConfigEmailService.sendApplicantApplicationNotification(
          applicantEmail,
          applicantName,
          vacancyName,
          applicationLink
        );

      if (result) {
        this.logger.log(
          `Application notification sent successfully to: ${applicantEmail}`
        );
      } else {
        this.logger.error(
          `Failed to send application notification to: ${applicantEmail}`
        );
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Error sending application notification to ${applicantEmail}`,
        {
          error: errorMessage,
          vacancyName
        }
      );
      return false;
    }
  }

  /**
   * Send applicant status update notification
   * @param applicantEmail - Applicant email address
   * @param applicantName - Applicant name
   * @param vacancyName - Vacancy name
   * @param loginUrl - Login URL for tracking
   * @returns Promise<boolean> Success status
   */
  async sendApplicantStatusUpdateNotification(
    applicantEmail: string,
    applicantName: string,
    vacancyName: string,
    loginUrl: string
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Sending status update notification to: ${applicantEmail} for vacancy: ${vacancyName}`
      );

      const result =
        await this.systemConfigEmailService.sendApplicantStatusUpdateNotification(
          applicantEmail,
          applicantName,
          vacancyName,
          loginUrl
        );

      if (result) {
        this.logger.log(
          `Status update notification sent successfully to: ${applicantEmail}`
        );
      } else {
        this.logger.error(
          `Failed to send status update notification to: ${applicantEmail}`
        );
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Error sending status update notification to ${applicantEmail}`,
        {
          error: errorMessage,
          vacancyName
        }
      );
      return false;
    }
  }

  /**
   * Send custom notification using system configuration template
   * @param configKey - System configuration key for the template
   * @param to - Email recipients
   * @param templateData - Data to replace placeholders in template
   * @returns Promise<boolean> Success status
   */
  async sendCustomNotification(
    configKey: string,
    to: EmailRecipient | EmailRecipient[],
    templateData: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      this.logger.log(`Sending custom notification using config: ${configKey}`);

      const result = await this.systemConfigEmailService.sendEmailFromConfig(
        configKey,
        to,
        templateData
      );

      if (result) {
        this.logger.log(
          `Custom notification sent successfully using config: ${configKey}`
        );
      } else {
        this.logger.error(
          `Failed to send custom notification using config: ${configKey}`
        );
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Error sending custom notification using config: ${configKey}`,
        {
          error: errorMessage,
          to: Array.isArray(to) ? to.map((t) => t.email) : to.email
        }
      );
      return false;
    }
  }

  /**
   * Send bulk notifications
   * @param configKey - System configuration key for the template
   * @param recipients - List of recipients with their data
   * @returns Promise<{success: number, failed: number}> Success and failure counts
   */
  async sendBulkNotifications(
    configKey: string,
    recipients: Array<{
      email: string;
      name?: string;
      data: Record<string, any>;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    this.logger.log(
      `Sending bulk notifications to ${recipients.length} recipients using config: ${configKey}`
    );

    for (const recipient of recipients) {
      try {
        const result = await this.sendCustomNotification(
          configKey,
          { email: recipient.email, name: recipient.name },
          recipient.data
        );

        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        this.logger.error(
          `Error sending notification to ${recipient.email}`,
          error
        );
        failed++;
      }
    }

    this.logger.log(
      `Bulk notification completed: ${success} success, ${failed} failed`
    );

    return { success, failed };
  }

  /**
   * Get available notification templates
   * @returns List of available template config keys
   */
  async getAvailableTemplates(): Promise<string[]> {
    try {
      return await this.systemConfigEmailService.getAvailableTemplates();
    } catch (error) {
      this.logger.error("Failed to get available templates", error);
      return [];
    }
  }

  /**
   * Validate notification template
   * @param configKey - Configuration key to validate
   * @returns Promise<boolean> Whether template is valid
   */
  async validateTemplate(configKey: string): Promise<boolean> {
    try {
      return await this.systemConfigEmailService.validateTemplate(configKey);
    } catch (error) {
      this.logger.error(`Failed to validate template: ${configKey}`, error);
      return false;
    }
  }
}
