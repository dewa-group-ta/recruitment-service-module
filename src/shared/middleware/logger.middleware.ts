import { NextFunction, Request, Response } from "express";
import { NestMiddleware, RawBodyRequest, Logger } from "@nestjs/common";
import { tryStringify } from "src/shared/utils/stringify";

export class LoggerMiddleware implements NestMiddleware {
  private readonly maxDataLengthForLogging = 1000;

  /**
   * method http yang tidak perlu di-log, tambahkan ke list ini. contoh: OPTIONS dipakai browser untuk retrieve info, jadi tidak perlu di-log.
   */
  private readonly blackListMethods = ["OPTIONS"];

  /**
   * path yang tidak perlu di-log sama sekali, tambahkan ke list ini (contoh: /ignore-log).
   */
  private readonly blackListPaths = ["/ignore-log"];

  /**
   * path yang body response-nya tidak perlu di-log, tambahkan ke list ini.
   * beda dengan blackListPaths, request/response tetap ditampilkan, hanya body-nya yang di-skip.
   * cocok untuk response yang panjang seperti image, binary, atau file.
   */
  private readonly blackListResponseData = ["/ignore-body-response"];

  private readonly logger = new Logger();

  private readonly sensitiveFields = ["password"];

  use(
    request: RawBodyRequest<Request>,
    response: Response,
    next: NextFunction
  ): void {
    if (this.shouldSkipLog(request)) {
      return next();
    }

    this.logRequest(request);
    this.logResponse(response);
    next();
  }

  private shouldSkipLog(request: Request): boolean {
    return (
      this.isBlackList(request.baseUrl, this.blackListPaths) ||
      this.blackListMethods.includes(request.method.toUpperCase())
    );
  }

  private logRequest(request: RawBodyRequest<Request>): void {
    const timestamp = Date.now().toString();
    const defaultEnd = request.read.bind(request);
    defaultEnd.apply();
    const maskedBody = this.maskSensitiveFields(request.body);
    this.logger.log({
      msg: `request ${request.method.toUpperCase()} ${request.baseUrl}`,
      type: "request",
      reqId: request.header("x-request-id") || "",
      userId: request.header("x-user-id") || "",
      clientId: request.header("x-client-id") || "",
      roleId: request.header("x-role-id") || "",
      branchId: request.header("x-branch-id") || "",
      orgId: request.header("x-org-id") || "",
      path: request.baseUrl,
      method: request.method.toUpperCase(),
      query: tryStringify(request.query),
      payload: this.filterDataByMaxLength(tryStringify(maskedBody)),
      timestamp
    });
  }

  private maskSensitiveFields(body: any): any {
    const maskedBody = { ...body };
    for (const field of this.sensitiveFields) {
      if (maskedBody[field]) {
        maskedBody[field] = "********";
      }
    }
    return maskedBody;
  }

  private logResponse(response: Response): void {
    const requestStartTime = Date.now();
    const chunks: Buffer[] = [];

    this.logResponseEndCallback(response, () => {
      const requestTimeMillis = Date.now() - requestStartTime;
      const data = Buffer.concat(chunks).toString();

      this.logFormatResponse(response, requestTimeMillis, data);
    });
    this.logResponseWriteGetChunks(chunks, response);
    this.logResponseEndGetChunks(chunks, response);
  }

  private logFormatResponse(
    response: Response,
    requestTimeMillis: number,
    data: string
  ): void {
    const request = response.req;
    const method = request.method.toUpperCase();

    this.logger.log({
      msg: `response ${method} ${request.path} ${response.statusCode}`,
      type: "response",
      reqId: request.header("x-request-id") || "",
      userId: request.header("x-user-id") || "",
      clientId: request.header("x-client-id") || "",
      roleId: request.header("x-role-id") || "",
      branchId: request.header("x-branch-id") || "",
      path: request.path,
      method,
      httpStatus: response.statusCode,
      data: this.filterDataResponse(
        this.filterDataByMaxLength(tryStringify(data)),
        request.path
      ),
      requestTimeMillis
    });
  }

  private isBlackList(url: string, blackList: string[]): boolean {
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
    };
    const regex = new RegExp(
      blackList.map((path) => `^${escapeRegExp(path)}`).join("|")
    );
    return regex.test(url);
  }

  private filterDataResponse(data: string, url: string): string {
    return this.isBlackList(url, this.blackListResponseData)
      ? "*too long*"
      : data;
  }

  private filterDataByMaxLength(data: string): string {
    return data.length <= this.maxDataLengthForLogging
      ? data
      : data.slice(0, this.maxDataLengthForLogging) + "...";
  }

  private logResponseWriteGetChunks(
    chunks: Buffer[],
    response: Response
  ): void {
    const defaultWrite = response.write.bind(response);

    response.write = function write(
      chunk: any,
      encodingOrCallback?: BufferEncoding | ((error?: Error) => void),
      callback?: (error?: Error) => void
    ): boolean {
      if (typeof chunk === "string") {
        chunks.push(
          Buffer.from(
            chunk,
            typeof encodingOrCallback === "string"
              ? encodingOrCallback
              : "utf-8"
          )
        );
      } else if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      }

      if (typeof encodingOrCallback === "function") {
        return defaultWrite.apply(response, [chunk, encodingOrCallback]);
      }

      return defaultWrite.apply(response, [
        chunk,
        encodingOrCallback,
        callback
      ]);
    };
  }

  private logResponseEndGetChunks(chunks: Buffer[], response: Response): void {
    const defaultEnd = response.end.bind(response);

    response.end = function end(
      chunk?: any,
      encodingOrCallback?: BufferEncoding | (() => void),
      callback?: () => void
    ): Response<any, Record<string, any>> {
      if (typeof chunk === "string") {
        chunks.push(
          Buffer.from(
            chunk,
            typeof encodingOrCallback === "string"
              ? encodingOrCallback
              : "utf-8"
          )
        );
      } else if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      }

      if (typeof encodingOrCallback === "function") {
        return defaultEnd.apply(response, [chunk, encodingOrCallback]);
      }

      return defaultEnd.apply(response, [chunk, encodingOrCallback, callback]);
    };
  }

  private logResponseEndCallback(
    response: Response,
    callback: () => void
  ): void {
    const defaultEnd = response.end.bind(response);

    response.end = function end(
      ...args: never
    ): Response<any, Record<string, any>> {
      callback();
      return defaultEnd.apply(response, args);
    };
  }
}
