import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, Alert } from 'react-native';
import { BeeModal } from '../BeeModal';
import { BeeButton } from '../BeeButton';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export function FeedbackModal() {
  const visible = useAppStore((s) => s.feedbackModalOpen);
  const setModal = useAppStore((s) => s.setModal);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post('/feedback', { type: 'general', enjoyedText: text, rating: 5 });
      Alert.alert('Thank you! 🐝', 'Your feedback helps us improve.');
      setText('');
      setModal('feedbackModalOpen', false);
    } catch {
      Alert.alert('Error', 'Could not submit feedback');
    } finally {
      setLoading(false);
    }
  }

  return (
    <BeeModal visible={visible} onClose={() => setModal('feedbackModalOpen', false)} title="Give Feedback 📝">
      <Text style={styles.label}>How can we make Bumbee better?</Text>
      <TextInput
        style={styles.textarea}
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Share your thoughts, ideas, or suggestions..."
        placeholderTextColor={Colors.secondary}
      />
      <BeeButton title="Submit Feedback" onPress={handleSubmit} loading={loading} disabled={!text.trim()} />
    </BeeModal>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.text, marginBottom: 12 },
  textarea: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, minHeight: 120, fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, textAlignVertical: 'top', marginBottom: 20 },
});
