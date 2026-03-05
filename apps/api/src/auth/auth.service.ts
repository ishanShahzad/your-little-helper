import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const age = this.calculateAge(new Date(dto.dob));
    if (age < 12) {
      throw new BadRequestException('You must be at least 12 years old to register');
    }

    const existing = await this.userModel.findOne({ email: dto.email }).lean();
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const referralCode = await this.generateUniqueReferralCode();

    let referredBy: string | undefined;
    if (dto.referralCode) {
      const referrer = await this.userModel.findOne({ referralCode: dto.referralCode });
      if (referrer) {
        referredBy = dto.referralCode;
        referrer.referralCount += 1;
        await referrer.save();
      }
    }

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      dob: dto.dob,
      authMethod: 'email',
      referralCode,
      referredBy,
    });

    const tokens = this.generateTokens(user._id.toString());
    return {
      ...tokens,
      user: { id: user._id, name: user.name, email: user.email, referralCode },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = this.generateTokens(user._id.toString());
    return {
      ...tokens,
      user: { id: user._id, name: user.name, email: user.email, referralCode: user.referralCode },
    };
  }

  async facebookLogin(facebookToken: string) {
    const { data } = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${facebookToken}`,
    );

    let user = await this.userModel.findOne({ facebookId: data.id });
    if (!user) {
      const referralCode = await this.generateUniqueReferralCode();
      user = await this.userModel.create({
        name: data.name,
        email: data.email || `fb_${data.id}@bumbee.app`,
        facebookId: data.id,
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

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      const accessToken = this.jwtService.sign({ sub: payload.sub });
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(userId: string) {
    const accessToken = this.jwtService.sign({ sub: userId });
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
      },
    );
    return { accessToken, refreshToken };
  }

  private async generateUniqueReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists = true;
    while (exists) {
      code = 'BEE-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      exists = !!(await this.userModel.findOne({ referralCode: code }).lean());
    }
    return code!;
  }

  private calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }
}
