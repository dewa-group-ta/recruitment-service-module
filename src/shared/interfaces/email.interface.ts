/**
 * Interface for email service operations
 * Defines the contract for email-related business logic
 */
export interface IEmailService {
  /**
   * Send email to recipient
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param body - Email body (HTML or plain text)
   * @param isHtml - Whether the body is HTML format
   * @returns Promise<boolean> - Success status
   * @throws BadRequestException - When email configuration is invalid
   */
  sendEmail(
    to: string,
    subject: string,
    body: string,
    isHtml?: boolean
  ): Promise<boolean>;

  /**
   * Send email using template
   * @param to - Recipient email address
   * @param templateName - Template name
   * @param templateData - Data to populate template
   * @returns Promise<boolean> - Success status
   * @throws NotFoundException - When template not found
   * @throws BadRequestException - When template data is invalid
   */
  sendTemplateEmail(
    to: string,
    templateName: string,
    templateData: Record<string, unknown>
  ): Promise<boolean>;

  /**
   * Send bulk emails
   * @param recipients - Array of recipient email addresses
   * @param subject - Email subject
   * @param body - Email body
   * @param isHtml - Whether the body is HTML format
   * @returns Promise<{success: number, failed: number}> - Sending results
   */
  sendBulkEmail(
    recipients: string[],
    subject: string,
    body: string,
    isHtml?: boolean
  ): Promise<{ success: number; failed: number }>;

  /**
   * Validate email address format
   * @param email - Email address to validate
   * @returns boolean - Whether email is valid
   */
  validateEmail(email: string): boolean;

  /**
   * Test email configuration
   * @returns Promise<boolean> - Whether email service is properly configured
   */
  testConnection(): Promise<boolean>;
}

/**
 * Interface for email template provider
 * Defines the contract for email template management
 */
export interface IEmailTemplateProvider {
  /**
   * Get template by name
   * @param templateName - Template name
   * @returns Promise<string | null> - Template content or null if not found
   */
  getTemplate(templateName: string): Promise<string | null>;

  /**
   * Render template with data
   * @param templateName - Template name
   * @param data - Data to populate template
   * @returns Promise<string> - Rendered template
   * @throws NotFoundException - When template not found
   * @throws BadRequestException - When template rendering fails
   */
  renderTemplate(
    templateName: string,
    data: Record<string, unknown>
  ): Promise<string>;

  /**
   * Get all available templates
   * @returns Promise<string[]> - Array of template names
   */
  getAvailableTemplates(): Promise<string[]>;

  /**
   * Validate template syntax
   * @param templateName - Template name
   * @returns Promise<boolean> - Whether template is valid
   */
  validateTemplate(templateName: string): Promise<boolean>;

  /**
   * Create or update template
   * @param templateName - Template name
   * @param content - Template content
   * @returns Promise<boolean> - Success status
   */
  saveTemplate(templateName: string, content: string): Promise<boolean>;

  /**
   * Delete template
   * @param templateName - Template name
   * @returns Promise<boolean> - Success status
   */
  deleteTemplate(templateName: string): Promise<boolean>;
}

/**
 * Interface for notification service operations
 * Defines the contract for notification-related business logic
 */
export interface INotificationService {
  /**
   * Send notification to user
   * @param userId - User ID
   * @param type - Notification type
   * @param data - Notification data
   * @returns Promise<boolean> - Success status
   */
  sendNotification(
    userId: string,
    type: string,
    data: Record<string, unknown>
  ): Promise<boolean>;

  /**
   * Send email notification
   * @param email - Recipient email
   * @param templateName - Email template name
   * @param data - Template data
   * @returns Promise<boolean> - Success status
   */
  sendEmailNotification(
    email: string,
    templateName: string,
    data: Record<string, unknown>
  ): Promise<boolean>;

  /**
   * Send SMS notification
   * @param phoneNumber - Recipient phone number
   * @param message - SMS message
   * @returns Promise<boolean> - Success status
   */
  sendSmsNotification(phoneNumber: string, message: string): Promise<boolean>;

  /**
   * Get notification history for user
   * @param userId - User ID
   * @param limit - Number of notifications to retrieve
   * @returns Promise<Array<{type: string, data: Record<string, unknown>, sentAt: Date}>> - Notification history
   */
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

/**
 * Email template types enum
 */
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

/**
 * Notification types enum
 */
export enum NotificationType {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
  IN_APP = "in_app"
}
