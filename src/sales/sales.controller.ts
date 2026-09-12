import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
// import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { SalesService } from './sales.service.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import type { UserProfile } from '../users/dto/user-profile.dto.js';

@Controller('sales')
@UseGuards(AuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  // @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(@Body() dto: CreateSaleDto, @Req() request: Request) {
    const user = (request as any).user as UserProfile;
    const data = await this.salesService.create(dto, user.id);
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.salesService.findOne(id);
    return { data };
  }

  @Post(':id/cancel')
  @Roles('ADMIN', 'MANAGER')
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Req() request: Request) {
    const user = (request as any).user as UserProfile;
    const data = await this.salesService.cancel(id, user.id);
    return { data };
  }
}