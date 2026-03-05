import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { Message, MessageDocument } from '../schemas/message.schema';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class NearbyGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>) {}

  handleConnection(client: Socket) {
    // Connection established
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    client.join(data.roomId);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string; content: string; senderName: string }) {
    const msg = await this.messageModel.create({
      roomId: data.roomId,
      senderId: client.data?.userId,
      senderName: data.senderName,
      content: data.content,
    });
    this.server.to(data.roomId).emit('newMessage', msg.toObject());
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    client.leave(data.roomId);
  }
}
