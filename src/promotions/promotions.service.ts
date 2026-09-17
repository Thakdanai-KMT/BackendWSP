import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { CreatePromotionDto } from './dto/create-promotion.dto.js';
import type { UpdatePromotionDto } from './dto/update-promotion.dto.js';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(productId?: string) {
    const client = this.supabaseService.getClient();
    let query = client.from('promotions').select('*', { count: 'exact' });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error, count } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch promotions: ${error.message}`,
      );
    }
    return { data, total: count ?? data.length };
  }

  async findOne(id: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('promotions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch promotion: ${error.message}`,
      );
    }
    if (!data) {
      throw new NotFoundException(`Promotion with id ${id} not found`);
    }
    return data;
  }

  async create(dto: CreatePromotionDto, actorId: string) {
    const client = this.supabaseService.getClient();

    // Step 1: ดึงต้นทุนสินค้ามาเช็คก่อน
    const { data: product, error: productError } = await client
      .from('products')
      .select('id, product_name, cost_price')
      .eq('id', dto.product_id)
      .maybeSingle();

    if (productError) {
      throw new InternalServerErrorException(
        `Failed to fetch product: ${productError.message}`,
      );
    }
    if (!product) {
      throw new NotFoundException(`Product with id ${dto.product_id} not found`);
    }

    const isBelowCost = dto.sale_price < product.cost_price;

    // Step 2: ถ้าต่ำกว่าต้นทุน และยังไม่ได้ confirm -> ปฏิเสธพร้อมข้อมูลให้ Frontend ทำ popup
       if (isBelowCost && !dto.confirm_below_cost) {
      throw new ConflictException({
        error: 'Conflict',
        message: `Sale price (${dto.sale_price}) is below cost price (${product.cost_price}) for "${product.product_name}". Confirm to proceed.`,
        requires_confirmation: true,
        product_name: product.product_name,
        cost_price: product.cost_price,
        requested_sale_price: dto.sale_price,
      });
    }

    // Step 3: บันทึกโปรโมชั่น
    const { data, error } = await client
      .from('promotions')
      .insert({
        product_id: dto.product_id,
        sale_price: dto.sale_price,
        is_below_cost: isBelowCost,
        created_by: actorId,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to create promotion: ${error.message}`,
      );
    }

    this.auditService.log({
      actorId,
      action: 'CREATE',
      resourceType: 'promotion',
      resourceId: data.id,
      newValue: data,
    });

    return data;
  }

  async update(id: string, dto: UpdatePromotionDto, actorId: string) {
    const oldValue = await this.findOne(id);

    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('promotions')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update promotion: ${error.message}`,
      );
    }

    this.auditService.log({
      actorId,
      action: 'UPDATE',
      resourceType: 'promotion',
      resourceId: id,
      oldValue,
      newValue: data,
    });

    return data;
  }
}