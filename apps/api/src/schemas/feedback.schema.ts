import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  huntId: string;

  @Prop()
  itineraryId: string;

  @Prop({ enum: ['hunt', 'itinerary'], required: true })
  type: string;

  @Prop({ required: true })
  rating: number;

  @Prop()
  enjoyedText: string;

  @Prop()
  changeText: string;

  @Prop()
  wouldRecommend: boolean;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
