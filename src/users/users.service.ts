import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { UserProfile } from './dto/user-profile.dto.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * หา profile จาก public.users ด้วย id (ตรงกับ auth.users.id)
   * ถ้าไม่พบ ให้สร้างใหม่อัตโนมัติ (auto-provisioning) ด้วย role default = CASHIER
   */
  async findOrCreateProfile(
    userId: string,
    email: string,
  ): Promise<UserProfile> {
    const client = this.supabaseService.getClient();

    const { data: existing, error: findError } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to look up user profile: ${findError.message}`);
    }

    if (existing) {
      return existing as UserProfile;
    }

    this.logger.log(`Auto-provisioning new user profile for ${email}`);

    const { data: created, error: insertError } = await client
      .from('users')
      .insert({
        id: userId,
        email,
        full_name: email, // ยังไม่มีข้อมูลชื่อจริงตอน auto-create ใช้ email ไปก่อน แก้ทีหลังได้
        role: 'CASHIER',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create user profile: ${insertError.message}`);
    }

    return created as UserProfile;
  }
}