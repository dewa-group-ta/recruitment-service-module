import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUUID,
  Min
} from "class-validator";

export class CreatePipelineStageDto {
  @ApiProperty({
    description: "Pipeline ID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @IsUUID()
  @IsNotEmpty()
  pipelineId: string;

  @ApiProperty({
    description: "Stage template ID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @IsUUID()
  @IsNotEmpty()
  stageTemplateId: string;

  @ApiProperty({
    description: "Stage order in pipeline (must be unique per pipeline)",
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  stageOrder: number;

  @ApiPropertyOptional({
    description: "Estimated duration in days for this stage",
    example: 7
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  estimatedDurationDays?: number;

  @ApiPropertyOptional({
    description: "Whether to send notification for this stage",
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;
}
