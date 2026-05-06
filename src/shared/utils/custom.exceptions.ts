import { HttpException } from "@nestjs/common";
import { serviceCode } from "./constant";

interface ErrorExceptionProps {
  httpStatus: number;
  caseCode: string;
  message: string;
}

export class ErrorException extends HttpException {
  constructor(
    { httpStatus, caseCode, message }: ErrorExceptionProps,
    additionalMessage = ""
  ) {
    super(
      {
        responseCode: httpStatus + serviceCode + caseCode,
        responseDesc: `${message} ${additionalMessage}`
      },
      httpStatus
    );
  }
}
