import { PartialType } from "@nestjs/swagger";
import { CreateJobCategoryDto } from "./create-job-category.dto";
import { IsString, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateJobCategoryDto extends PartialType(CreateJobCategoryDto) {
  @ApiPropertyOptional({
    description: "ID of the user updating the category",
    example: "123e4567-e89b-12d3-a456-426614174000"
  })
  @IsOptional()
  @IsString()
  updatedById?: string;
}
