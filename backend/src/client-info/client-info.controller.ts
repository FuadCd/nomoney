import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('client-info')
export class ClientInfoController {
  @Get()
  getClientInfo(@Req() req: Request): { clientIp: string } {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined) ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';
    return { clientIp: ip || 'unknown' };
  }
}
