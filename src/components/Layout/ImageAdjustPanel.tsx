import React from 'react';
import { 
  Sliders, Move, RefreshCw, SunMedium, Contrast, Droplets, 
  Palette as PaletteIcon, Filter, Grid3X3, Square as MaskIcon, 
  X, Circle as CircleIcon, Heart as HeartIcon, Star as StarIcon,
  Zap, Activity
} from 'lucide-react';
import { fabric } from 'fabric';

import { useTranslation } from 'react-i18next';

interface ImageAdjustPanelProps {
  activeObject: any;
  imageAdjustments: Record<string, any>;
  applyImageAdjustment: (id: string, value: number) => void;
  resetImageAdjustments: () => void;
}

export const ImageAdjustPanel: React.FC<ImageAdjustPanelProps> = ({
  activeObject,
  imageAdjustments,
  applyImageAdjustment,
  resetImageAdjustments,
}) => {
  const { t } = useTranslation();
  if (!activeObject || activeObject.type !== 'image') return null;

  const objectName = activeObject.name || 'unnamed';
  const currentAdjustments = imageAdjustments[objectName] || {};

  return (
    <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar h-full">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-zinc-500 tracking-widest flex items-center gap-2">
            <Sliders size={12} className="text-zinc-400" /> {t('editor.header.image_adjustments_title', 'Ajustes de imagem')}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={resetImageAdjustments}
              className="text-[9px] font-bold text-zinc-400 hover:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw size={10} /> {t('editor.panels.history', 'Reset')}
            </button>
          </div>
        </div>
        
        {[
          { id: 'brightness', label: t('editor.panels.brightness', 'Brightness'), icon: SunMedium, min: -100, max: 100 },
          { id: 'contrast', label: t('editor.panels.contrast', 'Contrast'), icon: Contrast, min: -100, max: 100 },
          { id: 'saturation', label: t('editor.panels.saturation', 'Saturation'), icon: Droplets, min: -100, max: 100 },
          { id: 'hue', label: t('editor.panels.hue', 'Hue'), icon: PaletteIcon, min: -100, max: 100 },
          { id: 'blur', label: t('editor.panels.blur', 'Blur'), icon: Filter, min: 0, max: 100 },
          { id: 'sharpness', label: t('editor.panels.sharpness', 'Sharpness'), icon: Activity, min: 0, max: 100 },
          { id: 'gamma', label: t('editor.panels.gamma', 'Gamma'), icon: Zap, min: 1, max: 220 }, // 0.1 to 2.2
          { id: 'pixelate', label: t('editor.panels.pixelate', 'Pixelate'), icon: Grid3X3, min: 1, max: 50 },
        ].map(adj => (
          <div key={adj.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] text-zinc-500 flex items-center gap-1.5">
                <adj.icon size={10} /> {adj.label}
              </label>
              <span className="text-[9px] font-bold text-zinc-400">
                {adj.id === 'gamma' 
                  ? (currentAdjustments[adj.id] ? (currentAdjustments[adj.id] / 100).toFixed(2) : "1.00")
                  : (currentAdjustments[adj.id] || (adj.id === 'pixelate' ? 1 : 0))}
              </span>
            </div>
            <input 
              type="range" 
              min={adj.min} max={adj.max} 
              value={currentAdjustments[adj.id] || (adj.id === 'pixelate' ? 1 : (adj.id === 'gamma' ? 100 : 0))} 
              onChange={(e) => applyImageAdjustment(adj.id, parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
            />
          </div>
        ))}
      </div>

    </div>
  );
};
