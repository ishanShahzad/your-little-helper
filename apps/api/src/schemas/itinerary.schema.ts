import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ItineraryDocument = Itinerary & Document;

@Schema({ timestamps: true })
export class Itinerary {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  mood: string;

  @Prop([Number])
  ages: number[];

  @Prop({ type: { lat: Number, lng: Number } })
  location: { lat: number; lng: number };

  @Prop({
    type: [
      {
        time: String,
        title: String,
        description: String,
        duration: Number,
        type: String,
        address: String,
        isHome: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  activities: {
    time: string;
    title: string;
    description: string;
    duration: number;
    type: string;
    address: string;
    isHome: boolean;
  }[];

  @Prop({ enum: ['active', 'completed'], default: 'active' })
  status: string;

  @Prop()
  rating: number;

  @Prop()
  feedbackText: string;
}

export const ItinerarySchema = SchemaFactory.createForClass(Itinerary);
