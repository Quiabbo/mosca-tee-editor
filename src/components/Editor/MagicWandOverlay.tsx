import React, { useMemo } from 'react';
import { maskToPath, type SelectionResult } from '../../utils/magicWand';

interface MagicWandOverlayProps {
  selection: SelectionResult;
  canvasRect: DOMRect | null;
  zoom: number;
  vpTransform: number[];
}

export function MagicWandOverlay({ selection, canvasRect, zoom, vpTransform }: MagicWandOverlayProps) {
  const pathData = useMemo(() => {
    if (!selection) return '';
    return maskToPath(selection, zoom, vpTransform[4], vpTransform[5]);
  }, [selection, zoom, vpTransform]);

  if (!pathData || !canvasRect) return null;

  return (
    <svg
      className="absolute pointer-events-none z-[25] overflow-hidden"
      style={{
        left: 0,
        top: 0,
        width: canvasRect.width,
        height: canvasRect.height,
      }}
    >
      {/* Black layer */}
      <path
        d={pathData}
        fill="none"
        stroke="#000000"
        strokeWidth={1.5}
        strokeDasharray="5 5"
        strokeLinecap="butt"
      />
      {/* White layer, animated */}
      <path
        d={pathData}
        fill="none"
        stroke="#ffffff"
        strokeWidth={1}
        strokeDasharray="5 5"
        strokeLinecap="butt"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="10"
          to="0"
          dur="0.4s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
