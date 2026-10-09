import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth.service.js';
import { UsersService } from '../../users/users.service.js';
import type { UserProfile } from '../../users/dto/user-profile.dto.js';

// VIEWER = โหมดดูตัวอย่าง: ผ่านได้เฉพาะ method ที่ไม่เขียนข้อมูล
const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    let profile: UserProfile;
    try {
      const payload = await this.authService.verifyToken(token);
      const userId = payload.sub as string;
      const email = payload.email as string;

      // หา/สร้าง profile ใน public.users แล้วแนบเข้า request
      profile = await this.usersService.findOrCreateProfile(userId, email);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    (request as any).user = profile;

    // อยู่นอก try/catch เพื่อให้เป็น 403 จริง ไม่ถูกแปลงเป็น 401
    // (frontend จะ signOut อัตโนมัติเมื่อเจอ 401)
    if (profile.role === 'VIEWER' && !READ_ONLY_METHODS.has(request.method)) {
      throw new ForbiddenException(
        'บัญชีนี้เป็นโหมดดูตัวอย่าง ไม่สามารถบันทึกหรือแก้ไขข้อมูลได้',
      );
    }

    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}