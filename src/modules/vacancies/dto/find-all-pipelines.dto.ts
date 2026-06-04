import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";

export class FindAllPipelinesDto extends BaseFindAllDto {
  @ApiPropertyOptional({ description: "Filter by active status" })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Filter by template status" })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  isTemplate?: boolean;

  @ApiPropertyOptional({ description: "Filter by default status" })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  isDefault?: boolean;

  @ApiPropertyOptional({ description: "Filter by category" })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: "Search in name and description" })
  @IsString()
  @IsOptional()
  search?: string;
}
