# Recruitment Service API Endpoints

## Overview
This document describes all the API endpoints available in the recruitment service backend.

## Base URL
```
http://localhost:3000
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

## Candidates API

### 1. Get All Candidates
**GET** `/candidates`

Retrieve all candidates with pagination and filtering support.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by application status
- `stage` (string, optional): Filter by recruitment stage
- `search` (string, optional): Search in name, email, or application number
- `vacancyId` (string, optional): Filter by vacancy ID

**Response:**
```json
{
  "responseCode": 200,
  "responseDesc": "Success",
  "data": [
    {
      "id": "uuid",
      "applicationId": "uuid",
      "applicationNumber": "APP-2024-001",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+62 812-3456-7890",
      "status": "applied",
      "currentStage": "Interview",
      "score": 85,
      "appliedAt": "2024-01-15T10:30:00Z",
      "avatar": "https://example.com/avatar.jpg",
      "education": "Bachelor Degree",
      "experience": "3 years"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 2. Get Candidates by Vacancy
**GET** `/candidates/vacancy/{vacancyId}`

Retrieve candidates for a specific vacancy.

**Path Parameters:**
- `vacancyId` (string): Vacancy ID

**Query Parameters:** Same as Get All Candidates

### 3. Get Candidates by Stage
**GET** `/candidates/vacancy/{vacancyId}/stages`

Retrieve candidates grouped by recruitment stage.

**Response:**
```json
{
  "responseCode": 200,
  "responseDesc": "Success",
  "data": [
    {
      "stage": "Applied",
      "candidates": [...]
    },
    {
      "stage": "Interview",
      "candidates": [...]
    }
  ]
}
```

### 4. Get Candidate Detail
**GET** `/candidates/{applicationId}`

Retrieve detailed information for a specific candidate.

**Path Parameters:**
- `applicationId` (string): Application ID

**Response:**
```json
{
  "responseCode": 200,
  "responseDesc": "Success",
  "data": {
    "id": "uuid",
    "applicationId": "uuid",
    "applicationNumber": "APP-2024-001",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+62 812-3456-7890",
    "status": "applied",
    "currentStage": "Interview",
    "score": 85,
    "appliedAt": "2024-01-15T10:30:00Z",
    "avatar": "https://example.com/avatar.jpg",
    "education": "Bachelor Degree",
    "experience": "3 years",
    "coverLetter": "I am interested in this position...",
    "expectedStartDate": "2024-02-01",
    "source": "LinkedIn",
    "vacancy": {
      "id": "uuid",
      "title": "Software Engineer",
      "status": "published",
      "department": "Engineering",
      "workLocation": "Jakarta"
    },
    "address": [
      {
        "id": "uuid",
        "applicantId": "uuid",
        "province": "DKI Jakarta",
        "regency": "Jakarta Selatan",
        "district": "Kebayoran Baru",
        "village": "Kramat Pela",
        "fullAddress": "Jl. Kramat Pela No. 1",
        "postalCode": "12130",
        "addressType": "HOME",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "deletedAt": null
      }
    ]
  }
}
```

### 5. Update Candidate Status
**PATCH** `/candidates/{applicationId}/status`

Update the status of a candidate application.

**Path Parameters:**
- `applicationId` (string): Application ID

**Request Body:**
```json
{
  "status": "hired",
  "notes": "Candidate passed all interviews"
}
```

**Response:** Same as Get Candidate Detail

### 6. Move Candidate to Next Stage
**PATCH** `/candidates/{applicationId}/move-stage`

Move a candidate to the next stage in the recruitment pipeline.

**Path Parameters:**
- `applicationId` (string): Application ID

**Request Body:**
```json
{
  "stageId": "uuid",
  "notes": "Moving to final interview"
}
```

**Response:** Same as Get Candidate Detail

### 7. Add Candidate Score
**PATCH** `/candidates/{applicationId}/score`

Add or update the score for a candidate.

**Path Parameters:**
- `applicationId` (string): Application ID

**Request Body:**
```json
{
  "score": 85,
  "notes": "Excellent technical skills"
}
```

**Response:** Same as Get Candidate Detail

### 8. Get Candidate Statistics
**GET** `/candidates/stats`

Retrieve candidate statistics.

**Query Parameters:**
- `vacancyId` (string, optional): Filter by vacancy ID

**Response:**
```json
{
  "responseCode": 200,
  "responseDesc": "Success",
  "data": {
    "total": 100,
    "byStatus": {
      "applied": 50,
      "hired": 20,
      "rejected": 30
    },
    "byStage": {
      "Applied": 50,
      "Interview": 30,
      "Offered": 20
    }
  }
}
```

### 9. Get Applicants Table
**GET** `/candidates/table`

Retrieve applicants with optimized data structure for table display.

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `search` (string, optional): Search term
- `status` (string[], optional): Filter by status array
- `jobStatus` (string[], optional): Filter by job status array
- `stage` (string[], optional): Filter by stage array
- `vacancyId` (string, optional): Filter by vacancy ID
- `sortBy` (string, optional): Sort field
- `sortOrder` (string, optional): Sort order (asc/desc)

### 10. Get Applicants Summary
**GET** `/candidates/summary`

Retrieve applicant summary/statistics.

**Query Parameters:**
- `status` (string[], optional): Filter by status array
- `jobStatus` (string[], optional): Filter by job status array
- `stage` (string[], optional): Filter by stage array
- `vacancyId` (string, optional): Filter by vacancy ID
- `dateFrom` (string, optional): Start date filter
- `dateTo` (string, optional): End date filter

**Response:**
```json
{
  "responseCode": 200,
  "responseDesc": "Success",
  "data": {
    "total": 100,
    "byStatus": {
      "new": 50,
      "qualified": 20,
      "disqualified": 30,
      "talentPool": 10
    },
    "byStage": {
      "Applied": 50,
      "Interview": 30,
      "Offered": 20
    },
    "byJobStatus": {
      "published": 80,
      "draft": 10,
      "closed": 10,
      "archived": 0
    },
    "recentApplications": 15
  }
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "responseCode": 400,
  "responseDesc": "Bad Request",
  "data": null
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Data Types

### Status Values
- `applied`: New application
- `hired`: Candidate hired
- `rejected`: Candidate rejected

### Stage Names
- `Applied`: Initial application
- `Screening`: CV screening
- `Interview`: Interview stage
- `Offered`: Job offer stage
- `Hired`: Final stage

### Job Status
- `published`: Job is published
- `draft`: Job is in draft
- `closed`: Job is closed
- `archived`: Job is archived

## Rate Limiting
API requests are rate limited to prevent abuse. Contact the development team for higher limits if needed.

## Support
For API support and questions, contact the development team or refer to the internal documentation.
