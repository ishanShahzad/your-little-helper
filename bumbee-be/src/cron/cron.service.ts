import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { HuntsService } from '../hunts/hunts.service';

@Injectable()
export class CronService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private huntsService: HuntsService,
  ) {}

  @Cron('0 0 * * 1') // Every Monday midnight
  async updateWeeklyStreaks() {
    const users = await this.userModel.find({ isActive: true, 'streaks.lastWeekendDate': { $exists: true } }).lean();
    for (const user of users) {
      await this.huntsService.updateStreak(user._id.toString());
    }
  }
}
