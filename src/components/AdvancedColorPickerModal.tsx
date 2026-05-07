import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HsvColorPicker } from 'react-colorful';
import { colord, extend } from 'colord';
import cmykPlugin from 'colord/plugins/cmyk';
import labPlugin from 'colord/plugins/lab';
import namesPlugin from 'colord/plugins/names';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X, Pipette } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

extend([cmykPlugin, labPlugin, namesPlugin]);

interface AdvancedColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  color: string;
  onChange: (color: string) => void;
  title: string;
}

export const AdvancedColorPickerModal: React.FC<AdvancedColorPickerModalProps> = ({
  isOpen,
  onClose,
  color,
  onChange,
  title
}) => {
  const [hsv, setHsv] = useState(colord(color).toHsv());
  const [hexInput, setHexInput] = useState(colord(color).toHex().toUpperCase().replace('#', ''));
  const lastNotifiedHex = useRef(colord(color).toHex());
  const isInteracting = useRef(false);
  const isHexFocused = useRef(false);
  const onChangeRef = useRef(onChange);
  const dragControls = useDragControls();
  const { t } = useTranslation();

  // Keep onChangeRef up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync internal state with external color prop ONLY when not interacting
  useEffect(() => {
    if (isOpen && !isInteracting.current) {
      const newColor = colord(color);
      if (newColor.isValid()) {
        const incomingHex = newColor.toHex();
        if (incomingHex !== lastNotifiedHex.current) {
          lastNotifiedHex.current = incomingHex;
          setHsv(newColor.toHsv());
          if (!isHexFocused.current) {
            setHexInput(incomingHex.toUpperCase().replace('#', ''));
          }
        }
      }
    }
  }, [color, isOpen]);

  const notifyChange = useCallback((newHex: string) => {
    if (newHex !== lastNotifiedHex.current) {
      lastNotifiedHex.current = newHex;
      onChangeRef.current(newHex);
    }
  }, []);

  const handleColorChange = useCallback((newHsv: Partial<{ h: number; s: number; v: number; a: number }>) => {
    isInteracting.current = true;
    setHsv(prev => {
      const updated = { ...prev, ...newHsv };
      const newHex = colord(updated).toHex();
      notifyChange(newHex);
      if (!isHexFocused.current) {
        setHexInput(newHex.toUpperCase().replace('#', ''));
      }
      return updated;
    });
    // Reset interaction flag after a short delay to allow prop sync to resume
    setTimeout(() => { isInteracting.current = false; }, 10);
  }, [notifyChange]);

  const handleHexInputChange = useCallback((val: string) => {
    const upper = val.toUpperCase().replace('#', '');
    setHexInput(upper);
    
    if (upper.length === 3 || upper.length === 6) {
      const newColor = colord('#' + upper);
      if (newColor.isValid()) {
        const newHex = newColor.toHex();
        if (newHex !== lastNotifiedHex.current) {
          isInteracting.current = true;
          lastNotifiedHex.current = newHex;
          setHsv(newColor.toHsv());
          onChangeRef.current(newHex);
          setTimeout(() => { isInteracting.current = false; }, 10);
        }
      }
    }
  }, []);

  const colorObj = colord(hsv);
  const activeColor = colorObj.toHex();
  const rgb = colorObj.toRgb();
  const lab = colorObj.toLab();
  const cmyk = colorObj.toCmyk();

  const updateRgb = (newRgb: Partial<{ r: number; g: number; b: number }>) => {
    const updated = colord({ ...rgb, ...newRgb }).toHsv();
    handleColorChange(updated);
  };

  const updateLab = (newLab: Partial<{ l: number; a: number; b: number }>) => {
    const updated = colord({ ...lab, ...newLab }).toHsv();
    handleColorChange(updated);
  };

  const updateCmyk = (newCmyk: Partial<{ c: number; m: number; y: number; k: number }>) => {
    const updated = colord({ ...cmyk, ...newCmyk }).toHsv();
    handleColorChange(updated);
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
        handleHexInputChange(result.sRGBHex);
      }
    } catch (e) {
      console.log('EyeDropper cancelled or failed', e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#2c2c2c] rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-[620px] overflow-hidden border border-zinc-700 pointer-events-auto"
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-[#333333] select-none cursor-move"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <span className="text-xs font-bold text-zinc-200">{title}</span>
              <button 
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 flex gap-12 cursor-default" onPointerDown={(e) => e.stopPropagation()}>
              {/* Left: Saturation & Hue */}
              <div className="flex gap-4 custom-colorful flex-shrink-0">
                <div className="relative">
                  <HsvColorPicker 
                    color={hsv} 
                    onChange={(newHsv) => handleColorChange(newHsv)} 
                  />
                  {/* Custom Vertical Hue Slider Overlay */}
                  <div className="absolute top-0 right-[-32px] w-5 h-[240px] flex flex-col items-center">
                    <div 
                      className="w-full h-full rounded-sm border border-zinc-700 cursor-pointer relative"
                      style={{ 
                        background: 'linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' 
                      }}
                      onMouseDown={(e) => {
                        const sliderElement = e.currentTarget;
                        const handleMove = (moveEvent: MouseEvent) => {
                          if (!sliderElement || typeof sliderElement.getBoundingClientRect !== 'function') return;
                          const rect = sliderElement.getBoundingClientRect();
                          const y = Math.max(0, Math.min(rect.height, moveEvent.clientY - rect.top));
                          const newHue = (y / rect.height) * 360;
                          handleColorChange({ h: newHue });
                        };
                        const handleUp = () => {
                          window.removeEventListener('mousemove', handleMove);
                          window.removeEventListener('mouseup', handleUp);
                        };
                        window.addEventListener('mousemove', handleMove);
                        window.addEventListener('mouseup', handleUp);
                        handleMove(e.nativeEvent as MouseEvent);
                      }}
                    >
                      {/* Hue Indicator */}
                      <div 
                        className="absolute left-[-4px] right-[-4px] h-1.5 border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] pointer-events-none bg-transparent"
                        style={{ top: `${(hsv.h / 360) * 100}%`, transform: 'translateY(-50%)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Preview, Accept, Inputs */}
              <div className="flex-grow flex flex-col gap-4">
                <div className="flex justify-between items-start gap-6">
                  <div 
                    className="w-20 h-20 rounded border border-zinc-800 shadow-inner flex-shrink-0"
                    style={{ backgroundColor: activeColor }}
                  />
                  <div className="flex flex-col gap-3 pt-1">
                    <button 
                      onClick={onClose}
                      className="px-8 py-2 bg-[#0f0f0f] hover:bg-[#141414] text-white text-xs font-bold rounded border border-zinc-700 transition-all active:scale-95 whitespace-nowrap"
                    >
                      {t('editor.common.accept', 'Aceitar')}
                    </button>
                    <button 
                      onClick={onClose}
                      className="px-8 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs font-medium rounded transition-all active:scale-95 whitespace-nowrap"
                    >
                      {t('editor.common.cancel', 'Cancelar')}
                    </button>
                  </div>
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {/* Column 1: HSB & RGB */}
                  <div className="space-y-1">
                    <ColorInput label="H:" value={Math.round(hsv.h)} unit="°" onChange={(v) => handleColorChange({ h: v })} />
                    <ColorInput label="S:" value={Math.round(hsv.s)} unit="%" onChange={(v) => handleColorChange({ s: v })} />
                    <ColorInput label="B:" value={Math.round(hsv.v)} unit="%" onChange={(v) => handleColorChange({ v: v })} />
                    <div className="h-0.5" />
                    <ColorInput label="R:" value={rgb.r} onChange={(v) => updateRgb({ r: v })} />
                    <ColorInput label="G:" value={rgb.g} onChange={(v) => updateRgb({ g: v })} />
                    <ColorInput label="B:" value={rgb.b} onChange={(v) => updateRgb({ b: v })} />
                    <div className="h-0.5" />
                    <div className="flex items-center gap-1 h-6">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {typeof window !== 'undefined' && 'EyeDropper' in window && (
                          <button
                            onClick={handleEyeDropper}
                            className="w-6 h-6 flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            title={t('editor.tools.eyedropper', 'Conta-gotas')}
                          >
                            <Pipette size={12} />
                          </button>
                        )}
                        <span className="text-[11px] font-bold text-zinc-500 w-5 flex-shrink-0">#:</span>
                      </div>
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          value={hexInput}
                          onFocus={() => { isHexFocused.current = true; }}
                          onBlur={() => { 
                            isHexFocused.current = false;
                            // Sync back to current color on blur to ensure valid state
                            setHexInput(colord(hsv).toHex().toUpperCase().replace('#', ''));
                          }}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase().replace('#', '');
                            if (/^[0-9A-F]*$/i.test(val) && val.length <= 6) {
                              handleHexInputChange(val);
                            }
                          }}
                          className="w-full h-6 bg-[#1e1e1e] border border-zinc-700 rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-zinc-500 uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Lab & CMYK */}
                  <div className="space-y-1">
                    <ColorInput label="L:" value={Math.round(lab.l)} onChange={(v) => updateLab({ l: v })} />
                    <ColorInput label="a:" value={Math.round(lab.a)} onChange={(v) => updateLab({ a: v })} />
                    <ColorInput label="b:" value={Math.round(lab.b)} onChange={(v) => updateLab({ b: v })} />
                    <div className="h-0.5" />
                    <ColorInput label="C:" value={Math.round(cmyk.c)} unit="%" onChange={(v) => updateCmyk({ c: v })} />
                    <ColorInput label="M:" value={Math.round(cmyk.m)} unit="%" onChange={(v) => updateCmyk({ m: v })} />
                    <ColorInput label="Y:" value={Math.round(cmyk.y)} unit="%" onChange={(v) => updateCmyk({ y: v })} />
                    <ColorInput label="K:" value={Math.round(cmyk.k)} unit="%" onChange={(v) => updateCmyk({ k: v })} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <style>{`
            .custom-colorful .react-colorful {
              width: 240px;
              height: 240px;
            }
            .custom-colorful .react-colorful__saturation {
              width: 240px;
              height: 240px;
              border-radius: 2px;
              border: 1px solid #3f3f46;
            }
            .custom-colorful .react-colorful__hue {
              display: none;
            }
            .react-colorful__saturation-pointer {
              width: 12px;
              height: 12px;
              border: 2px solid white;
              box-shadow: 0 0 0 1px rgba(0,0,0,0.5);
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ColorInputProps {
  label: string;
  value: number;
  unit?: string;
  onChange: (val: number) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, unit, onChange }) => (
  <div className="flex items-center gap-1 h-6">
    <span className="text-[11px] font-bold text-zinc-500 w-5 flex-shrink-0">{label}</span>
    <div className="relative flex-grow">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-6 bg-[#1e1e1e] border border-zinc-700 rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none">{unit}</span>}
    </div>
  </div>
);

