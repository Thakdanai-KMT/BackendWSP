import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [SupabaseModule, AuthModule, AuditModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}