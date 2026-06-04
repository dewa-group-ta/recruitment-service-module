import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsBoolean, IsString } from "class-validator";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";
import { TransformToBoolean } from "../../../shared/transformers/boolean.transformer";

export class QueryStageTemplateDto extends BaseFindAllDto {
  @ApiPropertyOptional({
    description: "Filter by category",
    example: "engineering"
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: "Filter by active status",
    example: true
  })
  @IsOptional()
  @TransformToBoolean
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Search in name and description",
    example: "interview"
  })
  @IsOptional()
  @IsString()
  search?: string;
}
