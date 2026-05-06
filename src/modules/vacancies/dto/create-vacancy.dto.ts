import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class CreateVacancyDto {
  @ApiProperty({
    description: "Vacancy title",
    example: "Senior Software Engineer",
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}
