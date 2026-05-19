import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth
} from "@nestjs/swagger";
import { ApplicantResultsService } from "../services/applicant-results.service";
import {
  CvDocumentResponseDto,
  EvaluationResultResponseDto,
  UpdateDecisionDto
} from "../dto";
import { ResponseMessage } from "../../../shared/decorators/response.decorator";
import { responseMessage } from "../../../shared/utils/constant";
import { IsRole } from "../../../shared/decorators/roles.decorator";
import { role } from "../../../shared/utils/constant";

@ApiTags("Applicant Results")
@ApiBearerAuth()
@Controller("applicant-results")
export class ApplicantResultsController {
  constructor(
    private readonly applicantResultsService: ApplicantResultsService
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // GET /applicant-results/:applicationId/cv
  // ─────────────────────────────────────────────────────────────────────────

  @Get(":applicationId/cv")
  @HttpCode(HttpStatus.OK)
  @IsRole(role.HR)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get CV parsing result",
    description:
      "Mengambil hasil parsing CV untuk suatu lamaran: nama pelamar, " +
      "daftar skill (digunakan Jaccard similarity), dan waktu parsing. " +
      "Data riwayat pendidikan dan pengalaman tersedia via profil pelamar."
  })
  @ApiParam({
    name: "applicationId",
    description: "UUID lamaran",
    example: "550e8400-e29b-41d4-a716-446655440000"
  })
  @ApiResponse({
    status: 200,
    description: "Hasil CV berhasil diambil",
    type: CvDocumentResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Hasil CV belum tersedia — scoring belum selesai atau belum dimulai"
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized — token tidak valid atau tidak ditemukan"
  })
  async getCvResult(
    @Param("applicationId", ParseUUIDPipe) applicationId: string
  ): Promise<CvDocumentResponseDto> {
    return this.applicantResultsService.getCvResult(applicationId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /applicant-results/:applicationId/evaluation
  // ─────────────────────────────────────────────────────────────────────────

  @Get(":applicationId/evaluation")
  @HttpCode(HttpStatus.OK)
  @IsRole(role.HR)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get evaluation / scoring result",
    description:
      "Mengambil hasil scoring WSM beserta breakdown lengkap per komponen " +
      "(pendidikan, pengalaman, skill) dan keputusan rekruter jika sudah ditetapkan. " +
      "Bobot WSM: Pendidikan 20% · Pengalaman 50% · Skill 30%."
  })
  @ApiParam({
    name: "applicationId",
    description: "UUID lamaran",
    example: "550e8400-e29b-41d4-a716-446655440000"
  })
  @ApiResponse({
    status: 200,
    description: "Hasil evaluasi berhasil diambil",
    type: EvaluationResultResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "Hasil evaluasi belum tersedia — scoring belum selesai atau belum dimulai"
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized — token tidak valid atau tidak ditemukan"
  })
  async getEvaluationResult(
    @Param("applicationId", ParseUUIDPipe) applicationId: string
  ): Promise<EvaluationResultResponseDto> {
    return this.applicantResultsService.getEvaluationResult(applicationId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /applicant-results/:applicationId/decision
  // ─────────────────────────────────────────────────────────────────────────

  @Patch(":applicationId/decision")
  @HttpCode(HttpStatus.OK)
  @IsRole(role.HR)
  @ResponseMessage(responseMessage.SUCCESSFULLY_UPDATED)
  @ApiOperation({
    summary: "Set recruiter decision",
    description:
      "Menetapkan keputusan rekruter secara manual: 'lolos' atau 'tidak_lolos'. " +
      "Sesuai BR-09: keputusan tidak ditetapkan otomatis oleh sistem — " +
      "rekruter wajib meninjau hasil scoring sebelum memutuskan."
  })
  @ApiParam({
    name: "applicationId",
    description: "UUID lamaran",
    example: "550e8400-e29b-41d4-a716-446655440000"
  })
  @ApiResponse({
    status: 200,
    description: "Keputusan berhasil disimpan",
    type: EvaluationResultResponseDto
  })
  @ApiResponse({
    status: 400,
    description: "Bad request — nilai decision tidak valid"
  })
  @ApiResponse({
    status: 404,
    description: "Hasil evaluasi tidak ditemukan untuk lamaran ini"
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized — token tidak valid atau tidak ditemukan"
  })
  async updateDecision(
    @Param("applicationId", ParseUUIDPipe) applicationId: string,
    @Body() dto: UpdateDecisionDto
  ): Promise<EvaluationResultResponseDto> {
    return this.applicantResultsService.updateDecision(applicationId, dto);
  }
}