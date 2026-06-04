import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MinLength,
  MaxLength
} from "class-validator";

export class CreateApplicantSourceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsInt()
  sortOrder?: number = 0;
}
