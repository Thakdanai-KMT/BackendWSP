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

  async create(dto: CreateSaleDto, cashierId: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.rpc('create_sale', {
      p_cashier_id: cashierId,
      p_payment_method: dto.payment_method,
      p_items: dto.items,
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