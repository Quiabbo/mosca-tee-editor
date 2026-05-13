import React, { useState } from 'react';
import { useBrushStore } from '../../store/useBrushStore';
import { useColorStore } from '../../store/useColorStore';
import { BrushTipPreview, brushTips } from './BrushTipPreview';
import { SliderControl } from './SliderControl';
import { BrushTipPicker } from './BrushTipPicker';
import { ColorPicker } from '../ColorPicker';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface BrushOptionsBarProps {}

export function BrushOptionsBar({}: BrushOptionsBarProps) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useBrushStore();
  const { foreground, setForeground } = useColorStore();
  const [tipPickerOpen, setTipPickerOpen] = useState(false);

  const currentTip = brushTips.find(t => t.id === settings.tipType);

  return (
    <div className="flex items-center gap-6 px-4 h-12 bg-[#191919] border-b border-zinc-800 shadow-sm shrink-0 z-[90] overflow-visible">

      {/* 0. COR DO PINCEL */}
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700 group">
        <div className="flex flex-col items-start">
          <span className="text-[9px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.color', 'Cor')}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <ColorPicker 
              color={foreground} 
              onChange={setForeground}
              variant="square"
              side="bottom"
            />
            <span className="text-[11px] text-zinc-200 font-mono">{foreground}</span>
          </div>
        </div>
      </div>

      <div className="w-px h-6 bg-zinc-800" />

      {/* 1. SELETOR DE PONTA */}
      <div className="relative">
        <button
          onClick={() => setTipPickerOpen(!tipPickerOpen)}
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700 group"
          title={t('editor.tools.brush_tip_type', 'Brush Tip Type')}
        >
          <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-105 transition-transform">
            <BrushTipPreview tip={settings.tipType} size={20} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.tip', 'Ponta')}</span>
            <span className="text-[11px] text-zinc-200 font-medium capitalize">
              {t(`editor.tools.brush_tips.${currentTip?.id}`, currentTip?.label || 'Brush')}
            </span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${tipPickerOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {tipPickerOpen && (
            <BrushTipPicker
              currentTip={settings.tipType}
              onSelect={(tip) => {
                updateSettings({ tipType: tip });
                setTipPickerOpen(false);
              }}
              onClose={() => setTipPickerOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="w-px h-6 bg-zinc-800" />

      {/* 2. TAMANHO */}
      <SliderControl
        label={t('editor.panels.size', 'Size')}
        value={settings.size}
        min={1}
        max={500}
        unit="px"
        onChange={(v) => updateSettings({ size: v })}
        inputWidth="w-14"
      />

      <div className="w-px h-6 bg-zinc-800" />

      {/* 3. DUREZA */}
      <SliderControl
        label={t('editor.panels.hardness', 'Hardness')}
        value={settings.hardness}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => updateSettings({ hardness: v })}
        inputWidth="w-12"
      />

      <div className="w-px h-6 bg-zinc-800" />

      {/* 4. OPACIDADE */}
      <SliderControl
        label={t('editor.panels.opacity', 'Opacity')}
        value={settings.opacity}
        min={1}
        max={100}
        unit="%"
        onChange={(v) => updateSettings({ opacity: v })}
        inputWidth="w-12"
      />
    </div>
  );
}
