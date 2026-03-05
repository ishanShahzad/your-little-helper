import { Controller, Post, Get, Body, Req, UseGuards, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { Request } from 'express';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('create-checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@Req() req: any, @Body('priceId') priceId: string) {
    const data = await this.subscriptionsService.createCheckout(req.user.userId, priceId);
    return { success: true, data };
  }

  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    await this.subscriptionsService.handleWebhook(req.rawBody!, sig);
    return { success: true };
  }

  // DEV ONLY: bypass Stripe and activate plan directly
  @Post('dev-activate')
  @UseGuards(JwtAuthGuard)
  async devActivate(@Req() req: any, @Body('plan') plan: 'monthly' | 'annual') {
    const data = await this.subscriptionsService.devActivate(req.user.userId, plan);
    return { success: true, data };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: any) {
    const data = await this.subscriptionsService.getStatus(req.user.userId);
    return { success: true, data };
  }
}
