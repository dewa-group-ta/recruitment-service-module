import { Injectable, Logger } from "@nestjs/common";
import {
  EmailTemplate,
  EmailTemplateData,
  IEmailTemplateProvider
} from "../interface/email.interface";
import { EmailTemplateName } from "../enums/email.enum";
import { SystemConfigurationService } from "../../modules/system-configurations/services/system-configuration.service";

/**
 * Email template provider implementation
 * Handles email template management and rendering
 */
@Injectable()
export class EmailTemplateService implements IEmailTemplateProvider {
  private readonly logger = new Logger(EmailTemplateService.name);
  private readonly templates: Map<string, EmailTemplate> = new Map();

  constructor(
    private readonly systemConfigService?: SystemConfigurationService
  ) {
    this.initializeTemplates();
  }

  /**
   * Initialize default email templates
   * @private
   */
  private initializeTemplates(): void {
    // Application received template
    this.templates.set(EmailTemplateName.APPLICATION_RECEIVED, {
      subject: "Application Received - {{jobTitle}}",
      text: `Dear {{applicantName}},

Thank you for your interest in the {{jobTitle}} position.

To proceed with your application, please access the link below and complete the required information: {{applicationLink}}

Best regards,
Recruitment Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Application Received</h2>
          <p>Dear <strong>{{applicantName}}</strong>,</p>
          <p>Thank you for your interest in the <strong>{{jobTitle}}</strong> position.</p>
          <p>To proceed with your application, please access the link below and complete the required information: <a href="{{applicationLink}}" style="color: #007bff; text-decoration: none;">Access Application</a></p>
          <p>Best regards,<br>Recruitment Team</p>
        </div>
      `
    });

    // Application status update template
    this.templates.set(EmailTemplateName.APPLICATION_STATUS_UPDATE, {
      subject: "Application Status Update - {{jobTitle}}",
      text: `Dear {{applicantName}},

Your application for the {{jobTitle}} position has been updated to: {{status}}

We will continue to keep you informed about any further updates.

Best regards,
Recruitment Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Application Status Update</h2>
          <p>Dear <strong>{{applicantName}}</strong>,</p>
          <p>Your application for the <strong>{{jobTitle}}</strong> position has been updated to: <strong>{{status}}</strong></p>
          <p>We will continue to keep you informed about any further updates.</p>
          <p>Best regards,<br>Recruitment Team</p>
        </div>
      `
    });

    // Interview invitation template
    this.templates.set(EmailTemplateName.INTERVIEW_INVITATION, {
      subject: "Interview Invitation - {{jobTitle}}",
      text: `Dear {{applicantName}},

Congratulations! We would like to invite you for an interview for the {{jobTitle}} position.

Interview Details:
- Date: {{interviewDate}}
- Location: {{interviewLocation}}

Please confirm your attendance by replying to this email.

Best regards,
Recruitment Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Interview Invitation</h2>
          <p>Dear <strong>{{applicantName}}</strong>,</p>
          <p>Congratulations! We would like to invite you for an interview for the <strong>{{jobTitle}}</strong> position.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Interview Details:</h3>
            <p><strong>Date:</strong> {{interviewDate}}</p>
            <p><strong>Location:</strong> {{interviewLocation}}</p>
          </div>
          <p>Please confirm your attendance by replying to this email.</p>
          <p>Best regards,<br>Recruitment Team</p>
        </div>
      `
    });

    // Application rejected template
    this.templates.set(EmailTemplateName.APPLICATION_REJECTED, {
      subject: "Application Update - {{jobTitle}}",
      text: `Dear {{applicantName}},

Thank you for your interest in the {{jobTitle}} position. After careful consideration, we have decided to move forward with other candidates.

We encourage you to apply for other positions that match your qualifications.

Best regards,
Recruitment Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Application Update</h2>
          <p>Dear <strong>{{applicantName}}</strong>,</p>
          <p>Thank you for your interest in the <strong>{{jobTitle}}</strong> position. After careful consideration, we have decided to move forward with other candidates.</p>
          <p>We encourage you to apply for other positions that match your qualifications.</p>
          <p>Best regards,<br>Recruitment Team</p>
        </div>
      `
    });

    // Application accepted template
    this.templates.set(EmailTemplateName.APPLICATION_ACCEPTED, {
      subject: "Congratulations! - {{jobTitle}}",
      text: `Dear {{applicantName}},

Congratulations! We are pleased to offer you the {{jobTitle}} position.

We will be in touch soon with the next steps and offer details.

Welcome to the team!

Best regards,
Recruitment Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Congratulations!</h2>
          <p>Dear <strong>{{applicantName}}</strong>,</p>
          <p>Congratulations! We are pleased to offer you the <strong>{{jobTitle}}</strong> position.</p>
          <p>We will be in touch soon with the next steps and offer details.</p>
          <p style="color: #28a745; font-weight: bold;">Welcome to the team!</p>
          <p>Best regards,<br>Recruitment Team</p>
        </div>
      `
    });

    this.logger.log(`Initialized ${this.templates.size} email templates`);
  }

  /**
   * Get email template by name
   * @param templateName Template name
   * @returns EmailTemplate or null if not found
   */
  async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    // First try to get from system configuration
    if (this.systemConfigService) {
      try {
        const systemTemplate =
          await this.getTemplateFromSystemConfig(templateName);
        if (systemTemplate) {
          return systemTemplate;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to get template from system config: ${templateName}`,
          error
        );
      }
    }

    // Fallback to default templates
    const template = this.templates.get(templateName);

    if (!template) {
      this.logger.warn(`Template not found: ${templateName}`);
      return null;
    }

    return template;
  }

  /**
   * Get template from system configuration
   * @param templateName Template name
   * @returns EmailTemplate or null if not found
   * @private
   */
  private async getTemplateFromSystemConfig(
    templateName: string
  ): Promise<EmailTemplate | null> {
    if (!this.systemConfigService) {
      return null;
    }

    try {
      const templateConfig =
        await this.systemConfigService.getJsonValue(templateName);

      if (!templateConfig?.subject || !templateConfig?.body) {
        return null;
      }

      return {
        subject: templateConfig.subject,
        html: templateConfig.body,
        text: this.stripHtml(templateConfig.body)
      };
    } catch (error) {
      this.logger.error(
        `Error getting template from system config: ${templateName}`,
        error
      );
      return null;
    }
  }

  /**
   * Render template with data
   * @param template Template content
   * @param data Template data
   * @returns Rendered template
   */
  renderTemplate(template: string, data: EmailTemplateData): string {
    try {
      let rendered = template;

      // Replace template variables with actual data
      Object.keys(data).forEach((key) => {
        const placeholder = `{{${key}}}`;
        const value = data[key] || "";
        rendered = rendered.replace(
          new RegExp(placeholder, "g"),
          String(value)
        );
      });

      return rendered;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to render template", {
        error: errorMessage,
        template: template.substring(0, 100),
        data
      });
      return template;
    }
  }

  /**
   * Add or update a template
   * @param templateName Template name
   * @param template Template content
   */
  addTemplate(templateName: string, template: EmailTemplate): void {
    this.templates.set(templateName, template);
    this.logger.log(`Template added/updated: ${templateName}`);
  }

  /**
   * Remove a template
   * @param templateName Template name
   */
  removeTemplate(templateName: string): void {
    this.templates.delete(templateName);
    this.logger.log(`Template removed: ${templateName}`);
  }

  /**
   * Get all available template names
   * @returns Array of template names
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if template exists
   * @param templateName Template name
   * @returns True if template exists
   */
  async hasTemplate(templateName: string): Promise<boolean> {
    // Check system configuration first
    if (this.systemConfigService) {
      try {
        const systemTemplate =
          await this.getTemplateFromSystemConfig(templateName);
        if (systemTemplate) {
          return true;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to check template in system config: ${templateName}`,
          error
        );
      }
    }

    // Fallback to default templates
    return this.templates.has(templateName);
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
}
