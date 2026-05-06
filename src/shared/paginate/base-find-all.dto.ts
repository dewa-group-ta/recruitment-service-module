import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class BaseFindAllDto {
  @ApiPropertyOptional({
    default: 1
  })
  @Type(() => Number)
  @IsNumber()
  page: number = 1;

  @ApiPropertyOptional({
    default: 10
  })
  @Type(() => Number)
  @IsNumber()
  limit: number = 10;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    default: "createdAt"
  })
  @IsString()
  @IsOptional()
  sort_by?: string;

  @ApiPropertyOptional({
    default: "DESC"
  })
  @IsString()
  @IsOptional()
  @IsIn(["ASC", "DESC"])
  order?: "ASC" | "DESC" = "DESC";
}
