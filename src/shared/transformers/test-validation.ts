/**
 * Test file for validation with transformers
 * This file tests the transformer functions with class-validator
 */

import { validate } from 'class-validator';
import { Transform, plainToClass } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { transformToNumber, transformToInteger } from './type-transformers';

class TestDto {
  @IsOptional()
  @Transform(transformToNumber)
  @IsNumber()
  gpa?: number;

  @Transform(transformToInteger)
  @IsNumber()
  year: number;
}

async function testValidation() {
  console.log('Testing validation with transformers:');
  
  // Test with string values (as they come from frontend)
  const testData = {
    gpa: "3.63",
    year: "2024"
  };

  console.log('Input data:', testData);

  // Use plainToClass to apply transformers
  const dto = plainToClass(TestDto, testData);

  console.log('After transformation:', dto);

  const errors = await validate(dto);
  
  if (errors.length > 0) {
    console.log('Validation errors:', errors);
  } else {
    console.log('Validation passed!');
    console.log('Final data:', dto);
  }
}

testValidation().catch(console.error);
