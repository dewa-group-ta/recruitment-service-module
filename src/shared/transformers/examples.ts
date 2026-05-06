/**
 * Examples of using shared transformers in DTOs
 * This file shows practical examples of how to use transformers
 * Follows Single Responsibility Principle - focused only on providing examples
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from "class-validator";
import { Transform } from "class-transformer";
import {
  transformToNumber,
  transformToInteger,
  transformToBoolean,
  transformToDate,
  transformToArray,
  transformToLowercase,
  transformToUppercase
} from './type-transformers';

/**
 * Example DTO showing various transformer usage
 * This demonstrates how to use all available transformers
 */
export class ExampleUsageDto {
  // Number transformation
  @ApiProperty({
    description: "GPA score",
    example: 3.56,
    required: false
  })
  @IsOptional()
  @Transform(transformToNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  gpa?: number;

  // Integer transformation
  @ApiProperty({
    description: "Year of graduation",
    example: 2024
  })
  @Transform(transformToInteger)
  @IsNumber()
  graduationYear: number;

  // Boolean transformation
  @ApiProperty({
    description: "Is currently employed",
    example: true,
    required: false
  })
  @IsOptional()
  @Transform(transformToBoolean)
  @IsBoolean()
  isEmployed?: boolean;

  // Date transformation
  @ApiProperty({
    description: "Date of birth",
    example: "1990-01-01",
    required: false
  })
  @IsOptional()
  @Transform(transformToDate)
  @IsString()
  dateOfBirth?: Date;

  // Array transformation
  @ApiProperty({
    description: "Skills (comma-separated)",
    example: "JavaScript,TypeScript,Node.js",
    required: false
  })
  @IsOptional()
  @Transform(transformToArray)
  @IsArray()
  skills?: string[];

  // Lowercase transformation
  @ApiProperty({
    description: "Status (will be converted to lowercase)",
    example: "ACTIVE"
  })
  @Transform(transformToLowercase)
  @IsString()
  status: string;

  // Uppercase transformation
  @ApiProperty({
    description: "Country code (will be converted to uppercase)",
    example: "id"
  })
  @Transform(transformToUppercase)
  @IsString()
  countryCode: string;
}

/**
 * Example of frontend data that will be automatically transformed
 */
export const exampleFrontendData = {
  gpa: "3.56",                    // String
  graduationYear: "2024",         // String
  isEmployed: "true",             // String
  dateOfBirth: "1990-01-01",      // String
  skills: "JavaScript,TypeScript,Node.js", // String
  status: "ACTIVE",               // String
  countryCode: "id"              // String
};

/**
 * Example of backend data after transformation
 */
export const exampleBackendData = {
  gpa: 3.56,                      // Number
  graduationYear: 2024,           // Number
  isEmployed: true,               // Boolean
  dateOfBirth: new Date("1990-01-01"), // Date
  skills: ["JavaScript", "TypeScript", "Node.js"], // Array
  status: "active",               // String (lowercase)
  countryCode: "ID"              // String (uppercase)
};

/**
 * Example of error handling
 */
export const exampleErrorCases = {
  invalidGpa: "invalid",          // Will become undefined
  invalidYear: "not-a-number",   // Will become undefined
  invalidBoolean: "maybe",       // Will become undefined
  invalidDate: "not-a-date",     // Will become undefined
  emptySkills: "",               // Will become []
  nullStatus: null,              // Will become undefined
  undefinedCode: undefined       // Will become undefined
};
