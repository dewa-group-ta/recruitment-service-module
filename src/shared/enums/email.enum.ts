/**
 * Email template names enum
 * Defines available email templates in the system
 */
export enum EmailTemplateName {
  // Registration related templates
  REGISTRATION_SUCCESS = "registration_success",

  // Application related templates
  APPLICATION_RECEIVED = "application_received",
  APPLICATION_STATUS_UPDATE = "application_status_update",
  APPLICATION_REJECTED = "application_rejected",
  APPLICATION_ACCEPTED = "application_accepted",

  // Interview related templates
  INTERVIEW_INVITATION = "interview_invitation",
  INTERVIEW_REMINDER = "interview_reminder",
  INTERVIEW_CANCELLED = "interview_cancelled",

  // Job posting related templates
  JOB_POSTING_CREATED = "job_posting_created",
  JOB_POSTING_UPDATED = "job_posting_updated",
  JOB_POSTING_CLOSED = "job_posting_closed",

  // System related templates
  WELCOME = "welcome",
  PASSWORD_RESET = "password_reset",
  ACCOUNT_ACTIVATION = "account_activation",
  NOTIFICATION = "notification"
}

/**
 * Email priority levels enum
 * Defines email priority levels
 */
export enum EmailPriority {
  HIGH = "high",
  NORMAL = "normal",
  LOW = "low"
}

/**
 * Email status enum
 * Defines email sending status
 */
export enum EmailStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  DELIVERED = "delivered",
  BOUNCED = "bounced"
}
