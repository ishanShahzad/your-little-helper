import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class CronService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Cron('0 0 * * 1') // Every Monday midnight
  async updateWeeklyStreaks() {
    const now = new Date();
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - now.getDay());
    lastSunday.setHours(0, 0, 0, 0);

    const lastSaturday = new Date(lastSunday);
    lastSaturday.setDate(lastSunday.getDate() - 1);

    // Find users who did NOT have activity this past weekend — reset streak
    const activeUsers = await this.userModel.find({
      'streaks.lastWeekendDate': { $lt: lastSaturday },
      'streaks.currentStreak': { $gt: 0 },
      isActive: true,
    });

    for (const user of activeUsers) {
      user.streaks.currentStreak = 0;
      await user.save();
    }

    console.log(`🐝 Cron: Reset streaks for ${activeUsers.length} inactive users`);
  }
}
