import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { CreateCustomerDto } from './dto/create-customer.dto.js';
import type { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(search?: string) {
    const client = this.supabaseService.getClient();
    let query = client.from('customers').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query.order('full_name', {
      ascending: true,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch customers: ${error.message}`,
      );
    }
    return { data, total: count ?? data.length };
  }

  async findOne(id: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch customer: ${error.message}`,
      );
    }
    if (!data) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }
    return data;
  }

  async create(dto: CreateCustomerDto) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('customers')
      .insert(dto)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('A customer with this data already exists');
      }
      throw new InternalServerErrorException(
        `Failed to create customer: ${error.message}`,
      );
    }
    return data;
  }

  async update(id: string, dto: UpdateCustomerDto, actorId: string) {
    const oldValue = await this.findOne(id);

    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('customers')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update customer: ${error.message}`,
      );
    }

    this.auditService.log({
      actorId,
      action: 'UPDATE',
      resourceType: 'customer',
      resourceId: id,
      oldValue,
      newValue: data,
    });

    return data;
  }

  async remove(id: string) {
    await this.findOne(id);
    const client = this.supabaseService.getClient();
    const { error } = await client.from('customers').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Cannot delete customer: still referenced by existing sales',
        );
      }
      throw new InternalServerErrorException(
        `Failed to delete customer: ${error.message}`,
      );
    }
    return { message: 'Customer deleted successfully' };
  }
}