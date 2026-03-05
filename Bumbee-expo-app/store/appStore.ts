import { create } from 'zustand';

interface AppState {
  subscriptionModalOpen: boolean;
  referralModalOpen: boolean;
  nearbyModalOpen: boolean;
  chatModalOpen: boolean;
  termsModalOpen: boolean;
  privacyModalOpen: boolean;
  badgeGalleryOpen: boolean;
  feedbackModalOpen: boolean;
  currency: string;
  currencySymbol: string;
  setModal: (key: string, value: boolean) => void;
  setCurrency: (currency: string, symbol: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  subscriptionModalOpen: false,
  referralModalOpen: false,
  nearbyModalOpen: false,
  chatModalOpen: false,
  termsModalOpen: false,
  privacyModalOpen: false,
  badgeGalleryOpen: false,
  feedbackModalOpen: false,
  currency: 'USD',
  currencySymbol: '$',
  setModal: (key, value) => set({ [key]: value } as any),
  setCurrency: (currency, symbol) => set({ currency, currencySymbol: symbol }),
}));
