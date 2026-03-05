import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HuntDocument = Hunt & Document;

export enum TaskType {
  PHOTO_TASK = 'PHOTO_TASK',
  COUNT_TASK = 'COUNT_TASK',
  FIND_OBJECT = 'FIND_OBJECT',
  ANSWER_RIDDLE = 'ANSWER_RIDDLE',
  SELFIE_TASK = 'SELFIE_TASK',
  CHECKIN_TASK = 'CHECKIN_TASK',
}

@Schema()
export class HuntStop {
  @Prop() name: string;
  @Prop() lat: number;
  @Prop() lng: number;
  @Prop() type: string;
  @Prop() clue: string;
  @Prop() challenge: string;
  @Prop({ enum: TaskType, default: TaskType.CHECKIN_TASK }) taskType: TaskType;
  @Prop() taskPrompt: string;        // e.g. "Count how many fountains spray water"
  @Prop() taskAnswer: string;        // expected answer for COUNT/RIDDLE tasks
  @Prop() missionTitle: string;      // short action title: "Find the tallest slide"
  @Prop({ default: false }) completed: boolean;
  @Prop() completedAt: Date;
  @Prop() photoUrl: string;
  @Prop({ default: false }) unlocked: boolean;
}

@Schema({ timestamps: true })
export class Hunt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop() theme: string;
  @Prop() mood: string;
  @Prop({ type: [Number] }) ages: number[];
  @Prop({ default: 60 }) durationMinutes: number;
  @Prop() storyIntro: string;          // themed narrative intro
  @Prop() storyCharacter: string;      // "Captain Goldbeard"
  @Prop() storyCharacterEmoji: string; // "🏴‍☠️"
  @Prop({ type: [Object] }) stops: HuntStop[];
  @Prop({ type: { distance: Number, duration: Number, polyline: String } })
  route: { distance: number; duration: number; polyline: string };
  @Prop({ type: { temp: Number, condition: String, icon: String } })
  weather: { temp: number; condition: string; icon: string };
  @Prop({ enum: ['active', 'completed', 'abandoned'], default: 'active' }) status: string;
  @Prop() rating: number;
  @Prop() feedbackText: string;
  @Prop() wouldRecommend: boolean;
  @Prop() recapCardUrl: string;
  @Prop({ type: [{ lat: Number, lng: Number }], default: [] })
  walkedPath: { lat: number; lng: number }[];
  @Prop({ type: Object }) preferences: Record<string, any>;
}

export const HuntSchema = SchemaFactory.createForClass(Hunt);
