import { fabric } from 'fabric';

/**
 * Unified pipeline for applying filters to a Fabric.js Image object.
 * Handles caching and coordinate updates to prevent clipping on scaled images.
 */

interface FilterState {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  pixelate?: number;
  gamma?: number;
  sharpness?: number;
  preset?: string;
}

/**
 * Applies filters for real-time preview.
 * Disables caching to ensure visual accuracy and prevent clipping during interaction.
 */
export const applyImageFiltersPreview = (
  image: fabric.Image,
  filters: FilterState,
  canvas: fabric.Canvas
) => {
  if (!image || image.type !== 'image') return;

  // 1. Maintain objectCaching for performance, set dirty to invalidate cache
  image.set({
    objectCaching: true,
    dirty: true
  });

  // 3. Build filter array
  const fabricFilters: any[] = [];

  if (filters.brightness !== undefined && filters.brightness !== 0) {
    fabricFilters.push(new fabric.Image.filters.Brightness({ brightness: filters.brightness / 100 }));
  }
  if (filters.contrast !== undefined && filters.contrast !== 0) {
    fabricFilters.push(new fabric.Image.filters.Contrast({ contrast: filters.contrast / 100 }));
  }
  if (filters.saturation !== undefined && filters.saturation !== 0) {
    fabricFilters.push(new fabric.Image.filters.Saturation({ saturation: filters.saturation / 100 }));
  }
  if (filters.hue !== undefined && filters.hue !== 0) {
    fabricFilters.push(new fabric.Image.filters.HueRotation({ rotation: filters.hue / 100 }));
  }
  if (filters.blur !== undefined && filters.blur !== 0) {
    fabricFilters.push(new fabric.Image.filters.Blur({ blur: filters.blur / 100 }));
  }
  if (filters.pixelate !== undefined && filters.pixelate > 1) {
    fabricFilters.push(new fabric.Image.filters.Pixelate({ blocksize: filters.pixelate }));
  }
  if (filters.gamma !== undefined && filters.gamma !== 100) {
    const g = filters.gamma / 100;
    fabricFilters.push(new fabric.Image.filters.Gamma({ gamma: [g, g, g] }));
  }
  if (filters.sharpness !== undefined && filters.sharpness !== 0) {
    const s = filters.sharpness / 100;
    fabricFilters.push(new fabric.Image.filters.Convolute({
      matrix: [
        0, -s, 0,
        -s, 1 + 4 * s, -s,
        0, -s, 0
      ]
    }));
  }

  // Handle Presets
  if (filters.preset && filters.preset !== 'none') {
    switch (filters.preset) {
      case 'grayscale':
        fabricFilters.push(new fabric.Image.filters.Grayscale());
        break;
      case 'warm':
        fabricFilters.push(new fabric.Image.filters.ColorMatrix({
          matrix: [
            1.1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 0.9, 0, 0,
            0, 0, 0, 1, 0
          ]
        }));
        break;
      case 'cold':
        fabricFilters.push(new fabric.Image.filters.ColorMatrix({
          matrix: [
            0.9, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1.1, 0, 0,
            0, 0, 0, 1, 0
          ]
        }));
        break;
      case 'pop':
        fabricFilters.push(new fabric.Image.filters.Contrast({ contrast: 0.2 }));
        fabricFilters.push(new fabric.Image.filters.Saturation({ saturation: 0.3 }));
        break;
      case 'sharpness':
        fabricFilters.push(new fabric.Image.filters.Convolute({
          matrix: [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
          ]
        }));
        break;
      case 'cinema':
        fabricFilters.push(new fabric.Image.filters.ColorMatrix({
          matrix: [
            0.9, 0.1, 0.1, 0, 0,
            0.1, 1, 0.1, 0, 0,
            0, 0.1, 1, 0, 0,
            0, 0, 0, 1, 0
          ]
        }));
        break;
    }
  }

  // 4. Apply filters
  image.filters = fabricFilters;
  
  // 5. Force coordinate update and filter application
  image.setCoords();
  image.applyFilters();
  
  // 6. Render
  canvas.requestRenderAll();
};

/**
 * Finalizes filter application.
 * Re-enables caching for performance and ensures the final state is clean.
 */
export const commitImageFilters = (
  image: fabric.Image,
  canvas: fabric.Canvas
) => {
  if (!image || image.type !== 'image') return;

  // 1. Re-enable caching for better performance after adjustment
  image.set({
    objectCaching: true,
    dirty: true
  });

  // 2. Final coordinate update
  image.setCoords();
  
  // 3. Final render
  canvas.requestRenderAll();
};
