import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly supabaseService: SupabaseService) {}

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

    return { data, total: count ?? data.length };
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

    return data;
  }

  async create(dto: CreateProductDto) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('products')
      .insert(dto)
      .select()
      .single();

    if (error) {
      // code 23505 = unique_violation ใน PostgreSQL
      if (error.code === '23505') {
        throw new ConflictException('A product with this data already exists');
      }
      throw new InternalServerErrorException(
        `Failed to create product: ${error.message}`,
      );
    }

    return data;
  }

  async update(id: string, dto: UpdateProductDto) {
    // เช็คก่อนว่ามี product นี้อยู่จริงหรือไม่ (จะ throw NotFoundException ถ้าไม่เจอ)
    await this.findOne(id);

    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('products')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update product: ${error.message}`,
      );
    }

    return data;
  }

  async remove(id: string) {
    await this.findOne(id);

    const client = this.supabaseService.getClient();

    const { error } = await client.from('products').delete().eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to delete product: ${error.message}`,
      );
    }

    return { message: 'Product deleted successfully' };
  }
}