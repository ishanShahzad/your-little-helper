import { create } from 'zustand';

interface Stop {
  name: string;
  lat: number;
  lng: number;
  type: string;
  clue: string;
  challenge: string;
  completed: boolean;
  completedAt?: Date;
  photoUrl?: string;
}

interface Hunt {
  _id: string;
  theme: string;
  mood: string;
  ages: number[];
  stops: Stop[];
  route: { distance: number; duration: number; polyline: string };
  weather: { temp: number; condition: string; icon: string };
  status: string;
}

interface HuntState {
  currentHunt: Hunt | null;
  ages: number[];
  mood: string;
  selectedTheme: string;
  huntPrefs: Record<string, any>;
  currentStopIndex: number;
  setAges: (ages: number[]) => void;
  setMood: (mood: string) => void;
  setTheme: (theme: string) => void;
  setHunt: (hunt: Hunt) => void;
  completeStop: (index: number) => void;
  resetHunt: () => void;
}

export const useHuntStore = create<HuntState>((set, get) => ({
  currentHunt: null,
  ages: [],
  mood: '',
  selectedTheme: '',
  huntPrefs: {},
  currentStopIndex: 0,

  setAges: (ages) => set({ ages }),
  setMood: (mood) => set({ mood }),
  setTheme: (theme) => set({ selectedTheme: theme }),

  setHunt: (hunt) => set({ currentHunt: hunt, currentStopIndex: 0 }),

  completeStop: (index) => {
    const hunt = get().currentHunt;
    if (!hunt) return;
    const stops = [...hunt.stops];
    stops[index] = { ...stops[index], completed: true, completedAt: new Date() };
    set({
      currentHunt: { ...hunt, stops },
      currentStopIndex: Math.min(index + 1, stops.length - 1),
    });
  },

  resetHunt: () =>
    set({
      currentHunt: null,
      ages: [],
      mood: '',
      selectedTheme: '',
      huntPrefs: {},
      currentStopIndex: 0,
    }),
}));
