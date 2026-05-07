import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface A11yState {
  blindMode: boolean;
  narrationSpeed: number;
  narrateMovements: boolean;
  setBlindMode: (value: boolean) => void;
  setNarrationSpeed: (value: number) => void;
  setNarrateMovements: (value: boolean) => void;
}

export const useA11yStore = create<A11yState>()(
  persist(
    (set) => ({
      blindMode: false,
      narrationSpeed: 1.1,
      narrateMovements: true,
      setBlindMode: (value) => set({ blindMode: value }),
      setNarrationSpeed: (value) => set({ narrationSpeed: value }),
      setNarrateMovements: (value) => set({ narrateMovements: value }),
    }),
    {
      name: 'moscatee_a11y_blind_mode',
    }
  )
);
