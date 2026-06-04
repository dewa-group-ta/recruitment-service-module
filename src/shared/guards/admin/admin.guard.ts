// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   Logger,
// } from "@nestjs/common";
// import { Reflector } from "@nestjs/core";
// import { UserService } from 'src/modules/system/services/user.service';
// import { ROLES } from "src/shared/decorators/roles.decorator";
// import { AgataHeaders } from "src/shared/interface/agata.interface";
// import { responseMessage } from "src/shared/utils/constant";
// import { ErrorException } from "src/shared/utils/custom.exceptions";

// @Injectable()
// export class AdminGuard implements CanActivate {
//   constructor(
//     private reflector: Reflector,
//     private userService: UserService,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const roles = this.reflector.get<string[]>(ROLES, context.getHandler());
//     if (!roles) {
//       // Jika endpoint ini tidak memerlukan role khusus, langsung true saja
//       return true;
//     }

//     const headers: AgataHeaders = context.switchToHttp().getRequest().agata;

//     // Pastikan userAdmin bukan null/undefined
//     const userAdmin = await this.userService.isAdmin(headers.userId);
//     if (!userAdmin || !userAdmin.roleAdmin) {
//       // Berikan error atau handle sesuai kebutuhan Anda
//       throw new ErrorException(
//         responseMessage.UNAUTHORIZED_ROLES,
//         'User admin role not found or invalid.',
//       );
//     }

//     // Jika userAdmin ada dan userAdmin.roleAdmin juga ada,
//     // cek apakah roles yang dibutuhkan ada di userAdmin.roleAdmin
//     if (roles.includes(userAdmin.roleAdmin)) {
//       return true;
//     } else {
//       Logger.error('Please check your admin role.');
//       throw new ErrorException(
//         responseMessage.UNAUTHORIZED_ROLES,
//         'Please check your admin role.',
//       );
//     }
//   }
// }
