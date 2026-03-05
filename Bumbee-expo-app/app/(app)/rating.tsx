import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function RatingScreen() {
  const router = useRouter();
  const { currentHunt, resetHunt } = useHuntStore();
  const [rating, setRating] = useState(0);
  const [enjoyed, setEnjoyed] = useState('');
  const [change, setChange] = useState('');
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!rating) return Alert.alert('Please tap a star to rate');
    setLoading(true);
    try {
      if (currentHunt) {
        await api.patch(`/hunts/${currentHunt._id}/rating`, { rating, feedbackText: enjoyed, wouldRecommend: recommend });
        await api.post('/feedback', {
          referenceId: currentHunt._id,
          type: 'hunt',
          rating,
          enjoyedText: enjoyed,
          changeText: change,
          wouldRecommend: recommend,
        });
      }
      Alert.alert('Thank you! 🐝', 'Your feedback helps us create better adventures!');
      resetHunt();
      router.replace('/(app)/mode-select');
    } catch {
      Alert.alert('Error', 'Could not save feedback');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="Rate Your Adventure" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>How was it?</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)}>
              <Text style={[styles.star, s <= rating && styles.starActive]}>⭐</Text>
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <>
            <Text style={styles.label}>What did your family enjoy most?</Text>
            <TextInput style={styles.textarea} multiline value={enjoyed} onChangeText={setEnjoyed} placeholder="Tell us..." placeholderTextColor={Colors.secondary} />

            <Text style={styles.label}>Anything we should change?</Text>
            <TextInput style={styles.textarea} multiline value={change} onChangeText={setChange} placeholder="Suggestions..." placeholderTextColor={Colors.secondary} />

            <Text style={styles.label}>Would you recommend Bumbee?</Text>
            <View style={styles.yesNo}>
              <TouchableOpacity onPress={() => setRecommend(true)} style={[styles.ynBtn, recommend === true && styles.ynActive]}>
                <Text style={[styles.ynText, recommend === true && styles.ynTextActive]}>👍 Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRecommend(false)} style={[styles.ynBtn, recommend === false && styles.ynActive]}>
                <Text style={[styles.ynText, recommend === false && styles.ynTextActive]}>👎 No</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <BeeButton title="Submit Feedback" onPress={handleSubmit} loading={loading} disabled={!rating} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.text, textAlign: 'center', marginBottom: 16 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  star: { fontSize: 40, opacity: 0.3 },
  starActive: { opacity: 1 },
  label: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text, marginBottom: 8, marginTop: 16 },
  textarea: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, minHeight: 80, fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, textAlignVertical: 'top' },
  yesNo: { flexDirection: 'row', gap: 12 },
  ynBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  ynActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  ynText: { fontFamily: 'Nunito_600SemiBold', color: Colors.text },
  ynTextActive: { color: Colors.white },
  btn: { marginTop: 24 },
});
