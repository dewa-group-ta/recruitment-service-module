// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { Request } from 'express';
// import { IS_PUBLIC_KEY } from 'src/shared/decorators/public.decorator';

// @Injectable()
// export class BasicAuthGuard implements CanActivate {
//   constructor(private reflector: Reflector) {}
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     if (isPublic) {
//       return true;
//     }
//     const request = context.switchToHttp().getRequest();
//     const token = this.extractTokenFromHeader(request);
//     if (!token) {
//       throw new UnauthorizedException();
//     }

//     const [username, password] = Buffer.from(token, 'base64')
//       .toString()
//       .split(':');

//     try {
//       if (
//         username === process.env.BASIC_AUTH_USERNAME &&
//         password === process.env.BASIC_AUTH_PASSWORD
//       ) {
//         return true;
//       }
//     } catch {
//       throw new UnauthorizedException();
//     }
//   }

//   private extractTokenFromHeader(request: Request): string | undefined {
//     const [type, token] = request.headers.authorization?.split(' ') ?? [];
//     return type === 'Basic' ? token : undefined;
//   }
// }
