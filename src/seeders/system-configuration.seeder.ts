import { DataSource } from "typeorm";
import { BaseSeeder } from "./base.seeder";
import {
  SystemConfiguration,
  ConfigType
} from "../modules/system-configurations/entities/system-configuration.entity";

export class SystemConfigurationSeeder extends BaseSeeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    const systemConfigurationRepository =
      this.dataSource.getRepository(SystemConfiguration);

    // Clear existing data
    await systemConfigurationRepository.clear();

    const configurations = [
      // Company Information Group
      {
        configKey: "company_name",
        configValue: "PT Neuronworks",
        configType: ConfigType.TEXT,
        groupName: "company",
        label: "Company Name",
        description: "Nama perusahaan yang akan ditampilkan di website",
        isRequired: true,
        isPublic: true,
        sortOrder: 1
      },
      {
        configKey: "company_industry",
        configValue: "Technology & Software Development",
        configType: ConfigType.TEXT,
        groupName: "company",
        label: "Industry",
        description: "Industri atau bidang usaha perusahaan",
        isRequired: true,
        isPublic: true,
        sortOrder: 2
      },
      {
        configKey: "company_logo",
        configValue: "/uploads/company-full-logo.png",
        configType: ConfigType.IMAGE,
        groupName: "company",
        label: "Full Logo",
        description: "Logo lengkap perusahaan (dengan text)",
        isRequired: true,
        isPublic: true,
        sortOrder: 3
      },
      {
        configKey: "company_favicon",
        configValue: "/uploads/company-favicon.ico",
        configType: ConfigType.IMAGE,
        groupName: "company",
        label: "Favicon",
        description: "Favicon perusahaan yang ditampilkan di browser tab",
        isRequired: true,
        isPublic: true,
        sortOrder: 5
      },
      {
        configKey: "company_about",
        configValue:
          "PT Neuronworks adalah perusahaan teknologi terdepan yang berfokus pada pengembangan solusi inovatif untuk recruitment dan talent management. Kami membantu perusahaan menemukan talenta terbaik melalui teknologi AI dan platform digital yang canggih.",
        configType: ConfigType.TEXT,
        groupName: "company",
        label: "About",
        description: "Deskripsi lengkap tentang perusahaan",
        isRequired: true,
        isPublic: true,
        sortOrder: 6
      },
      {
        configKey: "company_employees",
        configValue: "70 - 100 employees",
        configType: ConfigType.TEXT,
        groupName: "company",
        label: "Employees",
        description: "Range jumlah karyawan perusahaan",
        isRequired: true,
        isPublic: true,
        sortOrder: 7
      },
      {
        configKey: "company_phone",
        configValue: "+62 21 1234 5678",
        configType: ConfigType.PHONE,
        groupName: "company",
        label: "Phone",
        description: "Nomor telepon perusahaan",
        isRequired: true,
        isPublic: true,
        sortOrder: 8
      },
      {
        configKey: "company_address",
        configValue: "Jl. Sudirman No. 123, Jakarta Pusat 10270, Indonesia",
        configType: ConfigType.TEXT,
        groupName: "company",
        label: "Address",
        description: "Alamat lengkap perusahaan",
        isRequired: true,
        isPublic: true,
        sortOrder: 9
      },
      {
        configKey: "company_google_maps_link",
        configValue:
          "https://maps.google.com/?q=Jl+Sudirman+No+123+Jakarta+Pusat",
        configType: ConfigType.URL,
        groupName: "company",
        label: "Google Maps Link",
        description: "Link Google Maps ke lokasi perusahaan",
        isRequired: false,
        isPublic: true,
        sortOrder: 10
      },

      // Company Social Media Group
      {
        configKey: "social_twitter",
        configValue: "",
        configType: ConfigType.JSON,
        groupName: "social_media",
        label: "Twitter",
        description: "Link akun Twitter perusahaan",
        isRequired: false,
        isPublic: true,
        sortOrder: 1,
        configValueJson: {
          url: "https://twitter.com/neuronworks",
          username: "@neuronworks"
        }
      },
      {
        configKey: "social_instagram",
        configValue: "",
        configType: ConfigType.JSON,
        groupName: "social_media",
        label: "Instagram",
        description: "Link akun Instagram perusahaan",
        isRequired: false,
        isPublic: true,
        sortOrder: 2,
        configValueJson: {
          url: "https://instagram.com/neuronworks",
          username: "@neuronworks"
        }
      },
      {
        configKey: "social_youtube",
        configValue: "",
        configType: ConfigType.JSON,
        groupName: "social_media",
        label: "YouTube",
        description: "Link channel YouTube perusahaan",
        isRequired: false,
        isPublic: true,
        sortOrder: 3,
        configValueJson: {
          url: "https://youtube.com/@neuronworks",
          username: "@neuronworks"
        }
      },
      {
        configKey: "social_facebook",
        configValue: "",
        configType: ConfigType.URL,
        groupName: "social_media",
        label: "Facebook",
        description: "Link akun Facebook perusahaan",
        isRequired: false,
        isPublic: true,
        sortOrder: 4,
        configValueJson: {
          url: "https://facebook.com/neuronworks",
          username: "@neuronworks"
        }
      },
      {
        configKey: "social_linkedin",
        configValue: "",
        configType: ConfigType.JSON,
        groupName: "social_media",
        label: "LinkedIn",
        description: "Link akun LinkedIn perusahaan",
        isRequired: false,
        isPublic: true,
        sortOrder: 5,
        configValueJson: {
          url: "https://linkedin.com/company/neuronworks",
          username: "@neuronworks"
        }
      },
      {
        configKey: "social_website",
        configValue: "",
        configType: ConfigType.JSON,
        groupName: "social_media",
        label: "Website",
        description: "Link website perusahaan",
        isRequired: false,
        isPublic: true,
        sortOrder: 6,
        configValueJson: {
          url: "https://neuronworks.com",
          username: "@neuronworks"
        }
      },

      // Banners Group
      {
        configKey: "company_banner",
        configValue: "/uploads/sidebar-banner.jpg",
        configType: ConfigType.IMAGE,
        groupName: "banners",
        label: "Sidebar Banner",
        description: "Banner yang ditampilkan di sidebar website",
        isRequired: false,
        isPublic: true,
        sortOrder: 1
      },
      {
        configKey: "vacancy_banner",
        configValue: "/uploads/hiring-banner.jpg",
        configType: ConfigType.IMAGE,
        groupName: "banners",
        label: "Hiring Banner",
        description: "Banner untuk promosi hiring/recruitment",
        isRequired: false,
        isPublic: true,
        sortOrder: 2
      },
      {
        configKey: "company_poster",
        configValue: "/uploads/company-poster.jpg",
        configType: ConfigType.IMAGE,
        groupName: "banners",
        label: "Company Poster",
        description: "Poster untuk promosi company",
        isRequired: false,
        isPublic: true,
        sortOrder: 3
      },
      {
        configKey: "vacancy_url",
        configValue: "https://neuronworks.com",
        configType: ConfigType.URL,
        groupName: "banners",
        label: "Hiring URL",
        description: "URL untuk promosi hiring/recruitment",
        isRequired: false,
        isPublic: true,
        sortOrder: 4
      },
      {
        configKey: "terms_of_service",
        configValue: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        configType: ConfigType.TEXT,
        groupName: "legal",
        label: "Terms of Service",
        description: "Syarat dan ketentuan penggunaan platform",
        isRequired: false,
        isPublic: true,
        sortOrder: 1
      },
      {
        configKey: "privacy_policy",
        configValue: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        configType: ConfigType.TEXT,
        groupName: "legal",
        label: "Privacy Policy",
        description: "Kebijakan privasi penggunaan platform",
        isRequired: false,
        isPublic: true,
        sortOrder: 2
      },

      // Notification Template Group
      {
        configKey: "notification_applicant_register",
        configValue: "",
        configType: ConfigType.JSON,
        groupName: "notifications",
        label: "Applicant Register Notification",
        description: "Notifikasi pendaftaran calon karyawan",
        isRequired: false,
        isPublic: true,
        sortOrder: 1,
        configValueJson: {
          subject: "Registration Success - {{applicant_name}}",
          body: `<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
            <h2 style="color: #1a1a1a; margin-bottom: 16px;">Registration Successful</h2>
            <p>Dear <strong>{{applicant_name}}</strong>,</p>
            <p>Thank you for registering on our platform. To proceed with your application, please access the link below and complete the required information.</p>
            <p>
              <a href="{{application_link}}" style="display: inline-block; background-color: #c3571c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">Access Application</a>
            </p>
            <p style="color: #888888; font-size: 12px;">If the button does not work, copy this link: {{application_link}}</p>
            <p>Best regards,<br>{{company_name}}</p>
          </div>`
        }
      },
      {
        configKey: "notification_applicant_apply",
        configValue: "",
        configType: ConfigType.JSON,
        groupName: "notifications",
        label: "Applicant Apply Notification",
        description: "Notifikasi pendaftaran calon karyawan (quick apply)",
        isRequired: false,
        isPublic: true,
        sortOrder: 2,
        configValueJson: {
          subject: "Application Received - {{vacancy_name}}",
          body: `<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
            <h2 style="color: #1a1a1a; margin-bottom: 16px;">Application Confirmed</h2>
            <p>Dear <strong>{{applicant_name}}</strong>,</p>
            <p>Your application for the <strong>{{vacancy_name}}</strong> position at <strong>{{company_name}}</strong> has been successfully received.</p>
            <div style="background-color: #fdf7ed; border-left: 4px solid #c3571c; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; color: #555555; font-size: 14px;">Your Application Code</p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #c3571c;">{{registration_code}}</p>
            </div>
            <p>Keep this code safe — you will need it to track your application status.</p>
            <p>
              <a href="{{tracking_link}}" style="display: inline-block; background-color: #c3571c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">Track My Application</a>
            </p>
            <p style="color: #888888; font-size: 12px;">If the button does not work, copy this link: {{tracking_link}}</p>
            <p>Best regards,<br>{{company_name}}</p>
          </div>`
        }
      },
      {
        configKey: "notification_applicant_status_update",
        configValue: "",
        configType: ConfigType.JSON,
        groupName: "notifications",
        label: "Applicant Status Update Notification",
        description: "Notifikasi pembaruan status pendaftaran calon karyawan",
        isRequired: false,
        isPublic: true,
        sortOrder: 3,
        configValueJson: {
          subject: "Application Status Update - {{vacancy_name}}",
          body: `<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
            <h2 style="color: #1a1a1a; margin-bottom: 16px;">Application Status Update</h2>
            <p>Dear <strong>{{applicant_name}}</strong>,</p>
            <p>Your application for the <strong>{{vacancy_name}}</strong> position at <strong>{{company_name}}</strong> has been updated.</p>
            <p>Please check your application status for further details.</p>
            <p>Best regards,<br>{{company_name}}</p>
          </div>`
        }
      },
      {
        configKey: "notification_applicant_stage_update",
        configValue: "",
        configType: ConfigType.JSON,
        groupName: "notifications",
        label: "Applicant Stage Update Notification",
        description: "Notifikasi pembaruan tahap rekrutmen calon karyawan",
        isRequired: false,
        isPublic: true,
        sortOrder: 4,
        configValueJson: {
          subject: "Recruitment Stage Update - {{vacancy_name}}",
          body: `<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
            <h2 style="color: #1a1a1a; margin-bottom: 16px;">Recruitment Stage Update</h2>
            <p>Dear <strong>{{applicant_name}}</strong>,</p>
            <p>Your application for the <strong>{{vacancy_name}}</strong> position has been moved to the next stage: <strong>{{stage_name}}</strong>.</p>
            <p>Please check your application status for further details.</p>
            <p>Best regards,<br>{{company_name}}</p>
          </div>`
        }
      },
      {
        configKey: "notification_door_enabled",
        configValue: "true",
        configType: ConfigType.TEXT,
        groupName: "notifications",
        label: "DOOR Notification Enabled",
        description: "Toggle untuk mengaktifkan/menonaktifkan notifikasi DOOR",
        isRequired: false,
        isPublic: false,
        sortOrder: 5
      },
      {
        configKey: "notification_applicant_login_token",
        configValue: "",
        configType: ConfigType.JSON,
        groupName: "notifications",
        label: "Applicant Login Token Notification",
        description: "Notifikasi token login untuk calon karyawan",
        isRequired: false,
        isPublic: true,
        sortOrder: 6,
        configValueJson: {
          subject: "Your Login Token - {{company_name}}",
          body: `<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
            <h2 style="color: #1a1a1a; margin-bottom: 16px;">Login to Your Account</h2>
            <p>Hello <strong>{{applicant_name}}</strong>,</p>
            <p>You requested to login to your recruitment account. Click the link below to access your account:</p>
            <p>
              <a href="{{application_link}}" style="display: inline-block; background-color: #c3571c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">Login to My Account</a>
            </p>
            <p style="color: #888888; font-size: 12px;">If the button does not work, copy this link: {{application_link}}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p style="color: #888888; font-size: 12px;">If you didn't request this login, please ignore this email. This is an automated message from {{company_name}}. Please do not reply to this email.</p>
            <p>Best regards,<br>{{company_name}}</p>
          </div>`
        }
      },
    ];

    // Insert configurations
    for (const config of configurations) {
      const systemConfig = systemConfigurationRepository.create(config);
      await systemConfigurationRepository.save(systemConfig);
    }

    console.log("✅ System Configuration seeder completed successfully");
  }

  async clear(): Promise<void> {
    const systemConfigurationRepository =
      this.dataSource.getRepository(SystemConfiguration);
    await systemConfigurationRepository.delete({});
    console.log("🗑️ System Configuration data cleared");
  }
}
