import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller.js';
import { PromotionsService } from './promotions.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [SupabaseModule, AuthModule, AuditModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}