import { useState, useCallback, useRef } from 'react';
import { fabric } from 'fabric';

export interface Point {
  x: number;
  y: number;
  cp1x?: number;
  cp1y?: number;
  cp2x?: number;
  cp2y?: number;
}

export const usePenTool = (
  canvas: fabric.Canvas | null, 
  active: boolean, 
  onComplete?: (path: string) => void,
  options: { strokeColor?: string; strokeWidth?: number } = {}
) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const activePathRef = useRef<fabric.Path | null>(null);
  const tempPointsRef = useRef<fabric.Circle[]>([]);

  const strokeColor = options.strokeColor || '#3b82f6';
  const strokeWidth = options.strokeWidth || 3;

  const clearPenTool = useCallback(() => {
    setPoints([]);
    setIsClosed(false);
    setCurrentPoint(null);
    if (activePathRef.current && canvas) {
      canvas.remove(activePathRef.current);
      activePathRef.current = null;
    }
    tempPointsRef.current.forEach(p => canvas?.remove(p));
    tempPointsRef.current = [];
  }, [canvas]);

  const updatePath = useCallback((mousePos: Point | null = null) => {
    if (!canvas || points.length === 0) {
      if (activePathRef.current) {
        canvas.remove(activePathRef.current);
        activePathRef.current = null;
      }
      return;
    }

    if (activePathRef.current) {
      canvas.remove(activePathRef.current);
    }

    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const p = points[i];
        if (p.cp1x !== undefined && p.cp1y !== undefined) {
            pathData += ` C ${points[i-1].cp2x || points[i-1].x} ${points[i-1].cp2y || points[i-1].y} ${p.cp1x} ${p.cp1y} ${p.x} ${p.y}`;
        } else {
            pathData += ` L ${p.x} ${p.y}`;
        }
    }

    // Add "rubber band" line to current mouse position
    if (mousePos && points.length > 0) {
       pathData += ` L ${mousePos.x} ${mousePos.y}`;
    }

    if (isClosed) {
      pathData += ' Z';
    }

    const path = new fabric.Path(pathData, {
      fill: 'transparent',
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      strokeDashArray: [],
      selectable: false,
      evented: false
    });

    canvas.add(path);
    activePathRef.current = path;
    canvas.renderAll();
  }, [canvas, points, isClosed, strokeColor, strokeWidth]);

  const addPoint = useCallback((x: number, y: number) => {
    if (!active || !canvas) return;

    // Check if clicking near the first point to close
    if (points.length >= 2) {
      const first = points[0];
      const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2));
      if (dist < 10) {
        setIsClosed(true);
        if (onComplete) {
          let pathData = `M ${points[0].x} ${points[0].y}`;
          for (let i = 1; i < points.length; i++) {
            pathData += ` L ${points[i].x} ${points[i].y}`;
          }
          pathData += ' Z';
          onComplete(pathData);
        }
        return;
      }
    }

    const newPoint: Point = { x, y };
    const updatedPoints = [...points, newPoint];
    setPoints(updatedPoints);

    const dot = new fabric.Circle({
      left: x,
      top: y,
      radius: 4,
      fill: strokeColor,
      stroke: 'white',
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false
    });
    canvas.add(dot);
    tempPointsRef.current.push(dot);

    // After adding a point, don't show the rubber band to the point we just clicked
    updatePath(null);
  }, [active, canvas, points, updatePath, onComplete, strokeColor]);

  const handleMouseMove = useCallback((x: number, y: number) => {
      if (!active || !canvas || points.length === 0) return;
      updatePath({ x, y });
  }, [active, canvas, points.length, updatePath]);

  const finishPath = useCallback(() => {
    if (points.length < 2) {
      clearPenTool();
      return;
    }
    
    if (onComplete) {
      let pathData = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathData += ` L ${points[i].x} ${points[i].y}`;
      }
      if (isClosed) pathData += ' Z';
      onComplete(pathData);
    }
    clearPenTool();
  }, [points, isClosed, onComplete, clearPenTool]);

  return {
    points,
    isClosed,
    addPoint,
    handleMouseMove,
    finishPath,
    clearPenTool
  };
};
