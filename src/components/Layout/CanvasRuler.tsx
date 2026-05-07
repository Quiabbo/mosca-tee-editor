import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';

interface CanvasRulerProps {
  type: 'horizontal' | 'vertical';
  size: number;
  zoom: number;
  offset: number;
  onAddGuide: (pos: number) => void;
  canvas: fabric.Canvas | null;
  setGhostGuide: (guide: { type: 'horizontal' | 'vertical', position: number } | null) => void;
  unit: string;
}

export const CanvasRuler: React.FC<CanvasRulerProps> = ({
  type,
  size,
  zoom,
  offset,
  onAddGuide,
  canvas,
  setGhostGuide,
  unit
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const width = type === 'horizontal' ? size : 24;
    const height = type === 'horizontal' ? 24 : size;
    canvasEl.width = width * window.devicePixelRatio;
    canvasEl.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.fillStyle = '#191919';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (type === 'horizontal') ctx.moveTo(0, 23.5), ctx.lineTo(width, 23.5);
    else ctx.moveTo(23.5, 0), ctx.lineTo(23.5, height);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '8px Inter';
    ctx.textAlign = 'center';

    // Calculate steps based on unit
    const factor = unit === 'cm' ? 37.7952755906 : 
                   unit === 'mm' ? 3.77952755906 : 
                   unit === 'in' ? 96 : 
                   unit === 'pt' ? 1.33333333333 : 
                   unit === 'pc' ? 16 : 1;
    
    const subStep = (unit === 'px' ? 10 : 0.1) * factor;
    const mainStep = (unit === 'px' ? 50 : 1) * factor;
    const labelStep = (unit === 'px' ? 100 : 1) * factor;

    const start = Math.floor(-offset / (subStep * zoom)) * subStep;

    for (let i = start; i < start + (size / zoom) + subStep; i += subStep) {
      const pos = i * zoom + offset;
      const labelValue = Math.round(i / factor * 10) / 10;
      
      ctx.beginPath();
      if (type === 'horizontal') {
        if (Math.abs(i % labelStep) < 0.1) {
          ctx.fillText(labelValue.toString(), pos, 12);
          ctx.moveTo(pos, 8);
          ctx.lineTo(pos, 24);
        } else if (Math.abs(i % mainStep) < 0.1) {
          ctx.moveTo(pos, 14);
          ctx.lineTo(pos, 24);
        } else {
          ctx.moveTo(pos, 18);
          ctx.lineTo(pos, 24);
        }
      } else {
        if (Math.abs(i % labelStep) < 0.1) {
          ctx.save();
          ctx.translate(12, pos);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(labelValue.toString(), 0, 0);
          ctx.restore();
          ctx.moveTo(8, pos);
          ctx.lineTo(24, pos);
        } else if (Math.abs(i % mainStep) < 0.1) {
          ctx.moveTo(14, pos);
          ctx.lineTo(24, pos);
        } else {
          ctx.moveTo(18, pos);
          ctx.lineTo(24, pos);
        }
      }
      ctx.stroke();
    }
  }, [type, size, zoom, offset, unit]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: type === 'horizontal' ? '100%' : '24px', height: type === 'horizontal' ? '24px' : '100%' }}
      className="cursor-crosshair"
      onMouseDown={(e) => {
        if (!canvasRef.current || typeof canvasRef.current.getBoundingClientRect !== 'function') return;
        const rect = canvasRef.current.getBoundingClientRect();
        const handleMouseMove = (moveEvent: MouseEvent) => {
          const pos = type === 'horizontal' 
            ? (moveEvent.clientY - rect.top - (canvas?.viewportTransform![5]! + 24)) / (zoom || 1)
            : (moveEvent.clientX - rect.left - (canvas?.viewportTransform![4]! + 24)) / (zoom || 1);
          setGhostGuide({ type, position: pos });
        };
        
        const handleMouseUp = (upEvent: MouseEvent) => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          const pos = type === 'horizontal' 
            ? (upEvent.clientY - rect.top - (canvas?.viewportTransform![5]! + 24)) / (zoom || 1)
            : (upEvent.clientX - rect.left - (canvas?.viewportTransform![4]! + 24)) / (zoom || 1);
          onAddGuide(pos);
          setGhostGuide(null);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }}
    />
  );
};
