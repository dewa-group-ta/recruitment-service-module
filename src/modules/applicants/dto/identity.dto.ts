import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEnum, Length, IsOptional } from "class-validator";
import { IdentityTypeEnum } from "../../../shared/enums/applicant.enum";

export class CreateIdentityDto {
  @ApiProperty({
    description: "Type of identity document",
    enum: IdentityTypeEnum,
    example: IdentityTypeEnum.KTP
  })
  @IsEnum(IdentityTypeEnum)
  identityType: IdentityTypeEnum;

  @ApiProperty({
    description: "Identity document number",
    example: "3171031234567890",
    maxLength: 50
  })
  @IsString()
  @Length(1, 50)
  identityNumber: string;
}

export class UpdateIdentityDto {
  @ApiPropertyOptional({
    description: "Type of identity document",
    enum: IdentityTypeEnum,
    example: IdentityTypeEnum.KTP
  })
  @IsOptional()
  @IsEnum(IdentityTypeEnum)
  identityType?: IdentityTypeEnum;

  @ApiPropertyOptional({
    description: "Identity document number",
    example: "3171031234567890",
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  identityNumber?: string;
}
