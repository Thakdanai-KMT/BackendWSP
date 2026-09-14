import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [SupabaseModule, AuthModule, AuditModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}