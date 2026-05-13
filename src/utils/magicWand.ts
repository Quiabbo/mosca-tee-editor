import { fabric } from 'fabric';

/**
 * Magic Wand tool implementation based on reference
 */

export interface LassoPoint {
  x: number;
  y: number;
}

export interface SelectionResult {
  mask: Uint8Array;
  w: number;
  h: number;
  targetObj: any;
  offX: number;
  offY: number;
}

export function getPixelColor(imageData: ImageData, x: number, y: number) {
  const index = (y * imageData.width + x) * 4;
  return [
    imageData.data[index],
    imageData.data[index + 1],
    imageData.data[index + 2],
    imageData.data[index + 3]
  ];
}

export function colorMatch(pixels: Uint8ClampedArray, pi: number, seed: number[], tol: number): boolean {
  const dR = pixels[pi] - seed[0];
  const dG = pixels[pi + 1] - seed[1];
  const dB = pixels[pi + 2] - seed[2];
  const dA = pixels[pi + 3] - seed[3];
  // Using Euclidean distance with a factor of 1.732 (sqrt(3)) to match user expectation/Photoshop feel
  return Math.sqrt(dR * dR + dG * dG + dB * dB + dA * dA) <= tol * 1.732;
}

export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  tolerance: number,
  contiguous: boolean
): Uint8Array {
  const width = imageData.width;
  const height = imageData.height;
  const pixels = imageData.data;
  const mask = new Uint8Array(width * height);
  const seedColor = getPixelColor(imageData, startX, startY);

  if (!contiguous) {
    for (let i = 0; i < width * height; i++) {
      if (colorMatch(pixels, i * 4, seedColor, tolerance)) {
        mask[i] = 1;
      }
    }
    return mask;
  }

  const visited = new Uint8Array(width * height);
  const queue = [startY * width + startX];
  visited[startY * width + startX] = 1;

  while (queue.length > 0) {
    const idx = queue.pop()!;
    const x = idx % width;
    const y = Math.floor(idx / width);
    const pi = idx * 4;

    if (!colorMatch(pixels, pi, seedColor, tolerance)) continue;

    mask[idx] = 1;

    // 4-connected neighbors
    const neighbors = [
      idx - 1,     // left
      idx + 1,     // right
      idx - width, // up
      idx + width, // down
    ];

    for (const n of neighbors) {
      if (n < 0 || n >= width * height) continue;
      const nx = n % width;
      const ny = Math.floor(n / width);
      // Prevent wrapping at row boundaries
      if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
      if (visited[n]) continue;
      visited[n] = 1;
      queue.push(n);
    }
  }

  return mask;
}

/**
 * Combine masks for add/subtract/intersect modes
 */
export function combineMasks(existing: SelectionResult | null, incoming: SelectionResult, mode: string): Uint8Array {
  if (!existing || mode === 'new') {
    return incoming.mask;
  }

  const length = Math.max(existing.mask.length, incoming.mask.length);
  const out = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    const a = existing.mask[i] || 0;
    const b = incoming.mask[i] || 0;

    if (mode === 'add') {
      out[i] = (a || b) ? 1 : 0;
    } else if (mode === 'sub') {
      out[i] = (a && !b) ? 1 : 0;
    } else if (mode === 'inter') {
      out[i] = (a && b) ? 1 : 0;
    } else {
      out[i] = b;
    }
  }

  return out;
}

/**
 * Converts a mask to a SVG path string for marching ants
 * Optimized: joins horizontal and vertical segments to prevent flickering on 1px lines
 */
export function maskToPath(sel: SelectionResult | null, zoom: number = 1, vpX: number = 0, vpY: number = 0): string {
  if (!sel) return '';
  const { mask, w, h, offX, offY } = sel;

  const toScreen = (px: number, py: number) => ({
    x: vpX + (offX + px) * zoom,
    y: vpY + (offY + py) * zoom,
  });

  let d = '';

  // Process horizontal segments (Top & Bottom edges)
  for (let y = 0; y <= h; y++) {
    let startTop = -1;
    let startBottom = -1;
    
    for (let x = 0; x <= w; x++) {
      // Top edge logic
      const isActive = y < h && x < w && mask[y * w + x] > 0;
      const isAboveActive = y > 0 && x < w && mask[(y - 1) * w + x] > 0;
      
      const isTopEdge = isActive && !isAboveActive;
      const isBottomEdge = !isActive && isAboveActive;

      // Handle Top Edge joining
      if (isTopEdge) {
        if (startTop === -1) startTop = x;
      } else {
        if (startTop !== -1) {
          const a = toScreen(startTop, y), b = toScreen(x, y);
          d += `M${a.x},${a.y} L${b.x},${b.y} `;
          startTop = -1;
        }
      }

      // Handle Bottom Edge joining
      if (isBottomEdge) {
        if (startBottom === -1) startBottom = x;
      } else {
        if (startBottom !== -1) {
          const a = toScreen(startBottom, y), b = toScreen(x, y);
          d += `M${a.x},${a.y} L${b.x},${b.y} `;
          startBottom = -1;
        }
      }
    }
  }

  // Process vertical segments (Left & Right edges)
  for (let x = 0; x <= w; x++) {
    let startLeft = -1;
    let startRight = -1;
    
    for (let y = 0; y <= h; y++) {
      const isActive = x < w && y < h && mask[y * w + x] > 0;
      const isLeftActive = x > 0 && y < h && mask[y * w + (x - 1)] > 0;
      
      const isLeftEdge = isActive && !isLeftActive;
      const isRightEdge = !isActive && isLeftActive;

      // Handle Left Edge joining
      if (isLeftEdge) {
        if (startLeft === -1) startLeft = y;
      } else {
        if (startLeft !== -1) {
          const a = toScreen(x, startLeft), b = toScreen(x, y);
          d += `M${a.x},${a.y} L${b.x},${b.y} `;
          startLeft = -1;
        }
      }

      // Handle Right Edge joining
      if (isRightEdge) {
        if (startRight === -1) startRight = y;
      } else {
        if (startRight !== -1) {
          const a = toScreen(x, startRight), b = toScreen(x, y);
          d += `M${a.x},${a.y} L${b.x},${b.y} `;
          startRight = -1;
        }
      }
    }
  }

  return d;
}

/**
 * Extracts a region from an image based on a path string in image coordinates
 */
export async function extractFromImage(image: any, sel: SelectionResult): Promise<string | null> {
  const { mask, w, h, targetObj, offX, offY } = sel;
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return null;

  // Render the object exactly as it is seen on the canvas
  // Disable caching temporarily to avoid using possibly stale or invalid _cacheContext
  const originalCaching = targetObj.objectCaching;
  targetObj.set('objectCaching', false);
  
  ctx.save();
  ctx.translate(-offX, -offY);
  targetObj.render(ctx);
  ctx.restore();
  
  targetObj.set('objectCaching', originalCaching);
  
  const imgData = ctx.getImageData(0, 0, w, h);
  const pixels = imgData.data;

  // Keep only selected pixels (zero alpha for others)
  for (let i = 0; i < w * h; i++) {
    if (!mask[i]) pixels[i * 4 + 3] = 0;
  }
  ctx.putImageData(imgData, 0, 0);

  // Crop to selection bounds
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let hasPixels = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        hasPixels = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixels) return null;

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return null;
  
  cropCtx.drawImage(tempCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  
  return cropCanvas.toDataURL('image/png');
}

/**
 * Erases a region from an image based on selection result
 */
export async function eraseFromImage(image: any, sel: SelectionResult): Promise<string | null> {
  const { mask, w, h, targetObj, offX, offY } = sel;
  
  // Create a canvas that covers the entire bounding box of the object
  const br = targetObj.getBoundingRect(true, true);
  const bx = Math.floor(br.left);
  const by = Math.floor(br.top);
  const bw = Math.ceil(br.width);
  const bh = Math.ceil(br.height);

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = bw;
  tempCanvas.height = bh;
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return null;

  // Render the object as it is
  // Disable caching temporarily to avoid using possibly stale or invalid _cacheContext
  const originalCaching = targetObj.objectCaching;
  targetObj.set('objectCaching', false);

  ctx.save();
  ctx.translate(-bx, -by);
  targetObj.render(ctx);
  ctx.restore();

  targetObj.set('objectCaching', originalCaching);

  const imgData = ctx.getImageData(0, 0, bw, bh);
  const pixels = imgData.data;

  // Calculate local coordinates within the bounding box
  const localOffX = offX - bx;
  const localOffY = offY - by;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        const lx = x + localOffX;
        const ly = y + localOffY;
        if (lx >= 0 && lx < bw && ly >= 0 && ly < bh) {
          const pi = (ly * bw + lx) * 4;
          pixels[pi + 3] = 0; // Set alpha to 0
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  
  return tempCanvas.toDataURL('image/png');
}
