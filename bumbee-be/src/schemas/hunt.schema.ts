import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HuntDocument = Hunt & Document;

@Schema()
export class HuntStop {
  @Prop() name: string;
  @Prop() lat: number;
  @Prop() lng: number;
  @Prop() type: string;
  @Prop() clue: string;
  @Prop() challenge: string;
  @Prop({ default: false }) completed: boolean;
  @Prop() completedAt: Date;
  @Prop() photoUrl: string;
}

@Schema({ timestamps: true })
export class Hunt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop() theme: string;
  @Prop() mood: string;
  @Prop({ type: [Number] }) ages: number[];
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
}

export const HuntSchema = SchemaFactory.createForClass(Hunt);
