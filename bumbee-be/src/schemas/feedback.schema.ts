import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'User' }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId }) referenceId: Types.ObjectId;
  @Prop({ enum: ['hunt', 'itinerary'] }) type: string;
  @Prop() rating: number;
  @Prop() enjoyedText: string;
  @Prop() changeText: string;
  @Prop() wouldRecommend: boolean;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
