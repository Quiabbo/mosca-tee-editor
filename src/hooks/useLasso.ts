import { useState, useCallback, useRef } from 'react';
import { fabric } from 'fabric';

export const useLasso = (canvas: fabric.Canvas | null, active: boolean, onComplete?: (path: string) => void) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const pointsRef = useRef<{x: number, y: number}[]>([]);
  const activePathRef = useRef<fabric.Polyline | null>(null);

  const startDrawing = useCallback((x: number, y: number) => {
    if (!active || !canvas) return;
    setIsDrawing(true);
    pointsRef.current = [{x, y}];
  }, [active, canvas]);

  const draw = useCallback((x: number, y: number) => {
    if (!isDrawing || !canvas) return;
    
    pointsRef.current.push({x, y});
    
    if (activePathRef.current) {
      canvas.remove(activePathRef.current);
    }

    const polyline = new fabric.Polyline(pointsRef.current, {
      fill: 'transparent',
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false
    });

    canvas.add(polyline);
    activePathRef.current = polyline;
    canvas.renderAll();
  }, [isDrawing, canvas]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !canvas) return;
    setIsDrawing(false);

    if (pointsRef.current.length > 2) {
      const pathData = `M ${pointsRef.current.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
      if (onComplete) onComplete(pathData);
    }

    if (activePathRef.current) {
      canvas.remove(activePathRef.current);
      activePathRef.current = null;
    }
    pointsRef.current = [];
  }, [isDrawing, canvas, onComplete]);

  return {
    startDrawing,
    draw,
    stopDrawing,
    isDrawing
  };
};
