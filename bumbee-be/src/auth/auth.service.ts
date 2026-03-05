import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';
import { User, UserDocument } from '../schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'BEE-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  private async generateUniqueReferralCode(): Promise<string> {
    let code: string;
    let exists = true;
    while (exists) {
      code = this.generateReferralCode();
      exists = !!(await this.userModel.findOne({ referralCode: code }).lean());
    }
    return code!;
  }

  private generateTokens(userId: string) {
    const payload = { sub: userId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    // Age gate
    const dob = new Date(dto.dob);
    const ageDiff = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 12) throw new BadRequestException('You must be at least 12 years old');

    const existing = await this.userModel.findOne({ email: dto.email }).lean();
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const referralCode = await this.generateUniqueReferralCode();

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      dob,
      referralCode,
      referredBy: dto.referralCode || undefined,
    });

    if (dto.referralCode) {
      await this.userModel.updateOne(
        { referralCode: dto.referralCode },
        { $inc: { referralCount: 1 } },
      );
    }

    const tokens = this.generateTokens(user._id.toString());
    return {
      ...tokens,
      user: { id: user._id, name: user.name, email: user.email, referralCode: user.referralCode },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const tokens = this.generateTokens(user._id.toString());
    return {
      ...tokens,
      user: { id: user._id, name: user.name, email: user.email, referralCode: user.referralCode },
    };
  }

  async facebookLogin(facebookToken: string) {
    const { data: fbUser } = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${facebookToken}`,
    );
    let user = await this.userModel.findOne({ facebookId: fbUser.id });
    if (!user) {
      const referralCode = await this.generateUniqueReferralCode();
      user = await this.userModel.create({
        name: fbUser.name,
        email: fbUser.email || `fb_${fbUser.id}@bumbee.app`,
        facebookId: fbUser.id,
        authMethod: 'facebook',
        referralCode,
      });
    }
    const tokens = this.generateTokens(user._id.toString());
    return {
      ...tokens,
      user: { id: user._id, name: user.name, email: user.email, referralCode: user.referralCode },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const accessToken = this.jwtService.sign({ sub: payload.sub });
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
