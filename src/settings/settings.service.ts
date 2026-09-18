import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { UpdateSettingsDto } from './dto/update-settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async get() {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch settings: ${error.message}`,
      );
    }

    return data;
  }

  async update(dto: UpdateSettingsDto, actorId: string) {
    const oldValue = await this.get();

    const client = this.supabaseService.getClient();

    // ถ้าแก้ extra ให้ merge กับของเดิม (ไม่ใช่เขียนทับทั้งหมด)
    // เพื่อป้องกันการลบ key อื่นที่ไม่ได้ตั้งใจแก้ในครั้งนี้
    const mergedExtra = dto.extra
      ? { ...(oldValue.extra as object), ...dto.extra }
      : undefined;

    const { data, error } = await client
      .from('settings')
      .update({
        ...dto,
        ...(mergedExtra ? { extra: mergedExtra } : {}),
        updated_at: new Date().toISOString(),
        updated_by: actorId,
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update settings: ${error.message}`,
      );
    }

    this.auditService.log({
      actorId,
      action: 'UPDATE',
      resourceType: 'settings',
      resourceId: '1',
      oldValue,
      newValue: data,
    });

    return data;
  }
}