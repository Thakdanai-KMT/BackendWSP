import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_KEY, AuditMetadata } from './audit.decorator.js';
import { AuditService } from './audit.service.js';
import type { UserProfile } from '../users/dto/user-profile.dto.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditMeta = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditMeta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as UserProfile | undefined;

    return next.handle().pipe(
      tap((response: any) => {
        if (!user) return;

        const resource = response?.data ?? response;
        const resourceId = resource?.id;

        this.auditService.log({
          actorId: user.id,
          action: auditMeta.action,
          resourceType: auditMeta.resourceType,
          resourceId,
          newValue: auditMeta.action === 'CREATE' ? resource : undefined,
          oldValue: auditMeta.action === 'DELETE' ? undefined : undefined,
        });
      }),
    );
  }
}