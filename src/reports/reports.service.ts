import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import {
  daysInclusive,
  isValidIsoDate,
} from '../common/utils/thai-date.js';

export interface DailySalesReport {
  total_sales: number;
  total_bills: number;
  top_products: { product_name: string; quantity_sold: number; revenue: number }[];
}

export interface SalesSummary {
  from: string;
  to: string;
  total_sales: number;
  total_bills: number;
  cancelled_bills: number;
  cancelled_amount: number;
  daily: { day: string; bills: number; sales: number }[];
  payments: { payment_method: string; bills: number; amount: number }[];
  top_products: { product_name: string; quantity_sold: number; revenue: number }[];
}

// กันการขอช่วงยาวเกินไป (ฟังก์ชันสร้างแถวทุกวันในช่วงที่ขอ)
const MAX_RANGE_DAYS = 366;

@Injectable()
export class ReportsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getDailySalesReport(date: string): Promise<DailySalesReport> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.rpc('get_daily_sales_report', {
      p_date: date,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to generate report: ${error.message}`,
      );
    }

    // RPC ที่ return `table (...)` จะได้ array กลับมาเสมอ (แม้จะมีแค่ 1 แถว)
    const report = data[0];

    return {
      total_sales: Number(report.total_sales),
      total_bills: Number(report.total_bills),
      top_products: report.top_products,
    };
  }

  async getSalesSummary(from: string, to: string): Promise<SalesSummary> {
    if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
      throw new BadRequestException('from and to must be valid dates (YYYY-MM-DD)');
    }
    if (from > to) {
      throw new BadRequestException('from must not be after to');
    }
    if (daysInclusive(from, to) > MAX_RANGE_DAYS) {
      throw new BadRequestException(
        `Date range must not exceed ${MAX_RANGE_DAYS} days`,
      );
    }

    const client = this.supabaseService.getClient();

    const { data, error } = await client.rpc('get_sales_summary', {
      p_from: from,
      p_to: to,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to generate sales summary: ${error.message}`,
      );
    }

    // ฟังก์ชันนี้ return jsonb ก้อนเดียว ไม่ใช่ table จึงได้ object กลับมาตรงๆ
    return data as SalesSummary;
  }
}