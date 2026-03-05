import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class ReferralsService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getMyCode(userId: string) {
    const user = await this.userModel.findById(userId).select('referralCode referralCount').lean();
    if (!user) throw new NotFoundException('User not found');
    return { referralCode: user.referralCode, referralCount: user.referralCount };
  }

  async getShareText(userId: string) {
    const user = await this.userModel.findById(userId).select('referralCode name').lean();
    if (!user) throw new NotFoundException('User not found');
    return {
      text: `🐝 Hey! ${user.name} invited you to Bumbee — the family adventure app! Use code ${user.referralCode} when you sign up. Download now!`,
    };
  }
}
