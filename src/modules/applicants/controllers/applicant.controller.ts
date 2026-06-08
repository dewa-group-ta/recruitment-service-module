import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Get,
  Delete,
  Param,
  Patch,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
  UnauthorizedException
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes
} from "@nestjs/swagger";
import { ApplicantService } from "../services/applicant.service";
import { TokenService } from "../services/token.service";
import { RegisterApplicantDto } from "../dto/register-applicant.dto";
import { QuickApplyDto } from "../dto/quick-apply.dto";
import { LoginDto } from "../dto/login.dto";
import { ResponseMessage } from "../../../shared/decorators/response.decorator";
import { Public } from "../../../shared/decorators/public.decorator";
import { responseMessage, role } from "src/shared/utils/constant";
import { IsRole } from "src/shared/decorators/roles.decorator";
import { MeResponseDto } from "../dto/me-response.dto";
import { UpdateApplicantProfileDto } from "../dto/update-applicant-profile.dto";
import { FileInterceptor, FileFieldsInterceptor } from "@nestjs/platform-express";
import { FileUploadService } from "../../../shared/services/file-upload.service";
import { FileValidationPipe } from "../../../shared/pipes/file-validation.pipe";
import { FileType } from "../../../shared/entities/file.entity";
import { AuthenticatedRequest } from "src/shared/interface";
import { FileUploadDto } from "../../../shared/dto/file-upload.dto";
import { ValidateTokenDto } from "../dto/validate-token.dto";
import { ApplyApplicantDto } from "../dto/apply-applicant.dto";
import { ApplicationTrackingResponseDto } from "../dto/application-tracking-response.dto";

@ApiTags("Applicants")
@Controller("applicants")
export class ApplicationController {
  constructor(
    private readonly applicantService: ApplicantService,
    private readonly tokenService: TokenService,
    private readonly fileUploadService: FileUploadService
  ) {}

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({
    summary: "Register as applicant",
    description:
      "Register as a new applicant in the recruitment system. Creates applicant profile and sends login token."
  })
  @ApiBody({
    type: RegisterApplicantDto,
    description: "Applicant registration data including personal information"
  })
  @ApiResponse({
    status: 201,
    description: "Applicant registered successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESSFULLY_CREATED.caseCode,
        responseDesc: "Applicant registered successfully",
        data: { applicantId: "uuid-string", applicationId: "uuid-string" }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input or applicant already exists",
    schema: {
      example: {
        responseCode: responseMessage.BAD_REQUEST.caseCode,
        responseDesc: "Applicant with this email already exists",
        data: null
      }
    }
  })
  async registerApplicant(
    @Body() registerDto: RegisterApplicantDto
  ): Promise<{ applicantId: string; applicationId: string }> {
    const result = await this.applicantService.registerApplicant(registerDto);
    return result;
  }

  @Public()
  @Post("quick-apply")
  @UseInterceptors(FileFieldsInterceptor([
    { name: "cv",    maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]))
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESSFULLY_CREATED)
  @ApiOperation({
    summary: "Quick Apply — single endpoint",
    description: "Submit a job application in one request: profile data + CV (required) + photo (optional). No authentication required."
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["cv", "vacancyId", "fullName", "email", "phone", "gender", "maritalStatus", "placeOfBirth", "dateOfBirth"],
      properties: {
        cv:            { type: "string", format: "binary", description: "CV file (PDF, DOC, DOCX) — max 5 MB" },
        photo:         { type: "string", format: "binary", description: "Profile photo (JPG, PNG) — max 2 MB, optional" },
        vacancyId:     { type: "string", format: "uuid" },
        fullName:      { type: "string" },
        email:         { type: "string", format: "email" },
        phone:         { type: "string" },
        gender:        { type: "string", enum: ["male", "female", "other"] },
        maritalStatus: { type: "string", enum: ["single", "married", "divorced", "widowed"] },
        placeOfBirth:  { type: "string" },
        dateOfBirth:   { type: "string", example: "1998-01-15" },
        address:       { type: "string" },
      }
    }
  })
  @ApiResponse({ status: 201, description: "Application submitted and scored successfully" })
  @ApiResponse({ status: 400, description: "Validation error, duplicate application, or scoring failure" })
  async quickApply(
    @UploadedFiles() files: { cv?: Express.Multer.File[]; photo?: Express.Multer.File[] },
    @Body() dto: QuickApplyDto
  ) {
    const cv    = files?.cv?.[0];
    const photo = files?.photo?.[0];

    if (!cv) throw new BadRequestException("CV file is required");

    // Validate CV
    new FileValidationPipe({
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: ["application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      allowedExtensions: ["pdf", "doc", "docx"]
    }).transform(cv);

    // Validate photo if provided
    if (photo) {
      new FileValidationPipe({
        maxSize: 2 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        allowedExtensions: ["jpg", "jpeg", "png", "webp"]
      }).transform(photo);
    }

    return this.applicantService.quickApply(dto, cv, photo);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Request login token",
    description:
      "Generate and send a login token to the applicant's email address. Rate limited to 1 request per minute per email."
  })
  @ApiBody({
    type: LoginDto,
    description: "Email address to send login token"
  })
  @ApiResponse({
    status: 200,
    description: "Login token sent successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Login token sent successfully",
        data: {
          message: "Login token has been sent to your email address",
          email: "john.doe@example.com"
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: "Invalid email, applicant not found, or rate limit exceeded",
    schema: {
      examples: {
        "Applicant not found": {
          summary: "Applicant not found",
          value: {
            responseCode: responseMessage.BAD_REQUEST.caseCode,
            responseDesc: "Applicant not found with this email address",
            data: null
          }
        },
        "Rate limit exceeded": {
          summary: "Rate limit exceeded",
          value: {
            responseCode: responseMessage.BAD_REQUEST.caseCode,
            responseDesc:
              "Please wait 45 seconds before requesting another login token",
            data: null
          }
        }
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    try {
      await this.tokenService.generateAndSendLoginTokenByEmail(loginDto.email);

      return {
        message: "Login token has been sent to your email address",
        email: loginDto.email
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new BadRequestException(errorMessage);
    }
  }

  @Public()
  @Post("validate-login-token")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Validate token",
    description: "Validate the token and return the applicant ID"
  })
  @ApiBody({
    type: ValidateTokenDto,
    description: "Token to validate"
  })
  @ApiResponse({
    status: 200,
    description: "Token validated successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Token validated successfully",
        data: { applicantId: "123" }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: "Invalid token",
    schema: {
      example: {
        responseCode: responseMessage.BAD_REQUEST.caseCode,
        responseDesc: "Invalid token",
        data: null
      }
    }
  })
  async validateLoginToken(
    @Body() validateTokenDto: ValidateTokenDto,
    @Req() request: AuthenticatedRequest
  ) {
    return await this.tokenService.validateLoginToken(
      validateTokenDto.token,
      request.ip,
      request.headers["user-agent"]
    );
  }

  @Public()
  @Post("validate-token")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Validate token",
    description: "Validate the token and return the applicant ID"
  })
  @ApiBody({
    type: ValidateTokenDto,
    description: "Token to validate"
  })
  @ApiResponse({
    status: 200,
    description: "Token validated successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Token validated successfully",
        data: { applicantId: "123" }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: "Invalid token",
    schema: {
      example: {
        responseCode: responseMessage.BAD_REQUEST.caseCode,
        responseDesc: "Invalid token",
        data: null
      }
    }
  })
  async validateToken(@Body() validateTokenDto: ValidateTokenDto) {
    return await this.tokenService.validateToken(validateTokenDto.token);
  }

  @Get("me")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current applicant profile",
    description:
      "Retrieve the authenticated applicant's profile information including personal details, applications, and related data."
  })
  @ApiResponse({
    status: 200,
    description: "Applicant profile retrieved successfully",
    type: MeResponseDto
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    schema: {
      example: {
        responseCode: responseMessage.UNAUTHORIZED_AUTH.caseCode,
        responseDesc: "Unauthorized access",
        data: null
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: "Applicant not found",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "Applicant not found",
        data: null
      }
    }
  })
  // ─── LAMA (membutuhkan JWT auth via @IsRole) ──────────────────────────────
  // @Get("me")
  // @HttpCode(HttpStatus.OK)
  // @ResponseMessage(responseMessage.SUCCESS)
  // @ApiBearerAuth()
  // @IsRole(role.APPLICANT)
  // async getMe(@Req() request: AuthenticatedRequest) {
  //   const applicantId = request.applicantId;
  //   const applicant = await this.applicantService.getMe(applicantId);
  //   console.log(applicant);
  //   return applicant;
  // }
  // ─────────────────────────────────────────────────────────────────────────

  // BARU: tidak memerlukan autentikasi — applicantId dikirim oleh frontend
  //       sebagai query param (diperoleh dari hasil validate-token).
  @Public()
  @Get("me")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Get current applicant profile",
    description:
      "Retrieve the applicant's profile. Pass applicantId (obtained from validate-token) as query param — no JWT required."
  })
  @ApiResponse({
    status: 200,
    description: "Applicant profile retrieved successfully",
    type: MeResponseDto
  })
  @ApiResponse({
    status: 400,
    description: "Missing applicantId query param"
  })
  @ApiResponse({
    status: 404,
    description: "Applicant not found"
  })
  async getMe(
    @Query("applicantId") applicantId: string
  ) {
    if (!applicantId) {
      throw new BadRequestException("applicantId query param is required");
    }
    const applicant = await this.applicantService.getMe(applicantId);
    console.log(applicant);
    return applicant;
  }

  @Get("me/application-tracking")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get application tracking information",
    description:
      "Retrieve the tracking information for the latest application including stages, progress, and current status."
  })
  @ApiResponse({
    status: 200,
    description: "Application tracking retrieved successfully",
    type: ApplicationTrackingResponseDto
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    schema: {
      example: {
        responseCode: responseMessage.UNAUTHORIZED_AUTH.caseCode,
        responseDesc: "Unauthorized access",
        data: null
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: "No application found for this applicant",
    schema: {
      example: {
        responseCode: responseMessage.NOT_FOUND.caseCode,
        responseDesc: "No application found for this applicant",
        data: null
      }
    }
  })
  @IsRole(role.APPLICANT)
  async getApplicationTracking(@Req() request: AuthenticatedRequest) {
    const applicantId = request.applicantId;
    const trackingData =
      await this.applicantService.getApplicationTracking(applicantId);
    return trackingData;
  }

  // ========== PROFILE MANAGEMENT ==========

  @Patch("profile")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update applicant profile",
    description:
      "Update the authenticated applicant's profile information including personal details."
  })
  @ApiBody({
    type: UpdateApplicantProfileDto,
    description: "Profile update data"
  })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Profile updated successfully",
        data: {}
      }
    }
  })
  @IsRole(role.APPLICANT)
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() updateDto: UpdateApplicantProfileDto
  ) {
    const applicantId = request.applicantId;
    const applicant = await this.applicantService.updateProfile(
      applicantId,
      updateDto
    );
    return applicant;
  }

  // ========== FILE UPLOAD ==========

  @Post("upload-photo")
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Upload applicant photo",
    description:
      "Upload profile photo for the authenticated applicant. Maximum file size: 2MB. Supported formats: JPG, PNG, GIF, WEBP."
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Image file (JPG, PNG, GIF, WEBP) - Max 2MB"
        },
        description: {
          type: "string",
          description: "Optional description for the photo"
        }
      },
      required: ["file"]
    }
  })
  @ApiResponse({
    status: 200,
    description: "Photo uploaded successfully",
    schema: {
      example: {
        responseCode: 200,
        responseDesc: "Photo uploaded successfully",
        data: {
          id: "uuid",
          fileName: "generated-filename.jpg",
          originalName: "profile-photo.jpg",
          filePath: "applicants/photos/generated-filename.jpg",
          fileSize: 1024000,
          mimeType: "image/jpeg",
          fileType: "photo",
          description: "Profile photo",
          url: "https://minio.example.com/presigned-url",
          uploadedAt: "2024-01-01T00:00:00.000Z"
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid file or validation error",
    schema: {
      example: {
        responseCode: 400,
        responseDesc: "File validation failed: File size exceeds 2MB limit",
        data: null
      }
    }
  })
  @IsRole(role.APPLICANT)
  async uploadPhoto(
    @Req() request: AuthenticatedRequest,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp"
        ],
        allowedExtensions: ["jpg", "jpeg", "png", "gif", "webp"]
      })
    )
    file: Express.Multer.File,
    @Body() uploadDto: Partial<FileUploadDto>
  ) {
    try {
      const applicantId = request.applicantId;

      const fileUploadData: FileUploadDto = {
        fileType: FileType.PHOTO,
        description: uploadDto.description,
        folder: "applicants/photos",
        relatedEntity: "applicant",
        relatedEntityId: applicantId
      };

      // delete old photo if exists
      const oldPhoto = await this.applicantService.getMe(applicantId);
      if (oldPhoto.photoUrl) {
        try {
          await this.fileUploadService.deleteFileByPath(oldPhoto.photoUrl);
        } catch (error) {
          console.error("Error deleting old photo:", error);
        }
      }

      const result = await this.fileUploadService.uploadFile(
        file,
        fileUploadData,
        applicantId
      );

      await this.applicantService.updateProfile(applicantId, {
        photoUrl: result.filePath
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new BadRequestException(`Photo upload failed: ${errorMessage}`);
    }
  }

  // =============================================================================
// FILE: applicant.controller.ts
//
// Satu perubahan di file ini:
//
//  1. uploadCV  → tambah pengecekan snapshot sebelum menghapus CV lama dari MinIO
//
// Ganti seluruh method uploadCV yang lama dengan versi di bawah ini.
// Tidak ada perubahan di bagian lain controller.
// =============================================================================
 
// -----------------------------------------------------------------------------
// PERUBAHAN: uploadCV
//
// Yang ditambahkan:
//   - Sebelum menghapus file CV lama dari MinIO, cek dulu apakah ada
//     application-level snapshot yang masih mereferensikan path tersebut.
//   - Jika masih ada snapshot (artinya ada lamaran yang memakai CV itu),
//     file fisik di MinIO TIDAK dihapus — hanya record di level applicant
//     yang akan di-replace oleh FileUploadService saat upload baru.
//   - Jika tidak ada snapshot, aman dihapus seperti sebelumnya.
//
// Mengapa penting:
//   Saat applyForPosition dipanggil, dibuat snapshot File dengan
//   relatedEntity='application' yang menunjuk ke path MinIO yang sama.
//   Jika file fisik di-delete, scoring service tidak bisa download CV itu
//   lagi — dan tampilan "CV yang dipakai saat melamar" di HR dashboard
//   akan rusak untuk lamaran-lamaran sebelumnya.
// -----------------------------------------------------------------------------
 
// ─── LAMA (membutuhkan JWT auth via @IsRole) ──────────────────────────────
// @Post("upload-cv")
// ...
// @IsRole(role.APPLICANT)
// async uploadCV(
//   @Req() request: AuthenticatedRequest,
//   @UploadedFile(...) file: Express.Multer.File,
//   @Body() uploadDto: Partial<FileUploadDto>
// ) {
//   const applicantId = request.applicantId;
//   ...
// }
// ─────────────────────────────────────────────────────────────────────────

// BARU: tidak memerlukan autentikasi — applicantId dikirim bersama
//       multipart form-data (diperoleh frontend dari hasil validate-token).
@Public()
@Post("upload-cv")
@UseInterceptors(FileInterceptor("file"))
@HttpCode(HttpStatus.OK)
@ResponseMessage(responseMessage.SUCCESS)
@ApiOperation({
  summary: "Upload CV file",
  description:
    "Upload CV file for the applicant. Pass applicantId (obtained from validate-token) in the form body — no JWT required. Maximum file size: 5MB. Supported formats: PDF, DOC, DOCX."
})
@ApiConsumes("multipart/form-data")
@ApiBody({
  schema: {
    type: "object",
    properties: {
      file: {
        type: "string",
        format: "binary",
        description: "CV file (PDF, DOC, DOCX) - Max 5MB"
      },
      applicantId: {
        type: "string",
        format: "uuid",
        description: "Applicant ID obtained from validate-token"
      },
      description: {
        type: "string",
        description: "Optional description for the CV"
      }
    },
    required: ["file", "applicantId"]
  }
})
@ApiResponse({
  status: 200,
  description: "CV uploaded successfully"
})
@ApiResponse({
  status: 400,
  description: "Bad request - Invalid file, missing applicantId, or validation error"
})
async uploadCV(
  @UploadedFile(
    new FileValidationPipe({
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ],
      allowedExtensions: ["pdf", "doc", "docx"]
    })
  )
  file: Express.Multer.File,
  @Body() uploadDto: Partial<FileUploadDto> & { applicantId?: string }
) {
  try {
    const applicantId = uploadDto.applicantId;
    if (!applicantId) {
      throw new BadRequestException("applicantId is required in the form body");
    }

    const fileUploadData: FileUploadDto = {
      fileType:        FileType.CV,
      description:     uploadDto.description,
      folder:          "applicants/cv",
      relatedEntity:   "applicant",
      relatedEntityId: applicantId
    };

    // Ambil profil pelamar untuk mendapatkan path CV lama (jika ada)
    const currentProfile = await this.applicantService.getMe(applicantId);
    const oldCvPath = currentProfile.cvUrl ?? null;

    if (oldCvPath) {
      // ── Pengecekan sebelum menghapus file lama dari MinIO ──────────────
      //
      // CV lama boleh dihapus dari MinIO HANYA jika tidak ada
      // application-level snapshot yang masih mereferensikan path ini.
      //
      // Snapshot dibuat di applyForPosition saat pelamar submit lamaran —
      // tujuannya agar CV yang dipakai untuk scoring per lamaran bisa
      // ditelusuri secara permanen, terlepas dari perubahan CV di masa depan.
      //
      // Jika ada snapshot aktif:
      //   - File fisik di MinIO DIBIARKAN (snapshot masih valid)
      //   - Record File di level 'applicant' akan di-replace oleh uploadFile()
      //
      // Jika tidak ada snapshot:
      //   - File fisik di MinIO dihapus (tidak ada lamaran yang bergantung)
      //   - Record File di level 'applicant' akan di-replace oleh uploadFile()
      const isStillUsed = await this.applicantService.isReferencedByApplication(oldCvPath);

      if (!isStillUsed) {
        // Aman dihapus — tidak ada lamaran yang masih memakai file ini
        try {
          await this.fileUploadService.deleteFileByPath(oldCvPath);
        } catch (error) {
          // Log saja, jangan gagalkan upload karena masalah hapus file lama
          console.error("Error deleting old CV from storage:", error);
        }
      }
      // Jika isStillUsed = true, tidak ada yang dilakukan di sini.
      // File fisik di MinIO tetap ada. Record File di applicant level
      // akan di-replace oleh fileUploadService.uploadFile() di bawah.
      // ──────────────────────────────────────────────────────────────────
    }

    // Upload file baru ke MinIO dan simpan record File baru di database
    const result = await this.fileUploadService.uploadFile(
      file,
      fileUploadData,
      applicantId
    );

    // Update kolom cvUrl di profil pelamar ke path CV terbaru
    await this.applicantService.updateProfile(applicantId, {
      cvUrl: result.filePath
    });

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new BadRequestException(`CV upload failed: ${errorMessage}`);
  }
}

  @Post("upload-diploma")
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Upload diploma file",
    description:
      "Upload diploma/certificate file for the authenticated applicant"
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary"
        },
        description: {
          type: "string"
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: "Diploma file uploaded successfully"
  })
  @IsRole(role.APPLICANT)
  async uploadDiploma(
    @Req() request: AuthenticatedRequest,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
        allowedExtensions: ["pdf", "jpg", "jpeg", "png"]
      })
    )
    file: Express.Multer.File,
    @Body() uploadDto: Partial<FileUploadDto>
  ): Promise<FileUploadDto> {
    const applicantId = request.applicantId;

    const fileUploadData: FileUploadDto = {
      fileType: FileType.CERTIFICATE,
      description: uploadDto.description,
      folder: "applicants/diplomas",
      relatedEntity: "applicant",
      relatedEntityId: applicantId
    };

    const result = await this.fileUploadService.uploadFile(
      file,
      fileUploadData,
      applicantId
    );

    return result;
  }

  @Get("files")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get applicant files",
    description: "Get all files uploaded by the authenticated applicant"
  })
  @ApiResponse({
    status: 200,
    description: "Files retrieved successfully"
  })
  @IsRole(role.APPLICANT)
  async getMyFiles(@Req() request: AuthenticatedRequest) {
    const applicantId = request.applicantId;
    const files = await this.fileUploadService.getFilesByEntity(
      "applicant",
      applicantId
    );

    return files;
  }

  @Delete("files/:fileId")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete file",
    description: "Delete a file uploaded by the authenticated applicant"
  })
  @ApiParam({
    name: "fileId",
    description: "File ID to delete",
    type: "string",
    format: "uuid"
  })
  @ApiResponse({
    status: 200,
    description: "File deleted successfully"
  })
  @IsRole(role.APPLICANT)
  async deleteFile(
    @Req() request: AuthenticatedRequest,
    @Param("fileId", ParseUUIDPipe) fileId: string
  ) {
    const applicantId = request.applicantId;

    // Validate that the file belongs to the authenticated applicant
    await this.fileUploadService.validateFileOwnership(fileId, applicantId);

    await this.fileUploadService.deleteFile(fileId);

    return null;
  }

  // ========== APPLICATION MANAGEMENT ==========

  // ─── LAMA (membutuhkan JWT auth) ─────────────────────────────────────────
  // @ApiBearerAuth()
  // @IsRole(role.APPLICANT)
  // ─────────────────────────────────────────────────────────────────────────
  // BARU: tidak memerlukan autentikasi — applicationId di URL sudah cukup.
  @Public()
  @Post("apply/:applicationId")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @ApiOperation({
    summary: "Apply for position",
    description:
      "Update applicant data and change application status to applied. Only works for applications with status 'new'. No JWT required."
  })
  @ApiParam({
    name: "applicationId",
    description: "Application ID",
    type: "string",
    format: "uuid"
  })
  @ApiBody({
    type: ApplyApplicantDto,
    description: "Complete applicant data for application"
  })
  @ApiResponse({
    status: 200,
    description: "Application submitted successfully",
    schema: {
      example: {
        responseCode: responseMessage.SUCCESS.caseCode,
        responseDesc: "Application submitted successfully",
        data: {
          applicant: {
            id: "uuid",
            fullName: "Chandika Nurdiansyah",
            email: "chandika@example.com",
            phone: "083821589132"
            // ... other applicant fields
          },
          application: {
            id: "uuid",
            applicationNumber: "APP-2024-001",
            status: "applied",
            appliedAt: "2024-01-01T00:00:00.000Z"
            // ... other application fields
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad request - Invalid data, application not found, or application status is not 'new'",
    schema: {
      examples: {
        "Application not found": {
          summary: "Application not found",
          value: {
            responseCode: responseMessage.BAD_REQUEST.caseCode,
            responseDesc: "Application not found",
            data: null
          }
        },
        "Invalid status": {
          summary: "Application status is not 'new'",
          value: {
            responseCode: responseMessage.BAD_REQUEST.caseCode,
            responseDesc:
              "Cannot apply for this position. Application status is 'applied', but only applications with status 'new' can be applied.",
            data: null
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    schema: {
      example: {
        responseCode: responseMessage.UNAUTHORIZED_AUTH.caseCode,
        responseDesc: "Unauthorized access",
        data: null
      }
    }
  })
  async applyForPosition(
    @Param("applicationId", ParseUUIDPipe) applicationId: string,
    @Body() applyDto: ApplyApplicantDto
  ) {
    const result = await this.applicantService.applyForPosition(
      applicationId,
      applyDto
    );
    return result;
  }
}