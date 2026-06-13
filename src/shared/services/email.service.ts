import { Injectable, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";
import {
  EmailConfig,
  EmailSendOptions,
  EmailRecipient,
  EmailTemplateData,
  IEmailService,
  IEmailTemplateProvider,
  EMAIL_TEMPLATE_PROVIDER
} from "../interface/email.interface";
import { EmailTemplateName } from "../enums/email.enum";

/**
 * Email service implementation using Nodemailer
 * Handles SMTP email sending functionality
 */
@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: Transporter;
  private config!: EmailConfig;

  constructor(
    private readonly configService: ConfigService,
    @Inject(EMAIL_TEMPLATE_PROVIDER)
    private readonly templateProvider: IEmailTemplateProvider
  ) {
    this.initializeTransporter();
  }

  /**
   * Initialize the SMTP transporter
   * @private
   */
  private initializeTransporter(): void {
    try {
      const smtpUser = this.configService.get<string>("SMTP_USER");
      const smtpPass = this.configService.get<string>("SMTP_PASS");
      const smtpFromEmail = this.configService.get<string>("SMTP_FROM_EMAIL");

      if (!smtpUser || !smtpPass || !smtpFromEmail) {
        throw new Error(
          "Missing required SMTP configuration: SMTP_USER, SMTP_PASS, and SMTP_FROM_EMAIL must be provided"
        );
      }

      this.config = {
        host: this.configService.get<string>("SMTP_HOST", "localhost"),
        port: this.configService.get<number>("SMTP_PORT", 587),
        secure: this.configService.get<boolean>("SMTP_SECURE", false),
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        from: {
          name: this.configService.get<string>(
            "SMTP_FROM_NAME",
            "Recruitment System"
          ),
          address: smtpFromEmail
        }
      };

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth
      });

      this.logger.log("Email service initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize email service", error);
      throw error;
    }
  }

  /**
   * Send email with the provided options
   * @param options Email send options
   * @returns Promise<boolean> Success status
   */
  async sendEmail(options: EmailSendOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `${this.config.from.name} <${this.config.from.address}>`,
        to: this.formatRecipients(options.to),
        cc: options.cc ? this.formatRecipients(options.cc) : undefined,
        bcc: options.bcc ? this.formatRecipients(options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        replyTo: options.replyTo,
        priority: options.priority || "normal"
      };

      const result = (await this.transporter.sendMail(mailOptions)) as {
        messageId: string;
      };

      this.logger.log(`Email sent successfully to ${mailOptions.to}`, {
        messageId: result.messageId,
        subject: options.subject
      });

      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to send email", {
        error: errorMessage,
        to: options.to,
        subject: options.subject
      });
      return false;
    }
  }

  /**
   * Send email using a template
   * @param templateName Template name
   * @param to Recipients
   * @param data Template data
   * @returns Promise<boolean> Success status
   */
  async sendTemplateEmail(
    templateName: string,
    to: EmailRecipient | EmailRecipient[],
    data: EmailTemplateData
  ): Promise<boolean> {
    try {
      const template = await this.templateProvider.getTemplate(templateName);

      if (!template) {
        this.logger.error(`Template not found: ${templateName}`);
        return false;
      }

      const renderedSubject = this.templateProvider.renderTemplate(
        template.subject,
        data
      );
      const renderedText = template.text
        ? this.templateProvider.renderTemplate(template.text, data)
        : undefined;
      const renderedHtml = template.html
        ? this.templateProvider.renderTemplate(template.html, data)
        : undefined;

      const options: EmailSendOptions = {
        to,
        subject: renderedSubject,
        text: renderedText,
        html: renderedHtml
      };

      return await this.sendEmail(options);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to send template email: ${templateName}`, {
        error: errorMessage,
        to,
        data
      });
      return false;
    }
  }

  /**
   * Verify email configuration
   * @returns Promise<boolean> Configuration validity
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log("Email configuration verified successfully");
      return true;
    } catch (error) {
      this.logger.error("Email configuration verification failed", error);
      return false;
    }
  }

  /**
   * Format recipients for nodemailer
   * @param recipients Email recipients
   * @returns Formatted recipient string
   * @private
   */
  private formatRecipients(
    recipients: EmailRecipient | EmailRecipient[]
  ): string {
    if (Array.isArray(recipients)) {
      return recipients
        .map((recipient) =>
          recipient.name
            ? `${recipient.name} <${recipient.email}>`
            : recipient.email
        )
        .join(", ");
    }

    return recipients.name
      ? `${recipients.name} <${recipients.email}>`
      : recipients.email;
  }

  /**
   * Send application received email
   * @param applicantEmail Applicant email
   * @param applicantName Applicant name
   * @param jobTitle Job title
   * @returns Promise<boolean> Success status
   */
  async sendApplicationReceivedEmail(
    applicantEmail: string,
    applicantName: string,
    jobTitle: string,
    applicationLink: string
  ): Promise<boolean> {
    return this.sendTemplateEmail(
      EmailTemplateName.APPLICATION_RECEIVED,
      { email: applicantEmail, name: applicantName },
      { applicantName, jobTitle, applicationLink }
    );
  }

  async sendQuickApplyConfirmationEmail(
    applicantEmail: string,
    applicantName: string,
    jobTitle: string,
    registrationCode: string,
    trackingLink: string
  ): Promise<boolean> {
    return this.sendTemplateEmail(
      EmailTemplateName.QUICK_APPLY_CONFIRMATION,
      { email: applicantEmail, name: applicantName },
      { applicantName, jobTitle, registrationCode, trackingLink }
    );
  }

  /**
   * Send application status update email
   * @param applicantEmail Applicant email
   * @param applicantName Applicant name
   * @param jobTitle Job title
   * @param status New status
   * @returns Promise<boolean> Success status
   */
  async sendApplicationStatusUpdateEmail(
    applicantEmail: string,
    applicantName: string,
    jobTitle: string,
    status: string
  ): Promise<boolean> {
    return this.sendTemplateEmail(
      EmailTemplateName.APPLICATION_STATUS_UPDATE,
      { email: applicantEmail, name: applicantName },
      { applicantName, jobTitle, status }
    );
  }

  /**
   * Send interview invitation email
   * @param applicantEmail Applicant email
   * @param applicantName Applicant name
   * @param jobTitle Job title
   * @param interviewDate Interview date
   * @param interviewLocation Interview location
   * @returns Promise<boolean> Success status
   */
  async sendInterviewInvitationEmail(
    applicantEmail: string,
    applicantName: string,
    jobTitle: string,
    interviewDate: string,
    interviewLocation: string
  ): Promise<boolean> {
    return this.sendTemplateEmail(
      EmailTemplateName.INTERVIEW_INVITATION,
      { email: applicantEmail, name: applicantName },
      { applicantName, jobTitle, interviewDate, interviewLocation }
    );
  }
}
