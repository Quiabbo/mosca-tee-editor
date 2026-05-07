import React, { useEffect, useRef } from 'react';
import { BrushTipType } from '../../store/useBrushStore';

interface BrushTipPreviewProps {
  tip: BrushTipType;
  size: number;
  className?: string;
}

export const brushTips: { id: BrushTipType; label: string; render: (ctx: CanvasRenderingContext2D, size: number) => void }[] = [
  {
    id: 'round-soft',
    label: 'Soft Round',
    render: (ctx, size) => {
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(0.5, 'rgba(0,0,0,0.6)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    id: 'square-soft',
    label: 'Soft Square',
    render: (ctx, size) => {
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.7);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(0.6, 'rgba(0,0,0,0.5)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(1, 1, size - 2, size - 2);
    }
  },
  {
    id: 'scatter',
    label: 'Spray',
    render: (ctx, size) => {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
];

export const BrushTipPreview: React.FC<BrushTipPreviewProps> = ({ tip, size, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    const brushTip = brushTips.find(t => t.id === tip);
    if (brushTip) {
      brushTip.render(ctx, size);
    }
  }, [tip, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      className={className}
    />
  );
};
