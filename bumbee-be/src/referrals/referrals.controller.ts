import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('my-code')
  async getMyCode(@Req() req: any) {
    const data = await this.referralsService.getMyCode(req.user.userId);
    return { success: true, data };
  }

  @Post('share')
  async share(@Req() req: any) {
    const data = await this.referralsService.getShareText(req.user.userId);
    return { success: true, data };
  }
}
