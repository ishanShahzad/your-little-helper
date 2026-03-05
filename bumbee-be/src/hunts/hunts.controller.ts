import { Controller, Post, Patch, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HuntsService } from './hunts.service';
import { GenerateHuntDto } from './dto/generate-hunt.dto';

@Controller('hunts')
@UseGuards(JwtAuthGuard)
export class HuntsController {
  constructor(private readonly huntsService: HuntsService) {}

  @Post('generate')
  async generate(@Req() req: any, @Body() dto: GenerateHuntDto) {
    const data = await this.huntsService.generate(req.user.userId, dto);
    return { success: true, data };
  }

  @Get(':id')
  async getHunt(@Param('id') id: string) {
    const data = await this.huntsService.getHunt(id);
    return { success: true, data };
  }

  @Patch(':id/stop/:stopIndex/complete')
  async completeStop(@Param('id') id: string, @Param('stopIndex') idx: string) {
    const data = await this.huntsService.completeStop(id, parseInt(idx));
    return { success: true, data };
  }

  @Patch(':id/complete')
  async completeHunt(@Req() req: any, @Param('id') id: string) {
    const data = await this.huntsService.completeHunt(req.user.userId, id);
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
