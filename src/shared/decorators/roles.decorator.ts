import { SetMetadata } from "@nestjs/common";

export const ROLES = "isRole";
export const IsRole = (...roles: string[]) => SetMetadata(ROLES, roles);
