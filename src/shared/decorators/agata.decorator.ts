import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AgataHeaders } from "../interface/agata.interface";
import { Request } from "express";

export const Agata = createParamDecorator(
  (data: unknown, context: ExecutionContext): AgataHeaders => {
    const request = context.switchToHttp().getRequest<Request>();
    return request["agata"];
  }
);
