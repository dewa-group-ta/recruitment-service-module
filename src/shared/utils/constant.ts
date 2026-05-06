import { HttpStatus } from "@nestjs/common";
import { Role, TresponseMessage } from "./constant.type";
import * as dotenv from "dotenv";

dotenv.config();

export const serviceCode = String(process.env.SERVICE_CODE);

export const role: Role = {
  SUPER_ADM: "SADM",
  HR_MANAGER: "HRM",
  EMPLOYEE: "EMP",
  APPLICANT: "APL"
};

export const responseMessage: TresponseMessage = {
  SUCCESS: {
    httpStatus: HttpStatus.OK,
    caseCode: "00",
    message: "Success"
  },
  EMAIL_AVAILABLE: {
    httpStatus: HttpStatus.OK,
    caseCode: "01",
    message: "Email is available"
  },
  EMAIL_NOT_AVAILABLE: {
    httpStatus: HttpStatus.OK,
    caseCode: "02",
    message: "Email is not available"
  },
  SUCCESSFULLY_CREATED: {
    httpStatus: HttpStatus.CREATED,
    caseCode: "00",
    message: "Successfully created"
  },
  SUCCESSFULLY_UPDATED: {
    httpStatus: HttpStatus.CREATED,
    caseCode: "00",
    message: "Successfully updated"
  },
  SUCCESSFULLY_DELETED: {
    httpStatus: HttpStatus.CREATED,
    caseCode: "00",
    message: "Successfully deleted"
  },
  BAD_REQUEST: {
    httpStatus: HttpStatus.BAD_REQUEST,
    caseCode: "00",
    message: "Bad Request"
  },
  RECHECK_EMAIL: {
    httpStatus: HttpStatus.BAD_REQUEST,
    caseCode: "01",
    message: "Recheck Email"
  },
  EMPTY: {
    httpStatus: HttpStatus.BAD_REQUEST,
    caseCode: "04",
    message: "Empty Request Body"
  },
  UNAUTHORIZED_IP_REGISTER: {
    httpStatus: HttpStatus.UNAUTHORIZED,
    caseCode: "00",
    message: "Unauthorized IP register"
  },
  UNAUTHORIZED_AUTH: {
    httpStatus: HttpStatus.UNAUTHORIZED,
    caseCode: "01",
    message: "Unauthorized Auth"
  },
  UNAUTHORIZED_ROLES: {
    httpStatus: HttpStatus.UNAUTHORIZED,
    caseCode: "02",
    message: "Unauthorized Roles"
  },
  NOT_FOUND: {
    httpStatus: HttpStatus.NOT_FOUND,
    caseCode: "00",
    message: "Not Found"
  },
  FORBIDDEN: {
    httpStatus: HttpStatus.NOT_FOUND,
    caseCode: "00",
    message: "Forbidden"
  },
  FOUND: {
    httpStatus: HttpStatus.FOUND,
    caseCode: "01",
    message: "The data already exists"
  },
  INTERNAL_SERVER_ERROR: {
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    caseCode: "00",
    message: "Internal Server Error"
  },
  DATABASE_CONNECTION_ESTABLISHED: {
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    caseCode: "01",
    message: "Database Connection Established"
  },
  FAILED_GENERATE_JWT: {
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    caseCode: "02",
    message: "Failed to generate JWT"
  },
  FAILED_GET_RESPONSE_BODY: {
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    caseCode: "03",
    message: "Failed to get response body"
  },
  FAILED_GENERATE_ACCESS_TOKEN: {
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    caseCode: "04",
    message: "Failed to generate access token"
  },
  FAILED_CONVERT_TO_JSON: {
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    caseCode: "05",
    message: "Failed to convert to JSON"
  },
  FAILED_TO_UPLOAD_FILE: {
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    caseCode: "06",
    message: "Unable to upload file, something went wrong"
  },
  INVALID_FILE_EXTENSION: {
    httpStatus: HttpStatus.BAD_REQUEST,
    caseCode: "01",
    message: "Invalid File Extension"
  }
} as const;
