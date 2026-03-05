import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HuntsModule } from './hunts/hunts.module';
import { ItinerariesModule } from './itineraries/itineraries.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NearbyModule } from './nearby/nearby.module';
import { ReferralsModule } from './referrals/referrals.module';
import { FeedbackModule } from './feedback/feedback.module';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    HuntsModule,
    ItinerariesModule,
    SubscriptionsModule,
    NearbyModule,
    ReferralsModule,
    FeedbackModule,
    CronModule,
  ],
})
export class AppModule {}
