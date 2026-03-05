import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class ReferralsService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getMyCode(userId: string) {
    const user = await this.userModel.findById(userId).select('referralCode referralCount').lean();
    return { referralCode: user?.referralCode, referralCount: user?.referralCount || 0 };
  }

  async getShareText(userId: string) {
    const user = await this.userModel.findById(userId).select('referralCode').lean();
    return {
      text: `Join me on Bumbee! Use code ${user?.referralCode} — your first month is free. 🐝`,
      code: user?.referralCode,
    };
  }
}
