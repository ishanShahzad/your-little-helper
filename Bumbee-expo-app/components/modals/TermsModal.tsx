import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { BeeModal } from '../BeeModal';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';

export function TermsModal() {
  const visible = useAppStore((s) => s.termsModalOpen);
  const setModal = useAppStore((s) => s.setModal);

  return (
    <BeeModal visible={visible} onClose={() => setModal('termsModalOpen', false)} title="Terms of Service">
      <Text style={styles.heading}>Bumbee Ltd — Terms of Service</Text>
      <Text style={styles.updated}>Last updated: 1 January 2025</Text>
      <Text style={styles.body}>
        {`1. ACCEPTANCE OF TERMS
By downloading, installing, or using the Bumbee mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the App.

2. ELIGIBILITY
You must be at least 12 years old to create an account. Users under 18 must have parental or guardian consent. The App is designed for family use under adult supervision.

3. ACCOUNT REGISTRATION
You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use.

4. SUBSCRIPTION & PAYMENTS
Free users receive one complimentary adventure. Paid subscriptions (Monthly £9.97 / Annual £59.97) unlock unlimited access. Subscriptions auto-renew unless cancelled 24 hours before the renewal date. Refunds are handled per the applicable app store's refund policy.

5. USER CONTENT
Photos taken during adventures are stored on your device and optionally on our servers. You retain ownership of your photos. By uploading, you grant Bumbee a non-exclusive licence to use photos for recap card generation.

6. ACCEPTABLE USE
You agree not to: use the App for any unlawful purpose; share inappropriate content; attempt to reverse-engineer the App; share your account with non-family members.

7. LOCATION DATA
The App requires location access to generate nearby adventures. Location data is processed in real-time and not permanently stored beyond the duration of an active adventure. Nearby user features use temporary location data (auto-deleted after 5 minutes).

8. LIMITATION OF LIABILITY
Bumbee Ltd is not liable for: injuries during adventures; accuracy of map data or directions; availability of third-party locations; weather-related incidents.

9. GOVERNING LAW
These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.

10. CONTACT
Bumbee Ltd
Email: hello@bumbee.app

© 2025 Bumbee Ltd. All rights reserved.`}
      </Text>
    </BeeModal>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text, marginBottom: 4 },
  updated: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginBottom: 16 },
  body: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, lineHeight: 22, paddingBottom: 40 },
});
