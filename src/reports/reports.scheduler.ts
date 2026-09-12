import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class ReportsScheduler {
  private readonly logger = new Logger(ReportsScheduler.name);

  constructor(private readonly emailService: EmailService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailySalesReport() {
    // เที่ยงคืนของวันใหม่ = ต้องส่งรายงานของ "เมื่อวาน" (วันที่เพิ่งจบไป)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    this.logger.log(`Running scheduled daily sales report for ${dateStr}`);

    try {
      await this.emailService.sendDailySalesReport(dateStr);
      this.logger.log(`Scheduled report sent successfully for ${dateStr}`);
    } catch (error) {
      // สำคัญมาก: ต้อง catch error ไว้ ไม่ปล่อยให้ scheduled job ทั้งตัว crash
      this.logger.error(
        `Scheduled report failed for ${dateStr}: ${(error as Error).message}`,
      );
    }
  }
}