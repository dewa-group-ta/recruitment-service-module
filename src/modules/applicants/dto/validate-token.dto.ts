import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ValidateTokenDto {
  @ApiProperty({
    description: "Token received via email",
    example: "ABC12345"
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
