import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateMovementDto } from './dto/create-movement.dto.js';

@Injectable()
export class InventoryService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createMovement(dto: CreateMovementDto, createdBy: string) {
    const client = this.supabaseService.getClient();

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