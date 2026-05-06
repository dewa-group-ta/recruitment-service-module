import { Injectable, Logger } from "@nestjs/common";
import { SystemConfigurationService } from "../../modules/system-configurations/services/system-configuration.service";
import { EmailService } from "./email.service";
import {
  EmailRecipient,
  EmailTemplateData
} from "../interface/email.interface";

/**
 * Email service that uses templates from system configuration
 * Integrates system configuration with email sending functionality
 */
@Injectable()
export class SystemConfigEmailService {
  private readonly logger = new Logger(SystemConfigEmailService.name);

  constructor(
    private readonly systemConfigService: SystemConfigurationService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Send email using template from system configuration
   * @param configKey - System configuration key for the email template
   * @param to - Email recipients
   * @param templateData - Data to replace placeholders in template
   * @returns Promise<boolean> Success status
   */
  async sendEmailFromConfig(
    configKey: string,
    to: EmailRecipient | EmailRecipient[],
    templateData: EmailTemplateData = {}
  ): Promise<boolean> {
    try {
      // Get template from system configuration
      const templateConfig =
        await this.systemConfigService.getJsonValue(configKey);

      if (!templateConfig) {
        this.logger.error(
          `Email template configuration not found: ${configKey}`
        );
        return false;
      }

      // Get company information for template data
      const companyData = await this.getCompanyTemplateData();

      // Merge template data with company data
      const mergedData = { ...companyData, ...templateData };

      // Render subject and body templates
      const subject = this.renderTemplate(templateConfig.subject, mergedData);
      const body = this.renderTemplate(templateConfig.body, mergedData);

      // Send email
      const result = await this.emailService.sendEmail({
        to,
        subject,
        html: body,
        text: this.stripHtml(body)
      });

      if (result) {
        this.logger.log(`Email sent successfully using config: ${configKey}`, {
          to: Array.isArray(to) ? to.map((t) => t.email) : to.email,
          subject
        });
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to send email from config: ${configKey}`, {
        error: errorMessage,
        to: Array.isArray(to) ? to.map((t) => t.email) : to.email
      });
      return false;
    }
  }

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
    return this.sendEmailFromConfig(
      "notification_applicant_register",
      { email: applicantEmail, name: applicantName },
      {
        applicant_name: applicantName,
        application_link: applyLink
      }
    );
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
    return this.sendEmailFromConfig(
      "notification_applicant_apply",
      { email: applicantEmail, name: applicantName },
      {
        applicant_name: applicantName,
        vacancy_name: vacancyName,
        application_link: applicationLink
      }
    );
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
    return this.sendEmailFromConfig(
      "notification_applicant_status_update",
      { email: applicantEmail, name: applicantName },
      {
        applicant_name: applicantName,
        vacancy_name: vacancyName,
        application_link: loginUrl
      }
    );
  }

  /**
   * Get company information for template data
   * @private
   */
  private async getCompanyTemplateData(): Promise<EmailTemplateData> {
    try {
      const companyName = await this.systemConfigService.getValueOrDefault(
        "company_name",
        "Company"
      );
      const companyWebsite = await this.systemConfigService.getValueOrDefault(
        "social_website",
        ""
      );

      // Parse website URL from JSON if it exists
      let websiteUrl = "";
      if (companyWebsite) {
        try {
          const websiteConfig = JSON.parse(companyWebsite);
          websiteUrl = websiteConfig.url || "";
        } catch {
          websiteUrl = companyWebsite;
        }
      }

      return {
        company_name: companyName,
        company_website: websiteUrl
      };
    } catch (error) {
      this.logger.warn(
        "Failed to get company template data, using defaults",
        error
      );
      return {
        company_name: "Company",
        company_website: ""
      };
    }
  }

  /**
   * Render template with data
   * @param template - Template string with placeholders
   * @param data - Data to replace placeholders
   * @returns Rendered template
   * @private
   */
  private renderTemplate(template: string, data: EmailTemplateData): string {
    let rendered = template;

    // Replace placeholders in format {{key}}
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      rendered = rendered.replace(placeholder, String(value || ""));
    }

    return rendered;
  }

  /**
   * Strip HTML tags from text
   * @param html - HTML string
   * @returns Plain text
   * @private
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Get available email template configurations
   * @returns List of available template config keys
   */
  async getAvailableTemplates(): Promise<string[]> {
    try {
      const templates =
        await this.systemConfigService.findByGroup("notifications");
      return templates.map((template) => template.configKey);
    } catch (error) {
      this.logger.error("Failed to get available templates", error);
      return [];
    }
  }

  /**
   * Validate email template configuration
   * @param configKey - Configuration key to validate
   * @returns Promise<boolean> Whether template is valid
   */
  async validateTemplate(configKey: string): Promise<boolean> {
    try {
      const templateConfig =
        await this.systemConfigService.getJsonValue(configKey);

      if (!templateConfig) {
        return false;
      }

      // Check if required fields exist
      return !!(templateConfig.subject && templateConfig.body);
    } catch (error) {
      this.logger.error(`Failed to validate template: ${configKey}`, error);
      return false;
    }
  }
}
