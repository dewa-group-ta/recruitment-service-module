# Hiring Progress API Documentation

## Overview

API untuk mengambil informasi progress recruitment seorang kandidat, termasuk stage saat ini, stage selanjutnya, skor keseluruhan, dan detail setiap stage.

## Endpoint

### GET `/candidates/{applicationId}/hiring-progress`

Mengambil informasi progress recruitment untuk kandidat tertentu.

#### Parameters

- `applicationId` (string, required): ID aplikasi kandidat

#### Headers

- `Authorization: Bearer <token>` (required)

#### Response

**Success (200 OK)**

```json
{
  "responseCode": 200,
  "responseDesc": "Success",
  "data": {
    "currentStage": "Interview",
    "upcomingStage": "Offering",
    "overallScore": 87.5,
    "stages": [
      {
        "title": "Applied",
        "date": "2024-01-15T10:30:00Z",
        "status": "done",
        "notes": "Application submitted successfully"
      },
      {
        "title": "Screening CV",
        "date": "2024-01-16T14:20:00Z",
        "status": "done",
        "score": 90,
        "notes": "CV screening completed"
      },
      {
        "title": "Interview",
        "date": "2024-01-18T09:00:00Z",
        "status": "in-progress"
      },
      {
        "title": "Offering",
        "status": "pending"
      },
      {
        "title": "Hired",
        "status": "pending"
      }
    ]
  }
}
```

#### Response Fields

| Field           | Type   | Description                      |
| --------------- | ------ | -------------------------------- |
| `currentStage`  | string | Nama stage saat ini              |
| `upcomingStage` | string | Nama stage selanjutnya           |
| `overallScore`  | number | Skor keseluruhan kandidat        |
| `stages`        | array  | Daftar semua stage dengan detail |

#### Stage Object Fields

| Field    | Type              | Description                                    |
| -------- | ----------------- | ---------------------------------------------- |
| `title`  | string            | Nama stage                                     |
| `date`   | string (ISO 8601) | Tanggal penyelesaian stage (optional)          |
| `status` | string            | Status stage: `done`, `in-progress`, `pending` |
| `score`  | number            | Skor stage (optional)                          |
| `notes`  | string            | Catatan stage (optional)                       |

#### Error Responses

**404 Not Found**

```json
{
  "responseCode": 404,
  "responseDesc": "Application with ID {applicationId} not found"
}
```

**401 Unauthorized**

```json
{
  "responseCode": 401,
  "responseDesc": "Unauthorized"
}
```

**403 Forbidden**

```json
{
  "responseCode": 403,
  "responseDesc": "Access denied. HR Manager role required"
}
```

## Implementation Details

### Backend Service

- **File**: `src/modules/candidates/services/candidates.service.ts`
- **Method**: `getHiringProgress(applicationId: string)`
- **Return Type**: `HiringProgressDto`

### Controller

- **File**: `src/modules/candidates/controllers/candidates.controller.ts`
- **Route**: `GET /candidates/:applicationId/hiring-progress`
- **Role Required**: `HR_MANAGER`

### DTO

- **File**: `src/modules/candidates/dto/hiring-progress.dto.ts`
- **Classes**: `HiringProgressDto`, `StageProgressDto`

## Usage Examples

### Frontend Integration

```typescript
// Menggunakan API service
const response = await candidatesService.getHiringProgress("app-123");
const progress = response.data;

// Menggunakan composable
const { hiringProgress, loadApplicantDetails } = useApplicantDetails();
await loadApplicantDetails("app-123");
```

### Default Stages

Jika tidak ada pipeline yang dikonfigurasi, API akan menggunakan default stages:

1. Applied
2. Screening CV
3. Interview
4. Offering
5. Hired

## Notes

- API ini memerlukan autentikasi dan role HR Manager
- Data stage diambil dari pipeline recruitment yang terkait dengan aplikasi
- Jika tidak ada pipeline, akan menggunakan default stages
- Status stage ditentukan berdasarkan aktivitas dan stage saat ini
