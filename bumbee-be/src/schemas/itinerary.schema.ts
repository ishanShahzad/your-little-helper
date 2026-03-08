import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ItineraryDocument = Itinerary & Document;

@Schema()
export class Activity {
  @Prop() step: number;
  @Prop() time: string;
  @Prop() title: string;
  @Prop() description: string;
  @Prop() duration: number; // minutes
  @Prop() type: string; // 'park', 'cafe', 'museum', etc.
  @Prop({ default: 0 }) estimatedCost: number;
  @Prop({ default: 0 }) priceLevel: number; // 0-4
  @Prop() lat: number;
  @Prop() lng: number;
  @Prop() address: string;
  @Prop() googleMapsLink: string;
  @Prop() placeId: string; // Google Places ID
  @Prop({ default: false }) isHome: boolean;
  @Prop({ default: false }) completed: boolean;
}

@Schema({ timestamps: true })
export class Itinerary {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) 
  userId: Types.ObjectId;
  
  @Prop() mood: string;
  @Prop({ type: [Number] }) ages: number[];
  @Prop({ type: { lat: Number, lng: Number } }) 
  location: { lat: number; lng: number };
  
  @Prop() durationMinutes: number;
  @Prop() budget: number;
  @Prop() transportMode: string; // 'walking' | 'car'
  @Prop() preference: string; // 'indoor' | 'outdoor' | 'mixed'
  
  @Prop({ type: [Object] }) activities: Activity[];
  @Prop({ default: 0 }) totalEstimatedCost: number;
  @Prop() totalDuration: number;
  
  @Prop({ enum: ['active', 'completed'], default: 'active' }) 
  status: string;
  
  @Prop() rating: number;
  @Prop() feedbackText: string;
}

export const ItinerarySchema = SchemaFactory.createForClass(Itinerary);
