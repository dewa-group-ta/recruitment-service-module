import { Test, TestingModule } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { ExecutionContext, CallHandler } from "@nestjs/common";
import { of } from "rxjs";
import { ResponseInterceptor } from "./response.interceptor";
import { ResponseMessageKey } from "../decorators/response.decorator";
import { serviceCode } from "../utils/constant";
import { Response as ExpressResponse } from "express";

describe("ResponseInterceptor", () => {
  let interceptor: ResponseInterceptor<any>;
  let reflector: jest.Mocked<Reflector>;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getResponse: jest.fn()
    }))
  } as unknown as ExecutionContext;

  const mockExpressResponse = {
    statusCode: 200
  } as ExpressResponse;

  const mockCallHandler: CallHandler = {
    handle: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseInterceptor,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn()
          }
        }
      ]
    }).compile();

    interceptor = module.get<ResponseInterceptor<any>>(ResponseInterceptor);
    reflector = module.get(Reflector);

    // Setup default mocks
    mockExecutionContext
      .switchToHttp()
      .getResponse.mockReturnValue(mockExpressResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("intercept", () => {
    it("should transform response with default message when no response message decorator", (done) => {
      // Arrange
      const mockData = { id: "1", name: "Test" };
      reflector.get.mockReturnValue(undefined);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "200-RECRUITMENT-",
            responseDesc: "",
            data: mockData
          });
          done();
        },
        error: done
      });
    });

    it("should transform response with custom response message", (done) => {
      // Arrange
      const mockData = { id: "1", name: "Test" };
      const responseMessage = {
        caseCode: "001",
        message: "Success",
        additionalMessage: "Data retrieved successfully"
      };
      reflector.get.mockReturnValue(responseMessage);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "200-RECRUITMENT-001",
            responseDesc: "Success Data retrieved successfully",
            data: mockData
          });
          done();
        },
        error: done
      });
    });

    it("should handle response with pagination data", (done) => {
      // Arrange
      const mockPaginatedData = {
        data: [{ id: "1", name: "Test" }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };
      const responseMessage = {
        caseCode: "002",
        message: "Success",
        additionalMessage: ""
      };
      reflector.get.mockReturnValue(responseMessage);
      mockCallHandler.handle.mockReturnValue(of(mockPaginatedData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "200-RECRUITMENT-002",
            responseDesc: "Success",
            data: [{ id: "1", name: "Test" }],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1
            }
          });
          done();
        },
        error: done
      });
    });

    it("should handle response without pagination data", (done) => {
      // Arrange
      const mockData = { id: "1", name: "Test" };
      const responseMessage = {
        caseCode: "003",
        message: "Success",
        additionalMessage: ""
      };
      reflector.get.mockReturnValue(responseMessage);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "200-RECRUITMENT-003",
            responseDesc: "Success",
            data: mockData
          });
          expect(result).not.toHaveProperty("pagination");
          done();
        },
        error: done
      });
    });

    it("should handle different HTTP status codes", (done) => {
      // Arrange
      const mockData = { id: "1", name: "Test" };
      const responseMessage = {
        caseCode: "004",
        message: "Created",
        additionalMessage: ""
      };
      const createdResponse = { ...mockExpressResponse, statusCode: 201 };
      mockExecutionContext
        .switchToHttp()
        .getResponse.mockReturnValue(createdResponse);
      reflector.get.mockReturnValue(responseMessage);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "201-RECRUITMENT-004",
            responseDesc: "Created",
            data: mockData
          });
          done();
        },
        error: done
      });
    });

    it("should handle null data", (done) => {
      // Arrange
      const mockData = null;
      const responseMessage = {
        caseCode: "005",
        message: "No Content",
        additionalMessage: ""
      };
      reflector.get.mockReturnValue(responseMessage);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "200-RECRUITMENT-005",
            responseDesc: "No Content",
            data: null
          });
          done();
        },
        error: done
      });
    });

    it("should handle undefined data", (done) => {
      // Arrange
      const mockData = undefined;
      const responseMessage = {
        caseCode: "006",
        message: "No Content",
        additionalMessage: ""
      };
      reflector.get.mockReturnValue(responseMessage);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "200-RECRUITMENT-006",
            responseDesc: "No Content",
            data: undefined
          });
          done();
        },
        error: done
      });
    });

    it("should handle primitive data types", (done) => {
      // Arrange
      const mockData = "Simple string response";
      const responseMessage = {
        caseCode: "007",
        message: "Success",
        additionalMessage: ""
      };
      reflector.get.mockReturnValue(responseMessage);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "200-RECRUITMENT-007",
            responseDesc: "Success",
            data: "Simple string response"
          });
          done();
        },
        error: done
      });
    });

    it("should handle array data", (done) => {
      // Arrange
      const mockData = [{ id: "1" }, { id: "2" }];
      const responseMessage = {
        caseCode: "008",
        message: "Success",
        additionalMessage: ""
      };
      reflector.get.mockReturnValue(responseMessage);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "200-RECRUITMENT-008",
            responseDesc: "Success",
            data: [{ id: "1" }, { id: "2" }]
          });
          done();
        },
        error: done
      });
    });

    it("should trim additional message when empty", (done) => {
      // Arrange
      const mockData = { id: "1", name: "Test" };
      const responseMessage = {
        caseCode: "009",
        message: "Success",
        additionalMessage: "   "
      };
      reflector.get.mockReturnValue(responseMessage);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "200-RECRUITMENT-009",
            responseDesc: "Success",
            data: mockData
          });
          done();
        },
        error: done
      });
    });

    it("should handle response message with only additional message", (done) => {
      // Arrange
      const mockData = { id: "1", name: "Test" };
      const responseMessage = {
        caseCode: "010",
        message: "",
        additionalMessage: "Additional information"
      };
      reflector.get.mockReturnValue(responseMessage);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({
            responseCode: "200-RECRUITMENT-010",
            responseDesc: "Additional information",
            data: mockData
          });
          done();
        },
        error: done
      });
    });
  });
});
