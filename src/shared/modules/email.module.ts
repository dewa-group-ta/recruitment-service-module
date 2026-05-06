import { Module } from "@nestjs/common";
import { EmailService } from "../services/email.service";
import { EmailTemplateService } from "../services/email-template.service";
import { SystemConfigEmailService } from "../services/system-config-email.service";
import { NotificationService } from "../services/notification.service";
import { EMAIL_TEMPLATE_PROVIDER } from "../interface/email.interface";
import { SystemConfigurationModule } from "../../modules/system-configurations/system-configuration.module";

/**
 * Email module
 * Provides email functionality for the application
 */
@Module({
  imports: [SystemConfigurationModule],
  providers: [
    EmailService,
    {
      provide: EMAIL_TEMPLATE_PROVIDER,
      useClass: EmailTemplateService
    },
    EmailTemplateService,
    SystemConfigEmailService,
    NotificationService
  ],
  exports: [
    EmailService,
    EmailTemplateService,
    EMAIL_TEMPLATE_PROVIDER,
    SystemConfigEmailService,
    NotificationService
  ]
})
export class EmailModule {}
