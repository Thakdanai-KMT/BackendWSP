import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { PromotionsService } from './promotions.service.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { UpdatePromotionDto } from './dto/update-promotion.dto.js';
import type { UserProfile } from '../users/dto/user-profile.dto.js';

@Controller('promotions')
@UseGuards(AuthGuard, RolesGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  async findAll(@Query('product_id') productId?: string) {
    const { data, total } = await this.promotionsService.findAll(productId);
    return { data, meta: { total } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.promotionsService.findOne(id);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'MANAGER')
  async create(@Body() dto: CreatePromotionDto, @Req() request: Request) {
    const user = (request as any).user as UserProfile;
    const data = await this.promotionsService.create(dto, user.id);
    return { data };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
    @Req() request: Request,
  ) {
    const user = (request as any).user as UserProfile;
    const data = await this.promotionsService.update(id, dto, user.id);
    return { data };
  }
}