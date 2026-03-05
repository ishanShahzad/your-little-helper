import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronService } from './cron.service';
import { User, UserSchema } from '../schemas/user.schema';
import { HuntsModule } from '../hunts/hunts.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), HuntsModule],
  providers: [CronService],
})
export class CronModule {}
