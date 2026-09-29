import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateSaleDto } from './dto/create-sale.dto.js';

@Injectable()
export class SalesService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async findAll() {
    const client = this.supabaseService.getClient();

    const { data, error, count } = await client
      .from('sales')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch sales: ${error.message}`,
      );
    }

    return { data: data ?? [], total: count ?? 0 };
  }
    async getTopProducts(from: string, to: string, limit: number) {
    const client = this.supabaseService.getClient();

    // Step 1: หาบิลที่ไม่ถูกยกเลิก ในช่วงวันที่ที่เลือก
    const { data: salesInRange, error: salesError } = await client
      .from('sales')
      .select('id')
      .neq('status', 'CANCELLED')
      .gte('created_at', `${from}T00:00:00.000Z`)
      .lte('created_at', `${to}T23:59:59.999Z`);

    if (salesError) {
      throw new InternalServerErrorException(
        `Failed to fetch sales for top products: ${salesError.message}`,
      );
    }

    const saleIds = (salesInRange ?? []).map((s) => s.id);
    if (saleIds.length === 0) return [];

    // Step 2: ดึงรายการสินค้าทั้งหมดของบิลเหล่านั้น
    const { data: items, error: itemsError } = await client
      .from('sale_items')
      .select('product_id, quantity, unit_price')
      .in('sale_id', saleIds);

    if (itemsError) {
      throw new InternalServerErrorException(
        `Failed to fetch sale items for top products: ${itemsError.message}`,
      );
    }

    // Step 3: รวมยอดตาม product_id
    const totals = new Map<string, { quantity: number; revenue: number }>();
    for (const item of items ?? []) {
      const existing = totals.get(item.product_id) ?? {
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.quantity * item.unit_price;
      totals.set(item.product_id, existing);
    }

    // Step 4: เอาแค่ top N แล้วค่อยดึงชื่อสินค้ามาแนบ (ลด query ไม่ต้องดึงทุกตัว)
    const ranked = [...totals.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, limit);

    const productIds = ranked.map(([id]) => id);
    const { data: products, error: productsError } = await client
      .from('products')
      .select('id, product_name')
      .in('id', productIds);

    if (productsError) {
      throw new InternalServerErrorException(
        `Failed to fetch products for top products: ${productsError.message}`,
      );
    }

    const nameById = new Map(
      (products ?? []).map((p) => [p.id, p.product_name]),
    );

    return ranked.map(([productId, stat]) => ({
      product_id: productId,
      product_name: nameById.get(productId) ?? '(ไม่พบสินค้า)',
      quantity_sold: stat.quantity,
      revenue: stat.revenue,
    }));
  }
  async create(dto: CreateSaleDto, cashierId: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.rpc('create_sale', {
      p_cashier_id: cashierId,
      p_payment_method: dto.payment_method,
      p_items: dto.items,
      p_customer_id: dto.customer_id ?? null,
    });

    if (error) {
      this.handleSaleError(error);
    }

    return data;
  }

  async cancel(saleId: string, cancelledBy: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.rpc('cancel_sale', {
      p_sale_id: saleId,
      p_cancelled_by: cancelledBy,
    });

    if (error) {
      this.handleSaleError(error);
    }

    return data;
  }

  async findOne(id: string) {
    const client = this.supabaseService.getClient();

    const { data: sale, error: saleError } = await client
      .from('sales')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (saleError) {
      throw new InternalServerErrorException(
        `Failed to fetch sale: ${saleError.message}`,
      );
    }

    if (!sale) {
      throw new NotFoundException(`Sale with id ${id} not found`);
    }

    const { data: items, error: itemsError } = await client
      .from('sale_items')
      .select('*')
      .eq('sale_id', id);

    if (itemsError) {
      throw new InternalServerErrorException(
        `Failed to fetch sale items: ${itemsError.message}`,
      );
    }

    return { ...sale, items };
  }

  private handleSaleError(error: { message: string }): never {
    // ข้อความ error ที่มาจาก `raise exception` ใน PostgreSQL function
    // จะอยู่ใน error.message ตรงๆ พร้อม prefix ที่เราตั้งชื่อไว้
    if (error.message.includes('INSUFFICIENT_STOCK')) {
      throw new BadRequestException(error.message);
    }
    if (error.message.includes('PRODUCT_INACTIVE')) {
      throw new BadRequestException(error.message);
    }
    if (error.message.includes('PRODUCT_NOT_FOUND')) {
      throw new BadRequestException(error.message);
    }
    if (error.message.includes('SALE_NOT_FOUND')) {
      throw new NotFoundException(error.message);
    }
    if (error.message.includes('ALREADY_CANCELLED')) {
      throw new BadRequestException(error.message);
    }
    throw new InternalServerErrorException(
      `Sale operation failed: ${error.message}`,
    );
  }
}