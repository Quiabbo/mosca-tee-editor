import React from 'react';

interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MarqueeOverlayProps {
  rect: MarqueeRect | null;
  canvasRect: DOMRect | null;
  zoom: number;
  vpTransform: number[];
}

export function MarqueeOverlay({
  rect,
  canvasRect,
  zoom,
  vpTransform,
}: MarqueeOverlayProps) {
  if (!canvasRect || !rect || (rect.width === 0 && rect.height === 0)) return null;

  // Convert Fabric coordinates to Screen coordinates
  const toScreen = (x: number, y: number) => ({
    x: x * zoom + vpTransform[4],
    y: y * zoom + vpTransform[5],
  });

  const topLeft = toScreen(rect.x, rect.y);
  const bottomRight = toScreen(rect.x + rect.width, rect.y + rect.height);
  
  const screenX = Math.min(topLeft.x, bottomRight.x);
  const screenY = Math.min(topLeft.y, bottomRight.y);
  const screenWidth = Math.abs(bottomRight.x - topLeft.x);
  const screenHeight = Math.abs(bottomRight.y - topLeft.y);

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: canvasRect.width,
        height: canvasRect.height,
        pointerEvents: 'none',
        zIndex: 20,
        overflow: 'visible',
      }}
    >
      <g>
        {/* Background stroke (black) */}
        <rect
          x={screenX}
          y={screenY}
          width={screenWidth}
          height={screenHeight}
          fill="none"
          stroke="#000000"
          strokeWidth={1.5}
          strokeDasharray="5 5"
        />
        
        {/* Animated foreground stroke (white) */}
        <rect
          x={screenX}
          y={screenY}
          width={screenWidth}
          height={screenHeight}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1}
          strokeDasharray="5 5"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="10"
            to="0"
            dur="0.4s"
            repeatCount="indefinite"
          />
        </rect>
      </g>
    </svg>
  );
}
