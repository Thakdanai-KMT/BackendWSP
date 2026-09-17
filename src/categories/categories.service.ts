import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    const client = this.supabaseService.getClient();
    const { data, error, count } = await client
      .from('categories')
      .select('*', { count: 'exact' })
      .order('category_name', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch categories: ${error.message}`,
      );
    }
    return { data, total: count ?? data.length };
  }

  async findOne(id: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch category: ${error.message}`,
      );
    }
    if (!data) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return data;
  }

  async create(dto: CreateCategoryDto) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('categories')
      .insert(dto)
      .select()
      .single();

    if (error) {
      if (error.code === '23503') {
        throw new BadRequestException('The specified parent_id does not exist');
      }
      throw new InternalServerErrorException(
        `Failed to create category: ${error.message}`,
      );
    }
    return data;
  }

  async update(id: string, dto: UpdateCategoryDto, actorId: string) {
    const oldValue = await this.findOne(id);

    if (dto.parent_id === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('categories')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23503') {
        throw new BadRequestException('The specified parent_id does not exist');
      }
      throw new InternalServerErrorException(
        `Failed to update category: ${error.message}`,
      );
    }

    this.auditService.log({
      actorId,
      action: 'UPDATE',
      resourceType: 'category',
      resourceId: id,
      oldValue,
      newValue: data,
    });

    return data;
  }

  async remove(id: string) {
    await this.findOne(id);
    const client = this.supabaseService.getClient();
    const { error } = await client.from('categories').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new BadRequestException(
          'Cannot delete category: it is still referenced by products or sub-categories',
        );
      }
      throw new InternalServerErrorException(
        `Failed to delete category: ${error.message}`,
      );
    }
    return { message: 'Category deleted successfully' };
  }
}