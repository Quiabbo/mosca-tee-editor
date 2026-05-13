import React from 'react';
import { fabric } from 'fabric';

interface ArtboardSelectionOverlayProps {
  canvas: fabric.Canvas | null;
  artboardSize: { width: number; height: number };
  carouselPages: number;
}

export function ArtboardSelectionOverlay({
  canvas,
  artboardSize,
  carouselPages,
}: ArtboardSelectionOverlayProps) {
  if (!canvas) return null;

  const zoom = canvas.getZoom();
  const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

  const artboards = [];
  for (let i = 0; i < carouselPages; i++) {
    artboards.push({
      left: (i * (artboardSize.width + 12)) * zoom + vpt[4],
      top: vpt[5],
      width: artboardSize.width * zoom,
      height: artboardSize.height * zoom,
    });
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1000 }}>
      {artboards.map((art, idx) => (
        <div
          key={idx}
          className="absolute pointer-events-none"
          style={{
            left: art.left,
            top: art.top,
            width: art.width,
            height: art.height,
          }}
        />
      ))}
    </div>
  );
}
