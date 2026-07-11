# File Upload Service Documentation

## Overview

The File Upload Service provides a comprehensive solution for handling file uploads in the recruitment system using MinIO as the object storage backend. It follows SOLID principles and includes file validation, metadata management, and secure access controls.

## Features

- ✅ MinIO object storage integration
- ✅ File validation (size, type, extension)
- ✅ Metadata storage in PostgreSQL
- ✅ Presigned URLs for secure access
- ✅ Soft delete functionality
- ✅ File organization by entity type
- ✅ TypeScript support with full type safety

## Architecture

The file upload system consists of:

### 1. MinioService

- Handles MinIO client initialization
- Manages file upload/download operations
- Generates presigned URLs for secure access

### 2. FileUploadService

- Business logic for file operations
- Database metadata management
- File validation and organization

### 3. File Entity

- Database entity for file metadata
- Supports multiple file types
- Links files to related entities

### 4. File Validation Pipe

- Validates file size, type, and extension
- Configurable validation rules
- Prevents malicious file uploads

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=recruitment-files
```

### MinIO Setup

1. Install MinIO server:

```bash
# Using Docker
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

2. Access MinIO console at http://localhost:9001
3. Create bucket named `recruitment-files`

## Usage

### File Upload Endpoints

#### Applicant File Upload

- `POST /applicants/upload-cv` - Upload CV file
- `GET /applicants/files` - Get applicant files
- `DELETE /applicants/files/:fileId` - Delete file

#### Vacancy File Upload

- `POST /vacancies/:id/upload-job-description` - Upload job description
- `POST /vacancies/:id/upload-company-logo` - Upload company logo
- `GET /vacancies/:id/files` - Get vacancy files
- `DELETE /vacancies/:id/files/:fileId` - Delete file

### File Types

```typescript
enum FileType {
  CV = "cv",
  COVER_LETTER = "cover_letter",
  PORTFOLIO = "portfolio",
  CERTIFICATE = "certificate",
  IDENTITY_DOCUMENT = "identity_document",
  JOB_DESCRIPTION = "job_description",
  COMPANY_LOGO = "company_logo",
  OTHER = "other"
}
```

### File Validation Rules

#### CV Files

- Max size: 5MB
- Allowed types: PDF, DOC, DOCX
- MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

#### Job Description Files

- Max size: 10MB
- Allowed types: PDF, DOC, DOCX
- MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

#### Company Logo Files

- Max size: 2MB
- Allowed types: JPG, JPEG, PNG, GIF, WEBP
- MIME types: image/jpeg, image/png, image/gif, image/webp

## API Examples

### Upload CV

```bash
curl -X POST \
  http://localhost:3000/applicants/upload-cv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@cv.pdf" \
  -F "description=My updated CV"
```

### Upload Job Description

```bash
curl -X POST \
  http://localhost:3000/vacancies/uuid/upload-job-description \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@job-description.pdf" \
  -F "description=Detailed job requirements"
```

### Get Files

```bash
curl -X GET \
  http://localhost:3000/applicants/files \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Features

1. **File Validation**: Prevents upload of malicious files
2. **Size Limits**: Prevents storage abuse
3. **Type Restrictions**: Only allows specific file types
4. **Presigned URLs**: Secure access without exposing credentials
5. **Soft Delete**: Maintains audit trail
6. **User Authorization**: Users can only access their own files

## Error Handling

The service provides comprehensive error handling:

- File validation errors
- MinIO connection errors
- Database operation errors
- Authorization errors

## Database Schema

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  bucket VARCHAR(100) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  description VARCHAR(500),
  uploaded_by UUID,
  related_entity VARCHAR(100),
  related_entity_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

## Monitoring and Logging

- Comprehensive logging for all operations
- Error tracking and monitoring
- File access audit trail
- Performance metrics

## Best Practices

1. Always validate files before upload
2. Use appropriate file size limits
3. Implement proper error handling
4. Monitor storage usage
5. Regular backup of metadata
6. Clean up orphaned files periodically
