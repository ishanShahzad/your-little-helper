import { Controller, Post, Patch, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HuntsService } from './hunts.service';

@Controller('hunts')
@UseGuards(JwtAuthGuard)
export class HuntsController {
  constructor(private readonly huntsService: HuntsService) {}

  @Post('generate')
  async generate(@Req() req: any, @Body() body: any) {
    const data = await this.huntsService.generate(req.user.userId, body);
    return { success: true, data };
  }

  @Get(':id')
  async getHunt(@Param('id') id: string) {
    const data = await this.huntsService.getHunt(id);
    return { success: true, data };
  }

  @Patch(':id/stop/:stopIndex/complete')
  async completeStop(@Param('id') id: string, @Param('stopIndex') stopIndex: string) {
    const data = await this.huntsService.completeStop(id, parseInt(stopIndex));
    return { success: true, data };
  }

  @Patch(':id/complete')
  async completeHunt(@Param('id') id: string, @Req() req: any) {
    const data = await this.huntsService.completeHunt(id, req.user.userId);
    return { success: true, data };
  }

  @Patch(':id/rating')
  async rateHunt(@Param('id') id: string, @Body() body: any) {
    const data = await this.huntsService.rateHunt(id, body);
    return { success: true, data };
  }

  @Post(':id/recap')
  async generateRecap(@Param('id') id: string) {
    const data = await this.huntsService.generateRecap(id);
    return { success: true, data };
  }
}
