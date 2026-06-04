# Email Template Variables

Dokumentasi lengkap tentang variable yang digunakan dalam template email recruitment service.

## Standard Variables

Semua template email menggunakan variable yang konsisten untuk memastikan konsistensi dan kemudahan maintenance:

### 1. `{{applicant_name}}`
- **Deskripsi**: Nama lengkap applicant
- **Contoh**: "John Doe", "Jane Smith"
- **Digunakan di**: Semua template notifikasi

### 2. `{{vacancy_name}}`
- **Deskripsi**: Nama posisi yang dilamar
- **Contoh**: "Senior Software Engineer", "Product Manager"
- **Digunakan di**: Template aplikasi dan status update

### 3. `{{application_link}}`
- **Deskripsi**: Link untuk mengakses aplikasi atau login
- **Contoh**: "https://recruitment.company.com/application/123"
- **Digunakan di**: Semua template yang memerlukan link akses

### 4. `{{company_name}}`
- **Deskripsi**: Nama perusahaan (diambil dari system configuration)
- **Contoh**: "PT Neuronworks", "Acme Corporation"
- **Digunakan di**: Semua template untuk branding

### 5. `{{company_website}}`
- **Deskripsi**: Website perusahaan (diambil dari system configuration)
- **Contoh**: "https://neuronworks.com", "https://acme.com"
- **Digunakan di**: Footer email untuk branding

## Template Mapping

### notification_applicant_register
```json
{
  "subject": "Registration Success - {{applicant_name}}",
  "body": "Thank you for registering... <a href=\"{{application_link}}\">Access Application</a>... Best regards, {{company_name}} {{company_website}}"
}
```

**Variables yang digunakan:**
- `{{applicant_name}}`
- `{{application_link}}`
- `{{company_name}}`
- `{{company_website}}`

### notification_applicant_apply
```json
{
  "subject": "Application Received - {{vacancy_name}}",
  "body": "Thank you for applying for the {{vacancy_name}} position at {{company_name}}... <a href=\"{{application_link}}\">Access Application</a>... Best regards, {{company_name}} {{company_website}}"
}
```

**Variables yang digunakan:**
- `{{applicant_name}}`
- `{{vacancy_name}}`
- `{{application_link}}`
- `{{company_name}}`
- `{{company_website}}`

### notification_applicant_status_update
```json
{
  "subject": "Application Status Update - {{vacancy_name}}",
  "body": "Your application for the {{vacancy_name}} position at {{company_name}} has been updated... <a href=\"{{application_link}}\">Application Tracking</a>... Best regards, {{company_name}} {{company_website}}"
}
```

**Variables yang digunakan:**
- `{{applicant_name}}`
- `{{vacancy_name}}`
- `{{application_link}}`
- `{{company_name}}`
- `{{company_website}}`

### notification_applicant_login_token
```json
{
  "subject": "Your Login Token - {{company_name}}",
  "body": "<div>Hello <strong>{{applicant_name}}</strong>... <a href=\"{{application_link}}\">Login to My Account</a>... This is an automated message from {{company_name}}.</div>"
}
```

**Variables yang digunakan:**
- `{{applicant_name}}`
- `{{application_link}}`
- `{{company_name}}`

## Contoh Penggunaan dalam Code

### SystemConfigEmailService
```typescript
await this.systemConfigEmailService.sendEmailFromConfig(
  "notification_applicant_register",
  { email: "applicant@example.com", name: "John Doe" },
  {
    applicant_name: "John Doe",
    application_link: "https://recruitment.company.com/apply",
    company_name: "PT Neuronworks",
    company_website: "https://neuronworks.com"
  }
);
```

### NotificationService
```typescript
await this.notificationService.sendApplicantRegistrationNotification(
  "applicant@example.com",
  "John Doe",
  "https://recruitment.company.com/apply"
);
```

### Custom Notification
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

## Data Source

### Automatic Variables (System Configuration)
- `{{company_name}}` - Diambil dari `company_name` config
- `{{company_website}}` - Diambil dari `social_website` config

### Manual Variables (Dari Code)
- `{{applicant_name}}` - Dikirim dari service
- `{{vacancy_name}}` - Dikirim dari service
- `{{application_link}}` - Dikirim dari service

## Best Practices

1. **Konsistensi**: Selalu gunakan variable yang sama untuk data yang sama
2. **Validation**: Pastikan semua required variables tersedia sebelum render
3. **Fallback**: Sediakan default value untuk optional variables
4. **Testing**: Test template dengan berbagai kombinasi data
5. **Documentation**: Dokumentasikan variable baru yang ditambahkan

## Error Handling

Jika variable tidak tersedia:
- Template akan menampilkan placeholder kosong `{{variable_name}}`
- System akan log warning untuk missing variables
- Email tetap akan dikirim dengan placeholder yang tidak ter-replace

## Migration dari Variable Lama

Jika ada template yang menggunakan variable lama, update ke format baru:

| Variable Lama | Variable Baru |
|---------------|---------------|
| `{{companyName}}` | `{{company_name}}` |
| `{{companyWebsite}}` | `{{company_website}}` |
| `{{login_link}}` | `{{application_link}}` |
| `{{apply_for_job_link}}` | `{{application_link}}` |
| `{{login_url}}` | `{{application_link}}` |

## Template Validation

Untuk memvalidasi template, gunakan:

```typescript
const isValid = await this.notificationService.validateTemplate("notification_applicant_register");
```

Template dianggap valid jika:
- Memiliki `subject` dan `body`
- Menggunakan variable yang supported
- Format JSON valid
