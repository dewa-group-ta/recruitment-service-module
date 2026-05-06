import {
  ExceptionFilter,
  Catch,
  HttpException,
  ArgumentsHost
} from "@nestjs/common";
import { Response } from "express";
import { responseMessage, serviceCode } from "../utils/constant";

interface ErrorResponse {
  responseCode: string | null;
  responseDesc: string | null;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = this.getResponse(exception);
    this.sendResponse(host, response, exception);
  }

  private getResponse(exception: HttpException): ErrorResponse {
    const exceptionResponse = exception.getResponse() as {
      statusCode: number;
      message: string;
    };

    const errorExceptionResponse = exception.getResponse() as {
      responseCode: string;
      responseDesc: string;
    };

    switch (exception.name) {
      case "NotFoundException":
        return this.buildErrorResponse(
          responseMessage.NOT_FOUND,
          exception.message
        );
      case "UnauthorizedException":
        return this.buildErrorResponse(
          responseMessage.UNAUTHORIZED_AUTH,
          responseMessage.UNAUTHORIZED_AUTH.message
        );
      case "ForbiddenException":
        return this.buildErrorResponse(
          responseMessage.UNAUTHORIZED_ROLES,
          responseMessage.UNAUTHORIZED_ROLES.message
        );
      case "BadRequestException":
        return this.buildErrorResponse(
          responseMessage.BAD_REQUEST,
          exceptionResponse.message || responseMessage.BAD_REQUEST.message
        );
      case "ErrorException":
        return {
          responseCode: errorExceptionResponse.responseCode,
          responseDesc: errorExceptionResponse.responseDesc
        };
      case "ConflictException":
        return this.buildErrorResponse(
          responseMessage.FOUND,
          exceptionResponse.message || responseMessage.FOUND.message
        );
      default:
        return {
          responseCode:
            responseMessage.INTERNAL_SERVER_ERROR.httpStatus +
            serviceCode +
            responseMessage.INTERNAL_SERVER_ERROR.caseCode,
          responseDesc: exceptionResponse.message
        };
    }
  }

  private buildErrorResponse(
    responseMessage: { httpStatus: number; caseCode: string; message: string },
    message: string
  ): ErrorResponse {
    const { httpStatus, caseCode } = responseMessage;
    const responseCode = `${httpStatus}-${serviceCode}-${caseCode}`;
    return { responseCode, responseDesc: message };
  }

  private sendResponse(
    host: ArgumentsHost,
    response: ErrorResponse,
    exception: HttpException
  ): void {
    const ctx = host.switchToHttp();
    const responseStatus = exception.getStatus();
    const responseCtx = ctx.getResponse<Response>();
    responseCtx.status(responseStatus).send(response);
  }
}
