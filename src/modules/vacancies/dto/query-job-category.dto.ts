import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsBoolean } from "class-validator";
import { BaseFindAllDto } from "../../../shared/paginate/base-find-all.dto";
import { TransformToBoolean } from "../../../shared/transformers/boolean.transformer";

export class QueryJobCategoryDto extends BaseFindAllDto {
  @ApiPropertyOptional({
    description: "Filter by active status",
    example: true
  })
  @IsOptional()
  @TransformToBoolean
  @IsBoolean()
  isActive?: boolean;
}
