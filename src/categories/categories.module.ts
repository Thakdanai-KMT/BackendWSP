import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [SupabaseModule, AuthModule, AuditModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}