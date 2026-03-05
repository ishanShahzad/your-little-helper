import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NearbyService } from './nearby.service';

@Controller('nearby')
@UseGuards(JwtAuthGuard)
export class NearbyController {
  constructor(private readonly nearbyService: NearbyService) {}

  @Post('check')
  async check(@Req() req: any, @Body() body: { lat: number; lng: number }) {
    const data = await this.nearbyService.checkNearby(req.user.userId, body.lat, body.lng);
    return { success: true, data };
  }
}
