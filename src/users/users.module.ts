import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}