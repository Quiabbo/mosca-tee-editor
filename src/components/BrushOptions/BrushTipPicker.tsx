import React, { useRef, useEffect } from 'react';
import { BrushTipType, useBrushStore } from '../../store/useBrushStore';
import { brushTips, BrushTipPreview } from './BrushTipPreview';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface BrushTipPickerProps {
  currentTip: BrushTipType;
  onSelect: (tip: BrushTipType) => void;
  onClose: () => void;
}

export function BrushTipPicker({ currentTip, onSelect, onClose }: BrushTipPickerProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const { settings } = useBrushStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full left-0 mt-2 z-50 
                 bg-[#1a1a1a] border border-zinc-800 
                 rounded-xl shadow-2xl p-4 w-64"
    >
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('editor.tools.brush_tip', 'Brush Tip')}</p>
      
      <div className="grid grid-cols-5 gap-2">
        {brushTips.map((tip) => (
          <button
            key={tip.id}
            onClick={() => onSelect(tip.id)}
            title={t(`editor.tools.brush_tips.${tip.id}`, tip.label)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center
                        hover:bg-zinc-800 transition-all relative group
                        ${currentTip === tip.id ? 'ring-2 ring-blue-500 bg-zinc-800' : 'bg-zinc-900/50'}`}
          >
            <BrushTipPreview tip={tip.id} size={24} className="group-hover:scale-110 transition-transform" />
          </button>
        ))}
      </div>

      {/* Preview da ponta selecionada em tamanho real */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('editor.tools.stroke_preview', 'Stroke Preview')}</p>
        <div className="w-full h-16 bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center p-2">
          <BrushStrokePreview tip={currentTip} size={settings.size} hardness={settings.hardness} />
        </div>
      </div>
    </motion.div>
  );
}

function BrushStrokePreview({ tip, size, hardness }: { tip: BrushTipType; size: number; hardness: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const brushTip = brushTips.find(t => t.id === tip);
    if (!brushTip) return;

    // Draw a sample stroke
    ctx.save();
    ctx.globalAlpha = 1;
    
    // Scale down if size is too large for preview
    const scale = Math.min(1, 40 / size);
    const drawSize = size * scale;
    
    // Simple stroke simulation
    for (let i = 0; i < 10; i++) {
        const x = 20 + i * (w - 40) / 10;
        const y = h / 2;
        
        ctx.save();
        ctx.translate(x - drawSize/2, y - drawSize/2);
        
        // Apply hardness simulation for round tips
        if (tip.includes('round')) {
            const grad = ctx.createRadialGradient(drawSize/2, drawSize/2, 0, drawSize/2, drawSize/2, drawSize/2);
            const hVal = hardness / 100;
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(Math.max(0, hVal * 0.8), `rgba(255,255,255,${0.5 + hVal * 0.5})`);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(drawSize/2, drawSize/2, drawSize/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = 'white';
            brushTip.render(ctx, drawSize);
        }
        ctx.restore();
    }
    
    ctx.restore();
  }, [tip, size, hardness]);

  return <canvas ref={canvasRef} width={200} height={64} />;
}
