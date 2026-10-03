import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateMovementDto } from './dto/create-movement.dto.js';

@Injectable()
export class InventoryService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createMovement(dto: CreateMovementDto, createdBy: string) {
    const client = this.supabaseService.getClient();

    // สินค้าแพ็กไม่มีสต็อกของตัวเอง (คำนวณจากสินค้าฐานเสมอ)
    // ต้องเช็คก่อนเรียก RPC เพื่อกันไม่ให้มีใครไปปรับ stock_quantity ของแพ็กตรงๆ
    // ซึ่งจะทำให้ตัวเลขไม่สอดคล้องกับสินค้าฐานทันที
    const { data: product, error: productError } = await client
      .from('products')
      .select('id, product_name, bundle_of_product_id')
      .eq('id', dto.product_id)
      .maybeSingle();

    if (productError) {
      throw new InternalServerErrorException(
        `Failed to look up product: ${productError.message}`,
      );
    }
    if (!product) {
      throw new NotFoundException(`Product with id ${dto.product_id} not found`);
    }
    if (product.bundle_of_product_id) {
      throw new BadRequestException(
        `"${product.product_name}" is a bundle/pack product and has no stock of its own. ` +
          `Its stock is calculated automatically from the base product. ` +
          `Adjust the base product's stock instead.`,
      );
    }

    const { data, error } = await client.rpc('create_inventory_movement', {
      p_product_id: dto.product_id,
      p_movement_type: dto.movement_type,
      p_quantity_change: dto.quantity_change,
      p_reason: dto.reason ?? null,
      p_created_by: createdBy,
    });

    if (error) {
      // code 23503 = foreign_key_violation (product_id ไม่มีอยู่จริง)
      if (error.code === '23503') {
        throw new BadRequestException('The specified product_id does not exist');
      }
      throw new InternalServerErrorException(
        `Failed to create inventory movement: ${error.message}`,
      );
    }

    return data;
  }

  async findByProduct(productId: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('inventory_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch inventory movements: ${error.message}`,
      );
    }

    return data;
  }
}