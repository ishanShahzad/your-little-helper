import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Colors } from '../constants/colors';

export function NetworkStatusBanner() {
  const { status, isSlow } = useNetworkStatus();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (status === 'offline' || status === 'slow') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [status, fadeAnim]);

  if (status === 'online' && !isSlow) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        status === 'offline' ? styles.offline : styles.slow,
        { opacity: fadeAnim },
      ]}
    >
      <Text style={styles.icon}>{status === 'offline' ? '📡' : '🐌'}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {status === 'offline' ? 'No Internet Connection' : 'Slow Connection'}
        </Text>
        <Text style={styles.subtitle}>
          {status === 'offline'
            ? 'Please check your network settings'
            : 'Some features may be slower than usual'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  offline: {
    backgroundColor: '#FF6B6B',
  },
  slow: {
    backgroundColor: '#FFA500',
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 14,
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
});
