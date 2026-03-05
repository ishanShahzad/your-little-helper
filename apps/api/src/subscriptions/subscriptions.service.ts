import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async createCheckout(userId: string, priceId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({ email: user.email, name: user.name });
      customerId = customer.id;
      user.subscription = { ...user.subscription, stripeCustomerId: customerId } as any;
      await user.save();
    }

    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return { clientSecret: paymentIntent.client_secret, subscriptionId: subscription.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret!);
    } catch (err) {
      throw new BadRequestException('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const user = await this.userModel.findOne({ 'subscription.stripeCustomerId': customerId });
        if (user) {
          const monthlyPriceId = this.config.get('STRIPE_MONTHLY_PRICE_ID');
          const lineItem = invoice.lines.data[0];
          const plan = lineItem?.price?.id === monthlyPriceId ? 'monthly' : 'annual';
          user.subscription.plan = plan;
          user.subscription.stripeSubscriptionId = invoice.subscription as string;
          user.subscription.expiresAt = new Date((lineItem?.period?.end || 0) * 1000);
          await user.save();
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await this.userModel.findOneAndUpdate(
          { 'subscription.stripeCustomerId': customerId },
          { 'subscription.plan': 'free', 'subscription.stripeSubscriptionId': null, 'subscription.expiresAt': null },
        );
        break;
      }
    }
  }

  async getStatus(userId: string) {
    const user = await this.userModel.findById(userId).select('subscription').lean();
    if (!user) throw new NotFoundException('User not found');
    return user.subscription;
  }
}
