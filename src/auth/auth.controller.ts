import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './guards/auth.guard.js';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() request: Request) {
    return { user: (request as any).user };
  }
}