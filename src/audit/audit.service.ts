import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Fire-and-forget: ไม่ throw error ถ้าบันทึก log ไม่สำเร็จ
   * เพราะการบันทึก audit log ไม่ควรทำให้ business operation หลักล้มเหลวไปด้วย
   */
  async log(params: {
    actorId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    resourceType: string;
    resourceId?: string;
    oldValue?: unknown;
    newValue?: unknown;
  }): Promise<void> {
    try {
      const client = this.supabaseService.getClient();
      const { error } = await client.from('audit_logs').insert({
        actor_id: params.actorId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId ?? null,
        old_value: params.oldValue ?? null,
        new_value: params.newValue ?? null,
      });

      if (error) {
        this.logger.error(`Failed to write audit log: ${error.message}`);
      }
    } catch (err) {
      this.logger.error(
        `Unexpected error writing audit log: ${(err as Error).message}`,
      );
    }
  }

  async findAll(resourceType?: string) {
    const client = this.supabaseService.getClient();
    let query = client
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(`Failed to fetch audit logs: ${error.message}`);
      return { data: [], total: 0 };
    }

    return { data, total: count ?? data.length };
  }
}