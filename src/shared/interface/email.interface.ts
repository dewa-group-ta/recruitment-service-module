/**
 * Email configuration interface
 * Defines the structure for SMTP email configuration
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
}

/**
 * Email recipient interface
 * Defines the structure for email recipients
 */
export interface EmailRecipient {
  email: string;
  name?: string;
}

/**
 * Email attachment interface
 * Defines the structure for email attachments
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
  cid?: string;
}

/**
 * Email template data interface
 * Defines the structure for template variables
 */
export interface EmailTemplateData {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Email send options interface
 * Defines the structure for email sending options
 */
export interface EmailSendOptions {
  to: EmailRecipient | EmailRecipient[];
  cc?: EmailRecipient | EmailRecipient[];
  bcc?: EmailRecipient | EmailRecipient[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  priority?: "high" | "normal" | "low";
}

/**
 * Email template interface
 * Defines the structure for email templates
 */
export interface EmailTemplate {
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Email service interface
 * Defines the contract for email services
 */
export interface IEmailService {
  /**
   * Send email with the provided options
   * @param options Email send options
   * @returns Promise<boolean> Success status
   */
  sendEmail(options: EmailSendOptions): Promise<boolean>;

  /**
   * Send email using a template
   * @param templateName Template name
   * @param to Recipients
   * @param data Template data
   * @returns Promise<boolean> Success status
   */
  sendTemplateEmail(
    templateName: string,
    to: EmailRecipient | EmailRecipient[],
    data: EmailTemplateData
  ): Promise<boolean>;

  /**
   * Verify email configuration
   * @returns Promise<boolean> Configuration validity
   */
  verifyConnection(): Promise<boolean>;
}

/**
 * Email template provider interface
 * Defines the contract for email template providers
 */
export interface IEmailTemplateProvider {
  /**
   * Get email template by name
   * @param templateName Template name
   * @returns EmailTemplate or null if not found
   */
  getTemplate(templateName: string): Promise<EmailTemplate | null>;

  /**
   * Render template with data
   * @param template Template content
   * @param data Template data
   * @returns Rendered template
   */
  renderTemplate(template: string, data: EmailTemplateData): string;
}

/**
 * Injection token for email template provider
 */
export const EMAIL_TEMPLATE_PROVIDER = "EMAIL_TEMPLATE_PROVIDER";
