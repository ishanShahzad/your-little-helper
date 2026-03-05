import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash').lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, updates: any) {
    return this.userModel
      .findByIdAndUpdate(userId, { $set: updates }, { new: true })
      .select('-passwordHash')
      .lean();
  }

  async getStreaks(userId: string) {
    const user = await this.userModel.findById(userId).select('streaks').lean();
    return user?.streaks;
  }

  async getHistory(userId: string) {
    const user = await this.userModel.findById(userId).select('history').lean();
    return user?.history || [];
  }

  async savePreferences(userId: string, prefs: Record<string, any>) {
    const updates: Record<string, any> = {};
    for (const [k, v] of Object.entries(prefs)) updates[`preferences.${k}`] = v;
    return this.userModel.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select('preferences').lean();
  }
}
