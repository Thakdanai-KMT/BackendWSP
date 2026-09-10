import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { InventoryService } from './inventory.service.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import type { UserProfile } from '../users/dto/user-profile.dto.js';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('inventory/movements')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'MANAGER')
  async createMovement(@Body() dto: CreateMovementDto, @Req() request: Request) {
    const user = (request as any).user as UserProfile;
    const data = await this.inventoryService.createMovement(dto, user.id);
    return { data };
  }

  @Get('products/:id/movements')
  async findByProduct(@Param('id') id: string) {
    const data = await this.inventoryService.findByProduct(id);
    return { data, meta: { total: data.length } };
  }
}