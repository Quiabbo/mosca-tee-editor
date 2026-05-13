/**
 * Interface representing the canvas grid structure for accessibility.
 */
export interface CanvasGrid {
  columns: string[];
  rows: number[];
  cellWidth: number;
  cellHeight: number;
  totalColumns: number;
  totalRows: number;
}

/**
 * Generates column labels in Excel style (A, B, ..., Z, AA, AB, ...).
 * @param count Number of columns to generate labels for.
 * @returns Array of column labels.
 */
export function generateColumnLabels(count: number): string[] {
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    let label = '';
    let num = i;
    while (num >= 0) {
      label = String.fromCharCode((num % 26) + 65) + label;
      num = Math.floor(num / 26) - 1;
    }
    labels.push(label);
  }
  return labels;
}

/**
 * Calculates the grid parameters for a given canvas size and cell size.
 * @param canvasWidth Width of the canvas in pixels.
 * @param canvasHeight Height of the canvas in pixels.
 * @param cellSize Size of each grid cell in pixels (default: 50).
 * @returns CanvasGrid object.
 */
export function calculateCanvasGrid(
  canvasWidth: number,
  canvasHeight: number,
  cellSize: number = 50
): CanvasGrid {
  const totalColumns = Math.ceil(canvasWidth / cellSize);
  const totalRows = Math.ceil(canvasHeight / cellSize);

  return {
    columns: generateColumnLabels(totalColumns),
    rows: Array.from({ length: totalRows }, (_, i) => i + 1),
    cellWidth: cellSize,
    cellHeight: cellSize,
    totalColumns,
    totalRows,
  };
}

/**
 * Converts pixel coordinates to a chess-style coordinate string (e.g., "C-2").
 * @param x X coordinate in pixels.
 * @param y Y coordinate in pixels.
 * @param grid CanvasGrid configuration.
 * @returns Coordinate string like "A-1", "B-5", etc.
 */
export function pixelToChessCoord(x: number, y: number, grid: CanvasGrid): string {
  const colIndex = Math.floor(x / grid.cellWidth);
  const rowIndex = Math.floor(y / grid.cellHeight);

  const colLabel = grid.columns[colIndex] || grid.columns[grid.columns.length - 1];
  const rowLabel = grid.rows[rowIndex] || grid.rows[grid.rows.length - 1];

  return `${colLabel}-${rowLabel}`;
}

/**
 * Converts a chess-style coordinate string back to pixel coordinates (center of the cell).
 * @param coord Coordinate string like "C-2".
 * @param grid CanvasGrid configuration.
 * @returns Object with x and y pixels, or null if invalid.
 */
export function chessCoordToPixel(
  coord: string,
  grid: CanvasGrid
): { x: number; y: number } | null {
  const parts = coord.split('-');
  if (parts.length !== 2) return null;

  const colLabel = parts[0];
  const rowLabel = parseInt(parts[1], 10);

  const colIndex = grid.columns.indexOf(colLabel);
  const rowIndex = grid.rows.indexOf(rowLabel);

  if (colIndex === -1 || rowIndex === -1) return null;

  return {
    x: colIndex * grid.cellWidth + grid.cellWidth / 2,
    y: rowIndex * grid.cellHeight + grid.cellHeight / 2,
  };
}
