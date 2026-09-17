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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Audit } from '../audit/audit.decorator.js';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import type { UserProfile } from '../users/dto/user-profile.dto.js';

@Controller('customers')
@UseGuards(AuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    const { data, total } = await this.customersService.findAll(search);
    return { data, meta: { total } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.findOne(id);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Audit('CREATE', 'customer')
  async create(@Body() dto: CreateCustomerDto) {
    const data = await this.customersService.create(dto);
    return { data };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() request: Request,
  ) {
    const user = (request as any).user as UserProfile;
    const data = await this.customersService.update(id, dto, user.id);
    return { data };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  @Audit('DELETE', 'customer')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }
}