import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { BeeModal } from '../BeeModal';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { connectChatSocket, disconnectChatSocket, getChatSocket } from '../../services/socket';

interface Message {
  id: string;
  _id?: string;
  content: string;
  sender: 'me' | 'other';
  senderName?: string;
  timestamp: Date;
}

export function ChatModal() {
  const visible = useAppStore((s) => s.chatModalOpen);
  const chatRoomId = useAppStore((s) => (s as any).chatRoomId) || null;
  const setModal = useAppStore((s) => s.setModal);
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible || !chatRoomId) return;

    let mounted = true;
    setConnecting(true);

    connectChatSocket(chatRoomId)
      .then((socket) => {
        if (!mounted) return;
        setConnected(true);
        setConnecting(false);

        setMessages([{
          id: 'system-0',
          content: '👋 Connected! Say hello to a nearby family.',
          sender: 'other',
          timestamp: new Date(),
        }]);

        socket.on('newMessage', (msg: any) => {
          if (!mounted) return;
          const isMe = msg.senderId === user?.id;
          setMessages((prev) => [
            ...prev,
            {
              id: msg._id || Date.now().toString(),
              content: msg.content,
              sender: isMe ? 'me' : 'other',
              senderName: msg.senderName,
              timestamp: new Date(msg.createdAt || Date.now()),
            },
          ]);
        });

        socket.on('disconnect', () => {
          if (mounted) setConnected(false);
        });
      })
      .catch(() => {
        if (!mounted) return;
        setConnecting(false);
        setMessages([{
          id: 'error-0',
          content: '⚠️ Could not connect. Please try again later.',
          sender: 'other',
          timestamp: new Date(),
        }]);
      });

    return () => {
      mounted = false;
      disconnectChatSocket(chatRoomId);
      setConnected(false);
      setMessages([]);
    };
  }, [visible, chatRoomId]);

  function sendMessage() {
    if (!input.trim() || !connected) return;
    const socket = getChatSocket();
    if (!socket) return;

    socket.emit('sendMessage', {
      roomId: chatRoomId,
      content: input.trim(),
      senderName: user?.name || 'Bumbee Family',
    });

    // Optimistically add the message locally
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: input.trim(),
        sender: 'me',
        timestamp: new Date(),
      },
    ]);
    setInput('');
  }

  function handleEndChat() {
    disconnectChatSocket(chatRoomId || undefined);
    setMessages([]);
    setConnected(false);
    setModal('chatModalOpen', false);
  }

  return (
    <BeeModal visible={visible} onClose={handleEndChat} title="Family Chat 💬">
      <Text style={styles.privacy}>🔒 Chatting with a verified Bumbee family</Text>

      {connecting && (
        <View style={styles.connectingRow}>
          <ActivityIndicator color={Colors.primary} size="small" />
          <Text style={styles.connectingText}>Connecting...</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === 'me' ? styles.myBubble : styles.otherBubble]}>
            {item.sender === 'other' && item.senderName && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}
            <Text style={[styles.bubbleText, item.sender === 'me' && styles.myBubbleText]}>{item.content}</Text>
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={connected ? 'Type a message...' : 'Connecting...'}
            placeholderTextColor={Colors.secondary}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            editable={connected}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !connected && { opacity: 0.5 }]}
            onPress={sendMessage}
            disabled={!connected}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <TouchableOpacity onPress={handleEndChat} style={styles.endChat}>
        <Text style={styles.endChatText}>End Chat</Text>
      </TouchableOpacity>
    </BeeModal>
  );
}

const styles = StyleSheet.create({
  privacy: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.secondary, textAlign: 'center', marginBottom: 8, backgroundColor: '#FFF5E0', padding: 6, borderRadius: 6 },
  connectingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  connectingText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary },
  chatList: { maxHeight: 300, marginBottom: 12 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, marginBottom: 6, maxWidth: '80%' },
  myBubble: { backgroundColor: Colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: Colors.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  senderName: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: Colors.secondary, marginBottom: 2 },
  bubbleText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text },
  myBubbleText: { color: '#fff' },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: 22, paddingHorizontal: 16, fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text },
  sendBtn: { backgroundColor: Colors.primary, height: 44, paddingHorizontal: 20, borderRadius: 22, justifyContent: 'center' },
  sendText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 14, color: '#fff' },
  endChat: { alignItems: 'center', paddingVertical: 12, paddingBottom: 20 },
  endChatText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.error },
});
