import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max
} from "class-validator";
import { Type } from "class-transformer";
import { TransformToBoolean } from "../../../shared/transformers/boolean.transformer";

export class QueryApplicantSourceDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @TransformToBoolean
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = "sortOrder";

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC" = "ASC";
}
