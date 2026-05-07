import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BrushTipType = 'round-soft' | 'square-soft' | 'scatter';

interface BrushSettings {
  tipType: BrushTipType;
  size: number;
  hardness: number;
  opacity: number;
  flow: number;
}

interface BrushState {
  settings: BrushSettings;
  updateSettings: (settings: Partial<BrushSettings>) => void;
}

const defaultBrushSettings: BrushSettings = {
  tipType: 'round-soft',
  size: 24,
  hardness: 80,
  opacity: 100,
  flow: 100,
};

export const useBrushStore = create<BrushState>()(
  persist(
    (set) => ({
      settings: defaultBrushSettings,
      updateSettings: (newSettings) => 
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),
    }),
    {
      name: 'mosca-tee-brush-settings',
    }
  )
);
