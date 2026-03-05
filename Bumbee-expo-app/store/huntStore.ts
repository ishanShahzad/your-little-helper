import { create } from 'zustand';

interface HuntStop {
  name: string;
  lat: number;
  lng: number;
  type: string;
  clue: string;
  challenge: string;
  completed: boolean;
  completedAt?: string;
  photoUrl?: string;
}

interface Hunt {
  _id: string;
  theme: string;
  mood: string;
  ages: number[];
  stops: HuntStop[];
  route: { distance: number; duration: number; polyline: string };
  weather: { temp: number; condition: string; icon: string };
  status: string;
}

interface HuntState {
  currentHunt: Hunt | null;
  ages: number[];
  mood: string | null;
  selectedTheme: string | null;
  huntPrefs: { treasureType: string; eatDuring: boolean; eatAfterStop: number };
  currentStopIndex: number;
  setAges: (ages: number[]) => void;
  setMood: (mood: string | null) => void;
  setTheme: (theme: string) => void;
  setHunt: (hunt: Hunt) => void;
  completeStop: () => void;
  resetHunt: () => void;
  setHuntPrefs: (prefs: Partial<HuntState['huntPrefs']>) => void;
}

export const useHuntStore = create<HuntState>((set) => ({
  currentHunt: null,
  ages: [],
  mood: null,
  selectedTheme: null,
  huntPrefs: { treasureType: 'sticker pack', eatDuring: false, eatAfterStop: 2 },
  currentStopIndex: 0,

  setAges: (ages) => set({ ages }),
  setMood: (mood) => set({ mood }),
  setTheme: (theme) => set({ selectedTheme: theme }),
  setHunt: (hunt) => set({ currentHunt: hunt, currentStopIndex: 0 }),
  completeStop: () => set((s) => ({ currentStopIndex: s.currentStopIndex + 1 })),
  resetHunt: () => set({ currentHunt: null, currentStopIndex: 0, selectedTheme: null }),
  setHuntPrefs: (prefs) => set((s) => ({ huntPrefs: { ...s.huntPrefs, ...prefs } })),
}));
