/**
 * Test simple transformation for gpa and year fields only
 */

import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ApplyEducationDto, ApplyProjectHistoryDto } from '../../modules/applicants/dto/apply-applicant.dto';

async function testSimpleTransformation() {
  console.log('=== Testing Simple Transformation ===');
  
  // Test education with gpa
  const educationData = {
    schoolName: "Universitas Indonesia",
    major: "Computer Science", 
    degree: "Bachelor",
    gpa: "3.63",  // String that should become number
    startMonth: "2020-08",
    endMonth: "2024-08",
    diplomaFileName: "diploma.pdf"
  };

  console.log('Education data (before):');
  console.log('gpa:', educationData.gpa, typeof educationData.gpa);

  const transformedEducation = plainToClass(ApplyEducationDto, educationData);
  
  console.log('Education data (after):');
  console.log('gpa:', transformedEducation.gpa, typeof transformedEducation.gpa);

  const educationErrors = await validate(transformedEducation);
  if (educationErrors.length > 0) {
    console.log('Education validation errors:', educationErrors);
  } else {
    console.log('✅ Education validation passed!');
  }

  // Test project history with year
  const projectData = {
    projectName: "E-commerce Platform",
    position: "Full Stack Developer", 
    projectUrl: "https://example.com",
    year: "2023"  // String that should become number
  };

  console.log('\nProject data (before):');
  console.log('year:', projectData.year, typeof projectData.year);

  const transformedProject = plainToClass(ApplyProjectHistoryDto, projectData);
  
  console.log('Project data (after):');
  console.log('year:', transformedProject.year, typeof transformedProject.year);

  const projectErrors = await validate(transformedProject);
  if (projectErrors.length > 0) {
    console.log('Project validation errors:', projectErrors);
  } else {
    console.log('✅ Project validation passed!');
  }
}

testSimpleTransformation().catch(console.error);
