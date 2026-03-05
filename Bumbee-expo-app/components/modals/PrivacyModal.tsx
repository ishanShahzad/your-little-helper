import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { BeeModal } from '../BeeModal';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';

export function PrivacyModal() {
  const visible = useAppStore((s) => s.privacyModalOpen);
  const setModal = useAppStore((s) => s.setModal);

  return (
    <BeeModal visible={visible} onClose={() => setModal('privacyModalOpen', false)} title="Privacy Policy">
      <Text style={styles.heading}>Bumbee Ltd — Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: 1 January 2025</Text>
      <Text style={styles.body}>
        {`1. INFORMATION WE COLLECT
Personal Information: Name, email address, date of birth, family profile (children's names and ages).
Usage Data: Adventure history, ratings, preferences, app interaction data.
Location Data: GPS coordinates during active adventures only (not tracked in background).
Photos: Captured during adventures, stored locally and optionally uploaded for recap cards.

2. HOW WE USE YOUR INFORMATION
To generate personalised scavenger hunts and day plans.
To track family streaks and award badges.
To process subscriptions and payments (via Stripe — we never store card details).
To enable nearby family discovery (temporary, auto-deleted after 5 minutes).
To improve our service through anonymised analytics.

3. DATA SHARING
We do not sell your personal data. We share data only with:
Stripe (payment processing), Cloudinary (recap card image storage), OpenRouteService (route calculation — anonymised coordinates only).

4. CHILDREN'S PRIVACY
Bumbee is designed for family use. Children's data (names and ages) is provided by the parent/guardian and used solely for age-appropriate content generation. We comply with COPPA and UK Age Appropriate Design Code.

5. DATA RETENTION
Account data: retained while your account is active.
Adventure history: retained for the lifetime of your account.
Chat messages: automatically deleted after 24 hours.
Location data: deleted immediately after adventure ends.
You may request full data deletion at any time by emailing hello@bumbee.app.

6. YOUR RIGHTS (GDPR/UK GDPR)
Access: Request a copy of your personal data.
Rectification: Correct inaccurate data.
Erasure: Request deletion of your data.
Portability: Receive your data in a machine-readable format.
Objection: Object to processing for marketing purposes.

7. SECURITY
We use industry-standard encryption (TLS 1.3), bcrypt password hashing, and JWT-based authentication. Sensitive data is stored in secure, encrypted databases.

8. COOKIES & TRACKING
The App does not use cookies. We do not use third-party advertising trackers.

9. CONTACT
Data Protection Officer
Bumbee Ltd
Email: privacy@bumbee.app

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
