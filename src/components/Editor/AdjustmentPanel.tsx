import React from 'react';
import { 
  Sun, Contrast, Droplets, Palette, 
  Type, Sliders, Wand2, Sparkles, 
  Circle, Square, Box, Layers,
  ChevronRight, Plus, Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface AdjustmentPanelProps {
  onAddAdjustment: (type: string) => void;
}

export const AdjustmentPanel = ({ onAddAdjustment }: AdjustmentPanelProps) => {
  const { t } = useTranslation();

  const adjustments = [
    { id: 'brightness_contrast', label: t('editor.adjustments.brightness_contrast', 'Brilho/Contraste'), icon: Sun, color: 'text-amber-500' },
    { id: 'levels', label: t('editor.adjustments.levels', 'Níveis'), icon: Sliders, color: 'text-blue-500' },
    { id: 'curves', label: t('editor.adjustments.curves', 'Curvas'), icon: Sparkles, color: 'text-purple-500' },
    { id: 'hue_saturation', label: t('editor.adjustments.hue_saturation', 'Matiz/Saturação'), icon: Palette, color: 'text-green-500' },
    { id: 'color_balance', label: t('editor.adjustments.color_balance', 'Equilíbrio de Cores'), icon: Droplets, color: 'text-cyan-500' },
    { id: 'black_white', label: t('editor.adjustments.black_white', 'Black & White'), icon: Contrast, color: 'text-zinc-400' },
    { id: 'photo_filter', label: t('editor.adjustments.photo_filter', 'Photo Filter'), icon: Filter, color: 'text-orange-500' },
  ];

  const galleryFilters = [
    { id: 'sharpen', label: t('editor.gallery_filters.sharpen', 'Sharpen'), icon: Wand2, color: 'text-emerald-500' },
    { id: 'gaussian_blur', label: t('editor.gallery_filters.gaussian_blur', 'Gaussian Blur'), icon: Droplets, color: 'text-blue-400' },
    { id: 'radial_blur', label: t('editor.gallery_filters.radial_blur', 'Radial Blur'), icon: Droplets, color: 'text-blue-600' },
    { id: 'noise', label: t('editor.gallery_filters.noise', 'Noise'), icon: Sparkles, color: 'text-zinc-500' },
  ];

  const transformationFilters = [
    { id: 'skew', label: t('editor.gallery_filters.skew', 'Skew'), icon: Box, color: 'text-orange-400' },
    { id: 'perspective', label: t('editor.gallery_filters.perspective', 'Perspective'), icon: Box, color: 'text-orange-500' },
    { id: 'warp', label: t('editor.gallery_filters.warp', 'Warp'), icon: Box, color: 'text-orange-600' },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-500 tracking-wider">
            {t('editor.adjustments.title', 'Adjustments')}
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {adjustments.map((adj) => {
            const Icon = adj.icon;
            return (
              <button
                key={adj.id}
                onClick={() => onAddAdjustment(adj.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                title={adj.label}
              >
                <div className={cn("p-1.5 rounded-md bg-zinc-800 group-hover:bg-zinc-700 transition-colors", adj.color)}>
                  <Icon size={16} />
                </div>
                <span className="text-[8px] text-zinc-500 font-medium truncate w-full text-center">
                  {adj.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-500 tracking-wider">
            {t('editor.gallery_filters.title', 'Gallery Filters')}
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {galleryFilters.map((adj) => {
            const Icon = adj.icon;
            return (
              <button
                key={adj.id}
                onClick={() => onAddAdjustment(adj.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                title={adj.label}
              >
                <div className={cn("p-1.5 rounded-md bg-zinc-800 group-hover:bg-zinc-700 transition-colors", adj.color)}>
                  <Icon size={16} />
                </div>
                <span className="text-[8px] text-zinc-500 font-medium truncate w-full text-center">
                  {adj.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-500 tracking-wider">
            {t('editor.gallery_filters.transform_title', 'Transformations')}
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {transformationFilters.map((adj) => {
            const Icon = adj.icon;
            return (
              <button
                key={adj.id}
                onClick={() => onAddAdjustment(adj.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={cn("p-1.5 rounded-md bg-zinc-800 group-hover:bg-zinc-700 transition-colors", adj.color)}>
                  <Icon size={16} />
                </div>
                <span className="text-[8px] text-zinc-500 font-medium truncate w-full text-center">
                  {adj.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
