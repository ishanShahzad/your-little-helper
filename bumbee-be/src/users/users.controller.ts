import { Controller, Get, Patch, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: any) {
    const data = await this.usersService.getProfile(req.user.userId);
    return { success: true, data };
  }

  @Patch('me')
  async updateProfile(@Req() req: any, @Body() body: any) {
    const data = await this.usersService.updateProfile(req.user.userId, body);
    return { success: true, data };
  }

  @Get('me/streaks')
  async getStreaks(@Req() req: any) {
    const data = await this.usersService.getStreaks(req.user.userId);
    return { success: true, data };
  }

  @Get('me/history')
  async getHistory(@Req() req: any) {
    const data = await this.usersService.getHistory(req.user.userId);
    return { success: true, data };
  }

  @Post('me/preferences')
  async savePreferences(@Req() req: any, @Body() body: Record<string, any>) {
    const data = await this.usersService.savePreferences(req.user.userId, body);
    return { success: true, data };
  }
}
