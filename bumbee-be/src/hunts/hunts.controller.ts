import { Controller, Post, Patch, Get, Param, Body, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HuntsService } from './hunts.service';
import { GenerateHuntDto } from './dto/generate-hunt.dto';

@Controller('hunts')
@UseGuards(JwtAuthGuard)
export class HuntsController {
  constructor(private readonly huntsService: HuntsService) { }

  @Post('generate')
  async generate(@Req() req: any, @Body() dto: GenerateHuntDto) {
    const data = await this.huntsService.generate(req.user.userId, dto);
    return { success: true, data };
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    const data = await this.huntsService.getHistory(req.user.userId);
    return { success: true, data };
  }

  @Post('route')
  async getRoute(@Body() body: { fromLat: number; fromLng: number; toLat: number; toLng: number }) {
    const data = await this.huntsService.getWalkingRoute(body.fromLat, body.fromLng, body.toLat, body.toLng);
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

  @Patch(':id/stop/:stopIndex/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadStopPhoto(
    @Param('id') id: string,
    @Param('stopIndex') idx: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.huntsService.uploadStopPhoto(id, parseInt(idx), file);
    return { success: true, data };
  }

  @Patch(':id/track')
  async saveTrack(@Param('id') id: string, @Body() body: { walkedPath: { lat: number; lng: number }[] }) {
    const data = await this.huntsService.saveTrack(id, body.walkedPath);
    return { success: true, data };
  }

  @Patch(':id/complete')
  async completeHunt(@Req() req: any, @Param('id') id: string) {
    const data = await this.huntsService.completeHunt(req.user.userId, id);
    return { success: true, data };
  }

  @Patch(':id/rating')
  async rateHunt(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.huntsService.rateHunt(id, body);
    if (body.rating === 5) {
      await this.huntsService.saveThemeToFavorites(req.user.userId, id);
    }
    return { success: true, data };
  }

  @Post(':id/recap')
  async generateRecap(@Param('id') id: string) {
    const data = await this.huntsService.generateRecap(id);
    return { success: true, data };
  }
}
