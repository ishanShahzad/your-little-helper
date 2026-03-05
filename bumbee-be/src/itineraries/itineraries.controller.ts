import { Controller, Post, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ItinerariesService } from './itineraries.service';

@Controller('itineraries')
@UseGuards(JwtAuthGuard)
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  @Post('generate')
  async generate(@Req() req: any, @Body() body: any) {
    const data = await this.itinerariesService.generate(req.user.userId, body);
    return { success: true, data };
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string) {
    const data = await this.itinerariesService.complete(id);
    return { success: true, data };
  }

  @Patch(':id/rating')
  async rate(@Param('id') id: string, @Body() body: any) {
    const data = await this.itinerariesService.rate(id, body);
    return { success: true, data };
  }
}
