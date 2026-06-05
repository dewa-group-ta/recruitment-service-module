# Recruitment Service Module

> Modul backend sistem rekrutmen berbasis **NestJS** yang menangani manajemen lowongan kerja, pendaftaran pelamar, proses lamaran, serta penilaian otomatis CV menggunakan integrasi **FastAPI Screening Service**.

---

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Prasyarat](#prasyarat)
- [Instalasi & Setup](#instalasi--setup)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Migrasi Database](#migrasi-database)
- [Struktur Direktori](#struktur-direktori)
- [Autentikasi](#autentikasi)
- [Alur Sistem](#alur-sistem)
- [API Endpoints](#api-endpoints)
  - [Recruitment Pipelines](#recruitment-pipelines)
  - [Vacancies HR](#vacancies-hr)
  - [Vacancies Public](#vacancies-public)
  - [Applicants](#applicants)
  - [Candidates & Pemeringkatan](#candidates--pemeringkatan-hr-view)
- [Integrasi FastAPI Screening Service](#integrasi-fastapi-screening-service)
- [Pengujian dengan Postman](#pengujian-dengan-postman)

---

## Gambaran Umum

Recruitment Service Module adalah layanan REST API yang menjadi tulang punggung sistem rekrutmen digital. Sistem ini mencakup:

- **Manajemen Vacancy** — HR dapat membuat, mengelola, dan mempublikasikan lowongan kerja
- **Manajemen Pipeline** — Template dan instance pipeline rekrutmen per lowongan
- **Pendaftaran Pelamar** — Pelamar mendaftar via token yang dikirim ke email
- **Proses Lamaran** — Upload CV, pengisian data, dan submit lamaran
- **Penilaian Otomatis** — Integrasi dengan FastAPI untuk parsing CV dan scoring berbasis semantic similarity (SBERT)

---

## Teknologi yang Digunakan

| Kategori | Teknologi |
|---|---|
| Runtime | Node.js |
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| Database | PostgreSQL |
| ORM | TypeORM 0.3 |
| Object Storage | MinIO |
| HTTP Client | Axios (`@nestjs/axios`) |
| Authentication | Custom Bearer Token (DB-based) |
| API Documentation | Swagger (`@nestjs/swagger`) |
| File Upload | Multer |
| Email | Nodemailer |
| Logging | Pino (`nestjs-pino`) |
| AI Scoring Service | FastAPI + SBERT + Groq LLM |

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────┐
│              Client (Postman / Frontend)         │
└─────────────────┬───────────────────────────────┘
                  │ HTTP REST
┌─────────────────▼───────────────────────────────┐
│           NestJS Recruitment Service             │
│              http://localhost:3000               │
│                                                  │
│  ┌─────────────┐  ┌────────────┐  ┌──────────┐  │
│  │  Vacancies  │  │ Applicants │  │Candidates│  │
│  │  Pipelines  │  │  Results   │  │Analytics │  │
│  └─────────────┘  └────────────┘  └──────────┘  │
└──────┬──────────────────┬────────────────────────┘
       │                  │
┌──────▼──────┐   ┌───────▼──────────────────────┐
│  PostgreSQL │   │  FastAPI Screening Service    │
│  Database   │   │  http://localhost:8000        │
└─────────────┘   │  POST /parse-and-evaluate/   │
                  │  (CV Parsing + SBERT Scoring) │
       ┌──────────┘   └──────────────────────────┘
┌──────▼──────┐
│    MinIO    │
│  (Storage)  │
└─────────────┘
```

---

## Prasyarat

Pastikan software berikut sudah terinstall:

- **Node.js** >= 18.x
- **npm** >= 9.x atau **pnpm** >= 8.x
- **PostgreSQL** >= 14
- **MinIO** (lokal atau server)
- **FastAPI Screening Service** berjalan di port `8000`

---

## Instalasi & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd recruitment-services-module
```

### 2. Install Dependencies

```bash
npm install
# atau
pnpm install
```

### 3. Salin File Environment

```bash
cp .env.example .env
```

Lalu edit `.env` sesuai konfigurasi lokal (lihat bagian [Konfigurasi Environment](#konfigurasi-environment)).

### 4. Setup Database

Pastikan PostgreSQL sudah berjalan, lalu buat database:

```sql
CREATE DATABASE recruitment_db;
```

### 5. Jalankan Migrasi

```bash
npm run migration:run
```

### 6. (Opsional) Jalankan Seeder

```bash
npm run seed:run
```

---

## Konfigurasi Environment

Salin `.env.example` menjadi `.env` dan sesuaikan nilai berikut:

```env
# ── Aplikasi ───────────────────────────────────────────
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ── Database ───────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=recruitment_db

# ── MinIO (Object Storage) ────────────────────────────
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=recruitment

# ── Email (Nodemailer) ────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=noreply@recruitment.com

# ── FastAPI Screening Service ─────────────────────────
FASTAPI_BASE_URL=http://localhost:8000
```

> **Catatan:** Tidak ada `JWT_SECRET` karena autentikasi menggunakan token yang disimpan di database tabel `auth_tokens`.

---

## Menjalankan Aplikasi

### Development (Hot Reload)

```bash
npm run start:dev
```

### Production Build

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

Setelah berjalan, akses:
- **API:** `http://localhost:3000`
- **Swagger Docs:** `http://localhost:3000/api-docs`

---

## Migrasi Database

| Perintah | Deskripsi |
|---|---|
| `npm run migration:generate` | Generate file migrasi dari perubahan entity |
| `npm run migration:run` | Jalankan semua migrasi yang pending |
| `npm run migration:revert` | Rollback migrasi terakhir |
| `npm run migration:show` | Tampilkan status semua migrasi |

---

## Struktur Direktori

```
recruitment-services-module/
├── src/
│   ├── config/                     # Konfigurasi database & migrasi
│   │   └── migration.config.ts
│   │
│   ├── migrations/                 # File-file migrasi TypeORM
│   │
│   ├── modules/                    # Modul-modul fitur utama
│   │   ├── analytics/              # Analitik dan statistik rekrutmen
│   │   ├── applicant-results/      # Hasil penilaian CV (scoring)
│   │   │   ├── controllers/
│   │   │   ├── dto/
│   │   │   │   ├── fastapi-scoring-request.dto.ts
│   │   │   │   ├── fastapi-scoring-response.dto.ts
│   │   │   │   └── evaluation-result-response.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── evaluation-results.entity.ts
│   │   │   └── services/
│   │   │       └── applicant-results.service.ts
│   │   │
│   │   ├── applicants/             # Manajemen pelamar & proses lamaran
│   │   │   ├── controllers/
│   │   │   │   └── applicant.controller.ts
│   │   │   ├── dto/
│   │   │   │   ├── register-applicant.dto.ts
│   │   │   │   ├── apply-applicant.dto.ts
│   │   │   │   ├── apply-applicant-response.dto.ts
│   │   │   │   └── address.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── applicant.entity.ts
│   │   │   │   ├── application.entity.ts
│   │   │   │   ├── applicant-education.entity.ts
│   │   │   │   ├── applicant-job-history.entity.ts
│   │   │   │   ├── applicant-address.entity.ts
│   │   │   │   └── auth-token.entity.ts
│   │   │   └── services/
│   │   │       ├── applicant.service.ts
│   │   │       └── token.service.ts
│   │   │
│   │   ├── candidates/             # Manajemen kandidat (HR view)
│   │   ├── departments/            # Manajemen departemen
│   │   ├── locations/              # Manajemen lokasi kantor
│   │   ├── system-configurations/  # Konfigurasi sistem
│   │   │
│   │   └── vacancies/              # Manajemen lowongan kerja
│   │       ├── controllers/
│   │       │   ├── vacancy.controller.ts
│   │       │   ├── public-vacancy.controller.ts
│   │       │   └── recruitment-pipeline.controller.ts
│   │       ├── dto/
│   │       │   ├── create-vacancy.dto.ts
│   │       │   ├── update-vacancy.dto.ts
│   │       │   └── vacancy-response.dto.ts
│   │       ├── entities/
│   │       │   ├── vacancy.entity.ts
│   │       │   └── recruitment-pipeline.entity.ts
│   │       └── services/
│   │           ├── vacancy.service.ts
│   │           └── recruitment-pipeline.service.ts
│   │
│   ├── seeders/                    # Data seeder untuk development
│   │
│   ├── shared/                     # Utilitas & komponen bersama
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts     # @Public() — skip auth
│   │   │   ├── roles.decorator.ts      # @IsRole() — role check
│   │   │   └── response.decorator.ts   # @ResponseMessage()
│   │   ├── enums/
│   │   │   ├── job-status.enum.ts
│   │   │   └── pipeline.enum.ts
│   │   ├── guards/
│   │   │   └── bearer-auth/
│   │   │       └── bearer-auth.guard.ts
│   │   ├── interfaces/
│   │   ├── services/
│   │   │   ├── minio.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── notification.service.ts
│   │   ├── transformers/
│   │   ├── validators/
│   │   └── utils/
│   │       └── constant.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
├── .env
├── .env.example
├── docker-compose.yaml
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

---

## Autentikasi

Sistem menggunakan dua mekanisme autentikasi yang berbeda:

### HR / Admin Endpoints
Token **tidak divalidasi ke database**. Nilai Bearer token langsung digunakan sebagai `userId` (`created_by` / `updated_by`).

```
Authorization: Bearer <uuid-apapun>
```

Token yang dipakai akan tersimpan sebagai `created_by` di tabel terkait. Gunakan UUID yang konsisten untuk traceability.

### Applicant Endpoints
Token divalidasi ke tabel `auth_tokens` di database.

**Alur:**
1. `POST /applicants/register` → sistem kirim token ke email
2. Ambil token dari `auth_tokens` (dev) atau email (prod)
3. `POST /applicants/validate-login-token` → dapat `applicantId`
4. Gunakan `applicantId` sebagai query param / form body (tanpa JWT)

### Endpoint Publik (`@Public()`)
Tidak memerlukan token apapun.

---

## Alur Sistem

### Alur Lengkap: Buat Vacancy → Apply → Scoring

```
[HR]
  │
  ├─ POST /recruitment-pipelines        → Buat template pipeline
  ├─ POST /vacancies                    → Buat vacancy (title saja, status: draft)
  ├─ PUT  /vacancies/:id                → Isi detail (desc, salary, dll)
  └─ PUT  /vacancies/:id               → Publish (status: published)

[APPLICANT]
  │
  ├─ GET  /public/vacancies             → Lihat vacancy (tanpa token)
  ├─ POST /applicants/register          → Daftar, dapat applicantId + token email
  ├─ POST /applicants/validate-login-token → Konfirmasi token
  ├─ POST /applicants/upload-cv         → Upload CV (applicantId di form body)
  ├─ GET  /applicants/me?applicantId=   → Ambil applicationId
  └─ POST /applicants/apply/:appId      → Submit lamaran
           │
           ├─ [1] Validasi status = "new"
           ├─ [2] Cek CV sudah terupload
           ├─ [3] Scoring → FastAPI /parse-and-evaluate/
           │        └─ Gagal? → 400 Bad Request, DB tidak disentuh
           ├─ [4] Transaksi DB (status → "applied", snapshot CV, stage activity)
           ├─ [5] Simpan hasil scoring ke evaluation_results
           └─ [6] Return response + evaluationResult
```

### Proteksi Double Apply

Satu pelamar **tidak dapat** melamar ke vacancy yang sama dua kali. Namun pelamar yang sama **dapat** melamar ke vacancy berbeda dengan melakukan register ulang menggunakan `vacancyId` yang berbeda.

---

## API Endpoints

### 🔒 Keterangan Auth

| Simbol | Keterangan |
|---|---|
| `[HR]` | Bearer token apapun (UUID), tidak cek DB |
| `[PUBLIC]` | Tanpa token |
| `[APPLICANT]` | `applicantId` di query/body, bukan JWT |

---

### Recruitment Pipelines

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/recruitment-pipelines/default-template` | `[HR]` | Ambil template pipeline default |
| `GET` | `/recruitment-pipelines/templates` | `[HR]` | List semua template pipeline |
| `GET` | `/recruitment-pipelines/default` | `[HR]` | Ambil pipeline default |
| `GET` | `/recruitment-pipelines/categories` | `[HR]` | List semua kategori |
| `GET` | `/recruitment-pipelines/by-category/:cat` | `[HR]` | Filter pipeline by kategori |
| `GET` | `/recruitment-pipelines` | `[HR]` | List semua pipeline (pagination) |
| `GET` | `/recruitment-pipelines/:id` | `[HR]` | Detail pipeline by ID |
| `POST` | `/recruitment-pipelines` | `[HR]` | Buat pipeline baru |
| `POST` | `/recruitment-pipelines/:id/create-from-template` | `[HR]` | Buat instance dari template |
| `PATCH` | `/recruitment-pipelines/:id` | `[HR]` | Update pipeline |
| `PATCH` | `/recruitment-pipelines/:id/set-default` | `[HR]` | Set pipeline sebagai default |
| `PATCH` | `/recruitment-pipelines/:id/increment-usage` | `[HR]` | Tambah counter penggunaan |
| `PATCH` | `/recruitment-pipelines/:id/replace-stages-from-template/:tplId` | `[HR]` | Ganti stages dari template |
| `DELETE` | `/recruitment-pipelines/:id` | `[HR]` | Hapus pipeline |

---

### Vacancies (HR)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/vacancies` | `[HR]` | Buat vacancy baru (title saja, status: draft) |
| `GET` | `/vacancies` | `[HR]` | List semua vacancy (pagination, filter) |
| `GET` | `/vacancies/:id` | `[HR]` | Detail vacancy by ID |
| `PUT` | `/vacancies/:id` | `[HR]` | Update vacancy (detail / status) |
| `DELETE` | `/vacancies/:id` | `[HR]` | Hapus vacancy (soft delete) |

**Query params `GET /vacancies`:**

| Param | Tipe | Deskripsi |
|---|---|---|
| `page` | number | Nomor halaman (default: 1) |
| `limit` | number | Item per halaman (default: 10) |
| `status` | string | Filter by status (`draft`, `published`, `closed`) |
| `jobCategory` | string | Filter by kategori pekerjaan |
| `search` | string | Pencarian by judul |

---

### Vacancies (Public)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/public/vacancies` | `[PUBLIC]` | List vacancy yang dipublikasikan |
| `GET` | `/public/vacancies/:id` | `[PUBLIC]` | Detail vacancy publik by ID |

---

### Applicants

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/applicants/register` | `[PUBLIC]` | Daftar sebagai pelamar, kirim token ke email |
| `POST` | `/applicants/login` | `[PUBLIC]` | Login dengan email (kirim ulang token) |
| `POST` | `/applicants/validate-login-token` | `[PUBLIC]` | Validasi token login, dapat `applicantId` |
| `POST` | `/applicants/validate-token` | `[PUBLIC]` | Validasi sesi token (cek masih aktif) |
| `GET` | `/applicants/me?applicantId=` | `[PUBLIC]` | Profil pelamar + list application |
| `POST` | `/applicants/upload-cv` | `[PUBLIC]` | Upload CV (applicantId di form body) |
| `POST` | `/applicants/apply/:applicationId` | `[PUBLIC]` | Submit lamaran + trigger scoring |

**Body `POST /applicants/register`:**

```json
{
  "fullName": "Prima Nurdiansyah",
  "email": "prima@gmail.com",
  "phone": "+6285864767275",
  "vacancyId": "uuid-vacancy",
  "applicantSourceIds": [],
  "customSource": "Company website"
}
```

**Response `POST /applicants/register`:**

```json
{
  "responseCode": "201--00",
  "responseDesc": "Successfully created",
  "data": {
    "applicantId": "902fc889-dbc9-49a6-9c35-b0d7af50e2a4"
  }
}
```

**Body `POST /applicants/apply/:applicationId`:**

```json
{
  "fullName": "Prima Nurdiansyah",
  "phone": "+6285864767275",
  "gender": "male",
  "maritalStatus": "single",
  "placeOfBirth": "Bandung",
  "dateOfBirth": "1995-05-15",
  "linkedinUrl": "https://linkedin.com/in/prima",
  "availability": "immediately",
  "addresses": [
    { "fullAddress": "Jl. Dago No. 123, Bandung" }
  ],
  "identities": [
    { "identityType": "KTP", "identityNumber": "3273012345678901" }
  ],
  "educations": [],
  "jobHistories": [],
  "projectHistories": []
}
```

**Response `POST /applicants/apply/:applicationId`:**

```json
{
  "responseCode": "200--00",
  "responseDesc": "Success",
  "data": {
    "applicant": { "id": "...", "fullName": "Prima Nurdiansyah" },
    "application": { "id": "...", "status": "applied", "appliedAt": "..." },
    "evaluationResult": {
      "maxExperienceScore": 0.382,
      "evaluatedAt": "2026-06-05T...",
      "scoringBreakdown": {
        "experiences": [
          {
            "role": "Full Stack Developer",
            "similarity": 0.382,
            "isTopMatch": true,
            "start": "01-2024",
            "end": "06-2026"
          }
        ],
        "educations": [
          { "level": 1, "major": "Teknik Informatika", "institution": "Politeknik TEDC" }
        ]
      }
    }
  }
}
```

---

### Candidates & Pemeringkatan (HR View)

Modul `candidates` adalah inti dari fitur **pemeringkatan dan seleksi kandidat** oleh HR. Data scoring dari FastAPI (SBERT semantic similarity) ditampilkan di sini sebagai dasar pengambilan keputusan rekrutmen.

#### Daftar Endpoint

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/candidates` | `[HR]` | List semua kandidat (semua vacancy, pagination) |
| `GET` | `/candidates/table` | `[HR]` | Tabel kandidat dengan sort by skor & filter lengkap |
| `GET` | `/candidates/summary` | `[HR]` | Statistik ringkasan pelamar |
| `GET` | `/candidates/stats` | `[HR]` | Statistik jumlah per status & stage |
| `GET` | `/candidates/compare?candidates=id1,id2,...` | `[HR]` | Komparasi beberapa kandidat sekaligus (maks 10) |
| `GET` | `/candidates/vacancy/:vacancyId` | `[HR]` | List kandidat per vacancy |
| `GET` | `/candidates/vacancy/:vacancyId/stages` | `[HR]` | Kandidat dikelompokkan per stage pipeline |
| `GET` | `/candidates/:applicationId` | `[HR]` | Detail kandidat + breakdown scoring lengkap |
| `GET` | `/candidates/:applicationId/hiring-progress` | `[HR]` | Progress perjalanan rekrutmen kandidat |
| `PATCH` | `/candidates/:applicationId/status` | `[HR]` | Update status kandidat |
| `PATCH` | `/candidates/:applicationId/move-stage` | `[HR]` | Pindahkan ke stage berikutnya |
| `PATCH` | `/candidates/:applicationId/score` | `[HR]` | Tambah/update skor manual HR |
| `PATCH` | `/candidates/:applicationId/talent-pool` | `[HR]` | Tandai/lepas dari talent pool |
| `POST` | `/candidates/:applicationId/notes` | `[HR]` | Tambah catatan HR untuk kandidat |
| `GET` | `/candidates/:applicationId/notes` | `[HR]` | List catatan HR untuk kandidat |
| `GET` | `/candidates/notes/:noteId` | `[HR]` | Detail catatan by ID |
| `PATCH` | `/candidates/notes/:noteId` | `[HR]` | Update catatan |
| `DELETE` | `/candidates/notes/:noteId` | `[HR]` | Hapus catatan |

---

#### `GET /candidates/table` — Tabel Pemeringkatan Utama

Endpoint ini adalah **tampilan utama pemeringkatan kandidat**. Mendukung sorting berdasarkan skor semantic similarity dari FastAPI.

**Query Parameters:**

| Param | Tipe | Default | Deskripsi |
|---|---|---|---|
| `page` | number | `1` | Halaman |
| `limit` | number | `10` | Item per halaman |
| `search` | string | - | Cari by nama, email, judul vacancy |
| `vacancyId` | string (UUID) | - | Filter by vacancy tertentu |
| `status` | string[] | - | Filter: `new`, `qualified`, `disqualified`, `talent-pool` |
| `jobStatus` | string[] | - | Filter by status vacancy: `published`, `closed` |
| `stage` | string[] (UUID) | - | Filter by stage template ID |
| `sortBy` | string | `applyDate` | Kolom sort: `applyDate`, `name`, `maxExperienceScore` |
| `sortOrder` | `asc` \| `desc` | `desc` | Urutan sort |

**Sorting by Skor (Pemeringkatan):**

Untuk menampilkan kandidat dari skor tertinggi ke terendah (peringkat terbaik di atas):

```
GET /candidates/table?vacancyId=<id>&sortBy=maxExperienceScore&sortOrder=desc
```

Kandidat tanpa skor (belum di-scoring) otomatis diletakkan paling bawah (`NULLS LAST`).

**Contoh Response:**

```json
{
  "responseCode": "200--00",
  "responseDesc": "Success",
  "data": [
    {
      "applicationId": "0b074fcf-...",
      "applicationNumber": "TECH-BE-00120266-001",
      "applicantId": "902fc889-...",
      "fullName": "Prima Nurdiansyah",
      "email": "prima@gmail.com",
      "phone": "+6285864767275",
      "vacancyTitle": "Backend Developer",
      "status": "applied",
      "currentStage": "Screening",
      "appliedAt": "2026-06-05T11:45:50.646Z",
      "maxExperienceScore": 0.382,
      "currentScore": null
    },
    {
      "applicationId": "...",
      "fullName": "Ridho Firdaus",
      "maxExperienceScore": 0.271,
      "currentScore": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

#### `GET /candidates/:applicationId` — Detail Kandidat + Breakdown Scoring

Menampilkan detail lengkap kandidat termasuk **breakdown similarity score per pengalaman kerja** yang diekstrak dari CV oleh FastAPI.

**Contoh Response:**

```json
{
  "responseCode": "200--00",
  "responseDesc": "Success",
  "data": {
    "applicationId": "0b074fcf-...",
    "applicationNumber": "TECH-BE-00120266-001",
    "status": "applied",
    "appliedAt": "2026-06-05T...",
    "vacancy": {
      "id": "6f395266-...",
      "title": "Backend Developer",
      "jobCode": "TECH-BE-002",
      "responsibilities": "Membangun dan memelihara REST API..."
    },
    "applicant": {
      "id": "902fc889-...",
      "fullName": "Prima Nurdiansyah",
      "email": "prima@gmail.com",
      "gender": "male",
      "dateOfBirth": "1995-05-15",
      "cvUrl": "applicants/cv/xxx.pdf"
    },
    "evaluationResult": {
      "maxExperienceScore": 0.382,
      "evaluatedAt": "2026-06-05T...",
      "breakdown": {
        "experience": [
          {
            "role": "Full Stack Developer",
            "description": "Mengembangkan REST API dan sistem backend...",
            "start": "01-2024",
            "end": "06-2026",
            "durationYears": 2,
            "similarityScore": 0.382,
            "isTopMatch": true
          },
          {
            "role": "Sistem Kafe (POS)",
            "description": "Aplikasi Point of Sale berbasis Go dan Next.js...",
            "similarityScore": 0.364,
            "isTopMatch": false
          }
        ],
        "education": [
          {
            "level": 2,
            "major": "Teknik Informatika",
            "institution": "Politeknik TEDC Bandung"
          }
        ]
      }
    },
    "hiringProgress": {
      "currentStage": "Screening",
      "totalStages": 4,
      "completedStages": 1
    }
  }
}
```

---

#### `GET /candidates/compare` — Komparasi Kandidat

Bandingkan beberapa kandidat sekaligus untuk memudahkan keputusan seleksi. Maksimal 10 kandidat.

```
GET /candidates/compare?candidates=uuid1,uuid2,uuid3
Authorization: Bearer <hr-token>
```

**Contoh Response:**

```json
{
  "data": [
    {
      "applicationId": "uuid1",
      "fullName": "Prima Nurdiansyah",
      "score": 0.382,
      "currentStage": "Screening",
      "progress": { "overallScore": 0.382, "stages": [] },
      "info": {
        "education": { "level": 2, "major": "Teknik Informatika" },
        "jobHistory": [{ "position": "Full Stack Developer", "durationYears": 2 }]
      }
    },
    {
      "applicationId": "uuid2",
      "fullName": "Ridho Firdaus",
      "score": 0.271,
      "currentStage": "Screening"
    }
  ]
}
```

---

#### `PATCH /candidates/:applicationId/move-stage` — Pindah Stage

Setelah HR meninjau, kandidat dapat dipindahkan ke stage berikutnya. Skor manual per stage dapat ditambahkan.

```json
{
  "notes": "Kandidat lolos screening, jadwalkan interview",
  "score": 80
}
```

Sistem akan menghitung `currentScore` secara otomatis sebagai **rata-rata semua skor stage** yang telah dilalui.

---

#### `PATCH /candidates/:applicationId/status` — Update Status

```json
{
  "status": "hired",
  "notes": "Kandidat terbaik, offer letter sudah dikirim"
}
```

**Nilai status yang valid:** `applied`, `in_review`, `shortlisted`, `hired`, `rejected`

---

#### Alur Pemeringkatan di Sistem

```
Pelamar submit CV
       │
FastAPI parsing → Hitung similarity score per pengalaman kerja (SBERT)
       │
Simpan maxExperienceScore ke evaluation_results
       │
HR buka GET /candidates/table
  ?vacancyId=xxx&sortBy=maxExperienceScore&sortOrder=desc
       │
┌──────┴────────────────────────────────────────┐
│  Peringkat  │  Nama            │  Skor        │
│─────────────┼──────────────────┼──────────────│
│  #1         │  Prima N.        │  0.382  ⭐   │
│  #2         │  Ridho F.        │  0.271       │
│  #3         │  Naufal H.       │  0.203       │
└──────────────────────────────────────────────┘
       │
HR review detail → GET /candidates/:applicationId
  (lihat breakdown per pengalaman kerja)
       │
HR pindah stage → PATCH /candidates/:applicationId/move-stage
       │
HR set keputusan → PATCH /candidates/:applicationId/status
  { "status": "hired" / "rejected" }
```

---

## Integrasi FastAPI Screening Service

Service ini terintegrasi dengan **FastAPI Screening Service** untuk parsing CV dan scoring otomatis.

### Endpoint yang Dipanggil

```
POST http://localhost:8000/parse-and-evaluate/
Content-Type: multipart/form-data

Fields:
  cv_file              : file PDF/DOC CV pelamar
  application_id       : UUID application
  job_responsibilities : teks responsibilities dari vacancy
```

### Response FastAPI

```json
{
  "application_id": "uuid",
  "educations": [
    { "level": 3, "major": "Teknik Informatika", "institution": "Universitas X" }
  ],
  "experience": [
    {
      "role": "Backend Developer",
      "description": "Mengembangkan REST API...",
      "start": "01-2024",
      "end": "06-2026",
      "duration_years": 2,
      "similarity": 0.382
    }
  ]
}
```

### Alur Scoring

```
applyForPosition()
    │
    ├─ [1] Ambil CV buffer dari MinIO
    ├─ [2] POST ke FastAPI /parse-and-evaluate/
    │        └─ Timeout: 120 detik
    ├─ [3] Jika FastAPI gagal → throw error → apply ditolak
    ├─ [4] Jika berhasil → lanjut transaksi DB
    └─ [5] Simpan ke evaluation_results, applicant_educations, applicant_job_histories
```

### Konfigurasi FastAPI di `.env`

```env
FASTAPI_BASE_URL=http://localhost:8000
```

Untuk FastAPI Screening Service, pastikan:
- File `screening-service/.env` memiliki konfigurasi model LLM (Groq/Ollama)
- Service berjalan di port `8000` sebelum endpoint apply dipanggil

---

## Pengujian dengan Postman

### Setup Token HR

Token HR tidak perlu ada di database. Gunakan UUID apapun:

```
Authorization: Bearer 805dcf99-dcce-476b-a4c0-9dd674ec7fa4
```

UUID ini akan tersimpan sebagai `created_by` di setiap record yang dibuat.

### Urutan Pengujian End-to-End

```
1.  GET  /recruitment-pipelines/default-template    [HR token]
2.  POST /recruitment-pipelines                      [HR token]  ← jika belum ada template
3.  POST /vacancies                                  [HR token]  → dapat vacancyId
4.  PUT  /vacancies/:vacancyId                       [HR token]  → isi detail
5.  PUT  /vacancies/:vacancyId  { status: published }[HR token]  → publish
6.  GET  /public/vacancies                           [no token]  → verifikasi publik
7.  POST /applicants/register   { vacancyId }        [no token]  → dapat applicantId
8.  POST /applicants/validate-login-token            [no token]  → konfirmasi token email
9.  POST /applicants/upload-cv  (form-data)          [no token]  → upload CV
10. GET  /applicants/me?applicantId=                 [no token]  → dapat applicationId
11. POST /applicants/apply/:applicationId            [no token]  → submit + scoring
```

### Verifikasi Database Setelah Apply

```sql
-- Cek hasil scoring
SELECT application_id, "maxExperienceScore", "evaluatedAt"
FROM evaluation_results
WHERE application_id = '<applicationId>';

-- Cek riwayat pekerjaan dari CV parser
SELECT * FROM applicant_job_histories
WHERE "applicantId" = '<applicantId>';

-- Cek pendidikan dari CV parser
SELECT * FROM applicant_educations
WHERE "applicantId" = '<applicantId>';

-- Cek CV snapshot terbuat
SELECT "fileName", "relatedEntity", "relatedEntityId"
FROM files
WHERE "relatedEntity" = 'application'
  AND "relatedEntityId" = '<applicationId>';
```

---

## Format Response

Semua endpoint menggunakan format response yang konsisten:

```json
{
  "responseCode": "200--00",
  "responseDesc": "Success",
  "data": { }
}
```

| responseCode | Keterangan |
|---|---|
| `200--00` | Success |
| `201--00` | Successfully Created |
| `400--00` | Bad Request |
| `401--01` | Unauthorized Auth |
| `404--00` | Not Found |
| `500--00` | Internal Server Error |

---

## Status Aplikasi

| Status | Keterangan |
|---|---|
| `new` | Application baru dibuat saat register |
| `applied` | Pelamar sudah submit data + scoring selesai |
| `in_review` | Sedang ditinjau HR |
| `passed` | Lolos ke tahap berikutnya |
| `rejected` | Ditolak |

---

## Status Vacancy

| Status | Keterangan |
|---|---|
| `draft` | Masih dalam pengerjaan, tidak terlihat publik |
| `published` | Aktif dan terlihat di `/public/vacancies` |
| `closed` | Pendaftaran ditutup |
| `archived` | Diarsipkan |

---

*Sistem Rekrutmen dengan Pemeringkatan Pelamar Bendasarkan Kesesuaian Pengalaman Kerja Berbasis Semantic Similarity.*