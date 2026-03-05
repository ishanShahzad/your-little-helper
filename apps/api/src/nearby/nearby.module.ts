import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NearbyController } from './nearby.controller';
import { NearbyService } from './nearby.service';
import { NearbyGateway } from './nearby.gateway';
import { Message, MessageSchema } from '../schemas/message.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    AuthModule,
  ],
  controllers: [NearbyController],
  providers: [NearbyService, NearbyGateway],
})
export class NearbyModule {}
