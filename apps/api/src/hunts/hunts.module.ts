import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HuntsController } from './hunts.controller';
import { HuntsService } from './hunts.service';
import { Hunt, HuntSchema } from '../schemas/hunt.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hunt.name, schema: HuntSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [HuntsController],
  providers: [HuntsService],
})
export class HuntsModule {}
