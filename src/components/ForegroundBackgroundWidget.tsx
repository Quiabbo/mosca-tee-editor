import React, { useState, useRef, useEffect } from 'react';
import { useColorStore } from '../store/useColorStore';
import { RefreshCw, Square } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { colord } from 'colord';
import { AdvancedColorPickerModal } from './AdvancedColorPickerModal';

import { useTranslation } from 'react-i18next';

export const ForegroundBackgroundWidget: React.FC = () => {
  const { t } = useTranslation();
  const { 
    foreground, 
    background, 
    activeSlot, 
    setForeground, 
    setBackground, 
    setActiveSlot, 
    swapColors, 
    resetColors 
  } = useColorStore();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isAdvancedPickerOpen, setIsAdvancedPickerOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPickerOpen]);

  const handleSquareClick = (slot: 'foreground' | 'background') => {
    if (activeSlot === slot && isPickerOpen) {
      setIsPickerOpen(false);
    } else {
      setActiveSlot(slot);
      setIsPickerOpen(true);
    }
  };

  const handleSquareDoubleClick = (slot: 'foreground' | 'background') => {
    setActiveSlot(slot);
    setIsPickerOpen(false);
    setIsAdvancedPickerOpen(true);
  };

  const activeColor = activeSlot === 'foreground' ? foreground : background;
  const handleColorChange = (color: string) => {
    if (activeSlot === 'foreground') {
      setForeground(color);
    } else {
      setBackground(color);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 p-1 relative">
      {/* Swap Button */}
      <button 
        onClick={swapColors}
        className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors"
        title={t('editor.tools.swap_colors', 'Swap Colors (X)')}
      >
        <RefreshCw size={12} />
      </button>

      {/* Squares Container */}
      <div className="relative w-6 h-6 sm:w-8 sm:h-8 lg:w-8 lg:h-8">
        {/* Background Square */}
        <div 
          onClick={() => handleSquareClick('background')}
          onDoubleClick={() => handleSquareDoubleClick('background')}
          className={cn(
            "absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 rounded-sm border-2 cursor-pointer transition-all shadow-lg",
            activeSlot === 'background' ? "border-zinc-400 z-10 scale-110" : "border-zinc-700 z-0"
          )}
          style={{ backgroundColor: background }}
          title={`${t('editor.tools.background_color_widget', 'Background Color')} (${t('editor.tools.double_click_to_open', 'Double click to open picker')})`}
        />
        
        {/* Foreground Square */}
        <div 
          onClick={() => handleSquareClick('foreground')}
          onDoubleClick={() => handleSquareDoubleClick('foreground')}
          className={cn(
            "absolute top-0 left-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 rounded-sm border-2 cursor-pointer transition-all shadow-lg",
            activeSlot === 'foreground' ? "border-white z-20 scale-110" : "border-zinc-700 z-10"
          )}
          style={{ backgroundColor: foreground }}
          title={`${t('editor.tools.foreground_color', 'Foreground Color')} (${t('editor.tools.double_click_to_open', 'Double click to open picker')})`}
        />
      </div>

      {/* Reset Button */}
      <button 
        onClick={resetColors}
        className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors"
        title={t('editor.tools.reset_colors', 'Reset Colors (D)')}
      >
        <Square size={10} fill="currentColor" />
      </button>

      {/* Advanced Color Picker Modal */}
      <AdvancedColorPickerModal 
        isOpen={isAdvancedPickerOpen}
        onClose={() => setIsAdvancedPickerOpen(false)}
        color={activeColor}
        onChange={handleColorChange}
        title={activeSlot === 'foreground' ? t('editor.tools.foreground_picker_title', 'Foreground Color Picker') : t('editor.tools.background_picker_title', 'Background Color Picker')}
      />

      {/* Color Picker Popover */}
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.9, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 10 }}
            className="absolute right-full mr-4 top-0 z-[100] bg-[#1a1a1a] p-3 rounded-xl border border-zinc-800 shadow-2xl w-[220px]"
          >
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                {activeSlot === 'foreground' ? t('editor.tools.foreground_color', 'Foreground Color') : t('editor.tools.background_color_widget', 'Background Color')}
              </div>
              <HexColorPicker 
                color={activeColor} 
                onChange={handleColorChange} 
                className="!w-full !h-[120px]"
              />
              <div className="flex gap-2 items-center">
                <div className="flex-grow bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] font-mono font-bold text-white uppercase">
                  {activeColor.toUpperCase()}
                </div>
                <div 
                  className="w-8 h-8 rounded-md border border-zinc-800"
                  style={{ backgroundColor: activeColor }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .react-colorful__saturation {
          border-radius: 6px 6px 0 0;
        }
        .react-colorful__hue {
          border-radius: 0 0 6px 6px;
          height: 12px;
        }
        .react-colorful__saturation-pointer, .react-colorful__hue-pointer {
          width: 14px;
          height: 14px;
        }
      `}</style>
    </div>
  );
};
