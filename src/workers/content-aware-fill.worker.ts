
// content-aware-fill.worker.ts

self.addEventListener('message', (e: MessageEvent) => {
  const { imageData, mask, options } = e.data;
  const { patchSize = 9, searchRadius = 50, iterations = 3 } = options || {};

  function reportProgress(percent: number, status: string) {
    self.postMessage({ type: 'progress', percent, status });
  }

  reportProgress(0, 'Analisando pixels vizinhos...');
  const orderedPixels = getOrderedFillPixels(mask, imageData.width, imageData.height);
  
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;

  reportProgress(10, 'Buscando padroes de textura...');
  
  // Create a working mask that we update as we fill
  const workingMask = mask.map((row: boolean[]) => [...row]);

  for (let i = 0; i < orderedPixels.length; i++) {
    const [tx, ty] = orderedPixels[i];
    
    // Find best patch
    const bestMatch = findBestPatch(
      [tx, ty],
      data,
      workingMask,
      width,
      height,
      patchSize,
      searchRadius
    );

    // Fill pixel
    const targetIdx = (ty * width + tx) * 4;
    const sourceIdx = (bestMatch[1] * width + bestMatch[0]) * 4;
    
    data[targetIdx] = data[sourceIdx];
    data[targetIdx + 1] = data[sourceIdx + 1];
    data[targetIdx + 2] = data[sourceIdx + 2];
    data[targetIdx + 3] = 255; // Mark as filled/opaque

    workingMask[ty][tx] = false; // Mark as known in working mask

    if (i % 100 === 0) {
      const progress = 10 + Math.floor((i / orderedPixels.length) * 70);
      reportProgress(progress, `Preenchendo pixels... (${i}/${orderedPixels.length})`);
    }
  }

  reportProgress(85, 'Suavizando bordas...');
  const resultData = smoothFillBoundary(data, width, height, mask, 2);

  reportProgress(100, 'Concluido!');
  self.postMessage({ 
    type: 'result', 
    imageData: {
      data: resultData,
      width,
      height
    }
  });
});

function getOrderedFillPixels(mask: boolean[][], width: number, height: number): [number, number][] {
  const ordered: [number, number][] = [];
  const visited = mask.map(row => row.map(() => false));
  const distance = mask.map(row => row.map(() => Infinity));
  const queue: [number, number][] = [];

  // BFS to find distance from boundary
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y][x]) {
        // Check if it's a boundary pixel (has a masked neighbor)
        let isBoundary = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width && mask[ny][nx]) {
              isBoundary = true;
              break;
            }
          }
          if (isBoundary) break;
        }
        if (isBoundary) {
          distance[y][x] = 0;
          queue.push([x, y]);
        }
      }
    }
  }

  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const d = distance[cy][cx];

    const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of neighbors) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (ny >= 0 && ny < height && nx >= 0 && nx < width && mask[ny][nx]) {
        if (distance[ny][nx] === Infinity) {
          distance[ny][nx] = d + 1;
          queue.push([nx, ny]);
          ordered.push([nx, ny]);
        }
      }
    }
  }

  return ordered;
}

function findBestPatch(
  target: [number, number],
  data: Uint8ClampedArray,
  mask: boolean[][],
  width: number,
  height: number,
  patchSize: number,
  searchRadius: number
): [number, number] {
  const [tx, ty] = target;
  const halfPatch = Math.floor(patchSize / 2);
  
  let bestX = tx;
  let bestY = ty;
  let minSSD = Infinity;

  const startX = Math.max(halfPatch, tx - searchRadius);
  const endX = Math.min(width - halfPatch - 1, tx + searchRadius);
  const startY = Math.max(halfPatch, ty - searchRadius);
  const endY = Math.min(height - halfPatch - 1, ty + searchRadius);

  for (let sy = startY; sy <= endY; sy++) {
    for (let sx = startX; sx <= endX; sx++) {
      // Candidate patch must be outside the original mask (or at least have some known pixels)
      // For simplicity, we look for patches where the center is NOT masked
      if (mask[sy][sx]) continue;

      let ssd = 0;
      let knownPixels = 0;

      for (let py = -halfPatch; py <= halfPatch; py++) {
        for (let px = -halfPatch; px <= halfPatch; px++) {
          const tpx = tx + px;
          const tpy = ty + py;
          const spx = sx + px;
          const spy = sy + py;

          if (tpx >= 0 && tpx < width && tpy >= 0 && tpy < height && !mask[tpy][tpx]) {
            const tIdx = (tpy * width + tpx) * 4;
            const sIdx = (spy * width + spx) * 4;

            const dr = data[tIdx] - data[sIdx];
            const dg = data[tIdx + 1] - data[sIdx + 1];
            const db = data[tIdx + 2] - data[sIdx + 2];

            ssd += dr * dr + dg * dg + db * db;
            knownPixels++;
          }
        }
      }

      if (knownPixels > 0) {
        ssd /= knownPixels;
        // Add small random noise to avoid repetitive patterns
        ssd += Math.random() * 0.5; 

        if (ssd < minSSD) {
          minSSD = ssd;
          bestX = sx;
          bestY = sy;
        }
      }
    }
  }

  return [bestX, bestY];
}

function smoothFillBoundary(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  originalMask: boolean[][],
  blendRadius: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (originalMask[y][x]) {
        // Check if near boundary
        let isNearBoundary = false;
        for (let dy = -blendRadius; dy <= blendRadius; dy++) {
          for (let dx = -blendRadius; dx <= blendRadius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width && !originalMask[ny][nx]) {
              isNearBoundary = true;
              break;
            }
          }
          if (isNearBoundary) break;
        }

        if (isNearBoundary) {
          let r = 0, g = 0, b = 0, count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                const idx = (ny * width + nx) * 4;
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                count++;
              }
            }
          }
          const idx = (y * width + x) * 4;
          result[idx] = r / count;
          result[idx + 1] = g / count;
          result[idx + 2] = b / count;
        }
      }
    }
  }
  
  return result;
}
