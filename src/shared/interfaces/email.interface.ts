export interface IEmailService {
  sendEmail(
    to: string,
    subject: string,
    body: string,
    isHtml?: boolean
  ): Promise<boolean>;

  sendTemplateEmail(
    to: string,
    templateName: string,
    templateData: Record<string, unknown>
  ): Promise<boolean>;

  sendBulkEmail(
    recipients: string[],
    subject: string,
    body: string,
    isHtml?: boolean
  ): Promise<{ success: number; failed: number }>;

  validateEmail(email: string): boolean;

  testConnection(): Promise<boolean>;
}

export interface IEmailTemplateProvider {
  getTemplate(templateName: string): Promise<string | null>;

  renderTemplate(
    templateName: string,
    data: Record<string, unknown>
  ): Promise<string>;

  getAvailableTemplates(): Promise<string[]>;

  validateTemplate(templateName: string): Promise<boolean>;

  saveTemplate(templateName: string, content: string): Promise<boolean>;

  deleteTemplate(templateName: string): Promise<boolean>;
}

export interface INotificationService {
  sendNotification(
    userId: string,
    type: string,
    data: Record<string, unknown>
  ): Promise<boolean>;

  sendEmailNotification(
    email: string,
    templateName: string,
    data: Record<string, unknown>
  ): Promise<boolean>;

  sendSmsNotification(phoneNumber: string, message: string): Promise<boolean>;

  getNotificationHistory(
    userId: string,
    limit?: number
  ): Promise<
    Array<{
      type: string;
      data: Record<string, unknown>;
      sentAt: Date;
    }>
  >;
}

export enum EmailTemplateType {
  WELCOME = "welcome",
  APPLICATION_RECEIVED = "application_received",
  APPLICATION_STATUS_UPDATE = "application_status_update",
  INTERVIEW_INVITATION = "interview_invitation",
  JOB_OFFER = "job_offer",
  REJECTION = "rejection",
  PASSWORD_RESET = "password_reset",
  EMAIL_VERIFICATION = "email_verification"
}

export enum NotificationType {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
  IN_APP = "in_app"
}
