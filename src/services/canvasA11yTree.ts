import { fabric } from 'fabric';
import { CanvasGrid, pixelToChessCoord, calculateCanvasGrid } from '../utils/canvasCoordinates';
import { getColorName } from '../utils/colorName';
import { announce } from '../utils/a11yAnnouncer';
import { getObjectTypeName, translateFontName, translateAssetName } from '../lib/a11y-stubs';

// Internal state
let fabricCanvas: fabric.Canvas | null = null;
let currentGrid: CanvasGrid | null = null;
let lang: string = 'pt-br';
let enabled: boolean = false;
let moveThrottleTimeout: NodeJS.Timeout | null = null;

/**
 * Initializes the accessibility tree service for the canvas.
 */
export function initCanvasA11y(
  canvas: fabric.Canvas,
  width: number,
  height: number,
  language: string,
  blindModeActive: boolean
) {
  fabricCanvas = canvas;
  lang = language.toLowerCase();
  enabled = blindModeActive;
  currentGrid = calculateCanvasGrid(width, height);

  if (!enabled) return;

  // Register Fabric.js listeners
  canvas.on('object:added', onObjectAdded);
  canvas.on('object:removed', onObjectRemoved);
  canvas.on('object:modified', onObjectModified);
  canvas.on('object:moving', onObjectMoving);
  canvas.on('selection:created', onSelectionChanged);
  canvas.on('selection:updated', onSelectionChanged);
  canvas.on('selection:cleared', onSelectionCleared);

  rebuildTree();
}

/**
 * Rebuilds the ARIA tree in the DOM.
 */
export function rebuildTree() {
  if (!enabled || !fabricCanvas || !currentGrid) return;

  requestAnimationFrame(() => {
    const treeContainer = document.getElementById('canvas-accessibility-tree');
    if (!treeContainer) return;

    // Update container aria-label
    const gridInfo = lang === 'pt-br' 
      ? `Grade do canvas: ${currentGrid.totalColumns} colunas por ${currentGrid.totalRows} linhas.`
      : `Canvas grid: ${currentGrid.totalColumns} columns by ${currentGrid.totalRows} rows.`;
    
    treeContainer.setAttribute('aria-label', gridInfo);
    treeContainer.innerHTML = '';

    const objects = fabricCanvas.getObjects();
    objects.forEach((obj, index) => {
      const element = createARIAElement(obj, index + 1, objects.length);
      treeContainer.appendChild(element);
    });
  });
}

/**
 * Creates a single ARIA element for a canvas object.
 */
function createARIAElement(obj: fabric.Object, position: number, total: number): HTMLElement {
  const el = document.createElement('div');
  el.role = 'listitem';
  el.tabIndex = 0;
  // @ts-ignore - custom property
  const fabricId = obj.id || `obj-${Math.random().toString(36).substr(2, 9)}`;
  // @ts-ignore
  obj.id = fabricId;
  el.setAttribute('data-fabric-id', fabricId);
  el.className = 'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:bg-black focus:text-white focus:p-2 focus:z-[100]';

  const description = describeObject(obj, position, total);
  el.setAttribute('aria-label', description);

  el.addEventListener('focus', () => {
    if (fabricCanvas && fabricCanvas.getActiveObject() !== obj) {
      fabricCanvas.setActiveObject(obj);
      fabricCanvas.requestRenderAll();
    }
  });

  el.addEventListener('keydown', (e) => {
    if (!fabricCanvas) return;

    const step = e.shiftKey ? 10 : 1;
    let moved = false;

    switch (e.key) {
      case 'ArrowUp':
        obj.set('top', (obj.top || 0) - step);
        moved = true;
        break;
      case 'ArrowDown':
        obj.set('top', (obj.top || 0) + step);
        moved = true;
        break;
      case 'ArrowLeft':
        obj.set('left', (obj.left || 0) - step);
        moved = true;
        break;
      case 'ArrowRight':
        obj.set('left', (obj.left || 0) + step);
        moved = true;
        break;
      case 'Delete':
      case 'Backspace':
        fabricCanvas.remove(obj);
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
        const msg = lang === 'pt-br' ? 'Objeto removido' : 'Object removed';
        announce(msg, 'assertive');
        // Focus the container or next item
        document.getElementById('canvas-accessibility-tree')?.focus();
        break;
      case 'Enter':
        announce(description, 'assertive');
        break;
    }

    if (moved) {
      e.preventDefault();
      obj.setCoords();
      fabricCanvas.requestRenderAll();
      // @ts-ignore
      onObjectMoving({ target: obj });
      // Trigger modified for persistence
      fabricCanvas.fire('object:modified', { target: obj });
    }
  });

  return el;
}

/**
 * Generates a localized description of a canvas object.
 */
export function describeObject(obj: fabric.Object, position?: number, total?: number): string {
  if (!currentGrid) return '';

  const type = getObjectTypeName(obj.type || 'object', lang);
  const coord = pixelToChessCoord(obj.left || 0, obj.top || 0, currentGrid);
  const colorLang = lang.startsWith('pt') ? 'pt' : 'en';
  const color = obj.fill && typeof obj.fill === 'string' ? getColorName(obj.fill, colorLang) : '';
  
  let details = '';
  if (obj.type === 'i-text' || obj.type === 'textbox') {
    const textObj = obj as fabric.IText;
    const font = translateFontName(textObj.fontFamily || '');
    const content = textObj.text || '';
    details = lang === 'pt-br' 
      ? `, conteúdo: "${content}", fonte: ${font}, tamanho: ${Math.round(textObj.fontSize || 0)}`
      : `, content: "${content}", font: ${font}, size: ${Math.round(textObj.fontSize || 0)}`;
  } else if (obj.type === 'image') {
    const imgObj = obj as fabric.Image;
    // @ts-ignore - custom property
    const alt = obj.altText || translateAssetName(imgObj.getSrc() || '', lang);
    details = lang === 'pt-br' ? `, descrição: ${alt}` : `, description: ${alt}`;
  }

  const posInfo = position && total 
    ? (lang === 'pt-br' ? `${position} de ${total}: ` : `${position} of ${total}: `)
    : '';

  const colorInfo = color ? (lang === 'pt-br' ? ` de cor ${color}` : ` colored ${color}`) : '';

  return lang === 'pt-br'
    ? `${posInfo}${type}${colorInfo} na posição ${coord}${details}.`
    : `${posInfo}${type}${colorInfo} at position ${coord}${details}.`;
}

// Handlers
function onObjectAdded(e: fabric.IEvent) {
  rebuildTree();
  if (e.target) {
    const desc = describeObject(e.target);
    const msg = lang === 'pt-br' ? `Adicionado: ${desc}` : `Added: ${desc}`;
    announce(msg);
  }
}

function onObjectRemoved() {
  rebuildTree();
}

function onObjectModified(e: fabric.IEvent) {
  rebuildTree();
  if (e.target) {
    const desc = describeObject(e.target);
    const msg = lang === 'pt-br' ? `Modificado: ${desc}` : `Modified: ${desc}`;
    announce(msg);
  }
}

function onObjectMoving(e: fabric.IEvent) {
  if (!e.target || !currentGrid) return;
  
  if (moveThrottleTimeout) return;

  moveThrottleTimeout = setTimeout(() => {
    const coord = pixelToChessCoord(e.target!.left || 0, e.target!.top || 0, currentGrid!);
    const msg = lang === 'pt-br' ? `Posição ${coord}` : `Position ${coord}`;
    announce(msg);
    moveThrottleTimeout = null;
  }, 300);
}

function onSelectionChanged(e: fabric.IEvent) {
  if (!e.selected || e.selected.length === 0) return;
  
  const obj = e.selected[0];
  const desc = describeObject(obj);
  announce(desc);

  // Move focus to the corresponding element in the tree
  // @ts-ignore
  const fabricId = obj.id;
  if (fabricId) {
    const el = document.querySelector(`[data-fabric-id="${fabricId}"]`) as HTMLElement;
    if (el) el.focus();
  }
}

function onSelectionCleared() {
  const msg = lang === 'pt-br' 
    ? 'Seleção limpa. Use Tab para navegar pelos objetos do canvas.'
    : 'Selection cleared. Use Tab to navigate through canvas objects.';
  announce(msg);
}

/**
 * Provides an overview of the canvas content.
 */
export function announceCanvasOverview() {
  if (!fabricCanvas || !currentGrid) return;

  const objects = fabricCanvas.getObjects();
  if (objects.length === 0) {
    const msg = lang === 'pt-br'
      ? `Canvas vazio. Grade de ${currentGrid.totalColumns} por ${currentGrid.totalRows}. Use as ferramentas para adicionar elementos.`
      : `Empty canvas. Grid of ${currentGrid.totalColumns} by ${currentGrid.totalRows}. Use tools to add elements.`;
    announce(msg);
  } else {
    const intro = lang === 'pt-br'
      ? `O canvas contém ${objects.length} objetos. Use Tab para navegar.`
      : `The canvas contains ${objects.length} objects. Use Tab to navigate.`;
    
    let fullDesc = intro + ' ';
    objects.forEach((obj, i) => {
      fullDesc += describeObject(obj, i + 1, objects.length) + ' ';
    });
    
    announce(fullDesc);
  }
}
