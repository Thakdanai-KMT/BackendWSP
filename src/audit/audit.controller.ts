import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuditService } from './audit.service.js';

@Controller('audit-logs')
@UseGuards(AuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN')
  async findAll(@Query('resource_type') resourceType?: string) {
    const { data, total } = await this.auditService.findAll(resourceType);
    return { data, meta: { total } };
  }
}