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

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
  cid?: string;
}

export interface EmailTemplateData {
  [key: string]: string | number | boolean | undefined;
}

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

export interface EmailTemplate {
  subject: string;
  text?: string;
  html?: string;
}

export interface IEmailService {
  sendEmail(options: EmailSendOptions): Promise<boolean>;

  sendTemplateEmail(
    templateName: string,
    to: EmailRecipient | EmailRecipient[],
    data: EmailTemplateData
  ): Promise<boolean>;

  verifyConnection(): Promise<boolean>;
}

export interface IEmailTemplateProvider {
  getTemplate(templateName: string): Promise<EmailTemplate | null>;

  renderTemplate(template: string, data: EmailTemplateData): string;
}

export const EMAIL_TEMPLATE_PROVIDER = "EMAIL_TEMPLATE_PROVIDER";
