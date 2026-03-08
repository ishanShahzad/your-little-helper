import { Controller, Post, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NearbyService } from './nearby.service';

@Controller('nearby')
@UseGuards(JwtAuthGuard)
export class NearbyController {
  constructor(private readonly nearbyService: NearbyService) { }

  @Post('check')
  async check(@Req() req: any, @Body() body: { lat: number; lng: number }) {
    const data = await this.nearbyService.checkNearby(req.user.userId, body.lat, body.lng);
    return { success: true, data };
  }

  @Post('wave')
  async wave(@Req() req: any, @Body() body: { toUserId: string }) {
    const data = await this.nearbyService.wave(req.user.userId, body.toUserId);
    return { success: true, data };
  }

  @Post('report')
  @HttpCode(201)
  async report(@Req() req: any, @Body() body: { reportedUserId: string; reason?: string }) {
    await this.nearbyService.report(
      req.user.userId,
      body.reportedUserId,
      body.reason || 'no reason given',
    );
    return { success: true };
  }
}
