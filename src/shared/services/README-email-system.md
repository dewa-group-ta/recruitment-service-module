# Email System dengan System Configuration Templates

Sistem email recruitment service telah diupdate untuk menggunakan template dari system configuration, memberikan fleksibilitas yang lebih besar dalam mengelola template email.

## Komponen Utama

### 1. SystemConfigEmailService

Service utama yang mengintegrasikan system configuration dengan email sending.

**Fitur:**

- Mengambil template dari system configuration
- Menggabungkan data company dengan template data
- Render template dengan placeholder replacement
- Fallback ke default template jika system config tidak tersedia

**Contoh Penggunaan:**

```typescript
// Send email menggunakan template dari system configuration
await this.systemConfigEmailService.sendEmailFromConfig(
  "notification_applicant_register",
  { email: "applicant@example.com", name: "John Doe" },
  {
    applicant_name: "John Doe",
    apply_for_job_link: "https://example.com/apply"
  }
);
```

### 2. NotificationService

Service wrapper yang menyediakan method khusus untuk berbagai jenis notifikasi.

**Method yang tersedia:**

- `sendApplicantRegistrationNotification()`
- `sendApplicantApplicationNotification()`
- `sendApplicantStatusUpdateNotification()`
- `sendCustomNotification()`
- `sendBulkNotifications()`

**Contoh Penggunaan:**

```typescript
// Send registration notification
await this.notificationService.sendApplicantRegistrationNotification(
  "applicant@example.com",
  "John Doe",
  "https://example.com/apply"
);

// Send custom notification
await this.notificationService.sendCustomNotification(
  "notification_applicant_login_token",
  { email: "applicant@example.com", name: "John Doe" },
  {
    applicant_name: "John Doe",
    login_link: "https://example.com/login?token=abc123",
    token_expiry: "24 hours"
  }
);
```

### 3. EmailTemplateService (Updated)

Service template yang telah diupdate untuk mendukung system configuration.

**Fitur Baru:**

- Async `getTemplate()` method
- Fallback ke system configuration
- Support untuk JSON template dari database

## Template Configuration

Template email disimpan di system configuration dengan format JSON:

```json
{
  "subject": "Subject Template - {{placeholder}}",
  "body": "<html>Body template with {{placeholder}}</html>"
}
```

### Template yang Tersedia

1. **notification_applicant_register**
   - Placeholders: `{{applicant_name}}`, `{{application_link}}`, `{{company_name}}`, `{{company_website}}`

2. **notification_applicant_apply**
   - Placeholders: `{{applicant_name}}`, `{{vacancy_name}}`, `{{application_link}}`, `{{company_name}}`, `{{company_website}}`

3. **notification_applicant_status_update**
   - Placeholders: `{{applicant_name}}`, `{{vacancy_name}}`, `{{application_link}}`, `{{company_name}}`, `{{company_website}}`

4. **notification_applicant_login_token**
   - Placeholders: `{{applicant_name}}`, `{{application_link}}`, `{{company_name}}`

## Integrasi dengan Existing Services

### TokenService

TokenService telah diupdate untuk menggunakan NotificationService dengan fallback ke direct email:

```typescript
// Try system configuration template first
const notificationSent = await this.notificationService.sendCustomNotification(
  "notification_applicant_login_token",
  { email: applicant.email, name: applicant.fullName },
  {
    applicant_name: applicant.fullName,
    login_link: loginLink,
    token_expiry: "24 hours"
  }
);

// Fallback to direct email if template not found
if (!notificationSent) {
  await this.emailService.sendEmail({...});
}
```

## Configuration

### Environment Variables

Pastikan environment variables untuk SMTP sudah dikonfigurasi:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Recruitment System
SMTP_FROM_EMAIL=noreply@yourcompany.com
```

### System Configuration

Template email dapat dikonfigurasi melalui system configuration API atau langsung di database.

## Error Handling

Sistem memiliki multiple layer fallback:

1. System configuration template
2. Default hardcoded template
3. Direct email sending

Jika system configuration template tidak tersedia atau error, sistem akan otomatis fallback ke method sebelumnya.

## Logging

Semua email sending activity di-log dengan detail:

- Template yang digunakan
- Recipient information
- Success/failure status
- Error messages (jika ada)

## Standard Variables

Semua template email menggunakan variable yang konsisten:

- `{{applicant_name}}` - Nama applicant
- `{{vacancy_name}}` - Nama posisi
- `{{application_link}}` - Link aplikasi/login
- `{{company_name}}` - Nama perusahaan (dari system config)
- `{{company_website}}` - Website perusahaan (dari system config)

## Best Practices

1. **Template Design**: Gunakan placeholder yang konsisten dan descriptive
2. **Fallback Strategy**: Selalu sediakan fallback untuk reliability
3. **Error Handling**: Handle error dengan graceful degradation
4. **Testing**: Test template dengan berbagai data input
5. **Monitoring**: Monitor email delivery success rate

## Migration Guide

Untuk mengupdate existing code:

1. Import `NotificationService` atau `SystemConfigEmailService`
2. Replace direct `EmailService.sendEmail()` calls dengan notification methods
3. Update template data structure sesuai dengan system configuration format
4. Test dengan berbagai scenario (template ada/tidak ada)

## Future Enhancements

- Template versioning
- A/B testing untuk email templates
- Analytics untuk email open/click rates
- Multi-language template support
- Template preview functionality
