import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let chatSocket: Socket | null = null;

export async function connectChatSocket(roomId: string): Promise<Socket> {
  const token = await SecureStore.getItemAsync('accessToken');

  chatSocket = io(`${API_URL}/chat`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return new Promise((resolve, reject) => {
    if (!chatSocket) return reject(new Error('Socket init failed'));

    chatSocket.on('connect', () => {
      chatSocket!.emit('joinRoom', { roomId });
      resolve(chatSocket!);
    });

    chatSocket.on('connect_error', (err) => {
      console.log('Socket connect error:', err.message);
      reject(err);
    });
  });
}

export function disconnectChatSocket(roomId?: string) {
  if (chatSocket) {
    if (roomId) chatSocket.emit('leaveRoom', { roomId });
    chatSocket.disconnect();
    chatSocket = null;
  }
}

export function getChatSocket(): Socket | null {
  return chatSocket;
}
