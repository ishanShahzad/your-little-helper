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

  async updateProfile(userId: string, update: Partial<{ name: string; familyProfile: any }>) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('-passwordHash')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getStreaks(userId: string) {
    const user = await this.userModel.findById(userId).select('streaks').lean();
    if (!user) throw new NotFoundException('User not found');
    return user.streaks;
  }

  async getHistory(userId: string) {
    const user = await this.userModel.findById(userId).select('history').lean();
    if (!user) throw new NotFoundException('User not found');
    return user.history;
  }

  async savePreference(userId: string, key: string, value: any) {
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { [`preferences.${key}`]: value },
    });
    return { key, value };
  }
}
