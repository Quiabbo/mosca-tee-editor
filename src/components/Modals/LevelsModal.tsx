import React, { useState, useEffect, useMemo } from 'react';
import { X, RotateCcw, Check, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface Levels {
  inputShadows: number;
  inputMidtones: number;
  inputHighlights: number;
  outputShadows: number;
  outputHighlights: number;
}

interface LevelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (levels: Levels, channel: 'RGB' | 'Red' | 'Green' | 'Blue') => void;
  initialLevels?: Levels;
  imageElement?: HTMLImageElement | HTMLCanvasElement | null;
}

const DEFAULT_LEVELS: Levels = {
  inputShadows: 0,
  inputMidtones: 1.0,
  inputHighlights: 255,
  outputShadows: 0,
  outputHighlights: 255
};

export default function LevelsModal({ isOpen, onClose, onApply, initialLevels, imageElement }: LevelsModalProps) {
  const { t } = useTranslation();
  const [levels, setLevels] = useState<Levels>(initialLevels || DEFAULT_LEVELS);
  const [channel, setChannel] = useState<'RGB' | 'Red' | 'Green' | 'Blue'>('RGB');

  // Debounced Apply
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        onApply(levels, channel);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [levels, channel, isOpen]);

  useEffect(() => {
    if (initialLevels && isOpen) {
      setLevels(initialLevels);
    }
  }, [initialLevels, isOpen]);

  // Histogram calculation
  const histogramData = useMemo(() => {
    if (!imageElement) return new Array(256).fill(0);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Array(256).fill(0);

    // Use a small fixed size for calculation to ensure performance
    const calcSize = 128;
    canvas.width = calcSize;
    canvas.height = calcSize;
    ctx.drawImage(imageElement, 0, 0, calcSize, calcSize);

    const imageData = ctx.getImageData(0, 0, calcSize, calcSize);
    const data = imageData.data;
    const hist = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      let val;
      if (channel === 'RGB') {
        val = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
      } else if (channel === 'Red') {
        val = data[i];
      } else if (channel === 'Green') {
        val = data[i + 1];
      } else {
        val = data[i + 2];
      }
      hist[val]++;
    }

    // Normalize
    const max = Math.max(...hist);
    return hist.map(v => (v / max) * 100);
  }, [imageElement, channel]);

  const handleReset = () => {
    const resetLevels = DEFAULT_LEVELS;
    setLevels(resetLevels);
    // Immediate reset
    onApply(resetLevels, channel);
  };

  const handleApply = () => {
    onApply(levels, channel);
    onClose();
  };

  const updateLevels = (field: keyof Levels, value: number) => {
    setLevels(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      
      <motion.div 
        drag
        dragMomentum={false}
        dragListener={true}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col pointer-events-auto"
      >
        {/* Header - Movable */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/50 cursor-move">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <SlidersHorizontal className="w-3 h-3 text-blue-500" />
            </div>
            <h2 className="text-xs font-bold text-zinc-100">
              {t('editor.adjustments.levels', 'Níveis')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Channel Selection */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{t('editor.levels.channel', 'Canal')}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['RGB', 'Red', 'Green', 'Blue'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={cn(
                    "py-1.5 rounded-lg text-[10px] font-medium transition-all",
                    channel === c 
                      ? "bg-zinc-100 text-zinc-950" 
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Input Levels */}
          <div className="space-y-3">
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{t('editor.levels.input', 'Níveis de Entrada')}</label>
            
            {/* Histogram */}
            <div className="relative h-24 bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800/50">
              <div className="absolute inset-0 flex items-end px-1 pb-1 gap-[0.5px]">
                {histogramData.map((height, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-zinc-600/30" 
                    style={{ height: `${height}%` }} 
                  />
                ))}
              </div>
            </div>

            {/* Input Controls */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="number"
                  value={levels.inputShadows}
                  onChange={(e) => updateLevels('inputShadows', Math.min(levels.inputHighlights - 1, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full h-7 bg-zinc-900 border border-zinc-800 rounded text-center text-[10px] font-mono text-zinc-300"
                />
                <input 
                  type="number"
                  step="0.01"
                  value={levels.inputMidtones}
                  onChange={(e) => updateLevels('inputMidtones', Math.min(9.99, Math.max(0.01, parseFloat(e.target.value) || 1)))}
                  className="w-full h-7 bg-zinc-900 border border-zinc-800 rounded text-center text-[10px] font-mono text-zinc-300"
                />
                <input 
                  type="number"
                  value={levels.inputHighlights}
                  onChange={(e) => updateLevels('inputHighlights', Math.min(255, Math.max(levels.inputShadows + 1, parseInt(e.target.value) || 255)))}
                  className="w-full h-7 bg-zinc-900 border border-zinc-800 rounded text-center text-[10px] font-mono text-zinc-300"
                />
              </div>

              <div className="relative h-4 flex items-center px-1">
                {/* Track between sliders */}
                <div 
                  className="absolute h-0.5 bg-zinc-600/50 rounded-full"
                  style={{ 
                    left: `${(levels.inputShadows / 255) * 100}%`,
                    right: `${100 - (levels.inputHighlights / 255) * 100}%`
                  }}
                />
                
                <input 
                  type="range"
                  min="0"
                  max="255"
                  value={levels.inputShadows}
                  onChange={(e) => updateLevels('inputShadows', Math.min(levels.inputHighlights - 1, parseInt(e.target.value)))}
                  className="absolute w-full left-0 appearance-none bg-transparent pointer-events-auto h-0.5 z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
                <input 
                  type="range"
                  min="0"
                  max="255"
                  value={levels.inputHighlights}
                  onChange={(e) => updateLevels('inputHighlights', Math.max(levels.inputShadows + 1, parseInt(e.target.value)))}
                  className="absolute w-full left-0 appearance-none bg-transparent pointer-events-auto h-0.5 z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Output Levels */}
          <div className="space-y-3">
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{t('editor.levels.output', 'Níveis de Saída')}</label>
            
            <div className="h-2.5 w-full rounded overflow-hidden" 
                 style={{ background: 'linear-gradient(to right, black, white)' }} />
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <input 
                  type="number"
                  value={levels.outputShadows}
                  onChange={(e) => updateLevels('outputShadows', Math.min(255, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full h-7 bg-zinc-900 border border-zinc-800 rounded text-center text-[10px] font-mono text-zinc-300"
                />
                <input 
                  type="range"
                  min="0"
                  max="255"
                  value={levels.outputShadows}
                  onChange={(e) => updateLevels('outputShadows', parseInt(e.target.value))}
                  className="w-full accent-zinc-500 h-1"
                />
              </div>
              <div className="flex items-center justify-center">
                <div className="w-6 h-[1px] bg-zinc-800" />
              </div>
              <div className="space-y-2">
                <input 
                  type="number"
                  value={levels.outputHighlights}
                  onChange={(e) => updateLevels('outputHighlights', Math.min(255, Math.max(0, parseInt(e.target.value) || 255)))}
                  className="w-full h-7 bg-zinc-900 border border-zinc-800 rounded text-center text-[10px] font-mono text-zinc-300"
                />
                <input 
                  type="range"
                  min="0"
                  max="255"
                  value={levels.outputHighlights}
                  onChange={(e) => updateLevels('outputHighlights', parseInt(e.target.value))}
                  className="w-full accent-zinc-500 h-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-900 bg-zinc-950/50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-100 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            {t('common.reset', 'Resetar')}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[10px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold rounded-lg transition-all"
            >
              <Check className="w-3 h-3" />
              {t('common.ok', 'OK')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
