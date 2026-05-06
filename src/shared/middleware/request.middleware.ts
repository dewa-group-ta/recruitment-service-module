import { NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

export class RequestMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const requestId = request.header("x-client-id") || randomUUID();
    request.headers["x-client-id"] = requestId;

    request["agata"] = {
      reqId: request.header("x-request-id") || "",
      userId: request.header("x-user-id") || "",
      clientId: request.header("x-client-id") || "",
      roleId: request.header("x-role-id") || "",
      branchId: request.header("x-branch-id") || "",
      orgId: request.header("x-org-id") || ""
    };

    next();
  }
}
