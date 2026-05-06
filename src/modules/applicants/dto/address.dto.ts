import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEnum, Length, IsOptional } from "class-validator";
import { AddressTypeEnum } from "../../../shared/enums/applicant.enum";

export class CreateAddressDto {
  @ApiProperty({
    description: "Province name",
    example: "DKI Jakarta",
    maxLength: 100
  })
  @IsString()
  @Length(1, 100)
  province: string;

  @ApiProperty({
    description: "Regency/City name",
    example: "Jakarta Selatan",
    maxLength: 100
  })
  @IsString()
  @Length(1, 100)
  regency: string;

  @ApiProperty({
    description: "District name",
    example: "Kebayoran Baru",
    maxLength: 100
  })
  @IsString()
  @Length(1, 100)
  district: string;

  @ApiProperty({
    description: "Village name",
    example: "Kramat Pela",
    maxLength: 100
  })
  @IsString()
  @Length(1, 100)
  village: string;

  @ApiProperty({
    description: "Complete address details",
    example: "Jl. Kramat Pela No. 123, RT 01/RW 02"
  })
  @IsString()
  fullAddress: string;

  @ApiPropertyOptional({
    description: "Postal code",
    example: "12130",
    maxLength: 10,
    default: "ID"
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  postalCode?: string;

  @ApiProperty({
    description: "Type of address",
    enum: AddressTypeEnum,
    example: AddressTypeEnum.CURRENT
  })
  @IsEnum(AddressTypeEnum)
  addressType: AddressTypeEnum;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({
    description: "Province name",
    example: "DKI Jakarta",
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  province?: string;

  @ApiPropertyOptional({
    description: "Regency/City name",
    example: "Jakarta Selatan",
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  regency?: string;

  @ApiPropertyOptional({
    description: "District name",
    example: "Kebayoran Baru",
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  district?: string;

  @ApiPropertyOptional({
    description: "Village name",
    example: "Kramat Pela",
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  village?: string;

  @ApiPropertyOptional({
    description: "Complete address details",
    example: "Jl. Kramat Pela No. 123, RT 01/RW 02"
  })
  @IsOptional()
  @IsString()
  fullAddress?: string;

  @ApiPropertyOptional({
    description: "Postal code",
    example: "12130",
    maxLength: 10
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  postalCode?: string;

  @ApiPropertyOptional({
    description: "Type of address",
    enum: AddressTypeEnum,
    example: AddressTypeEnum.CURRENT
  })
  @IsOptional()
  @IsEnum(AddressTypeEnum)
  addressType?: AddressTypeEnum;
}
