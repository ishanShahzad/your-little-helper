import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

// Import modals (Nearby + Chat commented out)
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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFBF0' } }} />
      {/* Global modals */}
      <SubscriptionModal />
      <TermsModal />
      <PrivacyModal />
      <BadgeGalleryModal />
      <ReferralModal />
      {/* Nearby Families — commented out for now */}
      {/* <NearbyModal /> */}
      {/* <ChatModal /> */}
      <FeedbackModal />
    </>
  );
}
