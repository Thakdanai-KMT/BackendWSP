import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Audit } from '../audit/audit.decorator.js';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import type { UserProfile } from '../users/dto/user-profile.dto.js';

@Controller('products')
@UseGuards(AuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    const { data, total } = await this.productsService.findAll();
    return { data, meta: { total } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.productsService.findOne(id);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'MANAGER')
  @Audit('CREATE', 'product')
  async create(@Body() dto: CreateProductDto) {
    const data = await this.productsService.create(dto);
    return { data };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @Req() request: Request,
  ) {
    const user = (request as any).user as UserProfile;
    const data = await this.productsService.update(id, dto, user.id);
    return { data };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  @Audit('DELETE', 'product')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}