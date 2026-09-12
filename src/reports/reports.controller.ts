import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ReportsService } from './reports.service.js';
import { EmailService } from '../email/email.service.js';

@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly emailService: EmailService,
  ) {}

  @Get('daily-sales')
  @Roles('ADMIN', 'MANAGER')
  async getDailySales(@Query('date') date?: string) {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const data = await this.reportsService.getDailySalesReport(targetDate);
    return { data };
  }

  @Post('daily-sales/send')
  @Roles('ADMIN', 'MANAGER')
  async sendDailySales(@Query('date') date?: string) {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const data = await this.emailService.sendDailySalesReport(targetDate);
    return { data };
  }
}