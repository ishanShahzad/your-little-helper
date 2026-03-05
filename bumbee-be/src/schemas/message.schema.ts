import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema()
export class Message {
  @Prop({ required: true, index: true }) roomId: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) senderId: Types.ObjectId;
  @Prop() senderName: string;
  @Prop() content: string;
  @Prop({ default: () => new Date(), index: true }) createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
