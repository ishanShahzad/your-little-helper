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

@WebSocketGateway({ cors: true, namespace: '/chat' })
export class NearbyGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  handleConnection(client: Socket) {
    // Auth handled by guard on message events
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    return { event: 'joinedRoom', data: { roomId: data.roomId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { roomId: string; content: string; senderName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).data?.userId;
    const message = await this.messageModel.create({
      roomId: data.roomId,
      senderId: userId,
      senderName: data.senderName,
      content: data.content,
    });

    this.server.to(data.roomId).emit('newMessage', message);
    return message;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.roomId);
    return { event: 'leftRoom', data: { roomId: data.roomId } };
  }
}
