/**
 * Contoh penggunaan Boolean Transformers
 * File ini berisi contoh implementasi untuk berbagai skenario boolean transformation
 */

import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { QueryJobCategoryDto } from "../../modules/vacancies/dto/query-job-category.dto";
import { QueryDepartmentDto } from "../../modules/departments/dto/query-department.dto";
import { QueryStageTemplateDto } from "../../modules/vacancies/dto/query-stage-template.dto";
// import { QueryApplicantSourceDto } from "../../modules/applicants/dto/query-applicant-source.dto";
// import { QuerySystemConfigurationDto } from "../../modules/system-configurations/dto/query-system-configuration.dto";

/**
 * Contoh penggunaan di Controller
 */
export class ExampleController {
  /**
   * Contoh 1: Job Category Query
   */
  async getJobCategories(query: any) {
    // Transform query parameters
    const dto = plainToClass(QueryJobCategoryDto, query);

    // Validate
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new Error("Validation failed");
    }

    // query.isActive will be boolean (true/false/undefined)
    console.log("isActive:", query.isActive, typeof query.isActive);

    return {
      isActive: query.isActive,
      page: query.page,
      limit: query.limit
    };
  }

  /**
   * Contoh 2: Department Query
   */
  async getDepartments(query: any) {
    const dto = plainToClass(QueryDepartmentDto, query);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new Error("Validation failed");
    }

    return {
      isActive: query.isActive,
      keyword: query.keyword
    };
  }

  /**
   * Contoh 3: Stage Template Query
   */
  async getStageTemplates(query: any) {
    const dto = plainToClass(QueryStageTemplateDto, query);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new Error("Validation failed");
    }

    return {
      category: query.category,
      isActive: query.isActive,
      search: query.search
    };
  }
}

/**
 * Contoh testing untuk boolean transformation
 */
export class BooleanTransformerTests {
  /**
   * Test TransformToBoolean dengan berbagai format
   */
  async testTransformToBoolean() {
    const testCases = [
      { input: "true", expected: true },
      { input: "false", expected: false },
      { input: "1", expected: true },
      { input: "0", expected: false },
      { input: "yes", expected: true },
      { input: "no", expected: false },
      { input: "on", expected: true },
      { input: "off", expected: false },
      { input: true, expected: true },
      { input: false, expected: false },
      { input: "invalid", expected: undefined },
      { input: "", expected: undefined },
      { input: null, expected: undefined }
    ];

    for (const testCase of testCases) {
      const dto = plainToClass(QueryJobCategoryDto, {
        isActive: testCase.input
      });
      console.log(
        `Input: ${testCase.input} -> Output: ${dto.isActive} (Expected: ${testCase.expected})`
      );

      if (dto.isActive !== testCase.expected) {
        console.error(`❌ Test failed for input: ${testCase.input}`);
      } else {
        console.log(`✅ Test passed for input: ${testCase.input}`);
      }
    }
  }

  /**
   * Test dengan URL query parameters
   */
  async testUrlQueryParameters() {
    const urlQueries = [
      "?isActive=true",
      "?isActive=false",
      "?isActive=1",
      "?isActive=0",
      "?isActive=yes",
      "?isActive=no",
      "?isActive=on",
      "?isActive=off",
      "?isActive=invalid",
      "?isActive=",
      "?page=1&limit=10&isActive=true",
      "?keyword=test&isActive=false&sort_by=name"
    ];

    for (const urlQuery of urlQueries) {
      const params = new URLSearchParams(urlQuery);
      const queryObject = Object.fromEntries(params.entries());

      const dto = plainToClass(QueryJobCategoryDto, queryObject);
      console.log(`URL: ${urlQuery}`);
      console.log(`Parsed:`, queryObject);
      console.log(`Transformed isActive:`, dto.isActive, typeof dto.isActive);
      console.log("---");
    }
  }

  /**
   * Test validation dengan boolean transformation
   */
  async testValidation() {
    const validCases = [
      { isActive: "true" },
      { isActive: "false" },
      { isActive: "1" },
      { isActive: "0" },
      { isActive: true },
      { isActive: false },
      { isActive: undefined },
      { isActive: null }
    ];

    const invalidCases = [
      { isActive: "invalid" },
      { isActive: "maybe" },
      { isActive: "truee" },
      { isActive: "falsee" }
    ];

    console.log("Testing valid cases:");
    for (const testCase of validCases) {
      const dto = plainToClass(QueryJobCategoryDto, testCase);
      const errors = await validate(dto);

      if (errors.length === 0) {
        console.log(
          `✅ Valid: ${JSON.stringify(testCase)} -> isActive: ${dto.isActive}`
        );
      } else {
        console.log(
          `❌ Invalid: ${JSON.stringify(testCase)} -> Errors:`,
          errors
        );
      }
    }

    console.log("\nTesting invalid cases:");
    for (const testCase of invalidCases) {
      const dto = plainToClass(QueryJobCategoryDto, testCase);
      const errors = await validate(dto);

      if (errors.length > 0) {
        console.log(
          `✅ Correctly rejected: ${JSON.stringify(testCase)} -> Errors:`,
          errors
        );
      } else {
        console.log(
          `❌ Should be rejected: ${JSON.stringify(testCase)} -> isActive: ${dto.isActive}`
        );
      }
    }
  }
}

/**
 * Contoh penggunaan di Service
 */
export class ExampleService {
  /**
   * Contoh penggunaan di service method
   */
  async findJobCategories(query: QueryJobCategoryDto) {
    // Query parameters sudah di-transform ke boolean
    const whereCondition: any = {};

    if (query.isActive !== undefined) {
      whereCondition.isActive = query.isActive;
    }

    if (query.keyword) {
      whereCondition.name = { $like: `%${query.keyword}%` };
    }

    console.log("Where condition:", whereCondition);

    // Simulate database query
    return {
      data: [],
      total: 0,
      page: query.page,
      limit: query.limit,
      filters: {
        isActive: query.isActive,
        keyword: query.keyword
      }
    };
  }

  /**
   * Contoh dengan multiple boolean filters
   */
  async findStageTemplates(query: QueryStageTemplateDto) {
    const filters: any = {};

    // Boolean filters
    if (query.isActive !== undefined) {
      filters.isActive = query.isActive;
    }

    // String filters
    if (query.category) {
      filters.category = query.category;
    }

    if (query.search) {
      filters.$or = [
        { name: { $like: `%${query.search}%` } },
        { description: { $like: `%${query.search}%` } }
      ];
    }

    console.log("Stage template filters:", filters);

    return {
      data: [],
      total: 0,
      filters: {
        isActive: query.isActive,
        category: query.category,
        search: query.search
      }
    };
  }
}

/**
 * Contoh error handling
 */
export class ErrorHandlingExamples {
  /**
   * Handle transformation errors
   */
  async handleTransformationError(query: any) {
    try {
      const dto = plainToClass(QueryJobCategoryDto, query);
      const errors = await validate(dto);

      if (errors.length > 0) {
        // Handle validation errors
        const errorMessages = errors.map((error) =>
          Object.values(error.constraints || {}).join(", ")
        );

        throw new Error(`Validation failed: ${errorMessages.join("; ")}`);
      }

      return dto;
    } catch (error) {
      console.error("Transformation error:", error);
      throw error;
    }
  }

  /**
   * Handle specific boolean transformation errors
   */
  async handleBooleanTransformationError(query: any) {
    const dto = plainToClass(QueryJobCategoryDto, query);

    // Check if isActive is valid boolean or undefined
    if (query.isActive !== undefined && typeof query.isActive !== "boolean") {
      throw new Error(`Invalid boolean value for isActive: ${query.isActive}`);
    }

    return dto;
  }
}

/**
 * Contoh penggunaan di test
 */
export class TestExamples {
  /**
   * Unit test untuk boolean transformation
   */
  async testBooleanTransformation() {
    const testData = {
      isActive: "true",
      page: "1",
      limit: "10",
      keyword: "test"
    };

    const dto = plainToClass(QueryJobCategoryDto, testData);

    // Assertions
    console.assert(dto.isActive === true, "isActive should be true");
    console.assert(dto.page === 1, "page should be 1");
    console.assert(dto.limit === 10, "limit should be 10");
    console.assert(dto.keyword === "test", "keyword should be test");

    console.log("✅ All assertions passed");
  }

  /**
   * Integration test untuk API endpoint
   */
  async testApiEndpoint() {
    const testQueries = [
      "/api/job-categories?isActive=true",
      "/api/job-categories?isActive=false",
      "/api/job-categories?isActive=1",
      "/api/job-categories?isActive=0",
      "/api/job-categories?isActive=yes",
      "/api/job-categories?isActive=no"
    ];

    for (const query of testQueries) {
      console.log(`Testing: ${query}`);

      // Simulate parsing URL parameters
      const url = new URL(`http://localhost:3000${query}`);
      const params = Object.fromEntries(url.searchParams.entries());

      const dto = plainToClass(QueryJobCategoryDto, params);
      console.log(
        `Result: isActive = ${dto.isActive} (${typeof dto.isActive})`
      );
    }
  }
}
