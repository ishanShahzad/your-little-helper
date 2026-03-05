import { create } from 'zustand';

export type TaskType = 'PHOTO_TASK' | 'COUNT_TASK' | 'FIND_OBJECT' | 'ANSWER_RIDDLE' | 'SELFIE_TASK' | 'CHECKIN_TASK';

interface HuntStop {
  name: string;
  lat: number;
  lng: number;
  type: string;
  clue: string;
  challenge: string;
  taskType: TaskType;
  taskPrompt: string;
  taskAnswer?: string;
  missionTitle: string;
  completed: boolean;
  completedAt?: string;
  photoUrl?: string;
  unlocked: boolean;
}

interface Hunt {
  _id: string;
  theme: string;
  mood: string;
  ages: number[];
  durationMinutes: number;
  storyIntro: string;
  storyCharacter: string;
  storyCharacterEmoji: string;
  stops: HuntStop[];
  route: { distance: number; duration: number; polyline: string };
  weather: { temp: number; condition: string; icon: string };
  status: string;
  preferences?: Record<string, any>;
}

interface HuntState {
  currentHunt: Hunt | null;
  ages: number[];
  mood: string | null;
  selectedTheme: string | null;
  durationMinutes: number;
  huntPrefs: { treasureType: string; eatDuring: boolean; eatAfterStop: number };
  currentStopIndex: number;
  hasSeenOnboarding: boolean;
  setAges: (ages: number[]) => void;
  setMood: (mood: string | null) => void;
  setTheme: (theme: string) => void;
  setDuration: (minutes: number) => void;
  setHunt: (hunt: Hunt) => void;
  completeStop: () => void;
  resetHunt: () => void;
  setHuntPrefs: (prefs: Partial<HuntState['huntPrefs']>) => void;
  setOnboardingSeen: () => void;
}

export const useHuntStore = create<HuntState>((set) => ({
  currentHunt: null,
  ages: [],
  mood: null,
  selectedTheme: null,
  durationMinutes: 60,
  huntPrefs: { treasureType: 'sticker pack', eatDuring: false, eatAfterStop: 2 },
  currentStopIndex: 0,
  hasSeenOnboarding: false,

  setAges: (ages) => set({ ages }),
  setMood: (mood) => set({ mood }),
  setTheme: (theme) => set({ selectedTheme: theme }),
  setDuration: (minutes) => set({ durationMinutes: minutes }),
  setHunt: (hunt) => set({ currentHunt: hunt, currentStopIndex: 0 }),
  completeStop: () => set((s) => ({ currentStopIndex: s.currentStopIndex + 1 })),
  resetHunt: () => set({ currentHunt: null, currentStopIndex: 0, selectedTheme: null }),
  setHuntPrefs: (prefs) => set((s) => ({ huntPrefs: { ...s.huntPrefs, ...prefs } })),
  setOnboardingSeen: () => set({ hasSeenOnboarding: true }),
}));
