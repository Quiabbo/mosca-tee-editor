import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Pipette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { getColorName } from '../utils/colorName';
import { useA11yStore } from '../store/useA11yStore';
import { speech } from '../services/speechService';

extend([namesPlugin]);

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  variant?: 'circle' | 'square';
  side?: 'top' | 'bottom';
  showText?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  color, 
  onChange, 
  className,
  variant = 'circle',
  side = 'top',
  showText = false
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({ left: '50%' });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isInputFocused = useRef(false);
  const { blindMode } = useA11yStore();

  // Normalize color for internal use
  const colorObj = colord(color === 'transparent' ? 'rgba(255, 255, 255, 0)' : color);
  const hexColor = colorObj.toHex().substring(0, 7); // Force 6-digit hex for the internal picker
  const alpha = colorObj.alpha();

  // Local state for smooth slider tracking
  const [localAlpha, setLocalAlpha] = useState(alpha);
  const alphaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync localAlpha when color changes externally
  useEffect(() => {
    setLocalAlpha(alpha);
  }, [alpha]);

  // Update input when color changes
  useEffect(() => {
    if (!isInputFocused.current) {
      setInputValue(colorObj.toHex().toUpperCase());
    }
  }, [color]);

  const updateCoords = () => {
    if (triggerRef.current && typeof triggerRef.current.getBoundingClientRect === 'function') {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 240;
      const padding = 32;
      const rightEdge = typeof document !== 'undefined' ? document.documentElement.clientWidth : window.innerWidth;
      
      let left = rect.left + rect.width / 2 - popoverWidth / 2;

      if (rect.left > rightEdge / 2) {
        left = rect.right - popoverWidth;
      }

      if (left + popoverWidth > rightEdge - padding) {
        left = rightEdge - padding - popoverWidth;
      }
      if (left < padding) {
        left = padding;
      }

      setCoords({
        top: side === 'top' ? rect.top : rect.bottom,
        left: left
      });

      const triggerCenter = rect.left + rect.width / 2;
      const relativeArrowPos = triggerCenter - left;
      
      const arrowPos = Math.max(16, Math.min(popoverWidth - 16, relativeArrowPos));
      setArrowStyle({ left: `${arrowPos}px` });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen, side]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePickerChange = (newHex: string) => {
    const updated = colord(newHex).alpha(localAlpha).toRgbString();
    onChange(updated);
  };

  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAlpha = parseFloat(e.target.value);
    setLocalAlpha(newAlpha);

    // Immediate local feedback is provided by localAlpha
    if (alphaTimeoutRef.current) clearTimeout(alphaTimeoutRef.current);
    alphaTimeoutRef.current = setTimeout(() => {
      const updated = colord(hexColor).alpha(newAlpha).toRgbString();
      onChange(updated);
    }, 500); // 0.5s delay as requested
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    const c = colord(val);
    if (c.isValid()) {
      onChange(c.alpha(localAlpha).toRgbString());
    }
  };

  const handleEyeDropper = async () => {
    // @ts-ignore
    if (!window.EyeDropper) {
      alert(t('editor.errors.eyedropper_not_supported', 'Seu navegador não suporta a ferramenta de conta-gotas.'));
      return;
    }

    try {
      // @ts-ignore
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result.sRGBHex) {
        const updated = colord(result.sRGBHex).alpha(localAlpha).toRgbString();
        onChange(updated);
      }
    } catch (e) {
      console.log('EyeDropper cancelled or failed', e);
    }
  };

  const PopoverContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 10 : -10 }}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: `${side === 'top' ? 'translateY(-100%)' : ''}`,
            marginTop: side === 'bottom' ? '12px' : '0',
            marginBottom: side === 'top' ? '12px' : '0',
          }}
          className="z-[9999] bg-[#1a1a1a] p-3 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-zinc-800 w-[240px]"
        >
          <div className="space-y-3 custom-color-picker">
            <HexColorPicker color={hexColor} onChange={handlePickerChange} />
            
            {/* Opacity Slider */}
            <div className="space-y-1.5 px-0.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">{t('editor.panels.opacity', 'Opacity')}</span>
                <span className="text-[10px] font-mono text-zinc-400">{Math.round(localAlpha * 100)}%</span>
              </div>
                  <div className="relative h-4 mt-1 flex items-center">
                <div 
                  className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,#fff_25%,#fff_75%,#ccc_75%,#ccc)] bg-[0_0,4px_4px] bg-[length:8px_8px] opacity-10"
                />
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{ background: `linear-gradient(to right, transparent, ${hexColor})` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localAlpha}
                  onChange={handleAlphaChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className="absolute h-3 w-3 rounded-full bg-white shadow-md border border-zinc-400 pointer-events-none top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${localAlpha * 100}%` }}
                />
              </div>
            </div>

            {/* Suggested Palette */}
            <div className="grid grid-cols-12 gap-1 pt-1">
              {[
                '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
                '#00FFFF', '#FF00FF', '#FFA500', '#800080', '#FFC0CB', '#808080'
              ].map((c) => {
                const colorName = getColorName(c, i18n.language.startsWith('pt') ? 'pt' : 'en');
                return (
                  <button
                    key={c}
                    onClick={() => {
                      const updated = colord(c).alpha(alpha).toRgbString();
                      onChange(updated);
                    }}
                    className="w-full aspect-square rounded-sm border border-zinc-800 hover:border-zinc-500 transition-colors focus:ring-1 focus:ring-blue-500 outline-none"
                    style={{ backgroundColor: c }}
                    title={colorName}
                    aria-label={colorName}
                  />
                );
              })}
            </div>

            <div className="flex gap-2 items-center pt-1">
              {/* EyeDropper Button */}
              {typeof window !== 'undefined' && 'EyeDropper' in window && (
                <button
                  onClick={handleEyeDropper}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                  title={t('editor.tools.eyedropper', 'Conta-gotas')}
                >
                  <Pipette size={14} />
                </button>
              )}

              <div className="flex-shrink-0 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-500">
                HEX
              </div>

              <input
                type="text"
                value={inputValue}
                onFocus={() => { isInputFocused.current = true; }}
                onBlur={() => { isInputFocused.current = false; }}
                onChange={handleInputChange}
                className="flex-grow min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-white focus:outline-none focus:border-zinc-600 transition-colors uppercase"
              />
            </div>
          </div>

          {/* Arrow */}
          <div 
            style={arrowStyle}
            className={cn(
            "absolute -translate-x-1/2 border-[6px] border-transparent",
            side === 'top' ? "top-full border-t-[#1a1a1a]" : "bottom-full border-b-[#1a1a1a]"
          )} />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm overflow-hidden border bg-zinc-900/50",
          variant === 'circle' ? "rounded-full" : "rounded-lg",
          isOpen ? "border-blue-500 shadow-md" : "border-zinc-700 hover:border-zinc-500"
        )}
        title={t('editor.tools.custom_color', 'Custom Color')}
      >
        <div 
          className="w-full h-full flex items-center gap-2 px-3"
          style={{ backgroundColor: color === 'transparent' ? 'transparent' : (showText ? 'transparent' : color) }}
        >
          <div 
            className={cn("flex-shrink-0", variant === 'circle' ? "w-6 h-6 rounded-full" : "w-5 h-5 rounded-sm")}
            style={{ backgroundColor: color === 'transparent' ? 'transparent' : color }}
          >
            {color === 'transparent' && (
              <div className="w-full h-full bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,#fff_25%,#fff_75%,#ccc_75%,#ccc)] bg-[0_0,4px_4px] bg-[length:8px_8px]" />
            )}
          </div>
          {showText && (
            <span className="text-xs font-mono text-zinc-400 uppercase">{color}</span>
          )}
        </div>
      </button>

      {createPortal(PopoverContent, document.body)}

      <style>{`
        .custom-color-picker .react-colorful {
          width: 100%;
          height: 140px;
          gap: 12px;
        }
        .custom-color-picker .react-colorful__saturation {
          border-radius: 4px;
          border: 1px solid #3f3f46;
        }
        .custom-color-picker .react-colorful__hue {
          height: 8px;
          border-radius: 100px;
          border: 1px solid #3f3f46;
        }
        .custom-color-picker .react-colorful__saturation-pointer {
          width: 16px;
          height: 16px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .custom-color-picker .react-colorful__hue-pointer {
          width: 16px;
          height: 16px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};
