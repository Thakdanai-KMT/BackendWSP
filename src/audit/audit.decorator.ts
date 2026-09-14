import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  action: 'CREATE' | 'DELETE';
  resourceType: string;
}

export const Audit = (action: 'CREATE' | 'DELETE', resourceType: string) =>
  SetMetadata(AUDIT_KEY, { action, resourceType } as AuditMetadata);