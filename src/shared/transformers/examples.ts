/**
 * contoh penggunaan shared transformers di dto.
 */

import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray
} from "class-validator";
import { Transform } from "class-transformer";
import {
  transformToNumber,
  transformToInteger,
  transformToBoolean,
  transformToDate,
  transformToArray,
  transformToLowercase,
  transformToUppercase
} from "./type-transformers";

/**
 * contoh dto yang memakai seluruh transformer yang tersedia.
 */
export class ExampleUsageDto {
  @ApiProperty({
    description: "GPA score",
    example: 3.56,
    required: false
  })
  @IsOptional()
  @Transform(transformToNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  gpa?: number;

  @ApiProperty({
    description: "Year of graduation",
    example: 2024
  })
  @Transform(transformToInteger)
  @IsNumber()
  graduationYear: number;

  @ApiProperty({
    description: "Is currently employed",
    example: true,
    required: false
  })
  @IsOptional()
  @Transform(transformToBoolean)
  @IsBoolean()
  isEmployed?: boolean;

  @ApiProperty({
    description: "Date of birth",
    example: "1990-01-01",
    required: false
  })
  @IsOptional()
  @Transform(transformToDate)
  @IsString()
  dateOfBirth?: Date;

  @ApiProperty({
    description: "Skills (comma-separated)",
    example: "JavaScript,TypeScript,Node.js",
    required: false
  })
  @IsOptional()
  @Transform(transformToArray)
  @IsArray()
  skills?: string[];

  @ApiProperty({
    description: "Status (will be converted to lowercase)",
    example: "ACTIVE"
  })
  @Transform(transformToLowercase)
  @IsString()
  status: string;

  @ApiProperty({
    description: "Country code (will be converted to uppercase)",
    example: "id"
  })
  @Transform(transformToUppercase)
  @IsString()
  countryCode: string;
}

/**
 * contoh data dari frontend sebelum ditransformasi (semua string).
 */
export const exampleFrontendData = {
  gpa: "3.56", // string
  graduationYear: "2024", // string
  isEmployed: "true", // string
  dateOfBirth: "1990-01-01", // string
  skills: "JavaScript,TypeScript,Node.js", // string
  status: "ACTIVE", // string
  countryCode: "id" // string
};

/**
 * contoh data backend setelah ditransformasi ke tipe aslinya.
 */
export const exampleBackendData = {
  gpa: 3.56, // number
  graduationYear: 2024, // number
  isEmployed: true, // boolean
  dateOfBirth: new Date("1990-01-01"), // date
  skills: ["JavaScript", "TypeScript", "Node.js"], // array
  status: "active", // string (lowercase)
  countryCode: "ID" // string (uppercase)
};

/**
 * contoh penanganan input yang tidak valid.
 */
export const exampleErrorCases = {
  invalidGpa: "invalid", // jadi undefined
  invalidYear: "not-a-number", // jadi undefined
  invalidBoolean: "maybe", // jadi undefined
  invalidDate: "not-a-date", // jadi undefined
  emptySkills: "", // jadi []
  nullStatus: null, // jadi undefined
  undefinedCode: undefined // jadi undefined
};
