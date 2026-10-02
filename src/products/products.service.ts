import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  // สินค้า "แพ็ก" ไม่มีสต็อกของตัวเองใน DB (คอลัมน์ stock_quantity ถูกปล่อย 0 เสมอ)
  // ฟังก์ชันนี้คำนวณสต็อกที่แท้จริงจากสินค้าฐาน (floor(base stock / bundle size))
  // แทนที่ก่อนส่งออกไปให้ client เสมอ ทำให้ Frontend อ่าน stock_quantity เหมือนสินค้าปกติได้เลย
  private applyBundleStock(products: any[]): any[] {
    const stockById = new Map(products.map((p) => [p.id, p.stock_quantity]));

    return products.map((p) => {
      if (!p.bundle_of_product_id || !p.bundle_quantity) {
        return p;
      }
      const baseStock = stockById.get(p.bundle_of_product_id) ?? 0;
      return {
        ...p,
        stock_quantity: Math.floor(baseStock / p.bundle_quantity),
      };
    });
  }

  // กันไม่ให้สร้างแพ็กที่ผูกกับสินค้าที่เป็นแพ็กอยู่แล้ว (ห้ามซ้อนแพ็กในแพ็ก)
  private async assertValidBundleBase(baseId: string) {
    const client = this.supabaseService.getClient();
    const { data: base, error } = await client
      .from('products')
      .select('id, bundle_of_product_id')
      .eq('id', baseId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to validate bundle base product: ${error.message}`,
      );
    }
    if (!base) {
      throw new ConflictException(
        'The specified bundle_of_product_id does not exist',
      );
    }
    if (base.bundle_of_product_id) {
      throw new ConflictException(
        'A bundle product cannot be based on another bundle product',
      );
    }
  }

  async findAll() {
    const client = this.supabaseService.getClient();

    const { data, error, count } = await client
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch products: ${error.message}`,
      );
    }

    return { data: this.applyBundleStock(data ?? []), total: count ?? data.length };
  }

  async findOne(id: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch product: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    if (data.bundle_of_product_id && data.bundle_quantity) {
      const { data: base, error: baseError } = await client
        .from('products')
        .select('stock_quantity')
        .eq('id', data.bundle_of_product_id)
        .maybeSingle();

      if (!baseError && base) {
        data.stock_quantity = Math.floor(
          base.stock_quantity / data.bundle_quantity,
        );
      }
    }

    return data;
  }

  async create(dto: CreateProductDto) {
    const client = this.supabaseService.getClient();

    if (dto.bundle_of_product_id) {
      await this.assertValidBundleBase(dto.bundle_of_product_id);
      // สินค้าแพ็กไม่เก็บสต็อกของตัวเองจริง บังคับให้เป็น 0 เสมอตอนบันทึกลง DB
      dto.stock_quantity = 0;
    }

    const { data, error } = await client
      .from('products')
      .insert(dto)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('A product with this data already exists');
      }
      if (error.code === '23503') {
        throw new ConflictException(
          'The specified category_id or bundle_of_product_id does not exist',
        );
      }
      if (error.code === '23514') {
        throw new ConflictException(
          'Invalid bundle configuration: bundle_of_product_id and bundle_quantity must be set together, quantity must be greater than 0, and a product cannot bundle itself',
        );
      }
      throw new InternalServerErrorException(
        `Failed to create product: ${error.message}`,
      );
    }

    return data;
  }

  async update(id: string, dto: UpdateProductDto, actorId: string) {
    const oldValue = await this.findOne(id);

    if (dto.bundle_of_product_id) {
      await this.assertValidBundleBase(dto.bundle_of_product_id);
      dto.stock_quantity = 0;
    }

    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('products')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23514') {
        throw new ConflictException(
          'Invalid bundle configuration: bundle_of_product_id and bundle_quantity must be set together, quantity must be greater than 0, and a product cannot bundle itself',
        );
      }
      throw new InternalServerErrorException(
        `Failed to update product: ${error.message}`,
      );
    }

    // fire-and-forget: ไม่ await ให้บล็อก response กลับไปหา client
    this.auditService.log({
      actorId,
      action: 'UPDATE',
      resourceType: 'product',
      resourceId: id,
      oldValue,
      newValue: data,
    });

    return data;
  }

  async remove(id: string) {
    await this.findOne(id);

    const client = this.supabaseService.getClient();

    const { error } = await client.from('products').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Cannot delete this product because other products are bundled from it. Delete or re-link those bundle products first.',
        );
      }
      throw new InternalServerErrorException(
        `Failed to delete product: ${error.message}`,
      );
    }

    return { message: 'Product deleted successfully' };
  }
}