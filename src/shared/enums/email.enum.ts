export enum EmailTemplateName {
  // template terkait registrasi
  REGISTRATION_SUCCESS = "registration_success",

  // template terkait aplikasi
  APPLICATION_RECEIVED = "application_received",
  QUICK_APPLY_CONFIRMATION = "quick_apply_confirmation",
  APPLICATION_STATUS_UPDATE = "application_status_update",
  APPLICATION_REJECTED = "application_rejected",
  APPLICATION_ACCEPTED = "application_accepted",

  // template terkait interview
  INTERVIEW_INVITATION = "interview_invitation",
  INTERVIEW_REMINDER = "interview_reminder",
  INTERVIEW_CANCELLED = "interview_cancelled",

  // template terkait job posting
  JOB_POSTING_CREATED = "job_posting_created",
  JOB_POSTING_UPDATED = "job_posting_updated",
  JOB_POSTING_CLOSED = "job_posting_closed",

  // template terkait sistem
  WELCOME = "welcome",
  PASSWORD_RESET = "password_reset",
  ACCOUNT_ACTIVATION = "account_activation",
  NOTIFICATION = "notification"
}

export enum EmailPriority {
  HIGH = "high",
  NORMAL = "normal",
  LOW = "low"
}

export enum EmailStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  DELIVERED = "delivered",
  BOUNCED = "bounced"
}
