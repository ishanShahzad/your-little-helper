import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

import { SubscriptionModal } from '../../components/modals/SubscriptionModal';
import { TermsModal } from '../../components/modals/TermsModal';
import { PrivacyModal } from '../../components/modals/PrivacyModal';
import { BadgeGalleryModal } from '../../components/modals/BadgeGalleryModal';
import { ReferralModal } from '../../components/modals/ReferralModal';
// import { NearbyModal } from '../../components/modals/NearbyModal';
// import { ChatModal } from '../../components/modals/ChatModal';
import { FeedbackModal } from '../../components/modals/FeedbackModal';

export default function AppLayout() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/(auth)/login');
    }
  }, [isLoggedIn]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }} />
      <SubscriptionModal />
      <TermsModal />
      <PrivacyModal />
      <BadgeGalleryModal />
      <ReferralModal />
      {/* <NearbyModal /> */}
      {/* <ChatModal /> */}
      <FeedbackModal />
    </>
  );
}
