import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class Kid {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) dob: Date;
}

@Schema({ timestamps: true })
export class HuntHistoryEntry {
  @Prop({ type: Types.ObjectId }) huntId: Types.ObjectId;
  @Prop() theme: string;
  @Prop() mood: string;
  @Prop() completedAt: Date;
  @Prop() rating: number;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) email: string;
  @Prop() passwordHash: string;
  @Prop() dob: Date;
  @Prop({ enum: ['email', 'facebook'], default: 'email' }) authMethod: string;
  @Prop() facebookId: string;
  @Prop({ unique: true }) referralCode: string;
  @Prop() referredBy: string;
  @Prop({ default: 0 }) referralCount: number;

  @Prop({
    type: {
      plan: { type: String, enum: ['free', 'monthly', 'annual'], default: 'free' },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      expiresAt: Date,
    },
    default: { plan: 'free' },
  })
  subscription: {
    plan: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    expiresAt?: Date;
  };

  @Prop({
    type: {
      weekendsPlanned: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      lastWeekendDate: Date,
      badges: [String],
    },
    default: { weekendsPlanned: 0, currentStreak: 0, badges: [] },
  })
  streaks: {
    weekendsPlanned: number;
    currentStreak: number;
    lastWeekendDate?: Date;
    badges: string[];
  };

  @Prop({
    type: {
      kids: [{ name: String, dob: Date }],
      dislikes: [String],
      favorites: [String],
    },
    default: { kids: [], dislikes: [], favorites: [] },
  })
  familyProfile: {
    kids: Kid[];
    dislikes: string[];
    favorites: string[];
  };

  @Prop({ type: [Object], default: [] })
  history: HuntHistoryEntry[];

  @Prop({ type: Map, of: String, default: {} })
  preferences: Map<string, any>;

  @Prop({ default: true }) isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ referralCode: 1 }, { unique: true });
