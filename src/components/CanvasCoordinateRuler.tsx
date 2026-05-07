import React from 'react';

interface CanvasCoordinateRulerProps {
  // Real dimensions of the document (in document-px)
  canvasWidth: number;
  canvasHeight: number;

  // Position of the top-left corner of the canvas in the workspace viewport (in px)
  canvasOffsetX: number;
  canvasOffsetY: number;

  // Current zoom as a fraction (1.0 = 100%)
  zoom: number;

  // Size of each grid cell in document-px
  cellSize?: number;

  // Current mouse coordinates relative to the canvas (optional for highlighting)
  mouseDocX?: number;
  mouseDocY?: number;
}

// Excel-style column label generator: A, B, ..., Z, AA, AB, ...
function generateColumnLabels(count: number): string[] {
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    let label = '';
    let n = i;
    do {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    labels.push(label);
  }
  return labels;
}

export const CanvasCoordinateRuler: React.FC<CanvasCoordinateRulerProps> = ({
  canvasWidth,
  canvasHeight,
  canvasOffsetX,
  canvasOffsetY,
  zoom,
  cellSize: propsCellSize = 50,
  mouseDocX,
  mouseDocY
}) => {
  const cellSize = propsCellSize;
  const cellW = cellSize * zoom;   // visual size on screen
  const cellH = cellSize * zoom;

  // Minimum visibility threshold
  const visible = cellW >= 8;
  if (!visible) return null;

  const totalColumns = Math.ceil(canvasWidth / cellSize);
  const totalRows    = Math.ceil(canvasHeight / cellSize);

  const columns = generateColumnLabels(totalColumns);
  const rows    = Array.from({ length: totalRows }, (_, i) => i + 1);

  // Adaptive font size based on attachment's formula: Math.max(8, Math.min(11, cellPx * 0.22))
  const fontSize = Math.max(8, Math.min(11, cellW * 0.22));

  // Virtualization constants
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // Indices for visible rows/columns
  const firstColIdx = Math.max(0, Math.floor(-canvasOffsetX / cellW));
  const lastColIdx  = Math.min(totalColumns - 1, Math.ceil((viewportW - canvasOffsetX) / cellW));

  const firstRowIdx = Math.max(0, Math.floor(-canvasOffsetY / cellH));
  const lastRowIdx  = Math.min(totalRows - 1, Math.ceil((viewportH - canvasOffsetY) / cellH));

  const visibleColumns = columns.map((col, idx) => ({ label: col, idx })).slice(firstColIdx, lastColIdx + 1);
  const visibleRows    = rows.map((row, idx) => ({ label: row, idx })).slice(firstRowIdx, lastRowIdx + 1);

  const hoverColIdx = mouseDocX !== undefined ? Math.floor(mouseDocX / cellSize) : -1;
  const hoverRowIdx = mouseDocY !== undefined ? Math.floor(mouseDocY / cellSize) : -1;

  const RULER_W = 30;
  const RULER_H = 22;

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Courier New', monospace",
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 1,
    flexShrink: 0,
    transition: 'color 0.15s, font-weight 0.15s',
  };

  const highlightStyle: React.CSSProperties = {
    color: '#0057FF',
    fontWeight: 700,
  };

  return (
    <>
      {/* Numbers - Left Ruler */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: canvasOffsetX - RULER_W,
          top: canvasOffsetY + firstRowIdx * cellH,
          width: RULER_W,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {visibleRows.map(({ label, idx }) => (
          <div
            key={idx}
            style={{
              ...labelStyle,
              height: cellH,
              width: RULER_W,
              fontSize,
              paddingRight: '4px',
              justifyContent: 'flex-end',
              ...(idx === hoverRowIdx ? highlightStyle : {}),
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Letters - Bottom Ruler */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: canvasOffsetX + firstColIdx * cellW,
          top: canvasOffsetY + canvasHeight * zoom + 4,
          height: RULER_H,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {visibleColumns.map(({ label, idx }) => (
          <div
            key={idx}
            style={{
              ...labelStyle,
              width: cellW,
              height: RULER_H,
              fontSize,
              ...(idx === hoverColIdx ? highlightStyle : {}),
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </>
  );
};

export default CanvasCoordinateRuler;
