import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { BeeModal } from '../BeeModal';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

const cannedResponses = [
  'Sounds fun! 🎉',
  'Which area are you in? 🗺️',
  'Our kids would love that! 😄',
  'Have a great adventure! 🐝',
  'We love this spot too! ⭐',
];

interface Message {
  id: string;
  content: string;
  sender: 'me' | 'other';
  timestamp: Date;
}

export function ChatModal() {
  const visible = useAppStore((s) => s.chatModalOpen);
  const setModal = useAppStore((s) => s.setModal);
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      // In production, connect socket.io here:
      // const socket = io(`${API_URL}/chat`, { auth: { token: accessToken } });
      // socket.emit('joinRoom', { roomId });
      // socket.on('newMessage', (msg) => setMessages(prev => [...prev, msg]));
      setMessages([{
        id: '0',
        content: '👋 Connected! Say hello to a nearby family.',
        sender: 'other',
        timestamp: new Date(),
      }]);
    }
  }, [visible]);

  function sendMessage() {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'me',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');

    // Auto-reply after 2 seconds (placeholder for real socket.io)
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        content: cannedResponses[Math.floor(Math.random() * cannedResponses.length)],
        sender: 'other',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 2000);
  }

  function handleEndChat() {
    // In production: socket.emit('leaveRoom', { roomId }); socket.disconnect();
    setMessages([]);
    setModal('chatModalOpen', false);
  }

  return (
    <BeeModal visible={visible} onClose={handleEndChat} title="Family Chat 💬">
      <Text style={styles.privacy}>🔒 Chatting with a verified Bumbee family</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === 'me' ? styles.myBubble : styles.otherBubble]}>
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
            placeholder="Type a message..."
            placeholderTextColor={Colors.secondary}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
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
  chatList: { maxHeight: 300, marginBottom: 12 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, marginBottom: 6, maxWidth: '80%' },
  myBubble: { backgroundColor: Colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: Colors.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text },
  myBubbleText: { color: '#fff' },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: 22, paddingHorizontal: 16, fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text },
  sendBtn: { backgroundColor: Colors.primary, height: 44, paddingHorizontal: 20, borderRadius: 22, justifyContent: 'center' },
  sendText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 14, color: '#fff' },
  endChat: { alignItems: 'center', paddingVertical: 12, paddingBottom: 20 },
  endChatText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.error },
});
