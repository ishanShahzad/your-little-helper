import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-02-24.acacia' as any });
  }

  async createCheckout(userId: string, priceId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({ email: user.email, metadata: { userId } });
      customerId = customer.id;
      await this.userModel.findByIdAndUpdate(userId, { 'subscription.stripeCustomerId': customerId });
    }

    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const pi = invoice.payment_intent as Stripe.PaymentIntent;

    return { clientSecret: pi.client_secret, subscriptionId: subscription.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.configService.get('STRIPE_WEBHOOK_SECRET')!,
    );

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const priceId = invoice.lines?.data?.[0]?.price?.id;

      const monthlyPriceId = this.configService.get('STRIPE_MONTHLY_PRICE_ID');
      const plan = priceId === monthlyPriceId ? 'monthly' : 'annual';
      const expiresAt = new Date(Date.now() + (plan === 'monthly' ? 30 : 365) * 86400000);

      await this.userModel.findOneAndUpdate(
        { 'subscription.stripeCustomerId': customerId },
        { $set: { 'subscription.plan': plan, 'subscription.expiresAt': expiresAt, 'subscription.stripeSubscriptionId': invoice.subscription } },
      );
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      await this.userModel.findOneAndUpdate(
        { 'subscription.stripeSubscriptionId': sub.id },
        { $set: { 'subscription.plan': 'free', 'subscription.expiresAt': null } },
      );
    }
  }

  async getStatus(userId: string) {
    const user = await this.userModel.findById(userId).select('subscription').lean();
    return user?.subscription || { plan: 'free' };
  }
}
