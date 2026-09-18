import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { SettingsService } from './settings.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import type { UserProfile } from '../users/dto/user-profile.dto.js';

@Controller('settings')
@UseGuards(AuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async get() {
    const data = await this.settingsService.get();
    return { data };
  }

  @Patch()
  @Roles('ADMIN')
  async update(@Body() dto: UpdateSettingsDto, @Req() request: Request) {
    const user = (request as any).user as UserProfile;
    const data = await this.settingsService.update(dto, user.id);
    return { data };
  }
}