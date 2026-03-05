import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ItineraryDocument = Itinerary & Document;

@Schema()
export class Activity {
  @Prop() time: string;
  @Prop() title: string;
  @Prop() description: string;
  @Prop() duration: number;
  @Prop() type: string;
  @Prop() address: string;
  @Prop({ default: false }) isHome: boolean;
}

@Schema({ timestamps: true })
export class Itinerary {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop() mood: string;
  @Prop({ type: [Number] }) ages: number[];
  @Prop({ type: { lat: Number, lng: Number } }) location: { lat: number; lng: number };
  @Prop({ type: [Object] }) activities: Activity[];
  @Prop({ enum: ['active', 'completed'], default: 'active' }) status: string;
  @Prop() rating: number;
  @Prop() feedbackText: string;
}

export const ItinerarySchema = SchemaFactory.createForClass(Itinerary);
