/**
 * Test DTO transformation with actual ApplyApplicantDto structure
 */

import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ApplyApplicantDto } from '../../modules/applicants/dto/apply-applicant.dto';

async function testDtoTransformation() {
  console.log('=== Testing ApplyApplicantDto Transformation ===');
  
  // Simulate frontend data
  const frontendData = {
    fullName: "John Doe",
    phone: "08123456789",
    email: "john@example.com",
    gender: "male",
    maritalStatus: "single",
    placeOfBirth: "Jakarta",
    dateOfBirth: "1990-01-01",
    linkedinUrl: "https://linkedin.com/in/johndoe",
    portfolioUrl: "https://johndoe.com",
    socialMediaUrl: "https://twitter.com/johndoe",
    availability: "immediately",
    availabilityAt: "2024-01-01",
    addresses: [
      {
        province: "DKI Jakarta",
        regency: "Jakarta Selatan",
        district: "Kebayoran Baru",
        village: "Kramat Pela",
        fullAddress: "Jl. Kramat Pela No. 1",
        postalCode: "12110",
        addressType: "HOME"
      }
    ],
    educations: [
      {
        schoolName: "Universitas Indonesia",
        major: "Computer Science",
        degree: "Bachelor",
        gpa: "3.63",  // This should be transformed to number
        startMonth: "2020-08",
        endMonth: "2024-08",
        diplomaFileName: "diploma.pdf"
      }
    ],
    jobHistories: [
      {
        companyName: "Tech Company",
        position: "Software Engineer",
        employeeStatus: "full-time",
        startDate: "2022-01-01",
        endDate: "2023-12-31",
        location: "Jakarta",
        description: "Developed web applications",
        achievements: "Led team of 5 developers"
      }
    ],
    projectHistories: [
      {
        projectName: "E-commerce Platform",
        position: "Full Stack Developer",
        projectUrl: "https://example.com",
        year: "2023"  // This should be transformed to number
      }
    ],
    identities: [
      {
        identityType: "KTP",
        identityNumber: "1234567890123456"
      }
    ]
  };

  console.log('Frontend data (before transformation):');
  console.log('gpa:', frontendData.educations[0].gpa, typeof frontendData.educations[0].gpa);
  console.log('year:', frontendData.projectHistories[0].year, typeof frontendData.projectHistories[0].year);

  try {
    // Transform using plainToClass
    const transformedDto = plainToClass(ApplyApplicantDto, frontendData);
    
    console.log('\nAfter transformation:');
    console.log('gpa:', transformedDto.educations[0].gpa, typeof transformedDto.educations[0].gpa);
    console.log('year:', transformedDto.projectHistories[0].year, typeof transformedDto.projectHistories[0].year);

    // Validate
    const errors = await validate(transformedDto);
    
    if (errors.length > 0) {
      console.log('\n❌ Validation errors:');
      errors.forEach(error => {
        console.log(`- ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`);
      });
    } else {
      console.log('\n✅ Validation passed!');
    }

  } catch (error) {
    console.error('❌ Error during transformation:', error);
  }
}

testDtoTransformation().catch(console.error);
