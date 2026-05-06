# Standardisasi Variable Email Template

## Ringkasan Perubahan

Semua template email telah distandarisasi untuk menggunakan variable yang konsisten sesuai permintaan:

### ✅ Variable yang Digunakan

1. **`{{applicant_name}}`** - Nama applicant
2. **`{{vacancy_name}}`** - Nama posisi
3. **`{{application_link}}`** - Link aplikasi/login
4. **`{{company_name}}`** - Nama perusahaan
5. **`{{company_website}}`** - Website perusahaan

### ✅ File yang Diupdate

#### 1. System Configuration Seeder
**File**: `src/seeders/system-configuration.seeder.ts`

**Perubahan**:
- `notification_applicant_register`: Menggunakan `{{application_link}}` dan `{{company_name}}`, `{{company_website}}`
- `notification_applicant_apply`: Menggunakan variable standar
- `notification_applicant_status_update`: Menggunakan `{{application_link}}` dan variable standar
- `notification_applicant_login_token`: Menggunakan `{{application_link}}` dan `{{company_name}}`

#### 2. SystemConfigEmailService
**File**: `src/shared/services/system-config-email.service.ts`

**Perubahan**:
- Method `getCompanyTemplateData()`: Return `company_name` dan `company_website`
- Method `sendApplicantRegistrationNotification()`: Menggunakan `application_link`
- Method `sendApplicantStatusUpdateNotification()`: Menggunakan `application_link`

#### 3. TokenService
**File**: `src/modules/applicants/services/token.service.ts`

**Perubahan**:
- Menggunakan `application_link` untuk login token
- Menghapus `token_expiry` variable (hardcoded di template)

#### 4. Dokumentasi
**File**: `src/shared/services/README-email-system.md`

**Perubahan**:
- Update placeholder documentation
- Update template mapping
- Update best practices

#### 5. Contoh Penggunaan
**File**: `src/shared/services/email-usage-examples.ts`

**Perubahan**:
- Update semua contoh untuk menggunakan variable standar
- Konsistensi dalam contoh code

### ✅ Template yang Tersedia

#### 1. notification_applicant_register
```json
{
  "subject": "Registration Success - {{applicant_name}}",
  "body": "Thank you for registering... <a href=\"{{application_link}}\">Access Application</a>... Best regards, {{company_name}} {{company_website}}"
}
```

#### 2. notification_applicant_apply
```json
{
  "subject": "Application Received - {{vacancy_name}}",
  "body": "Thank you for applying for the {{vacancy_name}} position at {{company_name}}... <a href=\"{{application_link}}\">Access Application</a>... Best regards, {{company_name}} {{company_website}}"
}
```

#### 3. notification_applicant_status_update
```json
{
  "subject": "Application Status Update - {{vacancy_name}}",
  "body": "Your application for the {{vacancy_name}} position at {{company_name}} has been updated... <a href=\"{{application_link}}\">Application Tracking</a>... Best regards, {{company_name}} {{company_website}}"
}
```

#### 4. notification_applicant_login_token
```json
{
  "subject": "Your Login Token - {{company_name}}",
  "body": "<div>Hello <strong>{{applicant_name}}</strong>... <a href=\"{{application_link}}\">Login to My Account</a>... This is an automated message from {{company_name}}.</div>"
}
```

### ✅ Contoh Penggunaan

#### SystemConfigEmailService
```typescript
await this.systemConfigEmailService.sendEmailFromConfig(
  "notification_applicant_register",
  { email: "applicant@example.com", name: "John Doe" },
  {
    applicant_name: "John Doe",
    application_link: "https://recruitment.company.com/apply"
  }
);
```

#### NotificationService
```typescript
await this.notificationService.sendApplicantRegistrationNotification(
  "applicant@example.com",
  "John Doe",
  "https://recruitment.company.com/apply"
);
```

#### Custom Notification
```typescript
await this.notificationService.sendCustomNotification(
  "notification_applicant_apply",
  { email: "applicant@example.com", name: "John Doe" },
  {
    applicant_name: "John Doe",
    vacancy_name: "Software Engineer",
    application_link: "https://recruitment.company.com/application/123"
  }
);
```

### ✅ Keunggulan Standardisasi

1. **Konsistensi**: Semua template menggunakan variable yang sama
2. **Maintainability**: Mudah untuk maintain dan update
3. **Predictability**: Developer tahu variable apa yang tersedia
4. **Documentation**: Dokumentasi yang jelas dan lengkap
5. **Testing**: Mudah untuk test dengan variable yang konsisten

### ✅ Migration Guide

Jika ada template lama yang menggunakan variable berbeda:

| Variable Lama | Variable Baru |
|---------------|---------------|
| `{{companyName}}` | `{{company_name}}` |
| `{{companyWebsite}}` | `{{company_website}}` |
| `{{login_link}}` | `{{application_link}}` |
| `{{apply_for_job_link}}` | `{{application_link}}` |
| `{{login_url}}` | `{{application_link}}` |
| `{{token_expiry}}` | Hardcoded di template |

### ✅ Testing

Untuk test template dengan variable baru:

```typescript
// Test template validation
const isValid = await this.notificationService.validateTemplate("notification_applicant_register");

// Test dengan data sample
await this.notificationService.sendCustomNotification(
  "notification_applicant_register",
  { email: "test@example.com", name: "Test User" },
  {
    applicant_name: "Test User",
    application_link: "https://test.com/apply"
  }
);
```

### ✅ Monitoring

Monitor penggunaan template dengan:
- Log success/failure rate
- Track variable usage
- Monitor email delivery
- Validate template sebelum production

## Kesimpulan

Semua template email sekarang menggunakan variable yang konsisten dan standar. Ini memudahkan maintenance, development, dan testing. Dokumentasi lengkap tersedia di `EMAIL_VARIABLES.md` untuk referensi developer.
