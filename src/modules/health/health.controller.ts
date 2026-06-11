import { Controller, Get } from "@nestjs/common";
import { Public } from "src/shared/decorators/public.decorator";

const DEPLOY_TIME = new Date().toISOString();

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Public()
  @Get("cicd")
  cicd() {
    const uptime = Math.floor(process.uptime());
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    return {
      message: "Halo dari AWS - Sistem Rekrutmen Cerdas Siap Digunakan!",
      tagline:
        "Dari kode ke cloud dalam hitungan menit, otomatis, andal, dan terukur.",
      service: "Recruitment Service (NestJS)",
      region: `AWS EC2 Jakarta (${process.env.AWS_REGION ?? "ap-southeast-3"})`,
      environment: process.env.NODE_ENV ?? "production",
      cicd: {
        headline:
          "Setiap push kode langsung live di AWS tanpa intervensi manual.",
        pipeline: "GitHub Actions",
        steps: [
          "1. Push ke GitHub  ->  CI/CD otomatis terpicu",
          "2. Unit test dijalankan  ->  Build Docker image",
          "3. Image di-push ke GHCR  ->  Deploy via SSH ke EC2",
          "4. Container berjalan  ->  Endpoint ini aktif kembali"
        ],
        stack: {
          backend: "NestJS (TypeScript) + FastAPI (Python + SBERT + Groq AI)",
          database: "PostgreSQL 17",
          storage: "AWS S3 (ap-southeast-3)",
          infra: "Docker Compose on EC2 t3.medium",
          registry: "GitHub Container Registry (GHCR)"
        }
      },
      deployment: {
        deployedAt: DEPLOY_TIME,
        uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        currentTime: new Date().toISOString()
      },
      callToAction: {
        applyNow:
          "POST /applicants/quick-apply  ->  Upload CV dan lamar lowongan dalam satu langkah",
        aiScreening:
          "CV Anda dianalisis otomatis oleh AI menggunakan SBERT semantic matching dan Groq LLM",
        viewVacancies:
          "GET /public/vacancies  ->  Lihat semua lowongan yang tersedia"
      },
      status: "All systems operational - NestJS, FastAPI, PostgreSQL, S3"
    };
  }
}
