import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Body,
  ParseUUIDPipe,
  Post,
  Delete
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth
} from "@nestjs/swagger";
import { CandidatesService } from "../services/candidates.service";
import { ResponseMessage } from "../../../shared/decorators/response.decorator";
import { responseMessage, role } from "src/shared/utils/constant";
import { IsRole } from "src/shared/decorators/roles.decorator";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";
import { ApplicantTableQueryDto, ApplicantSummaryQueryDto } from "../dto/applicant-table-query.dto";
import { ApplicantTableResponseDto, ApplicantSummaryResponseDto } from "../dto/applicant-table-response.dto";
import { CandidateDetailDto, UpdateCandidateStatusDto, MoveToNextStageDto, AddCandidateScoreDto, UpdateTalentPoolDto } from "../dto/candidate-detail.dto";
import { CreateApplicationNotesDto } from "../../applicants/dto/create-application-notes.dto";
import { UpdateApplicationNotesDto } from "../../applicants/dto/update-application-notes.dto";
import { ApplicationNotesResponseDto } from "../../applicants/dto/application-notes-response.dto";
import { QueryApplicationNotesDto } from "../../applicants/dto/query-application-notes.dto";
import { HiringProgressDto } from "../dto/hiring-progress.dto";

@ApiTags("Candidates")
@Controller("candidates")
@ApiBearerAuth()
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get all candidates",
    description:
      "Retrieve all candidates with pagination and filtering support."
  })
  @ApiQuery({
    name: "page",
    description: "Page number",
    required: false,
    example: 1,
    type: Number
  })
  @ApiQuery({
    name: "limit",
    description: "Number of items per page",
    required: false,
    example: 10,
    type: Number
  })
  @ApiQuery({
    name: "status",
    description: "Filter by application status",
    required: false,
    example: "qualified",
    type: String
  })
  @ApiQuery({
    name: "stage",
    description: "Filter by recruitment stage",
    required: false,
    example: "screening",
    type: String
  })
  @ApiQuery({
    name: "search",
    description: "Search in candidate name, email, or application number",
    required: false,
    example: "john doe",
    type: String
  })
  @ApiQuery({
    name: "vacancyId",
    description: "Filter by vacancy ID",
    required: false,
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Candidates retrieved successfully",
    schema: {
      example: {
        responseCode: 200,
        responseDesc: "Success",
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }
    }
  })
  async getAllCandidates(
    @Query()
    query: BaseFindAllDto & {
      status?: string;
      stage?: string;
      search?: string;
      vacancyId?: string;
    }
  ) {
    const { page = 1, limit = 10, status, stage, search, vacancyId } = query;

    const result = await this.candidatesService.getAllCandidates(
      page,
      limit,
      status,
      stage,
      search,
      vacancyId
    );

    return {
      data: result.data,
      pagination: result.pagination
    };
  }

  @Get("vacancy/:vacancyId")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get candidates by vacancy",
    description:
      "Retrieve candidates for a specific vacancy with pagination and filtering."
  })
  @ApiParam({
    name: "vacancyId",
    description: "Vacancy ID",
    example: "uuid-string",
    type: String
  })
  @ApiQuery({
    name: "page",
    description: "Page number",
    required: false,
    example: 1,
    type: Number
  })
  @ApiQuery({
    name: "limit",
    description: "Number of items per page",
    required: false,
    example: 10,
    type: Number
  })
  @ApiQuery({
    name: "status",
    description: "Filter by application status",
    required: false,
    example: "qualified",
    type: String
  })
  @ApiQuery({
    name: "stage",
    description: "Filter by recruitment stage",
    required: false,
    example: "screening",
    type: String
  })
  @ApiQuery({
    name: "search",
    description: "Search in candidate name, email, or application number",
    required: false,
    example: "john doe",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Candidates retrieved successfully",
    schema: {
      example: {
        responseCode: 200,
        responseDesc: "Success",
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }
    }
  })
  async getCandidatesByVacancy(
    @Param("vacancyId") vacancyId: string,
    @Query()
    query: BaseFindAllDto & {
      status?: string;
      stage?: string;
      search?: string;
    }
  ) {
    const { page = 1, limit = 10, status, stage, search } = query;

    const result = await this.candidatesService.getCandidatesByVacancy(
      vacancyId,
      page,
      limit,
      status,
      stage,
      search
    );

    return {
      data: result.data,
      pagination: result.pagination
    };
  }

  @Get("vacancy/:vacancyId/stages")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get candidates grouped by stage",
    description:
      "Retrieve candidates for a specific vacancy grouped by recruitment stage."
  })
  @ApiParam({
    name: "vacancyId",
    description: "Vacancy ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Candidates grouped by stage retrieved successfully",
    schema: {
      example: {
        responseCode: 200,
        responseDesc: "Success",
        data: [
          {
            stage: "Applied",
            candidates: []
          }
        ]
      }
    }
  })
  async getCandidatesByStage(@Param("vacancyId") vacancyId: string) {
    const result = await this.candidatesService.getCandidatesByStage(vacancyId);

    return result;
  }

  @Get("stats")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get candidate statistics",
    description:
      "Retrieve candidate statistics including counts by status and stage."
  })
  @ApiQuery({
    name: "vacancyId",
    description: "Filter by vacancy ID",
    required: false,
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Candidate statistics retrieved successfully",
    schema: {
      example: {
        responseCode: 200,
        responseDesc: "Success",
        data: {
          total: 0,
          byStatus: {},
          byStage: {},
          averageScore: 0
        }
      }
    }
  })
  async getCandidateStats(@Query("vacancyId") vacancyId?: string) {
    const result = await this.candidatesService.getCandidateStats(vacancyId);

    return result;
  }

  @Get("table")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get applicants for table display",
    description: "Retrieve applicants with optimized data structure for table display, including pagination, filtering, and sorting support."
  })
  @ApiResponse({
    status: 200,
    description: "Applicants retrieved successfully",
    type: ApplicantTableResponseDto
  })
  async getApplicantsTable(@Query() query: ApplicantTableQueryDto) {
    const result = await this.candidatesService.getApplicantsTable(query);

    return {
      responseCode: 200,
      responseDesc: "Success",
      data: result.data,
      pagination: result.pagination
    };
  }

  @Get("summary")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get applicant summary/statistics",
    description: "Retrieve applicant statistics including counts by status, stage, and trends."
  })
  @ApiResponse({
    status: 200,
    description: "Applicant summary retrieved successfully",
    type: ApplicantSummaryResponseDto
  })
  async getApplicantsSummary(@Query() query: ApplicantSummaryQueryDto) {
    const result = await this.candidatesService.getApplicantsSummary(query);

    return result
  }

  @Get("compare")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get multiple candidates for comparison",
    description: "Retrieve detailed information for multiple candidates by their application IDs for comparison purposes."
  })
  @ApiQuery({
    name: "candidates",
    description: "Comma-separated list of application IDs",
    example: "a4417aae-2639-418d-9184-0e635449ed30,f12d13c3-7fad-4dcd-bd93-5fb08d07eca7",
    type: String,
    required: true
  })
  @ApiResponse({
    status: 200,
    description: "Candidates retrieved successfully for comparison",
    schema: {
      example: {
        responseCode: 200,
        responseDesc: "Success",
        data: [
          {
            id: "uuid-string",
            applicationId: "uuid-string",
            fullName: "John Doe",
            email: "john.doe@example.com",
            phone: "+62 812-3456-7890",
            status: "qualified",
            currentStage: "Interview",
            score: 85,
            appliedAt: "2024-01-15T10:30:00Z",
            avatar: "https://example.com/avatar.jpg",
            progress: {
              currentStage: "Interview",
              upcomingStage: "Offering",
              overallScore: 85,
              stages: []
            },
            info: {
              contact: {},
              personalDetails: {},
              education: {},
              jobHistory: {}
            }
          }
        ]
      }
    }
  })
  async getCandidatesForComparison(@Query("candidates") candidates: string) {
    if (!candidates) {
      throw new Error("Candidates parameter is required");
    }

    const candidateIds = candidates.split(',').map(id => id.trim()).filter(id => id);
    
    if (candidateIds.length === 0) {
      throw new Error("At least one candidate ID is required");
    }

    if (candidateIds.length > 10) {
      throw new Error("Maximum 10 candidates can be compared at once");
    }

    const result = await this.candidatesService.getCandidatesForComparison(candidateIds);

    return result
  }

  @Get(":applicationId")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get candidate detail",
    description: "Retrieve detailed information for a specific candidate by application ID."
  })
  @ApiParam({
    name: "applicationId",
    description: "Application ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Candidate detail retrieved successfully",
    type: CandidateDetailDto
  })
  async getCandidateDetail(@Param("applicationId", ParseUUIDPipe) applicationId: string) {
    const result = await this.candidatesService.getCandidateDetail(applicationId);

    return result
  }

  @Patch(":applicationId/status")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Update candidate status",
    description: "Update the status of a specific candidate application."
  })
  @ApiParam({
    name: "applicationId",
    description: "Application ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Candidate status updated successfully",
    type: CandidateDetailDto
  })
  async updateCandidateStatus(
    @Param("applicationId", ParseUUIDPipe) applicationId: string,
    @Body() updateStatusDto: UpdateCandidateStatusDto
  ) {
    const result = await this.candidatesService.updateCandidateStatus(
      applicationId,
      updateStatusDto.status,
      updateStatusDto.notes,
      updateStatusDto.score
    );

    return result
  }

  @Patch(":applicationId/move-stage")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Move candidate to next stage",
    description: "Move a candidate to the next stage in the recruitment pipeline."
  })
  @ApiParam({
    name: "applicationId",
    description: "Application ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Candidate moved to next stage successfully",
    type: CandidateDetailDto
  })
  async moveToNextStage(
    @Param("applicationId", ParseUUIDPipe) applicationId: string,
    @Body() moveStageDto: MoveToNextStageDto
  ) {
    const result = await this.candidatesService.moveToNextStage(
      applicationId,
      moveStageDto.notes,
      moveStageDto.score
    );

    return result
  }

  @Get(":applicationId/hiring-progress")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get candidate hiring progress",
    description: "Retrieve the hiring progress and stage information for a specific candidate."
  })
  @ApiParam({
    name: "applicationId",
    description: "Application ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Hiring progress retrieved successfully",
    type: HiringProgressDto
  })
  async getHiringProgress(@Param("applicationId", ParseUUIDPipe) applicationId: string) {
    const result = await this.candidatesService.getHiringProgress(applicationId);
    return result;
  }

  @Patch(":applicationId/score")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Add candidate score",
    description: "Add or update the score for a specific candidate."
  })
  @ApiParam({
    name: "applicationId",
    description: "Application ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Candidate score added successfully",
    type: CandidateDetailDto
  })
  async addCandidateScore(
    @Param("applicationId", ParseUUIDPipe) applicationId: string,
    @Body() addScoreDto: AddCandidateScoreDto
  ) {
    const result = await this.candidatesService.addCandidateScore(
      applicationId,
      addScoreDto.score,
      addScoreDto.notes
    );

    return result
  }

  @Patch(":applicationId/talent-pool")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Update talent pool status",
    description: "Add or remove candidate from talent pool."
  })
  @ApiParam({
    name: "applicationId",
    description: "Application ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Talent pool status updated successfully"
  })
  async updateTalentPoolStatus(
    @Param("applicationId", ParseUUIDPipe) applicationId: string,
    @Body() updateTalentPoolDto: UpdateTalentPoolDto
  ) {
    await this.candidatesService.updateTalentPoolStatus(
      applicationId,
      updateTalentPoolDto.isTalentPool
    );

    return {
      message: `Candidate ${updateTalentPoolDto.isTalentPool ? 'added to' : 'removed from'} talent pool successfully`
    };
  }

  // ==================== APPLICATION NOTES ENDPOINTS ====================

  @Post(":applicationId/notes")
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Create application note",
    description: "Create a new note for a specific application."
  })
  @ApiParam({
    name: "applicationId",
    description: "Application ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 201,
    description: "Note created successfully",
    type: ApplicationNotesResponseDto
  })
  async createApplicationNote(
    @Param("applicationId", ParseUUIDPipe) applicationId: string,
    @Body() createDto: CreateApplicationNotesDto
  ) {
    const noteData = { ...createDto, applicationId };
    const result = await this.candidatesService.createApplicationNote(noteData);

    return result;
  }

  @Get(":applicationId/notes")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get application notes",
    description: "Retrieve all notes for a specific application with pagination and filtering."
  })
  @ApiParam({
    name: "applicationId",
    description: "Application ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Notes retrieved successfully",
    schema: {
      example: {
        responseCode: 200,
        responseDesc: "Success",
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }
    }
  })
  async getApplicationNotes(
    @Param("applicationId", ParseUUIDPipe) applicationId: string,
    @Query() query: QueryApplicationNotesDto
  ) {
    const result = await this.candidatesService.getApplicationNotes(applicationId, query);

    return {
      data: result.data,
      pagination: result.pagination
    };
  }

  @Get("notes/:noteId")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Get specific note",
    description: "Retrieve a specific note by its ID."
  })
  @ApiParam({
    name: "noteId",
    description: "Note ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Note retrieved successfully",
    type: ApplicationNotesResponseDto
  })
  async getApplicationNoteById(@Param("noteId", ParseUUIDPipe) noteId: string) {
    const result = await this.candidatesService.getApplicationNoteById(noteId);

    return result;
  }

  @Patch("notes/:noteId")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Update application note",
    description: "Update a specific note."
  })
  @ApiParam({
    name: "noteId",
    description: "Note ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Note updated successfully",
    type: ApplicationNotesResponseDto
  })
  async updateApplicationNote(
    @Param("noteId", ParseUUIDPipe) noteId: string,
    @Body() updateDto: UpdateApplicationNotesDto
  ) {
    const result = await this.candidatesService.updateApplicationNote(noteId, updateDto);

    return result;
  }

  @Delete("notes/:noteId")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(responseMessage.SUCCESS)
  @IsRole(role.HR_MANAGER)
  @ApiOperation({
    summary: "Delete application note",
    description: "Delete a specific note."
  })
  @ApiParam({
    name: "noteId",
    description: "Note ID",
    example: "uuid-string",
    type: String
  })
  @ApiResponse({
    status: 200,
    description: "Note deleted successfully"
  })
  async deleteApplicationNote(@Param("noteId", ParseUUIDPipe) noteId: string) {
    await this.candidatesService.deleteApplicationNote(noteId);

    return { message: "Note deleted successfully" };
  }
}
