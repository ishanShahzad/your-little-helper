import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HuntDocument = Hunt & Document;

@Schema({ timestamps: true })
export class Hunt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  theme: string;

  @Prop()
  mood: string;

  @Prop([Number])
  ages: number[];

  @Prop({
    type: [
      {
        name: String,
        lat: Number,
        lng: Number,
        type: String,
        clue: String,
        challenge: String,
        completed: { type: Boolean, default: false },
        completedAt: Date,
        photoUrl: String,
      },
    ],
    default: [],
  })
  stops: {
    name: string;
    lat: number;
    lng: number;
    type: string;
    clue: string;
    challenge: string;
    completed: boolean;
    completedAt: Date;
    photoUrl: string;
  }[];

  @Prop({ type: { distance: Number, duration: Number, polyline: String } })
  route: { distance: number; duration: number; polyline: string };

  @Prop({ type: { temp: Number, condition: String, icon: String } })
  weather: { temp: number; condition: string; icon: string };

  @Prop({ enum: ['active', 'completed', 'abandoned'], default: 'active' })
  status: string;

  @Prop()
  rating: number;

  @Prop()
  feedbackText: string;

  @Prop()
  wouldRecommend: boolean;

  @Prop()
  recapCardUrl: string;
}

export const HuntSchema = SchemaFactory.createForClass(Hunt);
HuntSchema.index({ userId: 1 });
