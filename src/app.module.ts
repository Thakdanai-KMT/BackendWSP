import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
// import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { SalesModule } from './sales/sales.module.js';
import { ReportsModule } from './reports/reports.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // ThrottlerModule.forRoot([
    //   {
    //     ttl: 60000, // 60 วินาที (หน่วยเป็น milliseconds)
    //     limit: 100, // 100 requests ต่อ 60 วินาที
    //   },
    // ]),
    
    SupabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    InventoryModule,
    SalesModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    // AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}