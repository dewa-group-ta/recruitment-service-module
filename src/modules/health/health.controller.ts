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
      message: "Halo dari AWS EC2 Jakarta — Sistem Rekrutmen Cerdas",
      tagline:
        "Platform rekrutmen berbasis AI yang menghubungkan talenta terbaik dengan peluang yang tepat.",
      service: "Recruitment Service",
      region: `AWS EC2 Jakarta (${process.env.AWS_REGION ?? "ap-southeast-3"})`,
      environment: process.env.NODE_ENV ?? "production",
      cicd: {
        description:
          "Setiap perubahan kode di-deploy otomatis ke AWS tanpa downtime melalui pipeline CI/CD.",
        pipeline: "GitHub Actions",
        flow: [
          "Push ke GitHub -> Automated testing -> Docker image build",
          "Image push ke GitHub Container Registry (GHCR)",
          "SSH deploy ke EC2 -> Container restart -> Live"
        ],
        stack: {
          backend: "NestJS (TypeScript) + FastAPI (Python)",
          ai: "SBERT Semantic Matching",
          database: "PostgreSQL 17",
          storage: "AWS S3",
          infra: "Docker Compose on EC2 t3.medium",
          registry: "GitHub Container Registry"
        }
      },
      deployment: {
        deployedAt: DEPLOY_TIME,
        uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        currentTime: new Date().toISOString()
      },
      callToAction: {
        quickApply: {
          method: "POST",
          endpoint: "/applicants/quick-apply",
          description:
            "Lamar lowongan sekarang. Unggah CV Anda dan sistem AI kami akan mencocokkan profil Anda secara otomatis."
        },
        exploreVacancies: {
          method: "GET",
          endpoint: "/public/vacancies",
          description:
            "Temukan lowongan yang sesuai dengan keahlian dan pengalaman Anda."
        },
        aiScreening: {
          description:
            "CV Anda dianalisis secara semantik menggunakan model SBERT dan Groq LLM untuk menghasilkan skor kesesuaian yang akurat dan objektif."
        }
      },
      status: "All systems operational"
    };
  }
}
