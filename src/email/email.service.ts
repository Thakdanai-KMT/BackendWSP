import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import ExcelJS from 'exceljs';
import { ReportsService } from '../reports/reports.service.js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor(
    private readonly configService: ConfigService,
    private readonly reportsService: ReportsService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY in environment variables');
    }
    this.resend = new Resend(apiKey);
  }

  async sendDailySalesReport(date: string) {
    const report = await this.reportsService.getDailySalesReport(date);
    const toEmail = this.configService.get<string>('REPORT_EMAIL_TO');

    if (!toEmail) {
      throw new Error('Missing REPORT_EMAIL_TO in environment variables');
    }

    const excelBuffer = await this.buildExcelReport(date, report);

    const { error } = await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: toEmail,
      subject: `สรุปยอดขายประจำวัน ${date}`,
      html: `
        <h2>สรุปยอดขายวันที่ ${date}</h2>
        <p>ยอดขายรวม: ${report.total_sales.toLocaleString()} บาท</p>
        <p>จำนวนบิล: ${report.total_bills} บิล</p>
        <p>ดูรายละเอียดสินค้าขายดีในไฟล์ Excel ที่แนบมา</p>
      `,
      attachments: [
        {
          filename: `sales-report-${date}.xlsx`,
          content: excelBuffer,
        },
      ],
    });

    if (error) {
      this.logger.error(`Failed to send report email: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to send report email: ${error.message}`,
      );
    }

    this.logger.log(`Daily sales report sent for ${date}`);
    return { message: 'Report sent successfully' };
  }

  private async buildExcelReport(
    date: string,
    report: Awaited<ReturnType<ReportsService['getDailySalesReport']>>,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Sales ${date}`);

    sheet.addRow(['สรุปยอดขายประจำวัน', date]);
    sheet.addRow(['ยอดขายรวม', report.total_sales]);
    sheet.addRow(['จำนวนบิล', report.total_bills]);
    sheet.addRow([]);
    sheet.addRow(['สินค้าขายดี', 'จำนวนที่ขาย', 'ยอดขาย']);

    for (const product of report.top_products) {
      sheet.addRow([product.product_name, product.quantity_sold, product.revenue]);
    }

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(5).font = { bold: true };
    sheet.columns.forEach((col) => (col.width = 20));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}