import React from 'react';
import type { LassoPoint } from '../tools/PolygonalLassoTool';

interface LassoOverlayProps {
  points: LassoPoint[];
  mousePos: LassoPoint;
  selectionClosed: boolean;
  nearStartPoint: boolean;
  // Dimensões e posição do canvas na tela
  canvasRect: DOMRect | null;
  zoom: number;
  vpTransform: number[];
}

export function LassoOverlay({
  points,
  mousePos,
  selectionClosed,
  nearStartPoint,
  canvasRect,
  zoom,
  vpTransform,
}: LassoOverlayProps) {
  if (!canvasRect || points.length === 0) return null;

  // Converte ponto do canvas Fabric para coordenada do SVG overlay
  const toScreen = (p: LassoPoint) => ({
    x: p.x * zoom + vpTransform[4],
    y: p.y * zoom + vpTransform[5],
  });

  const screenPoints = points.map(toScreen);
  const screenMouse  = mousePos ? toScreen(mousePos) : { x: 0, y: 0 };
  const screenStart  = screenPoints[0];

  // Polyline dos pontos já definidos
  const pointsStr = screenPoints.map(p => `${p.x},${p.y}`).join(' ');

  const marchingAnts = (pts: string, isClosed: boolean) => {
    const Component = isClosed ? 'polygon' : 'polyline';
    return (
      <>
        {/* Traço inferior: 1.5px, preto */}
        <Component
          points={pts}
          fill="none"
          stroke="#000000"
          strokeWidth={1.5}
          strokeDasharray="5 5"
          strokeLinecap="butt"
        />
        {/* Traço superior: 1px, branco, animado */}
        <Component
          points={pts}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1}
          strokeDasharray="5 5"
          strokeLinecap="butt"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="10" to="0"
            dur="0.4s"
            repeatCount="indefinite"
          />
        </Component>
      </>
    );
  };

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0, top: 0,
        width: canvasRect.width,
        height: canvasRect.height,
        pointerEvents: 'none',
        zIndex: 20,
        overflow: 'visible',
      }}
    >
      {/* Contorno durante a criação ou fechado */}
      {points.length > 1 && marchingAnts(pointsStr, selectionClosed)}

      {/* Linha guia: último ponto → cursor */}
      {!selectionClosed && points.length > 0 && (
        <>
          <line
            x1={screenPoints[screenPoints.length - 1].x}
            y1={screenPoints[screenPoints.length - 1].y}
            x2={screenMouse.x}
            y2={screenMouse.y}
            stroke="#000000"
            strokeWidth={1.5}
            strokeOpacity={0.5}
          />
          <line
            x1={screenPoints[screenPoints.length - 1].x}
            y1={screenPoints[screenPoints.length - 1].y}
            x2={screenMouse.x}
            y2={screenMouse.y}
            stroke="#ffffff"
            strokeWidth={1}
            strokeOpacity={0.8}
          />
        </>
      )}

      {/* Círculo no ponto inicial (para indicar onde fechar) */}
      {!selectionClosed && screenStart && (
        <circle
          cx={screenStart.x}
          cy={screenStart.y}
          r={nearStartPoint ? 6 : 4}
          fill={nearStartPoint ? 'rgba(255,255,255,0.3)' : 'none'}
          stroke="white"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}
