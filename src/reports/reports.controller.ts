import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ReportsService } from './reports.service.js';
import { EmailService } from '../email/email.service.js';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto.js';
import { todayInThailand } from '../common/utils/thai-date.js';

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
    const targetDate = date ?? todayInThailand();
    const data = await this.reportsService.getDailySalesReport(targetDate);
    return { data };
  }

  @Get('sales-summary')
  @Roles('ADMIN', 'MANAGER')
  async getSalesSummary(@Query() query: SalesSummaryQueryDto) {
    const data = await this.reportsService.getSalesSummary(query.from, query.to);
    return { data };
  }

  @Post('daily-sales/send')
  @Roles('ADMIN', 'MANAGER')
  async sendDailySales(@Query('date') date?: string) {
    const targetDate = date ?? todayInThailand();
    const data = await this.emailService.sendDailySalesReport(targetDate);
    return { data };
  }
}