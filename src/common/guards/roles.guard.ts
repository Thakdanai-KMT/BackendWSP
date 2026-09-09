import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { UserProfile, UserRole } from '../../users/dto/user-profile.dto.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // ถ้า endpoint ไม่ได้ประกาศ @Roles(...) ไว้ = ไม่จำกัด role (แค่ต้อง login ผ่าน AuthGuard ก็พอ)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as UserProfile | undefined;

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}