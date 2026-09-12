import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

export interface DailySalesReport {
  total_sales: number;
  total_bills: number;
  top_products: { product_name: string; quantity_sold: number; revenue: number }[];
}

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
}