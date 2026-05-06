/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, map } from "rxjs";
import { ResponseMessageKey } from "src/shared/decorators/response.decorator";
import { serviceCode } from "src/shared/utils/constant";
import { Response as ExpressResponse } from "express";

export interface Response<T> {
  responseCode: string;
  responseDesc: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    const responseMessage: {
      caseCode: string;
      message: string;
      additionalMessage: string;
    } = this.reflector.get<{
      caseCode: string;
      message: string;
      additionalMessage: string;
    }>(ResponseMessageKey, context.getHandler()) || {
      caseCode: "",
      message: "",
      additionalMessage: ""
    };

    return next.handle().pipe(
      map((data) => {
        const statusCode = context
          .switchToHttp()
          .getResponse<ExpressResponse>()
          .statusCode.toString();

        const responseCode = `${statusCode}-${serviceCode}-${responseMessage.caseCode}`;

        const responseDesc =
          `${responseMessage.message} ${responseMessage.additionalMessage}`.trim();

        let result = data;
        let pagination = null;

        let isPaginate = false;
        if (data && typeof data === "object") {
          isPaginate = "pagination" in data;
        }
        if (isPaginate) {
          const { data: paginatedResult, pagination: _pagination } = data;
          result = paginatedResult;
          pagination = _pagination;
        }

        return {
          responseCode,
          responseDesc,
          data: result,
          ...(pagination ? { pagination } : {})
        };
      })
    );
  }
}
