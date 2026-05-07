import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ColorState {
  foreground: string;
  background: string;
  activeSlot: 'foreground' | 'background';
  setForeground: (color: string) => void;
  setBackground: (color: string) => void;
  setActiveSlot: (slot: 'foreground' | 'background') => void;
  swapColors: () => void;
  resetColors: () => void;
}

export const useColorStore = create<ColorState>()(
  persist(
    (set) => ({
      foreground: '#000000',
      background: '#ffffff',
      activeSlot: 'foreground',
      setForeground: (color) => set({ foreground: color }),
      setBackground: (color) => set({ background: color }),
      setActiveSlot: (slot) => set({ activeSlot: slot }),
      swapColors: () => set((state) => ({
        foreground: state.background,
        background: state.foreground
      })),
      resetColors: () => set({
        foreground: '#000000',
        background: '#ffffff'
      }),
    }),
    {
      name: 'mosca-tee-colors',
    }
  )
);
