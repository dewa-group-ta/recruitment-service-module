# Talent Pool API Documentation

## Overview

API untuk mengelola status talent pool kandidat. Ketika kandidat direkomendasikan (recommended), mereka akan otomatis ditambahkan ke talent pool.

## Endpoint

### PATCH `/candidates/{applicationId}/talent-pool`

Mengupdate status talent pool untuk kandidat tertentu.

#### Parameters

- `applicationId` (string, required): ID aplikasi kandidat

#### Headers

- `Authorization: Bearer <token>` (required)

#### Request Body

```json
{
  "isTalentPool": true,
  "notes": "Candidate added to talent pool for future opportunities"
}
```

#### Request Fields

| Field          | Type    | Required | Description                      |
| -------------- | ------- | -------- | -------------------------------- |
| `isTalentPool` | boolean | Yes      | Status talent pool (true/false)  |
| `notes`        | string  | No       | Catatan tentang perubahan status |

#### Response

**Success (200 OK)**

```json
{
  "responseCode": 200,
  "responseDesc": "Success",
  "data": {
    "message": "Candidate added to talent pool successfully"
  }
}
```

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
- **Method**: `updateTalentPoolStatus(applicationId: string, isTalentPool: boolean)`
- **Database**: Updates `isTalentPool` field in `applications` table

### Controller

- **File**: `src/modules/candidates/controllers/candidates.controller.ts`
- **Route**: `PATCH /candidates/:applicationId/talent-pool`
- **Role Required**: `HR_MANAGER`

### DTO

- **File**: `src/modules/candidates/dto/candidate-detail.dto.ts`
- **Class**: `UpdateTalentPoolDto`

## Frontend Integration

### API Service

```typescript
// Menggunakan API service
const response = await candidatesService.updateTalentPoolStatus(
  "app-123",
  true,
  "Added to talent pool"
);
```

### Composable Usage

```typescript
// Menggunakan composable
const { updateTalentPoolStatus } = useApplicantDetails();

await updateTalentPoolStatus(
  applicationId.value,
  true,
  "Candidate added to talent pool after recommendation"
);
```

### Automatic Integration

Ketika `handleRecommend` dipanggil dengan `isRecommended: true`:

1. **Update Recommendation Status**: Status kandidat diupdate ke 'qualified'
2. **Add to Talent Pool**: Kandidat otomatis ditambahkan ke talent pool
3. **Success Notifications**: Toast notifications untuk kedua aksi

## Usage Examples

### Manual Talent Pool Management

```typescript
// Menambahkan kandidat ke talent pool
await updateTalentPoolStatus("app-123", true, "High potential candidate");

// Menghapus kandidat dari talent pool
await updateTalentPoolStatus("app-123", false, "No longer suitable");
```

### Automatic Integration

```typescript
// Ketika HR merekomendasikan kandidat
const handleRecommend = async (candidateId: string, isRecommended: boolean) => {
  // Update recommendation status
  await updateRecommendation(applicationId, isRecommended, notes);

  // Jika direkomendasikan, tambahkan ke talent pool
  if (isRecommended) {
    await updateTalentPoolStatus(
      applicationId,
      true,
      "Added after recommendation"
    );
  }
};
```

## Database Schema

### Applications Table

```sql
ALTER TABLE applications
ADD COLUMN isTalentPool BOOLEAN DEFAULT FALSE;
```

### Index for Performance

```sql
CREATE INDEX idx_applications_talent_pool
ON applications(isTalentPool)
WHERE isTalentPool = true;
```

## Notes

- API ini memerlukan autentikasi dan role HR Manager
- Perubahan status talent pool akan di-log dalam audit trail
- Kandidat yang sudah di talent pool dapat digunakan untuk posisi lain di masa depan
- Status talent pool terpisah dari status aplikasi (applied, hired, rejected)
