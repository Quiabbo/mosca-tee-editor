import { fabric } from 'fabric';
import { readPsd, writePsd, Psd, Layer } from 'ag-psd';
import { fabricToAgPsd, agPsdToFabric } from './blendModeMapping';

/**
 * Service to handle PSD import and export for Mosca Tee.
 */
export const psdService = {
  /**
   * Exports the current Fabric canvas to a PSD file buffer.
   */
  async exportToPsd(canvas: fabric.Canvas): Promise<ArrayBuffer> {
    const psd: Psd = {
      width: canvas.width || 800,
      height: canvas.height || 600,
      children: [],
    };

    const objects = canvas.getObjects();
    const folderMap = new Map<string, Layer>();

    // First, identify and create representations for all folders
    objects.forEach(obj => {
      const o = obj as any;
      if (o.type === 'folder' || o.isFolder) {
        const layer: Layer = {
          name: o.name || 'Folder',
          children: [],
          hidden: o.visible === false,
          opacity: o.opacity !== undefined ? o.opacity : 1,
        };
        folderMap.set(o.id, layer);
      }
    });

    // Process all non-folder objects
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const o = obj as any;
      
      if (o.id?.toString().startsWith('artboard_bg')) continue;
      if (o.type === 'folder' || o.isFolder) continue;

      const layer = await this.fabricObjectToPsdLayer(obj);
      if (layer) {
        if (o.parentId && folderMap.has(o.parentId)) {
          folderMap.get(o.parentId)!.children!.push(layer);
        } else {
          psd.children!.push(layer);
        }
      }
    }

    // Now organize folders into their respective parents or root
    objects.forEach(obj => {
      const o = obj as any;
      if (o.type === 'folder' || o.isFolder) {
        const layer = folderMap.get(o.id)!;
        if (o.parentId && folderMap.has(o.parentId)) {
          folderMap.get(o.parentId)!.children!.push(layer);
        } else {
          psd.children!.push(layer);
        }
      }
    });

    return writePsd(psd);
  },

  /**
   * Reads a PSD buffer and returns its dimensions.
   */
  getPsdDimensions(buffer: ArrayBuffer): { width: number; height: number } {
    const psd = readPsd(buffer, { skipLayerImageData: true, skipThumbnail: true });
    return {
      width: psd.width || 800,
      height: psd.height || 600
    };
  },

  /**
   * Converts a Fabric object to an ag-psd Layer.
   */
  async fabricObjectToPsdLayer(obj: fabric.Object): Promise<Layer | null> {
    const layer: Layer = {
      name: obj.name || obj.type || 'Layer',
      opacity: obj.opacity !== undefined ? obj.opacity : 1,
      hidden: obj.visible === false,
      blendMode: fabricToAgPsd(obj.globalCompositeOperation || 'source-over') as any,
      left: obj.left,
      top: obj.top,
    };

    // Handle different object types
    if (obj.type === 'image') {
      const img = obj as fabric.Image;
      const canvas = document.createElement('canvas');
      canvas.width = img.getScaledWidth();
      canvas.height = img.getScaledHeight();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const tempImg = new Image();
        tempImg.src = img.toDataURL();
        await new Promise((resolve) => {
          tempImg.onload = resolve;
        });
        ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
        layer.canvas = canvas;
      }
    } else if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
      const textObj = obj as fabric.IText;
      const angleRad = (textObj.angle || 0) * (Math.PI / 180);
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      
      // Construct transform matrix [xx, xy, yx, yy, tx, ty]
      // tx and ty are usually handled by ag-psd via left/top if transform is not fully specified,
      // but providing the full matrix is more robust.
      const transform = [
        (textObj.scaleX || 1) * cos,
        (textObj.scaleX || 1) * sin,
        -(textObj.scaleY || 1) * sin,
        (textObj.scaleY || 1) * cos,
        textObj.left || 0,
        textObj.top || 0
      ];

      layer.text = {
        text: textObj.text || '',
        transform: transform as any,
        style: {
          fontSize: textObj.fontSize,
          fillColor: this.parseColor(textObj.fill as string),
          font: { name: textObj.fontFamily || 'Arial' },
          leading: (textObj.lineHeight || 1.2) * (textObj.fontSize || 20),
          tracking: textObj.charSpacing || 0,
          underline: textObj.underline,
          strikethrough: textObj.linethrough,
        },
        paragraphStyle: {
          justification: textObj.textAlign as any || 'left'
        }
      };
      // For better compatibility, we also provide a rasterized version
      layer.canvas = obj.toCanvasElement();
    } else if (obj.type === 'rect' || obj.type === 'circle') {
      (layer as any).solidColor = this.parseColor(obj.fill as string);
      // For shapes, we also provide a rasterized version
      layer.canvas = obj.toCanvasElement();
    } else {
      // For other objects, we rasterize
      layer.canvas = obj.toCanvasElement();
    }

    return layer;
  },

  /**
   * Helper to parse CSS color strings to ag-psd Color object.
   */
  parseColor(colorStr: any): any {
    if (!colorStr || colorStr === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    
    // If it's a Fabric Gradient or Pattern object
    if (typeof colorStr !== 'string') {
      if (colorStr && typeof colorStr === 'object') {
        // Try to get first color from colorStops if it's a gradient
        if (colorStr.colorStops && Array.isArray(colorStr.colorStops) && colorStr.colorStops.length > 0) {
          return this.parseColor(colorStr.colorStops[0].color);
        }
      }
      return { r: 0, g: 0, b: 0, a: 1 };
    }
    
    // Simple hex parser
    if (colorStr.startsWith('#')) {
      const hex = colorStr.substring(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b, a: 1 };
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return { r, g, b, a: 1 };
    }
    
    // Simple rgba parser
    if (colorStr.startsWith('rgb')) {
      const values = colorStr.match(/[\d.]+/g);
      if (values && values.length >= 3) {
        return {
          r: Math.round(parseFloat(values[0])),
          g: Math.round(parseFloat(values[1])),
          b: Math.round(parseFloat(values[2])),
          a: values.length === 4 ? parseFloat(values[3]) : 1
        };
      }
    }
    
    return { r: 0, g: 0, b: 0, a: 1 };
  },

  /**
   * Helper to parse ag-psd Color object to CSS color string.
   */
  parsePsdColor(c: any): string {
    if (!c) return '#000000';
    if (c.r !== undefined) {
      return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${c.a !== undefined ? c.a : 1})`;
    }
    return '#000000';
  },

  /**
   * Imports a PSD file buffer into the Fabric canvas.
   * Returns the PSD dimensions so the UI can update its state.
   */
  async importFromPsd(buffer: ArrayBuffer, canvas: fabric.Canvas): Promise<{ width: number; height: number }> {
    const psd = readPsd(buffer);
    
    if (!psd) throw new Error('Failed to read PSD file');

    const width = psd.width || 800;
    const height = psd.height || 600;

    // Clear current objects (except artboard if needed)
    // Clear selection first to avoid ghostly objects if we remove them
    canvas.discardActiveObject();

    const objects = canvas.getObjects();
    const toRemove = objects.filter(obj => !(obj as any).id?.toString().startsWith('artboard_bg'));
    if (toRemove.length > 0) {
      canvas.remove(...toRemove);
    }
    
    objects.forEach(obj => {
      if ((obj as any).id?.toString().startsWith('artboard_bg')) {
        // Resize artboard background to match PSD
        obj.set({
          width: width,
          height: height,
          scaleX: 1,
          scaleY: 1,
          left: 0,
          top: 0
        });
        obj.setCoords();
      }
    });

    // ag-psd children are bottom-to-top. 
    // Fabric also stores bottom-to-top.
    const children = psd.children || [];
    for (let i = 0; i < children.length; i++) {
      const layer = children[i];
      const fabricObjects = await this.psdLayerHierarchyToFabricObjects(layer, canvas);
      if (fabricObjects && fabricObjects.length > 0) {
        canvas.add(...fabricObjects);
      }
    }

    canvas.renderAll();
    return { width, height };
  },

  /**
   * Converts a PSD layer hierarchy (including folders) into a flat array of Fabric objects
   * marked with parentId for organizational structure.
   */
  async psdLayerHierarchyToFabricObjects(layer: Layer, canvas: fabric.Canvas, parentId?: string, inheritedVisible = true): Promise<fabric.Object[] | null> {
    const isVisible = inheritedVisible && !layer.hidden;

    if (layer.children) {
      // It's a folder/group in PSD
      const folderId = `folder-${Math.random().toString(36).substr(2, 9)}`;
      // @ts-ignore
      const folderMarker = new fabric.Folder({
        id: folderId,
        parentId: parentId,
        name: layer.name,
        isUiVisible: !layer.hidden
      });

      const allObjects: fabric.Object[] = [folderMarker];

      // PSD children are bottom-to-top, same as Fabric
      for (let i = 0; i < layer.children.length; i++) {
        const result = await this.psdLayerHierarchyToFabricObjects(layer.children[i], canvas, folderId, isVisible);
        if (result) {
          allObjects.push(...result);
        }
      }
      return allObjects;
    }

    // Individual layer
    const fabricObj = await this.psdSingleLayerToFabricObject(layer, canvas);
    if (fabricObj) {
      // @ts-ignore
      fabricObj.parentId = parentId;
      // If parent folder is hidden, this child must be hidden too
      if (!isVisible) {
        fabricObj.set('visible', false);
      }
      return [fabricObj];
    }
    return null;
  },

  /**
   * Converts a single ag-psd Layer to a Fabric object.
   */
  async psdSingleLayerToFabricObject(layer: Layer, canvas: fabric.Canvas): Promise<fabric.Object | null> {
    let fabricObj: fabric.Object | null = null;
    const name = layer.name?.toLowerCase() || '';

    // Prioritize text for editability
    if (layer.text) {
      const style = layer.text.style;
      const transform = (layer.text as any).transform;
      let fill = '#000000';
      
      if (style?.fillColor) {
        fill = this.parsePsdColor(style.fillColor);
      }

      let fontSize = style?.fontSize || 20;
      let scaleX = 1;
      let scaleY = 1;
      let angle = 0;
      let lineHeight = 1.2; // Default Fabric line height
      let charSpacing = 0;

      if (transform && Array.isArray(transform) && transform.length >= 4) {
        scaleX = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
        scaleY = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]);
        angle = Math.atan2(transform[1], transform[0]) * (180 / Math.PI);
      }

      if (style?.leading !== undefined && fontSize > 0 && style.leading > 0) {
        lineHeight = style.leading / fontSize;
      } else if ((layer.text as any).paragraphStyle?.leading !== undefined && fontSize > 0 && (layer.text as any).paragraphStyle.leading > 0) {
        lineHeight = (layer.text as any).paragraphStyle.leading / fontSize;
      } else if ((layer.text as any).styleRuns?.[0]?.style?.leading !== undefined && fontSize > 0 && (layer.text as any).styleRuns[0].style.leading > 0) {
        lineHeight = (layer.text as any).styleRuns[0].style.leading / fontSize;
      }
      
      // Ensure lineHeight is never 0 or negative
      if (lineHeight <= 0) lineHeight = 1.2;

      if (style?.tracking !== undefined) {
        charSpacing = style.tracking;
      }

      fabricObj = new fabric.IText(layer.text.text, {
        fontSize: fontSize,
        fontFamily: style?.font?.name || 'Arial',
        fill: fill,
        textAlign: layer.text.paragraphStyle?.justification || 'left',
        left: layer.left,
        top: layer.top,
        scaleX: scaleX,
        scaleY: scaleY,
        angle: angle,
        lineHeight: lineHeight,
        charSpacing: charSpacing,
        underline: style?.underline || false,
        linethrough: style?.strikethrough || false,
      });
    } else if ((layer as any).solidColor || (layer.vectorMask && layer.canvas)) {
      // It's likely a shape layer
      const width = (layer.right ?? 0) - (layer.left ?? 0);
      const height = (layer.bottom ?? 0) - (layer.top ?? 0);
      
      let fill = '#cccccc';
      if ((layer as any).solidColor) {
        fill = this.parsePsdColor((layer as any).solidColor);
      } else if (layer.canvas) {
        // Try to sample color from canvas center if solidColor is missing
        const ctx = layer.canvas.getContext('2d');
        if (ctx) {
          const pixel = ctx.getImageData(Math.floor(width / 2), Math.floor(height / 2), 1, 1).data;
          if (pixel[3] > 0) {
            fill = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
          }
        }
      }

      const isEllipse = name.includes('elipse') || name.includes('círculo') || name.includes('circle') || name.includes('ellipse');
      
      if (isEllipse) {
        fabricObj = new fabric.Circle({
          radius: Math.min(width, height) / 2,
          fill: fill,
          left: layer.left,
          top: layer.top,
          width: width,
          height: height,
        });
      } else {
        fabricObj = new fabric.Rect({
          width: width,
          height: height,
          fill: fill,
          left: layer.left,
          top: layer.top,
          rx: 0,
          ry: 0,
        });
      }

      // Apply stroke if present in effects
      if (layer.effects?.stroke && layer.effects.stroke.length > 0) {
        const stroke = layer.effects.stroke[0];
        if (stroke.enabled !== false) {
          fabricObj.set({
            stroke: this.parsePsdColor(stroke.color),
            strokeWidth: stroke.size || 0,
          });
        }
      }
    } else if (layer.canvas) {
      // Rasterized data
      let sourceCanvas = layer.canvas;
      const maskedCanvas = await this.applyLayerMask(layer);
      if (maskedCanvas) {
        sourceCanvas = maskedCanvas;
      }
      
      fabricObj = await new Promise<fabric.Image>((resolve) => {
        fabric.Image.fromURL(sourceCanvas.toDataURL(), (img) => {
          resolve(img);
        });
      });
    }

    if (fabricObj) {
      fabricObj.set({
        name: layer.name,
        opacity: layer.opacity !== undefined ? layer.opacity : 1,
        visible: !layer.hidden,
        left: layer.left,
        top: layer.top,
        globalCompositeOperation: agPsdToFabric(layer.blendMode || 'normal'),
      });

      fabricObj.setCoords();
    }
    
    return fabricObj;
  },

  /**
   * Applies a pixel mask to a layer's canvas if present.
   * Following the specific logic requested for PSD pixel masks.
   */
  async applyLayerMask(layer: any): Promise<HTMLCanvasElement | null> {
    const mask = layer.mask;
    if (!layer.canvas || !mask || (mask.flags !== undefined && (mask.flags & 2))) {
      return null;
    }

    // Step 1 & 2: Create offscreen canvas size of LAYER and draw image
    const layerCanvas = layer.canvas;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = layerCanvas.width;
    finalCanvas.height = layerCanvas.height;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return null;
    finalCtx.drawImage(layerCanvas, 0, 0);

    // Step 3: Create mask canvas size of MASK bounds
    const maskWidth = (mask.right ?? 0) - (mask.left ?? 0);
    const maskHeight = (mask.bottom ?? 0) - (mask.top ?? 0);
    
    if (maskWidth <= 0 || maskHeight <= 0 || !mask.canvas) return null;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = maskWidth;
    maskCanvas.height = maskHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return null;

    // Draw mask and convert to grayscale Alpha
    maskCtx.drawImage(mask.canvas, 0, 0);
    const maskData = maskCtx.getImageData(0, 0, maskWidth, maskHeight);
    const mData = maskData.data;

    const isInverted = !!(mask.flags !== undefined && (mask.flags & 1));

    for (let i = 0; i < mData.length; i += 4) {
      // Step 3 & 4: R=G=B=0, A=grayscale (inverted if needed)
      let val = mData[i]; // Grayscale value from R
      if (isInverted) val = 255 - val;
      
      mData[i] = 0;
      mData[i+1] = 0;
      mData[i+2] = 0;
      mData[i+3] = val;
    }
    maskCtx.putImageData(maskData, 0, 0);

    // Step 5: Position relative to layer
    const maskOffsetX = (mask.left ?? 0) - (layer.left ?? 0);
    const maskOffsetY = (mask.top ?? 0) - (layer.top ?? 0);

    // Part 4: Handle default color for areas outside mask bounds
    const defaultColor = mask.defaultColor !== undefined ? mask.defaultColor : 255;
    
    // Step 6: On layer canvas, set destination-in and draw mask
    const compositionCanvas = document.createElement('canvas');
    compositionCanvas.width = layerCanvas.width;
    compositionCanvas.height = layerCanvas.height;
    const compCtx = compositionCanvas.getContext('2d');
    if (compCtx) {
      const defaultAlpha = defaultColor / 255;
      compCtx.fillStyle = `rgba(0,0,0,${defaultAlpha})`;
      compCtx.fillRect(0, 0, compositionCanvas.width, compositionCanvas.height);
      
      // Draw mask with 'copy' to overwrite exactly in its rect
      compCtx.globalCompositeOperation = 'copy';
      compCtx.drawImage(maskCanvas, maskOffsetX, maskOffsetY);
      
      // Now use this composite mask to clip the layer
      finalCtx.globalCompositeOperation = 'destination-in';
      finalCtx.drawImage(compositionCanvas, 0, 0);
    }

    return finalCanvas;
  },
};
