import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  PenTool, MousePointer2, Type, Square, Circle, Star, 
  Layers, Palette, Settings, Download, FilePlus, 
  Undo2, Redo2, Maximize, 
  Trash2, Copy, Grid, Ruler, Eye, EyeOff, Accessibility,
  Lock, Unlock, ChevronRight, ChevronDown, ChevronUp,
  Keyboard, AlertCircle,
  ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine,
  Image as ImageIcon, Search, X, Menu, Filter, 
  Scissors, Wand2, Sparkles, Shapes, 
  Smartphone, FileText, HelpCircle, Save, 
  ArrowUpRight, Monitor, Printer, Layout, LayoutGrid,
  Pipette, Eraser, Brush, Pencil, Minus, ArrowRight,
  QrCode, RefreshCw, Zap, CheckCircle2, Contrast, Crop,
  Maximize2, Edit3,
  Type as FontIcon, Box, ExternalLink, Crown,
  Instagram, Youtube, Linkedin, Move, 
  Upload, Share2, LogOut, FileCode, Sun, Droplets,
  MoreVertical, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Bold, Italic, Underline, Plus, 
  ChevronLeft, History, Library, Info, Sliders, SlidersHorizontal, Check, ArrowLeft,
  Paintbrush, BoxSelect, Ungroup, ClipboardPaste,
  FolderPlus, FolderMinus,
  Layers as LayersIcon, MoveUp, MoveDown,
  SunMedium, Palette as PaletteIcon, Grid3X3, CaseUpper, CaseLower, Type as TextIcon, Square as MaskIcon, Circle as CircleIcon, Heart as HeartIcon, Star as StarIcon,
  FlipHorizontal, FlipVertical, Magnet
} from 'lucide-react';
import WebFont from 'webfontloader';
import { Pathfinder } from '../lib/fabric/Pathfinder';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fabric } from 'fabric';

// @ts-ignore
window.fabric = fabric;

// Initialize WebGL filter backend for better performance
if (fabric.isWebglSupported()) {
  const backend = new fabric.WebglFilterBackend();
  // Detect actual GPU MAX_TEXTURE_SIZE
  const canvas = document.createElement('canvas');
  const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
  const maxSize = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048;
  backend.tileSize = Math.min(maxSize, 4096);
  fabric.filterBackend = backend;
} else {
  fabric.filterBackend = new fabric.Canvas2dFilterBackend();
}

// Override Textbox to support rounded corners, custom background/stroke rendering and fixed height
// @ts-ignore
if (fabric && fabric.Textbox) {
  const textProto = fabric.Text.prototype;
  const textboxProto = fabric.Textbox.prototype;

  // @ts-ignore
  textboxProto.calcTextHeight = function() {
    // For Textbox, we must use _getLinesHeight to get the real content height
    // @ts-ignore
    const textHeight = this._getLinesHeight ? this._getLinesHeight() : textProto.calcTextHeight.call(this);
    const fHeight = (this as any).fixedHeight || 0;
    return Math.max(textHeight, fHeight);
  };

  // @ts-ignore
  textboxProto._getNonTransformedDimensions = function() {
    return {
      x: this.width,
      y: this.height
    };
  };

  // Set default selection border properties
  textboxProto.editingBorderColor = '#2563EB';
  textboxProto.borderColor = '#2563EB';
  textboxProto.hasBorders = true;
  textboxProto.borderScaleFactor = 1;
  textboxProto.cornerColor = '#2563EB';
  textboxProto.cornerStyle = 'circle';
  textboxProto.transparentCorners = false;
  textboxProto.cornerSize = 6;

  // @ts-ignore
  const originalRender = textboxProto._render;
  // @ts-ignore
  textboxProto._render = function(ctx: CanvasRenderingContext2D) {
    // 1. Primeiro desenhamos o fundo (background) que deve preencher toda a caixa de seleção
    this._renderBackground(ctx);
    
    // 2. Agora desenhamos o texto, com o deslocamento necessário para alinhar ao topo da caixa
    const vHeight = this.height;
    // @ts-ignore
    const contentHeight = this._getLinesHeight ? this._getLinesHeight() : textProto.calcTextHeight.call(this);
    
    ctx.save();
    // Determinamos o topo da caixa em coordenadas locais (onde 0,0 é o centro se origin for center)
    let boxTop = -vHeight / 2; // Padrão para originY: center
    if (this.originY === 'top') boxTop = 0;
    if (this.originY === 'bottom') boxTop = -vHeight;
    
    // O Fabric desenha o bloco de texto centralizado em sua própria altura (contentHeight)
    // O topo do bloco de texto estaria em -contentHeight / 2.
    // Queremos que esse topo coincida com boxTop.
    // Deslocamento dy = boxTop - (-contentHeight / 2) = boxTop + contentHeight / 2
    const dy = boxTop + (contentHeight / 2);
    
    ctx.translate(0, dy);
    // Chamamos _renderText em vez de _render para evitar recursão ou desenho duplo do fundo
    this._renderText(ctx);
    ctx.restore();
  };

  // @ts-ignore
  textboxProto._renderBackground = function(ctx: CanvasRenderingContext2D) {
    if (!this.backgroundColor && !this.stroke) return;
    
    const w = this.width;
    const h = this.height;
    const x = -w / 2;
    const y = -h / 2;

    const rtl = this.radiusTopLeft !== undefined ? this.radiusTopLeft : (this.rx || 0);
    const rtr = this.radiusTopRight !== undefined ? this.radiusTopRight : (this.rx || 0);
    const rbr = this.radiusBottomRight !== undefined ? this.radiusBottomRight : (this.rx || 0);
    const rbl = this.radiusBottomLeft !== undefined ? this.radiusBottomLeft : (this.rx || 0);
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + rtl, y);
    ctx.lineTo(x + w - rtr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rtr);
    ctx.lineTo(x + w, y + h - rbr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rbr, y + h);
    ctx.lineTo(x + rbl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rbl);
    ctx.lineTo(x, y + rtl);
    ctx.quadraticCurveTo(x, y, x + rtl, y);
    ctx.closePath();

    if (this.backgroundColor && this.backgroundColor !== 'transparent') {
      ctx.fillStyle = this.backgroundColor;
      ctx.fill();
    }
    
    if (this.stroke && this.strokeWidth) {
      if (this.strokeDashArray) ctx.setLineDash(this.strokeDashArray);
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
    }
    ctx.restore();
  };

  // Garante que a borda continue visível durante a edição
  // @ts-ignore
  fabric.Textbox.prototype.onInput = (function(originalOnInput) {
    return function() {
      // @ts-ignore
      const result = originalOnInput.apply(this, arguments);
      // @ts-ignore
      this.canvas && this.canvas.requestRenderAll();
      return result;
    };
  // @ts-ignore
  })(fabric.Textbox.prototype.onInput);
}

// Support individual corner radii for fabric.Rect
// @ts-ignore
fabric.Rect.prototype._render = function(ctx) {
  const width = this.width,
        height = this.height,
        // Support individual corners or fallback to rx/ry
        rtl = this.radiusTopLeft !== undefined ? this.radiusTopLeft : (this.rx || 0),
        rtr = this.radiusTopRight !== undefined ? this.radiusTopRight : (this.rx || 0),
        rbr = this.radiusBottomRight !== undefined ? this.radiusBottomRight : (this.rx || 0),
        rbl = this.radiusBottomLeft !== undefined ? this.radiusBottomLeft : (this.rx || 0);

  ctx.beginPath();
  ctx.moveTo(-width / 2 + rtl, -height / 2);
  ctx.lineTo(width / 2 - rtr, -height / 2);
  ctx.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + rtr);
  ctx.lineTo(width / 2, height / 2 - rbr);
  ctx.quadraticCurveTo(width / 2, height / 2, width / 2 - rbr, height / 2);
  ctx.lineTo(-width / 2 + rbl, height / 2);
  ctx.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - rbl);
  ctx.lineTo(-width / 2, -height / 2 + rtl);
  ctx.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + rtl, -height / 2);
  ctx.closePath();

  this._renderPaintInOrder(ctx);
};

// Ensure custom properties are included in serialization
// @ts-ignore
fabric.Rect.prototype.toObject = (function(toObject) {
  return function(propertiesToInclude: string[]) {
    const obj = toObject.call(this, ['radiusTopLeft', 'radiusTopRight', 'radiusBottomRight', 'radiusBottomLeft', 'cornersLinked', 'rx', 'ry'].concat(propertiesToInclude || []));
    if (obj.radiusTopLeft === undefined) obj.radiusTopLeft = 0;
    if (obj.radiusTopRight === undefined) obj.radiusTopRight = 0;
    if (obj.radiusBottomRight === undefined) obj.radiusBottomRight = 0;
    if (obj.radiusBottomLeft === undefined) obj.radiusBottomLeft = 0;
    if (obj.cornersLinked === undefined) obj.cornersLinked = true;
    if (obj.rx === undefined) obj.rx = 0;
    if (obj.ry === undefined) obj.ry = 0;
    return obj;
  };
})(fabric.Rect.prototype.toObject);

// Override Image render to support Layer Styles (Color Overlay, Gradient Overlay) on raster images
// @ts-ignore
if (fabric && fabric.Image) {
  // @ts-ignore
  const originalRender = fabric.Image.prototype._render;
  // @ts-ignore
  fabric.Image.prototype._render = function(ctx) {
    originalRender.call(this, ctx);
    
    const layerStyles = this.get('layerStyles');
    if (!layerStyles) return;

    const w = this.width;
    const h = this.height;

    // Apply Color Overlay or Gradient Overlay if enabled
    if (layerStyles.colorOverlay?.enabled || layerStyles.gradientOverlay?.enabled) {
      ctx.save();
      // Restrict all subsequent drawing to the pixels drawn by originalRender (the image shape)
      ctx.globalCompositeOperation = 'source-atop';
      
      const w = this.width;
      const h = this.height;

      // Color Overlay
      if (layerStyles.colorOverlay?.enabled) {
        const color = layerStyles.colorOverlay.color || '#000000';
        const opacity = typeof layerStyles.colorOverlay.opacity === 'number' ? layerStyles.colorOverlay.opacity : 1;
        ctx.fillStyle = colord(color).alpha(opacity).toRgbString();
        // Use a slightly larger rect to avoid anti-aliasing edges
        ctx.fillRect(-w/2 - 1, -h/2 - 1, w + 2, h + 2);
      }
      
      // Gradient Overlay (on top of color overlay)
      if (layerStyles.gradientOverlay?.enabled) {
        const g = layerStyles.gradientOverlay;
        const angleRad = (g.angle * Math.PI) / 180;
        const dist = Math.max(w, h);

        let fillStyle: any;
        if (g.type === 'radial') {
          fillStyle = ctx.createRadialGradient(0, 0, 0, 0, 0, dist/2);
        } else {
          fillStyle = ctx.createLinearGradient(
            -Math.cos(angleRad) * dist/2,
            -Math.sin(angleRad) * dist/2,
            Math.cos(angleRad) * dist/2,
            Math.sin(angleRad) * dist/2
          );
        }
        
        const gOpacity = typeof g.opacity === 'number' ? g.opacity : 1;
        (g.colorStops || []).forEach((stop: any) => {
          fillStyle.addColorStop(stop.offset, colord(stop.color).alpha(gOpacity).toRgbString());
        });
        
        ctx.fillStyle = fillStyle;
        ctx.fillRect(-w/2 - 1, -h/2 - 1, w + 2, h + 2);
      }
      
      ctx.restore();
    }
  };
}

// @ts-ignore
if (fabric && fabric.Text) {
  // @ts-ignore
  fabric.Text.prototype.toObject = (function(toObject) {
    return function(propertiesToInclude: string[]) {
      if (this.path && typeof this.path.toObject !== 'function' && (fabric as any).Path) {
        try {
          const pathData = Array.isArray(this.path) || typeof this.path === 'string' ? this.path : this.path.path;
          if (pathData) {
            this.path = new (fabric as any).Path(pathData, typeof this.path === 'object' ? this.path : undefined);
          }
        } catch (e) {
          console.error('Error enlivening text path:', e);
        }
      }
      return toObject.call(this, propertiesToInclude || []);
    };
  })(fabric.Text.prototype.toObject);
}

// @ts-ignore
if (fabric && fabric.Textbox) {
  // @ts-ignore
  fabric.Textbox.prototype.toObject = (function(toObject) {
    return function(propertiesToInclude: string[]) {
      // It will use the Text.prototype.toObject fix if we call the original one here
      // But we need to include our custom rect-like props for Textbox if we want rounded textboxes
      const obj = toObject.call(this, ['radiusTopLeft', 'radiusTopRight', 'radiusBottomRight', 'radiusBottomLeft', 'cornersLinked', 'rx', 'ry', 'fixedHeight'].concat(propertiesToInclude || []));
      if (obj.radiusTopLeft === undefined) obj.radiusTopLeft = 0;
      if (obj.radiusTopRight === undefined) obj.radiusTopRight = 0;
      if (obj.radiusBottomRight === undefined) obj.radiusBottomRight = 0;
      if (obj.radiusBottomLeft === undefined) obj.radiusBottomLeft = 0;
      if (obj.cornersLinked === undefined) obj.cornersLinked = true;
      if (obj.rx === undefined) obj.rx = 0;
      if (obj.ry === undefined) obj.ry = 0;
      return obj;
    };
  })(fabric.Textbox.prototype.toObject);
}

// Register a custom Folder class for Fabric.js
// @ts-ignore
fabric.Folder = fabric.util.createClass(fabric.Object, {
  type: 'folder',
  isFolder: true,
  initialize: function(options: any) {
    this.callSuper('initialize', options);
    this.set({
      selectable: false,
      evented: false,
      visible: false,
      active: false,
      isFolder: true
    });
  },
  toObject: function(propertiesToInclude: string[]) {
    return this.callSuper('toObject', ['isFolder', 'parentId', 'isUiVisible', 'layerStyles', 'name'].concat(propertiesToInclude || []));
  }
});
// @ts-ignore
fabric.Folder.fromObject = function(object: any, callback: any) {
  const folder = new fabric.Folder(object);
  callback && callback(folder);
  return folder;
};

import { psdService } from '../utils/psdService';
import { pdfService } from '../services/pdfService';
import { GoogleGenAI } from "@google/genai";
import { iconTranslationsPTBR, iconTranslationsEN } from '../data/iconTranslations';
import { translateDescription } from '../lib/translationUtils';
import { cn } from '../lib/utils';
import { generateThumbnail, generateAllThumbnails } from '../lib/pdf-utils';
import { useColorStore } from '../store/useColorStore';
import { ForegroundBackgroundWidget } from '../components/ForegroundBackgroundWidget';
import { useBrushStore } from '../store/useBrushStore';
import { BrushOptionsBar } from '../components/BrushOptions/BrushOptionsBar';
import { ContextualObjectBar } from '../components/Editor/ContextualObjectBar';
import { HistoryPanel } from '../components/Editor/HistoryPanel';
import { LineOptionsBar } from '../components/Editor/LineOptionsBar';
import { ShapeOptionsBar } from '../components/Editor/ShapeOptionsBar';
import { ReportProblemModal } from '../components/Editor/ReportProblemModal';
import { ColorPicker } from '../components/ColorPicker';
import { MagicWandOptionsBar } from '../components/Editor/MagicWandOptionsBar';
import { PenOptionsBar } from '../components/Editor/PenOptionsBar';
import { MagneticLassoOptionsBar } from '../components/Editor/MagneticLassoOptionsBar';
import { LassoOptionsBar } from '../components/Editor/LassoOptionsBar';
import { MarqueeOptionsBar } from '../components/Editor/MarqueeOptionsBar';
import { usePenTool } from '../hooks/usePenTool';
import { useMagneticLasso } from '../hooks/useMagneticLasso';
import { useLasso } from '../hooks/useLasso';
import { floodFill, extractFromImage, eraseFromImage, maskToPath, combineMasks, type SelectionResult } from '../utils/magicWand';
import { MagicWandOverlay } from '../components/Editor/MagicWandOverlay';
import { extractPolygonRegion, erasePolygonRegion } from '../tools/PolygonalLassoTool';
import { DistortManager } from '../services/DistortManager';
import { PowerClipManager } from '../services/PowerClipManager';
import { colord } from 'colord';
import { LeftSidebar } from '../components/Layout/LeftSidebar';
import { AdjustmentPanel } from '../components/Editor/AdjustmentPanel';
import { RightSidebar } from '../components/Layout/RightSidebar';

// Lazy load modals
const AboutModal = React.lazy(() => import('../components/Modals/AboutModal').then(m => ({ default: m.AboutModal })));
const ExportModal = React.lazy(() => import('../components/Modals/ExportModal').then(m => ({ default: m.ExportModal })));
const VectorizerModal = React.lazy(() => import('../components/Modals/VectorizerModal').then(m => ({ default: m.VectorizerModal })));
const HelpModal = React.lazy(() => import('../components/Modals/HelpModal').then(m => ({ default: m.HelpModal })));
const KeyboardShortcutsModal = React.lazy(() => import('../components/Modals/KeyboardShortcutsModal').then(m => ({ default: m.KeyboardShortcutsModal })));
const BlindOnboardingModal = React.lazy(() => import('../components/Modals/BlindOnboardingModal').then(m => ({ default: m.BlindOnboardingModal })));
const LayerStylesModal = React.lazy(() => import('../components/Modals/LayerStylesModal'));
const AdjustmentModal = React.lazy(() => import('../components/Modals/AdjustmentModal'));
const LevelsModal = React.lazy(() => import('../components/Modals/LevelsModal'));
const SmartObjectModal = React.lazy(() => import('../components/Modals/SmartObjectModal').then(m => ({ default: m.SmartObjectModal })));

import { CanvasRuler } from '../components/Layout/CanvasRuler';
import CanvasCoordinateRuler from '../components/CanvasCoordinateRuler';
import { ToolButton } from '../components/Layout/ToolButton';
import { PresetCard } from '../components/Layout/PresetCard';
import { SortableLayerItem } from '../components/Layout/SortableLayerItem';
import { LanguageSelector } from '../components/Layout/LanguageSelector';
import { PdfPagePanel } from '../components/Layout/PdfPagePanel';
import { PdfToolbar } from '../components/Layout/PdfToolbar';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useA11yStore } from '../store/useA11yStore';
import { speech } from '../services/speechService';
import { getColorName } from '../utils/colorName';
import { AGPSD_TO_FABRIC } from '../utils/blendModeMapping';

import { VISION_TYPES, DEFAULT_FONTS, DEFAULT_IMAGE_QUERY, DEFAULT_ICON_QUERY, GEMINI_COOLDOWN, GRID_SIZE, UNITS, CANVAS_PRESETS, IMAGE_FILTERS, GLASS_PRESETS, GRADIENTS } from '../constants/tee';
import { Layer, HistoryState, ArtboardSize, VisionType, Guide, GuideLayoutConfig, ExportOptions, Macro } from '../types/tee';

import { usePolygonalLasso } from '../hooks/usePolygonalLasso';
import { LassoOverlay } from '../components/LassoOverlay';
import { MarqueeOverlay } from '../components/MarqueeOverlay';
import { ArtboardSelectionOverlay } from '../components/ArtboardSelectionOverlay';
import { LassoActionPanel } from '../components/LassoActionPanel';

declare const anime: any;

// Types
interface Document {
  id: string;
  name: string;
  canvasData: any;
  thumbnail: string;
  width?: number;
  height?: number;
  pages?: number;
}
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Fora do componente — persiste entre renders
let deferredInstallPrompt: any = null;

// Helper to convert number to letter (0=A, 1=B...)
const numberToLetter = (n: number): string => {
  let result = '';
  n = n + 1;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
};

interface CanvasSize {
  width: number;
  height: number;
}


const FABRIC_PROPS = [
  'id', 'name', 'selectable', 'evented', 'locked', 'parentId', 'isFolder', 'originalSrc', 'src', 'backgroundColor', 'filters', '_elementToGlobal',
  'hasControls', 'hasBorders', 'lockMovementX', 'lockMovementY', 
  'lockRotation', 'lockScalingX', 'lockScalingY', 'lockScalingFlip',
  'isProcessed', 'isGridLine', 'absolutePositioned', 'isArtboardClip',
  '_pcId', '_pcProxy', '_pcContainer', '_pcContent', 
  'powerClipGroupId', 'powerClipRole',
  '_origFill', '_origStroke', '_origSWidth', '_target_radius', '_lsOrigFill',
  'isIcon', 'excludeFromExport', 'radius', 'data',
  'isTextOnPath', 'path', 'pathStartOffset', 'originalText',
  'shadow', 'strokeDashArray', 'strokeLineCap', 'strokeLineJoin', 'strokeMiterLimit',
  'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'angle', 'originX', 'originY',
  'flipX', 'flipY', 'skewX', 'skewY', 'visible', 'strokeUniform', 'paintFirst',
  'fill', 'stroke', 'strokeWidth', 'opacity', 'rx', 'ry', 'radiusTopLeft', 'radiusTopRight', 'radiusBottomRight', 'radiusBottomLeft', 'cornersLinked',
  'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'textAlign', 'lineHeight', 'charSpacing', 'text',
  'styles', 'layerStyles', 'adjustmentType', 'adjustmentData', 'isAdjustment', 'isNewAdjustment', '_savedOpacity', '_pcOldIndex',
  'underline', 'overline', 'linethrough', 'strokeDashOffset',
  'isSmartObject', 'smartSource', 'originalWidth', 'originalHeight'
];

// Helper to load image element from src
const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
};

export const MoscaTeePage: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const { t, i18n } = useTranslation();
  const iconTranslations = lang === 'en' ? iconTranslationsEN : iconTranslationsPTBR;
  const [isLoading, setIsLoading] = useState(true);
  const [logoAnimationDone, setLogoAnimationDone] = useState(false);
  const [startBlurFade, setStartBlurFade] = useState(false);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocUnit, setNewDocUnit] = useState<'px' | 'cm' | 'mm' | 'in' | 'pt' | 'pc'>('px');
  const [newDocWidth, setNewDocWidth] = useState(1080);
  const [newDocHeight, setNewDocHeight] = useState(1350);
  const [newDocPages, setNewDocPages] = useState(1);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  // Multi-document state
  const [layers, setLayers] = useState<Layer[]>([]);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());

  const toggleGroupExpansion = useCallback((groupId: string) => {
    setExpandedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);
  const [historyState, setHistoryState] = useState<HistoryState>({
    history: [],
    index: -1
  });
  const isHistoryLoading = useRef(false);
  const prevHistoryJsonRef = useRef<string | null>(null);
  const saveToHistoryRef = useRef<(c: fabric.Canvas) => void>(() => {});
  const updateLayersRef = useRef<(c: fabric.Canvas) => void>(() => {});

  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string>('');

  useEffect(() => {
    // Initial document setup after translation is ready
    if (documents.length === 0) {
      const initialDocId = '1';
      setDocuments([
        { 
          id: initialDocId, 
          name: `${t('editor.header.document_prefix', 'Document')} 1`, 
          canvasData: null, 
          thumbnail: '', 
          width: 1080, 
          height: 1350, 
          pages: 1 
        }
      ]);
      setActiveDocumentId(initialDocId);
    }
  }, [t, documents.length]);

  // Reactive translation for default document names
  useEffect(() => {
    if (documents.length > 0) {
      const currentPrefix = t('editor.header.document_prefix', 'Document');
      const ptPrefix = "Documento";
      const enPrefix = "Document";
      
      setDocuments(prev => prev.map(doc => {
        if (doc.name.startsWith(ptPrefix + " ") || doc.name.startsWith(enPrefix + " ")) {
          const num = doc.name.split(" ").pop();
          const newName = `${currentPrefix} ${num}`;
          if (doc.name !== newName) {
            return { ...doc, name: newName };
          }
        }
        return doc;
      }));
    }
  }, [t]);
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [pdfPages, setPdfPages] = useState<any[]>([]);
  const [currentPdfPageIndex, setCurrentPdfPageIndex] = useState(0);
  const [pdfFileName, setPdfFileName] = useState('');
  const [showPdfChoiceModal, setShowPdfChoiceModal] = useState(false);
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [pcm, setPcm] = useState<PowerClipManager | null>(null);
  const pcmRef = useRef<PowerClipManager | null>(null);
  const [dm, setDm] = useState<DistortManager | null>(null);
  const dmRef = useRef<DistortManager | null>(null);
  const [isPowerClipEditing, setIsPowerClipEditing] = useState(false);
  const [isPowerClipPlacing, setIsPowerClipPlacing] = useState(false);
  
  // Object Active selection states
  const [activeTool, setActiveToolState] = useState('select');
  const [activeShape, setActiveShape] = useState<'rectangle' | 'circle' | 'triangle' | 'star' | 'heart'>('rectangle');
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingPsdBuffer = useRef<ArrayBuffer | null>(null);
  const pendingPdfPages = useRef<any[] | null>(null);
  const [artboardSize, setArtboardSize] = useState<CanvasSize>({ width: 1080, height: 1350 });
  const [magicWandTolerance, setMagicWandTolerance] = useState(32);
  const [magicWandSelection, setMagicWandSelection] = useState<SelectionResult | null>(null);
  const [magicWandContiguous, setMagicWandContiguous] = useState(true);

  // Macro state
  const [macros, setMacros] = useState<Macro[]>(() => {
    const saved = localStorage.getItem('moscatee_macros');
    return saved ? JSON.parse(saved) : [];
  });
  const [isRecordingMacro, setIsRecordingMacro] = useState(false);
  const [currentMacro, setCurrentMacro] = useState<Macro | null>(null);

  const startRecordingMacro = (name: string) => {
    setIsRecordingMacro(true);
    setCurrentMacro({
      id: Math.random().toString(36).substr(2, 9),
      name,
      actions: [],
      timestamp: Date.now()
    });
    showToast(t('editor.messages.macro_recording_started', 'Gravação de ação iniciada'), 'info');
  };

  const stopRecordingMacro = () => {
    if (currentMacro) {
      const updatedMacros = [...macros, currentMacro];
      setMacros(updatedMacros);
      localStorage.setItem('moscatee_macros', JSON.stringify(updatedMacros));
      showToast(t('editor.messages.macro_saved', 'Ação salva com sucesso'), 'success');
    }
    setIsRecordingMacro(false);
    setCurrentMacro(null);
  };

  const deleteMacro = (id: string) => {
    const updatedMacros = macros.filter(m => m.id !== id);
    setMacros(updatedMacros);
    localStorage.setItem('moscatee_macros', JSON.stringify(updatedMacros));
  };

  const recordAction = useCallback((action: any) => {
    if (isRecordingMacro && currentMacro) {
      setCurrentMacro(prev => {
        if (!prev) return null;
        return {
          ...prev,
          actions: [...prev.actions, action]
        };
      });
    }
  }, [isRecordingMacro, currentMacro]);

  const handleMagicWandClickRef = useRef<any>(null);
  const startLassoRef = useRef<any>(null);
  const drawLassoRef = useRef<any>(null);
  const stopLassoRef = useRef<any>(null);
  const addMagneticLassoPointRef = useRef<any>(null);
  const addPenPointRef = useRef<any>(null);
  const handlePenMouseMoveRef = useRef<any>(null);
  const finishPenPathRef = useRef<any>(null);

  // Global Color Store
  const foreground = useColorStore(state => state.foreground);
  const background = useColorStore(state => state.background);
  const activeSlot = useColorStore(state => state.activeSlot);

  // Brush Store
  const { settings: brushSettings, updateSettings: updateBrushSettings } = useBrushStore();

  const { points: magneticLassoPoints, addPoint: addMagneticLassoPoint, clearMagneticLasso } = useMagneticLasso(canvas, activeTool === 'magnetic-lasso');

  const getDefaultAdjustmentData = useCallback((type: string) => {
    switch (type) {
      case 'brightness_contrast': return { brightness: 0, contrast: 0 };
      case 'hue_saturation': return { hue: 0, saturation: 0, lightness: 0 };
      case 'color_balance': return { red: 0, green: 0, blue: 0 };
      case 'black_white':
      case 'grayscale':
        return { enabled: true, amount: 0 };
      case 'warm':
      case 'cold':
      case 'pop':
      case 'contrast':
      case 'color':
      case 'cinema':
        return { enabled: false };
      case 'gaussian_blur': return { blur: 0 };
      case 'vibrance': return { amount: 0 };
      case 'gamma': return { amount: 100 };
      case 'levels': return { inputShadows: 0, inputMidtones: 1.0, inputHighlights: 255, outputShadows: 0, outputHighlights: 255 };
      case 'motion_blur': return { amount: 0, angle: 0 };
      case 'radial_blur': return { amount: 0 };
      case 'noise': return { noise: 0 };
      case 'sharpen':
      case 'sharpness':
        return { amount: 0 };
      case 'skew': return { skewX: 0, skewY: 0 };
      case 'perspective': return { amount: 0 };
      case 'warp': return { amount: 0 };
      default: return {};
    }
  }, []);

  const getInsertionPosition = useCallback((c: fabric.Canvas) => {
    const vpCenter = c.getVpCenter();
    const artboards = c.getObjects().filter(o => (o as any).id?.toString().includes('artboard'));
    
    let targetCenter = vpCenter;
    if (artboards.length > 0) {
      // Prioritize the artboard the user is actually looking at (contains vpCenter)
      let targetArtboard = artboards.find(art => art.containsPoint(vpCenter));
      
      if (!targetArtboard) {
        // Fallback: Find artboard whose center is closest to viewport center
        let minDist = Infinity;
        for (const art of artboards) {
          const artCenter = art.getCenterPoint();
          const dist = Math.sqrt(Math.pow(artCenter.x - vpCenter.x, 2) + Math.pow(artCenter.y - vpCenter.y, 2));
          if (dist < minDist) {
            minDist = dist;
            targetArtboard = art;
          }
        }
      }
      
      if (targetArtboard) {
        targetCenter = targetArtboard.getCenterPoint();
      }
    }

    return targetCenter;
  }, []);

  const updateOrAddFilter = useCallback((obj: any, filter: any) => {
    if (!obj.filters) obj.filters = [];
    const idx = obj.filters.findIndex((f: any) => f.type === filter.type);
    if (idx > -1) obj.filters[idx] = filter;
    else obj.filters.push(filter);
    
    // REMOVIDO: obj.applyFilters() daqui. Será chamado em lote no final do refreshFilters.
  }, []);

  const applyFiltersToObject = useCallback((obj: any, type: string, data: any) => {
    if (obj.type !== 'image') return;
    
    obj.filters = obj.filters || [];
    
    switch (type) {
      case 'brightness_contrast':
        if (data.brightness !== 0) updateOrAddFilter(obj, new fabric.Image.filters.Brightness({ brightness: (data.brightness || 0) / 100 }));
        if (data.contrast !== 0) updateOrAddFilter(obj, new fabric.Image.filters.Contrast({ contrast: (data.contrast || 0) / 100 }));
        break;
      case 'hue_saturation':
        if (data.hue !== 0) updateOrAddFilter(obj, new fabric.Image.filters.HueRotation({ rotation: (data.hue || 0) / 100 }));
        if (data.saturation !== 0) updateOrAddFilter(obj, new fabric.Image.filters.Saturation({ saturation: (data.saturation || 0) / 100 }));
        break;
      case 'color_balance':
        const r = (data.red || 0) / 100;
        const g = (data.green || 0) / 100;
        const b = (data.blue || 0) / 100;
        if (r !== 0 || g !== 0 || b !== 0) {
          updateOrAddFilter(obj, new fabric.Image.filters.ColorMatrix({
            matrix: [
              1 + r, 0, 0, 0, 0,
              0, 1 + g, 0, 0, 0,
              0, 0, 1 + b, 0, 0,
              0, 0, 0, 1, 0
            ]
          }));
        }
        break;
      case 'grayscale':
      case 'black_white':
        // Sempre aplica grayscale (saturação zero)
        updateOrAddFilter(obj, new fabric.Image.filters.Saturation({ saturation: -1 }));
        
        // O slider controla a "intensidade do preto" aumentando contraste e diminuindo brilho
        const blackIntensity = (data.amount || 0) / 100;
        if (blackIntensity > 0) {
          updateOrAddFilter(obj, new fabric.Image.filters.Contrast({ contrast: blackIntensity * 0.6 }));
          updateOrAddFilter(obj, new fabric.Image.filters.Brightness({ brightness: -blackIntensity * 0.4 }));
        }
        break;
      case 'warm':
        if (data.enabled !== false) {
          updateOrAddFilter(obj, new fabric.Image.filters.ColorMatrix({
            matrix: [
              1.1, 0, 0, 0, 0,
              0, 1, 0, 0, 0,
              0, 0, 0.9, 0, 0,
              0, 0, 0, 1, 0
            ]
          }));
        }
        break;
      case 'cold':
        if (data.enabled !== false) {
          updateOrAddFilter(obj, new fabric.Image.filters.ColorMatrix({
            matrix: [
              0.9, 0, 0, 0, 0,
              0, 1, 0, 0, 0,
              0, 0, 1.1, 0, 0,
              0, 0, 0, 1, 0
            ]
          }));
        }
        break;
      case 'pop':
        if (data.enabled !== false) {
          updateOrAddFilter(obj, new fabric.Image.filters.Contrast({ contrast: 0.2 }));
          updateOrAddFilter(obj, new fabric.Image.filters.Saturation({ saturation: 0.3 }));
        }
        break;
      case 'contrast':
        if (data.enabled !== false) {
          updateOrAddFilter(obj, new fabric.Image.filters.Contrast({ contrast: 0.5 }));
        }
        break;
      case 'color':
        if (data.enabled !== false) {
          updateOrAddFilter(obj, new fabric.Image.filters.HueRotation({ rotation: 0.5 }));
        }
        break;
      case 'cinema':
        if (data.enabled !== false) {
          updateOrAddFilter(obj, new fabric.Image.filters.ColorMatrix({
            matrix: [
              0.9, 0.1, 0.1, 0, 0,
              0.1, 1, 0.1, 0, 0,
              0.1, 0.1, 1.2, 0, 0,
              0, 0, 0, 1, 0
            ]
          }));
        }
        break;
      case 'gaussian_blur':
        if ((data.blur || 0) !== 0) {
          updateOrAddFilter(obj, new fabric.Image.filters.Blur({
            blur: (data.blur || 0) / 100
          }));
        }
        break;
      case 'vibrance':
        if ((data.amount || 0) !== 0) {
          // Vibrance usually non-linearly boosts saturation
          // We provide a fallback if the custom filter is not available
          const vValue = (data.amount || 0) / 100;
          // @ts-ignore
          if (fabric.Image.filters.Vibrance) {
            // @ts-ignore
            updateOrAddFilter(obj, new fabric.Image.filters.Vibrance({
              vibrance: vValue
            }));
          } else {
            // Fallback to saturation (vibrance is like selective saturation)
            updateOrAddFilter(obj, new fabric.Image.filters.Saturation({
              saturation: vValue * 0.8
            }));
          }
        }
        break;
      case 'gamma':
        if ((data.amount || 100) !== 100) {
          const g = (data.amount || 100) / 100;
          updateOrAddFilter(obj, new fabric.Image.filters.Gamma({
            gamma: [g, g, g]
          }));
        }
        break;
      case 'levels':
        if (data) {
          const inShadows = data.inputShadows ?? 0;
          const inMidtones = data.inputMidtones ?? 1.0;
          const inHighlights = data.inputHighlights ?? 255;
          const outShadows = data.outputShadows ?? 0;
          const outHighlights = data.outputHighlights ?? 255;

          // Calculate scale and offset for the linear part
          const inRange = Math.max(1, inHighlights - inShadows);
          const outRange = outHighlights - outShadows;
          const scale = outRange / inRange;
          const offset = (outShadows - inShadows * scale) / 255;

          // Apply range mapping via ColorMatrix
          updateOrAddFilter(obj, new fabric.Image.filters.ColorMatrix({
            matrix: [
              scale, 0, 0, 0, offset,
              0, scale, 0, 0, offset,
              0, 0, scale, 0, offset,
              0, 0, 0, 1, 0
            ]
          }));

          // Apply Gamma for midtones
          if (inMidtones !== 1.0) {
            const g = 1 / inMidtones;
            updateOrAddFilter(obj, new fabric.Image.filters.Gamma({
              gamma: [g, g, g]
            }));
          }
        }
        break;
      case 'motion_blur':
        // Simple horizontal motion blur using convolution
        // Fabric WebGL Convolute filter works best with 3x3 matrices
        // Ensure the matrix is a flat array of numbers to avoid shader syntax errors
        const motionMatrix = [
          0.33, 0.33, 0.33,
          0.0, 0.0, 0.0,
          0.0, 0.0, 0.0
        ];
        updateOrAddFilter(obj, new fabric.Image.filters.Convolute({
          matrix: motionMatrix
        }));
        break;
      case 'radial_blur':
        // Simple radial blur approximation using multiple blurs or a convolve
        if ((data.amount || 0) !== 0) {
          updateOrAddFilter(obj, new fabric.Image.filters.Blur({
            blur: (data.amount || 0) / 100
          }));
        }
        break;
      case 'noise':
        if ((data.noise || 0) !== 0) {
          updateOrAddFilter(obj, new fabric.Image.filters.Noise({
            noise: data.noise || 0
          }));
        }
        break;
      case 'sharpen':
      case 'sharpness':
        // Simple sharpen convolution matrix (3x3 = 9 elements)
        const sharpenAmount = data.amount ?? 0;
        if (sharpenAmount > 0) {
          updateOrAddFilter(obj, new fabric.Image.filters.Convolute({
            matrix: [
              0, -sharpenAmount, 0,
              -sharpenAmount, 4 * sharpenAmount + 1, -sharpenAmount,
              0, -sharpenAmount, 0
            ]
          }));
        }
        break;
      case 'skew':
        obj.set({
          skewX: data.skewX || 0,
          skewY: data.skewY || 0
        });
        break;
    }
    
    // Note: applyFilters() is now called in refreshFilters for better performance
  }, [updateOrAddFilter]);

  const isGlobalFilterRefreshingRef = useRef(false);

  const refreshFilters = useCallback((c: fabric.Canvas) => {
    if (!c || (c as any)._disposed || isGlobalFilterRefreshingRef.current) return;
    
    isGlobalFilterRefreshingRef.current = true;
    requestAnimationFrame(() => {
      const allObjects = c.getObjects();
      const adjustmentLayers = [];
      const filterableObjects = [];

      // Passagem única para separar objetos e limpar filtros
      for (let i = 0; i < allObjects.length; i++) {
        const obj = allObjects[i] as any;
        if (obj.isAdjustment && obj.visible) {
          adjustmentLayers.push(obj);
        } else if (!obj.isAdjustment) {
          if (obj.type === 'image') {
            obj.filters = [];
            filterableObjects.push(obj);
          }
        }
      }

      // Aplicar configurações dos filtros (apenas preenche arrays de filtros, sem processar)
      adjustmentLayers.forEach(adj => {
        const adjIndex = allObjects.indexOf(adj);
        // Filtros só afetam o que está ABAIXO deles na pilha de camadas
        for (let i = 0; i < adjIndex; i++) {
          const obj = allObjects[i] as any;
          if (!obj.isAdjustment && obj.type === 'image') {
            applyFiltersToObject(obj, adj.adjustmentType, adj.adjustmentData);
          }
        }
      });

      // Processamento em lote dos filtros (apenas UMA chamada por objeto)
      filterableObjects.forEach(obj => {
        if (obj.applyFilters) {
          obj.set({ dirty: true, objectCaching: true });
          
          // Fallback to Canvas2d for oversized images (> 2048px)
          const originalBackend = fabric.filterBackend;
          const isOversized = (obj.width || 0) > 2048 || (obj.height || 0) > 2048;
          
          if (isOversized) {
            fabric.filterBackend = new fabric.Canvas2dFilterBackend();
          }

          obj.applyFilters();

          // Restore original backend if it was changed
          if (isOversized) {
            fabric.filterBackend = originalBackend;
          }
        }
      });
      
      c.requestRenderAll();
      isGlobalFilterRefreshingRef.current = false;
    });
  }, [applyFiltersToObject]);

  const applyAdjustmentLayer = useCallback((adj: any) => {
    if (!canvas) return;
    refreshFilters(canvas);
  }, [canvas, refreshFilters]);

  const enlivenClipPathRecursive = useCallback((target: fabric.Object[] | fabric.Canvas | fabric.Object) => {
    let list: fabric.Object[] = [];
    
    if (Array.isArray(target)) {
      list = target;
    } else if (target instanceof fabric.Canvas || (target as any).getObjects) {
      list = (target as any).getObjects();
      // Handle canvas/group clipPath
      if ((target as any).clipPath && typeof (target as any).clipPath.toObject !== 'function') {
        processObject(target as any);
      }
    } else if (target instanceof fabric.Object) {
      list = [target];
    }

    function processObject(obj: any) {
      if (!obj) return;

      if (!obj.clipPath || typeof obj.clipPath.toObject === 'function') return;

      const cp = obj.clipPath;
      const type = cp.type || 'rect';
      
      // Comprehensive type to class mapping
      let className = fabric.util.string.capitalize(type);
      if (type === 'i-text') className = 'IText';
      if (type === 'textbox') className = 'Textbox';
      if (type === 'path-group') className = 'PathGroup';
      
      const Klass = (fabric as any)[className];
      if (Klass) {
        try {
          if (type === 'group' && cp.objects) {
            // Need to recursively enliven objects for the group
            const groupObjects: fabric.Object[] = [];
            cp.objects.forEach((o: any) => {
              const oType = o.type || 'rect';
              let oClassName = fabric.util.string.capitalize(oType);
              if (oType === 'i-text') oClassName = 'IText';
              const OKlass = (fabric as any)[oClassName];
              if (OKlass) {
                if (oType === 'path') {
                  groupObjects.push(new fabric.Path(o.path, o));
                } else {
                  groupObjects.push(new OKlass(o));
                }
              }
            });
            obj.clipPath = new fabric.Group(groupObjects, cp);
          } else {
            if (type === 'path') {
              obj.clipPath = new fabric.Path(cp.path, cp);
            } else {
              obj.clipPath = new Klass(cp);
            }
          }
        } catch (e) {
          console.error('Error enlivening clipPath:', e);
          delete obj.clipPath;
        }
      } else {
        console.warn(`Could not find Fabric class for clipPath type ${type}, removing to prevent crash`, obj);
        delete obj.clipPath;
      }
    }

    list.forEach(obj => {
      if (!obj) return;

      // Check for clipPath POJO
      processObject(obj);

      // Only enliven 'path' if it's meant to be a sub-object (like Text-on-Path)
      // and not the internal command array of a Path object itself
      if (obj.path && obj.type !== 'path' && typeof obj.path.toObject !== 'function') {
        try {
          const pathData = Array.isArray(obj.path) || typeof obj.path === 'string' ? obj.path : obj.path.path;
          if (pathData) {
            obj.path = new fabric.Path(pathData, typeof obj.path === 'object' ? obj.path : undefined);
          }
        } catch (e) {
          console.error('Error enlivening recursive path:', e);
        }
      }

      // Check if clipPath exists and is a group, we might need to recurse into it
      if (obj.clipPath && (obj.clipPath as any).getObjects) {
        enlivenClipPathRecursive((obj.clipPath as any).getObjects());
      }

      // Recurse into object children if it's a group
      if ((obj as any).getObjects) {
        enlivenClipPathRecursive((obj as any).getObjects());
      }
    });
  }, []);

  const saveToHistory = useCallback((c: fabric.Canvas, name?: string) => {
    if (isHistoryLoading.current || !c || (c as any)._disposed) return;

    // Safety check: Ensure all clipPaths are proper Fabric objects before serializing
    enlivenClipPathRecursive(c);

    // Increase numeric precision for serialization to prevent shrinking of scaled items
    const originalPrecision = fabric.Object.NUM_FRACTION_DIGITS;
    fabric.Object.NUM_FRACTION_DIGITS = 8;
    
    // Correction 1: Serialize normally, skipping mass dataURL conversion to keep history fast
    const jsonObj = c.toJSON([...FABRIC_PROPS, 'id', 'name', 'locked', 'isGridLine', 'excludeFromExport']);
    
    const json = JSON.stringify(jsonObj);
    fabric.Object.NUM_FRACTION_DIGITS = originalPrecision;

    // Avoid saving duplicate states
    if (prevHistoryJsonRef.current === json) {
      return;
    }
    prevHistoryJsonRef.current = json;

    const actionName = name || t('editor.history.generic_action', 'Alteração');
    
    setHistoryState(prev => {
      const newHistory = prev.history.slice(0, prev.index + 1);
      newHistory.push({
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: actionName,
        state: json,
        timestamp: Date.now(),
        activeDocumentId,
        artboardSize: { ...artboardSize },
        carouselPages,
        zoom: c.getZoom(),
        viewportTransform: [...(c.viewportTransform || [1, 0, 0, 1, 0, 0])]
      });
      // Limit history to 51 snapshots (Initial + 50 actions = 50 undos)
      if (newHistory.length > 51) {
        newHistory.shift();
      }
      return {
        history: newHistory,
        index: newHistory.length - 1
      };
    });
  }, [t]);

  useEffect(() => {
    saveToHistoryRef.current = saveToHistory;
  }, [saveToHistory]);

  const generateUniqueId = () => `layer-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

  const updateLayers = useCallback((c: fabric.Canvas) => {
    if (!c || (c as any)._disposed) return;
    
    // Re-apply adjustment layers whenever layers change or visibility changes
    refreshFilters(c);

    const buildLayerList = (allObjects: any[], depth = 0, currentParentId?: string): Layer[] => {
      const list: Layer[] = [];
      const usedIds = new Set<string>();

      // Filtramos apenas os objetos que pertencem ao nível atual da hierarquia
      const levelObjects = allObjects.filter(obj => (obj.parentId === currentParentId) || (!currentParentId && !obj.parentId));

      levelObjects.forEach((obj: any, index) => {
        const isArtboard = obj.id && obj.id.toString().startsWith('artboard_bg');
        const isShadow = obj.id && (obj.id.toString().startsWith('artboard_shadow') || obj.id.toString() === 'artboard_shadow');
        
        if (obj.isGridLine || obj.id === 'grid_rect' || obj.id === 'marquee_selection' || isShadow || (obj.id && obj.id.toString().includes('shadow')) || (obj.excludeFromExport === true && !isArtboard)) {
          return;
        }
        
        if (!obj.id || usedIds.has(obj.id)) {
          obj.id = `${generateUniqueId()}-${index}`;
        }
        usedIds.add(obj.id);
        
        const isFolder = obj.type === 'folder' || obj.isFolder === true;
        const isGroup = obj.type === 'group' || isFolder;
        const isExpanded = isGroup ? expandedGroupIds.has(obj.id) : false;

        const layer: Layer = {
          id: obj.id,
          type: obj.type || 'object',
          name: isArtboard ? t('editor.tools.artboard', 'Artboard') : (obj.name || `${obj.type} ${allObjects.length - index}`),
          visible: isFolder ? (obj.isUiVisible !== false) : (obj.visible !== false),
          locked: obj.lockMovementX === true,
          opacity: obj.opacity || 1,
          object: obj,
          depth: depth,
          parentId: currentParentId,
          isGroup: isGroup,
          isExpanded: isExpanded
        };

        list.push(layer);

        // Se estiver expandido, adicionamos os filhos recursivamente
        if (isGroup && isExpanded) {
          if (isFolder && obj.type === 'folder') {
            // Nova lógica: filhos estão no array principal do canvas marcados com parentId
            list.push(...buildLayerList(allObjects, depth + 1, obj.id));
          } else if (obj.type === 'group') {
            // Fallback para grupos físicos (legado ou importado)
            const children = obj.getObjects().slice().reverse();
            list.push(...buildLayerList(children, depth + 1, obj.id));
          }
        }
      });
      return list;
    };

    const topLevelObjectsSorted = c.getObjects().filter(obj => {
      const o = obj as any;
      const isShadow = o.id && o.id.toString().startsWith('artboard_shadow');
      return !o.isGridLine && o.id !== 'grid_rect' && !isShadow && o.name !== '__grid_coord__' && o.name !== '__grid__' && o.name !== '__grid_cursor__' && o.name !== '__marker__' && o.name !== '__arrow_preview__' && o.name !== '__text_preview__';
    }).slice().reverse();

    setLayers(buildLayerList(topLevelObjectsSorted));
  }, [refreshFilters, applyFiltersToObject, t, expandedGroupIds]);

  useEffect(() => {
    updateLayersRef.current = updateLayers;
  }, [updateLayers]);

  // Synchronize layers name when language changes
  useEffect(() => {
    if (canvas) {
      updateLayers(canvas);
    }
  }, [t, canvas, updateLayers]);

  const handlePathfinder = useCallback(async (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => {
    if (!canvas) return;
    const result = await Pathfinder.apply(canvas, operation);
    if (result) {
      saveToHistory(canvas, t(`editor.pathfinder.${operation}`, operation));
      updateLayers(canvas);
    } else {
      showToast(t('editor.pathfinder.error', 'Não foi possível realizar a operação. Certifique-se de que pelo menos 2 objetos vetoriais estão selecionados.'), 'error');
    }
  }, [canvas, t, saveToHistory, updateLayers]);

  const handlePowerClip = useCallback(() => {
    if (!canvas || !pcm) return;
    const active = canvas.getActiveObject();
    if (!active) {
      showToast(t('editor.powerclip.error_select_content', 'Selecione o objeto que deseja colocar dentro'), 'info');
      return;
    }
    pcm.startPlacement(active);
  }, [canvas, pcm, t]);

  const exitPowerClipEdit = useCallback(() => {
    if (!pcm || !canvas) return;
    pcm.exitEditMode();
    saveToHistory(canvas, t('editor.powerclip.finish_edit', 'Finalizar Edição'));
  }, [pcm, canvas, t, saveToHistory]);

  const enterPowerClipEditMode = useCallback((pc: any) => {
    if (!pcm || !canvas) return;
    pcm.enterEditModeById(pc.id);
    saveToHistory(canvas, t('editor.powerclip.enter_edit', 'Editar Conteúdo'));
  }, [pcm, canvas, t, saveToHistory]);

  const extractPowerClip = useCallback((pc: any) => {
    if (!pcm || !canvas) return;
    pcm.extractContent();
    saveToHistory(canvas, t('editor.powerclip.extract_contents', 'Extrair conteúdo'));
    updateLayers(canvas);
  }, [pcm, canvas, t, saveToHistory, updateLayers]);

  const toggleDistort = useCallback((obj: any) => {
    if (!dmRef.current || !canvas) return;
    dmRef.current.toggleDistort(obj);
    saveToHistory(canvas, t('editor.distort.action'));
  }, [canvas, t, saveToHistory]);

  // Marching Ants Animation for Magic Wand and Lasso selections
  useEffect(() => {
    return () => {
      if (adjustmentHistoryTimeoutRef.current) clearTimeout(adjustmentHistoryTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = 0;
    const animate = (time: number) => {
      if (canvas && time - lastTime > 50) { // Limit to ~20fps for performance
        const selectionObjects = canvas.getObjects().filter(obj => 
          obj.name === '__magic_wand_selection__' || obj.name === '__lasso_selection__'
        );
        if (selectionObjects.length > 0) {
          selectionObjects.forEach(obj => {
            const offset = obj.get('strokeDashOffset') || 0;
            obj.set('strokeDashOffset', (offset - 0.5 + 10) % 10);
          });
          canvas.requestRenderAll();
          lastTime = time;
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [canvas]);

  const handleAddAdjustment = useCallback((type: string, skipModal: boolean = false) => {
    if (!canvas) return;
    
    // Find the best insertion position for the adjustment layer
    // We want it to cover the current artboard
    const center = getInsertionPosition(canvas);
    
    const adj = new fabric.Rect({
      originX: 'center',
      originY: 'center',
      left: center.x,
      top: center.y,
      width: artboardSize.width,
      height: artboardSize.height,
      fill: 'transparent',
      selectable: true,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      name: t(`editor.adjustments.${type}`, type),
      //@ts-ignore
      isAdjustment: true,
      //@ts-ignore
      isNewAdjustment: true,
      adjustmentType: type,
      adjustmentData: getDefaultAdjustmentData(type),
      opacity: 0.1, // Slightly visible to show it's there
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      id: `adj-${Math.random().toString(36).substr(2, 9)}`
    });

    // Se for um filtro da grade (preset), e skipModal for true, 
    // Garante que ele esteja habilitado
    if (skipModal && adj.adjustmentData && 'enabled' in adj.adjustmentData) {
      adj.adjustmentData.enabled = true;
    }

    canvas.add(adj);
    canvas.setActiveObject(adj);
    if (updateLayersRef.current) updateLayersRef.current(canvas);
    if (saveToHistoryRef.current) saveToHistoryRef.current(canvas);
    
    if (!skipModal) {
      if (type === 'levels') {
        setAdjustmentTarget(adj);
        setShowLevelsModal(true);
      } else {
        // Abre modal imediatamente
        setAdjustmentTarget(adj);
        setShowAdjustmentModal(true);
      }
    } else {
      // Se pular o modal, ainda precisamos atualizar os filtros
      refreshFilters(canvas);
    }
  }, [canvas, artboardSize, t, getDefaultAdjustmentData, refreshFilters, getInsertionPosition]);

  const { startDrawing: startLasso, draw: drawLasso, stopDrawing: stopLasso, isDrawing: isLassoDrawing } = useLasso(canvas, activeTool === 'lasso', (pathData) => {
    if (!canvas) return;
    const path = new fabric.Path(pathData, {
      fill: 'transparent',
      stroke: foreground,
      strokeWidth: 2,
      strokeDashArray: [5, 5]
    });
    canvas.add(path);
    canvas.setActiveObject(path);
    saveToHistory(canvas);
    updateLayers(canvas);
    setActiveTool('select');
  });

  const { points: penPoints, addPoint: addPenPoint, handleMouseMove: handlePenMouseMove, finishPath: finishPenPath, clearPenTool, isClosed: isPenClosed } = usePenTool(canvas, activeTool === 'pen', (pathData) => {
    if (!canvas) return;
    const path = new fabric.Path(pathData, {
      fill: 'transparent',
      stroke: foreground,
      strokeWidth: 3,
      strokeLineJoin: 'round',
      strokeLineCap: 'round',
      name: t('editor.tools.pen_path', 'Caminho da Caneta')
    });
    canvas.add(path);
    canvas.setActiveObject(path);
    clearPenTool();
    saveToHistory(canvas);
    updateLayers(canvas);
    setActiveTool('select');
  }, { strokeColor: foreground, strokeWidth: 3 });

  const deselectMagicWand = useCallback(() => {
    setMagicWandSelection(null);
    if (!canvas) return;
    const selections = canvas.getObjects().filter(obj => obj.name === '__magic_wand_selection__');
    selections.forEach(obj => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    updateLayers(canvas);
  }, [canvas, updateLayers]);

  const handleMagicWandAction = useCallback(async (action: 'copy' | 'cut' | 'duplicate' | 'erase') => {
    if (!canvas || !magicWandSelection) return;

    const targetImage = magicWandSelection.targetObj as fabric.Image;
    if (!targetImage || targetImage.type !== 'image') return;

    setIsProcessing(true);
    
    try {
      // Calcular limites da máscara uma vez
      let minX = magicWandSelection.w, minY = magicWandSelection.h;
      let maxX = 0, maxY = 0;
      let hasPixels = false;

      for(let y=0; y<magicWandSelection.h; y++) {
        for(let x=0; x<magicWandSelection.w; x++) {
          if(magicWandSelection.mask[y * magicWandSelection.w + x] > 0) {
            if(x < minX) minX = x;
            if(y < minY) minY = y;
            if(x > maxX) maxX = x;
            if(y > maxY) maxY = y;
            hasPixels = true;
          }
        }
      }

      if (!hasPixels) {
        setIsProcessing(false);
        return;
      }

      if (action === 'copy' || action === 'duplicate' || action === 'cut') {
        const dataUrl = await extractFromImage(targetImage, magicWandSelection);
        if (dataUrl) {
          await new Promise((resolve) => {
            fabric.Image.fromURL(dataUrl, (img: any) => {
              const offset = action === 'duplicate' ? 10 : 0;
              img.set({
                left: magicWandSelection.offX + minX + offset,
                top: magicWandSelection.offY + minY + offset,
                selectable: true,
                evented: true,
                id: `layer-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
              });
              
              if (action === 'copy' || action === 'cut') {
                clipboardRef.current = img;
                showToast(action === 'copy' ? t('editor.messages.copied_selection', 'Seleção copiada') : t('editor.messages.cut_selection', 'Seleção recortada'), 'success');
              } else {
                canvas.add(img);
                canvas.setActiveObject(img);
                showToast(t('editor.messages.duplicated_selection', 'Seleção duplicada'), 'success');
              }
              resolve(null);
            }, { crossOrigin: 'anonymous' });
          });
        }
      }

      if (action === 'cut' || action === 'erase') {
        const erasedUrl = await eraseFromImage(targetImage, magicWandSelection);
        if (erasedUrl) {
          await new Promise((resolve) => {
            targetImage.setSrc(erasedUrl, () => {
              canvas.renderAll();
              resolve(null);
            }, { crossOrigin: 'anonymous' });
          });
          if (action === 'erase') {
            showToast(t('editor.messages.erase_selection', 'Área apagada'), 'success');
          }
        }
      }

      canvas.renderAll();
      saveToHistory(canvas);
      updateLayers(canvas);
      
      if (action === 'cut' || action === 'erase') {
        setMagicWandSelection(null);
      }

    } catch (err) {
      console.error('Magic Wand Action Error:', err);
      showToast(t('editor.messages.error_processing_selection', 'Erro ao processar seleção'), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [canvas, magicWandSelection, t, saveToHistory, updateLayers]);

  const handleMagicWandClick = useCallback(async (pointerIdx: { x: number, y: number }, e?: MouseEvent) => {
    if (!canvas) return;

    // 1. Encontrar o objeto abaixo do cursor (exceto fundo do artboard)
    const target = canvas.findTarget(e as any, false) || canvas.getObjects().find(o => 
      o.visible && !o.id?.toString().includes('artboard') && o.containsPoint(new fabric.Point(pointerIdx.x, pointerIdx.y))
    );

    if (!target) {
      setMagicWandSelection(null);
      return;
    }

    setIsProcessing(true);

    try {
      // 2. Rasterização isolada do objeto alvo
      const br = target.getBoundingRect(true, true);
      const offX = Math.floor(br.left);
      const offY = Math.floor(br.top);
      const offW = Math.ceil(br.width);
      const offH = Math.ceil(br.height);

      if (offW <= 0 || offH <= 0) {
        setIsProcessing(false);
        return;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = offW;
      tempCanvas.height = offH;
      const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not create temp context');

      // Em vez de capturar o buffer de tela (canvas.getElement()), renderizamos
      // o objeto diretamente num contexto neutro para ignorar zoom/pan do editor
      ctx.save();
      ctx.translate(-offX, -offY);
      target.render(ctx);
      ctx.restore();

      const imgData = ctx.getImageData(0, 0, offW, offH);
      const lx = Math.round(pointerIdx.x - offX);
      const ly = Math.round(pointerIdx.y - offY);

      if (lx < 0 || ly < 0 || lx >= offW || ly >= offH) {
        setIsProcessing(false);
        return;
      }

      // 3. Executar o preenchimento
      const mask = floodFill(imgData, lx, ly, magicWandTolerance, magicWandContiguous);
      
      const newResult: SelectionResult = {
        mask,
        w: offW,
        h: offH,
        targetObj: target,
        offX,
        offY
      };

      // 4. Modo de seleção (Shift=Add, Alt=Sub)
      let mode = 'new';
      if (e?.shiftKey) mode = 'add';
      else if (e?.altKey) mode = 'sub';

      const combinedMask = combineMasks(magicWandSelection, newResult, mode);
      
      setMagicWandSelection({
        ...newResult,
        mask: combinedMask
      });

    } catch (err) {
      console.error('Magic Wand Error:', err);
      showToast(t('editor.messages.error_processing_selection', 'Erro ao processar seleção'), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [canvas, magicWandSelection, magicWandTolerance, magicWandContiguous, t]);


  useEffect(() => {
    handleMagicWandClickRef.current = handleMagicWandClick;
    startLassoRef.current = startLasso;
    drawLassoRef.current = drawLasso;
    stopLassoRef.current = stopLasso;
    addMagneticLassoPointRef.current = addMagneticLassoPoint;
    addPenPointRef.current = addPenPoint;
    handlePenMouseMoveRef.current = handlePenMouseMove;
    finishPenPathRef.current = finishPenPath;
  }, [handleMagicWandClick, startLasso, drawLasso, stopLasso, addMagneticLassoPoint, addPenPoint, handlePenMouseMove, finishPenPath]);

  // SEO Dynamic Content Mapping
  const getSEOContent = () => {
    const path = location.pathname;
    if (path.includes('/vs/canva')) {
      return {
        title: t('editor.seo.vsCanva.title'),
        description: t('editor.seo.vsCanva.description'),
        h1: t('editor.seo.vsCanva.h1'),
        text: t('editor.seo.vsCanva.text')
      };
    }
    if (path.includes('/ferramentas/remover-fundo')) {
      return {
        title: t('editor.seo.removerFundo.title'),
        description: t('editor.seo.removerFundo.description'),
        h1: t('editor.seo.removerFundo.h1'),
        text: t('editor.seo.removerFundo.text')
      };
    }
    if (path.includes('/ferramentas/vetorizador')) {
      return {
        title: t('editor.seo.vetorizador.title'),
        description: t('editor.seo.vetorizador.description'),
        h1: t('editor.seo.vetorizador.h1'),
        text: t('editor.seo.vetorizador.text')
      };
    }
    // Default SEO
    return {
      title: t('editor.seo.default.title'),
      description: t('editor.seo.default.description'),
      h1: t('editor.seo.default.h1'),
      text: t('editor.seo.default.text')
    };
  };

  const seo = getSEOContent();

  const [isOutlineMode, setIsOutlineMode] = useState(false);
  const isOutlineModeRef = useRef(false);

  const isSpaceDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const [toasts, setToasts] = useState<{ id: string, message: string, type: 'success' | 'info' | 'warning' | 'error', duration: number }[]>([]);
  const [imageAdjustments, setImageAdjustments] = useState<Record<string, any>>({});

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const saveCurrentPdfPage = useCallback(() => {
    if (!isPdfMode || !canvas) return;
    
    const updatedPages = [...pdfPages];
    updatedPages[currentPdfPageIndex] = {
      ...updatedPages[currentPdfPageIndex],
      canvasData: canvas.toJSON(FABRIC_PROPS)
    };
    setPdfPages(updatedPages);
  }, [isPdfMode, canvas, pdfPages, currentPdfPageIndex]);

  const loadPdfPage = useCallback(async (index: number, pagesToUse?: any[]) => {
    if (!canvas) return;
    
    const pages = pagesToUse || pdfPages;
    if (!pages[index]) return;

    setIsProcessing(true);
    try {
      const page = pages[index];
      
      // Clear canvas
      canvas.clear();
      
      // Set artboard size to original PDF dimensions (usually 72 DPI)
      const artW = page.originalWidth || page.width;
      const artH = page.originalHeight || page.height;
      setArtboardSize({ width: artW, height: artH });
      
      const scaleDown = artW / page.width;

      // Set background image (the original PDF page)
      if (page.backgroundImage) {
        fabric.Image.fromURL(page.backgroundImage, (img) => {
          img.set({
            selectable: false,
            evented: false,
            scaleX: scaleDown,
            scaleY: scaleDown,
            // @ts-ignore
            id: `pdf_bg_${Math.random().toString(36).substr(2, 9)}`
          });
          canvas.add(img);
          canvas.sendToBack(img);
          
          // Load fabric objects if any
          if (page.canvasData) {
            canvas.loadFromJSON(page.canvasData, () => {
              enlivenClipPathRecursive(canvas);
              canvas.renderAll();
              updateLayers(canvas);
              if (pcmRef.current) pcmRef.current.rebuildClipsFromCanvas();
            });
          } else if (page.textContent) {
            // Create editable text objects from PDF text content
            page.textContent.forEach((item: any) => {
              if (item.text.trim()) {
                // item.x and item.y from pdfService are in viewport units (scaled).
                // We need to scale them back to original units (72 DPI).
                const text = new fabric.IText(item.text, {
                  left: item.x * scaleDown,
                  top: item.y * scaleDown,
                  fontSize: item.fontSize * scaleDown,
                  fontFamily: 'Inter',
                  fill: '#000000',
                  // @ts-ignore
                  id: `pdf_text_${Math.random().toString(36).substring(2, 11)}`
                });
                canvas.add(text);
              }
            });
            canvas.renderAll();
            updateLayers(canvas);
          } else {
            canvas.renderAll();
            updateLayers(canvas);
          }

          // Center artboard after loading
          setTimeout(() => {
            centerArtboard(canvas, page.width, page.height, 1);
          }, 100);
        });
      }
      
      setCurrentPdfPageIndex(index);
    } catch (error) {
      console.error('Erro ao carregar página do PDF:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [canvas, pdfPages]);

  const handleSelectPdfPage = (index: number) => {
    saveCurrentPdfPage();
    loadPdfPage(index);
  };

  const handleDeletePdfPage = (index: number) => {
    if (pdfPages.length <= 1) return;
    const updatedPages = pdfPages.filter((_, i) => i !== index);
    setPdfPages(updatedPages);
    if (currentPdfPageIndex >= updatedPages.length) {
      loadPdfPage(updatedPages.length - 1, updatedPages);
    } else if (currentPdfPageIndex === index) {
      loadPdfPage(index, updatedPages);
    }
  };

  const handleDuplicatePdfPage = (index: number) => {
    const pageToDuplicate = pdfPages[index];
    const newPage = { ...pageToDuplicate, pageNumber: pdfPages.length + 1 };
    const updatedPages = [...pdfPages];
    updatedPages.splice(index + 1, 0, newPage);
    setPdfPages(updatedPages);
  };

  const handleRotatePdfPage = (index: number) => {
    const updatedPages = [...pdfPages];
    const page = updatedPages[index];
    // This is a simplified rotation (visual only in thumbnails for now)
    showToast(t('editor.messages.page_rotated', 'Página rotacionada'), 'info');
  };

  const handleAddBlankPdfPage = (index: number) => {
    const newPage = {
      pageNumber: pdfPages.length + 1,
      width: artboardSize.width,
      height: artboardSize.height,
      backgroundImage: null,
      canvasData: null
    };
    const updatedPages = [...pdfPages];
    updatedPages.splice(index + 1, 0, newPage);
    setPdfPages(updatedPages);
  };

  const handleReorderPdfPages = (from: number, to: number) => {
    const updatedPages = [...pdfPages];
    const [movedPage] = updatedPages.splice(from, 1);
    updatedPages.splice(to, 0, movedPage);
    setPdfPages(updatedPages);
    if (currentPdfPageIndex === from) setCurrentPdfPageIndex(to);
    else if (currentPdfPageIndex === to) setCurrentPdfPageIndex(from);
  };

  const handleExportPdf = async () => {
    saveCurrentPdfPage();
    setIsProcessing(true);
    try {
      const pdfBytes = await pdfService.exportToPdf(pdfPages, pdfFileName);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFileName || 'document.pdf';
      link.click();
      showToast(t('editor.messages.pdf_exported', 'PDF exportado com sucesso'), 'success');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      showToast(t('editor.messages.pdf_export_error', 'Erro ao exportar PDF'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOcr = async () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') {
      showToast(t('editor.messages.ocr_select_image', 'Selecione uma imagem para OCR'), 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const dataUrl = (activeObj as fabric.Image).toDataURL({});
      const text = await pdfService.performOcr(dataUrl);
      
      // Add text to canvas
      const fabricText = new fabric.IText(text, {
        left: activeObj.left,
        top: activeObj.top,
        fontSize: 20,
        fill: '#000000',
        fontFamily: 'Inter'
      });
      canvas.add(fabricText);
      canvas.setActiveObject(fabricText);
      canvas.renderAll();
      showToast(t('editor.messages.ocr_success', 'Texto reconhecido com sucesso'), 'success');
    } catch (error) {
      console.error('Erro no OCR:', error);
      showToast(t('editor.messages.ocr_error', 'Erro ao realizar OCR'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompressPdf = () => {
    showToast(t('editor.messages.feature_coming_soon', 'Funcionalidade em desenvolvimento'), 'info');
  };

  const handleProtectPdf = () => {
    showToast(t('editor.messages.feature_coming_soon', 'Funcionalidade em desenvolvimento'), 'info');
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const setActiveShapeWithRef = (shape: any) => {
    setActiveShape(shape);
    activeShapeRef.current = shape;
  };

  const [zoom, setZoom] = useState(50);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('layers');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [visionType, setVisionType] = useState('normal');
  const [refinement, setRefinement] = useState(50);
  const [showRulers, setShowRulers] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false); // Desabilitado por padrão conforme solicitado
  const snapToGridRef = useRef(snapToGrid);
  useEffect(() => { snapToGridRef.current = snapToGrid; }, [snapToGrid]);
  const smartGuidesRef = useRef<any[]>([]); // To store current active smart guide coordinates
  const [smartGuides, setSmartGuides] = useState<any[]>([]); // To trigger re-renders if needed (optional, but ref is better for Fabric)
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [activeObject, setActiveObject] = useState<any>(null);

  // Listen for Alt key to disable snapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) setIsAltPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey) setIsAltPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Auto-switch to text tab when selecting text-on-path
  useEffect(() => {
    if (activeObject && (activeObject as any).isTextOnPath) {
      setActiveTab('text');
      setIsRightSidebarOpen(true);
    }
  }, [activeObject, setActiveTab, setIsRightSidebarOpen]);
  
  useEffect(() => {
    if (!activeObject || activeObject.type !== 'i-text') {
      setContrastResult(null);
    }
  }, [activeObject]);

  const [updateTick, setUpdateTick] = useState(0);
  const forceUpdate = () => setUpdateTick(t => t + 1);
  const [workspaceSize, setWorkspaceSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const [loadingAssetId, setLoadingAssetId] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemovalProgress, setBgRemovalProgress] = useState(0);
  const [isFilling, setIsFilling] = useState(false);
  const [fillProgress, setFillProgress] = useState({ percent: 0, status: '' });

  const isLassoActive = activeTool === 'polygonal-lasso';

  // Line Tool State
  const [lineOptions, setLineOptions] = useState({
    strokeWidth: 1,
    stroke: '#ffffff',
    strokeLineCap: 'butt',
    strokeDashArray: null as number[] | null,
    opacity: 1,
    dashGap: 6,
    dashLen: 8,
    arrowType: 'none',
    lineStyle: 'solid',
  });
  const isDrawingLineRef = useRef(false);
  const lineStartPointRef = useRef<{ x: number, y: number } | null>(null);
  const linePreviewRef = useRef<fabric.Line | null>(null);
  const lineArrowPreviewsRef = useRef<fabric.Object[]>([]);
  const isDrawingTextRef = useRef(false);
  const isDrawingHighlightRef = useRef(false);
  const isDrawingUnderlineRef = useRef(false);
  const isDrawingStrikethroughRef = useRef(false);
  const isDrawingArrowRef = useRef(false);
  const isDrawingShapeRef = useRef(false);
  const shapeStartPointRef = useRef<{ x: number, y: number } | null>(null);
  const shapePreviewRef = useRef<fabric.Object | null>(null);
  const textStartPointRef = useRef<{ x: number, y: number } | null>(null);
  const textPreviewRef = useRef<fabric.Rect | null>(null);
  const isShiftDownRef = useRef(false);
  const [bgRemovalThreshold, setBgRemovalThreshold] = useState(0.5);
  const [searchQuery, setSearchQuery] = useState('');
  const [pexelsResults, setPexelsResults] = useState<any[]>([]);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [carouselPages, setCarouselPages] = useState(1);
  const [isPulsingPages, setIsPulsingPages] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [lockGuides, setLockGuides] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, submenu?: string } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showVectorizerModal, setShowVectorizerModal] = useState(false);
  const [vectorizerImageUrl, setVectorizerImageUrl] = useState('');
  const [styleClipboard, setStyleClipboard] = useState<any>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<{ x1: number, y1: number, x2: number, y2: number, active: boolean }>({ x1: 0, y1: 0, x2: 0, y2: 0, active: false });
  const [artboardTooltip, setArtboardTooltip] = useState<{ x: number, y: number, width: number, height: number, visible: boolean } | null>(null);
  
  const [iconifyResults, setIconifyResults] = useState<any[]>([]);
  const textSpeakTimeoutRef = useRef<any>(null);

  // A11y State
  const { blindMode, setBlindMode, narrationSpeed, narrateMovements } = useA11yStore();

  // Sync blindMode with showGrid
  useEffect(() => {
    if (blindMode) {
      setShowGrid(true);
    }
  }, [blindMode]);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showA11yOnboarding, setShowA11yOnboarding] = useState(false);
  const [showLayerStylesModal, setShowLayerStylesModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [adjustmentTarget, setAdjustmentTarget] = useState<any>(null);
  const [stylesTargetObject, setStylesTargetObject] = useState<any>(null);
  
  // Multi-document state
  const isSuppressingAnnouncementsRef = useRef(false);
  const [currentGridCell, setCurrentGridCell] = useState({ col: 0, row: 0 });
  const gridCursorRef = useRef<fabric.Rect | null>(null);

  const handleOpenStyles = (layer: any) => {
    const obj = layer.object || (canvas ? canvas.getObjects().find((o: any) => o.id === layer.id) : null);
    if (obj) {
      if ((obj as any).isAdjustment) {
        setAdjustmentTarget(obj);
        if (obj.adjustmentType === 'levels') {
          setShowLevelsModal(true);
        } else {
          setShowAdjustmentModal(true);
        }
      } else {
        setStylesTargetObject(obj);
        setShowLayerStylesModal(true);
      }
    }
  };

  const applyStylesToSingleObject = useCallback((obj: any, styles: any, updateMetadata = true) => {
    if (!obj) return;

    // Save styles to object metadata for persistence only if explicitly requested
    if (updateMetadata) {
      obj.set('layerStyles', styles);
    }

    // 1. Drop Shadow & Outer Glow (Fabric only supports one shadow)
    if (styles.dropShadow.enabled || styles.outerGlow.enabled || (styles.innerGlow.enabled && obj.type !== 'image')) {
      let color, blur, offsetX, offsetY;
      
      if (styles.dropShadow.enabled) {
        color = colord(styles.dropShadow.color).alpha(styles.dropShadow.opacity).toRgbString();
        blur = styles.dropShadow.blur;
        offsetX = styles.dropShadow.offsetX;
        offsetY = styles.dropShadow.offsetY;
      } else if (styles.outerGlow.enabled) {
        color = colord(styles.outerGlow.color).alpha(styles.outerGlow.opacity).toRgbString();
        blur = styles.outerGlow.blur;
        offsetX = 0;
        offsetY = 0;
      } else {
        color = colord(styles.innerGlow.color).alpha(styles.innerGlow.opacity).toRgbString();
        blur = styles.innerGlow.blur;
        offsetX = 0;
        offsetY = 0;
      }

      obj.set('shadow', new fabric.Shadow({
        color: color,
        blur: blur,
        offsetX: offsetX,
        offsetY: offsetY,
        affectStroke: true,
      }));
    } else if (styles.innerShadow.enabled) {
      const color = colord(styles.innerShadow.color).alpha(styles.innerShadow.opacity).toRgbString();
      obj.set('shadow', new fabric.Shadow({
        color: color,
        blur: styles.innerShadow.blur,
        offsetX: styles.innerShadow.offsetX,
        offsetY: styles.innerShadow.offsetY,
        affectStroke: false,
      }));
    } else {
      obj.set('shadow', null);
    }

    // 2. Stroke
    if (styles.stroke.enabled) {
      if (styles.stroke.gradient?.enabled) {
        const g = styles.stroke.gradient;
        const w = obj.width || 200;
        const h = obj.height || 200;
        const angleRad = (g.angle * Math.PI) / 180;
        const dist = Math.max(w, h);
        
        obj.set({
          stroke: new fabric.Gradient({
            type: g.type,
            coords: g.type === 'radial' ? {
              x1: w/2, y1: h/2, r1: 0,
              x2: w/2, y2: h/2, r2: dist/2
            } : {
              x1: w/2 - Math.cos(angleRad) * dist/2,
              y1: h/2 - Math.sin(angleRad) * dist/2,
              x2: w/2 + Math.cos(angleRad) * dist/2,
              y2: h/2 + Math.sin(angleRad) * dist/2,
            },
            colorStops: g.colorStops
          }),
          strokeWidth: styles.stroke.width,
          strokeUniform: true,
          opacity: styles.stroke.opacity
        });
      } else {
        const strokeColor = colord(styles.stroke.color).alpha(styles.stroke.opacity).toRgbString();
        obj.set({
          stroke: strokeColor,
          strokeWidth: styles.stroke.width,
          strokeUniform: true,
        });
      }
    } else {
      obj.set({
        stroke: null,
        strokeWidth: 0
      });
    }

    // 3. Color Overlay & Gradient Overlay & Inner Glow
    if (obj.type === 'image') {
      obj.filters = (obj.filters || []).filter((f: any) => f.type !== 'BlendColor');

      if (styles.innerGlow.enabled) {
        obj.filters.push(new fabric.Image.filters.BlendColor({
          color: styles.innerGlow.color,
          mode: 'lighten',
          alpha: styles.innerGlow.opacity
        }));
      }

      obj.applyFilters();
      obj.set({ dirty: true });
    } else {
      // For shapes and groups, apply Overlays
      if (styles.gradientOverlay.enabled) {
        const g = styles.gradientOverlay;
        const w = obj.width || 200;
        const h = obj.height || 200;
        const angleRad = (g.angle * Math.PI) / 180;
        const dist = Math.max(w, h);

        const gradient = new fabric.Gradient({
          type: g.type,
          coords: g.type === 'radial' ? {
            x1: w/2, y1: h/2, r1: 0,
            x2: w/2, y2: h/2, r2: dist/2
          } : {
            x1: w/2 - Math.cos(angleRad) * dist/2,
            y1: h/2 - Math.sin(angleRad) * dist/2,
            x2: w/2 + Math.cos(angleRad) * dist/2,
            y2: h/2 + Math.sin(angleRad) * dist/2,
          },
          colorStops: g.colorStops.map((s: any) => ({
            color: colord(s.color).alpha(g.opacity).toRgbString(),
            offset: s.offset
          }))
        });

        const applyRecursive = (o: any) => {
          if (o.getObjects && (o.type === 'group' || o.type === 'activeSelection')) {
            o.getObjects().forEach(applyRecursive);
          } else {
            if (o._lsOrigFill === undefined) o._lsOrigFill = o.fill;
            
            const blendMode = g.blendMode || 'normal';
            const op = AGPSD_TO_FABRIC[blendMode] || blendMode;
            
            o.set({
              fill: gradient,
              globalCompositeOperation: op,
              dirty: true
            });
          }
        };
        applyRecursive(obj);
      } else if (styles.colorOverlay.enabled) {
        const overlayColor = colord(styles.colorOverlay.color).alpha(styles.colorOverlay.opacity).toRgbString();
        
        const applyRecursive = (o: any) => {
          if (o.getObjects && (o.type === 'group' || o.type === 'activeSelection')) {
            o.getObjects().forEach(applyRecursive);
          } else {
            if (o._lsOrigFill === undefined) o._lsOrigFill = o.fill;
            
            const blendMode = (styles.colorOverlay as any).blendMode || 'normal';
            const op = AGPSD_TO_FABRIC[blendMode] || blendMode;
            
            o.set({
              fill: overlayColor,
              globalCompositeOperation: op,
              dirty: true
            });
          }
        };
        applyRecursive(obj);
      } else {
        const restoreRecursive = (o: any) => {
          if (o.getObjects && (o.type === 'group' || o.type === 'activeSelection')) {
            o.getObjects().forEach(restoreRecursive);
          } else {
            if (o._lsOrigFill !== undefined) {
              o.set('fill', o._lsOrigFill);
              delete o._lsOrigFill;
            }
            // Reset composite operation
            o.set({
              globalCompositeOperation: 'source-over',
              dirty: true
            });
          }
        };
        restoreRecursive(obj);
      }
    }

    // 4. Bevel & Emboss (Simulation using filters for images)
    // We filter out old bevels first
    if (obj.filters) {
      obj.filters = obj.filters.filter((f: any) => !(f as any)._isBevel);
    }
    
    if (styles.bevelEmboss?.enabled) {
      if (obj.type === 'image') {
        const depth = (styles.bevelEmboss.depth || 100) / 100;
        const size = styles.bevelEmboss.size || 1;
        const angle = (styles.bevelEmboss.angle || 120) * (Math.PI / 180);
        
        // Calculate matrix offsets based on angle
        const nx = Math.cos(angle) * depth;
        const ny = -Math.sin(angle) * depth; // Flip Y for canvas
        
        const matrix = [
          nx + ny, ny, -nx + ny,
          nx,      1,  -nx,
          nx - ny, -ny, -nx - ny
        ];
        
        const filter = new fabric.Image.filters.Convolute({
          matrix: matrix
        });
        (filter as any)._isBevel = true;
        obj.filters.push(filter);
        obj.applyFilters();
      } else {
        // For non-images, use a shadow as a poor man's bevel
        const angle = (styles.bevelEmboss.angle || 120) * (Math.PI / 180);
        const distance = styles.bevelEmboss.size || 5;
        const blur = styles.bevelEmboss.soften || 5;
        const opacity = styles.bevelEmboss.shadowOpacity || 0.5;
        
        const shadow = new fabric.Shadow({
          color: `rgba(0,0,0,${opacity})`,
          blur: blur,
          offsetX: Math.cos(angle) * distance,
          offsetY: -Math.sin(angle) * distance,
          nonScaling: true
        });
        (shadow as any)._isBevel = true;
        obj.set('shadow', shadow);
      }
      obj.set({ dirty: true });
    } else {
      // If disabled and was an image, we already filtered out the filter above
      // For non-images, we should clear the shadow if it was a bevel shadow
      if (obj.type !== 'image' && obj.shadow && (obj.shadow as any)._isBevel) {
        obj.set('shadow', null);
      }
    }

    canvas.requestRenderAll();
  }, [canvas]);

  const applyLayerStyles = useCallback((styles: any, saveHistory = false) => {
    if (!stylesTargetObject || !canvas) return;

    const applyToFolderAndDescendants = (target: any, s: any, updateMeta: boolean) => {
      applyStylesToSingleObject(target, s, updateMeta);
      
      if (target.isFolder || target.type === 'folder') {
        const children = canvas.getObjects().filter((o: any) => (o as any).parentId === target.id);
        children.forEach(child => applyToFolderAndDescendants(child, s, false));
      }
    };

    applyToFolderAndDescendants(stylesTargetObject, styles, true);

    canvas.requestRenderAll();
    if (saveHistory && saveToHistoryRef.current) saveToHistoryRef.current(canvas);
  }, [stylesTargetObject, canvas, applyStylesToSingleObject]);

  const playMacro = useCallback((macro: Macro) => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) {
      showToast(t('editor.messages.select_object_macro', 'Selecione um ou mais objetos para aplicar a ação'), 'warning');
      return;
    }

    activeObjects.forEach(obj => {
      let filtersApplied = false;
      macro.actions.forEach(action => {
        if (action.type === 'property' && action.property) {
          obj.set(action.property as any, action.value);
        } else if (action.type === 'filter' && action.data) {
          applyFiltersToObject(obj, action.data.type, action.data.data);
          filtersApplied = true;
        } else if (action.type === 'style' && action.data) {
          // Temporarily set stylesTargetObject to this object to apply styles
          // This is a bit hacky but works for now
          const originalTarget = stylesTargetObject;
          setStylesTargetObject(obj);
          applyLayerStyles(action.data, false);
          setStylesTargetObject(originalTarget);
        }
      });
      
      if (filtersApplied && obj.applyFilters) {
        obj.set({ dirty: true });
        
        const originalBackend = fabric.filterBackend;
        const isOversized = (obj.width || 0) > 2048 || (obj.height || 0) > 2048;
        if (isOversized) {
          fabric.filterBackend = new fabric.Canvas2dFilterBackend();
        }
        obj.applyFilters();
        if (isOversized) {
          fabric.filterBackend = originalBackend;
        }
      }
    });

    canvas.renderAll();
    saveToHistory(canvas, t('editor.history.apply_macro', 'Aplicar Ação: {{name}}', { name: macro.name }));
    showToast(t('editor.messages.macro_applied', 'Ação aplicada com sucesso'), 'success');
  }, [canvas, applyFiltersToObject, applyLayerStyles, stylesTargetObject, saveToHistory, t]);

  // A11y Announcer Utility
  const announce = useCallback((message: string) => {
    if (isSuppressingAnnouncementsRef.current) return;
    const el = document.getElementById('a11y-announcer');
    if (el) {
      el.textContent = '';
      setTimeout(() => { el.textContent = message; }, 50);
    }
    if (blindMode) {
      speech.speak(message);
    }
  }, [blindMode]);

  const setActiveTool = useCallback((tool: string) => {
    setActiveToolState(tool);
    activeToolRef.current = tool;

    if (tool === 'artboard') {
      setActiveTab('transform');
    }

    if (canvas) {
      canvas.isDrawingMode = tool === 'brush' || tool === 'eraser';
      
      // Bloquear desenho fora da prancheta
      if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
        const currentPagesCount = carouselPages || 1;
        const artW = artboardSize.width;
        const artH = artboardSize.height;
        const gap = 12;
        
        const clipRects: fabric.Object[] = [];
        for (let i = 0; i < currentPagesCount; i++) {
          clipRects.push(new fabric.Rect({
            left: i * (artW + gap),
            top: 0,
            width: artW,
            height: artH
          }));
        }
        
        canvas.freeDrawingBrush.clipPath = new fabric.Group(clipRects, {
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top',
          absolutePositioned: true
        });
      }

      canvas.selection = tool === 'select' || tool === 'marquee';
      canvas.defaultCursor = tool === 'select' ? 'default' : (tool === 'text' || tool === 'text-on-path' ? 'text' : 'crosshair');
      
      canvas.forEachObject(obj => {
        const isArtboard = (obj as any).id?.toString().includes('artboard');
        if (isArtboard) {
          obj.selectable = false;
          obj.evented = true; // Block marquee
          obj.hasControls = false;
          obj.hasBorders = false;
          obj.lockRotation = true;
          obj.lockMovementX = true;
          obj.lockMovementY = true;
          obj.lockScalingX = true;
          obj.lockScalingY = true;
        } else if ((obj as any).id === 'marquee_selection') {
          obj.selectable = true;
          obj.evented = true;
        } else {
          obj.selectable = tool === 'select';
          obj.evented = tool === 'select';
          obj.hoverCursor = (tool === 'text-on-path') ? 'crosshair' : (tool === 'select' ? 'move' : 'crosshair');
          // Important: Disable perPixelTargetFind for text-on-path so user can click inside the shape easily
          obj.perPixelTargetFind = tool !== 'text-on-path';
        }
      });

      if (tool !== 'select') {
        const activeObj = canvas.getActiveObject();
        if (activeObj && (activeObj as any).id?.toString().includes('artboard')) {
          canvas.discardActiveObject();
        }
      }

      canvas.requestRenderAll();
    }
    
    // Announce tool change
    const toolNames: Record<string, string> = {
      'select': t('editor.tools.select'),
      'brush': t('editor.tools.brush'),
      'eraser': t('editor.tools.eraser'),
      'text': t('editor.tools.text'),
      'shapes': t('editor.tools.shapes', 'Shapes'),
      'line': t('editor.tools.line', 'Line'),
      'polygonal-lasso': t('editor.tools.polygonal_lasso', 'Polygonal Lasso'),
      'magic-wand': t('editor.tools.magic_wand', 'Magic Wand'),
      'pen': t('editor.tools.pen', 'Pen'),
      'picker': t('editor.tools.picker'),
      'artboard': t('editor.tools.artboard', 'Artboard'),
      'highlight': t('editor.pdf.highlight', 'Highlight'),
      'underline': t('editor.pdf.underline', 'Underline'),
      'strikethrough': t('editor.pdf.strikethrough', 'Strikethrough'),
      'comment': t('editor.pdf.comment', 'Comment'),
      'stamp': t('editor.pdf.stamp', 'Stamp'),
      'arrow': t('editor.pdf.arrow', 'Arrow'),
    };
    if (toolNames[tool]) {
      announce(`${t('a11y.speech.tools.active', 'Active tool')}: ${toolNames[tool]}`);
    }
  }, [canvas, t, announce, setActiveTab]);

  // Grid Coordinate Helpers
  const pixelToGridCoord = useCallback((x: number, y: number) => {
    const col = Math.floor(x / GRID_SIZE);
    const row = Math.floor((artboardSize.height - y) / GRID_SIZE); // inverted: 1 at base
    return {
      col: numberToLetter(col),
      row: Math.max(1, row + 1),
      colIndex: col,
      rowIndex: row,
    };
  }, [artboardSize.height]);

  const objectToGridRange = useCallback((obj: fabric.Object) => {
    const bounds = obj.getBoundingRect(true);
    const topLeft = pixelToGridCoord(bounds.left!, bounds.top! + bounds.height!);
    const topRight = pixelToGridCoord(bounds.left! + bounds.width!, bounds.top!);

    const colStart = topLeft.col;
    const colEnd = topRight.col;
    const rowStart = topLeft.row;
    const rowEnd = topRight.row;

    const colSpan = Math.max(1, Math.ceil(bounds.width! / GRID_SIZE));
    const rowSpan = Math.max(1, Math.ceil(bounds.height! / GRID_SIZE));

    return { colStart, colEnd, rowStart, rowEnd, colSpan, rowSpan };
  }, [pixelToGridCoord]);

    const getObjectTypeName = useCallback((obj: fabric.Object) => {
      const names: Record<string, string> = {
      'rect': t('editor.tools.rectangle', 'Retângulo'),
      'ellipse': t('editor.tools.circle', 'Elipse'),
      'circle': t('editor.tools.circle', 'Círculo'),
      'triangle': t('editor.tools.triangle', 'Triângulo'),
      'path': t('editor.tools.brush', 'Caminho desenhado'),
      'image': t('editor.tools.image', 'Imagem'),
      'group': t('editor.panels.folder', 'Pasta'),
      'line': t('editor.tools.line', 'Linha'),
      'polygon': t('editor.tools.polygon', 'Polígono'),
      'i-text': t('editor.tools.text', 'Texto'),
      'text': t('editor.tools.text', 'Texto'),
      'textbox': t('editor.tools.text', 'Caixa de texto'),
      'polyline': t('editor.tools.brush', 'Forma livre'),
    };

    const id = (obj as any).id?.toString() || '';
    if (id.startsWith('pdf_bg')) return t('editor.pdf.background', 'Página do PDF');
    if (id.startsWith('pdf_text')) return t('editor.pdf.text', 'Texto do PDF');
    if (id.startsWith('pdf_highlight')) return t('editor.pdf.highlight', 'Destaque');
    if (id.startsWith('pdf_underline')) return t('editor.pdf.underline', 'Sublinhado');
    if (id.startsWith('pdf_strikethrough')) return t('editor.pdf.strikethrough', 'Tachado');
    if (id.startsWith('pdf_comment')) return t('editor.pdf.comment', 'Comentário');
    if (id.startsWith('pdf_stamp')) return t('editor.pdf.stamp', 'Carimbo');
    if (id.startsWith('pdf_arrow')) return t('editor.pdf.arrow', 'Seta');

    return names[obj.type!] || t('editor.common.object', 'Objeto');
  }, [t]);

  const namedColor = useCallback((hex: string | undefined | any) => {
    if (!hex || hex === 'transparent') return t('editor.constants.filters.none', 'transparente');
    if (typeof hex !== 'string') return t('editor.constants.categories.custom', 'personalizada');

    const colorMap: Record<string, string> = {
      '#ff0000': 'vermelho', '#ff4444': 'vermelho claro',
      '#00ff00': 'verde', '#00aa00': 'verde escuro',
      '#0000ff': 'azul', '#2563eb': 'azul Mosca Tee',
      '#ffff00': 'amarelo', '#ff8800': 'laranja',
      '#ff00ff': 'magenta', '#00ffff': 'ciano',
      '#ffffff': 'branco', '#000000': 'preto',
      '#333333': 'cinza escuro', '#666666': 'cinza médio',
      '#999999': 'cinza claro', '#cccccc': 'cinza muito claro',
      '#191919': 'cinza quase preto',
    };

    const lower = hex.toLowerCase();
    if (colorMap[lower]) return colorMap[lower];

    const rgb = hexToRgb(lower);
    if (!rgb) return hex;

    const { r, g, b } = rgb;
    if (r > 200 && g < 100 && b < 100) return 'tom avermelhado';
    if (r < 100 && g > 200 && b < 100) return 'tom esverdeado';
    if (r < 100 && g < 100 && b > 200) return 'tom azulado';
    if (r > 200 && g > 200 && b < 100) return 'tom amarelado';
    if (r > 200 && g < 100 && b > 200) return 'tom roxo';
    if (r > 180 && g > 180 && b > 180) return 'tom claro';
    if (r < 80 && g < 80 && b < 80) return 'tom escuro';
    return `cor personalizada (R${r} G${g} B${b})`;
  }, [t]);

  const describeColor = useCallback((obj: fabric.Object) => {
    if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
      const color = namedColor(obj.fill);
      return `Texto: "${(obj as any).text?.substring(0, 30) || ''}". Cor: ${color}. `;
    }
    if (!obj.fill || obj.fill === 'transparent') {
      const strokeColor = namedColor(obj.stroke);
      return `Sem preenchimento. Contorno ${strokeColor}. `;
    }
    return `Cor: ${namedColor(obj.fill)}. `;
  }, [namedColor]);

  const describeHorizontalPosition = useCallback((left: number, right: number, canvasWidth: number) => {
    const center = (left + right) / 2;
    const pct = center / canvasWidth;
    if (pct < 0.2) return 'extrema esquerda';
    if (pct < 0.4) return 'lado esquerdo';
    if (pct < 0.6) return 'centro horizontal';
    if (pct < 0.8) return 'lado direito';
    return 'extrema direita';
  }, []);

  const describeVerticalPosition = useCallback((top: number, bottom: number, canvasHeight: number) => {
    const center = (top + bottom) / 2;
    const pct = center / canvasHeight;
    if (pct < 0.2) return 'topo';
    if (pct < 0.4) return 'parte superior';
    if (pct < 0.6) return 'centro vertical';
    if (pct < 0.8) return 'parte inferior';
    return 'base';
  }, []);

  const describeObjectPosition = useCallback(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();

    if (!obj) {
      announce(
        'Nenhum objeto selecionado. ' +
        'Use Tab para navegar pelos objetos ou clique em um elemento.'
      );
      return;
    }

    if (obj.type === 'activeSelection') {
      const objects = (obj as fabric.ActiveSelection).getObjects();
      announce(
        `${objects.length} objetos selecionados. ` +
        `Pressione F3 com um único objeto selecionado para ouvir sua posição detalhada.`
      );
      return;
    }

    const typeName = getObjectTypeName(obj);
    const colorDesc = describeColor(obj);
    const name = (obj as any).name && !(obj as any).name.startsWith('__')
      ? `"${(obj as any).name}"`
      : typeName;

    const bounds = obj.getBoundingRect(true);
    const w = Math.round(bounds.width!);
    const h = Math.round(bounds.height!);

    let gridDesc = '';
    if (showGrid) {
      gridDesc = 'Grade ativada. ';
    }

    const relH = describeHorizontalPosition(bounds.left!, bounds.left! + bounds.width!, canvas.width!);
    const relV = describeVerticalPosition(bounds.top!, bounds.top! + bounds.height!, canvas.height!);

    const opacityDesc = obj.opacity! < 1
      ? `Opacidade: ${Math.round(obj.opacity! * 100)}%. `
      : '';

    const visibleDesc = obj.visible === false ? 'Objeto oculto. ' : '';

    const announcement =
      `${name}. ` +
      `${colorDesc}` +
      `Tamanho: ${w} por ${h} pixels. ` +
      `${gridDesc}` +
      `Posição no canvas: ${relH}, ${relV}. ` +
      `${opacityDesc}` +
      `${visibleDesc}` +
      `Rotação: ${Math.round(obj.angle || 0)} graus.`;

    announce(announcement);
    showToast(announcement.substring(0, 80) + '...', 'info', 4000);
  }, [canvas, showGrid, announce, getObjectTypeName, describeColor, objectToGridRange, describeHorizontalPosition, describeVerticalPosition]);

  const [showSmartObjectModal, setShowSmartObjectModal] = useState(false);
  const [smartObjectTarget, setSmartObjectTarget] = useState<any>(null);

  const editSmartObject = useCallback((layer: any) => {
    setSmartObjectTarget(layer.object);
    setShowSmartObjectModal(true);
  }, []);

  const handleUpdateSmartObjectSource = useCallback((newSource: string) => {
    if (!canvas || !smartObjectTarget) return;

    fabric.Image.fromURL(newSource, (img) => {
      // Keep current transforms
      const currentLeft = smartObjectTarget.left;
      const currentTop = smartObjectTarget.top;
      const currentScaleX = smartObjectTarget.scaleX;
      const currentScaleY = smartObjectTarget.scaleY;
      const currentAngle = smartObjectTarget.angle;
      const currentFlipX = smartObjectTarget.flipX;
      const currentFlipY = smartObjectTarget.flipY;
      const currentSkewX = smartObjectTarget.skewX;
      const currentSkewY = smartObjectTarget.skewY;
      const currentOriginX = smartObjectTarget.originX;
      const currentOriginY = smartObjectTarget.originY;
      const currentOpacity = smartObjectTarget.opacity;
      const currentName = smartObjectTarget.name;

      img.set({
        left: currentLeft,
        top: currentTop,
        scaleX: currentScaleX,
        scaleY: currentScaleY,
        angle: currentAngle,
        flipX: currentFlipX,
        flipY: currentFlipY,
        skewX: currentSkewX,
        skewY: currentSkewY,
        originX: currentOriginX,
        originY: currentOriginY,
        opacity: currentOpacity,
        name: currentName,
        isSmartObject: true,
        smartSource: newSource,
        originalWidth: img.width,
        originalHeight: img.height
      });

      canvas.remove(smartObjectTarget);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      saveToHistory(canvas);
      updateLayers(canvas);
      showToast(t('editor.messages.smart_object_updated', 'Conteúdo atualizado'), 'success');
    });
  }, [canvas, smartObjectTarget, t, saveToHistory, updateLayers]);

  const convertToSmartObject = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject || (activeObject as any).isSmartObject) return;

    // For images, we want the original natural data if possible
    let smartSource = '';
    if (activeObject.type === 'image') {
      const img = (activeObject as fabric.Image).getElement() as HTMLImageElement;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        smartSource = tempCanvas.toDataURL('image/png');
      }
    } else {
      smartSource = activeObject.toDataURL({ format: 'png', quality: 1 });
    }

    activeObject.clone((cloned: any) => {
      cloned.set({
        isSmartObject: true,
        smartSource: smartSource,
        originalWidth: activeObject.width,
        originalHeight: activeObject.height,
        // Ensure it keeps its current transforms
        left: activeObject.left,
        top: activeObject.top,
        scaleX: activeObject.scaleX,
        scaleY: activeObject.scaleY,
        angle: activeObject.angle,
        flipX: activeObject.flipX,
        flipY: activeObject.flipY,
        skewX: activeObject.skewX,
        skewY: activeObject.skewY,
        originX: activeObject.originX,
        originY: activeObject.originY
      });
      canvas.remove(activeObject);
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      saveToHistory(canvas);
      updateLayers(canvas);
      showToast(t('editor.messages.smart_object_created', 'Convertido em Objeto Inteligente'), 'success');
    });
  }, [canvas, t, saveToHistory, updateLayers]);

  const resetSmartObject = useCallback((layer: any) => {
    if (!canvas) return;
    const obj = layer.object;
    if (!obj || !obj.isSmartObject || !obj.smartSource) return;

    fabric.Image.fromURL(obj.smartSource, (newImg) => {
      newImg.set({
        left: obj.left,
        top: obj.top,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        isSmartObject: true,
        smartSource: obj.smartSource,
        originalWidth: obj.originalWidth,
        originalHeight: obj.originalHeight,
        name: obj.name,
        id: obj.id
      });
      canvas.remove(obj);
      canvas.add(newImg);
      canvas.setActiveObject(newImg);
      canvas.renderAll();
      saveToHistory(canvas);
      updateLayers(canvas);
      showToast(t('editor.messages.smart_object_reset', 'Tamanho original restaurado'), 'success');
    });
  }, [canvas, t, saveToHistory, updateLayers]);

  const announceCanvasSummary = useCallback(() => {
    if (!canvas) return;
    const objects = canvas.getObjects().filter(o => !(o as any).excludeFromExport);

    if (objects.length === 0) {
      announce('Canvas vazio. Nenhum objeto adicionado ainda.');
      return;
    }

    const summary = objects.map((obj, i) => {
      const typeName = getObjectTypeName(obj);
      const name = (obj as any).name && !(obj as any).name.startsWith('__')
        ? `"${(obj as any).name}"`
        : typeName;
      if (showGrid) {
        const range = objectToGridRange(obj);
        return `${i + 1}: ${name} em ${range.colStart}${range.rowStart}`;
      }
      return `${i + 1}: ${name}`;
    }).join('. ');

    announce(
      `${objects.length} objeto${objects.length > 1 ? 's' : ''} no canvas. ` +
      summary + '. Pressione F3 para detalhes do objeto selecionado.'
    );
  }, [canvas, showGrid, announce, getObjectTypeName, objectToGridRange]);

  const moveAnnounceTimerRef = useRef<any>(null);

  const announceObjectMovement = useCallback((obj: fabric.Object) => {
    clearTimeout(moveAnnounceTimerRef.current);
    moveAnnounceTimerRef.current = setTimeout(() => {
      if (!obj) return;

      let announcement = '';

      if (showGrid) {
        announcement = `Objeto posicionado na grade.`;
      } else {
        const bounds = obj.getBoundingRect(true);
        announcement =
          `Posição: ${Math.round(bounds.left!)} por ${Math.round(bounds.top!)} pixels.`;
      }

      announce(announcement);
    }, 300);
  }, [showGrid, announce, objectToGridRange]);

  const removeGridCoordinates = useCallback(() => {
    if (!canvas) return;
    const coords = canvas.getObjects().filter(obj => (obj as any).name === '__grid_coord__');
    canvas.remove(...coords);
  }, [canvas]);

  const renderGridCoordinates = useCallback((cols: number, rows: number) => {
    // Coordinates (numbers and letters) removed as requested
    if (!canvas) return;
    removeGridCoordinates();
  }, [canvas, removeGridCoordinates]);

  const showGridCursor = useCallback((col: number, row: number) => {
    if (!canvas) return;
    if (!gridCursorRef.current) {
      gridCursorRef.current = new fabric.Rect({
        stroke: '#2563EB',
        strokeWidth: 2,
        fill: 'rgba(37,99,235,0.12)',
        strokeDashArray: [4, 2],
        selectable: false,
        evented: false,
        // @ts-ignore
        excludeFromExport: true,
        name: '__grid_cursor__',
      });
      canvas.add(gridCursorRef.current);
    }

    gridCursorRef.current.set({
      left: col * GRID_SIZE,
      top: row * GRID_SIZE,
      width: GRID_SIZE,
      height: GRID_SIZE,
    });
    canvas.bringToFront(gridCursorRef.current);
    canvas.renderAll();
  }, [canvas]);

  const hideGridCursor = useCallback(() => {
    if (gridCursorRef.current && canvas) {
      canvas.remove(gridCursorRef.current);
      gridCursorRef.current = null;
      canvas.renderAll();
    }
  }, [canvas]);

  const moveGridCursor = useCallback((dcol: number, drow: number) => {
    if (!canvas) return;
    const cols = Math.floor(canvas.width! / GRID_SIZE);
    const rows = Math.floor(canvas.height! / GRID_SIZE);

    const newCol = Math.max(0, Math.min(cols - 1, currentGridCell.col + dcol));
    const newRow = Math.max(0, Math.min(rows - 1, currentGridCell.row + drow));
    
    setCurrentGridCell({ col: newCol, row: newRow });

    const colLetter = numberToLetter(newCol);
    const rowNumber = rows - newRow; // inverted: 1 at base

    showGridCursor(newCol, newRow);

    const cellX = newCol * GRID_SIZE + GRID_SIZE / 2;
    const cellY = newRow * GRID_SIZE + GRID_SIZE / 2;
    const objAtCell = canvas.getObjects().find(obj => {
      if ((obj as any).excludeFromExport) return false;
      const b = obj.getBoundingRect(true);
      return cellX >= b.left! && cellX <= b.left! + b.width! &&
             cellY >= b.top! && cellY <= b.top! + b.height!;
    });

    let announcement = `Célula ${colLetter}${rowNumber}.`;
    if (objAtCell) {
      const typeName = getObjectTypeName(objAtCell);
      const colorDesc = describeColor(objAtCell);
      announcement += ` Contém: ${typeName}. ${colorDesc}`;
      canvas.setActiveObject(objAtCell);
      canvas.renderAll();
    } else {
      announcement += ' Vazia.';
    }

    announce(announcement);
  }, [canvas, currentGridCell, announce, getObjectTypeName, describeColor, showGridCursor]);

  // A11y Initialization
  useEffect(() => {
    speech.setEnabled(blindMode);
    speech.setLang(i18n.language);
    speech.setRate(narrationSpeed);
    
    if (blindMode) {
      const onboardingDone = localStorage.getItem('moscatee_a11y_onboarding_done');
      if (!onboardingDone) {
        setShowA11yOnboarding(true);
      }
      // Only announce if it was just turned on (to avoid repeating on every render)
      // But since blindMode is in dependency array, it's fine.
    }
  }, [blindMode, i18n.language, narrationSpeed]);

  // Keyboard Shortcuts for Blind Mode
  useEffect(() => {
    if (!blindMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }

      const key = e.key.toLowerCase();
      
      if (key === 'v') { setActiveTool('select'); }
      else if (key === 'b') { setActiveTool('brush'); }
      else if (key === 'e') { setActiveTool('eraser'); }
      else if (key === 't') { setActiveTool('text'); }
      else if (key === 's') { setActiveTool('shapes'); }
      else if (key === 'p') { setActiveTool('pen'); }
      else if (key === 'i') { setActiveTool('picker'); }
      else if (key === 'f3') {
        if (canvas) {
          const active = canvas.getActiveObject();
          if (active && (active.type === 'image' || (active as any).isIcon)) {
            const description = (active as any).name || (active as any).alt || t('editor.tools.image');
            announce(t('a11y.speech.object.describe', { description }));
          } else {
            describeObjectPosition();
          }
        }
      }
      else if (key === 'f9') {
        if (canvas) {
          const active = canvas.getActiveObject();
          if (active && !(active as any).id?.toString().includes('artboard')) {
            const x = Math.round(active.left!);
            const y = Math.round(active.top!);
            announce(t('a11y.speech.object.position', { x, y }));
          }
        }
      }
      else if (key === 'f6') {
        e.preventDefault();
        announceCanvasSummary();
      }
      else if (key === 'g') {
        e.preventDefault();
        setShowGrid(prev => !prev);
      }
      else if (key === 'tab' && showGrid) {
        e.preventDefault();
        if (e.shiftKey) {
          moveGridCursor(-1, 0);
        } else if (e.ctrlKey) {
          moveGridCursor(0, 1);
        } else {
          moveGridCursor(1, 0);
        }
      }
      else if (key === 'f10') { setShowShortcutsModal(true); }
      else if (key === 'h') { setShowHelpModal(true); }
      else if (key === 'f1') {
        if (canvas) {
          const count = canvas.getObjects().filter(obj => !(obj as any).id?.toString().includes('artboard')).length;
          announce(t('a11y.speech.canvas.description', { count }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blindMode, canvas, announce, t]);

  useEffect(() => {
    if (!blindMode) return;
    
    const tabNames: Record<string, string> = {
      'layers': t('editor.tabs.layers', 'Camadas'),
      'text': t('editor.tabs.text', 'Texto'),
      'image-adjust': t('editor.tabs.adjustments', 'Filtros'),
      'color': t('editor.tabs.color', 'Cor'),
      'transform': t('editor.tabs.transform', 'Transformar'),
      'assets': t('editor.tabs.library', 'Biblioteca'),
    };
    
    if (tabNames[activeTab]) {
      announce(`${t('a11y.speech.tab.active', 'Painel ativo')}: ${tabNames[activeTab]}`);
    }
  }, [activeTab, blindMode, t, announce]);

  const [guides, setGuides] = useState<Guide[]>([]);
  const guidesRef = useRef(guides);
  useEffect(() => { guidesRef.current = guides; }, [guides]);
  const [ghostGuide, setGhostGuide] = useState<{ type: 'horizontal' | 'vertical', position: number } | null>(null);

  const [pexelsPage, setPexelsPage] = useState(1);
  const [hasMorePexels, setHasMorePexels] = useState(true);
  const [hasMoreIconify, setHasMoreIconify] = useState(true);

  const addGuide = (type: 'horizontal' | 'vertical', position: number) => {
    if (!canvas) return;
    
    const newGuide: Guide = { 
      id: Math.random().toString(36).substr(2, 9), 
      type, 
      position,
      color: '#00ffff'
    };
    
    setGuides(prev => [...prev, newGuide]);
    setShowGuides(true);
  };

  const removeGuide = (id: string) => {
    setGuides(prev => prev.filter(g => g.id !== id));
    setSelectedGuideIds(prev => prev.filter(gid => gid !== id));
  };

  const renameLayer = (id: string, newName: string) => {
    const layer = layers.find(l => l.id === id);
    if (layer && layer.object) {
      layer.object.set('name', newName);
      canvas?.renderAll();
      updateLayers(canvas!);
      saveToHistory(canvas!);
    }
    setEditingLayerId(null);
  };

  const [lastSelectedLayerId, setLastSelectedLayerId] = useState<string | null>(null);

  const handleLayerClick = (e: React.MouseEvent, layer: Layer) => {
    if (!canvas) return;

    if (e.shiftKey && lastSelectedLayerId) {
      const currentIndex = layers.findIndex(l => l.id === layer.id);
      const lastIndex = layers.findIndex(l => l.id === lastSelectedLayerId);
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      const rangeIds = layers.slice(start, end + 1).map(l => l.id);
      
      const newSelection = Array.from(new Set([...selectedLayerIds, ...rangeIds]));
      setSelectedLayerIds(newSelection);
      setLastSelectedLayerId(layer.id);
      
      const selectedObjects = layers
        .filter(l => newSelection.includes(l.id))
        .map(l => l.object)
        .filter(obj => !(obj as any).id?.toString().includes('artboard'));
      
      if (selectedObjects.length > 1) {
        const selection = new fabric.ActiveSelection(selectedObjects, { canvas });
        canvas.setActiveObject(selection);
      } else if (selectedObjects.length === 1) {
        canvas.setActiveObject(selectedObjects[0]);
      }
    } else if (e.ctrlKey || e.metaKey || e.shiftKey) {
      // If shift is held but no lastSelectedLayerId, or if user wants to toggle individual layers with shift
      // Many users expect Shift to also work as a toggle if they are clicking one by one
      const newSelection = selectedLayerIds.includes(layer.id)
        ? selectedLayerIds.filter(id => id !== layer.id)
        : [...selectedLayerIds, layer.id];
      
      setSelectedLayerIds(newSelection);
      setLastSelectedLayerId(layer.id);
      
      const selectedObjects = layers
        .filter(l => newSelection.includes(l.id))
        .map(l => l.object)
        .filter(obj => !(obj as any).id?.toString().includes('artboard'));
      
      if (selectedObjects.length > 1) {
        const selection = new fabric.ActiveSelection(selectedObjects, { canvas });
        canvas.setActiveObject(selection);
      } else if (selectedObjects.length === 1) {
        canvas.setActiveObject(selectedObjects[0]);
      } else {
        canvas.discardActiveObject();
      }
    } else {
      const isArtboard = layer.object.id?.toString().includes('artboard');
      if (!isArtboard) {
        setSelectedLayerIds([layer.id]);
        setLastSelectedLayerId(layer.id);
        canvas.setActiveObject(layer.object);
      } else {
        // Clicar na prancheta na camada apenas limpa a seleção, sem torná-la ativa
        setSelectedLayerIds([layer.id]);
        setLastSelectedLayerId(layer.id);
        canvas.discardActiveObject();
      }
    }
    canvas.renderAll();
  };

  const copyStyle = useCallback(() => {
    if (!canvas || !activeObject) return;
    const style = {
      fill: activeObject.fill,
      stroke: activeObject.stroke,
      strokeWidth: activeObject.strokeWidth,
      opacity: activeObject.opacity,
      shadow: activeObject.shadow ? { ...activeObject.shadow } : null,
      fontFamily: activeObject.fontFamily,
      fontSize: activeObject.fontSize,
      fontWeight: activeObject.fontWeight,
      fontStyle: activeObject.fontStyle,
      textAlign: activeObject.textAlign,
      lineHeight: activeObject.lineHeight,
    };
    setStyleClipboard(style);
  }, [canvas, activeObject]);

  const pasteStyle = useCallback(() => {
    if (!canvas || !activeObject || !styleClipboard) return;
    
    const propsToApply: any = {
      fill: styleClipboard.fill,
      stroke: styleClipboard.stroke,
      strokeWidth: styleClipboard.strokeWidth,
      opacity: styleClipboard.opacity,
      shadow: styleClipboard.shadow ? new fabric.Shadow(styleClipboard.shadow) : null,
    };

    if (activeObject.type === 'i-text' || activeObject.type === 'text') {
      propsToApply.fontFamily = styleClipboard.fontFamily;
      propsToApply.fontSize = styleClipboard.fontSize;
      propsToApply.fontWeight = styleClipboard.fontWeight;
      propsToApply.fontStyle = styleClipboard.fontStyle;
      propsToApply.textAlign = styleClipboard.textAlign;
      propsToApply.lineHeight = styleClipboard.lineHeight;
    }

    activeObject.set(propsToApply);
    canvas.renderAll();
    saveToHistory(canvas);
  }, [canvas, activeObject, styleClipboard]);

  const handleSelectSubject = () => {
    if (!canvas || !activeObject || activeObject.type !== 'image') return;
    showToast(t('editor.messages.select_subject_not_implemented', 'Seleção de Assunto será implementada em breve com IA local.'), 'info');
  };

  const handleExport = async (options: ExportOptions) => {
    if (!canvas) return;
    
    const { format, multiplier, exportLayers } = options;

    if (exportLayers) {
      try {
        setIsProcessing(true);
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const objects = canvas.getObjects().filter(obj => 
          !(obj as any).isGridLine && 
          !(obj as any).id?.toString().includes('artboard') &&
          (obj as any).name !== '__grid__' &&
          (obj as any).name !== '__grid_coord__' &&
          (obj as any).name !== '__grid_cursor__' &&
          (obj as any).id !== 'grid_rect'
        );
        
        // Save original visibilities
        const originalVisibilities = objects.map(obj => obj.visible);
        
        for (let i = 0; i < objects.length; i++) {
          const obj = objects[i];
          
          // Hide all objects
          objects.forEach(o => o.set('visible', false));
          // Show only current object
          obj.set('visible', true);
          canvas.renderAll();
          
          // Get bounding box
          const boundingRect = obj.getBoundingRect();
          
          const dataURL = canvas.toDataURL({
            format: 'png',
            multiplier: multiplier,
            left: boundingRect.left,
            top: boundingRect.top,
            width: boundingRect.width,
            height: boundingRect.height
          });
          
          const base64Data = dataURL.split(',')[1];
          const name = (obj as any).name || `${obj.type}-${i + 1}`;
          zip.file(`${name}.png`, base64Data, { base64: true });
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mosca-tee-layers.zip';
        link.click();
        
        // Restore visibilities
        objects.forEach((o, idx) => o.set('visible', originalVisibilities[idx]));
        canvas.renderAll();
        showToast(t('editor.messages.layers_exported', 'Camadas exportadas com sucesso'), 'success');
      } catch (error) {
        console.error('Error exporting layers:', error);
        showToast(t('editor.messages.export_layers_error', 'Erro ao exportar camadas'), 'error');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    await exportCanvas(format, options);
  };

  const handleVectorizerApply = (svgString: string) => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    
    fabric.loadSVGFromString(svgString, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options);
      
      if (activeObject) {
        // Copia propriedades do objeto original
        obj.set({
          left: activeObject.left,
          top: activeObject.top,
          scaleX: activeObject.scaleX,
          scaleY: activeObject.scaleY,
          angle: activeObject.angle,
          originX: activeObject.originX,
          originY: activeObject.originY,
        });
        // Remove o original
        canvas.remove(activeObject);
      } else {
        obj.set({
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
        });
      }
      
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
      updateLayers(canvas);
      saveToHistory(canvas);
      setShowVectorizerModal(false);
    });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    // Recuperar evento já capturado pelo index.html
    if ((window as any).__deferredInstallPrompt) {
      deferredInstallPrompt = (window as any).__deferredInstallPrompt;
      setCanInstallPWA(true);
      console.log('✅ Prompt recuperado do window');
    }

    // Capturar se ainda não foi disparado
    const handler = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      (window as any).__deferredInstallPrompt = e;
      setCanInstallPWA(true);
      console.log('✅ beforeinstallprompt capturado');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detectar se já está instalado
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      (window as any).__deferredInstallPrompt = null;
      setCanInstallPWA(false);
      console.log('✅ PWA instalado com sucesso');
    });

    // Diagnóstico — remover após confirmar funcionamento
    setTimeout(() => {
      console.log('Estado após 3s:', {
        deferredPrompt: deferredInstallPrompt,
        canInstall: canInstallPWA,
      });
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallPWA = async () => {
    console.log('Botão clicado, deferredPrompt:', deferredInstallPrompt);
      
    if (!deferredInstallPrompt) {
      // Fallback: abrir instruções manuais
      alert(t('editor.messages.pwa_manual_install'));
      return;
    }

    try {
      await deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      console.log(`PWA install outcome: ${outcome}`);
      if (outcome === 'accepted') {
        deferredInstallPrompt = null;
        setCanInstallPWA(false);
      }
    } catch (err) {
      console.error('Error during PWA installation:', err);
    }
  };
  const [unit, setUnit] = useState<'px' | 'cm' | 'mm' | 'in' | 'percent'>('px');
  const [canvasPreset, setCanvasPreset] = useState('instagram-post');

  // Constants are imported from ../constants/mosca


  const convertNewDocValue = (value: number, fromUnit: string, toUnit: string) => {
    const fromFactor = UNITS.find(u => u.id === fromUnit)?.factor || 1;
    const toFactor = UNITS.find(u => u.id === toUnit)?.factor || 1;
    const pxValue = value * fromFactor;
    return pxValue / toFactor;
  };

  const handleNewDocUnitChange = (toUnit: any) => {
    const convertedW = convertNewDocValue(newDocWidth, newDocUnit, toUnit);
    const convertedH = convertNewDocValue(newDocHeight, newDocUnit, toUnit);
    setNewDocWidth(convertedW);
    setNewDocHeight(convertedH);
    setNewDocUnit(toUnit);
  };

  const formatPresetSize = (wPx: number, hPx: number) => {
    const factor = UNITS.find(u => u.id === newDocUnit)?.factor || 1;
    const w = (wPx / factor).toFixed(newDocUnit === 'px' ? 0 : 2);
    const h = (hPx / factor).toFixed(newDocUnit === 'px' ? 0 : 2);
    return `${w} × ${h} ${newDocUnit}`;
  };
  const applyImageFilter = (filterId: string) => {
    if (!canvas) return;

    // IDs de filtros que são considerados "presets" (da grade da direita)
    const presetIds = IMAGE_FILTERS.map(f => f.id).filter(id => id !== 'none');
    
    // Sempre removemos presets anteriores se clicarmos em um novo ou em 'Original'
    const objects = canvas.getObjects();
    let removedAny = false;
    
    // Removemos qualquer camada de ajuste que seja um preset
    objects.forEach(obj => {
      //@ts-ignore
      if (obj.isAdjustment && presetIds.includes(obj.adjustmentType)) {
        canvas.remove(obj);
        removedAny = true;
      }
    });

    if (filterId === 'none') {
      if (removedAny) {
        refreshFilters(canvas);
        updateLayers(canvas);
        saveToHistory(canvas);
      }
      return;
    }

    // Aplica o novo filtro como uma camada de ajuste, mas pula o modal
    handleAddAdjustment(filterId, true);
  };

  const convertValue = (val: number, toUnit: string, fromUnit: string = 'px') => {
    const fromFactor = UNITS.find(u => u.id === fromUnit)?.factor || 1;
    const toFactor = UNITS.find(u => u.id === toUnit)?.factor || 1;
    
    if (toUnit === 'percent') {
      // For percent, we might need context (like canvas size), 
      // but for now let's just return the value or handle it in the UI
      return val;
    }
    
    return (val / fromFactor) * toFactor;
  };

  const formatValue = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return 0;
    const factor = UNITS.find(u => u.id === unit)?.factor || 1;
    if (unit === 'percent') return Math.round(val) || 0;
    const converted = val / factor;
    if (isNaN(converted)) return 0;
    return Number.isInteger(converted) ? converted : parseFloat(converted.toFixed(2));
  };

  const handleUnitChange = (newUnit: 'px' | 'cm' | 'mm' | 'in' | 'percent') => {
    setUnit(newUnit);
  };

  const handlePresetChange = (presetId: string) => {
    const preset = CANVAS_PRESETS.find(p => p.id === presetId);
    if (preset && preset.width && preset.height) {
      setArtboardSize({ width: preset.width, height: preset.height });
      if (canvas) {
        canvas.setDimensions({ width: preset.width, height: preset.height });
        canvas.renderAll();
      }
    }
    setCanvasPreset(presetId);
  };

  const adjustmentHistoryTimeoutRef = useRef<any>(null);
  const isAdjustmentRenderingRef = useRef(false);

  const applyImageAdjustment = (property: string, value: number) => {
    if (!activeObject || activeObject.type !== 'image' || !canvas) return;
    const img = activeObject as fabric.Image;
    const name = img.name || 'unnamed';
    
    // Update local state is fast
    setImageAdjustments(prev => {
      const updatedAdjustments = {
        ...(prev[name] || {}),
        [property]: value
      };

      // Debounce the actual filter application
      if ((img as any)._filterTimeout) clearTimeout((img as any)._filterTimeout);
      (img as any)._filterTimeout = setTimeout(() => {
        // Apply ALL current filters for this image recorded in our state
        // This ensures applyFilters() is called ONLY ONCE after all filters are updated
        img.filters = [];
        
        Object.entries(updatedAdjustments).forEach(([prop, val]) => {
          let filter;
          const v = val as number;
          switch (prop) {
            case 'brightness':
              filter = new fabric.Image.filters.Brightness({ brightness: v / 100 });
              break;
            case 'contrast':
              filter = new fabric.Image.filters.Contrast({ contrast: v / 100 });
              break;
            case 'saturation':
              filter = new fabric.Image.filters.Saturation({ saturation: v / 100 });
              break;
            case 'hue':
              filter = new fabric.Image.filters.HueRotation({ rotation: v / 100 });
              break;
            case 'blur':
              filter = new fabric.Image.filters.Blur({ blur: v / 10 });
              break;
            case 'pixelate':
              filter = new fabric.Image.filters.Pixelate({ blocksize: Math.max(1, v) });
              break;
            case 'gamma':
              const g = v / 100;
              filter = new fabric.Image.filters.Gamma({ gamma: [g, g, g] });
              break;
            case 'sharpness':
              const s = v / 100;
              filter = new fabric.Image.filters.Convolute({
                matrix: [
                  0, -s, 0,
                  -s, 1 + 4 * s, -s,
                  0, -s, 0
                ]
              });
              break;
          }

          if (filter) {
            img.filters!.push(filter);
          }
        });

        img.set({ dirty: true, objectCaching: true });

        // Fallback to Canvas2d for oversized images (> 2048px)
        const originalBackend = fabric.filterBackend;
        const isOversized = (img.width || 0) > 2048 || (img.height || 0) > 2048;
        
        if (isOversized) {
          fabric.filterBackend = new fabric.Canvas2dFilterBackend();
        }

        img.applyFilters();
        
        // Restore original backend if it was changed
        if (isOversized) {
          fabric.filterBackend = originalBackend;
        }

        canvas.requestRenderAll();
        
        // Debounce history save
        if (adjustmentHistoryTimeoutRef.current) clearTimeout(adjustmentHistoryTimeoutRef.current);
        adjustmentHistoryTimeoutRef.current = setTimeout(() => {
          saveToHistory(canvas, t('editor.history.image_adjustment', 'Ajuste de Imagem'));
          adjustmentHistoryTimeoutRef.current = null;
        }, 800);
      }, 500); // 500ms debounce as requested for input events

      return {
        ...prev,
        [name]: updatedAdjustments
      };
    });
  };

  const resetImageAdjustments = () => {
    if (!activeObject || activeObject.type !== 'image' || !canvas) return;
    const img = activeObject as fabric.Image;
    const name = img.name || 'unnamed';

    // Clear local state for this image
    setImageAdjustments(prev => {
      const newState = { ...prev };
      delete newState[name];
      return newState;
    });

    // Clear filters in Fabric.js
    img.filters = [];
    
    // Mark as dirty to force cache regeneration
    img.set('dirty', true);
    
    // Restore caching
    img.set('objectCaching', true);
    
    img.setCoords();
    
    const originalBackend = fabric.filterBackend;
    const isOversized = (img.width || 0) > 2048 || (img.height || 0) > 2048;
    if (isOversized) {
      fabric.filterBackend = new fabric.Canvas2dFilterBackend();
    }
    img.applyFilters();
    if (isOversized) {
      fabric.filterBackend = originalBackend;
    }
    
    canvas.requestRenderAll();
    saveToHistory(canvas);
    showToast(t('editor.messages.image_adjustments_reset'), 'info');
  };

  const toggleTextTransform = () => {
    if (!activeObject || activeObject.type !== 'i-text') return;
    const text = activeObject as fabric.IText;
    const current = text.text || '';
    const isUpper = current === current.toUpperCase();
    updateActiveObject('text', isUpper ? current.toLowerCase() : current.toUpperCase());
  };

  const updateTextStroke = (color: string, width: number) => {
    if (!activeObject || activeObject.type !== 'i-text') return;
    updateActiveObject('stroke', color);
    updateActiveObject('strokeWidth', width);
  };

  const updateTextShadow = (color: string, blur: number, offsetX: number, offsetY: number) => {
    if (!activeObject || activeObject.type !== 'i-text') return;
    const shadow = new fabric.Shadow({
      color,
      blur,
      offsetX,
      offsetY
    });
    updateActiveObject('shadow', shadow);
  };

  const applyTextToPath = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    const text = activeObjects.find(obj => obj.type === 'i-text' || obj.type === 'text') as fabric.IText;
    const path = activeObjects.find(obj => obj.type === 'path') as fabric.Path;

    if (!text || !path) {
      showToast(t('editor.messages.select_text_and_path', 'Selecione um texto e um caminho para aplicar'), 'warning');
      return;
    }

    // Clone path to use as text path
    path.clone((clonedPath: fabric.Path) => {
      text.set('path', clonedPath);
      // Make original path invisible or remove it
      path.set('visible', false);
      
      canvas.renderAll();
      saveToHistory(canvas);
      updateLayers(canvas);
      showToast(t('editor.messages.text_on_path_applied', 'Texto aplicado ao caminho'), 'success');
    });
  }, [canvas, t, saveToHistory, updateLayers]);

  const removeTextFromPath = useCallback(() => {
    if (!canvas || !activeObject || !activeObject.type?.includes('text')) return;
    
    if (activeObject.path) {
      activeObject.set('path', null);
      canvas.renderAll();
      saveToHistory(canvas);
      showToast(t('editor.messages.text_on_path_removed', 'Texto removido do caminho'), 'info');
    }
  }, [canvas, activeObject, t, saveToHistory]);
  const insertLoremIpsum = () => {
    if (!canvas) return;
    const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
    const text = new fabric.IText(lorem, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontFamily: 'Inter',
      fontSize: 20,
      fill: '#000000',
      originX: 'center',
      originY: 'center',
      width: 400,
      splitByGrapheme: true
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    updateLayers(canvas);
    saveToHistory(canvas);
  };
  const applyOutlineStyles = useCallback((fabricCanvas: fabric.Canvas) => {
    const objects = fabricCanvas.getObjects();
    
    // Save canvas background
    if (!(fabricCanvas as any)._originalBg) {
      (fabricCanvas as any)._originalBg = fabricCanvas.backgroundColor;
    }
    fabricCanvas.backgroundColor = '#ffffff';

    const processObject = (obj: any) => {
      if (obj.isGridLine) return;

      // Save original properties if not already saved
      if (obj.get('_originalFill') === undefined) {
        obj.set({
          _originalFill: obj.fill,
          _originalStroke: obj.stroke,
          _originalStrokeWidth: obj.strokeWidth,
          _originalOpacity: obj.opacity,
          _originalStyles: obj.styles ? JSON.parse(JSON.stringify(obj.styles)) : null
        });
      }

      // Apply outline style
      obj.set({
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 1 / fabricCanvas.getZoom(),
        opacity: 1
      });

      // Clear text styles to ensure no color in outline mode
      if (obj.type === 'i-text' || obj.type === 'text') {
        obj.styles = {};
      }

      // Special case for images
      if (obj.type === 'image') {
        if (!obj._originalRender) {
          obj._originalRender = obj._render;
        }
        
        obj._render = function(ctx: CanvasRenderingContext2D) {
          const width = this.width || 0;
          const height = this.height || 0;
          ctx.save();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1 / (fabricCanvas.getZoom() * (this.scaleX || 1));
          ctx.strokeRect(-width/2, -height/2, width, height);
          ctx.beginPath();
          ctx.moveTo(-width/2, -height/2);
          ctx.lineTo(width/2, height/2);
          ctx.moveTo(width/2, -height/2);
          ctx.lineTo(-width/2, height/2);
          ctx.stroke();
          ctx.restore();
        };
      }

      if (obj._objects) {
        obj._objects.forEach(processObject);
      }

      obj.dirty = true;
    };

    objects.forEach(processObject);
    fabricCanvas.renderAll();
  }, []);

  const restoreOriginalStyles = useCallback((fabricCanvas: fabric.Canvas) => {
    const objects = fabricCanvas.getObjects();

    const processObject = (obj: any) => {
      if (obj.isGridLine) return;

      // Restore original properties
      if (obj.get('_originalFill') !== undefined) {
        obj.set({
          fill: obj.get('_originalFill'),
          stroke: obj.get('_originalStroke'),
          strokeWidth: obj.get('_originalStrokeWidth'),
          opacity: obj.get('_originalOpacity'),
          styles: obj.get('_originalStyles') ? JSON.parse(JSON.stringify(obj.get('_originalStyles'))) : {}
        });
      }
      
      // Restore image rendering
      if (obj.type === 'image' && obj._originalRender) {
        obj._render = obj._originalRender;
      }

      if (obj._objects) {
        obj._objects.forEach(processObject);
      }

      obj.dirty = true;
    };

    objects.forEach(processObject);

    // Restore canvas background
    if ((fabricCanvas as any)._originalBg !== undefined) {
      fabricCanvas.backgroundColor = (fabricCanvas as any)._originalBg;
      delete (fabricCanvas as any)._originalBg;
    }

    fabricCanvas.renderAll();
  }, []);

  const toggleOutlineMode = useCallback(() => {
    if (!canvas) return;

    const newMode = !isOutlineMode;
    isOutlineModeRef.current = newMode;

    if (newMode) {
      applyOutlineStyles(canvas);
    } else {
      restoreOriginalStyles(canvas);
    }

    setIsOutlineMode(newMode);
  }, [canvas, isOutlineMode, applyOutlineStyles, restoreOriginalStyles]);


  const [palette, setPalette] = useState<string[]>(['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']);
  const [harmonyRule, setHarmonyRule] = useState('complementary');

  const generateHarmony = (baseColor: string, rule: string) => {
    const color = new fabric.Color(baseColor);
    const hsl = color.toHsl();
    let newPalette: string[] = [baseColor];

    switch (rule) {
      case 'complementary':
        newPalette.push(new fabric.Color(`hsl(${(hsl.h + 180) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex());
        break;
      case 'analogous':
        newPalette = [
          new fabric.Color(`hsl(${(hsl.h - 30 + 360) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex(),
          baseColor,
          new fabric.Color(`hsl(${(hsl.h + 30) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex()
        ];
        break;
      case 'triad':
        newPalette = [
          baseColor,
          new fabric.Color(`hsl(${(hsl.h + 120) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex(),
          new fabric.Color(`hsl(${(hsl.h + 240) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex()
        ];
        break;
      case 'tetrad':
        newPalette = [
          baseColor,
          new fabric.Color(`hsl(${(hsl.h + 90) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex(),
          new fabric.Color(`hsl(${(hsl.h + 180) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex(),
          new fabric.Color(`hsl(${(hsl.h + 270) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex()
        ];
        break;
      case 'split':
        newPalette = [
          baseColor,
          new fabric.Color(`hsl(${(hsl.h + 150) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex(),
          new fabric.Color(`hsl(${(hsl.h + 210) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex()
        ];
        break;
      case 'monochromatic':
        newPalette = [
          new fabric.Color(`hsl(${hsl.h}, ${hsl.s}%, ${Math.max(0, hsl.l - 20)}%)`).toHex(),
          new fabric.Color(`hsl(${hsl.h}, ${hsl.s}%, ${Math.max(0, hsl.l - 10)}%)`).toHex(),
          baseColor,
          new fabric.Color(`hsl(${hsl.h}, ${hsl.s}%, ${Math.min(100, hsl.l + 10)}%)`).toHex(),
          new fabric.Color(`hsl(${hsl.h}, ${hsl.s}%, ${Math.min(100, hsl.l + 20)}%)`).toHex()
        ];
        break;
      case 'square':
        newPalette = [
          baseColor,
          new fabric.Color(`hsl(${(hsl.h + 90) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex(),
          new fabric.Color(`hsl(${(hsl.h + 180) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex(),
          new fabric.Color(`hsl(${(hsl.h + 270) % 360}, ${hsl.s}%, ${hsl.l}%)`).toHex()
        ];
        break;
    }
    setPalette(newPalette);
  };

  const extractColorsFromImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const points = [
          { x: 0.2, y: 0.2 },
          { x: 0.8, y: 0.2 },
          { x: 0.5, y: 0.5 },
          { x: 0.2, y: 0.8 },
          { x: 0.8, y: 0.8 }
        ];
        
        const extracted: string[] = points.map(p => {
          const pixel = ctx.getImageData(Math.floor(p.x * img.width), Math.floor(p.y * img.height), 1, 1).data;
          return "#" + ("000000" + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)).slice(-6);
        });
        
        setPalette(extracted);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const GLASS_PRESETS = [
    { name: t('editor.constants.glass.clear'), fill: 'rgba(255, 255, 255, 0.2)', stroke: 'rgba(255, 255, 255, 0.3)', blur: 10 },
    { name: t('editor.constants.glass.smoke'), fill: 'rgba(0, 0, 0, 0.3)', stroke: 'rgba(255, 255, 255, 0.1)', blur: 15 },
    { name: t('editor.constants.glass.ocean'), fill: 'rgba(37, 99, 235, 0.2)', stroke: 'rgba(255, 255, 255, 0.2)', blur: 12 },
    { name: t('editor.constants.glass.frosted'), fill: 'rgba(255, 255, 255, 0.1)', stroke: 'rgba(255, 255, 255, 0.05)', blur: 25 },
    { name: 'Liquid', fill: 'rgba(255, 255, 255, 0.05)', stroke: 'rgba(255, 255, 255, 0.4)', blur: 5 },
  ];

  const applyGlassEffect = (preset: typeof GLASS_PRESETS[0]) => {
    if (!canvas || !activeObject) return;
    if (activeObject.type !== 'rect' && activeObject.type !== 'circle') {
      return;
    }

    activeObject.set({
      fill: preset.fill,
      stroke: preset.stroke,
      strokeWidth: 1,
      shadow: new fabric.Shadow({
        color: 'rgba(0, 0, 0, 0.1)',
        blur: preset.blur,
        offsetX: 0,
        offsetY: 4
      })
    });
    
    canvas.renderAll();
    saveToHistory(canvas);
  };

  const flipActiveObject = (direction: 'horizontal' | 'vertical') => {
    if (!canvas || !activeObject) return;
    
    if (direction === 'horizontal') {
      activeObject.set('flipX', !activeObject.flipX);
    } else {
      activeObject.set('flipY', !activeObject.flipY);
    }
    
    canvas.renderAll();
    saveToHistory(canvas);
  };

  const [searchType, setSearchType] = useState<'pexels' | 'iconify' | 'qrcode'>('pexels');

  useEffect(() => {
    setSelectedAssetId(null);
  }, [searchType, activeTab]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfThumbnails, setPdfThumbnails] = useState<string[]>([]);
  const [selectedPdfPages, setSelectedPdfPages] = useState<number[]>([]);
  const translationCache = useRef<Record<string, string>>({});
  const lastGeminiCall = useRef<number>(0);
  const GEMINI_COOLDOWN = 2000; // 2 seconds between calls

  const DEFAULT_IMAGE_QUERY = 'Animal, Brazil, Car, Food';
  const DEFAULT_ICON_QUERY = 'arrow';
  const initialSearchPerformed = useRef({ pexels: false, iconify: false });

  const GRADIENTS = [
    { name: t('editor.constants.gradients.ocean'), colors: ['#2E3192', '#1BFFFF'] },
    { name: t('editor.constants.gradients.sunset'), colors: ['#FF512F', '#DD2476'] },
    { name: t('editor.constants.gradients.forest'), colors: ['#134E5E', '#71B280'] },
    { name: 'Purple Bliss', colors: ['#360033', '#0b8793'] },
    { name: 'Fire', colors: ['#F00000', '#DC281E'] },
    { name: 'Deep Sea', colors: ['#061161', '#780206'] },
    { name: 'Sky', colors: ['#4CA1AF', '#C4E0E5'] },
    { name: 'Lush', colors: ['#56ab2f', '#a8e063'] },
    { name: 'Frost', colors: ['#000428', '#004e92'] },
    { name: 'Royal', colors: ['#141E30', '#243B55'] },
    { name: 'Mango', colors: ['#ffe259', '#ffa751'] },
    { name: 'Mauve', colors: ['#42275a', '#734b6d'] },
  ];

  const BLEND_MODES = [
    { label: t('editor.constants.blend_modes.normal'), value: 'source-over' },
    { label: t('editor.constants.blend_modes.darken'), value: 'darken' },
    { label: t('editor.constants.blend_modes.multiply'), value: 'multiply' },
    { label: t('editor.constants.blend_modes.color_burn'), value: 'color-burn' },
    { label: t('editor.constants.blend_modes.lighten'), value: 'lighten' },
    { label: t('editor.constants.blend_modes.screen'), value: 'screen' },
    { label: t('editor.constants.blend_modes.color_dodge'), value: 'color-dodge' },
    { label: t('editor.constants.blend_modes.overlay'), value: 'overlay' },
    { label: t('editor.constants.blend_modes.soft_light'), value: 'soft-light' },
    { label: t('editor.constants.blend_modes.hard_light'), value: 'hard-light' },
    { label: t('editor.constants.blend_modes.difference'), value: 'difference' },
    { label: t('editor.constants.blend_modes.exclusion'), value: 'exclusion' },
    { label: t('editor.constants.blend_modes.hue'), value: 'hue' },
    { label: t('editor.constants.blend_modes.saturation'), value: 'saturation' },
    { label: t('editor.constants.blend_modes.color'), value: 'color' },
    { label: t('editor.constants.blend_modes.luminosity'), value: 'luminosity' },
  ];

  // Asset Search Functions
  const translateQuery = useCallback(async (query: string, isIcon = false) => {
    if (!query) return '';
    const q = query.toLowerCase().trim();

    // Skip translation for default queries to ensure reliability
    const defaults = [
      DEFAULT_IMAGE_QUERY.toLowerCase(), 
      DEFAULT_ICON_QUERY.toLowerCase(), 
      'home', 'user', 'arrow', 'star', 'heart', 'settings', 'search', 'shopping-cart',
      'menu', 'mail', 'phone', 'facebook', 'instagram', 'twitter', 'check', 'close'
    ];
    if (defaults.includes(q)) {
      return q;
    }

    // Check cache first
    if (translationCache.current[q]) {
      return translationCache.current[q];
    }

    // 1. Try local dictionary first (even for images, many terms are common)
    if (iconTranslations[q]) {
      const result = iconTranslations[q].join(' ');
      translationCache.current[q] = result;
      return result;
    }

    // Special cases for Brazil
    if (q === 'brasil' || q === 'brazil') return 'brazil';
    if (q === 'bandeira brasil' || q === 'bandeira do brasil') return 'flag-for-brazil';

    // 2. Try partial dictionary matching (multi-word support)
    const sortedTerms = Object.keys(iconTranslations).sort((a, b) => b.length - a.length);
    let translated = q;
    let foundMatch = false;
    
    // Split query into words to check each one
    const words = q.split(/\s+/);
    const translatedWords = words.map(word => {
      if (iconTranslations[word]) {
        foundMatch = true;
        return iconTranslations[word][0];
      }
      return word;
    });

    if (foundMatch) {
      const result = translatedWords.join(' ');
      translationCache.current[q] = result;
      return result;
    }

    // 3. Fallback to Gemini only for complex translations or if dictionary fails
    // Only call Gemini if it's likely Portuguese (contains accents) or is a long phrase
    const hasAccents = /[áàâãéèêíïóôõöúçñ]/i.test(query);
    const isLongPhrase = query.split(/\s+/).length > 2;
    
    if (!hasAccents && !isLongPhrase) return query;

    // Rate limiting
    const now = Date.now();
    if (now - lastGeminiCall.current < GEMINI_COOLDOWN) {
      console.warn("Gemini cooldown active, using original query");
      return query;
    }

    try {
      lastGeminiCall.current = now;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following search term from Portuguese to English for an image/icon search API. Return ONLY the translated word or phrase: "${query}"`,
      });
      const result = response.text.trim() || query;
      translationCache.current[q] = result;
      return result;
    } catch (error: any) {
      // Graceful fallback for 429 or other API errors
      console.warn("Gemini translation failed, using original query:", error.message || error);
      return query;
    }
  }, []);

  const handleAssetClick = async (url: string, id: string, name?: string) => {
    if (selectedAssetId === id) {
      await addImageToCanvas(url, id, name);
      setSelectedAssetId(null);
    } else {
      setSelectedAssetId(id);
      if (blindMode && name) {
        speech.speak(name);
      }
    }
  };

  const searchPexels = useCallback(async (query?: string, isLoadMore = false) => {
    if (isProcessingRef.current) return;
    const rawQuery = query || searchQuery || DEFAULT_IMAGE_QUERY;
    
    // Use a ref or functional update to avoid pexelsPage dependency
    let page = 1;
    if (isLoadMore) {
      setPexelsPage(prev => {
        page = prev + 1;
        return page;
      });
    } else {
      setPexelsPage(1);
    }
    
    console.log(`Pexels Search: query="${rawQuery}", page=${page}, isLoadMore=${isLoadMore}`);
    
    // Get API key from environment variables
    const apiKey = (import.meta.env.VITE_PEXELS_KEY || '').trim();
    
    if (!apiKey) {
      console.warn('Pexels API Key is missing. Please add VITE_PEXELS_KEY to your environment variables in Settings.');
      setPexelsResults([]);
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    if (isLoadMore) setIsLoadingMore(true);
    try {
      const q = await translateQuery(rawQuery, false);
      if (!q || q.trim() === '') {
        setIsProcessing(false);
        isProcessingRef.current = false;
        return;
      }

      let results: any[] = [];
      let totalResultsCount = 0;
      const isDefault = rawQuery === DEFAULT_IMAGE_QUERY;

      if (isDefault && q.includes(',')) {
        const subQueries = q.split(',').map(s => s.trim()).filter(s => s);
        const resultsArray = await Promise.all(
          subQueries.map(async (subQ) => {
            try {
              const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(subQ)}&per_page=12&page=${page}`, {
                headers: { 'Authorization': apiKey }
              });
              if (!response.ok) return [];
              const data = await response.json();
              totalResultsCount = Math.max(totalResultsCount, data.total_results || 0);
              return data.photos || [];
            } catch (err) {
              console.error(`Sub-query error for ${subQ}:`, err);
              return [];
            }
          })
        );

        // Interleave results
        const maxLength = Math.max(...resultsArray.map(r => r.length));
        for (let i = 0; i < maxLength; i++) {
          for (const list of resultsArray) {
            if (list[i]) results.push(list[i]);
          }
        }
      } else {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=24&page=${page}`, {
          headers: {
            'Authorization': apiKey
          }
        });

        if (response.status === 401) {
          throw new Error('401 Unauthorized');
        }

        if (!response.ok) {
          throw new Error(`Erro na API do Pexels: ${response.status}`);
        }

        const data = await response.json();
        results = data.photos || [];
        totalResultsCount = data.total_results || 0;
      }
      
      if (results.length === 0 && !isDefault && !isLoadMore) {
        isProcessingRef.current = false;
        searchPexels(DEFAULT_IMAGE_QUERY);
        return;
      }
      
      if (isLoadMore) {
        setPexelsResults(prev => [...prev, ...results]);
      } else {
        setPexelsResults(results);
      }
      
      setHasMorePexels(page * 24 < totalResultsCount);
      initialSearchPerformed.current.pexels = true;
    } catch (error) {
      console.error('Pexels error:', error);
      if (error instanceof Error && error.message === '401 Unauthorized') {
        setPexelsResults([]);
        return;
      }
      if (rawQuery !== DEFAULT_IMAGE_QUERY && !isLoadMore) {
        isProcessingRef.current = false;
        searchPexels(DEFAULT_IMAGE_QUERY);
      }
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, translateQuery]);

  const searchIconify = useCallback(async (query?: string, isLoadMore = false) => {
    if (isProcessingRef.current) return;
    const rawQuery = query || searchQuery || DEFAULT_ICON_QUERY;
    
    // Use functional update to avoid iconifyResults.length dependency
    let start = 0;
    if (isLoadMore) {
      setIconifyResults(prev => {
        start = prev.length;
        return prev;
      });
    }
    
    console.log(`Iconify Search: query="${rawQuery}", start=${start}, isLoadMore=${isLoadMore}`);
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    if (isLoadMore) setIsLoadingMore(true);
    try {
      const q = await translateQuery(rawQuery, true);
      if (!q || q.trim() === '') {
        setIsProcessing(false);
        isProcessingRef.current = false;
        return;
      }
      const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(q)}&limit=96&start=${start}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API do Iconify: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        throw new Error(`Resposta inválida da API do Iconify (não é JSON): ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const results = data.icons || [];

      if (results.length === 0 && rawQuery !== DEFAULT_ICON_QUERY && !isLoadMore) {
        isProcessingRef.current = false;
        searchIconify(DEFAULT_ICON_QUERY);
        return;
      }

      if (isLoadMore) {
        setIconifyResults(prev => [...prev, ...results]);
      } else {
        setIconifyResults(results);
      }
      
      // Use total from Iconify API for better pagination
      const total = data.total || 0;
      setHasMoreIconify(start + results.length < total);
      initialSearchPerformed.current.iconify = true;
    } catch (error) {
      console.error('Iconify error:', error);
      if (rawQuery !== DEFAULT_ICON_QUERY && !isLoadMore) {
        isProcessingRef.current = false;
        searchIconify(DEFAULT_ICON_QUERY);
      }
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, translateQuery]);
  const [qrText, setQrText] = useState('');
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [pickedColor, setPickedColor] = useState('#000000');
  const [topOptions, setTopOptions] = useState({
    fontSize: 32,
    color: '#000000',
    offset: 0,
    fontFamily: 'Inter',
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false
  });

  const _topState = useRef({
    lastHighlight: null as fabric.Object | null,
    originalStroke: undefined as string | undefined,
    originalStrokeWidth: undefined as number | undefined
  });

  const _topEscapeXML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const _topEllipseToPath = (obj: fabric.Object) => {
    const matrix = obj.calcTransformMatrix();
    const cx = matrix[4];
    const cy = matrix[5];
    const rx = ((obj as any).rx || obj.width! / 2) * obj.scaleX!;
    const ry = ((obj as any).ry || obj.height! / 2) * obj.scaleY!;
    const angle = (obj.angle || 0) * Math.PI / 180;

    if (Math.abs(angle) < 0.001) {
      return [
        `M ${(cx - rx).toFixed(2)} ${cy.toFixed(2)}`,
        `A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 1 ${(cx + rx).toFixed(2)} ${cy.toFixed(2)}`,
        `A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 1 ${(cx - rx).toFixed(2)} ${cy.toFixed(2)}`,
        'Z'
      ].join(' ');
    } else {
      const p1x = (cx - rx * Math.cos(angle)).toFixed(2);
      const p1y = (cy - rx * Math.sin(angle)).toFixed(2);
      const p2x = (cx + rx * Math.cos(angle)).toFixed(2);
      const p2y = (cy + rx * Math.sin(angle)).toFixed(2);
      return [
        `M ${p1x} ${p1y}`,
        `A ${rx.toFixed(2)} ${ry.toFixed(2)} ${obj.angle!.toFixed(1)} 1 1 ${p2x} ${p2y}`,
        `A ${rx.toFixed(2)} ${ry.toFixed(2)} ${obj.angle!.toFixed(1)} 1 1 ${p1x} ${p1y}`,
        'Z'
      ].join(' ');
    }
  };

  const _topRectToPath = (obj: fabric.Object) => {
    const matrix = obj.calcTransformMatrix();
    const cx = matrix[4];
    const cy = matrix[5];
    const w = obj.getScaledWidth();
    const h = obj.getScaledHeight();
    const rx = (obj as fabric.Rect).rx || 0;
    const ry = (obj as fabric.Rect).ry || 0;
    const x = cx - w / 2;
    const y = cy - h / 2;

    if (rx === 0 && ry === 0) {
      return [
        `M ${x.toFixed(2)} ${y.toFixed(2)}`,
        `L ${(x + w).toFixed(2)} ${y.toFixed(2)}`,
        `L ${(x + w).toFixed(2)} ${(y + h).toFixed(2)}`,
        `L ${x.toFixed(2)} ${(y + h).toFixed(2)}`,
        'Z'
      ].join(' ');
    } else {
      return [
        `M ${(x + rx).toFixed(2)} ${y.toFixed(2)}`,
        `L ${(x + w - rx).toFixed(2)} ${y.toFixed(2)}`,
        `A ${rx} ${ry} 0 0 1 ${(x + w).toFixed(2)} ${(y + ry).toFixed(2)}`,
        `L ${(x + w).toFixed(2)} ${(y + h - ry).toFixed(2)}`,
        `A ${rx} ${ry} 0 0 1 ${(x + w - rx).toFixed(2)} ${(y + h).toFixed(2)}`,
        `L ${(x + rx).toFixed(2)} ${(y + h).toFixed(2)}`,
        `A ${rx} ${ry} 0 0 1 ${x.toFixed(2)} ${(y + h - ry).toFixed(2)}`,
        `L ${x.toFixed(2)} ${(y + ry).toFixed(2)}`,
        `A ${rx} ${ry} 0 0 1 ${(x + rx).toFixed(2)} ${y.toFixed(2)}`,
        'Z'
      ].join(' ');
    }
  };

  const _topTriangleToPath = (obj: fabric.Object) => {
    const matrix = obj.calcTransformMatrix();
    const cx = matrix[4];
    const cy = matrix[5];
    const w = obj.getScaledWidth();
    const h = obj.getScaledHeight();
    const x1 = cx, y1 = cy - h / 2;
    const x2 = cx + w / 2, y2 = cy + h / 2;
    const x3 = cx - w / 2, y3 = cy + h / 2;
    return [`M ${x1.toFixed(2)} ${y1.toFixed(2)}`, `L ${x2.toFixed(2)} ${y2.toFixed(2)}`, `L ${x3.toFixed(2)} ${y3.toFixed(2)}`, 'Z'].join(' ');
  };

  const _topPolygonToPath = (obj: fabric.Object, close: boolean) => {
    const matrix = obj.calcTransformMatrix();
    const cx = matrix[4];
    const cy = matrix[5];
    const points = (obj as fabric.Polygon).points || [];
    if (points.length === 0) return null;
    const offsetX = cx - ((obj as any).pathOffset?.x || 0);
    const offsetY = cy - ((obj as any).pathOffset?.y || 0);
    const parts = points.map((p, i) => {
      const ax = (p.x * obj.scaleX! + offsetX).toFixed(2);
      const ay = (p.y * obj.scaleY! + offsetY).toFixed(2);
      return (i === 0 ? 'M' : 'L') + ` ${ax} ${ay}`;
    });
    if (close) parts.push('Z');
    return parts.join(' ');
  };

  const _topGetPathData = (fabricObj: fabric.Object): string | null => {
    const type = fabricObj.type;
    if (type === 'path') {
      const raw = (fabricObj as fabric.Path).path;
      if (Array.isArray(raw)) {
        const matrix = fabricObj.calcTransformMatrix();
        const cx = matrix[4], cy = matrix[5];
        const halfW = fabricObj.width! * fabricObj.scaleX! / 2;
        const halfH = fabricObj.height! * fabricObj.scaleY! / 2;
        const ox = cx - halfW, oy = cy - halfH;
        return raw.map(cmd => {
          const [op, ...args] = cmd;
          const scaled = args.map((v, i) => (i % 2 === 0 ? (v * fabricObj.scaleX! + ox).toFixed(2) : (v * fabricObj.scaleY! + oy).toFixed(2)));
          return op + scaled.join(' ');
        }).join(' ');
      }
      return raw as unknown as string;
    }
    if (type === 'ellipse' || type === 'circle') return _topEllipseToPath(fabricObj);
    if (type === 'rect') return _topRectToPath(fabricObj);
    if (type === 'triangle') return _topTriangleToPath(fabricObj);
    if (type === 'polygon' || type === 'polyline') return _topPolygonToPath(fabricObj, type === 'polygon');
    if (type === 'group') {
      const children = (fabricObj as fabric.Group).getObjects();
      for (const child of children) {
        const d = _topGetPathData(child);
        if (d) return d;
      }
    }
    return _topRectToPath(fabricObj);
  };

  const _topClearHighlight = useCallback(() => {
    if (_topState.current.lastHighlight && canvas) {
      _topState.current.lastHighlight.set({
        stroke: _topState.current.originalStroke,
        strokeWidth: _topState.current.originalStrokeWidth
      });
      canvas.renderAll();
      _topState.current.lastHighlight = null;
    }
  }, [canvas]);

  const _topOnMouseMove = useCallback((opt: fabric.IEvent) => {
    const target = opt.target;
    if (!target) {
       if (canvas) {
         canvas.defaultCursor = 'crosshair';
         canvas.hoverCursor = 'crosshair';
       }
       if (_topState.current.lastHighlight) _topClearHighlight();
       return;
    }
    const isCompatible = target && !target.excludeFromExport && 
      !['image', 'i-text', 'text', 'textbox', 'activeSelection'].includes(target.type!);
    
    if (isCompatible && canvas) {
      canvas.defaultCursor = 'text';
      canvas.hoverCursor = 'text';
      if (_topState.current.lastHighlight !== target) {
        _topClearHighlight();
        _topState.current.lastHighlight = target;
        _topState.current.originalStroke = target.stroke;
        _topState.current.originalStrokeWidth = target.strokeWidth;
        target.set({ stroke: '#2563EB', strokeWidth: Math.max(2, target.strokeWidth || 1) });
        canvas.renderAll();
      }
    } else if (canvas) {
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
      if (_topState.current.lastHighlight) _topClearHighlight();
    }
  }, [canvas, _topClearHighlight]);

  const _topApplyTextOnPath = useCallback((fabricObj: fabric.Object, customText?: string) => {
    const text = customText || 'Digite seu texto...';
    // Use the current topOptions state
    const fontSize = topOptions.fontSize;
    const fontFamily = topOptions.fontFamily || 'Inter';
    const fillColor = topOptions.color;
    const startOffset = topOptions.offset || 0;

    const pathData = _topGetPathData(fabricObj);
    if (!pathData) {
      showToast('Não foi possível extrair o caminho desta forma', 'error');
      return;
    }

    const bounds = fabricObj.getBoundingRect(true);
    const baseCenter = { x: bounds.left! + bounds.width! / 2, y: bounds.top! + bounds.height! / 2 };
    const baseDims = { w: bounds.width!, h: bounds.height! };
    
    // Padding dinâmico inicial
    const padding = fontSize * 0.8; 
    const vbX = Math.floor(baseCenter.x - baseDims.w / 2 - padding);
    const vbY = Math.floor(baseCenter.y - baseDims.h / 2 - padding);
    const vbW = Math.ceil(baseDims.w + padding * 2);
    const vbH = Math.ceil(baseDims.h + padding * 2);
    
    const path = new fabric.Path(pathData, {
      fill: 'transparent',
      stroke: 'transparent',
      visible: false,
      selectable: false,
      evented: false
    });
    
    // Ensure isNotVisible is present and returns true for this path
    // We force override it to be safe, as visible:false might be overridden or handled differently
    // @ts-ignore
    path.isNotVisible = function() {
        return true;
    };

    const iText = new fabric.IText(text, {
      left: baseCenter.x,
      top: baseCenter.y,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: fillColor,
      fontWeight: topOptions.fontWeight,
      fontStyle: topOptions.fontStyle,
      underline: topOptions.underline,
      //@ts-ignore
      path: path,
      //@ts-ignore
      pathStartOffset: startOffset,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      //@ts-ignore
      isTextOnPath: true,
      //@ts-ignore
      originalShapeId: (fabricObj as any).id,
      //@ts-ignore
      topOptions: { ...topOptions },
      //@ts-ignore
      originalText: text,
      //@ts-ignore
      pathData: pathData
    });

    canvas?.remove(fabricObj);
    canvas?.add(iText);
    canvas?.setActiveObject(iText);
    canvas?.renderAll();
    saveToHistory(canvas!);
    updateLayers(canvas!);
    
    if (!customText) {
      showToast('Texto em Caminho criado! Você pode editar clicando diretamente.', 'success', 3000);
    }
  }, [canvas, topOptions, saveToHistory, updateLayers]);

  const _topOnMouseDown = useCallback((opt: fabric.IEvent) => {
    if (activeToolRef.current !== 'text-on-path') return;
    const target = opt.target;
    if (!target) return;
    const isCompatible = target && !target.excludeFromExport && 
      !['image', 'i-text', 'text', 'textbox', 'activeSelection'].includes(target.type!);
    if (!isCompatible) {
      showToast('Clique em uma forma (elipse, retângulo, caminho...)', 'warning');
      return;
    }
    _topClearHighlight();
    _topApplyTextOnPath(target);
    setActiveTool('select');
  }, [setActiveTool, _topClearHighlight, _topApplyTextOnPath]);

  useEffect(() => {
    if (!canvas) return;
    if (activeTool === 'text-on-path') {
      canvas.on('mouse:move', _topOnMouseMove);
      canvas.on('mouse:down', _topOnMouseDown);
      canvas.on('mouse:out', _topClearHighlight);
    } else {
      canvas.off('mouse:move', _topOnMouseMove);
      canvas.off('mouse:down', _topOnMouseDown);
      canvas.off('mouse:out', _topClearHighlight);
      _topClearHighlight();
    }
    return () => {
      canvas.off('mouse:move', _topOnMouseMove);
      canvas.off('mouse:down', _topOnMouseDown);
      canvas.off('mouse:out', _topClearHighlight);
    };
  }, [canvas, activeTool, _topOnMouseMove, _topOnMouseDown, _topClearHighlight]);

  // Sync topOptions FROM selected object
  useEffect(() => {
    if (activeObject && (activeObject as any).isTextOnPath) {
      const obj = activeObject as any;
      setTopOptions(prev => {
        const currentOpts = obj.topOptions || {
          fontSize: obj.fontSize,
          color: obj.fill,
          offset: obj.pathStartOffset || 0,
          fontFamily: obj.fontFamily,
          fontWeight: obj.fontWeight,
          fontStyle: obj.fontStyle,
          underline: obj.underline
        };

        if (prev.fontSize === currentOpts.fontSize && 
            prev.color === currentOpts.color && 
            prev.offset === currentOpts.offset &&
            prev.fontFamily === currentOpts.fontFamily &&
            prev.fontWeight === currentOpts.fontWeight &&
            prev.fontStyle === currentOpts.fontStyle &&
            prev.underline === currentOpts.underline) {
          return prev;
        }
        return {
          fontSize: currentOpts.fontSize || 32,
          color: currentOpts.color || '#000000',
          offset: currentOpts.offset || 0,
          fontFamily: currentOpts.fontFamily || 'Inter',
          fontWeight: currentOpts.fontWeight || 'normal',
          fontStyle: currentOpts.fontStyle || 'normal',
          underline: !!currentOpts.underline
        };
      });
    }
  }, [activeObject]);

  // Sync topOptions TO selected object (Live update for legacy image-based objects)
  useEffect(() => {
    if (canvas && activeObject && (activeObject as any).isTextOnPath && activeObject.type === 'image') {
      const target = activeObject as any;
      const text = target.originalText;
      const pathData = target.pathData;
      const fontFamily = topOptions.fontFamily || 'Inter';
      const fontWeight = topOptions.fontWeight || 'normal';
      const fontStyle = topOptions.fontStyle || 'normal';
      const underline = topOptions.underline ? 'underline' : 'none';
      
      const fontSize = topOptions.fontSize;
      const fillColor = topOptions.color;
      const startOffset = `${topOptions.offset}%`;

      // Estabilização Dinâmica: Usar centro fixo e expandir padding conforme fonte cresce
      let vbX, vbY, vbW, vbH;
      const padding = fontSize * 0.8;
      
      if (target.baseCenter && target.baseDims) {
        vbX = Math.floor(target.baseCenter.x - target.baseDims.w / 2 - padding);
        vbY = Math.floor(target.baseCenter.y - target.baseDims.h / 2 - padding);
        vbW = Math.ceil(target.baseDims.w + padding * 2);
        vbH = Math.ceil(target.baseDims.h + padding * 2);
      } else {
        const bounds = target.getBoundingRect(true);
        vbX = Math.floor(target.left! - (target.width! * target.scaleX! / 2) - padding);
        vbY = Math.floor(target.top! - (target.height! * target.scaleY! / 2) - padding);
        vbW = Math.ceil(target.width! * target.scaleX! + padding * 2);
        vbH = Math.ceil(target.height! * target.scaleY! + padding * 2);
      }
      
      const pathId = 'top-path-' + Date.now();
      const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" width="${vbW}" height="${vbH}" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">
  <style>
    text { 
      font-family: ${fontFamily}; 
      font-size: ${fontSize}px; 
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
      text-decoration: ${underline};
      fill: ${fillColor}; 
      white-space: pre;
    }
  </style>
  <defs><path id="${pathId}" d="${pathData}" /></defs>
  <text>
    <textPath href="#${pathId}" startOffset="${startOffset}">${_topEscapeXML(text)}</textPath>
  </text>
</svg>`.trim();

      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

      const oldProps = {
        left: target.left,
        top: target.top,
        angle: target.angle,
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        originX: target.originX,
        originY: target.originY,
        id: target.id,
        name: target.name,
        originalShapeId: target.originalShapeId
      };

      fabric.Image.fromURL(svgDataUrl, (img) => {
        if (!img || !canvas || !(canvas.getActiveObject() === target)) return;
        
        img.set({ 
          ...oldProps,
          //@ts-ignore
          isTextOnPath: true,
          //@ts-ignore
          originalText: text,
          //@ts-ignore
          pathData: pathData,
          //@ts-ignore
          topOptions: { ...topOptions },
          //@ts-ignore
          fontSize: topOptions.fontSize,
          //@ts-ignore
          fontFamily: topOptions.fontFamily,
          //@ts-ignore
          fontWeight: topOptions.fontWeight,
          //@ts-ignore
          fontStyle: topOptions.fontStyle,
          //@ts-ignore
          underline: topOptions.underline,
          //@ts-ignore
          fill: topOptions.color,
          //@ts-ignore
          baseCenter: target.baseCenter,
          //@ts-ignore
          baseDims: target.baseDims
        });
        
        canvas.remove(target);
        canvas.add(img);
        img.bringToFront();
        canvas.setActiveObject(img);
        canvas.renderAll();
      }, { crossOrigin: 'anonymous' });
    }
  }, [topOptions, canvas]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const activeToolRef = useRef('select');
  const activeShapeRef = useRef<'rectangle' | 'circle' | 'triangle' | 'star' | 'heart'>('rectangle');

  const [contrastResult, setContrastResult] = useState<{ ratio: number, status: 'aa-normal' | 'aa-large' | 'fail' } | null>(null);
  const [showAcessibilidadeInfo, setShowAcessibilidadeInfo] = useState(false);

  const getLuminance = (hex: string) => {
    const rgb = hex.replace(/^#/, '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0];
    const a = rgb.map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const getContrast = (c1: string, c2: string) => {
    const l1 = getLuminance(c1);
    const l2 = getLuminance(c2);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
  };

  const checkContrast = () => {
    if (!activeObject || activeObject.type !== 'i-text') {
      setContrastResult(null);
      return;
    }
    const textColor = activeObject.get('fill') as string;
    const canvasColor = canvas?.backgroundColor as string || '#ffffff';
    const ratio = getContrast(textColor, canvasColor);
    
    let status: 'aa-normal' | 'aa-large' | 'fail' = 'fail';
    if (ratio >= 4.5) {
      status = 'aa-normal';
    } else if (ratio >= 3) {
      status = 'aa-large';
    }
    
    setContrastResult({ ratio, status });
  };
  const [fonts, setFonts] = useState<string[]>([
    'Inter', 'Montserrat', 'Poppins', 'Arial', 'Helvetica', 
    'Times New Roman', 'Courier New', 'Georgia', 'Roboto', 
    'Open Sans', 'Lato', 'Oswald', 'Raleway', 'Nunito',
    'Josefin Sans', 'Space Mono', 'DM Sans', 'Fraunces',
    'Syne', 'Lora', 'Space Grotesk', 'Work Sans', 'Arvo'
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teeInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const clipboardRef = useRef<any>(null);
  const autoSaveIntervalRef = useRef<any>(null);
  const nativeWheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);

  // Handle active tab changes
  useEffect(() => {
    if (activeTab === 'assets') {
      if (searchType === 'pexels' && pexelsResults.length === 0) {
        searchPexels(DEFAULT_IMAGE_QUERY);
      } else if (searchType === 'iconify' && iconifyResults.length === 0) {
        searchIconify(DEFAULT_ICON_QUERY);
      }
    }
  }, [activeTab, searchType, pexelsResults.length, iconifyResults.length, searchPexels, searchIconify]);

  // Initial load
  useEffect(() => {
    if (canvas) {
      if (!initialSearchPerformed.current.pexels) {
        searchPexels(DEFAULT_IMAGE_QUERY);
      }
      if (!initialSearchPerformed.current.iconify) {
        searchIconify(DEFAULT_ICON_QUERY);
      }
    }
  }, [canvas, searchPexels, searchIconify]);

  useEffect(() => {
    if (!canvas || !activeObject || activeObject.type !== 'image' || !activeObject.get('isProcessed')) return;

    const img = activeObject as fabric.Image;
    
    // Debounce refinement application
    const timeout = setTimeout(() => {
      // Simple refinement simulation using Gamma filter
      // Gamma value between 0.1 and 2.2
      const gammaValue = 0.1 + (refinement / 100) * 2.1;
      
      img.filters = img.filters || [];
      // Remove existing gamma filter
      img.filters = img.filters.filter(f => !(f instanceof fabric.Image.filters.Gamma));
      
      // Add new gamma filter
      img.filters.push(new fabric.Image.filters.Gamma({
        gamma: [gammaValue, gammaValue, gammaValue]
      }));

      // Fallback to Canvas2d for oversized images (> 2048px)
      const originalBackend = fabric.filterBackend;
      const isOversized = (img.width || 0) > 2048 || (img.height || 0) > 2048;
      
      if (isOversized) {
        fabric.filterBackend = new fabric.Canvas2dFilterBackend();
      }

      img.applyFilters();

      // Restore original backend if it was changed
      if (isOversized) {
        fabric.filterBackend = originalBackend;
      }

      canvas.renderAll();
    }, 30);

    return () => clearTimeout(timeout);
  }, [refinement, activeObject, canvas]);


  useEffect(() => {
    // Splash screen delay - synchronized with logo animation
    // The logo animation takes about 2-2.5s total
    const timer = setTimeout(() => {
      // We don't set isLoading false here anymore, 
      // it will be set when logoAnimationDone is true
    }, 3000);

    return () => {
      clearTimeout(timer);
      
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
      
      if (containerRef.current && nativeWheelHandlerRef.current) {
        containerRef.current.removeEventListener('wheel', nativeWheelHandlerRef.current);
        nativeWheelHandlerRef.current = null;
      }

      if (canvas && !(canvas as any)._disposed) {
        try {
          canvas.dispose();
        } catch (e) {
          console.warn('Canvas disposal error:', e);
        }
      }
    };
  }, [canvas]);

  useEffect(() => {
    if (logoAnimationDone) {
      // Small delay after logo animation finishes before revealing the app
      const timer = setTimeout(() => {
        setIsLoading(false);
        const savedDraft = localStorage.getItem('moscatee_draft');
        setTimeout(() => {
          if (savedDraft) {
            setShowNewDocModal(false);
            initCanvas(JSON.parse(savedDraft));
          } else {
            setShowNewDocModal(true);
          }
        }, 300); // Give some time for the blur to fade
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [logoAnimationDone]);

  const groupSelectedElements = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'activeSelection') {
      return;
    }

    const selection = activeObject as fabric.ActiveSelection;
    const objects = selection.getObjects();
    const folderId = `folder-${generateUniqueId()}`;
    const allObjects = canvas.getObjects();
    
    let topIndex = -1;
    objects.forEach(obj => {
      const idx = allObjects.indexOf(obj);
      if (idx > topIndex) topIndex = idx;
      // @ts-ignore
      obj.parentId = folderId;
    });

    // @ts-ignore
    const folderMarker = new fabric.Folder({
      id: folderId,
      name: t('editor.panels.folder', 'Pasta'),
      isUiVisible: true
    });

    canvas.insertAt(folderMarker, topIndex + 1, false);
    canvas.requestRenderAll();
    
    setTimeout(() => {
      updateLayers(canvas);
      saveToHistory(canvas);
    }, 10);
  }, [canvas, updateLayers, saveToHistory, t]);

  const ungroupSelectedElement = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    // Caso de grupo físico legado
    if (activeObject.type === 'group' && !(activeObject as any).isFolder) {
      (activeObject as fabric.Group).toActiveSelection();
      canvas.requestRenderAll();
      updateLayers(canvas);
      saveToHistory(canvas);
      return;
    }

    // Caso de Pasta Organizational (Virtual)
    let folderId = (activeObject as any).isFolder ? (activeObject as any).id : null;
    
    // Se não selecionou a pasta, mas selecionou itens dela, tenta achar o pai comum
    if (!folderId && activeObject.type === 'activeSelection') {
      const objs = (activeObject as fabric.ActiveSelection).getObjects();
      folderId = (objs[0] as any).parentId;
      // Verifica se todos têm o mesmo pai
      if (objs.some(o => (o as any).parentId !== folderId)) folderId = null;
    } else if (!folderId) {
      folderId = (activeObject as any).parentId;
    }

    if (folderId) {
      const allObjects = canvas.getObjects();
      allObjects.forEach(obj => {
        if ((obj as any).parentId === folderId) {
          delete (obj as any).parentId;
        }
      });
      
      const folderObj = allObjects.find(o => (o as any).id === folderId);
      if (folderObj) canvas.remove(folderObj);

      canvas.requestRenderAll();
      updateLayers(canvas);
      saveToHistory(canvas);
    }
  }, [canvas, updateLayers, saveToHistory]);



  const updateBrushCursor = useCallback((c: fabric.Canvas) => {
    if (activeTool !== 'brush' && activeTool !== 'eraser') return;
    
    const size = brushSettings.size;
    const hardness = activeTool === 'eraser' ? 1 : brushSettings.hardness / 100;
    const zoomVal = c.getZoom();
    const displaySize = Math.max(4, size * zoomVal); // Garante tamanho mínimo de 4px para visibilidade

    // Criar SVG do cursor dinamicamente com alto contraste (Photoshop style: preto com borda branca)
    const svgCursor = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${displaySize + 6}" height="${displaySize + 6}">
        <!-- Círculo externo branco para visibilidade em fundos escuros -->
        <circle
          cx="${(displaySize + 6) / 2}" cy="${(displaySize + 6) / 2}" r="${(displaySize / 2) + 0.5}"
          fill="none"
          stroke="white" stroke-width="1.5"
          opacity="0.8"
        />
        <!-- Círculo principal preto solicitado pelo usuário -->
        <circle
          cx="${(displaySize + 6) / 2}" cy="${(displaySize + 6) / 2}" r="${displaySize / 2}"
          fill="none"
          stroke="black" stroke-width="1" stroke-dasharray="${hardness > 0.5 ? 'none' : '2,2'}"
          opacity="1"
        />
        <!-- Ponto central para precisão -->
        <circle
          cx="${(displaySize + 6) / 2}" cy="${(displaySize + 6) / 2}" r="0.5"
          fill="black"
        />
      </svg>
    `;

    const encoded = `data:image/svg+xml;base64,${btoa(svgCursor)}`;
    const hotspot = Math.floor((displaySize + 6) / 2);
    const cursorUrl = `url('${encoded}') ${hotspot} ${hotspot}, crosshair`;
    
    // Aplicar ao canvas do Fabric
    c.defaultCursor = cursorUrl;
    c.hoverCursor = cursorUrl;

    // Aplicar diretamente ao elemento do DOM para garantir atualização visual imediata
    const el = c.getElement()?.parentElement;
    if (el) {
      el.style.cursor = cursorUrl;
    }
  }, [activeTool, brushSettings.size, brushSettings.hardness, zoom]);

  useEffect(() => {
    if (!canvas) return;

    // Handle tool changes
    canvas.isDrawingMode = activeTool === 'brush' || activeTool === 'eraser';
    
    // Update object interactivity based on tool
    canvas.forEachObject(obj => {
      const o = obj as any;
      const isArtboard = o.id && o.id.toString().includes('artboard');
      if (isArtboard) {
        obj.selectable = false;
        obj.evented = true; // Permitem eventos para bloquear o "marquee" (seleção azul) de começar
        obj.hasControls = false;
        obj.hasBorders = false;
        obj.hoverCursor = 'default';
        obj.moveCursor = 'default';
      } else if (!o.isGridLine && o.id !== 'grid_rect' && !o._pcContent && !o._pcContainer) {
        // Objects are selectable in 'select' mode. In 'marquee' mode, we disable individual selection
        // to allow drawing the marquee area anywhere, but they can still be selected by the marquee if we wanted.
        // However, for this persistent marquee implementation, we focus on the marquee rectangle itself.
        obj.selectable = activeTool === 'select';
        obj.evented = activeTool === 'select';
        
        // Ensure marquee selection itself is always interactive
        if (o.id === 'marquee_selection') {
          obj.selectable = true;
          obj.evented = true;
        }
      }
    });
    
    if (activeTool === 'marquee') {
      canvas.selectionColor = 'rgba(255, 255, 255, 0.15)';
      canvas.selectionBorderColor = '#000000';
      canvas.selectionDashArray = [4, 4];
      canvas.selectionLineWidth = 1;
    } else {
      canvas.selectionColor = 'rgba(0, 162, 255, 0.15)';
      canvas.selectionBorderColor = '#00a2ff';
      canvas.selectionDashArray = [];
      canvas.selectionLineWidth = 1;
    }
    
    if (canvas.isDrawingMode) {
      let brush: fabric.BaseBrush;
      
      if (activeTool === 'eraser') {
        brush = new fabric.PencilBrush(canvas);
        // @ts-ignore
        brush.decimate = 0;
        brush.width = brushSettings.size;
        // O apagador usa o fundo do artboard (geralmente branco) ou o modo 'destination-out' se suportado
        // Aqui estamos simulando apagador pintando de branco
        brush.color = '#ffffff';
        brush.strokeLineCap = 'round';
        brush.strokeLineJoin = 'round';
      } else {
        if (brushSettings.tipType === 'scatter') {
          brush = new fabric.SprayBrush(canvas);
          (brush as fabric.SprayBrush).density = Math.round(brushSettings.size * 0.5);
          (brush as fabric.SprayBrush).dotWidth = Math.max(1, brushSettings.size * 0.05);
          (brush as fabric.SprayBrush).dotWidthVariance = 1;
        } else {
          brush = new fabric.PencilBrush(canvas);
          // @ts-ignore
          brush.decimate = 0;
          
          if (brushSettings.tipType.includes('square')) {
            brush.strokeLineCap = 'square';
            brush.strokeLineJoin = 'miter';
          } else {
            brush.strokeLineCap = 'round';
            brush.strokeLineJoin = 'round';
          }
        }
        
        brush.width = brushSettings.size;
        const alpha = brushSettings.opacity / 100;
        const brushColor = colord(foreground).alpha(alpha).toRgbString();
        brush.color = brushColor;
        
        if (brush instanceof fabric.PencilBrush) {
          const isSoft = brushSettings.tipType.includes('soft') || brushSettings.hardness < 100;
          
          if (isSoft) {
            // Para pincéis macios, usamos uma sombra da mesma cor para suavizar as bordas
            const blurValue = Math.round((1 - brushSettings.hardness / 100) * brushSettings.size * 1.2);
            brush.shadow = new fabric.Shadow({
              color: brushColor,
              blur: blurValue > 0 ? blurValue : 1,
              offsetX: 0,
              offsetY: 0,
            });
          } else {
            brush.shadow = null;
          }
        }
      }
      
      canvas.freeDrawingBrush = brush;
      
      // Strict Artboard Clipping for Brush
      const currentPagesCount = carouselPages || 1;
      const artW = artboardSize.width;
      const artH = artboardSize.height;
      const gap = 12;
      
      const clipRects: fabric.Object[] = [];
      for (let i = 0; i < currentPagesCount; i++) {
        clipRects.push(new fabric.Rect({
          left: i * (artW + gap),
          top: 0,
          width: artW,
          height: artH
        }));
      }
      
      canvas.freeDrawingBrush.clipPath = new fabric.Group(clipRects, {
        left: 0,
        top: 0,
        originX: 'left',
        originY: 'top',
        absolutePositioned: true
      });

      updateBrushCursor(canvas);
    } else {
      if (activeTool === 'marquee') {
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
      } else {
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move'; // Default for objects
      }
      const el = canvas.getElement().parentElement;
      if (el) el.style.cursor = canvas.defaultCursor;
    }

    canvas.selection = activeTool === 'select' || activeTool === 'marquee';
    canvas.renderAll();
  }, [activeTool, canvas, activeObject, foreground, brushSettings.size, brushSettings.hardness, brushSettings.opacity, brushSettings.tipType, updateBrushCursor, zoom, artboardSize, carouselPages]);

  const applyArtboardClip = useCallback((obj: fabric.Object) => {
    if ((obj as any).isGridLine || (obj as any).isArtboard || (obj as any).isArtboardClip) return;

    const currentPagesCount = carouselPages || 1;
    const artW = artboardSize.width;
    const artH = artboardSize.height;
    const gap = 12;

    const clipRects: fabric.Object[] = [];
    for (let i = 0; i < currentPagesCount; i++) {
        clipRects.push(new fabric.Rect({
            left: i * (artW + gap),
            top: 0,
            width: artW,
            height: artH,
        }));
    }

    const clipGroup = new fabric.Group(clipRects, {
        left: 0,
        top: 0,
        originX: 'left',
        originY: 'top',
        absolutePositioned: true
    });

    obj.set('clipPath', clipGroup);
  }, [artboardSize, carouselPages]);

  // Global Artboard Clipping to hide everything outside the valid areas
  useEffect(() => {
    if (!canvas) return;

    // Disabled global clipPath to allow controls visibility outside
    canvas.clipPath = undefined;

    // Apply clipping to all existing regular objects
    const objs = canvas.getObjects();
    objs.forEach(obj => {
      if (!obj.get('isGridLine') && !obj.get('isArtboard')) {
        applyArtboardClip(obj);
      }
    });

    const handleObjectAdded = (e: any) => {
      if (e.target) applyArtboardClip(e.target);
    };

    canvas.on('object:added', handleObjectAdded);
    canvas.requestRenderAll();

    return () => {
      canvas.off('object:added', handleObjectAdded);
    };
  }, [canvas, artboardSize, carouselPages, applyArtboardClip]);

  useEffect(() => {
    if (!canvas) return;

    const wrapper = canvas.wrapperEl;
    if (!wrapper) return;

    const onWheel = (e: WheelEvent) => {
      if (!canvas) return;
      
      // Always prevent default to avoid page scroll when interacting with canvas
      e.preventDefault();
      e.stopPropagation();

      const vpt = [...canvas.viewportTransform as number[]];

      if (e.ctrlKey || e.metaKey) {
        // ZOOM centered on cursor
        let zoomVal = canvas.getZoom();
        // Standard zoom factor for Photoshop-like feel
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoomVal *= delta;
        
        // Limits: 1% to 1000% (0.01 to 10)
        zoomVal = Math.min(Math.max(zoomVal, 0.01), 10);
        
        canvas.zoomToPoint(
          new fabric.Point(e.offsetX, e.offsetY), 
          zoomVal
        );
        
        const newVpt = canvas.viewportTransform as number[];
        setOffset({ x: newVpt[4], y: newVpt[5] });
        setZoom(Math.round(zoomVal * 100));
      } else {
        // SCROLL DISABLED - Canvas is fixed
      }

      canvas.requestRenderAll();
    };

    wrapper.addEventListener('wheel', onWheel, { passive: false });
    
    // Desativar scroll padrão do Fabric se necessário
    (canvas as any).allowTouchScrolling = false;

    return () => {
      wrapper.removeEventListener('wheel', onWheel);
    };
  }, [canvas]);

  // Handle grid and rulers
  useEffect(() => {
    if (!canvas) return;
    
    // Remove existing grid lines
    const existingGrid = canvas.getObjects().filter(obj => (obj as any).isGridLine || (obj as any).name === '__grid__');
    canvas.remove(...existingGrid);

    if (showGrid) {
      isSuppressingAnnouncementsRef.current = true;
      const width = artboardSize.width;
      const height = artboardSize.height;
      const strokeColor = '#333333';
      const strokeOpacity = 0.3;

      const firstArtboard = canvas.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().includes('artboard'));
      const artboardX = firstArtboard?.left || 0;
      const artboardY = firstArtboard?.top || 0;

      // Create vertical lines
      for (let i = 0; i <= width / GRID_SIZE; i++) {
        const line = new fabric.Line([artboardX + i * GRID_SIZE, artboardY, artboardX + i * GRID_SIZE, artboardY + height], {
          stroke: strokeColor,
          strokeWidth: 1,
          opacity: strokeOpacity,
          selectable: false,
          evented: false,
          // @ts-ignore
          isGridLine: true,
          excludeFromExport: true,
          // @ts-ignore
          aria: { hidden: true },
          name: '__grid__'
        });
        canvas.add(line);
      }

      // Create horizontal lines
      for (let i = 0; i <= height / GRID_SIZE; i++) {
        const line = new fabric.Line([artboardX, artboardY + i * GRID_SIZE, artboardX + width, artboardY + i * GRID_SIZE], {
          stroke: strokeColor,
          strokeWidth: 1,
          opacity: strokeOpacity,
          selectable: false,
          evented: false,
          // @ts-ignore
          isGridLine: true,
          excludeFromExport: true,
          // @ts-ignore
          aria: { hidden: true },
          name: '__grid__'
        });
        canvas.add(line);
      }

      // Ensure grid is above artboard but below content
      const artboard = canvas.getObjects().find(obj => (obj as any).id === 'artboard_bg');
      if (artboard) {
        const artboardIndex = canvas.getObjects().indexOf(artboard);
        const gridLines = canvas.getObjects().filter(obj => (obj as any).isGridLine);
        gridLines.forEach((line, idx) => {
          line.moveTo(artboardIndex + 1 + idx);
        });
      }

      isSuppressingAnnouncementsRef.current = false;
      
      const cols = Math.floor(width / GRID_SIZE);
      const rows = Math.floor(height / GRID_SIZE);
      
      announce(
        `Grade ativada para melhor precisão de posicionamento.`
      );

      renderGridCoordinates(cols, rows);
    } else {
      removeGridCoordinates();
      hideGridCursor();
      if (blindMode) {
        announce('Grade desativada. Navegação por coordenadas desligada.');
      }
    }
    
    canvas.requestRenderAll();
    updateLayers(canvas);
  }, [canvas, showGrid, artboardSize, blindMode, announce, renderGridCoordinates, removeGridCoordinates, hideGridCursor]);

  const ensureArtboardProperties = useCallback((c: fabric.Canvas, dimensions?: { width: number, height: number }, pages?: number) => {
    const currentPages = pages || carouselPages || 1;
    const currentWidth = Math.round(dimensions?.width || artboardSize.width);
    const currentHeight = Math.round(dimensions?.height || artboardSize.height);
    const isArtboardTool = activeToolRef.current === 'artboard';
    
    let artboardIndex = 0;
    let shadowIndex = 0;
    c.getObjects().forEach(obj => {
      const o = obj as any;
      
      // Enliven 'path' property for Text on Path objects if it's a POJO (plain object)
      if (o.type !== 'path' && o.path && typeof o.path.isNotVisible !== 'function') {
        const pathData = Array.isArray(o.path) || typeof o.path === 'string' ? o.path : o.path.path;
        if (pathData) {
          o.path = new fabric.Path(pathData, typeof o.path === 'object' ? o.path : o);
        }
      }

      if (o.id && o.id.toString().includes('artboard')) {
        const isBg = o.id.toString().startsWith('artboard_bg');
        obj.set({
          selectable: false,
          evented: true, // Bloqueia o início da seleção ("marquee") no fundo do canvas
          strokeWidth: 0,
          stroke: null,
          width: currentWidth,
          height: currentHeight,
          left: (isBg ? artboardIndex : shadowIndex) * (currentWidth + 12),
          top: 0,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          lockScalingFlip: true,
          hasControls: false,
          hasBorders: false,
          borderColor: 'transparent',
          cornerColor: 'transparent',
          padding: 0,
          hoverCursor: 'default',
          moveCursor: 'default',
          name: isBg ? (currentPages > 1 ? `${t('modals.new_doc.presets.carousel', 'Carousel')} ${artboardIndex + 1}` : t('editor.tools.artboard', 'Artboard')) : undefined
        });
        if (isBg) artboardIndex++;
        else shadowIndex++;
      } else if (!o.isGridLine && o.id !== 'grid_rect' && o.name !== '__grid_coord__' && o.name !== '__grid__') {
        obj.set({ 
          selectable: !isArtboardTool,
          evented: !isArtboardTool,
          perPixelTargetFind: true,
          subTargetCheck: true
        });
      }
    });

    // GARANTIR QUE O CLIPPING GLOBAL ESTÁ CONFIGURADO
    const artW = currentWidth;
    const artH = currentHeight;
    const gap = 12;

    const clipRects: fabric.Object[] = [];
    for (let i = 0; i < currentPages; i++) {
        clipRects.push(new fabric.Rect({
            left: Math.round(i * (artW + gap)),
            top: 0,
            width: artW,
            height: artH,
            strokeWidth: 0,
            fill: 'black'
        }));
    }

    const clipGroup = new fabric.Group(clipRects, {
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
        absolutePositioned: true,
        selectable: false,
        evented: false
    });
    
    c.clipPath = clipGroup;

    // Atualizar metadados para o clipping visual (after:render)
    (c as any)._last_pages = currentPages;
    (c as any)._last_artW = currentWidth;
    (c as any)._last_artH = currentHeight;

    c.requestRenderAll();
  }, [artboardSize, carouselPages]);

  useEffect(() => {
    if (canvas) {
      ensureArtboardProperties(canvas);
      if (activeTool !== 'artboard') {
        const activeObj = canvas.getActiveObject();
        if (activeObj && (activeObj as any).id?.toString().startsWith('artboard_bg')) {
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    }
  }, [activeTool, canvas, ensureArtboardProperties]);

  // Update artboard background when size changes
  useEffect(() => {
    if (!canvas) return;
    const artboards = canvas.getObjects().filter(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
    if (artboards.length > 0) {
      artboards.forEach((artboard, i) => {
        artboard.set({
          left: i * (artboardSize.width + 12),
          width: artboardSize.width,
          height: artboardSize.height
        });
      });
      ensureArtboardProperties(canvas);
      
      // Update canvas dimensions
      const totalWidth = carouselPages * artboardSize.width + (carouselPages - 1) * 12;

      // Atualizar metadados para o clipping visual (after:render)
      (canvas as any)._last_pages = carouselPages;
      (canvas as any)._last_artW = artboardSize.width;
      (canvas as any)._last_artH = artboardSize.height;

      canvas.setDimensions({ 
        width: Math.max(totalWidth, canvas.width || 0), 
        height: Math.max(artboardSize.height, canvas.height || 0) 
      });
      
      canvas.renderAll();
    }
  }, [artboardSize, canvas, ensureArtboardProperties]);

  const centerArtboard = useCallback((c: fabric.Canvas, width: number, height: number, pages: number) => {
    if (!containerRef.current) return;
    
    const totalWidth = pages * width + (pages - 1) * 12;
    const safeWorkspaceWidth = containerRef.current.clientWidth || 800;
    const safeWorkspaceHeight = containerRef.current.clientHeight || 600;
    
    const initialZoom = Math.max(0.01, Math.min(
      (safeWorkspaceWidth * 0.85) / totalWidth,
      (safeWorkspaceHeight * 0.85) / height
    ));
    
    const initialOffsetX = Math.round((safeWorkspaceWidth - totalWidth * initialZoom) / 2);
    const initialOffsetY = Math.round((safeWorkspaceHeight - height * initialZoom) / 2);

    c.setViewportTransform([initialZoom, 0, 0, initialZoom, initialOffsetX, initialOffsetY]);
    setZoom(Math.round(initialZoom * 100));
    setOffset({ x: initialOffsetX, y: initialOffsetY });
    setWorkspaceSize({ width: safeWorkspaceWidth, height: safeWorkspaceHeight });
  }, []);

  useEffect(() => {
    if (canvas && pendingPsdBuffer.current) {
      const psdBuffer = pendingPsdBuffer.current;
      pendingPsdBuffer.current = null;
      
      const importPsd = async () => {
        resetPdfMode();
        try {
          const { width, height } = await psdService.importFromPsd(psdBuffer, canvas);
          setArtboardSize({ width, height });
          setCarouselPages(1);
          
          setTimeout(() => {
            if (canvas) {
              centerArtboard(canvas, width, height, 1);
              saveToHistory(canvas);
              updateLayers(canvas);
              showToast(t('editor.messages.psd_imported', 'PSD importado com sucesso'), 'success');
            }
          }, 200);
        } catch (err) {
          console.error("PSD pending import error:", err);
        }
      };
      importPsd();
    }
  }, [canvas, t, centerArtboard, saveToHistory, updateLayers]);

  useEffect(() => {
    if (canvas && pendingPdfPages.current) {
      const pages = pendingPdfPages.current;
      pendingPdfPages.current = null;
      setPdfPages(pages);
      setIsPdfMode(true);
      setCurrentPdfPageIndex(0);
      // Wait for canvas to be fully ready
      setTimeout(() => {
        loadPdfPage(0, pages);
      }, 300);
    }
  }, [canvas, loadPdfPage]);

  const isDrawingMarqueeRef = useRef(false);
  const isDraggingMarqueeRef = useRef(false);
  const marqueeStartPointRef = useRef<{x: number, y: number} | null>(null);
  const marqueeDragOffsetRef = useRef<{x: number, y: number} | null>(null);
  const [marqueeState, setMarqueeState] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
  } | null>(null);
  const marqueeStateRef = useRef(marqueeState);
  useEffect(() => {
    marqueeStateRef.current = marqueeState;
  }, [marqueeState]);

  useEffect(() => {
    if (activeTool !== 'marquee') {
      setMarqueeState(null);
    }
  }, [activeTool]);

  const selectObjectsInMarquee = (fabricCanvas: fabric.Canvas, marquee: { x: number, y: number, width: number, height: number }) => {
    const objects = fabricCanvas.getObjects();
    const toSelect: fabric.Object[] = [];

    const tempRect = new fabric.Rect({
      left: marquee.x,
      top: marquee.y,
      width: marquee.width,
      height: marquee.height
    });

    objects.forEach(obj => {
      const isArtboard = obj.id && obj.id.toString().includes('artboard');
      if (isArtboard || (obj as any).isGridLine || obj.id === 'grid_rect' || obj.id === 'marquee_selection') return;

      if (tempRect.intersectsWithObject(obj) || obj.isContainedWithinObject(tempRect)) {
        toSelect.push(obj);
      }
    });

    if (toSelect.length > 0) {
      fabricCanvas.discardActiveObject();
      if (toSelect.length === 1) {
        fabricCanvas.setActiveObject(toSelect[0]);
      } else {
        const sel = new fabric.ActiveSelection(toSelect, { canvas: fabricCanvas });
        fabricCanvas.setActiveObject(sel);
      }
      fabricCanvas.renderAll();
    }
  };

  const deleteObjectsInMarquee = (fabricCanvas: fabric.Canvas, marquee: { x: number, y: number, width: number, height: number }) => {
    const objects = fabricCanvas.getObjects();
    const toRemove: fabric.Object[] = [];

    const tempRect = new fabric.Rect({
      left: marquee.x,
      top: marquee.y,
      width: marquee.width,
      height: marquee.height
    });

    objects.forEach(obj => {
      const isArtboard = obj.id && obj.id.toString().includes('artboard');
      if (isArtboard || (obj as any).isGridLine || obj.id === 'grid_rect' || obj.id === 'marquee_selection') return;

      if (tempRect.intersectsWithObject(obj) || obj.isContainedWithinObject(tempRect)) {
        toRemove.push(obj);
      }
    });

    if (toRemove.length > 0) {
      toRemove.forEach(obj => {
        if ((obj as any)._pcProxy && pcmRef.current) {
          pcmRef.current.removeClip((obj as any)._pcId);
        } else {
          fabricCanvas.remove(obj);
        }
      });
      saveToHistory(fabricCanvas);
      updateLayers(fabricCanvas);
      fabricCanvas.renderAll();
    }
  };

  const initCanvas = (data?: any, dimensions?: { width: number, height: number }, pages: number = 1) => {
    if (!canvasRef.current || !containerRef.current) return;

    const workspaceWidth = containerRef.current.clientWidth;
    const workspaceHeight = containerRef.current.clientHeight;
    setWorkspaceSize({ width: workspaceWidth, height: workspaceHeight });

    // Global Fabric configuration to prevent clipping on large images
    fabric.perfLimitSizeX = 8192;
    fabric.perfLimitSizeY = 8192;
    // @ts-ignore
    fabric.textureSize = 8192;
    // @ts-ignore
    fabric.enableGLFiltering = true;

    // Enable WebGL for Convolute filter - modern GPUs handle this well
    // @ts-ignore
    if (fabric.Image.filters.Convolute) {
      // @ts-ignore
      fabric.Image.filters.Convolute.prototype.WEBGL_ENABLED = true;
    }

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: workspaceWidth,
      height: workspaceHeight,
      backgroundColor: '#121212',
      preserveObjectStacking: true,
      enableRetinaScaling: true,
      fireRightClick: true,
      stopContextMenu: false,
      perPixelTargetFind: true,
      targetFindTolerance: 10,
      subTargetCheck: true,
      controlsAboveOverlay: true
    });

    // Disable caching for sharper results and to avoid sub-pixel bleed/artifacts
    fabric.Object.prototype.objectCaching = false;
    fabric.Object.prototype.noScaleCache = true;

    fabricCanvas.renderOnAddRemove = false;

    const currentWidth = dimensions?.width || artboardSize.width;
    const currentHeight = dimensions?.height || artboardSize.height;
    const currentPages = pages || carouselPages;

    // Guardar valores para o clipping visual
    (fabricCanvas as any)._last_pages = currentPages;
    (fabricCanvas as any)._last_artW = currentWidth;
    (fabricCanvas as any)._last_artH = currentHeight;

    // Create Artboard Backgrounds
    for (let i = 0; i < currentPages; i++) {
      const artX = i * (currentWidth + 12);
      const artY = 0;

      // Create a separate shadow rectangle to avoid shadow bleed into the artboard itself
      const artboardShadow = new fabric.Rect({
        left: artX,
        top: artY,
        width: currentWidth,
        height: currentHeight,
        fill: 'white',
        selectable: false,
        evented: false,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.5)',
          blur: 20,
          offsetX: 0,
          offsetY: 10
        }),
        // @ts-ignore
        id: `artboard_shadow_${i}`,
      });
      fabricCanvas.add(artboardShadow);
      fabricCanvas.sendToBack(artboardShadow);

      const artboard = new fabric.Rect({
        left: artX,
        top: artY,
        width: currentWidth,
        height: currentHeight,
        fill: '#ffffff',
        strokeWidth: 0,
        stroke: null,
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        // @ts-ignore
        id: `artboard_bg_${i}`,
        // @ts-ignore
        name: currentPages > 1 ? `${t('modals.new_doc.presets.carousel', 'Carousel')} ${i + 1}` : t('editor.tools.artboard', 'Artboard')
      });
      fabricCanvas.add(artboard);
      // Ensure it's above the shadow but below everything else
      artboard.moveTo(1); 
    }

    fabricCanvas.renderOnAddRemove = true;
    fabricCanvas.renderAll();

    // Initialize PowerClip Manager
    const powerClipManager = new PowerClipManager(fabricCanvas, {
      onStatusChange: (msg, type) => {
        // @ts-ignore
        showToast(msg, type === 'ok' ? 'success' : type === 'warn' ? 'warning' : 'info');
      },
      onUIUpdate: () => {
        setIsPowerClipEditing(!!powerClipManager.editingId);
        setIsPowerClipPlacing(powerClipManager.placementMode);
        updateLayers(fabricCanvas);
      }
    });
    pcmRef.current = powerClipManager;
    setPcm(powerClipManager);
    powerClipManager.rebuildClipsFromCanvas();

    // Initialize Distort Manager
    const distortManager = new DistortManager(fabricCanvas);
    dmRef.current = distortManager;
    setDm(distortManager);

    // Initial centering
    const totalWidth = currentPages * currentWidth + (currentPages - 1) * 12;
    centerArtboard(fabricCanvas, currentWidth, currentHeight, currentPages);

    // Global fabric settings
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = '#ffffff';
    fabric.Object.prototype.cornerStrokeColor = '#3b82f6';
    fabric.Object.prototype.cornerStyle = 'rect';
    fabric.Object.prototype.cornerSize = 5;
    fabric.Object.prototype.padding = 0;
    fabric.Object.prototype.borderDashArray = [3, 3];
    fabric.Object.prototype.borderColor = '#3b82f6';
    fabric.Object.prototype.borderOpacityWhenMoving = 1;
    fabric.Object.prototype.perPixelTargetFind = true;
    fabric.Object.prototype.strokeUniform = true;
    
    // Set up grid
    const gridSize = 50;
    fabricCanvas.on('path:created', (e: any) => {
      const path = e.path;
      if (path && fabricCanvas.clipPath) {
        // Deep clone the clip path for the new object to ensure it stays clipped
        // even if global canvas clip is removed or changed later.
        fabricCanvas.clipPath.clone((cloned: fabric.Object) => {
          cloned.set({
            absolutePositioned: true
          });
          path.set({
            clipPath: cloned,
            objectCaching: false
          });
          path.setCoords();
          fabricCanvas.renderAll();
        });
      }
      fabricCanvas.renderAll();
      updateLayers(fabricCanvas);
      saveToHistory(fabricCanvas);
    });

    fabricCanvas.on('selection:created', (options) => {
      if (isSuppressingAnnouncementsRef.current) return;
      
      const obj = options.selected?.[0];

      // On first click/selection created, we do NOT drill down.
      // We want to select the group/folder as a whole first.
      
      if (obj && !(obj as any).id?.toString().startsWith('artboard_bg')) {
        let type = obj.type === 'i-text' ? 'texto' : obj.type;
        
        if (i18n.language.startsWith('pt')) {
          if (obj.type === 'rect') type = 'quadrado';
          if (obj.type === 'circle') type = 'círculo';
          if (obj.type === 'line') type = 'linha';
        }

        // Tradução para ícones e imagens no modo cego
        if (i18n.language.toLowerCase().startsWith('pt')) {
          if ((obj as any).isIcon && (obj as any).name) {
            type = translateDescription((obj as any).name, 'iconify', i18n.language);
          } else if (obj.type === 'image' && (obj as any).name && !(obj as any).name.startsWith('image_')) {
            type = translateDescription((obj as any).name, 'pexels', i18n.language);
          }
        }

        const width = Math.round(obj.width! * obj.scaleX!);
        const height = Math.round(obj.height! * obj.scaleY!);
        const color = typeof obj.fill === 'string' ? getColorName(obj.fill, i18n.language.startsWith('pt') ? 'pt' : 'en') : '';
        announce(t('a11y.speech.object.selected', { type, width, height }) + (color ? `. Cor: ${color}` : ''));
        
        // Auto-expand parents (physical groups AND virtual folders)
        const parentsToExpand: string[] = [];
        if (obj.group) {
          let p = obj.group;
          while (p) {
            if ((p as any).id) parentsToExpand.push((p as any).id);
            p = p.group;
          }
        }
        
        if ((obj as any).parentId) {
          let pId = (obj as any).parentId;
          const allObjects = fabricCanvas.getObjects();
          while (pId) {
            parentsToExpand.push(pId);
            const pObj = allObjects.find(o => (o as any).id === pId);
            pId = pObj ? (pObj as any).parentId : null;
          }
        }
        
        if (parentsToExpand.length > 0) {
          setExpandedGroupIds(prev => {
            const next = new Set(prev);
            let hasNew = false;
            parentsToExpand.forEach(id => {
              if (!next.has(id)) {
                next.add(id);
                hasNew = true;
              }
            });
            return hasNew ? next : prev;
          });
        }
      }
    });

    fabricCanvas.on('selection:updated', (options) => {
      if (isSuppressingAnnouncementsRef.current) return;
      
      const obj = options.selected?.[0];

      if (obj && !(obj as any).id?.toString().startsWith('artboard_bg')) {
        let type = obj.type === 'i-text' ? 'texto' : obj.type;

        if (i18n.language.startsWith('pt')) {
          if (obj.type === 'rect') type = 'quadrado';
          if (obj.type === 'circle') type = 'círculo';
          if (obj.type === 'line') type = 'linha';
        }

        // Tradução para ícones e imagens no modo cego
        if (i18n.language.toLowerCase().startsWith('pt')) {
          if ((obj as any).isIcon && (obj as any).name) {
            type = translateDescription((obj as any).name, 'iconify', i18n.language);
          } else if (obj.type === 'image' && (obj as any).name && !(obj as any).name.startsWith('image_')) {
            type = translateDescription((obj as any).name, 'pexels', i18n.language);
          }
        }

        const width = Math.round(obj.width! * obj.scaleX!);
        const height = Math.round(obj.height! * obj.scaleY!);
        const color = typeof obj.fill === 'string' ? getColorName(obj.fill, i18n.language.startsWith('pt') ? 'pt' : 'en') : '';
        announce(t('a11y.speech.object.selected', { type, width, height }) + (color ? `. Cor: ${color}` : ''));

        // Auto-expand parents (physical groups AND virtual folders)
        const parentsToExpand: string[] = [];
        if (obj.group) {
          let p = obj.group;
          while (p) {
            if ((p as any).id) parentsToExpand.push((p as any).id);
            p = p.group;
          }
        }
        
        if ((obj as any).parentId) {
          let pId = (obj as any).parentId;
          const allObjects = fabricCanvas.getObjects();
          while (pId) {
            parentsToExpand.push(pId);
            const pObj = allObjects.find(o => (o as any).id === pId);
            pId = pObj ? (pObj as any).parentId : null;
          }
        }
        
        if (parentsToExpand.length > 0) {
          setExpandedGroupIds(prev => {
            const next = new Set(prev);
            let hasNew = false;
            parentsToExpand.forEach(id => {
              if (!next.has(id)) {
                next.add(id);
                hasNew = true;
              }
            });
            return hasNew ? next : prev;
          });
        }
      }
    });

    fabricCanvas.on('object:added', (options) => {
      if (isSuppressingAnnouncementsRef.current) return;
      const obj = options.target!;
      
      if (obj && !(obj as any).id?.toString().startsWith('artboard_bg')) {
        let key = 'a11y.speech.object.added.image';
        if (obj.type === 'rect') key = 'a11y.speech.object.added.rect';
        else if (obj.type === 'circle') key = 'a11y.speech.object.added.circle';
        else if (obj.type === 'triangle') key = 'a11y.speech.object.added.triangle';
        else if (obj.type === 'path' && (obj as any).name === t('editor.tools.star')) key = 'a11y.speech.object.added.star';
        else if (obj.type === 'path' && (obj as any).name === t('editor.tools.heart')) key = 'a11y.speech.object.added.heart';
        else if (obj.type === 'i-text') key = 'a11y.speech.object.added.text';
        announce(t(key));
      }
    });

    fabricCanvas.on('object:modified', (options) => {
      const obj = options.target;
      if (obj && !(obj as any).id?.toString().startsWith('artboard_bg')) {
        if (options.action === 'drag') {
          announce(t('a11y.speech.object.moved'));
        } else if (options.action === 'scale') {
          const width = Math.round(obj.width! * obj.scaleX!);
          const height = Math.round(obj.height! * obj.scaleY!);
          announce(t('a11y.speech.object.resized', { width, height }));
        }
      }
    });

    fabricCanvas.on('text:changed', (options) => {
      if (!useA11yStore.getState().blindMode) return;
      if (textSpeakTimeoutRef.current) clearTimeout(textSpeakTimeoutRef.current);
      const obj = options.target as fabric.IText;
      if (obj && obj.text) {
        textSpeakTimeoutRef.current = setTimeout(() => {
          announce(obj.text!);
        }, 2000);
      }
    });

    fabricCanvas.on('mouse:dblclick', (options) => {
      const target = options.target;
      
      // PowerClip editing
      if (target && (target as any)._pcProxy && powerClipManager) {
        powerClipManager.enterEditModeById((target as any)._pcId);
        return;
      }
      
      // Text on Path editing
      if (target && (target as any).isTextOnPath) {
        const currentText = (target as any).originalText || '';
        const newText = window.prompt(t('editor.tools.edit_text_on_path', 'Editar texto no caminho'), currentText);
        if (newText !== null && newText !== currentText) {
          (target as any).originalText = newText;
          // Trigger the sync useEffect by updating the topOptions reference
          setTopOptions(prev => ({ ...prev }));
          saveToHistoryRef.current(fabricCanvas);
        }
        return;
      }
    });

    fabricCanvas.on('mouse:over', (opt: any) => {
      const tool = activeToolRef.current;
      if (false) { // Removido redundante
      }
    });

    fabricCanvas.on('mouse:out', (opt: any) => {
      if (false) { // Removido redundante
      }
    });

    fabricCanvas.on('mouse:dblclick', (opt: any) => {
      if (activeToolRef.current === 'pen') {
        finishPenPathRef.current?.();
      }
    });

    fabricCanvas.on('mouse:down', (opt: any) => {
      const target = opt.target as any;
      const isArtboard = target && target.id && target.id.toString().includes('artboard');
      
      if (isArtboard) {
        // Se clicar na prancheta, garantimos que nada ocorra (sem seleção, sem marquee)
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
        
        // Se estiver no modo de seleção e não estiver em panning, retornamos.
        // Se for qualquer outra ferramenta (formas, texto, marquee, picker, etc.), permitimos continuar.
        if (activeToolRef.current === 'select' && !isSpaceDownRef.current) {
          return;
        }
      }

      if (isSpaceDownRef.current) {
        isPanningRef.current = true;
        fabricCanvas.setCursor('grabbing');
        lastMousePosRef.current = { x: opt.e.clientX, y: opt.e.clientY };
        return;
      }

      const tool = activeToolRef.current;
      const pointer = fabricCanvas.getPointer(opt.e);

      // Lógica de drill-down removida para seguir o novo conceito de Pastas Organizacionais independentes.
      if (tool === 'text-on-path') {
        // Removido - tratado pelo useEffect/_topOnMouseDown
        return;
      }

      if (tool === 'picker') {
        if (!pointer) return;
        const ctx = fabricCanvas.getContext();
        const pixel = ctx.getImageData(pointer.x, pointer.y, 1, 1).data;
        const hex = "#" + ("000000" + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)).slice(-6);
        
        // Update global color store
        const currentActiveSlot = useColorStore.getState().activeSlot;
        if (currentActiveSlot === 'foreground') {
          useColorStore.getState().setForeground(hex);
        } else {
          useColorStore.getState().setBackground(hex);
        }
        
        setPickedColor(hex);
        setShowPickerModal(true);
        
        const active = fabricCanvas.getActiveObject();
        if (active) {
          if (active.type === 'i-text' || active.type === 'text' || active.type === 'textbox') {
            active.set('fill', hex);
          } else if (active.get('isIcon')) {
            // Update icon fill
            if (active.getObjects) {
              //@ts-ignore
              active.getObjects().forEach((obj: any) => obj.set('fill', hex));
            } else {
              active.set('fill', hex);
            }
          } else {
            active.set('fill', hex);
          }
          fabricCanvas.renderAll();
          saveToHistory(fabricCanvas);
        }
        setActiveTool('select');
        fabricCanvas.setCursor('default');
        return;
      }

      if (tool === 'magic-wand') {
        handleMagicWandClickRef.current?.(pointer, opt.e);
        return;
      }

      if (tool === 'lasso') {
        startLassoRef.current?.(pointer.x, pointer.y);
        return;
      }

      if (tool === 'magnetic-lasso') {
        addMagneticLassoPointRef.current?.(pointer.x, pointer.y);
        return;
      }

      if (tool === 'pen') {
        addPenPointRef.current?.(pointer.x, pointer.y);
        return;
      }

      if (tool === 'marquee') {
        if (pointer) {
          // Check if clicking inside existing marquee to move it
          const currentMarquee = marqueeStateRef.current;
          if (currentMarquee) {
            const { x, y, width, height } = currentMarquee;
            if (pointer.x >= x && pointer.x <= x + width &&
                pointer.y >= y && pointer.y <= y + height) {
              isDraggingMarqueeRef.current = true;
              marqueeDragOffsetRef.current = {
                x: pointer.x - x,
                y: pointer.y - y
              };
              return;
            }
          }

          // Otherwise, start a new one
          isDrawingMarqueeRef.current = true;
          marqueeStartPointRef.current = { x: pointer.x, y: pointer.y };
          setMarqueeState({
            x: pointer.x,
            y: pointer.y,
            width: 0,
            height: 0,
            active: true
          });
          fabricCanvas.discardActiveObject();
        }
        return;
      }

      if (tool === 'shapes') {
        if (opt.target && !opt.target.id?.toString().includes('artboard')) {
          return;
        }
        if (pointer) {
          isDrawingShapeRef.current = true;
          shapeStartPointRef.current = { x: pointer.x, y: pointer.y };
          
          const color = useColorStore.getState().foreground;
          let preview: fabric.Object;
          
          switch (activeShapeRef.current) {
            case 'circle':
              preview = new fabric.Circle({
                left: pointer.x,
                top: pointer.y,
                radius: 0,
                fill: color,
                selectable: false,
                evented: false,
                opacity: 0.5
              });
              break;
            case 'triangle':
              preview = new fabric.Triangle({
                left: pointer.x,
                top: pointer.y,
                width: 0,
                height: 0,
                fill: color,
                selectable: false,
                evented: false,
                opacity: 0.5
              });
              break;
            case 'star':
              preview = new fabric.Path('M 100 0 L 123.5 72.3 L 199.5 72.3 L 138 116.5 L 161.5 188.8 L 100 144.6 L 38.5 188.8 L 62 116.5 L 0.5 72.3 L 76.5 72.3 Z', {
                left: pointer.x,
                top: pointer.y,
                width: 0,
                height: 0,
                fill: color,
                selectable: false,
                evented: false,
                opacity: 0.5
              });
              break;
            case 'heart':
              preview = new fabric.Path('M 100 30 C 100 30 90 0 50 0 C 10 0 0 40 0 70 C 0 110 50 150 100 190 C 150 150 200 110 200 70 C 200 40 190 0 150 0 C 110 0 100 30 100 30 Z', {
                left: pointer.x,
                top: pointer.y,
                width: 0,
                height: 0,
                fill: color,
                selectable: false,
                evented: false,
                opacity: 0.5
              });
              break;
            case 'rectangle':
            default:
              preview = new fabric.Rect({
                left: pointer.x,
                top: pointer.y,
                width: 0,
                height: 0,
                fill: color,
                selectable: false,
                evented: false,
                opacity: 0.5
              });
              break;
          }
          
          shapePreviewRef.current = preview;
          fabricCanvas.add(preview);
        }
        return;
      }

      if (tool === 'line') {
        if (opt.target && !opt.target.id?.toString().startsWith('artboard')) {
          return;
        }
        if (pointer) addLineToCanvas(fabricCanvas, pointer.x, pointer.y);
        return;
      }

      if (tool === 'text') {
        if (opt.target && !opt.target.id?.toString().includes('artboard')) {
          return;
        }
        if (pointer) {
          isDrawingTextRef.current = true;
          textStartPointRef.current = { x: pointer.x, y: pointer.y };
          
          const preview = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: '#2563eb',
            strokeWidth: 1,
            rx: 6,
            ry: 6,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            // @ts-ignore
            excludeFromExport: true,
            name: '__text_preview__'
          });
          textPreviewRef.current = preview;
          fabricCanvas.add(preview);
        }
        return;
      }

      if (tool === 'highlight' || tool === 'underline' || tool === 'strikethrough' || tool === 'arrow') {
        textStartPointRef.current = { x: pointer.x, y: pointer.y };
        if (tool === 'highlight') isDrawingHighlightRef.current = true;
        else if (tool === 'underline') isDrawingUnderlineRef.current = true;
        else if (tool === 'strikethrough') isDrawingStrikethroughRef.current = true;
        else if (tool === 'arrow') isDrawingArrowRef.current = true;
        
        // Create preview
        if (tool === 'highlight') {
          const rect = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: 'rgba(255, 255, 0, 0.3)',
            selectable: false,
            evented: false,
            // @ts-ignore
            id: 'pdf_highlight_preview'
          });
          fabricCanvas.add(rect);
          textPreviewRef.current = rect;
        } else if (tool === 'arrow') {
          const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: '#ff0000',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            // @ts-ignore
            id: 'pdf_arrow_preview'
          });
          fabricCanvas.add(line);
          linePreviewRef.current = line;
        }
      }
    });

    fabricCanvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;

      // Find relevant artboard
      const allObjects = fabricCanvas.getObjects();
      const artboard = allObjects.find(o => (o as any).id && (o as any).id.toString().startsWith('artboard_bg'));

      // Ensure crisp integer positions
      if (snapToGridRef.current) {
        const artboardX = artboard?.left || 0;
        const artboardY = artboard?.top || 0;

        const snappedLeft = Math.round((obj.left! - artboardX) / GRID_SIZE) * GRID_SIZE + artboardX;
        const snappedTop = Math.round((obj.top! - artboardY) / GRID_SIZE) * GRID_SIZE + artboardY;
        
        obj.set({ left: snappedLeft, top: snappedTop });
      } else {
        // Smart snap to artboard boundaries if close
        if (artboard && obj !== artboard && !(obj as any).id?.toString().startsWith('artboard_shadow')) {
          const artL = artboard.left!;
          const artT = artboard.top!;
          const artW = artboard.width! * (artboard.scaleX || 1);
          const artH = artboard.height! * (artboard.scaleY || 1);
          const artR = artL + artW;
          const artB = artT + artH;

          const currentW = obj.width! * (obj.scaleX || 1);
          const currentH = obj.height! * (obj.scaleY || 1);

          // Snap to full artboard if almost covering it
          if (Math.abs(currentW - artW) < 10 && Math.abs(currentH - artH) < 10 && Math.abs(obj.left! - artL) < 15 && Math.abs(obj.top! - artT) < 15) {
            obj.set({
              left: artL,
              top: artT,
              scaleX: artW / obj.width!,
              scaleY: artH / obj.height!
            });
          } else {
            // Individual edge snaps (threshold: 5px)
            let newL = obj.left!;
            let newT = obj.top!;
            
            if (Math.abs(newL - artL) < 5) newL = artL;
            if (Math.abs(newT - artT) < 5) newT = artT;
            if (Math.abs((newL + currentW) - artR) < 5) newL = artR - currentW;
            if (Math.abs((newT + currentH) - artB) < 5) newT = artB - currentH;

            obj.set({ left: Math.round(newL), top: Math.round(newT) });
          }
        } else {
          obj.set({
            left: Math.round(obj.left!),
            top: Math.round(obj.top!)
          });
        }
      }

      // Ensure crisp integer dimensions by baking scale into width/height
      const isSimpleShape = ['rect', 'circle', 'triangle', 'ellipse', 'textbox'].includes(obj.type || '');
      if (isSimpleShape && (Math.abs(obj.scaleX! - 1) > 0.001 || Math.abs(obj.scaleY! - 1) > 0.001)) {
        const newWidth = Math.round(obj.width! * obj.scaleX!);
        const newHeight = Math.round(obj.height! * obj.scaleY!);
        
        if (obj.type === 'rect' || obj.type === 'textbox') {
          obj.set({
            width: newWidth,
            height: newHeight,
            scaleX: 1,
            scaleY: 1
          });
        }
      }

      fabricCanvas.renderAll();

      // Update artboard sizing if artboard was modified
      if (e.target && (e.target as any).id?.toString().startsWith('artboard_bg')) {
        const obj = e.target;
        const newWidth = Math.round(obj.width! * obj.scaleX!);
        const newHeight = Math.round(obj.height! * obj.scaleY!);
        
        // Reset scale but keep dimensions
        obj.set({
          width: newWidth,
          height: newHeight,
          scaleX: 1,
          scaleY: 1
        });
        
        setArtboardSize({ width: newWidth, height: newHeight });
        // Synchronize canvas if needed
        fabricCanvas.setDimensions({ width: newWidth, height: fabricCanvas.height! });
        fabricCanvas.renderAll();
      }

      saveToHistory(fabricCanvas);
      updateLayers(fabricCanvas);
    });

    fabricCanvas.on('mouse:up', (e) => {
      setSmartGuides([]);
      smartGuidesRef.current = [];
      const tool = activeToolRef.current;
      if (tool === 'lasso') {
        stopLassoRef.current?.();
        return;
      }
    });

    fabricCanvas.on('object:rotating', (options) => {
      handleObjectTransform(options);
    });

    fabricCanvas.on('object:scaling', (options) => {
      const obj = options.target!;
      if (obj && (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg')) {
        if (activeToolRef.current !== 'artboard') {
          // Strictly prevent scaling even if somehow triggered
          obj.set({ scaleX: 1, scaleY: 1 });
          fabricCanvas.renderAll();
          return;
        }
        handleObjectTransform(options);
      } else {
        handleObjectTransform(options);
      }
    });

    fabricCanvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj || (obj as any).id?.toString().startsWith('artboard_bg')) return;

      if (!isAltPressed && snapToGridRef.current) {
        const snapTolerance = 10;
        const guides: any[] = [];
        
        const artboardW = artboardSize.width;
        const artboardH = artboardSize.height;
        const pages = carouselPages;
        const totalW = pages * artboardW + (pages - 1) * 12;

        const objRect = obj.getBoundingRect(true);
        const objMiddleX = objRect.left + objRect.width / 2;
        const objMiddleY = objRect.top + objRect.height / 2;
        const objRight = objRect.left + objRect.width;
        const objBottom = objRect.top + objRect.height;

        let bestSnapX: number | null = null;
        let bestSnapY: number | null = null;
        let minDiffX = snapTolerance;
        let minDiffY = snapTolerance;

        // Potential snap targets (exclude background, grid, etc)
        const targets = fabricCanvas.getObjects().filter(o => 
          o !== obj && 
          o.visible && 
          !o.isGridLine && 
          o.id !== 'grid_rect' && 
          o.id !== 'marquee_selection' &&
          !(o as any).id?.toString().startsWith('artboard_bg')
        );

        // 1. Objects Snap
        targets.forEach(target => {
          const targetRect = target.getBoundingRect(true);
          const tL = targetRect.left;
          const tR = targetRect.left + targetRect.width;
          const tT = targetRect.top;
          const tB = targetRect.top + targetRect.height;
          const tMX = tL + targetRect.width / 2;
          const tMY = tT + targetRect.height / 2;

          // Points to check
          const tX = [tL, tR, tMX];
          const tY = [tT, tB, tMY];
          const oX = [objRect.left, objRight, objMiddleX];
          const oY = [objRect.top, objBottom, objMiddleY];

          oX.forEach(ox => {
            tX.forEach(tx => {
              const diff = Math.abs(ox - tx);
              if (diff < minDiffX) {
                minDiffX = diff;
                bestSnapX = tx - (ox - obj.left!);
                guides.push({ type: 'v', x: tx });
              }
            });
          });

          oY.forEach(oy => {
            tY.forEach(ty => {
              const diff = Math.abs(oy - ty);
              if (diff < minDiffY) {
                minDiffY = diff;
                bestSnapY = ty - (oy - obj.top!);
                guides.push({ type: 'h', y: ty });
              }
            });
          });
        });

        // 2. Artboard Snap
        const oX = [objRect.left, objRight, objMiddleX];
        const oY = [objRect.top, objBottom, objMiddleY];

        const firstArtboard = fabricCanvas.getObjects().find(o => (o as any).id && (o as any).id.toString().startsWith('artboard_bg'));
        const artboardX = firstArtboard?.left || 0;
        const artboardY = firstArtboard?.top || 0;

        const globalArtboardSnapX = [artboardX, artboardX + totalW, artboardX + totalW / 2];
        const globalArtboardSnapY = [artboardY, artboardY + artboardH, artboardY + artboardH / 2];

        globalArtboardSnapX.forEach(tx => {
          oX.forEach(ox => {
            const diff = Math.abs(ox - tx);
            if (diff < minDiffX) {
              minDiffX = diff;
              bestSnapX = tx - (ox - obj.left!);
              guides.push({ type: 'v', x: tx });
            }
          });
        });

        globalArtboardSnapY.forEach(ty => {
          oY.forEach(oy => {
            const diff = Math.abs(oy - ty);
            if (diff < minDiffY) {
              minDiffY = diff;
              bestSnapY = ty - (oy - obj.top!);
              guides.push({ type: 'h', y: ty });
            }
          });
        });

        // 3. Grid Snap (Only if enabled)
        if (snapToGridRef.current) {
          oX.forEach(ox => {
            const snappedX = Math.round((ox - artboardX) / GRID_SIZE) * GRID_SIZE + artboardX;
            const diff = Math.abs(ox - snappedX);
            if (diff < minDiffX) {
              minDiffX = diff;
              bestSnapX = snappedX - (ox - obj.left!);
            }
          });

          oY.forEach(oy => {
            const snappedY = Math.round((oy - artboardY) / GRID_SIZE) * GRID_SIZE + artboardY;
            const diff = Math.abs(oy - snappedY);
            if (diff < minDiffY) {
              minDiffY = diff;
              bestSnapY = snappedY - (oy - obj.top!);
            }
          });
        }

        if (bestSnapX !== null && !obj.group) obj.set('left', Math.round(bestSnapX));
        if (bestSnapY !== null && !obj.group) obj.set('top', Math.round(bestSnapY));

        // Keep only guides that are actually snapped
        const activeGuides = guides.filter(g => 
          (g.type === 'v' && bestSnapX !== null && Math.abs(g.x - (bestSnapX + (g.x - obj.left!))) < 0.1) ||
          (g.type === 'h' && bestSnapY !== null && Math.abs(g.y - (bestSnapY + (g.y - obj.top!))) < 0.1)
        );

        setSmartGuides(activeGuides.slice(0, 8)); 
        smartGuidesRef.current = activeGuides.slice(0, 8);
      } else {
        setSmartGuides([]);
        smartGuidesRef.current = [];
      }
    });

    fabricCanvas.on('after:render', () => {
      const ctx = fabricCanvas.getContext();
      if (!ctx || smartGuidesRef.current.length === 0) return;

      const vpt = fabricCanvas.viewportTransform!;
      const zoom = fabricCanvas.getZoom();
      
      ctx.save();
      ctx.setTransform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);
      
      ctx.strokeStyle = '#00ffff'; // Cyan (CorelDRAW standard)
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.globalAlpha = 0.7;

      smartGuidesRef.current.forEach(guide => {
        ctx.beginPath();
        if (guide.type === 'v') {
          ctx.moveTo(guide.x, -10000);
          ctx.lineTo(guide.x, 10000);
        } else {
          ctx.moveTo(-10000, guide.y);
          ctx.lineTo(10000, guide.y);
        }
        ctx.stroke();
      });

      ctx.restore();
    });

    fabricCanvas.on('selection:cleared', () => {
      setSmartGuides([]);
      smartGuidesRef.current = [];
    });

    const handleObjectTransform = (options: any) => {
      const obj = options.target!;
      if (!obj) return;
      obj.setCoords();

      // Atualizar marcadores de linha (setas/pontas)
      if (obj.type === 'line') {
        removeArrowsFromLine(obj);
        addArrowHeads(obj as fabric.Line);
      }

      // Fix corner rounding for rectangles when scaling
      if (obj.type === 'rect' && (obj.rx || obj.ry)) {
        const currentRadius = (obj as any)._target_radius || (obj.rx * (obj.scaleX || 1));
        (obj as any)._target_radius = currentRadius;
        obj.set({
          rx: currentRadius / (obj.scaleX || 1),
          ry: currentRadius / (obj.scaleY || 1)
        });
      }

      // Handle Textbox scaling to update width/fixedHeight instead of stretching
      if (obj.type === 'textbox') {
        const newWidth = obj.width! * obj.scaleX!;
        const newHeight = obj.height! * obj.scaleY!;
        
        obj.set({
          width: newWidth,
          scaleX: 1,
          scaleY: 1
        });
        
        if ((obj as any).fixedHeight !== undefined) {
          (obj as any).fixedHeight = newHeight;
        }
        
        obj.setCoords();
      }
    };

    fabricCanvas.on('object:rotating', handleObjectTransform);

    if (data) {
      fabricCanvas.loadFromJSON(data, () => {
        // Ensure artboard and grid elements are non-selectable after load
        fabricCanvas.getObjects().forEach(obj => {
          const o = obj as any;
          if ((o.id && o.id.toString().startsWith('artboard_bg')) || o.isGridLine || o.id === 'grid_rect') {
            obj.set({ selectable: false, evented: false });
          }
        });
        enlivenClipPathRecursive(fabricCanvas);
        fabricCanvas.renderAll();
        updateLayers(fabricCanvas);
        if (pcmRef.current) pcmRef.current.rebuildClipsFromCanvas();
        saveToHistory(fabricCanvas);
      });
    }

    // Native wheel listener for passive: false (required for preventDefault)
    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    nativeWheelHandlerRef.current = handleNativeWheel;
    
    const canvasContainer = containerRef.current;
    if (canvasContainer) {
      canvasContainer.addEventListener('wheel', handleNativeWheel, { passive: false });
    }

    fabricCanvas.on('mouse:wheel', (opt: any) => {
      const e = opt.e;
      const vpt = [...fabricCanvas.viewportTransform as number[]];
      
      if (e.ctrlKey) {
        // Zoom behavior (Ctrl + Scroll)
        let zoomVal = fabricCanvas.getZoom();
        zoomVal *= 0.999 ** e.deltaY;
        
        // Limits: 0.1 to 5
        if (zoomVal > 5) zoomVal = 5;
        if (zoomVal < 0.1) zoomVal = 0.1;
        
        fabricCanvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), zoomVal);
        setZoom(Math.round(zoomVal * 100));
      } else {
        // Scroll behavior (Mouse Scroll)
        if (e.shiftKey) {
          // Horizontal Scroll (Shift + Scroll)
          vpt[4] -= e.deltaY;
        } else {
          // Vertical Scroll (Standard)
          vpt[5] -= e.deltaY;
        }
        fabricCanvas.setViewportTransform(vpt);
      }
      fabricCanvas.requestRenderAll();
    });


    fabricCanvas.on('mouse:move', (opt: any) => {
      // Don't overwrite brush cursor here if it's already managed by updateBrushCursor
      // Removed drawing mode cursor override that was simpler and overwriting custom cursors

      if (isDrawingLineRef.current) {
        onLineMouseMove(opt);
        return;
      }
      
      const pointerMove = fabricCanvas.getPointer(opt.e);
      const toolMove = activeToolRef.current;

      if (toolMove === 'pen') {
        handlePenMouseMoveRef.current?.(pointerMove.x, pointerMove.y);
      }

      if (isDraggingMarqueeRef.current && marqueeDragOffsetRef.current) {
        const newX = pointerMove.x - marqueeDragOffsetRef.current.x;
        const newY = pointerMove.y - marqueeDragOffsetRef.current.y;
        
        setMarqueeState(prev => prev ? {
          ...prev,
          x: newX,
          y: newY
        } : null);
        return;
      }

      if (isDrawingMarqueeRef.current && marqueeStartPointRef.current) {
        const startX = marqueeStartPointRef.current.x;
        const startY = marqueeStartPointRef.current.y;
        
        const x = Math.min(startX, pointerMove.x);
        const y = Math.min(startY, pointerMove.y);
        const width = Math.abs(startX - pointerMove.x);
        const height = Math.abs(startY - pointerMove.y);
        
        setMarqueeState({
          x,
          y,
          width,
          height,
          active: true
        });
        return;
      }

      if (toolMove === 'lasso') {
        drawLassoRef.current?.(pointerMove.x, pointerMove.y);
        return;
      }

      if (isDrawingShapeRef.current && shapeStartPointRef.current && shapePreviewRef.current) {
        const pointer = fabricCanvas.getPointer(opt.e);
        const startX = shapeStartPointRef.current.x;
        const startY = shapeStartPointRef.current.y;
        
        const left = Math.min(startX, pointer.x);
        const top = Math.min(startY, pointer.y);
        const width = Math.abs(startX - pointer.x);
        const height = Math.abs(startY - pointer.y);
        
        if (activeShapeRef.current === 'circle') {
          const radius = Math.max(width, height) / 2;
          (shapePreviewRef.current as fabric.Circle).set({ 
            left: startX - radius, 
            top: startY - radius, 
            radius: radius 
          });
        } else if (activeShapeRef.current === 'triangle') {
          (shapePreviewRef.current as fabric.Triangle).set({ left, top, width, height });
        } else if (activeShapeRef.current === 'star' || activeShapeRef.current === 'heart') {
          shapePreviewRef.current.set({ left, top });
          shapePreviewRef.current.scaleToWidth(width);
          shapePreviewRef.current.scaleToHeight(height);
        } else if (activeShapeRef.current === 'rectangle') {
          (shapePreviewRef.current as fabric.Rect).set({ left, top, width, height });
        }
        
        fabricCanvas.renderAll();
        return;
      }

      if (isDrawingHighlightRef.current && textStartPointRef.current && textPreviewRef.current) {
        const startX = textStartPointRef.current.x;
        const startY = textStartPointRef.current.y;
        const left = Math.min(startX, pointerMove.x);
        const top = Math.min(startY, pointerMove.y);
        const width = Math.abs(startX - pointerMove.x);
        const height = Math.abs(startY - pointerMove.y);
        textPreviewRef.current.set({ left, top, width, height });
        fabricCanvas.renderAll();
        return;
      }

      if (isDrawingArrowRef.current && textStartPointRef.current && linePreviewRef.current) {
        linePreviewRef.current.set({ x2: pointerMove.x, y2: pointerMove.y });
        fabricCanvas.renderAll();
        return;
      }

      if (isDrawingTextRef.current && textStartPointRef.current && textPreviewRef.current) {
        const pointer = fabricCanvas.getPointer(opt.e);
        const startX = textStartPointRef.current.x;
        const startY = textStartPointRef.current.y;
        
        const left = Math.min(startX, pointer.x);
        const top = Math.min(startY, pointer.y);
        const width = Math.abs(startX - pointer.x);
        const height = Math.abs(startY - pointer.y);
        
        textPreviewRef.current.set({ left, top, width, height });
        fabricCanvas.renderAll();
        return;
      }
      const tool = activeToolRef.current;
      if (isPanningRef.current && isSpaceDownRef.current) {
        const e = opt.e;
        const vpt = [...fabricCanvas.viewportTransform as number[]];
        if (lastMousePosRef.current) {
          vpt[4] += e.clientX - lastMousePosRef.current.x;
          vpt[5] += e.clientY - lastMousePosRef.current.y;
          fabricCanvas.setViewportTransform(vpt);
          fabricCanvas.requestRenderAll();
          lastMousePosRef.current = { x: e.clientX, y: e.clientY };
          setOffset({ x: vpt[4], y: vpt[5] });
        }
        return;
      }
      const pointer = fabricCanvas.getPointer(opt.e);
      lastMousePosRef.current = { x: opt.e.clientX, y: opt.e.clientY };
      if (pointer) {
        setMousePos({ x: Math.round(pointer.x), y: Math.round(pointer.y) });
      }

      if (tool === 'picker') {
        fabricCanvas.setCursor('crosshair'); // Eyedropper cursor simulation
      }
    });

    fabricCanvas.on('mouse:up', (opt: any) => {
      if (isDrawingLineRef.current) {
        onLineMouseUp(opt);
      }

      const toolUp = activeToolRef.current;
      const pointerUp = fabricCanvas.getPointer(opt.e);

      if (isDraggingMarqueeRef.current) {
        isDraggingMarqueeRef.current = false;
        marqueeDragOffsetRef.current = null;
        return;
      }

      if (isDrawingMarqueeRef.current) {
        setMarqueeState(prev => {
          if (prev && (prev.width < 2 && prev.height < 2)) {
            return null;
          }
          return prev;
        });
        isDrawingMarqueeRef.current = false;
        marqueeStartPointRef.current = null;
        return;
      }

      if (isDrawingShapeRef.current && shapeStartPointRef.current) {
        const pointer = fabricCanvas.getPointer(opt.e);
        const startX = shapeStartPointRef.current.x;
        const startY = shapeStartPointRef.current.y;
        
        const width = Math.abs(startX - pointer.x);
        const height = Math.abs(startY - pointer.y);
        const left = Math.min(startX, pointer.x);
        const top = Math.min(startY, pointer.y);
        
        if (shapePreviewRef.current) {
          fabricCanvas.remove(shapePreviewRef.current);
          shapePreviewRef.current = null;
        }
        
        if (width > 5 || height > 5) {
          const color = useColorStore.getState().foreground;
          let shape: fabric.Object;
          
          switch (activeShapeRef.current) {
            case 'circle':
              const radius = Math.max(width, height) / 2;
              shape = new fabric.Circle({
                left: startX - radius,
                top: startY - radius,
                radius: radius,
                fill: color,
                // @ts-ignore
                name: t('editor.constants.masks.circle', 'Círculo')
              });
              break;
            case 'triangle':
              shape = new fabric.Triangle({
                left,
                top,
                width,
                height,
                fill: color,
                // @ts-ignore
                name: t('editor.tools.triangle', 'Triângulo')
              });
              break;
            case 'star':
              shape = new fabric.Path('M 100 0 L 123.5 72.3 L 199.5 72.3 L 138 116.5 L 161.5 188.8 L 100 144.6 L 38.5 188.8 L 62 116.5 L 0.5 72.3 L 76.5 72.3 Z', {
                left,
                top,
                fill: color,
                // @ts-ignore
                name: t('editor.tools.star', 'Estrela')
              });
              shape.scaleToWidth(width);
              shape.scaleToHeight(height);
              break;
            case 'heart':
              shape = new fabric.Path('M 100 30 C 100 30 90 0 50 0 C 10 0 0 40 0 70 C 0 110 50 150 100 190 C 150 150 200 110 200 70 C 200 40 190 0 150 0 C 110 0 100 30 100 30 Z', {
                left,
                top,
                fill: color,
                // @ts-ignore
                name: t('editor.tools.heart', 'Coração')
              });
              shape.scaleToWidth(width);
              shape.scaleToHeight(height);
              break;
            case 'rectangle':
            default:
              shape = new fabric.Rect({
                left,
                top,
                width,
                height,
                fill: color,
                // @ts-ignore
                name: t('editor.tools.rectangle', 'Rectangle')
              });
              break;
          }
          
          fabricCanvas.add(shape);
          fabricCanvas.setActiveObject(shape);
          saveToHistory(fabricCanvas);
          setActiveTool('select');
        }
        
        isDrawingShapeRef.current = false;
        shapeStartPointRef.current = null;
        fabricCanvas.renderAll();
      }

      if (isDrawingHighlightRef.current && textStartPointRef.current) {
        isDrawingHighlightRef.current = false;
        if (textPreviewRef.current) {
          textPreviewRef.current.set({
            selectable: true,
            evented: true,
            // @ts-ignore
            id: `pdf_highlight_${Math.random().toString(36).substr(2, 9)}`
          });
          textPreviewRef.current = null;
        }
        saveToHistory(fabricCanvas);
      }

      if (isDrawingArrowRef.current && textStartPointRef.current) {
        isDrawingArrowRef.current = false;
        if (linePreviewRef.current) {
          // Add arrow head
          addArrowHeads(linePreviewRef.current);
          linePreviewRef.current.set({
            selectable: true,
            evented: true,
            // @ts-ignore
            id: `pdf_arrow_${Math.random().toString(36).substr(2, 9)}`
          });
          linePreviewRef.current = null;
        }
        saveToHistory(fabricCanvas);
      }

      if (toolUp === 'underline' || toolUp === 'strikethrough') {
        isDrawingUnderlineRef.current = false;
        isDrawingStrikethroughRef.current = false;
        const startX = textStartPointRef.current?.x || pointerUp.x;
        const startY = textStartPointRef.current?.y || pointerUp.y;
        
        const line = new fabric.Line([startX, startY, pointerUp.x, pointerUp.y], {
          stroke: toolUp === 'underline' ? '#0000ff' : '#ff0000',
          strokeWidth: 2,
          selectable: true,
          evented: true,
          // @ts-ignore
          id: `pdf_${toolUp}_${Math.random().toString(36).substr(2, 9)}`
        });
        fabricCanvas.add(line);
        saveToHistory(fabricCanvas);
      }

      if (isDrawingTextRef.current && textStartPointRef.current) {
        const pointer = fabricCanvas.getPointer(opt.e);
        const startX = textStartPointRef.current.x;
        const startY = textStartPointRef.current.y;
        
        const width = Math.abs(startX - pointer.x);
        const height = Math.abs(startY - pointer.y);
        
        if (textPreviewRef.current) {
          fabricCanvas.remove(textPreviewRef.current);
          textPreviewRef.current = null;
        }
        
        if (width < 5 && height < 5) {
          addTextToCanvas(fabricCanvas, startX, startY);
        } else {
          const left = Math.min(startX, pointer.x);
          const top = Math.min(startY, pointer.y);
          addTextboxToCanvas(fabricCanvas, left, top, width, height);
        }
        
        isDrawingTextRef.current = false;
        textStartPointRef.current = null;
        fabricCanvas.renderAll();
      }
      isPanningRef.current = false;
      setArtboardTooltip(null);
      if (isSpaceDownRef.current) {
        fabricCanvas.setCursor('grab');
      }
    });

    fabricCanvas.on('object:added', (e: any) => {
      const obj = e.target;
      // Skip artboard clip generation - it causes visual cropping issues (Correção Undo)

      if (obj && !(obj as any).isGridLine && isOutlineModeRef.current) {
        // If in outline mode, save original properties and apply outline
        if (obj.get('_originalFill') === undefined) {
          obj.set({
            _originalFill: obj.fill,
            _originalStroke: obj.stroke,
            _originalStrokeWidth: obj.strokeWidth,
            _originalOpacity: obj.opacity
          });
        }

        obj.set({
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 1 / fabricCanvas.getZoom(),
          opacity: 1
        });

        if (obj.type === 'image') {
          if (!obj._originalRender) {
            obj._originalRender = obj._render;
          }
          obj._render = function(ctx: CanvasRenderingContext2D) {
            const width = this.width || 0;
            const height = this.height || 0;
            ctx.save();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1 / (fabricCanvas.getZoom() * (this.scaleX || 1));
            ctx.strokeRect(-width/2, -height/2, width, height);
            ctx.beginPath();
            ctx.moveTo(-width/2, -height/2);
            ctx.lineTo(width/2, height/2);
            ctx.moveTo(width/2, -height/2);
            ctx.lineTo(-width/2, height/2);
            ctx.stroke();
            ctx.restore();
          };
        }
        obj.dirty = true;
      }
      updateLayersRef.current(fabricCanvas);
      saveToHistoryRef.current(fabricCanvas);
    });
    fabricCanvas.on('object:removed', () => {
      updateLayersRef.current(fabricCanvas);
      saveToHistoryRef.current(fabricCanvas);
    });
    fabricCanvas.on('object:modified', () => {
      updateLayersRef.current(fabricCanvas);
      saveToHistoryRef.current(fabricCanvas);
    });
    fabricCanvas.on('selection:created', (e: any) => {
      const allSelected = e.selected || [];
      const selected = allSelected.filter((obj: any) => {
        const isArtboard = obj.id && obj.id.toString().includes('artboard');
        return !isArtboard && !obj.isGridLine && obj.id !== 'grid_rect';
      });
      
      // Se filtramos alguns objetos, ajustamos a seleção. 
      if (selected.length !== allSelected.length) {
        setTimeout(() => {
          if (!fabricCanvas || (fabricCanvas as any)._disposed) return;
          fabricCanvas.discardActiveObject();
          if (selected.length === 1) {
            fabricCanvas.setActiveObject(selected[0]);
          } else if (selected.length > 1) {
            const sel = new fabric.ActiveSelection(selected, {
              canvas: fabricCanvas,
            });
            fabricCanvas.setActiveObject(sel);
          }
          fabricCanvas.requestRenderAll();
        }, 0);
      }

      const active = fabricCanvas.getActiveObject();
      setActiveObject(active);
      setSelectedLayerIds(selected.map((obj: any) => obj.id).filter(Boolean));
      
      // Ensure we don't accidentally select artboard
      if (active && (active as any).id?.toString().includes('artboard')) {
        setTimeout(() => {
          fabricCanvas.discardActiveObject();
          fabricCanvas.requestRenderAll();
          setActiveObject(null);
        }, 10);
      }
      
      if (selected[0]?.type === 'image' && selected[0]?.get('isProcessed')) {
        setRefinement(50);
      }
    });

    fabricCanvas.on('selection:updated', (e: any) => {
      const allSelected = e.selected || [];
      const selected = allSelected.filter((obj: any) => {
        const isArtboard = obj.id && obj.id.toString().includes('artboard');
        return !isArtboard && !obj.isGridLine && obj.id !== 'grid_rect';
      });
      
      if (selected.length !== allSelected.length) {
        if (selected.length > 0) {
          fabricCanvas.discardActiveObject();
          if (selected.length === 1) {
            fabricCanvas.setActiveObject(selected[0]);
          } else {
            const sel = new fabric.ActiveSelection(selected, {
              canvas: fabricCanvas,
            });
            fabricCanvas.setActiveObject(sel);
          }
        } else {
          fabricCanvas.discardActiveObject();
        }
        fabricCanvas.requestRenderAll();
      }

      const active = fabricCanvas.getActiveObject();
      setActiveObject(active);
      setSelectedLayerIds(selected.map((obj: any) => obj.id).filter(Boolean));

      // Ensure we don't accidentally select artboard
      if (active && (active as any).id?.toString().includes('artboard')) {
        setTimeout(() => {
          fabricCanvas.discardActiveObject();
          fabricCanvas.requestRenderAll();
          setActiveObject(null);
        }, 10);
      }
      
      if (selected[0]?.type === 'image' && selected[0]?.get('isProcessed')) {
        setRefinement(50);
      }
    });
    fabricCanvas.on('selection:cleared', () => {
      setSelectedLayerIds([]);
      setActiveObject(null);
    });

    setCanvas(fabricCanvas);
    ensureArtboardProperties(fabricCanvas, { width: currentWidth, height: currentHeight }, currentPages);
    
    // Ensure no phantom selection on init
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
    
    // Auto-save setup
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    
    const autoSaveInterval = setInterval(() => {
      if (fabricCanvas && !(fabricCanvas as any)._disposed) {
        try {
          localStorage.setItem('moscatee_draft', JSON.stringify(fabricCanvas.toJSON(FABRIC_PROPS)));
        } catch (error) {
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            console.warn('LocalStorage quota exceeded. Draft not saved.');
          } else {
            console.error('Error saving draft:', error);
          }
        }
      }
    }, 30000);

    autoSaveIntervalRef.current = autoSaveInterval;

    // Process pending PSD if any
    if (pendingPsdBuffer.current) {
      const psdBuffer = pendingPsdBuffer.current;
      pendingPsdBuffer.current = null;

      setTimeout(async () => {
        if (!fabricCanvas || (fabricCanvas as any)._disposed) return;
        
        if (psdBuffer) {
          const { width, height } = await psdService.importFromPsd(psdBuffer, fabricCanvas);
          setArtboardSize({ width, height });
          ensureArtboardProperties(fabricCanvas, { width, height }, 1);
          centerArtboard(fabricCanvas, width, height, 1);
          saveToHistory(fabricCanvas);
          updateLayers(fabricCanvas);
          showToast(t('editor.messages.psd_imported', 'PSD importado com sucesso'), 'success');
        }
      }, 100);
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
      if (canvasContainer && nativeWheelHandlerRef.current) {
        canvasContainer.removeEventListener('wheel', nativeWheelHandlerRef.current);
        nativeWheelHandlerRef.current = null;
      }
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
      setCanvas(null);
    };
  };

  useEffect(() => {
    if (canvas) {
      // Initial load for library
      if (!initialSearchPerformed.current.pexels) {
        searchPexels(DEFAULT_IMAGE_QUERY);
      }
      if (!initialSearchPerformed.current.iconify) {
        searchIconify(DEFAULT_ICON_QUERY);
      }
    }
  }, [canvas, searchPexels, searchIconify]);

  const toHex = (color: any) => {
    if (!color || typeof color !== 'string') return '#000000';
    if (color.startsWith('#')) return color;
    if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return '#000000';
      const r = parseInt(rgb[0]).toString(16).padStart(2, '0');
      const g = parseInt(rgb[1]).toString(16).padStart(2, '0');
      const b = parseInt(rgb[2]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    // Handle named colors or other formats if needed, but hex/rgb are most common in SVGs
    return '#000000';
  };

  const toggleTextProperty = (prop: string) => {
    if (!activeObject || !canvas) return;
    const isTextOnPath = (activeObject as any).isTextOnPath;
    if (!isTextOnPath && activeObject.type !== 'i-text' && activeObject.type !== 'text' && activeObject.type !== 'textbox') return;

    if (isTextOnPath) {
      if (prop === 'fontWeight') {
        const newValue = topOptions.fontWeight === 'bold' ? 'normal' : 'bold';
        setTopOptions(prev => ({ ...prev, fontWeight: newValue }));
        if (activeObject.type === 'i-text') activeObject.set('fontWeight', newValue);
      } else if (prop === 'fontStyle') {
        const newValue = topOptions.fontStyle === 'italic' ? 'normal' : 'italic';
        setTopOptions(prev => ({ ...prev, fontStyle: newValue }));
        if (activeObject.type === 'i-text') activeObject.set('fontStyle', newValue);
      } else if (prop === 'underline') {
        const newValue = !topOptions.underline;
        setTopOptions(prev => ({ ...prev, underline: newValue }));
        if (activeObject.type === 'i-text') activeObject.set('underline', newValue);
      }
      canvas.renderAll();
      saveToHistory(canvas);
      updateLayers(canvas);
      forceUpdate();
      return;
    }

    const isSelection = activeObject.selectionStart !== activeObject.selectionEnd;
    let currentValue;

    if (isSelection) {
      const styles = activeObject.getSelectionStyles();
      currentValue = styles[0] ? styles[0][prop] : activeObject[prop];
    } else {
      currentValue = activeObject[prop];
    }

    let newValue;
    if (prop === 'fontWeight') {
      newValue = currentValue === 'bold' ? 'normal' : 'bold';
    } else if (prop === 'fontStyle') {
      newValue = currentValue === 'italic' ? 'normal' : 'italic';
    } else if (prop === 'underline') {
      newValue = !currentValue;
    }

    if (isSelection) {
      activeObject.setSelectionStyles({ [prop]: newValue });
    } else {
      activeObject.set(prop, newValue);
      
      // Announce color change if applicable
      if (prop === 'fill' && typeof newValue === 'string') {
        const colorName = getColorName(newValue, i18n.language.startsWith('pt') ? 'pt' : 'en');
        announce(`${t('editor.tools.palette', 'Cor')}: ${colorName}`);
      }
    }

    canvas.renderAll();
    saveToHistory(canvas);
    updateLayers(canvas);
    forceUpdate();
  };

  const updateActiveObject = (prop: string, value: any, skipHistory = false) => {
    if (!activeObject || !canvas) return;

    if (activeObject.type === 'activeSelection') {
      const selection = activeObject as fabric.ActiveSelection;
      selection.getObjects().forEach((obj: any) => {
        // Special logic for rx/ry based on scale
        if (prop === 'rx' || prop === 'ry' || prop === 'radiusTopLeft' || prop === 'radiusTopRight' || prop === 'radiusBottomRight' || prop === 'radiusBottomLeft') {
          if (obj.type === 'rect' || obj.type === 'textbox') {
            const scaleProp = (prop === 'rx' || prop.includes('Left') || prop.includes('Right')) ? 'scaleX' : 'scaleY';
            const val = value / (obj[scaleProp] || 1);
            obj.set(prop, val);
            if (prop === 'rx') (obj as any)._target_radius = value;
          }
        } else if (prop === 'strokeWidth') {
          obj.set({
            strokeWidth: value * 2,
            paintFirst: 'stroke',
            strokeUniform: true,
            strokeLineJoin: 'miter',
            strokeLineCap: 'butt'
          });
          obj._originalStrokeWidth = value;
        } else if (prop === 'fontSize' || prop === 'fontFamily' || prop === 'fontWeight' || prop === 'fontStyle' || prop === 'underline' || prop === 'fill' || prop === 'stroke') {
          obj.set(prop, value);
        } else if (prop === 'opacity') {
          obj.set(prop, value / 100);
        } else {
          obj.set(prop, value);
        }
      });
    } else if ((activeObject as any).isTextOnPath) {
      if (prop === 'fontSize') {
        setTopOptions(prev => ({ ...prev, fontSize: value }));
        if (activeObject.type === 'i-text') activeObject.set('fontSize', value);
      }
      if (prop === 'fill' || prop === 'color') {
        setTopOptions(prev => ({ ...prev, color: value }));
        if (activeObject.type === 'i-text') activeObject.set('fill', value);
      }
      if (prop === 'offset') {
        setTopOptions(prev => ({ ...prev, offset: value }));
        if (activeObject.type === 'i-text') activeObject.set('pathStartOffset', value);
      }
      if (prop === 'fontFamily') {
        setTopOptions(prev => ({ ...prev, fontFamily: value }));
        if (activeObject.type === 'i-text') activeObject.set('fontFamily', value);
      }
      if (prop === 'fontWeight') {
        setTopOptions(prev => ({ ...prev, fontWeight: value }));
        if (activeObject.type === 'i-text') activeObject.set('fontWeight', value);
      }
      if (prop === 'fontStyle') {
        setTopOptions(prev => ({ ...prev, fontStyle: value }));
        if (activeObject.type === 'i-text') activeObject.set('fontStyle', value);
      }
      if (prop === 'underline') {
        setTopOptions(prev => ({ ...prev, underline: value }));
        if (activeObject.type === 'i-text') activeObject.set('underline', value);
      }
      if (prop === 'text') {
        (activeObject as any).originalText = value;
        if (activeObject.type === 'i-text') activeObject.set('text', value);
        // Trigger rerender for image-based ones
        setTopOptions(prev => ({ ...prev })); 
      }
      canvas.renderAll();
      if (!skipHistory) saveToHistory(canvas);
      return;
    }

    if (prop === 'fontFamily') {
      // Load font before applying to ensure Fabric.js can measure it correctly
      // Load a comprehensive set of weights and italics to avoid bold/rendering issues
      // Using standard variants compatible with most Google Fonts
      const variants = [100, 200, 300, 400, 500, 600, 700, 800, 900]
        .map(w => [`${w}`, `${w}i`]).flat().join(',');
      
      WebFont.load({
        google: {
          families: [`${value}:${variants}`]
        },
        active: () => {
          activeObject.set('fontFamily', value);
          canvas.renderAll();
          recordAction({ type: 'property', property: prop, value });
          updateLayers(canvas);
          if (!skipHistory) saveToHistory(canvas);
        },
        inactive: () => {
          // If a set of variants fails, try loading just the base font family
          WebFont.load({
            google: { families: [value] },
            active: () => {
              activeObject.set('fontFamily', value);
              canvas.renderAll();
              updateLayers(canvas);
              if (!skipHistory) saveToHistory(canvas);
            }
          });
        }
      });
      return;
    }

    const isArtboard = activeObject.id && activeObject.id.toString().startsWith('artboard_bg');

    if (isArtboard && (prop === 'width' || prop === 'height' || prop === 'scaleX' || prop === 'scaleY')) {
      let newWidth = activeObject.width;
      let newHeight = activeObject.height;
      
      if (prop === 'width') newWidth = value;
      if (prop === 'height') newHeight = value;
      if (prop === 'scaleX') newWidth = activeObject.width * value;
      if (prop === 'scaleY') newHeight = activeObject.height * value;
      
      newWidth = Math.max(10, newWidth);
      newHeight = Math.max(10, newHeight);
      
      activeObject.set({
        width: newWidth,
        height: newHeight,
        scaleX: 1,
        scaleY: 1
      });
      
      setArtboardSize({ width: newWidth, height: newHeight });
      ensureArtboardProperties(canvas, { width: newWidth, height: newHeight });
    } else if ((activeObject.type === 'i-text' || activeObject.type === 'textbox') && (prop === 'fontWeight' || prop === 'fontStyle' || prop === 'underline' || prop === 'fill' || prop === 'fontFamily' || prop === 'fontSize' || prop === 'charSpacing' || prop === 'lineHeight' || prop === 'deltaY' || prop === 'kerning')) {
      const isSelection = activeObject.selectionStart !== activeObject.selectionEnd;
      if (isSelection) {
        activeObject.setSelectionStyles({ [prop]: value });
      } else {
        activeObject.set(prop as any, value);
        if (prop === 'deltaY') {
          // Apply baseline shift to all text via styles
          const text = activeObject.text || '';
          for (let i = 0; i < text.length; i++) {
            activeObject.setSelectionStyles({ [prop]: value }, i, i + 1);
          }
        }
      }
    }

    if (prop === 'width' || prop === 'height') {
      const scaleProp = prop === 'width' ? 'scaleX' : 'scaleY';
      activeObject.set(scaleProp, value / activeObject[prop]);
    } else if (prop === 'rx' || prop === 'ry' || prop === 'radiusTopLeft' || prop === 'radiusTopRight' || prop === 'radiusBottomRight' || prop === 'radiusBottomLeft') {
      const scaleProp = (prop === 'rx' || prop.includes('Left') || prop.includes('Right')) ? 'scaleX' : 'scaleY';
      activeObject.set(prop, value / (activeObject[scaleProp] || 1));
      if (prop === 'rx') (activeObject as any)._target_radius = value;
    } else if (prop === 'strokeWidth') {
      // Logic for External Border (stroke behind fill)
      activeObject.set({
        strokeWidth: value * 2, 
        paintFirst: 'stroke',
        strokeUniform: true,
        strokeLineJoin: 'miter',
        strokeLineCap: 'butt'
      });
      (activeObject as any)._originalStrokeWidth = value;
    } else if (prop === 'opacity') {
      activeObject.set(prop, value / 100);
    } else if ((prop === 'fill' || prop === 'stroke' || prop === 'strokeWidth') && (activeObject.type === 'group' || activeObject.type === 'path' || activeObject.type === 'svg')) {
      // Handle icons (groups or paths)
      if (activeObject.getObjects) {
        activeObject.getObjects().forEach((obj: any) => obj.set(prop, value));
      } else {
        activeObject.set(prop, value);
      }
    } else if (prop === 'angle') {
      const center = activeObject.getCenterPoint();
      activeObject.set('angle', value);
      activeObject.setPositionByOrigin(center, 'center', 'center');
    } else {
      activeObject.set(prop, value);
    }
    
    recordAction({ type: 'property', property: prop, value });
    
    // Announce color change if applicable
    if (prop === 'fill' && typeof value === 'string') {
      const colorName = getColorName(value, i18n.language.startsWith('pt') ? 'pt' : 'en');
      announce(colorName);
    }
    
    activeObject.setCoords();
    canvas.renderAll();
    if (!skipHistory) {
      canvas.fire('object:modified', { target: activeObject });
      saveToHistory(canvas);
      updateLayers(canvas);
    }
    forceUpdate();
  };

  const applyGradient = (colors: string[]) => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    
    const gradient = new fabric.Gradient({
      type: 'linear',
      coords: {
        x1: 0,
        y1: 0,
        x2: activeObj ? (activeObj.width || 200) : canvas.width,
        y2: activeObj ? (activeObj.height || 200) : canvas.height,
      },
      colorStops: [
        { offset: 0, color: colors[0] },
        { offset: 1, color: colors[1] }
      ]
    });

    if (activeObj) {
      activeObj.set('fill', gradient);
      canvas.renderAll();
      saveToHistory(canvas);
      updateLayers(canvas);
      
      // Announce gradient change
      const lang = i18n.language.startsWith('pt') ? 'pt' : 'en';
      const color1 = getColorName(colors[0], lang);
      const color2 = getColorName(colors[1], lang);
      announce(`${color1} para ${color2}`);
    } else {
      const artboard = canvas.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
      if (artboard) {
        artboard.set('fill', gradient);
        canvas.renderAll();
        saveToHistory(canvas);
      }
    }
  };

  const updateGradientColor = (index: number, color: string) => {
    if (!canvas) return;
    const target = activeObject || canvas.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
    if (!target) return;

    const fill = target.fill;
    if (fill instanceof fabric.Gradient) {
      const stops = (fill.colorStops || []).map(s => ({ ...s }));
      if (stops[index]) {
        stops[index].color = color;
        
        // Re-calculate the gradient to ensure transparency update
        const gradientData = (fill as any).toObject();
        gradientData.colorStops = stops;
        const newGradient = new fabric.Gradient(gradientData);

        if (target.type === 'group' || target.type === 'svg') {
          target.getObjects().forEach((obj: any) => obj.set('fill', newGradient));
        }

        target.set('fill', newGradient);
        target.set('dirty', true);
        canvas.requestRenderAll();

        // Announce color change in gradient
        const colorName = getColorName(color, i18n.language.startsWith('pt') ? 'pt' : 'en');
        announce(colorName);
        
        // Save to history only after a small delay to avoid spamming
        const timer = setTimeout(() => saveToHistory(canvas), 500);
        return () => clearTimeout(timer);
      }
    }
  };

  const [gradientAngle, setGradientAngle] = useState(0);

  const updateGradientType = (type: 'linear' | 'radial') => {
    if (!canvas) return;
    const target = activeObject || canvas.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
    if (!target) return;

    const fill = target.fill;
    if (fill instanceof fabric.Gradient) {
      const gradientData = (fill as any).toObject();
      gradientData.type = type;
      
      const w = target.width || 200;
      const h = target.height || 200;

      if (type === 'radial') {
        gradientData.coords = {
          x1: w / 2,
          y1: h / 2,
          r1: 0,
          x2: w / 2,
          y2: h / 2,
          r2: Math.max(w, h) / 2
        };
      } else {
        // Calculate coords based on current angle
        const angleRad = (gradientAngle * Math.PI) / 180;
        const dist = Math.max(w, h);
        gradientData.coords = {
          x1: w/2 - Math.cos(angleRad) * dist/2,
          y1: h/2 - Math.sin(angleRad) * dist/2,
          x2: w/2 + Math.cos(angleRad) * dist/2,
          y2: h/2 + Math.sin(angleRad) * dist/2
        };
      }

      const newGradient = new fabric.Gradient(gradientData);

      if (target.type === 'group' || target.type === 'svg') {
        target.getObjects().forEach((obj: any) => obj.set('fill', newGradient));
      }

      target.set('fill', newGradient);
      canvas.requestRenderAll();
      saveToHistory(canvas);
      forceUpdate();
    }
  };

  const updateGradientAngle = (angle: number) => {
    if (!canvas) return;
    setGradientAngle(angle);
    const target = activeObject || canvas.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
    if (!target) return;

    const fill = target.fill;
    if (fill instanceof fabric.Gradient && fill.type === 'linear') {
      const gradientData = (fill as any).toObject();
      const w = target.width || 200;
      const h = target.height || 200;
      const angleRad = (angle * Math.PI) / 180;
      const dist = Math.max(w, h);
      
      gradientData.coords = {
        x1: w/2 - Math.cos(angleRad) * dist/2,
        y1: h/2 - Math.sin(angleRad) * dist/2,
        x2: w/2 + Math.cos(angleRad) * dist/2,
        y2: h/2 + Math.sin(angleRad) * dist/2
      };

      const newGradient = new fabric.Gradient(gradientData);

      if (target.type === 'group' || target.type === 'svg') {
        target.getObjects().forEach((obj: any) => obj.set('fill', newGradient));
      }

      target.set('fill', newGradient);
      canvas.requestRenderAll();
      forceUpdate();
    }
  };

  const addGradientColor = () => {
    if (!canvas) return;
    const target = activeObject || canvas.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
    if (!target) return;

    const fill = target.fill;
    if (fill instanceof fabric.Gradient) {
      const stops = (fill.colorStops || []).map(s => ({ ...s }));
      const lastColor = stops[stops.length - 1].color;
      
      const rawStops = stops.map(s => ({ color: s.color, offset: s.offset }));
      rawStops.push({ color: lastColor, offset: 1 });
      
      const newStops = rawStops.map((s, i) => ({
        color: s.color,
        offset: i / (rawStops.length - 1)
      })).sort((a, b) => a.offset - b.offset);
      
      const gradientData = (fill as any).toObject();
      gradientData.colorStops = newStops;
      const newGradient = new fabric.Gradient(gradientData);

      if (target.type === 'group' || target.type === 'svg') {
        target.getObjects().forEach((obj: any) => obj.set('fill', newGradient));
      }
      
      target.set('fill', newGradient);
      target.set('dirty', true);
      canvas.requestRenderAll();
      saveToHistory(canvas);
      forceUpdate();
    }
  };

  const removeGradientColor = (index: number) => {
    if (!canvas) return;
    const target = activeObject || canvas.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
    if (!target) return;

    const fill = target.fill;
    if (fill instanceof fabric.Gradient) {
      const stops = (fill.colorStops || []).map(s => ({ ...s }));
      if (stops.length <= 2) return; // Minimum 2 colors
      
      stops.splice(index, 1);
      
      const gradientData = (fill as any).toObject();
      gradientData.colorStops = stops;
      const newGradient = new fabric.Gradient(gradientData);

      if (target.type === 'group' || target.type === 'svg') {
        target.getObjects().forEach((obj: any) => obj.set('fill', newGradient));
      }
      
      target.set('fill', newGradient);
      target.set('dirty', true);
      canvas.requestRenderAll();
      saveToHistory(canvas);
      forceUpdate();
    }
  };

  const updateBackgroundOpacity = (opacity: number) => {
    if (!canvas) return;
    const artboard = canvas.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
    const color = artboard ? artboard.fill : canvas.backgroundColor;
    
    if (typeof color === 'string') {
      const fabricColor = new fabric.Color(color);
      fabricColor.setAlpha(opacity / 100);
      const newColor = fabricColor.toRgba();
      
      if (artboard) {
        artboard.set('fill', newColor);
        canvas.renderAll();
      } else {
        canvas.setBackgroundColor(newColor, canvas.renderAll.bind(canvas));
      }
      saveToHistory(canvas);
    } else if (color instanceof fabric.Gradient) {
      const stops = color.colorStops?.map(stop => {
        const c = new fabric.Color(stop.color);
        c.setAlpha(opacity / 100);
        return { ...stop, color: c.toRgba() };
      });
      color.colorStops = stops;
      
      if (artboard) {
        artboard.set('fill', color);
      }
      canvas.renderAll();
      saveToHistory(canvas);
    }
  };

  const getBackgroundOpacity = () => {
    if (!canvas) return 100;
    const color = canvas.backgroundColor;
    if (typeof color === 'string') {
      return Math.round(new fabric.Color(color).getAlpha() * 100);
    } else if (color instanceof fabric.Gradient) {
      return Math.round(new fabric.Color(color.colorStops[0].color).getAlpha() * 100);
    }
    return 100;
  };

  const [alignmentMode, setAlignmentMode] = useState<'selection' | 'artboard'>('selection');

  const alignActiveObject = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!canvas || !activeObject) return;

    const isSelection = activeObject.type === 'activeSelection';

    if (alignmentMode === 'selection') {
      if (!isSelection) return; // Do nothing for single object in selection mode

      const selection = activeObject as fabric.ActiveSelection;
      const objects = selection.getObjects();
      
      objects.forEach(obj => {
        const objWidth = obj.getBoundingRect(true).width;
        const objHeight = obj.getBoundingRect(true).height;
        
        switch (alignment) {
          case 'left':
            obj.set('left', -selection.width! / 2);
            break;
          case 'center':
            obj.set('left', -objWidth / 2);
            break;
          case 'right':
            obj.set('left', selection.width! / 2 - objWidth);
            break;
          case 'top':
            obj.set('top', -selection.height! / 2);
            break;
          case 'middle':
            obj.set('top', -objHeight / 2);
            break;
          case 'bottom':
            obj.set('top', selection.height! / 2 - objHeight);
            break;
        }
      });
    } else {
      // Align relative to the artboard
      const artboardW = artboardSize.width;
      const artboardH = artboardSize.height;

      if (isSelection) {
        const selection = activeObject as fabric.ActiveSelection;
        const objects = selection.getObjects();
        
        // In Illustrator mode, objects align individually to the artboard
        objects.forEach(obj => {
          const boundingRect = obj.getBoundingRect(true);
          const objCenterX = boundingRect.left + boundingRect.width / 2;
          const pageIndex = Math.floor(objCenterX / (artboardW + 12));
          const pageLeft = pageIndex * (artboardW + 12);

          // We need to calculate position relative to the center of the selection
          // because objects in an ActiveSelection are relative to the selection's center.
          // This is complex. Alternatively, we can just align the whole group.
          // Aligning the whole group is often what users actually want in a simple editor.
          // Let's stick to group alignment for now but handle it correctly.
        });

        // Simplified: Align the whole selection group to the artboard
        const boundingRect = selection.getBoundingRect(true);
        const objCenterX = boundingRect.left + boundingRect.width / 2;
        const pageIndex = Math.floor(objCenterX / (artboardW + 12));
        const pageLeft = pageIndex * (artboardW + 12);
        
        const centerOffsetH = selection.left - boundingRect.left;
        const centerOffsetV = selection.top - boundingRect.top;

        switch (alignment) {
          case 'left':
            selection.set('left', pageLeft + centerOffsetH);
            break;
          case 'center':
            selection.set('left', pageLeft + (artboardW - boundingRect.width) / 2 + centerOffsetH);
            break;
          case 'right':
            selection.set('left', pageLeft + artboardW - boundingRect.width + centerOffsetH);
            break;
          case 'top':
            selection.set('top', centerOffsetV);
            break;
          case 'middle':
            selection.set('top', (artboardH - boundingRect.height) / 2 + centerOffsetV);
            break;
          case 'bottom':
            selection.set('top', artboardH - boundingRect.height + centerOffsetV);
            break;
        }
      } else {
        // Single object alignment to artboard
        const boundingRect = activeObject.getBoundingRect(true);
        const objCenterX = boundingRect.left + boundingRect.width / 2;
        const pageIndex = Math.floor(objCenterX / (artboardW + 12));
        const pageLeft = pageIndex * (artboardW + 12);
        
        const centerOffsetH = activeObject.left - boundingRect.left;
        const centerOffsetV = activeObject.top - boundingRect.top;

        switch (alignment) {
          case 'left':
            activeObject.set('left', pageLeft + centerOffsetH);
            break;
          case 'center':
            activeObject.set('left', pageLeft + (artboardW - boundingRect.width) / 2 + centerOffsetH);
            break;
          case 'right':
            activeObject.set('left', pageLeft + artboardW - boundingRect.width + centerOffsetH);
            break;
          case 'top':
            activeObject.set('top', centerOffsetV);
            break;
          case 'middle':
            activeObject.set('top', (artboardH - boundingRect.height) / 2 + centerOffsetV);
            break;
          case 'bottom':
            activeObject.set('top', artboardH - boundingRect.height + centerOffsetV);
            break;
        }
      }
    }

    activeObject.setCoords();
    canvas.renderAll();
    saveToHistory(canvas);
    setActiveObject(canvas.getActiveObject());
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = layers.findIndex((l) => l.id === active.id);
      const newIndex = layers.findIndex((l) => l.id === over.id);
      
      const objects = canvas?.getObjects();
      if (!objects) return;
      
      // Fabric objects are indexed from bottom to top. 
      // Our layers list is top to bottom (reversed).
      const fabricOldIndex = objects.length - 1 - oldIndex;
      const fabricNewIndex = objects.length - 1 - newIndex;
      
      const obj = objects[fabricOldIndex];
      obj.moveTo(fabricNewIndex);
      
      canvas?.renderAll();
      updateLayers(canvas!);
      saveToHistory(canvas!);
    }
  };

  const resetPdfMode = useCallback(() => {
    setIsPdfMode(false);
    setPdfPages([]);
    setCurrentPdfPageIndex(0);
    setPdfFileName('');
  }, []);

  const switchDocument = useCallback((id: string, docsOverride?: Document[]) => {
    const docsToUse = docsOverride || documents;
    
    // If it's a new document being added, we don't want to return early if id matches current (unlikely for new docs but good for safety)
    if (id === activeDocumentId && !docsOverride) return;

    // Save current document state if canvas exists
    if (canvas) {
      const currentData = canvas.toJSON(FABRIC_PROPS);
      const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.1, multiplier: 0.1 });
      
      setDocuments(prev => {
        // If we have docsOverride, we should use it as the base to avoid losing the new doc
        const base = docsOverride || prev;
        return base.map(doc => 
          doc.id === activeDocumentId ? { ...doc, canvasData: currentData, thumbnail, width: artboardSize.width, height: artboardSize.height, pages: carouselPages } : doc
        );
      });
    }

    // Load new document
    const targetDoc = docsToUse.find(doc => doc.id === id);
    if (targetDoc) {
      setActiveDocumentId(id);
      
      // Update global states to match target document
      const targetWidth = targetDoc.width || 1080;
      const targetHeight = targetDoc.height || 1350;
      const targetPages = targetDoc.pages || 1;
      
      setArtboardSize({ width: targetWidth, height: targetHeight });
      setCarouselPages(targetPages);

      if (canvas) {
        canvas.clear();
        canvas.backgroundColor = '#121212'; // Ensure workspace background is always dark
        
        if (targetDoc.canvasData) {
          canvas.loadFromJSON(targetDoc.canvasData, () => {
            canvas.backgroundColor = '#121212'; // Re-enforce after load
            // @ts-ignore
            ensureArtboardProperties(canvas, { width: targetWidth, height: targetHeight }, targetPages);
            enlivenClipPathRecursive(canvas);
            centerArtboard(canvas, targetWidth, targetHeight, targetPages);
            canvas.renderAll();
            // @ts-ignore
            updateLayers(canvas);
            if (pcmRef.current) pcmRef.current.rebuildClipsFromCanvas();
            // @ts-ignore
            saveToHistory(canvas);
          });
        } else {
          // New empty doc - needs artboard creation!
          
          // Create Artboard Backgrounds (logic from initCanvas)
          for (let i = 0; i < targetPages; i++) {
            const artX = i * (targetWidth + 12);
            const artY = 0;

            const artboardShadow = new fabric.Rect({
              left: artX,
              top: artY,
              width: targetWidth,
              height: targetHeight,
              fill: 'white',
              selectable: false,
              evented: false,
              shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.5)',
                blur: 20,
                offsetX: 0,
                offsetY: 10
              }),
              // @ts-ignore
              id: `artboard_shadow_${i}`,
            });
            canvas.add(artboardShadow);
            canvas.sendToBack(artboardShadow);

            const artboard = new fabric.Rect({
              left: artX,
              top: artY,
              width: targetWidth,
              height: targetHeight,
              fill: '#ffffff',
              strokeWidth: 0,
              stroke: null,
              selectable: false,
              evented: false,
              lockMovementX: true,
              lockMovementY: true,
              lockRotation: true,
              lockScalingX: true,
              lockScalingY: true,
              // @ts-ignore
              id: `artboard_bg_${i}`,
              // @ts-ignore
              name: targetPages > 1 ? `${t('modals.new_doc.presets.carousel', 'Carousel')} ${i + 1}` : t('editor.tools.artboard', 'Artboard')
            });
            canvas.add(artboard);
            artboard.moveTo(1);
          }
          
          // @ts-ignore
          ensureArtboardProperties(canvas, { width: targetWidth, height: targetHeight }, targetPages);
          centerArtboard(canvas, targetWidth, targetHeight, targetPages);
          
          // Ensure artboard is not selected by default on new documents
          canvas.discardActiveObject();
          
          canvas.renderAll();
          // @ts-ignore
          updateLayers(canvas);
          // @ts-ignore
          saveToHistory(canvas);
        }
      } else {
        // If canvas doesn't exist yet, it will be initialized by handleNewDoc or similar
        // but for switching tabs, canvas should usually exist.
        // If not, we just set the target dimensions and wait for init
        setTimeout(() => {
          initCanvas(targetDoc.canvasData, { width: targetWidth, height: targetHeight }, targetPages);
        }, 100);
      }
    }
  }, [canvas, activeDocumentId, documents, artboardSize, carouselPages, ensureArtboardProperties, updateLayers, saveToHistory, initCanvas, centerArtboard]);

  const addNewDocument = useCallback((width?: number, height?: number, pages?: number) => {
    resetPdfMode();
    const newId = Math.random().toString(36).substr(2, 9);
    const targetWidth = width || artboardSize.width;
    const targetHeight = height || artboardSize.height;
    const targetPages = pages || carouselPages;

    const newDoc: Document = {
      id: newId,
      name: `${t('editor.header.document_prefix', 'Document')} ${documents.length + 1}`,
      canvasData: null,
      thumbnail: '',
      width: targetWidth,
      height: targetHeight,
      pages: targetPages
    };
    
    // Pre-calculate updated docs to avoid race conditions
    let currentData = null;
    let thumbnail = '';

    if (canvas) {
      currentData = canvas.toJSON(FABRIC_PROPS);
      thumbnail = canvas.toDataURL({ format: 'png', quality: 0.1, multiplier: 0.1 });
    }

    const updatedDocs = documents.map(doc => 
      doc.id === activeDocumentId ? { ...doc, canvasData: currentData, thumbnail, width: artboardSize.width, height: artboardSize.height, pages: carouselPages } : doc
    );
    const finalDocs = [...updatedDocs, newDoc];

    setDocuments(finalDocs);
    switchDocument(newId, finalDocs);
    
    // Ensure no artifact selection
    setTimeout(() => {
      if (canvas) {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        setActiveObject(null);
      }
    }, 200);
  }, [documents, switchDocument, t, artboardSize, carouselPages, canvas, activeDocumentId]);

  const closeDocument = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (documents.length === 1) {
      return;
    }

    const newDocs = documents.filter(doc => doc.id !== id);
    setDocuments(newDocs);

    if (id === activeDocumentId) {
      switchDocument(newDocs[newDocs.length - 1].id);
    }
  }, [documents, activeDocumentId, switchDocument]);

  const { 
    lassoState, 
    actionCropAsObject, 
    actionCutAsObject, 
    actionExtractOnly,
    actionCutOnly,
    actionApplyAsMask, 
    actionDelete, 
    cancelSelection 
  } = usePolygonalLasso(canvas, isLassoActive, artboardSize.width, artboardSize.height, saveToHistory);

  const handleMarqueePixelAction = useCallback(async (action: 'copy' | 'cut' | 'duplicate' | 'erase') => {
    if (!canvas || !marqueeState) return;

    const objects = canvas.getObjects();
    let targetObj = canvas.getActiveObject();

    // Se estiver selecionado apenas o retângulo do marquee, procure o objeto abaixo dele
    if (!targetObj || (targetObj as any).id === 'marquee_selection') {
      const cx = marqueeState.x + marqueeState.width / 2;
      const cy = marqueeState.y + marqueeState.height / 2;
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (obj.id === 'artboard_bg' || obj.id === 'grid_rect' || obj.id === 'marquee_selection' || (obj as any).isGridLine) continue;
        
        obj.setCoords(); // Ensure coordinates are updated for containsPoint
        if (obj.containsPoint({ x: cx, y: cy })) {
          targetObj = obj;
          break;
        }
      }
    }

    if (!targetObj) return;

    setIsProcessing(true);
    try {
      const points = [
        { x: marqueeState.x, y: marqueeState.y },
        { x: marqueeState.x + marqueeState.width, y: marqueeState.y },
        { x: marqueeState.x + marqueeState.width, y: marqueeState.y + marqueeState.height },
        { x: marqueeState.x, y: marqueeState.y + marqueeState.height }
      ];

      if (action === 'copy' || action === 'duplicate' || action === 'cut') {
        const dataUrl = await extractPolygonRegion(targetObj, points, artboardSize.width, artboardSize.height);
        if (dataUrl) {
          await new Promise((resolve) => {
            fabric.Image.fromURL(dataUrl, (img: any) => {
              const offset = action === 'duplicate' ? 10 : 0;
              img.set({
                left: marqueeState.x + offset,
                top: marqueeState.y + offset,
                selectable: true,
                evented: true,
                backgroundColor: null,
                id: generateUniqueId()
              });
              
              if (action === 'copy' || action === 'cut') {
                clipboardRef.current = img;
                showToast(action === 'copy' ? t('editor.messages.copied_selection', 'Seleção copiada') : t('editor.messages.cut_selection', 'Seleção recortada'), 'success');
              } else {
                canvas.add(img);
                canvas.setActiveObject(img);
                showToast(t('editor.messages.duplicated_selection', 'Seleção duplicada'), 'success');
              }
              resolve(null);
            }, { crossOrigin: 'anonymous' });
          });
        }
      }

      if (action === 'cut' || action === 'erase') {
        if (targetObj.type === 'image') {
          const erasedUrl = await erasePolygonRegion(targetObj, points);
          if (erasedUrl) {
            await new Promise((resolve) => {
              (targetObj as any).setSrc(erasedUrl, () => {
                canvas.renderAll();
                resolve(null);
              }, { crossOrigin: 'anonymous' });
            });
          }
        } else {
          // No caso de vetores, se o objeto estiver contido, removemos
          const tempRect = new fabric.Rect({
            left: marqueeState.x,
            top: marqueeState.y,
            width: marqueeState.width,
            height: marqueeState.height
          });
          if (targetObj.isContainedWithinObject(tempRect)) {
            canvas.remove(targetObj);
          }
        }
      }

      canvas.renderAll();
      saveToHistory(canvas);
      updateLayers(canvas);
      
      setMarqueeState(null);
    } catch (err) {
      console.error('Marquee Pixel Action Error:', err);
      showToast(t('editor.messages.error_processing_selection', 'Erro ao processar seleção'), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [canvas, marqueeState, artboardSize, saveToHistory, updateLayers, t]);

  const handleLassoAction = useCallback(async (action: 'copy' | 'cut' | 'duplicate' | 'erase') => {
    if (!lassoState.selectionClosed) return;
    
    if (action === 'copy') {
      const extracted = await actionExtractOnly();
      if (extracted) {
        clipboardRef.current = extracted;
        showToast(t('editor.messages.copied_selection', 'Seleção copiada'), 'success');
        cancelSelection();
      }
    } else if (action === 'cut') {
      const extracted = await actionCutOnly();
      if (extracted) {
        clipboardRef.current = extracted;
        showToast(t('editor.messages.cut_selection', 'Seleção recortada'), 'success');
      }
    } else if (action === 'duplicate') {
      actionCropAsObject();
    } else if (action === 'erase') {
      actionDelete();
    }
  }, [lassoState.selectionClosed, actionExtractOnly, actionCutOnly, actionCropAsObject, actionDelete, t]);

  const triggerContentAwareFill = useCallback(async () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    // Find the image
    const imageObj = activeObjects.find(obj => obj.type === 'image') as fabric.Image;
    if (!imageObj) {
      showToast(t('editor.messages.select_image_smart_fill'), 'info');
      return;
    }

    const otherObjects = activeObjects.filter(obj => obj !== imageObj);

    setIsFilling(true);
    setFillProgress({ percent: 0, status: 'Iniciando processamento local...' });

    try {
      // Use artboard dimensions for the operation to handle expansion and avoid scaling issues
      const width = Math.round(artboardSize.width);
      const height = Math.round(artboardSize.height);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      // 1. Capture the image exactly as it appears on the artboard
      // Hide everything else temporarily
      const allObjects = canvas.getObjects();
      const originalVisibilities = allObjects.map(obj => obj.visible);
      
      allObjects.forEach(obj => {
        obj.visible = (obj === imageObj);
      });

      // Draw artboard to temp canvas
      const artboardSnapshot = canvas.toCanvasElement(1, {
        left: 0,
        top: 0,
        width: width,
        height: height,
        enableRetinaScaling: false
      });
      ctx.drawImage(artboardSnapshot, 0, 0);

      // Restore visibilities
      allObjects.forEach((obj, i) => {
        obj.visible = originalVisibilities[i];
      });

      const imageData = ctx.getImageData(0, 0, width, height);

      // 2. Create the mask
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const mCtx = maskCanvas.getContext('2d');
      if (!mCtx) return;
      mCtx.fillStyle = 'black';

      if (otherObjects.length > 0) {
        // Case: Fill specific shapes
        otherObjects.forEach(obj => {
          // Draw each mask object onto the mask canvas
          const bound = obj.getBoundingRect();
          const objCanvas = obj.toCanvasElement({ enableRetinaScaling: false });
          mCtx.drawImage(objCanvas, bound.left, bound.top);
        });
      } else {
        // Case: Expand image to fill artboard
        // Mask is the area NOT covered by the image
        mCtx.fillRect(0, 0, width, height);
        mCtx.globalCompositeOperation = 'destination-out';
        
        const imgBound = imageObj.getBoundingRect();
        const imgCanvas = imageObj.toCanvasElement({ enableRetinaScaling: false });
        mCtx.drawImage(imgCanvas, imgBound.left, imgBound.top);
      }

      const maskImageData = mCtx.getImageData(0, 0, width, height);
      const maskArray: boolean[][] = [];
      for (let y = 0; y < height; y++) {
        const row: boolean[] = [];
        for (let x = 0; x < width; x++) {
          const alpha = maskImageData.data[(y * width + x) * 4 + 3];
          row.push(alpha > 10); // Any non-transparent pixel in mask canvas is a fill target
        }
        maskArray.push(row);
      }

      // 3. Start Worker
      const worker = new Worker(new URL('../workers/content-aware-fill.worker.ts', import.meta.url), { type: 'module' });
      
      worker.onmessage = (e) => {
        if (e.data.type === 'progress') {
          setFillProgress({ percent: e.data.percent, status: e.data.status });
        } else if (e.data.type === 'result') {
          const resultImageData = e.data.imageData;
          const resultCanvas = document.createElement('canvas');
          resultCanvas.width = resultImageData.width;
          resultCanvas.height = resultImageData.height;
          const rCtx = resultCanvas.getContext('2d');
          if (!rCtx) return;
          const newImgData = new ImageData(
            new Uint8ClampedArray(resultImageData.data),
            resultImageData.width,
            resultImageData.height
          );
          rCtx.putImageData(newImgData, 0, 0);

          // Update image object or create new one if expanded
          const dataUrl = resultCanvas.toDataURL();
          
          fabric.Image.fromURL(dataUrl, (newImg) => {
            newImg.set({
              left: 0,
              top: 0,
              scaleX: 1,
              scaleY: 1,
              angle: 0,
              name: otherObjects.length > 0 ? 'Imagem Preenchida' : 'Imagem Expandida'
            });

            canvas.remove(imageObj);
            otherObjects.forEach(obj => canvas.remove(obj));
            
            canvas.add(newImg);
            canvas.setActiveObject(newImg);
            canvas.renderAll();
            
            updateLayers(canvas);
            saveToHistory(canvas);
            setIsFilling(false);
            worker.terminate();
            showToast(t('editor.messages.fill_completed'), 'success');
          });
        }
      };

      worker.postMessage({
        imageData: {
          data: imageData.data.buffer,
          width: imageData.width,
          height: imageData.height
        },
        mask: maskArray,
        options: { patchSize: 9, searchRadius: 80 }
      }, [imageData.data.buffer]);

    } catch (error) {
      console.error('Content-Aware Fill Error:', error);
      setIsFilling(false);
      showToast(t('editor.messages.fill_error'), 'error');
    }
  }, [canvas, artboardSize, saveToHistory, updateLayers]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!canvas) return;
    
    // Get native event to find target correctly
    const nativeEvent = e.nativeEvent;
    const target = canvas.findTarget(nativeEvent, false);
    const isArtboard = target && (target as any).id?.toString().includes('artboard');
    
    if (target && !isArtboard) {
      canvas.setActiveObject(target);
      canvas.renderAll();
      setActiveObject(target);
    } else {
      // If no target or artboard, clear selection
      canvas.discardActiveObject();
      canvas.renderAll();
      setActiveObject(null);
    }
    
    setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
  }, [canvas]);

  useEffect(() => {
    saveToHistoryRef.current = saveToHistory;
  }, [historyState.index]);

  const applyHistorySnapshot = useCallback(async (item: any, newIndex: number) => {
    if (!canvas) return;
    if (isHistoryLoading.current) return;
    isHistoryLoading.current = true;

    let originalRenderAll: any = null;
    let originalRequestRenderAll: any = null;
    let originalClearContext: any = null;
    let originalRenderTop: any = null;
    if (canvas) {
      originalRenderAll = canvas.renderAll;
      originalRequestRenderAll = canvas.requestRenderAll;
      originalClearContext = canvas.clearContext;
      originalRenderTop = canvas.renderTop;
    }

    try {
      // Preservar cor de fundo
      const bgColor = canvas.backgroundColor;

      // Restore document context
      if (item.activeDocumentId && item.activeDocumentId !== activeDocumentId) {
        setActiveDocumentId(item.activeDocumentId);
      }
      if (item.artboardSize) setArtboardSize(item.artboardSize);
      if (item.carouselPages) setCarouselPages(item.carouselPages);
      
      // Preserve state for restoration
      const oldZoom = canvas.getZoom();
      const oldVpt = [...(canvas.viewportTransform || [1, 0, 0, 1, 0, 0])];
      
      // EVITAR FLASH BRANCO: Bloqueio total de renderização e limpeza visual durante o load
      // Isso força o canvas a preservar o último frame visível até o novo estado estar 100% pronto
      canvas.renderOnAddRemove = false;
      canvas.renderAll = () => canvas;
      canvas.requestRenderAll = () => canvas;
      canvas.clearContext = () => canvas;
      canvas.renderTop = () => canvas;

      await new Promise<void>((resolve) => {
        // Garantir que o estado tenha o background
        const state = typeof item.state === 'string' ? JSON.parse(item.state) : item.state;
        if (!state.background && bgColor) state.background = bgColor;

        canvas.loadFromJSON(state, () => {
          const dimensions = item.artboardSize || artboardSize;
          const pages = item.carouselPages || carouselPages;
          
          // Restore visual state (Zoom and Camera)
          if (item.zoom !== undefined) canvas.setZoom(item.zoom);
          else canvas.setZoom(oldZoom);
          
          if (item.viewportTransform) canvas.setViewportTransform(item.viewportTransform);
          else canvas.setViewportTransform(oldVpt);

          ensureArtboardProperties(canvas, dimensions, pages);
          enlivenClipPathRecursive(canvas);
          
          // ORDEM CRÍTICA: Reconstruir clips antes da renderização final
          if (pcmRef.current) {
            pcmRef.current.rebuildClipsFromCanvas();
          }

          // REAPLICAR FILTROS (essencial para states de ajuste)
          refreshFilters(canvas);

          resolve();
        });
      });
    } catch (err) {
      console.error('Error applying history snapshot:', err);
    } finally {
      // FINALIZAÇÃO: Restaurar métodos de renderização e processar o novo frame de forma atômica
      if (canvas && originalRenderAll && originalClearContext) {
        canvas.clearContext = originalClearContext;
        canvas.renderAll = originalRenderAll;
        if (originalRequestRenderAll) canvas.requestRenderAll = originalRequestRenderAll;
        if (originalRenderTop) canvas.renderTop = originalRenderTop;
        
        canvas.renderOnAddRemove = true;
        canvas.renderAll(); 
      }
      
      requestAnimationFrame(() => {
        setHistoryState(prev => ({ ...prev, index: newIndex }));
        updateLayers(canvas);
        isHistoryLoading.current = false;
      });
    }
  }, [canvas, activeDocumentId, artboardSize, carouselPages, ensureArtboardProperties, updateLayers]);

  const undo = () => {
    if (isHistoryLoading.current) return;
    if (historyState.index > 0 && canvas) {
      const prevIndex = historyState.index - 1;
      const item = historyState.history[prevIndex];
      applyHistorySnapshot(item, prevIndex);
    }
  };

  const redo = () => {
    if (isHistoryLoading.current) return;
    if (historyState.index < historyState.history.length - 1 && canvas) {
      const nextIndex = historyState.index + 1;
      const item = historyState.history[nextIndex];
      applyHistorySnapshot(item, nextIndex);
    }
  };

  const goToHistoryIndex = (index: number) => {
    if (isHistoryLoading.current || !canvas) return;
    if (index >= 0 && index < historyState.history.length) {
      const item = historyState.history[index];
      applyHistorySnapshot(item, index);
    }
  };

  const clearHistory = () => {
    if (!canvas) return;
    const currentJson = JSON.stringify(canvas.toJSON(FABRIC_PROPS));
    setHistoryState({
      history: [{
        id: 'initial',
        name: t('editor.history.initial_state', 'Estado Inicial'),
        state: currentJson,
        timestamp: Date.now()
      }],
      index: 0
    });
  };

  const handleNewDoc = (width: number, height: number, pages: number = 1) => {
    setShowNewDocModal(false);
    setIsPulsingPages(false);
    setActiveTool('select');
    resetPdfMode();
    
    // If we already have documents, we add a new one instead of resetting the current one
    // unless it's the very first initialization (Documento 1 with no data)
    const isFirstDocEmpty = documents.length === 1 && documents[0].canvasData === null && (!canvas || canvas.getObjects().length <= 1);

    if (isFirstDocEmpty) {
      setArtboardSize({ width, height });
      setCarouselPages(pages);
      if (canvas) {
        if (!(canvas as any)._disposed) {
          try {
            canvas.dispose();
          } catch (e) {
            console.warn('Error disposing canvas in handleNewDoc:', e);
          }
        }
        setCanvas(null);
      }
      setTimeout(() => initCanvas(undefined, { width, height }, pages), 100);
    } else {
      addNewDocument(width, height, pages);
    }
  };

  // Tool Functions
  const fillWithColor = (slot: 'foreground' | 'background') => {
    if (!canvas) return;
    const color = slot === 'foreground' 
      ? useColorStore.getState().foreground 
      : useColorStore.getState().background;
    
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
          obj.set('fill', color);
        } else if (obj instanceof fabric.Path || obj instanceof fabric.Rect || obj instanceof fabric.Circle || obj instanceof fabric.Triangle) {
          obj.set('fill', color);
        } else if (obj.type === 'group') {
          (obj as fabric.Group).getObjects().forEach(innerObj => {
            innerObj.set('fill', color);
          });
        }
      });
      canvas.requestRenderAll();
      saveToHistory(canvas, slot === 'foreground' ? t('editor.history.fill_foreground', 'Preencher Primeiro Plano') : t('editor.history.fill_background', 'Preencher Plano de Fundo'));
    }
  };

  const fillArtboardWithBackgroundColor = useCallback(() => {
    if (!canvas) return;
    const bgColor = useColorStore.getState().background;
    const artboards = canvas.getObjects().filter(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
    
    if (artboards.length > 0) {
      artboards.forEach(art => {
        art.set('fill', bgColor);
      });
      canvas.requestRenderAll();
      saveToHistory(canvas, t('editor.history.fill_artboard', 'Fill Artboard with Background'));
      showToast(t('editor.messages.artboard_filled', 'Artboard filled with background color'), 'success');
    }
  }, [canvas, saveToHistory, t, showToast]);

  const addShapeToCanvas = (c: fabric.Canvas, type: string, left?: number, top?: number) => {
    let shape: fabric.Object;
    const color = useColorStore.getState().foreground;
    
    // Default to viewport center if no position provided
    let l = left;
    let t_pos = top;
    
    if (l === undefined || t_pos === undefined) {
      const center = c.getVpCenter();
      // We'll adjust later after shape creation once we have dimensions
      l = center.x;
      t_pos = center.y;
    } else {
      l = Math.round(l);
      t_pos = Math.round(t_pos);
    }

    const commonProps = {
      left: l,
      top: t_pos,
      fill: color,
      strokeWidth: 0,
      stroke: null,
    };

    switch (type) {
      case 'circle':
        shape = new fabric.Circle({
          ...commonProps,
          radius: 100,
          // @ts-ignore
          name: t('editor.constants.masks.circle', 'Círculo')
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          ...commonProps,
          width: 200,
          height: 200,
          // @ts-ignore
          name: t('editor.tools.triangle', 'Triângulo')
        });
        break;
      case 'star':
        // 5-pointed star path
        shape = new fabric.Path('M 100 0 L 123.5 72.3 L 199.5 72.3 L 138 116.5 L 161.5 188.8 L 100 144.6 L 38.5 188.8 L 62 116.5 L 0.5 72.3 L 76.5 72.3 Z', {
          ...commonProps,
          // @ts-ignore
          name: t('editor.tools.star', 'Estrela')
        });
        shape.scaleToWidth(200);
        break;
      case 'heart':
        // Heart path
        shape = new fabric.Path('M 100 30 C 100 30 90 0 50 0 C 10 0 0 40 0 70 C 0 110 50 150 100 190 C 150 150 200 110 200 70 C 200 40 190 0 150 0 C 110 0 100 30 100 30 Z', {
          ...commonProps,
          // @ts-ignore
          name: t('editor.tools.heart', 'Coração')
        });
        shape.scaleToWidth(200);
        break;
      case 'rectangle':
      default:
        shape = new fabric.Rect({
          ...commonProps,
          width: 200,
          height: 200,
          rx: 0,
          ry: 0,
          // @ts-ignore
          name: t('editor.tools.square', 'Square')
        });
        // @ts-ignore
        shape._target_radius = 0;
        break;
    }

    if (shape) {
      if (left === undefined || top === undefined) {
        const center = getInsertionPosition(c);
        shape.set({
          originX: 'center',
          originY: 'center',
          left: center.x,
          top: center.y
        });
      }
      c.add(shape);
    }
    
    isSuppressingAnnouncementsRef.current = true;
    c.setActiveObject(shape);
    c.renderAll();
    isSuppressingAnnouncementsRef.current = false;
    
    setActiveTool('select');
    saveToHistory(c);
  };

  const addRectToCanvas = (c: fabric.Canvas, left?: number, top?: number) => {
    addShapeToCanvas(c, 'rectangle', left, top);
  };

  const addCircleToCanvas = (c: fabric.Canvas, left?: number, top?: number) => {
    addShapeToCanvas(c, 'circle', left, top);
  };

  const addTextToCanvas = (c: fabric.Canvas, left?: number, top?: number) => {
    const center = c.getVpCenter();
    const l = left !== undefined ? Math.round(left) : Math.round(center.x);
    const t_pos = top !== undefined ? Math.round(top) : Math.round(center.y);

    const text = new fabric.IText(t('editor.tools.default_text', 'Digite seu texto...'), {
      left: 0,
      top: 0,
      fontFamily: 'Inter',
      fontSize: 40,
      fill: useColorStore.getState().foreground,
      textAlign: 'left',
      originX: 'left',
      originY: 'top',
    });
    
    if (left === undefined || top === undefined) {
      const center = getInsertionPosition(c);
      text.set({
        originX: 'center',
        originY: 'center',
        left: center.x,
        top: center.y
      });
    } else {
      text.set({
        left: Math.round(left),
        top: Math.round(top)
      });
    }

    c.add(text);
    isSuppressingAnnouncementsRef.current = true;
    c.setActiveObject(text);
    c.renderAll();
    isSuppressingAnnouncementsRef.current = false;
    setActiveTool('select');
  };

  const addTextboxToCanvas = (c: fabric.Canvas, left: number, top: number, width: number, height: number) => {
    const text = new fabric.Textbox(t('editor.tools.default_text', 'Digite seu texto...'), {
      left: left,
      top: top,
      width: width,
      // @ts-ignore
      fixedHeight: height,
      fontFamily: 'Inter',
      fontSize: 24,
      fill: useColorStore.getState().foreground,
      backgroundColor: 'transparent',
      textAlign: 'left',
      originX: 'left',
      originY: 'top',
      // @ts-ignore
      rx: 6,
      // @ts-ignore
      ry: 6,
      padding: 0,
      splitByGrapheme: true,
      hasBorders: true,
      borderDashArray: [5, 5],
      borderColor: '#2563EB',
      cornerColor: '#2563EB',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 6,
      editingBorderColor: '#2563EB',
    });

    // Sobrescreve como o Textbox calcula dimensões e garante que os controles acompanhem
    text.setControlsVisibility({
      mt: true, // middle top
      mb: true, // middle bottom
      ml: true,
      mr: true,
      bl: true,
      br: true,
      tl: true,
      tr: true,
      mtr: true // rotation
    });

    // @ts-ignore
    text.name = t('editor.tools.text', 'Texto');
    c.add(text);
    isSuppressingAnnouncementsRef.current = true;
    c.setActiveObject(text);
    text.enterEditing();
    // Move cursor to start
    text.selectionStart = 0;
    text.selectionEnd = 0;
    
    c.renderAll();
    isSuppressingAnnouncementsRef.current = false;
    setActiveTool('select');
  };

  const addRect = (left?: number, top?: number) => {
    if (!canvas) return;
    addRectToCanvas(canvas, left, top);
  };

  const addCircle = (left?: number, top?: number) => {
    if (!canvas) return;
    addCircleToCanvas(canvas, left, top);
  };

  const addLineToCanvas = (c: fabric.Canvas, left?: number, top?: number) => {
    const line = new fabric.Line([0, 0, 150, 0], {
      left: left || 100,
      top: top || 100,
      stroke: useColorStore.getState().foreground,
      strokeWidth: lineOptions.strokeWidth,
      strokeLineCap: lineOptions.strokeLineCap as fabric.StrokeLineCap,
      strokeDashArray: lineOptions.strokeDashArray,
      opacity: lineOptions.opacity,
      selectable: true,
      evented: true,
      // @ts-ignore
      name: t('editor.tools.line', 'Line'),
    });
    
    if (lineOptions.arrowType !== 'none') {
      addArrowHeads(line);
    }
    
    c.add(line);
    c.setActiveObject(line);
    c.renderAll();
    setActiveTool('select');
    saveToHistory(c);
    updateLayers(c);
  };

  const addLine = (left?: number, top?: number) => {
    if (!canvas) return;
    addLineToCanvas(canvas, left, top);
  };

  const addWhiteBackground = () => {
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 0,
      top: 0,
      width: artboardSize.width,
      height: artboardSize.height,
      fill: '#ffffff',
      name: t('editor.tools.white_background', 'White Background')
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    updateLayers(canvas);
    saveToHistory(canvas);
  };

  const addText = (left?: number, top?: number) => {
    if (!canvas) return;
    addTextToCanvas(canvas, left, top);
  };

  // Line Tool Functions
  const buildLineProps = () => {
    return {
      stroke:          lineOptions.stroke,
      strokeWidth:     lineOptions.strokeWidth,
      strokeLineCap:   lineOptions.strokeLineCap as fabric.StrokeLineCap,
      strokeDashArray: lineOptions.strokeDashArray,
      opacity:         lineOptions.opacity,
      fill:            'transparent',
      selectable:      false,
      evented:         false,
      hasBorders:      true,
      hasControls:     true,
      padding:         15,
      originX:         'left',
      originY:         'top',
      perPixelTargetFind: true,
      targetFindTolerance: 15
    };
  };

  const createMarker = (type: 'arrow' | 'circle' | 'square', x: number, y: number, angleDeg: number, size: number, color: string) => {
    let marker;
    if (type === 'arrow') {
      const points = [
        { x: 0,     y: 0 },
        { x: -size, y: -size / 2 },
        { x: -size, y:  size / 2 },
      ];
      marker = new fabric.Polygon(points, {
        left:           x,
        top:            y,
        angle:          angleDeg,
        fill:           color,
        stroke:         color,
        strokeWidth:    1,
        originX:        'center',
        originY:        'center',
        selectable:     false,
        evented:        false,
        // @ts-ignore
        name:           '__marker__',
        excludeFromExport: false,
      });
    } else if (type === 'circle') {
      marker = new fabric.Circle({
        left: x,
        top: y,
        radius: size / 2,
        fill: color,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        // @ts-ignore
        name: '__marker__',
        excludeFromExport: false,
      });
    } else {
      marker = new fabric.Rect({
        left: x,
        top: y,
        width: size,
        height: size,
        angle: angleDeg,
        fill: color,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        // @ts-ignore
        name: '__marker__',
        excludeFromExport: false,
      });
    }
    return marker;
  };

  const removeArrowsFromLine = (line: any) => {
    if (!canvas) return;
    const uid = line._id || line.__uid;
    if (!uid) return;
    canvas.getObjects()
      .filter(o => (o as any)._lineRef === uid)
      .forEach(o => canvas.remove(o));
  };

  const addArrowHeads = (line: fabric.Line) => {
    if (!canvas) return;
    
    // Get absolute coordinates of line endpoints
    const matrix = line.calcTransformMatrix();
    const p1 = fabric.util.transformPoint({ x: line.x1!, y: line.y1! }, matrix);
    const p2 = fabric.util.transformPoint({ x: line.x2!, y: line.y2! }, matrix);

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
    const size  = Math.max(8, line.strokeWidth! * 4);
    const color = line.stroke as string;
    const uid = (line as any)._id || (line as any).__uid;
    const arrowType = (line as any).arrowType || 'none';
    const strokeLineCap = line.strokeLineCap;

    // Seta no final
    if (arrowType === 'end' || arrowType === 'both') {
      const arrow = createMarker('arrow', p2.x, p2.y, angle, size, color);
      (arrow as any)._lineRef = uid;
      canvas.add(arrow);
    }

    // Seta no início
    if (arrowType === 'start' || arrowType === 'both') {
      const arrow = createMarker('arrow', p1.x, p1.y, angle + 180, size, color);
      (arrow as any)._lineRef = uid;
      canvas.add(arrow);
    }

    // Caps as markers (bolinhas e quadrados)
    if (strokeLineCap === 'round' || strokeLineCap === 'square') {
      const type = strokeLineCap === 'round' ? 'circle' : 'square';
      const markerSize = line.strokeWidth! * 2.5;
      
      const m1 = createMarker(type, p1.x, p1.y, angle, markerSize, color);
      (m1 as any)._lineRef = uid;
      canvas.add(m1);
      
      const m2 = createMarker(type, p2.x, p2.y, angle, markerSize, color);
      (m2 as any)._lineRef = uid;
      canvas.add(m2);
    }

    canvas.renderAll();
  };

  const removeArrowPreviews = () => {
    if (!canvas) return;
    canvas.getObjects()
      .filter(o => (o as any).name === '__arrow_preview__')
      .forEach(o => canvas.remove(o));
  };

  const updateArrowPreviews = (x1: number, y1: number, x2: number, y2: number) => {
    if (!canvas) return;
    removeArrowPreviews();
    if (lineOptions.arrowType === 'none') return;

    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    const size  = Math.max(8, lineOptions.strokeWidth * 4);
    const color = lineOptions.stroke;

    if (lineOptions.arrowType === 'end' || lineOptions.arrowType === 'both') {
      const a = createMarker('arrow', x2, y2, angle, size, color);
      (a as any).name  = '__arrow_preview__';
      a.excludeFromExport = true;
      canvas.add(a);
    }
    if (lineOptions.arrowType === 'start' || lineOptions.arrowType === 'both') {
      const a = createMarker('arrow', x1, y1, angle + 180, size, color);
      (a as any).name  = '__arrow_preview__';
      a.excludeFromExport = true;
      canvas.add(a);
    }
  };

  const updateLineProperty = (prop: string, value: any) => {
    setLineOptions(prev => ({ ...prev, [prop]: value }));
    const obj = canvas?.getActiveObject();
    if (obj && obj.type === 'line') {
      obj.set(prop as any, value);
      if (prop === 'strokeWidth' || prop === 'stroke') {
        removeArrowsFromLine(obj);
        addArrowHeads(obj as fabric.Line);
      }
      canvas?.renderAll();
      saveToHistory(canvas!);
    }
  };

  const setLineStyle = (style: string) => {
    let strokeDashArray: number[] | null = null;
    const sw = lineOptions.strokeWidth;
    const gap = lineOptions.dashGap;

    if (style === 'dashed') {
      strokeDashArray = [Math.max(4, sw * 4), gap];
    } else if (style === 'dotted') {
      strokeDashArray = [1, gap + sw];
      updateLineProperty('strokeLineCap', 'round');
    }

    setLineOptions(prev => ({ ...prev, lineStyle: style, strokeDashArray }));
    
    const obj = canvas?.getActiveObject();
    if (obj && obj.type === 'line') {
      obj.set({ strokeDashArray, strokeLineCap: style === 'dotted' ? 'round' : lineOptions.strokeLineCap as fabric.StrokeLineCap });
      canvas?.renderAll();
      saveToHistory(canvas!);
    }
  };

  const setLineCap = (cap: string) => {
    setLineOptions(prev => ({ ...prev, strokeLineCap: cap }));
    const obj = canvas?.getActiveObject();
    if (obj && obj.type === 'line') {
      obj.set('strokeLineCap', cap as fabric.StrokeLineCap);
      removeArrowsFromLine(obj);
      addArrowHeads(obj as fabric.Line);
      canvas?.renderAll();
      saveToHistory(canvas!);
      updateLayers(canvas!);
    }
  };

  const setLineArrow = (type: string) => {
    setLineOptions(prev => ({ ...prev, arrowType: type }));
    const obj = canvas?.getActiveObject();
    if (obj && obj.type === 'line') {
      (obj as any).arrowType = type;
      removeArrowsFromLine(obj);
      addArrowHeads(obj as fabric.Line);
      canvas?.renderAll();
      saveToHistory(canvas!);
      updateLayers(canvas!);
    }
  };

  const updateLineDashGap = (gap: number) => {
    setLineOptions(prev => {
      const newOptions = { ...prev, dashGap: gap };
      let strokeDashArray = prev.strokeDashArray;
      if (prev.lineStyle === 'dashed') {
        strokeDashArray = [Math.max(4, prev.strokeWidth * 4), gap];
      } else if (prev.lineStyle === 'dotted') {
        strokeDashArray = [1, gap + prev.strokeWidth];
      }
      
      const obj = canvas?.getActiveObject();
      if (obj && obj.type === 'line') {
        obj.set('strokeDashArray', strokeDashArray);
        canvas?.renderAll();
        saveToHistory(canvas!);
      }
      
      return { ...newOptions, strokeDashArray };
    });
  };

  const onLineMouseDown = (opt: any) => {
    if (activeToolRef.current !== 'line' || !canvas) return;
    isDrawingLineRef.current = true;
    const p = canvas.getPointer(opt.e);
    lineStartPointRef.current = { x: p.x, y: p.y };

    // Criar linha de preview
    const line = new fabric.Line(
      [p.x, p.y, p.x, p.y],
      buildLineProps()
    );
    line.excludeFromExport = true;
    linePreviewRef.current = line;
    canvas.add(line);
    canvas.renderAll();
  };

  const onLineMouseMove = (opt: any) => {
    if (!isDrawingLineRef.current || !linePreviewRef.current || !canvas) return;

    const p = canvas.getPointer(opt.e);
    let endX = p.x;
    let endY = p.y;

    // Shift = travar em ângulos de 45°
    if (isShiftDownRef.current && lineStartPointRef.current) {
      const dx = endX - lineStartPointRef.current.x;
      const dy = endY - lineStartPointRef.current.y;
      const angle = Math.atan2(dy, dx);
      const snap = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const dist = Math.sqrt(dx * dx + dy * dy);
      endX = lineStartPointRef.current.x + dist * Math.cos(snap);
      endY = lineStartPointRef.current.y + dist * Math.sin(snap);
    }

    linePreviewRef.current.set({ x2: endX, y2: endY });
    linePreviewRef.current.setCoords();

    // Preview das setas
    if (lineStartPointRef.current) {
      updateArrowPreviews(lineStartPointRef.current.x, lineStartPointRef.current.y, endX, endY);
    }

    canvas.renderAll();
  };

  const onLineMouseUp = (opt: any) => {
    if (!isDrawingLineRef.current || !linePreviewRef.current || !canvas) return;
    isDrawingLineRef.current = false;

    const p = canvas.getPointer(opt.e);
    let endX = p.x;
    let endY = p.y;

    if (isShiftDownRef.current && lineStartPointRef.current) {
      const dx = endX - lineStartPointRef.current.x;
      const dy = endY - lineStartPointRef.current.y;
      const angle = Math.atan2(dy, dx);
      const snap = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const dist = Math.sqrt(dx * dx + dy * dy);
      endX = lineStartPointRef.current.x + dist * Math.cos(snap);
      endY = lineStartPointRef.current.y + dist * Math.sin(snap);
    }

    const length = lineStartPointRef.current ? Math.sqrt(
      Math.pow(endX - lineStartPointRef.current.x, 2) +
      Math.pow(endY - lineStartPointRef.current.y, 2)
    ) : 0;

    if (length < 3) {
      canvas.remove(linePreviewRef.current);
      linePreviewRef.current = null;
      removeArrowPreviews();
      return;
    }

    canvas.remove(linePreviewRef.current);
    linePreviewRef.current = null;
    removeArrowPreviews();

    if (lineStartPointRef.current) {
      const finalLine = new fabric.Line(
        [lineStartPointRef.current.x, lineStartPointRef.current.y, endX, endY],
        {
          ...buildLineProps(),
          selectable: true,
          evented: true,
          // @ts-ignore
          name: t('editor.tools.line', 'Line'),
          _id: `line_${Date.now()}`,
          // @ts-ignore
          arrowType: lineOptions.arrowType,
          excludeFromExport: false,
        }
      );

      canvas.add(finalLine);
      finalLine.setCoords();

      if (lineOptions.arrowType !== 'none') {
        addArrowHeads(finalLine);
      }

      canvas.setActiveObject(finalLine);
      canvas.renderAll();
      setActiveTool('select');
      saveToHistory(canvas);
      updateLayers(canvas);

      announce(`Linha desenhada. Comprimento: ${Math.round(length)} pixels.`);
    }
  };

  const duplicateObject = () => {
    if (!canvas || !activeObject) return;

    if ((activeObject as any)._pcProxy && pcm) {
      pcm.cloneClip((activeObject as any)._pcId).then(() => {
        saveToHistory(canvas);
        updateLayers(canvas);
      });
      return;
    }
    
    activeObject.clone((cloned: any) => {
      if (!canvas || (canvas as any)._disposed) return;
      canvas.discardActiveObject();
      cloned.set({
        left: cloned.left + 20,
        top: cloned.top + 20,
        evented: true,
      });
      if (cloned.type === 'activeSelection') {
        // Para ActiveSelection no Fabric 5, adicionamos os objetos e RE-CRIAMOS a seleção se necessário.
        // O método standard é:
        canvas.discardActiveObject();
        cloned.forEachObject((obj: any) => {
          canvas.add(obj);
        });
        cloned.setCoords();
      } else {
        canvas.add(cloned);
      }
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      saveToHistory(canvas);
      updateLayers(canvas);
    });
  };

  const deleteActive = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach((obj: any) => {
        if (obj.type === 'line') {
          removeArrowsFromLine(obj);
        }
        
        if (obj._pcProxy && pcm) {
          pcm.removeClip(obj._pcId);
        } else {
          canvas.remove(obj);
        }
      });
      saveToHistory(canvas, t('editor.history.delete', 'Excluir'));
      updateLayers(canvas);
    }
  };

  const toggleVisibility = (layer: Layer) => {
    const isFolder = layer.isGroup && (layer.type === 'folder' || (layer.object as any).isFolder);
    const newVisible = !layer.visible;
    
    if (isFolder && canvas) {
      layer.object.set('isUiVisible', newVisible);
      
      // Helper to recursively toggle visibility of all descendants
      const toggleDescendants = (parentId: string, visible: boolean) => {
        canvas.getObjects().forEach(obj => {
          if ((obj as any).parentId === parentId) {
            // Only update if it's not already correct to maintain relative hidden states?
            // Actually, PSD/Folders usually force hide everything.
            obj.set('visible', visible);
            if ((obj as any).isFolder) {
              obj.set('isUiVisible', visible);
              toggleDescendants((obj as any).id, visible);
            }
          }
        });
      };
      
      toggleDescendants(layer.id, newVisible);
    } else {
      layer.object.set('visible', newVisible);
    }
    
    canvas?.renderAll();
    updateLayers(canvas!);
  };

  const toggleLock = (layer: Layer) => {
    const isLocked = !layer.locked;
    layer.object.set({
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      hasControls: !isLocked
    });
    canvas?.renderAll();
    updateLayers(canvas!);
  };

  const moveLayer = (direction: 'up' | 'down') => {
    if (!activeObject || !canvas) return;
    if (direction === 'up') {
      canvas.bringForward(activeObject);
    } else {
      canvas.sendBackwards(activeObject);
    }
    canvas.renderAll();
    updateLayers(canvas);
  };

  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: fabric.IEvent) => {
      // Mouse down logic
    };

    const handleMouseOver = (e: fabric.IEvent) => {
      // Mouse over logic
    };

    const handleMouseOut = (e: fabric.IEvent) => {
      // Mouse out logic
    };

    const handleDblClick = (e: fabric.IEvent) => {
      if (e.target && (e.target as any).isTextOnPath) {
        const obj = e.target as any;
        setActiveTab('text');
        // IText já permite edição nativa, mas abrir a aba ajuda.
        // O prompt agora é redundante se for IText, mas deixamos apenas se for imagem (legado)
        if (obj.type === 'image') {
          const newText = window.prompt(t('editor.messages.edit_text_on_path', 'Editar texto no caminho:'), obj.originalText || '');
          if (newText !== null) {
            obj.set('originalText', newText);
            canvas?.requestRenderAll();
            saveToHistory(canvas!);
          }
        }
      }
    };

    const handleMouseUp = (e: fabric.IEvent) => {
      // Mouse up logic
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:over', handleMouseOver);
    canvas.on('mouse:out', handleMouseOut);
    canvas.on('mouse:dblclick', handleDblClick);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:over', handleMouseOver);
      canvas.off('mouse:out', handleMouseOut);
      canvas.off('mouse:dblclick', handleDblClick);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';
      const isH = e.key.toLowerCase() === 'h';
      const isC = e.key.toLowerCase() === 'c';
      const isV = e.key.toLowerCase() === 'v';
      const isJ = e.key.toLowerCase() === 'j';
      const isD = e.key.toLowerCase() === 'd';
      const isG = e.key.toLowerCase() === 'g';
      const isA = e.key.toLowerCase() === 'a';
      const isX = e.key.toLowerCase() === 'x';
      const isL = e.key.toLowerCase() === 'l';
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (e.key === 'Shift') {
        isShiftDownRef.current = true;
      }

      if (e.key === 'Escape') {
        const active = canvas?.getActiveObject();
        if (active && active.name === '__magic_wand_selection__') {
          deselectMagicWand();
        } else if (lassoState.selectionClosed) {
          cancelSelection();
        } else {
          canvas?.discardActiveObject();
          canvas?.requestRenderAll();
        }
        return;
      }

      // Space bar for panning
      if (e.code === 'Space' && !isSpaceDownRef.current) {
        e.preventDefault();
        isSpaceDownRef.current = true;
        if (canvas) {
          canvas.defaultCursor = 'grab';
          canvas.setCursor('grab');
          canvas.selection = false;
          canvas.forEachObject(obj => {
            obj.selectable = false;
            obj.evented = false;
          });
          canvas.renderAll();
        }
        return;
      }

      // Shortcuts
      if (isCtrl && isL) {
        e.preventDefault();
        handleAddAdjustment('levels');
      } else if (isCtrl && isZ && !isShift) {
        e.preventDefault();
        undo();
      } else if (isCtrl && isShift && isZ) {
        e.preventDefault();
        redo();
      } else if (isCtrl && isShift && isC) {
        e.preventDefault();
        copyStyle();
      } else if (isCtrl && isShift && isV) {
        e.preventDefault();
        pasteStyle();
      } else if (isCtrl && isY) {
        e.preventDefault();
        toggleOutlineMode();
      } else if (isCtrl && isH) {
        e.preventDefault();
        const newShowGuides = !showGuides;
        setShowGuides(newShowGuides);
      } else if (isShift && e.key.toUpperCase() === 'R') {
        e.preventDefault();
        setShowRulers(prev => !prev);
      } else if (isCtrl && isG && !isShift) {
        e.preventDefault();
        groupSelectedElements();
      } else if (isCtrl && isShift && isG) {
        e.preventDefault();
        ungroupSelectedElement();
      } else if (isCtrl && isA) {
        e.preventDefault();
        if (!canvas) return;
        canvas.discardActiveObject();
        const objs = canvas.getObjects().filter(obj => {
          const o = obj as any;
          return !o.isGridLine && !o.id?.toString().includes('artboard') && o.id !== 'grid_rect';
        });
        if (objs.length > 0) {
          const sel = new fabric.ActiveSelection(objs, {
            canvas: canvas,
          });
          canvas.setActiveObject(sel);
          canvas.requestRenderAll();
        }
      } else if (isCtrl && isD) {
        e.preventDefault();
        setMarqueeState(null);
        deselectMagicWand();
        cancelSelection();
        canvas?.discardActiveObject();
        canvas?.requestRenderAll();
      } else if (isCtrl && isX) {
        if (magicWandSelection) {
          e.preventDefault();
          handleMagicWandAction('cut');
          return;
        }

        if (marqueeState) {
          e.preventDefault();
          handleMarqueePixelAction('cut');
          return;
        }

        if (lassoState.selectionClosed) {
          e.preventDefault();
          handleLassoAction('cut');
          return;
        }
        
        const active = canvas?.getActiveObject();
        if (active) {
          e.preventDefault();
          active.clone((cloned: any) => {
            clipboardRef.current = cloned;
            if (active.type === 'activeSelection') {
              canvas?.remove(...active.getObjects());
            } else {
              canvas?.remove(active);
            }
            canvas?.discardActiveObject();
            canvas?.renderAll();
            saveToHistory(canvas!);
            updateLayers(canvas!);
          }, FABRIC_PROPS);
        }
      } else if (isCtrl && isC) {
        e.preventDefault();
        if (!canvas) return;
        
        if (magicWandSelection) {
          handleMagicWandAction('copy');
          return;
        }

        if (marqueeState) {
          e.preventDefault();
          handleMarqueePixelAction('copy');
          return;
        }

        if (lassoState.selectionClosed) {
          e.preventDefault();
          handleLassoAction('copy');
          return;
        }

        const active = canvas.getActiveObject();
        if (active) {
          if ((active as any)._pcProxy && pcm) {
            // PowerClip Special Clone
            const id = (active as any)._pcId;
            clipboardRef.current = { _isPowerClip: true, pcId: id };
            return;
          }
          active.clone((cloned: any) => {
            clipboardRef.current = cloned;
          }, FABRIC_PROPS);
        }
      } else if (isCtrl && isV) {
        e.preventDefault();
        if (!canvas || !clipboardRef.current) return;

        if (clipboardRef.current._isPowerClip && pcm) {
          pcm.cloneClip(clipboardRef.current.pcId).then(() => {
            saveToHistory(canvas);
            updateLayers(canvas);
          });
          return;
        }

        clipboardRef.current.clone((clonedObj: any) => {
          canvas.discardActiveObject();
          
          // Ensure new unique IDs for pasted objects and their children
          const resetIds = (o: any) => {
            o.id = generateUniqueId();
            if (o.getObjects) o.getObjects().forEach(resetIds);
          };
          resetIds(clonedObj);

          clonedObj.set({
            left: (clonedObj.left || 0) + 10,
            top: (clonedObj.top || 0) + 10,
            evented: true,
          });
          
          if (clonedObj.type === 'activeSelection') {
            clonedObj.canvas = canvas;
            clonedObj.forEachObject((obj: any) => {
              canvas.add(obj);
            });
            clonedObj.setCoords();
          } else {
            canvas.add(clonedObj);
          }
          
          if (clipboardRef.current instanceof fabric.Object) {
            clipboardRef.current.top += 10;
            clipboardRef.current.left += 10;
          }
          
          // Re-enliven clipPath if it's a POJO
          enlivenClipPathRecursive([clonedObj]);

          canvas.setActiveObject(clonedObj);
          canvas.requestRenderAll();
          saveToHistory(canvas);
          updateLayers(canvas);
        }, FABRIC_PROPS);
      } else if (isCtrl && isJ) {
        e.preventDefault();
        if (!canvas) return;

        if (magicWandSelection) {
          handleMagicWandAction('duplicate');
          return;
        }

        if (marqueeState) {
          e.preventDefault();
          handleMarqueePixelAction('duplicate');
          return;
        }

        if (lassoState.selectionClosed) {
          e.preventDefault();
          handleLassoAction('duplicate');
          return;
        }

        const active = canvas.getActiveObject();
        if (active) {
          if ((active as any)._pcProxy && pcm) {
            pcm.cloneClip((active as any)._pcId).then(() => {
              saveToHistory(canvas);
              updateLayers(canvas);
            });
            return;
          }
          active.clone((cloned: any) => {
            // Ensure new unique IDs for duplicated objects and their children
            const resetIds = (o: any) => {
              o.id = generateUniqueId();
              if (o.getObjects) o.getObjects().forEach(resetIds);
            };
            resetIds(cloned);

            cloned.set({
              left: (cloned.left || 0) + 10,
              top: (cloned.top || 0) + 10,
              evented: true,
            });
            
            // Re-enliven clipPath if it's a POJO
            enlivenClipPathRecursive([cloned]);

            if (cloned.type === 'activeSelection') {
              cloned.canvas = canvas;
              cloned.forEachObject((obj: any) => {
                canvas.add(obj);
              });
              cloned.setCoords();
            } else {
              canvas.add(cloned);
            }
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
            saveToHistory(canvas);
            updateLayers(canvas);
          }, FABRIC_PROPS);
        }
      } else if (e.key === 'Enter' || e.key === 'Escape') {
        if (activeToolRef.current === 'pen') {
          e.preventDefault();
          finishPenPathRef.current?.();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (marqueeState) {
          e.preventDefault();
          handleMarqueePixelAction('erase');
          return;
        }
        if (magicWandSelection) {
          e.preventDefault();
          handleMagicWandAction('erase'); // Use 'erase' for Delete key
          return;
        }
        const active = canvas.getActiveObject();
        if (lassoState.selectionClosed) {
          e.preventDefault();
          actionDelete();
          return;
        }
        
        if (e.altKey) {
          e.preventDefault();
          fillWithColor('foreground');
        } else if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          fillWithColor('background');
        } else if (e.shiftKey) {
          e.preventDefault();
          fillArtboardWithBackgroundColor();
        } else if (selectedGuideIds.length > 0) {
          selectedGuideIds.forEach(id => removeGuide(id));
          setSelectedGuideIds([]);
        } else {
          deleteActive();
        }
      } else if (e.key === '[' || e.key === ']') {
        if (activeTool === 'brush') {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 5;
          if (e.key === '[') {
            updateBrushSettings({ size: Math.max(1, brushSettings.size - step) });
          } else {
            updateBrushSettings({ size: Math.min(500, brushSettings.size + step) });
          }
        }
      } else if (e.key === '{' || e.key === '}') {
        if (activeTool === 'brush') {
          e.preventDefault();
          if (e.key === '{') {
            updateBrushSettings({ hardness: Math.max(0, brushSettings.hardness - 10) });
          } else {
            updateBrushSettings({ hardness: Math.min(100, brushSettings.hardness + 10) });
          }
        }
      } else if (e.key === 'Escape') {
        if (isPowerClipEditing) {
          exitPowerClipEdit();
          e.preventDefault();
          return;
        }
        if (isPowerClipPlacing) {
          pcm?.cancelPlacement();
          e.preventDefault();
          return;
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!canvas || !activeObject) return;
        
        const step = e.shiftKey ? 10 : (showGrid || snapToGrid ? GRID_SIZE : 1);
        switch (e.key) {
          case 'ArrowUp': activeObject.set('top', (activeObject.top || 0) - step); break;
          case 'ArrowDown': activeObject.set('top', (activeObject.top || 0) + step); break;
          case 'ArrowLeft': activeObject.set('left', (activeObject.left || 0) - step); break;
          case 'ArrowRight': activeObject.set('left', (activeObject.left || 0) + step); break;
        }
        activeObject.setCoords();
        canvas.renderAll();
        saveToHistory(canvas);
        if (blindMode) {
          announceObjectMovement(activeObject);
        }
      } else {
        // Tool shortcuts
        const key = e.key.toLowerCase();
        if (e.altKey) {
          const tabMap: Record<string, string> = {
            '1': 'layers',
            '2': 'text',
            '3': 'image-adjust',
            '4': 'color',
            '5': 'transform',
            '6': 'assets'
          };
          const targetTab = tabMap[e.key];
          if (targetTab) {
            e.preventDefault();
            const canShow = (targetTab === 'text' ? activeObject?.type === 'i-text' : 
                             targetTab === 'image-adjust' ? activeObject?.type === 'image' : true);
            if (canShow) {
              setActiveTab(targetTab);
              if (!isRightSidebarOpen) setIsRightSidebarOpen(true);
            }
          }
        } else if (key === 'x') {
          e.preventDefault();
          useColorStore.getState().swapColors();
        } else if (key === 'd') {
          e.preventDefault();
          if (lassoState.selectionClosed) {
            cancelSelection();
          } else {
            useColorStore.getState().resetColors();
          }
        } else if (key === 'v') setActiveTool('select');
        else if (key === 'm') setActiveTool('marquee');
        else if (key === 'b') setActiveTool('brush');
        else if (key === 'e') setActiveTool('eraser');
        else if (key === 't') setActiveTool('text');
        else if (key === 's' || key === 'f') setActiveTool('shapes');
        else if (key === 'i') setActiveTool('picker');
        // Shortcut 'a' (artboard tool) removed per user request
        else if (key === 'l') setActiveTool('polygonal-lasso');
        else if (key === 'n') setActiveTool('line');
        else if (key === 'k') setActiveTab('assets');
        else if (e.key === 'F10') { e.preventDefault(); setShowShortcutsModal(true); }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftDownRef.current = false;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        isSpaceDownRef.current = false;
        isPanningRef.current = false;
        if (canvas) {
          canvas.defaultCursor = 'default';
          canvas.setCursor('default');
          const tool = activeToolRef.current;
          canvas.selection = tool === 'select' || tool === 'marquee';
          canvas.forEachObject(obj => {
            const o = obj as any;
            const isArtboard = o.id && o.id.toString().includes('artboard');
            
            if (isArtboard) {
              obj.selectable = false;
              obj.evented = true; // consistent with block marquee strategy
            } else if (o.id === 'marquee_selection') {
              obj.selectable = true;
              obj.evented = true;
            } else if (o.isGridLine || o.id === 'grid_rect') {
              obj.selectable = false;
              obj.evented = false;
            } else {
              // Restaura a interatividade dos outros objetos baseada na ferramenta atual
              // EXCEPTION: PowerClip components (content/container) must remain non-interactive
              if (o._pcContent || o._pcContainer) {
                obj.selectable = false;
                obj.evented = false;
              } else {
                obj.selectable = tool === 'select';
                obj.evented = tool === 'select';
              }
            }
          });
          canvas.renderAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvas, activeObject, showGuides, selectedGuideIds, undo, redo, copyStyle, pasteStyle, toggleOutlineMode, groupSelectedElements, ungroupSelectedElement, saveToHistory, updateLayers, removeGuide, deleteActive, setActiveTool, setActiveTab]);

  const generateQRCode = async () => {
    if (!qrText) return;
    setIsProcessing(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(qrText, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      addImageToCanvas(url);
    } catch (error) {
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFontImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fontName = file.name.split('.')[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result as string;
      const fontFace = new FontFace(fontName, `url(${data})`);
      try {
        await fontFace.load();
        document.fonts.add(fontFace);
        setFonts(prev => [...prev, fontName]);
      } catch (error) {
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpscale = () => {
    if (!activeObject || activeObject.type !== 'image') {
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  const handleVectorize = () => {
    if (!activeObject || activeObject.type !== 'image') {
      return;
    }
    
    const imgObj = activeObject as fabric.Image;
    const src = imgObj.getSrc();
    
    setVectorizerImageUrl(src);
    setShowVectorizerModal(true);
  };

  const handleCompress = () => {
    if (!activeObject || activeObject.type !== 'image') {
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  const handleCrop = () => {
    setActiveTool('select');
  };

  const addImageToCanvas = (url: string, id?: string, name?: string) => {
    if (!canvas) return;
    if (id) setLoadingAssetId(id);
    else setIsProcessing(true);
    
    // Check if it's an SVG (likely an icon)
    if (url.toLowerCase().endsWith('.svg') || url.includes('api.iconify.design')) {
      fabric.loadSVGFromURL(url, (objects, options) => {
        setLoadingAssetId(null);
        setIsProcessing(false);
        if (!objects) {
          return;
        }
        const obj = fabric.util.groupSVGElements(objects, options);
        obj.scaleToWidth(200);
        obj.set('isIcon', true);
        if (name) obj.set('name', name);
        
        const center = getInsertionPosition(canvas);
        obj.set({
          originX: 'center',
          originY: 'center',
          left: center.x,
          top: center.y
        });
        
        canvas.add(obj);
        obj.setCoords();
        isSuppressingAnnouncementsRef.current = true;
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
        isSuppressingAnnouncementsRef.current = false;
        updateLayers(canvas);
        saveToHistory(canvas);
        setActiveTool('select');
      }, undefined, { crossOrigin: 'anonymous' });
      return;
    }

    const options = url.startsWith('data:') ? {} : { crossOrigin: 'anonymous' };
    fabric.Image.fromURL(url, (img) => {
      setLoadingAssetId(null);
      setIsProcessing(false);
      if (!img) {
        return;
      }
      img.scaleToWidth(400);
      img.set('objectCaching', false);
      img.set('name', name || `image_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`);
      
      const center = getInsertionPosition(canvas);
      img.set({
        originX: 'center',
        originY: 'center',
        left: center.x,
        top: center.y
      });
      
      canvas.add(img);
      img.setCoords();
      isSuppressingAnnouncementsRef.current = true;
      canvas.setActiveObject(img);
      img.set('dirty', true);
      canvas.requestRenderAll();
      isSuppressingAnnouncementsRef.current = false;
      updateLayers(canvas);
      saveToHistory(canvas);
      setActiveTool('select');
    }, options);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        const heic2any = (await import('heic2any')).default;
        const blob = await heic2any({ blob: file, toType: 'image/png' });
        const pngBlob = Array.isArray(blob) ? blob[0] : blob;
        const reader = new FileReader();
        reader.onload = (f) => {
          if (typeof f.target?.result === 'string') {
            addImageToCanvas(f.target.result);
          }
        };
        reader.readAsDataURL(pngBlob);
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.ai')) {
        setPendingPdfFile(file);
        setShowPdfChoiceModal(true);
      } else if (file.name.toLowerCase().endsWith('.psd')) {
        const arrayBuffer = await file.arrayBuffer();
        if (canvas) {
          resetPdfMode();
          const { width, height } = await psdService.importFromPsd(arrayBuffer, canvas);
          setArtboardSize({ width, height });
          setCarouselPages(1);
          
          // Re-center and update workspace
          setTimeout(() => {
            centerArtboard(canvas, width, height, 1);
            saveToHistory(canvas);
            updateLayers(canvas);
            showToast(t('editor.messages.psd_imported', 'PSD importado com sucesso'), 'success');
          }, 100);
        } else {
          // If no canvas is active, get dimensions and create a new document
          const { width, height } = await psdService.getPsdDimensions(arrayBuffer);
          pendingPsdBuffer.current = arrayBuffer;
          addNewDocument(width, height);
        }
      } else if (file.name.toLowerCase().endsWith('.cdr')) {
        const reader = new FileReader();
        reader.onload = (f) => {
          if (typeof f.target?.result === 'string') {
            addImageToCanvas(f.target.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (f) => {
          const data = f.target?.result;
          if (typeof data === 'string') {
            addImageToCanvas(data);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await processFile(file);
      }
      e.dataTransfer.clearData();
    }
  }, [canvas, addImageToCanvas, artboardSize, t, saveToHistory, updateLayers, centerArtboard]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handlePdfImportSelected = async () => {
    if (!pdfFile || selectedPdfPages.length === 0) return;
    
    setIsProcessing(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      for (const pageNum of selectedPdfPages) {
        const thumbnailUrl = await generateThumbnail(arrayBuffer, pageNum, 2);
        if (thumbnailUrl) {
          addImageToCanvas(thumbnailUrl);
        }
      }
      setShowPdfModal(false);
    } catch (error) {
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePdfImportAll = async () => {
    if (!pdfFile) return;
    
    setIsProcessing(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const thumbnailUrl = await generateThumbnail(arrayBuffer, i, 2);
        if (thumbnailUrl) {
          addImageToCanvas(thumbnailUrl);
        }
      }
      setShowPdfModal(false);
    } catch (error) {
    } finally {
      setIsProcessing(false);
    }
  };

  const applyRefinement = useCallback(async (value: number, targetObj?: any) => {
    const obj = targetObj || activeObject;
    if (!obj || obj.type !== 'image' || !obj.get('originalSrc') || !obj.get('maskSrc')) return;
    
    const originalSrc = obj.get('originalSrc');
    const maskSrc = obj.get('maskSrc');

    const canvasRefinement = document.createElement('canvas');
    const ctx = canvasRefinement.getContext('2d');
    if (!ctx) return;

    const imgOrig = new Image();
    const imgMask = new Image();
    
    imgOrig.crossOrigin = 'anonymous';
    imgMask.crossOrigin = 'anonymous';

    await Promise.all([
      new Promise(res => { imgOrig.onload = res; imgOrig.src = originalSrc; }),
      new Promise(res => { imgMask.onload = res; imgMask.src = maskSrc; })
    ]);

    if (!canvas || (canvas as any)._disposed || !activeObject || activeObject !== obj) return;

    canvasRefinement.width = imgOrig.width;
    canvasRefinement.height = imgOrig.height;

    // Draw original mask result to get alpha
    ctx.drawImage(imgMask, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvasRefinement.width, canvasRefinement.height);
    const data = imageData.data;

    // Refinement logic
    // value 0-100, 50 is neutral
    const threshold = 128 + (value - 50) * 2; // Adjust threshold
    const feather = Math.max(0, (value - 50) / 10); // Simple feathering simulation
    
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      
      // Apply threshold
      if (value !== 50) {
        if (alpha < threshold) {
          data[i + 3] = 0;
        } else if (alpha > threshold + 20) {
          data[i + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    
    if (feather > 0) {
      ctx.globalCompositeOperation = 'source-in';
      ctx.filter = `blur(${feather}px)`;
      ctx.drawImage(canvasRefinement, 0, 0);
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvasRefinement.width;
    finalCanvas.height = canvasRefinement.height;
    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx) {
      finalCtx.drawImage(imgOrig, 0, 0);
      finalCtx.globalCompositeOperation = 'destination-in';
      finalCtx.drawImage(canvasRefinement, 0, 0);
      
      const newSrc = finalCanvas.toDataURL('image/png');
      obj.setSrc(newSrc, () => {
        if (!canvas || (canvas as any)._disposed) return;
        canvas.renderAll();
      });
    }
  }, [activeObject, canvas]);

  useEffect(() => {
    if (!activeObject || activeObject.type !== 'image' || !activeObject.get('originalSrc')) return;
    
    const timer = setTimeout(() => {
      applyRefinement(refinement);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [refinement, activeObject, applyRefinement]);

  const isRemovingBgRef = useRef(false);

  const handleRemoveBackground = async () => {
    if (!activeObject || activeObject.type !== 'image') {
      return;
    }

    const originalSrc = activeObject.getSrc();
    setIsRemovingBg(true);
    isRemovingBgRef.current = true;
    setBgRemovalProgress(0);
    
    // Simulated progress timer
    const progressInterval = setInterval(() => {
      setBgRemovalProgress(prev => {
        if (prev >= 95) return 95;
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 500);

    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(originalSrc);
      
      if (!isRemovingBgRef.current) {
        clearInterval(progressInterval);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (!isRemovingBgRef.current) {
          clearInterval(progressInterval);
          return;
        }

        const maskSrc = e.target?.result as string;
        fabric.Image.fromURL(maskSrc, (img) => {
          clearInterval(progressInterval);
          
          if (!canvas || (canvas as any)._disposed || !activeObject || !isRemovingBgRef.current) {
            setIsRemovingBg(false);
            isRemovingBgRef.current = false;
            return;
          }
          img.set({
            left: activeObject.left,
            top: activeObject.top,
            scaleX: activeObject.scaleX,
            scaleY: activeObject.scaleY,
            angle: activeObject.angle,
            objectCaching: true,
            name: activeObject.name || `image_bg_${Date.now()}`,
          });
          // @ts-ignore
          img.originalSrc = originalSrc;
          // @ts-ignore
          img.maskSrc = maskSrc;
          // @ts-ignore
          img.isProcessed = true;
          
          canvas?.remove(activeObject);
          canvas?.add(img);
          canvas?.setActiveObject(img);
          img.set('dirty', true);
          canvas?.renderAll();
          setRefinement(50);
          setBgRemovalProgress(100);
        });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      clearInterval(progressInterval);
      if (isRemovingBgRef.current) {
        setIsRemovingBg(false);
        isRemovingBgRef.current = false;
        setBgRemovalProgress(0);
      }
    }
  };

  const handleTeeImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    // Reset PDF mode when opening a standard project
    resetPdfMode();

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      try {
        canvas.loadFromJSON(json, () => {
          ensureArtboardProperties(canvas);
          enlivenClipPathRecursive(canvas);
          canvas.renderAll();
          updateLayers(canvas);
          if (pcmRef.current) pcmRef.current.rebuildClipsFromCanvas();
          saveToHistory(canvas);
        });
      } catch (error) {
        console.error('Error importing .tee file:', error);
      }
    };
    reader.readAsText(file);
    // Reset input value to allow importing the same file again
    e.target.value = '';
  };

  const exportCanvas = async (format: 'png' | 'jpg' | 'svg' | 'json' | 'webp' | 'pdf' | 'tee' | 'psd', options?: Partial<ExportOptions>) => {
    if (!canvas) return;
    
    const quality = options?.quality ?? 1;
    const multiplier = options?.multiplier ?? 2;
    const transparent = options?.transparent ?? false;

    // Save state
    const originalTransform = canvas.viewportTransform?.slice();
    const originalBG = canvas.backgroundColor;
    const wasOutline = isOutlineMode;

    // Temporarily disable outline mode for export if it's active
    if (wasOutline) {
      restoreOriginalStyles(canvas);
    }
    
    // Prepare for export
    try {
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      
      // Hide grid and helper objects before export
      const gridElements = canvas.getObjects().filter(obj => 
        (obj as any).isGridLine || 
        (obj as any).name === '__grid__' || 
        (obj as any).name === '__grid_coord__' || 
        (obj as any).name === '__grid_cursor__' ||
        (obj as any).id === 'grid_rect'
      );
      gridElements.forEach(line => line.set('visible', false));
      canvas.renderAll();

      if (format === 'psd') {
        try {
          setIsProcessing(true);
          const buffer = await psdService.exportToPsd(canvas);
          const blob = new Blob([buffer], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'mosca-tee-design.psd';
          link.click();
          showToast(t('editor.messages.psd_exported', 'PSD exportado com sucesso'), 'success');
        } catch (error) {
          console.error('Error exporting PSD:', error);
          showToast(t('editor.messages.psd_export_error', 'Erro ao exportar PSD'), 'error');
        } finally {
          setIsProcessing(false);
        }
      } else if (format === 'json' || format === 'tee') {
        const json = JSON.stringify(canvas.toJSON(FABRIC_PROPS));
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = format === 'tee' ? 'projeto.tee' : 'mosca-tee-project.json';
        link.click();
      } else if (format === 'pdf') {
        try {
          const { jsPDF } = await import('jspdf');
          const currentPages = carouselPages || 1;
          const artboards = canvas.getObjects().filter(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
          
          const mmWidth = artboardSize.width * 0.264583;
          const mmHeight = artboardSize.height * 0.264583;
          
          const pdf = new jsPDF({
            orientation: artboardSize.width > artboardSize.height ? 'l' : 'p',
            unit: 'mm',
            format: [mmWidth, mmHeight]
          });

          for (let i = 0; i < currentPages; i++) {
            if (i > 0) pdf.addPage([mmWidth, mmHeight], artboardSize.width > artboardSize.height ? 'l' : 'p');
            
            // Prepare page
            artboards.forEach((a, idx) => a.set('visible', idx === i));
            canvas.renderAll();

            const dataURL = canvas.toDataURL({
              format: 'png',
              quality: 1,
              multiplier: multiplier,
              left: Math.round(i * (artboardSize.width + 12)),
              top: 0,
              width: Math.round(artboardSize.width),
              height: Math.round(artboardSize.height)
            });

            pdf.addImage(dataURL, 'PNG', 0, 0, mmWidth, mmHeight);
          }

          pdf.save('mosca-tee-design.pdf');
          
          // Restore artboards visibility internally before finally block wipes hidden states
          artboards.forEach((a) => a.set('visible', true));
        } catch (error) {
          console.error('Error exporting PDF:', error);
          showToast(t('editor.messages.pdf_export_error', 'Erro ao exportar PDF'), 'error');
        }
      } else if (format === 'svg') {
        const currentPages = carouselPages || 1;
        const artboards = canvas.getObjects().filter(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));

        for (let i = 0; i < currentPages; i++) {
          artboards.forEach((a, idx) => a.set('visible', idx === i));
          canvas.renderAll();

          const svg = canvas.toSVG({
            viewBox: {
              x: Math.round(i * (artboardSize.width + 12)),
              y: 0,
              width: Math.round(artboardSize.width),
              height: Math.round(artboardSize.height)
            },
            width: Math.round(artboardSize.width),
            height: Math.round(artboardSize.height)
          });

          const blob = new Blob([svg], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const artboardName = (artboards[i] as any)?.name || `p${i + 1}`;
          link.download = `mosca-tee-${artboardName.toLowerCase().replace(/\s+/g, '-')}.svg`;
          link.click();
        }
        artboards.forEach(a => a.set('visible', true));
      } else {
        // Standard formats (png, jpg, webp)
        const currentPages = carouselPages || 1;
        const artboards = canvas.getObjects().filter(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));

        for (let i = 0; i < currentPages; i++) {
          // Prepare page
          if (transparent && format === 'png') {
            artboards.forEach(a => a.set('visible', false));
            canvas.backgroundColor = undefined;
          } else {
            artboards.forEach((a, idx) => a.set('visible', idx === i));
          }
          canvas.renderAll();

          const dataURL = canvas.toDataURL({
            format: format === 'jpg' ? 'jpeg' : format,
            quality: quality,
            multiplier: multiplier,
            left: Math.round(i * (artboardSize.width + 12)),
            top: 0,
            width: Math.round(artboardSize.width),
            height: Math.round(artboardSize.height)
          });

          const link = document.createElement('a');
          link.href = dataURL;
          const artboardName = (artboards[i] as any)?.name || `p${i + 1}`;
          link.download = `mosca-tee-${artboardName.toLowerCase().replace(/\s+/g, '-')}.${format}`;
          link.click();
        }
        artboards.forEach(a => a.set('visible', true));
      }
    } finally {
      // ALWAYS Restore state
      canvas.setViewportTransform(originalTransform!);
      canvas.backgroundColor = originalBG;
      
      const gridElements = canvas.getObjects().filter(obj => 
        (obj as any).isGridLine || 
        (obj as any).name === '__grid__' || 
        (obj as any).name === '__grid_coord__' || 
        (obj as any).name === '__grid_cursor__' ||
        (obj as any).id === 'grid_rect'
      );
      
      if (showGrid) {
        gridElements.forEach(line => line.set('visible', true));
      }
      
      if (wasOutline) {
        applyOutlineStyles(canvas);
      }
      
      canvas.renderAll();
    }
  };

  useEffect(() => {
    if (canvas) {
      const wasOutline = localStorage.getItem('moscatee_outline_mode') === 'true';
      if (wasOutline) {
        applyOutlineStyles(canvas);
      }
      
      canvas.renderAll();
    }
  }, [canvas]);

  useEffect(() => {
    if (isLoading) {
      const LETTERS = ['ll-M','ll-o','ll-s','ll-c','ll-a','ll-dot','ll-t','ll-e1','ll-e2'];
      const animateLogo = () => {
        const wrap = document.getElementById('splash-logo-wrap');
        // @ts-ignore
        if (!wrap || typeof anime === 'undefined') return;

        wrap.style.opacity = '1';

        LETTERS.forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.style.opacity = '0';
          el.style.transform = 'translateY(16px)';
        });

        // @ts-ignore
        anime({
          targets: LETTERS.map((id) => '#' + id),
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 500,
          // @ts-ignore
          delay: anime.stagger(60, { start: 200 }),
          easing: 'cubicBezier(0.22, 1, 0.36, 1)',
          complete: () => {
            // Start fading the blur as letters are in
            setStartBlurFade(true);

            // Ponto azul pisca (some e volta) após as letras entrarem
            // @ts-ignore
            anime({
              targets: '#ll-dot',
              opacity: [
                { value: 0, duration: 100, easing: 'easeOutQuad' },
                { value: 0, duration: 500 },
                { value: 1, duration: 100, easing: 'easeInQuad' }
              ],
              delay: 200
            });

            // @ts-ignore
            anime({
              targets: '#splash-tagline',
              opacity: [0, 1],
              translateY: [8, 0],
              duration: 600,
              delay: 100,
              easing: 'easeOutCubic',
              complete: () => {
                setLogoAnimationDone(true);
              }
            });
          }
        });

        // Animação da barra de carregamento
        // @ts-ignore
        anime({
          targets: '#splash-loading-bar',
          width: '100%',
          duration: 2500,
          easing: 'easeInOutQuad'
        });
      };

      // Small delay to ensure DOM is ready
      const timer = setTimeout(animateLogo, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      const LETTERS = ['hll-M','hll-o','hll-s','hll-c','hll-a','hll-dot','hll-t','hll-e1','hll-e2'];
      const animateHeaderLogo = () => {
        // @ts-ignore
        if (typeof anime === 'undefined') return;

        LETTERS.forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.style.opacity = '0';
          el.style.transform = 'translateY(8px)';
        });

        // @ts-ignore
        anime({
          targets: LETTERS.map((id) => '#' + id),
          opacity: [0, 1],
          translateY: [8, 0],
          duration: 400,
          // @ts-ignore
          delay: anime.stagger(40, { start: 300 }),
          easing: 'easeOutCubic',
          complete: () => {
            // Ponto azul pisca no header também
            // @ts-ignore
            anime({
              targets: '#hll-dot',
              opacity: [
                { value: 0, duration: 100, easing: 'easeOutQuad' },
                { value: 0, duration: 500 },
                { value: 1, duration: 100, easing: 'easeInQuad' }
              ],
              delay: 200
            });
          }
        });
      };

      const timer = setTimeout(animateHeaderLogo, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Splash screen is now handled as an overlay in the main return
  // if (isLoading) {
  //   return (
  //     <div className="fixed inset-0 bg-[#191919] flex flex-col items-center justify-center z-[9999]">
  //       ...
  //     </div>
  //   );
  // }

  return (
    <div className={cn(
      "h-screen w-screen bg-[#191919] text-white flex flex-col overflow-hidden font-sans select-none relative",
      blindMode && "high-contrast"
    )}>
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 bg-[#191919]/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-[9999]"
          >
            <div className="text-center flex flex-col items-center">
              <div id="splash-logo-wrap" style={{ opacity: 0 }} className="mb-6">
                <svg
                  id="mosca-logo-svg"
                  viewBox="0 0 510.055 100"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '240px', maxWidth: '80vw', display: 'block', margin: '0 auto' }}
                  aria-label="Mosca Tee"
                  role="img"
                >
                  <g id="ll-M">
                    <path fill="#ffffff" d="M24.511,18.895l-2.258,31.732h0.878c0-4.598,0.543-9.385,1.631-14.361c1.085-4.974,3.092-9.281,6.02-12.918 c2.926-3.637,6.898-5.456,11.915-5.456c5.1,0,9.323,1.548,12.668,4.641c3.343,3.094,5.268,8.278,5.77,15.552 c1.17-5.769,3.218-10.577,6.146-14.423c2.926-3.845,6.98-5.77,12.166-5.77c5.519,0,9.991,1.819,13.42,5.456 c3.428,3.637,5.142,9.763,5.142,18.375v39.884H74.053V50.627c0-4.014-0.502-7.274-1.505-9.783 c-1.003-2.509-2.509-3.763-4.516-3.763c-2.091,0-3.743,1.297-4.954,3.888c-1.213,2.593-1.818,5.813-1.818,9.658v30.979H37.304 V50.627c0-4.014-0.501-7.274-1.505-9.783c-1.003-2.509-2.509-3.763-4.515-3.763c-2.091,0-3.743,1.297-4.955,3.888 c-1.213,2.593-1.818,5.813-1.818,9.658v30.979H0.555V18.895H24.511z"/>
                  </g>
                  <g id="ll-o">
                    <path fill="#ffffff" d="M118.139,78.91c-5.311-2.634-9.513-6.416-12.605-11.351c-3.094-4.933-4.641-10.743-4.641-17.434 c0-6.689,1.546-12.48,4.641-17.371c3.092-4.892,7.294-8.633,12.605-11.226c5.309-2.591,11.226-3.888,17.748-3.888 s12.437,1.297,17.747,3.888c5.309,2.593,9.511,6.334,12.605,11.226c3.093,4.891,4.641,10.682,4.641,17.371 c0,6.69-1.548,12.501-4.641,17.434c-3.094,4.935-7.296,8.717-12.605,11.351c-5.311,2.634-11.225,3.951-17.747,3.951 S123.448,81.544,118.139,78.91z M128.549,58.09c1.964,1.965,4.409,2.947,7.337,2.947c2.926,0,5.372-0.982,7.337-2.947 c1.964-1.964,2.948-4.578,2.948-7.839c0-3.343-0.984-5.977-2.948-7.901c-1.965-1.922-4.411-2.885-7.337-2.885 c-2.928,0-5.374,0.962-7.337,2.885c-1.966,1.924-2.947,4.558-2.947,7.901C125.602,53.512,126.583,56.126,128.549,58.09z"/>
                  </g>
                  <g id="ll-s">
                    <path fill="#ffffff" d="M183.734,81.544c-4.559-0.794-8.049-1.86-10.473-3.199V57.776l3.01,1.129c3.93,1.589,7.4,2.759,10.41,3.512 c3.01,0.753,6.898,1.129,11.665,1.129c2.508,0,4.515-0.458,6.021-1.379c1.505-0.919,2.257-2.173,2.257-3.763 c0-1.086-0.773-1.901-2.32-2.446c-1.548-0.543-4.076-1.191-7.587-1.944c-4.516-0.834-8.384-1.775-11.602-2.822 c-3.22-1.044-6-2.8-8.34-5.268c-2.342-2.465-3.512-5.789-3.512-9.971c0-12.542,9.197-18.813,27.593-18.813 c5.936,0,11.182,0.356,15.741,1.066c4.557,0.711,8.131,1.611,10.724,2.697v20.695c-8.529-3.428-16.891-5.143-25.084-5.143 c-2.759,0-4.829,0.482-6.208,1.442c-1.38,0.962-2.07,2.195-2.07,3.7c0,1.505,0.878,2.593,2.634,3.261 c1.756,0.67,4.597,1.38,8.528,2.132c4.598,0.837,8.36,1.736,11.288,2.697c2.926,0.962,5.476,2.571,7.651,4.829 c2.173,2.258,3.261,5.436,3.261,9.532c0,12.46-9.199,18.688-27.593,18.688C193.62,82.735,188.29,82.337,183.734,81.544z"/>
                  </g>
                  <g id="ll-c">
                    <path fill="#ffffff" d="M268.706,39.464c-4.182,0-7.568,0.962-10.159,2.885c-2.593,1.924-3.888,4.558-3.888,7.901 c0,3.346,1.295,5.979,3.888,7.902c2.591,1.924,5.978,2.885,10.159,2.885c6.271,0,10.702-1.295,13.295-3.888v23.58 c-1.339,0.586-3.994,1.085-7.965,1.505c-3.972,0.417-7.004,0.627-9.093,0.627c-6.521,0-12.438-1.317-17.747-3.951 c-5.312-2.634-9.513-6.416-12.605-11.351c-3.094-4.933-4.641-10.743-4.641-17.434c0-6.689,1.547-12.48,4.641-17.371 c3.093-4.892,7.294-8.633,12.605-11.226c5.309-2.591,11.226-3.888,17.747-3.888c2.007,0,5.017,0.231,9.03,0.69 c4.014,0.46,6.688,0.984,8.027,1.568v23.329C279.324,40.719,274.892,39.464,268.706,39.464z"/>
                  </g>
                  <g id="ll-a">
                    <path fill="#ffffff" d="M328.28,63.295h-1.254c0,5.854-1.799,10.516-5.394,13.984c-3.596,3.471-8.446,5.205-14.549,5.205 c-6.606,0-11.853-1.274-15.74-3.825c-3.889-2.55-5.832-6.542-5.832-11.978c0-6.688,3.637-11.602,10.911-14.737 c7.274-3.135,16.137-4.911,26.59-5.331c-1.088-1.671-2.593-2.988-4.515-3.951c-1.925-0.96-3.973-1.442-6.146-1.442 c-3.68,0-7.255,0.335-10.724,1.003c-3.471,0.67-7.296,1.63-11.476,2.885V21.78c4.18-1.254,8.297-2.258,12.354-3.01 c4.055-0.752,8.843-1.129,14.361-1.129c10.786,0,18.833,2.53,24.144,7.588c5.31,5.06,7.965,11.811,7.965,20.256v36.122h-24.709 L328.28,63.295z M315.613,67.559c1.838,0,3.866-0.668,6.083-2.007c2.214-1.336,3.323-2.967,3.323-4.892v-6.146 c-4.265,0.335-7.882,1.213-10.849,2.634c-2.97,1.423-4.453,3.386-4.453,5.895C309.718,66.054,311.681,67.559,315.613,67.559z"/>
                  </g>
                  <g id="ll-dot">
                    <path fill="#2563EB" d="M376.294,79.843c-1.832-1.831-2.747-4.031-2.747-6.601c0-2.569,0.915-4.756,2.747-6.56 c1.831-1.804,4.03-2.706,6.601-2.706c2.569,0,4.756,0.902,6.561,2.706c1.804,1.804,2.706,3.991,2.706,6.56 c0,2.57-0.902,4.77-2.706,6.601c-1.805,1.831-3.991,2.747-6.561,2.747C380.324,82.59,378.125,81.674,376.294,79.843z"/>
                  </g>
                  <g id="ll-t">
                    <path fill="#ffffff" d="M414.873,64.796c0.492,1.531,1.312,2.624,2.46,3.28c1.148,0.656,2.788,0.984,4.92,0.984v13.366 c-5.631,0-10.127-0.684-13.488-2.05c-3.362-1.366-5.919-3.936-7.667-7.708c-1.751-3.772-2.624-9.266-2.624-16.482v-4.182h-5.33 V40.606h5.33v-7.298h15.661v7.298h7.463v11.398h-7.463v6.314C414.135,61.106,414.381,63.267,414.873,64.796z"/>
                  </g>
                  <g id="ll-e1">
                    <path fill="#ffffff" d="M426.598,49.667c2.022-3.198,4.769-5.644,8.241-7.339c3.471-1.694,7.339-2.542,11.603-2.542 c2.515,0,5.221,0.615,8.118,1.845s5.494,3.54,7.79,6.929c2.296,3.39,3.553,8.036,3.772,13.94l-26.404-0.82 c0.164,2.078,1.23,3.677,3.198,4.797c1.968,1.121,4.783,1.681,8.446,1.681c3.061,0,5.78-0.381,8.158-1.148 c2.378-0.765,3.922-1.503,4.634-2.214v16.154c-4.702,0.984-9.239,1.476-13.612,1.476c-8.419,0-15.021-1.886-19.803-5.658 c-4.784-3.772-7.176-9.02-7.176-15.744C423.564,56.651,424.576,52.865,426.598,49.667z M453.249,59.302 c-0.22-1.53-0.931-2.788-2.132-3.772c-1.203-0.984-2.488-1.476-3.854-1.476c-1.695,0-3.239,0.465-4.633,1.394 c-1.395,0.93-2.283,2.214-2.665,3.854H453.249z"/>
                  </g>
                  <g id="ll-e2">
                    <path fill="#ffffff" d="M469.975,49.667c2.022-3.198,4.769-5.644,8.241-7.339c3.471-1.694,7.339-2.542,11.603-2.542 c2.515,0,5.221,0.615,8.118,1.845s5.494,3.54,7.79,6.929c2.296,3.39,3.553,8.036,3.772,13.94l-26.404-0.82 c0.164,2.078,1.23,3.677,3.198,4.797c1.968,1.121,4.783,1.681,8.446,1.681c3.061,0,5.78-0.381,8.158-1.148 c2.378-0.765,3.922-1.503,4.634-2.214v16.154c-4.702,0.984-9.239,1.476-13.612,1.476c-8.419,0-15.021-1.886-19.803-5.658 c-4.784-3.772-7.176-9.02-7.176-15.744C466.941,56.651,467.953,52.865,469.975,49.667z M496.626,59.302 c-0.22-1.53-0.931-2.788-2.132-3.772c-1.203-0.984-2.488-1.476-3.854-1.476c-1.695,0-3.239,0.465-4.633,1.394 c-1.395,0.93-2.283,2.214-2.665,3.854H496.626z"/>
                  </g>
                </svg>
              </div>
              <p id="splash-tagline" style={{ opacity: 0 }} className="text-zinc-400 font-medium mb-4">{t('editor.header.subtitle')}</p>
              
              <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
                <div 
                  id="splash-loading-bar"
                  className="h-full bg-blue-600"
                  style={{ width: '0%' }}
                />
              </div>
              <p className="text-zinc-500 text-sm">{t('editor.messages.loading_tools')}</p>
            </div>
            
            <div className="absolute bottom-12 text-zinc-600 text-xs font-bold tracking-widest">
              {t('editor.messages.loading_footer')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        animate={{ filter: startBlurFade ? "blur(0px)" : "blur(12px)" }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="flex flex-col h-full w-full overflow-hidden"
      >
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={`https://moscatee.com${location.pathname}`} />
        <link rel="alternate" hrefLang="en" href={`https://moscatee.com/en${location.pathname.replace(/^\/(en|pt-br)/, '')}`} />
        <link rel="alternate" hrefLang="pt-BR" href={`https://moscatee.com/pt-br${location.pathname.replace(/^\/(en|pt-br)/, '')}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://moscatee.com/en${location.pathname.replace(/^\/(en|pt-br)/, '')}`} />
      </Helmet>

      {/* Skip Links */}
      <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-0 focus-within:left-0 focus-within:z-[9999] focus-within:bg-blue-600 focus-within:p-4">
        <a href="#toolbar" className="text-white font-bold underline mr-4">{t('a11y.skip_to_toolbar', 'Ir para ferramentas')}</a>
        <a href="#canvas-area" className="text-white font-bold underline mr-4">{t('a11y.skip_to_canvas', 'Ir para canvas')}</a>
        <a href="#properties-panel" className="text-white font-bold underline">{t('a11y.skip_to_properties', 'Ir para propriedades')}</a>
      </div>

      {/* A11y Announcer */}
      <div
        id="a11y-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Hidden SEO Content for Indexing */}
      <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
        <h1>{seo.h1}</h1>
        <p>{seo.text}</p>
        <nav>
          <a href="/moscatee/ferramentas/remover-fundo">{t('editor.tools.remove_bg', 'Remover Fundo')}</a>
          <a href="/moscatee/ferramentas/vetorizador">{t('editor.tools.vectorizer', 'Vetorizador SVG')}</a>
          <a href="/moscatee/vs/canva">{t('editor.tools.vs_canva', 'Mosca Tee vs Canva')}</a>
          <a href="/moscatee/templates/instagram-post">{t('editor.tools.instagram_templates', 'Templates Instagram')}</a>
        </nav>
      </div>

      {/* Top Bar */}
      <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-[#191919] z-[100]">
        <div className="flex items-center gap-6">
          <Link to={`/${lang}`} className="flex items-center hover:opacity-80 transition-opacity">
            <svg
              id="header-logo-svg"
              viewBox="0 0 510.055 100"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-auto"
              aria-label="Mosca Tee"
              role="img"
            >
              <g id="hll-M">
                <path fill="#ffffff" d="M24.511,18.895l-2.258,31.732h0.878c0-4.598,0.543-9.385,1.631-14.361c1.085-4.974,3.092-9.281,6.02-12.918 c2.926-3.637,6.898-5.456,11.915-5.456c5.1,0,9.323,1.548,12.668,4.641c3.343,3.094,5.268,8.278,5.77,15.552 c1.17-5.769,3.218-10.577,6.146-14.423c2.926-3.845,6.98-5.77,12.166-5.77c5.519,0,9.991,1.819,13.42,5.456 c3.428,3.637,5.142,9.763,5.142,18.375v39.884H74.053V50.627c0-4.014-0.502-7.274-1.505-9.783 c-1.003-2.509-2.509-3.763-4.516-3.763c-2.091,0-3.743,1.297-4.954,3.888c-1.213,2.593-1.818,5.813-1.818,9.658v30.979H37.304 V50.627c0-4.014-0.501-7.274-1.505-9.783c-1.003-2.509-2.509-3.763-4.515-3.763c-2.091,0-3.743,1.297-4.955,3.888 c-1.213,2.593-1.818,5.813-1.818,9.658v30.979H0.555V18.895H24.511z"/>
              </g>
              <g id="hll-o">
                <path fill="#ffffff" d="M118.139,78.91c-5.311-2.634-9.513-6.416-12.605-11.351c-3.094-4.933-4.641-10.743-4.641-17.434 c0-6.689,1.546-12.48,4.641-17.371c3.092-4.892,7.294-8.633,12.605-11.226c5.309-2.591,11.226-3.888,17.748-3.888 s12.437,1.297,17.747,3.888c5.309,2.593,9.511,6.334,12.605,11.226c3.093,4.891,4.641,10.682,4.641,17.371 c0,6.69-1.548,12.501-4.641,17.434c-3.094,4.935-7.296,8.717-12.605,11.351c-5.311,2.634-11.225,3.951-17.747,3.951 S123.448,81.544,118.139,78.91z M128.549,58.09c1.964,1.965,4.409,2.947,7.337,2.947c2.926,0,5.372-0.982,7.337-2.947 c1.964-1.964,2.948-4.578,2.948-7.839c0-3.343-0.984-5.977-2.948-7.901c-1.965-1.922-4.411-2.885-7.337-2.885 c-2.928,0-5.374,0.962-7.337,2.885c-1.966,1.924-2.947,4.558-2.947,7.901C125.602,53.512,126.583,56.126,128.549,58.09z"/>
              </g>
              <g id="hll-s">
                <path fill="#ffffff" d="M183.734,81.544c-4.559-0.794-8.049-1.86-10.473-3.199V57.776l3.01,1.129c3.93,1.589,7.4,2.759,10.41,3.512 c3.01,0.753,6.898,1.129,11.665,1.129c2.508,0,4.515-0.458,6.021-1.379c1.505-0.919,2.257-2.173,2.257-3.763 c0-1.086-0.773-1.901-2.32-2.446c-1.548-0.543-4.076-1.191-7.587-1.944c-4.516-0.834-8.384-1.775-11.602-2.822 c-3.22-1.044-6-2.8-8.34-5.268c-2.342-2.465-3.512-5.789-3.512-9.971c0-12.542,9.197-18.813,27.593-18.813 c5.936,0,11.182,0.356,15.741,1.066c4.557,0.711,8.131,1.611,10.724,2.697v20.695c-8.529-3.428-16.891-5.143-25.084-5.143 c-2.759,0-4.829,0.482-6.208,1.442c-1.38,0.962-2.07,2.195-2.07,3.7c0,1.505,0.878,2.593,2.634,3.261 c1.756,0.67,4.597,1.38,8.528,2.132c4.598,0.837,8.36,1.736,11.288,2.697c2.926,0.962,5.476,2.571,7.651,4.829 c2.173,2.258,3.261,5.436,3.261,9.532c0,12.46-9.199,18.688-27.593,18.688C193.62,82.735,188.29,82.337,183.734,81.544z"/>
              </g>
              <g id="hll-c">
                <path fill="#ffffff" d="M268.706,39.464c-4.182,0-7.568,0.962-10.159,2.885c-2.593,1.924-3.888,4.558-3.888,7.901 c0,3.346,1.295,5.979,3.888,7.902c2.591,1.924,5.978,2.885,10.159,2.885c6.271,0,10.702-1.295,13.295-3.888v23.58 c-1.339,0.586-3.994,1.085-7.965,1.505c-3.972,0.417-7.004,0.627-9.093,0.627c-6.521,0-12.438-1.317-17.747-3.951 c-5.312-2.634-9.513-6.416-12.605-11.351c-3.094-4.933-4.641-10.743-4.641-17.434c0-6.689,1.547-12.48,4.641-17.371 c3.093-4.892,7.294-8.633,12.605-11.226c5.309-2.591,11.226-3.888,17.747-3.888c2.007,0,5.017,0.231,9.03,0.69 c4.014,0.46,6.688,0.984,8.027,1.568v23.329C279.324,40.719,274.892,39.464,268.706,39.464z"/>
              </g>
              <g id="hll-a">
                <path fill="#ffffff" d="M328.28,63.295h-1.254c0,5.854-1.799,10.516-5.394,13.984c-3.596,3.471-8.446,5.205-14.549,5.205 c-6.606,0-11.853-1.274-15.74-3.825c-3.889-2.55-5.832-6.542-5.832-11.978c0-6.688,3.637-11.602,10.911-14.737 c7.274-3.135,16.137-4.911,26.59-5.331c-1.088-1.671-2.593-2.988-4.515-3.951c-1.925-0.96-3.973-1.442-6.146-1.442 c-3.68,0-7.255,0.335-10.724,1.003c-3.471,0.67-7.296,1.63-11.476,2.885V21.78c4.18-1.254,8.297-2.258,12.354-3.01 c4.055-0.752,8.843-1.129,14.361-1.129c10.786,0,18.833,2.53,24.144,7.588c5.31,5.06,7.965,11.811,7.965,20.256v36.122h-24.709 L328.28,63.295z M315.613,67.559c1.838,0,3.866-0.668,6.083-2.007c2.214-1.336,3.323-2.967,3.323-4.892v-6.146 c-4.265,0.335-7.882,1.213-10.849,2.634c-2.97,1.423-4.453,3.386-4.453,5.895C309.718,66.054,311.681,67.559,315.613,67.559z"/>
              </g>
              <g id="hll-dot">
                <path fill="#2563EB" d="M376.294,79.843c-1.832-1.831-2.747-4.031-2.747-6.601c0-2.569,0.915-4.756,2.747-6.56 c1.831-1.804,4.03-2.706,6.601-2.706c2.569,0,4.756,0.902,6.561,2.706c1.804,1.804,2.706,3.991,2.706,6.56 c0,2.57-0.902,4.77-2.706,6.601c-1.805,1.831-3.991,2.747-6.561,2.747C380.324,82.59,378.125,81.674,376.294,79.843z"/>
              </g>
              <g id="hll-t">
                <path fill="#ffffff" d="M414.873,64.796c0.492,1.531,1.312,2.624,2.46,3.28c1.148,0.656,2.788,0.984,4.92,0.984v13.366 c-5.631,0-10.127-0.684-13.488-2.05c-3.362-1.366-5.919-3.936-7.667-7.708c-1.751-3.772-2.624-9.266-2.624-16.482v-4.182h-5.33 V40.606h5.33v-7.298h15.661v7.298h7.463v11.398h-7.463v6.314C414.135,61.106,414.381,63.267,414.873,64.796z"/>
              </g>
              <g id="hll-e1">
                <path fill="#ffffff" d="M426.598,49.667c2.022-3.198,4.769-5.644,8.241-7.339c3.471-1.694,7.339-2.542,11.603-2.542 c2.515,0,5.221,0.615,8.118,1.845s5.494,3.54,7.79,6.929c2.296,3.39,3.553,8.036,3.772,13.94l-26.404-0.82 c0.164,2.078,1.23,3.677,3.198,4.797c1.968,1.121,4.783,1.681,8.446,1.681c3.061,0,5.78-0.381,8.158-1.148 c2.378-0.765,3.922-1.503,4.634-2.214v16.154c-4.702,0.984-9.239,1.476-13.612,1.476c-8.419,0-15.021-1.886-19.803-5.658 c-4.784-3.772-7.176-9.02-7.176-15.744C423.564,56.651,424.576,52.865,426.598,49.667z M453.249,59.302 c-0.22-1.53-0.931-2.788-2.132-3.772c-1.203-0.984-2.488-1.476-3.854-1.476c-1.695,0-3.239,0.465-4.633,1.394 c-1.395,0.93-2.283,2.214-2.665,3.854H453.249z"/>
              </g>
              <g id="hll-e2">
                <path fill="#ffffff" d="M469.975,49.667c2.022-3.198,4.769-5.644,8.241-7.339c3.471-1.694,7.339-2.542,11.603-2.542 c2.515,0,5.221,0.615,8.118,1.845s5.494,3.54,7.79,6.929c2.296,3.39,3.553,8.036,3.772,13.94l-26.404-0.82 c0.164,2.078,1.23,3.677,3.198,4.797c1.968,1.121,4.783,1.681,8.446,1.681c3.061,0,5.78-0.381,8.158-1.148 c2.378-0.765,3.922-1.503,4.634-2.214v16.154c-4.702,0.984-9.239,1.476-13.612,1.476c-8.419,0-15.021-1.886-19.803-5.658 c-4.784-3.772-7.176-9.02-7.176-15.744C466.941,56.651,467.953,52.865,469.975,49.667z M496.626,59.302 c-0.22-1.53-0.931-2.788-2.132-3.772c-1.203-0.984-2.488-1.476-3.854-1.476c-1.695,0-3.239,0.465-4.633,1.394 c-1.395,0.93-2.283,2.214-2.665,3.854H496.626z"/>
              </g>
            </svg>
          </Link>

          <nav className="flex items-center gap-1">
            <div className="relative menu-container">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === 'file' ? null : 'file');
                }}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  activeMenu === 'file' ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800"
                )}
              >
                {t('editor.header.file', 'Arquivo')}
              </button>
              {activeMenu === 'file' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-2xl py-1 z-[100]" onClick={() => setActiveMenu(null)}>
                  <button onClick={() => setShowNewDocModal(true)} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"><FilePlus size={14} /> {t('editor.header.new', 'Novo')}</button>
                  <button onClick={() => teeInputRef.current?.click()} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"><Box size={14} /> {t('editor.header.open_project', 'Abrir projeto .tee')}</button>
                  <button onClick={() => exportCanvas('tee')} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"><Save size={14} /> {t('editor.header.save_project', 'Salvar projeto .tee')}</button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button 
                    onClick={() => {
                      fileInputRef.current?.click();
                    }} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <img src="https://moscatee.com/img/ps.webp" alt="PSD" className="w-3.5 h-3.5 object-contain" referrerPolicy="no-referrer" />
                    {t('modals.new_doc.presets.open_psd', 'Abrir PSD')}
                  </button>
                  <button 
                    onClick={() => {
                      fileInputRef.current?.click();
                    }} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <img src="https://moscatee.com/img/pdf.webp" alt="PDF" className="w-3.5 h-3.5 object-contain" referrerPolicy="no-referrer" />
                    {t('modals.new_doc.presets.open_pdf', 'Abrir PDF')}
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={() => setShowExportModal(true)} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"><Download size={14} /> {t('editor.header.export', 'Exportar')}</button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"><Upload size={14} /> {t('editor.header.import', 'Importar')}</button>
                </div>
              )}
            </div>
            <div className="relative menu-container">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === 'edit' ? null : 'edit');
                }}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  activeMenu === 'edit' ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800"
                )}
              >
                {t('editor.header.edit', 'Editar')}
              </button>
              {activeMenu === 'edit' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-2xl py-1 z-[100]" onClick={() => setActiveMenu(null)}>
                  <button 
                    onClick={async () => {
                      undo();
                    }} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center justify-between gap-2" 
                    disabled={historyState.index <= 0}
                  >
                    <div className="flex items-center gap-2"><Undo2 size={14} /> {t('editor.header.undo', 'Desfazer')}</div>
                    <span className="text-[10px] text-zinc-500">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+Z</span>
                  </button>
                  <button 
                    onClick={async () => {
                      redo();
                    }} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center justify-between gap-2" 
                    disabled={historyState.index >= historyState.history.length - 1}
                  >
                    <div className="flex items-center gap-2"><Redo2 size={14} /> {t('editor.header.redo', 'Refazer')}</div>
                    <span className="text-[10px] text-zinc-500">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+{t('a11y.shortcuts.keys.shift', 'Shift')}+Z</span>
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={deleteActive} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2 text-red-500"><Trash2 size={14} /> {t('editor.header.delete', 'Excluir')}</button>
                </div>
              )}
            </div>
            <div className="relative menu-container">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === 'view' ? null : 'view');
                }}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  activeMenu === 'view' ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800"
                )}
              >
                {t('editor.header.view', 'Exibir')}
              </button>
              {activeMenu === 'view' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-2xl py-1 z-[100]" onClick={() => setActiveMenu(null)}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowGrid(!showGrid); }} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2"><Grid size={14} /> {t('editor.header.show_grid_action', 'Mostrar grade')}</div>
                    {showGrid && <CheckCircle2 size={12} className="text-blue-500" />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSnapToGrid(!snapToGrid); }} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2"><Magnet size={14} /> {t('editor.header.snap_to_grid_action', 'Alinhar pela Grade')}</div>
                    {snapToGrid && <CheckCircle2 size={12} className="text-blue-500" />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleOutlineMode(); }} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2"><Eye size={14} /> {t('editor.header.outline_mode_action', 'Modo Contorno')}</div>
                    <div className="flex items-center gap-2">
                      {isOutlineMode && <CheckCircle2 size={12} className="text-blue-500" />}
                      <span className="text-[10px] text-zinc-500">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+Y</span>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowRulers(!showRulers); }} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2"><Ruler size={14} /> {t('editor.header.show_rulers_action', 'Mostrar réguas')}</div>
                    {showRulers && <CheckCircle2 size={12} className="text-blue-500" />}
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <div className="relative group/sub">
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2"><Layout size={14} /> {t('editor.header.guides', 'Guias')}</div>
                      <ChevronRight size={12} className="text-zinc-500" />
                    </button>
                    <div className="absolute top-0 left-full ml-1 w-48 bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-2xl opacity-0 group-hover/sub:opacity-100 pointer-events-none group-hover/sub:pointer-events-auto transition-all py-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowGuides(!showGuides); }} 
                        className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">{t('editor.header.show_guides_action', 'Mostrar guias')}</div>
                        <div className="flex items-center gap-2">
                          {showGuides && <CheckCircle2 size={12} className="text-blue-500" />}
                          <span className="text-[10px] text-zinc-500">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+H</span>
                        </div>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setLockGuides(!lockGuides); }} 
                        className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">{t('editor.header.lock_guides_action', 'Bloquear guias')}</div>
                        {lockGuides && <CheckCircle2 size={12} className="text-blue-500" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setGuides([]); setActiveMenu(null); }} 
                        className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center justify-between gap-2 text-red-500"
                      >
                        <div className="flex items-center gap-2">{t('editor.header.clear_guides_action', 'Limpar guias')}</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative menu-container">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === 'effects' ? null : 'effects');
                }}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  activeMenu === 'effects' ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800"
                )}
              >
                {t('editor.header.effects', 'Efeitos')}
              </button>
              {activeMenu === 'effects' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-2xl py-1 z-[100]" onClick={() => setActiveMenu(null)}>
                  <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 tracking-wider">{t('editor.gallery_filters.title', 'Filtros de galeria')}</div>
                  <button onClick={() => handleAddAdjustment('gaussian_blur')} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2">
                    <Droplets size={14} className="text-zinc-400" /> {t('editor.gallery_filters.gaussian_blur', 'Desfoque Gaussiano')}
                  </button>
                  <button onClick={() => handleAddAdjustment('sharpen')} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2">
                    <Wand2 size={14} className="text-zinc-400" /> {t('editor.gallery_filters.sharpen', 'Nitidez')}
                  </button>
                  <button onClick={() => handleAddAdjustment('noise')} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2">
                    <Sparkles size={14} className="text-zinc-400" /> {t('editor.gallery_filters.noise', 'Ruído')}
                  </button>
                  
                  <div className="h-px bg-zinc-800 my-1" />
                  <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 tracking-wider">{t('editor.adjustments.title', 'Ajustes')}</div>
                  <button onClick={() => handleAddAdjustment('brightness_contrast')} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2">
                    <Sun size={14} className="text-zinc-400" /> {t('editor.adjustments.brightness_contrast', 'Brilho/Contraste')}
                  </button>
                  <button onClick={() => handleAddAdjustment('hue_saturation')} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2">
                    <Palette size={14} className="text-zinc-400" /> {t('editor.adjustments.hue_saturation', 'Matiz/Saturação')}
                  </button>
                  <button onClick={() => handleAddAdjustment('vibrance')} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2">
                    <Sliders size={14} className="text-zinc-400" /> {t('editor.adjustments.vibrance', 'Vibratilidade')}
                  </button>
                  <button onClick={() => handleAddAdjustment('levels')} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-zinc-400" /> {t('editor.adjustments.levels', 'Níveis')}
                  </button>
                  <button onClick={() => handleAddAdjustment('gamma')} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2">
                    <Sun size={14} className="text-zinc-400" /> {t('editor.adjustments.gamma', 'Gama')}
                  </button>
                  <button onClick={() => handleAddAdjustment('black_white')} className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2">
                    <Contrast size={14} className="text-zinc-400" /> {t('editor.adjustments.black_white', 'Preto e Branco')}
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => { setShowAbout(true); setActiveMenu(null); }}
              className="px-3 py-1 text-xs font-medium hover:bg-zinc-800 rounded-md transition-colors"
            >
              {t('common.about', 'Sobre')}
            </button>
            
            <div className="relative menu-container">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === 'help' ? null : 'help');
                }}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  activeMenu === 'help' ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800"
                )}
              >
                {t('editor.header.help', 'Ajuda')}
              </button>
              
              {activeMenu === 'help' && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-2xl py-1 z-[100]" onClick={() => setActiveMenu(null)}>
                  <button 
                    onClick={() => setShowHelpModal(true)} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Eye size={14} className="text-zinc-400" />
                    {t('editor.help.accessibility', 'Acessibilidade')}
                  </button>
                  <button 
                    onClick={() => setShowShortcutsModal(true)} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Keyboard size={14} className="text-zinc-400" />
                    {t('editor.help.shortcuts', 'Atalhos de teclado')}
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button 
                    onClick={() => setShowReportModal(true)} 
                    className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <AlertCircle size={14} className="text-zinc-400" />
                    {t('editor.help.report_problem', 'Reportar problema')}
                  </button>
                </div>
              )}
            </div>

            <a
              href="https://moscatee.com/en/about"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg hover:border-zinc-700 transition-all ml-2"
            >
              {t('common.learn_more_project')}
            </a>
          </nav>

        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                "p-2 rounded-md transition-all",
                showGrid ? "bg-zinc-700 text-white" : "hover:bg-zinc-800 text-zinc-400"
              )}
              title={t('editor.grid.toggle', 'Alternar grade')}
            >
              <Grid3X3 size={18} />
            </button>
            <button 
              onClick={() => setBlindMode(!blindMode)}
              className={cn(
                "p-2 rounded-md transition-all flex items-center gap-2",
                blindMode ? "bg-blue-600 text-white" : "hover:bg-zinc-800 text-zinc-400"
              )}
              title={t('a11y.blindMode.tooltip')}
              aria-pressed={blindMode}
            >
              {blindMode ? <Accessibility size={18} /> : <EyeOff size={18} />}
              <span className="text-[10px] font-bold hidden sm:inline">
                {t('common.accessibility_short', 'Acessibilidade')}
              </span>
            </button>
          </div>
          
          <LanguageSelector />
          
          <div className="flex items-center gap-4 px-4 border-l border-zinc-800 h-full">
            {canInstallPWA && (
              <button 
                onClick={handleInstallPWA}
                className="ml-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all hover:border-zinc-700"
              >
                <Smartphone size={14} />
                {t('editor.header.download_app', 'Baixar app')}
              </button>
            )}
            <button 
              onClick={() => setShowExportModal(true)}
              className="ml-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              {t('editor.header.export', 'Exportar')}
            </button>
          </div>
        </div>
    </header>

      {/* Contextual Toolbar */}
      {activeTool === 'magic-wand' ? (
        <MagicWandOptionsBar 
          tolerance={magicWandTolerance}
          setTolerance={setMagicWandTolerance}
          contiguous={magicWandContiguous}
          setContiguous={setMagicWandContiguous}
          hasSelection={!!magicWandSelection}
          onAction={handleMagicWandAction}
        />
      ) : (activeTool === 'lasso' || activeTool === 'polygonal-lasso') ? (
        <LassoOptionsBar 
          onCancel={() => setActiveTool('select')}
          hasSelection={lassoState.selectionClosed}
          onAction={handleLassoAction}
        />
      ) : activeTool === 'marquee' ? (
        <MarqueeOptionsBar 
          onCancel={() => setActiveTool('select')}
          hasSelection={!!marqueeState}
          onAction={handleMarqueePixelAction}
        />
      ) : activeTool === 'magnetic-lasso' ? (
        <MagneticLassoOptionsBar 
          onComplete={() => {
            if (!canvas || magneticLassoPoints.length < 2) return;
            const path = new fabric.Path(`M ${magneticLassoPoints.filter(p => p && typeof p.x === 'number').map(p => `${p.x} ${p.y}`).join(' L ')} Z`, {
              fill: 'transparent',
              stroke: foreground,
              strokeWidth: 2,
              strokeDashArray: [5, 5]
            });
            canvas.add(path);
            canvas.setActiveObject(path);
            clearMagneticLasso();
            setActiveTool('select');
            saveToHistory(canvas);
            updateLayers(canvas);
          }}
          onCancel={() => {
            clearMagneticLasso();
            setActiveTool('select');
          }}
          pointsCount={magneticLassoPoints.length}
        />
      ) : activeTool === 'pen' ? (
        <PenOptionsBar 
          onComplete={() => {
            // The hook handles completion if closed, but we can force it here
            setActiveTool('select');
          }}
          onCancel={() => {
            clearPenTool();
            setActiveTool('select');
          }}
          pointsCount={penPoints.length}
        />
      ) : (activeObject && activeObject.type === 'line') ? (
        <LineOptionsBar 
          lineOptions={lineOptions}
          updateLineProperty={updateLineProperty}
          setLineStyle={setLineStyle}
          setLineCap={setLineCap}
          setLineArrow={setLineArrow}
          updateLineDashGap={updateLineDashGap}
          t={t}
        />
      ) : (activeObject && !(activeObject.id && activeObject.id.toString().startsWith('artboard_bg'))) ? (
        <ContextualObjectBar 
          activeObject={activeObject}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          topOptions={topOptions}
          setTopOptions={setTopOptions}
          updateActiveObject={updateActiveObject}
          toggleTextProperty={toggleTextProperty}
          duplicateObject={duplicateObject}
          deleteActive={deleteActive}
          alignActiveObject={alignActiveObject}
          flipActiveObject={flipActiveObject}
          fonts={fonts}
          fontInputRef={fontInputRef}
          toHex={toHex}
          t={t}
          canvas={canvas}
          saveToHistory={saveToHistory}
          updateLayers={updateLayers}
          forceUpdate={forceUpdate}
          artboardSize={artboardSize}
          setArtboardSize={setArtboardSize}
          offset={offset}
          setOffset={setOffset}
          canvasPreset={canvasPreset}
          setCanvasPreset={setCanvasPreset}
          CANVAS_PRESETS={CANVAS_PRESETS}
          getBackgroundOpacity={getBackgroundOpacity}
          updateBackgroundOpacity={updateBackgroundOpacity}
          unit={unit}
          handleUnitChange={handleUnitChange}
          UNITS={UNITS}
          formatValue={formatValue}
          isPdfMode={isPdfMode}
          onExportPdf={handleExportPdf}
          onOcr={handleOcr}
          onCompressPdf={handleCompressPdf}
          onProtectPdf={handleProtectPdf}
          handlePathfinder={handlePathfinder}
          handlePowerClip={handlePowerClip}
          isPowerClipEditing={isPowerClipEditing}
          exitPowerClipEdit={exitPowerClipEdit}
          alignmentMode={alignmentMode}
          setAlignmentMode={setAlignmentMode}
        />
      ) : activeTool === 'line' ? (
        <LineOptionsBar 
          lineOptions={lineOptions}
          updateLineProperty={updateLineProperty}
          setLineStyle={setLineStyle}
          setLineCap={setLineCap}
          setLineArrow={setLineArrow}
          updateLineDashGap={updateLineDashGap}
          t={t}
        />
      ) : (activeTool === 'brush' || activeTool === 'eraser') ? (
        <BrushOptionsBar />
      ) : activeTool === 'shapes' ? (
        <ShapeOptionsBar 
          activeShape={activeShape}
          setActiveShape={setActiveShapeWithRef}
          t={t}
        />
      ) : (
        <ContextualObjectBar 
          activeObject={activeObject}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          topOptions={topOptions}
          setTopOptions={setTopOptions}
          updateActiveObject={updateActiveObject}
          toggleTextProperty={toggleTextProperty}
          duplicateObject={duplicateObject}
          deleteActive={deleteActive}
          alignActiveObject={alignActiveObject}
          flipActiveObject={flipActiveObject}
          fonts={fonts}
          fontInputRef={fontInputRef}
          toHex={toHex}
          t={t}
          canvas={canvas}
          saveToHistory={saveToHistory}
          updateLayers={updateLayers}
          forceUpdate={forceUpdate}
          artboardSize={artboardSize}
          setArtboardSize={setArtboardSize}
          offset={offset}
          setOffset={setOffset}
          canvasPreset={canvasPreset}
          setCanvasPreset={setCanvasPreset}
          CANVAS_PRESETS={CANVAS_PRESETS}
          getBackgroundOpacity={getBackgroundOpacity}
          updateBackgroundOpacity={updateBackgroundOpacity}
          unit={unit}
          handleUnitChange={handleUnitChange}
          UNITS={UNITS}
          formatValue={formatValue}
          isPdfMode={isPdfMode}
          onExportPdf={handleExportPdf}
          onOcr={handleOcr}
          onCompressPdf={handleCompressPdf}
          onProtectPdf={handleProtectPdf}
          handlePathfinder={handlePathfinder}
          handlePowerClip={handlePowerClip}
          isPowerClipEditing={isPowerClipEditing}
          exitPowerClipEdit={exitPowerClipEdit}
          alignmentMode={alignmentMode}
          setAlignmentMode={setAlignmentMode}
        />
      )}

      {/* Main Layout */}
      <div className="flex-grow flex flex-col overflow-hidden relative">
        {/* Document Tabs */}
        <div className="h-10 bg-[#141414] border-b border-zinc-800 flex items-center px-4 gap-1 overflow-x-auto custom-scrollbar shrink-0 z-50">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => switchDocument(doc.id)}
              className={cn(
                "group flex items-center gap-2 px-4 py-1.5 rounded-t-lg text-[10px] font-bold cursor-pointer transition-all min-w-[120px] max-w-[200px] border-x border-t",
                activeDocumentId === doc.id 
                  ? "bg-[#1a1a1a] border-zinc-700 text-blue-500" 
                  : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              <FileText size={12} />
              <span className="truncate flex-grow">{doc.name}</span>
              <button 
                onClick={(e) => closeDocument(doc.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-800 rounded transition-all"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <button 
            onClick={() => addNewDocument()}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
            title={t('editor.header.new_document', 'New Document')}
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden">
        <div id="toolbar" className="flex shrink-0">
          <LeftSidebar 
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeObject={activeObject}
            copyStyle={copyStyle}
            handleRemoveBackground={handleRemoveBackground}
            handleVectorize={handleVectorize}
            isRemovingBg={isRemovingBg}
            bgRemovalProgress={bgRemovalProgress}
          />
        </div>

        {isPdfMode && (
          <PdfPagePanel 
            pages={pdfPages}
            currentIndex={currentPdfPageIndex}
            onSelectPage={handleSelectPdfPage}
            onDeletePage={handleDeletePdfPage}
            onDuplicatePage={handleDuplicatePdfPage}
            onRotatePage={handleRotatePdfPage}
            onAddBlankPage={handleAddBlankPdfPage}
            onReorderPages={handleReorderPdfPages}
          />
        )}

        {/* Canvas Area */}
        <main 
          id="canvas-area"
          className="flex-grow min-w-0 relative bg-[#121212] overflow-hidden flex items-center justify-center p-12"
          style={{ 
            filter: VISION_TYPES.find(t => t.id === visionType)?.filter || 'none',
          }}
          onMouseDown={(e) => {
            if (activeTool !== 'select') return;
            if (e.button !== 0) return;
            
            // Verificação rigorosa para não iniciar o marquee ao clicar no canvas ou seus elementos
            const target = e.target as HTMLElement;
            const isCanvasInteraction = 
              target.tagName === 'CANVAS' || 
              target.classList.contains('upper-canvas') ||
              !!target.closest('#canvas-wrapper') || 
              !!target.closest('.canvas-container');
            
            if (isCanvasInteraction) {
              return;
            }
            
            const element = e.currentTarget as HTMLElement;
            if (!element || typeof element.getBoundingClientRect !== 'function') return;
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            setMarquee({ x1: x, y1: y, x2: x, y2: y, active: true });
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
              const nx = moveEvent.clientX - rect.left;
              const ny = moveEvent.clientY - rect.top;
              setMarquee(prev => ({ ...prev, x2: nx, y2: ny }));
            };
            
            const handleMouseUp = (upEvent: MouseEvent) => {
              window.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('mouseup', handleMouseUp);
              
              const nx = upEvent.clientX - rect.left;
              const ny = upEvent.clientY - rect.top;
              
              if (Math.abs(x - nx) < 5 && Math.abs(y - ny) < 5) {
                setSelectedGuideIds([]);
                setMarquee(prev => ({ ...prev, active: false }));
                return;
              }
              
              const xMin = Math.min(x, nx);
              const xMax = Math.max(x, nx);
              const yMin = Math.min(y, ny);
              const yMax = Math.max(y, ny);
              
              // Select guides within marquee
              if (canvas) {
                const zoom = canvas.getZoom();
                const vpt = canvas.viewportTransform!;
                
                const selectedIds = guides.filter(guide => {
                  const pos = guide.position * zoom + (guide.type === 'horizontal' ? vpt[5] : vpt[4]);
                  if (guide.type === 'horizontal') {
                    return pos >= yMin && pos <= yMax;
                  } else {
                    return pos >= xMin && pos <= xMax;
                  }
                }).map(g => g.id);
                
                if (upEvent.shiftKey) {
                  setSelectedGuideIds(prev => Array.from(new Set([...prev, ...selectedIds])));
                } else {
                  setSelectedGuideIds(selectedIds);
                }
              }
              
              setMarquee(prev => ({ ...prev, active: false }));
            };
            
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          }}
        >
          {/* Vertical Scrollbar - Temporarily hidden as it was causing visual clutter */}
          {/*
          {canvas && (
            <div className="absolute right-1 top-12 bottom-12 w-1.5 bg-zinc-800/20 rounded-full z-[100] backdrop-blur-sm">
              <motion.div 
                className="w-full bg-zinc-500/40 hover:bg-zinc-400/60 rounded-full cursor-pointer transition-colors"
                style={{ 
                  height: '15%',
                  top: `${Math.max(0, Math.min(85, (-canvas.viewportTransform![5] / (canvas.height! * canvas.getZoom() || 1)) * 100))}%`,
                  position: 'absolute'
                }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                onDrag={(e, info) => {
                  const vpt = [...canvas.viewportTransform!];
                  vpt[5] -= info.delta.y * 5;
                  canvas.setViewportTransform(vpt);
                  canvas.requestRenderAll();
                  setOffset({ x: vpt[4], y: vpt[5] });
                }}
              />
            </div>
          )}
          */}

          {/* Horizontal Scrollbar - Hidden to fix the "line at bottom" bug */}
          {/*
          {canvas && (
            <div className="absolute bottom-1 left-12 right-12 h-1.5 bg-zinc-800/20 rounded-full z-[100] backdrop-blur-sm">
              <motion.div 
                className="h-full bg-zinc-500/40 hover:bg-zinc-400/60 rounded-full cursor-pointer transition-colors"
                style={{ 
                  width: '15%',
                  left: `${Math.max(0, Math.min(85, (-canvas.viewportTransform![4] / (canvas.width! * canvas.getZoom() || 1)) * 100))}%`,
                  position: 'absolute'
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDrag={(e, info) => {
                  const vpt = [...canvas.viewportTransform!];
                  vpt[4] -= info.delta.x * 5;
                  canvas.setViewportTransform(vpt);
                  canvas.requestRenderAll();
                  setOffset({ x: vpt[4], y: vpt[5] });
                }}
              />
            </div>
          )}
          */}

          {/* Marquee Overlay */}
          {marquee.active && (
            <div 
              className="absolute border border-blue-500 bg-blue-500/10 z-[60] pointer-events-none"
              style={{
                left: Math.min(marquee.x1, marquee.x2),
                top: Math.min(marquee.y1, marquee.y2),
                width: Math.abs(marquee.x2 - marquee.x1),
                height: Math.abs(marquee.y2 - marquee.y1),
              }}
            />
          )}

          {/* Artboard Tooltip */}
          {artboardTooltip && artboardTooltip.visible && (
            <div 
              className="fixed bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-[1000] pointer-events-none flex items-center gap-1"
              style={{
                left: artboardTooltip.x + 15,
                top: artboardTooltip.y + 15,
              }}
            >
              <Maximize2 size={10} />
              {artboardTooltip.width} x {artboardTooltip.height} px
            </div>
          )}
          {/* SVG Filters for Daltonism */}
          <svg className="hidden">
            <defs>
              <filter id="protanopia">
                <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
              </filter>
              <filter id="deuteranopia">
                <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
              </filter>
              <filter id="tritanopia">
                <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0" />
              </filter>
            </defs>
          </svg>
          {showRulers && canvas && (
            <>
              <div className="absolute top-0 left-6 right-0 h-6 z-30 border-b border-zinc-800">
                <CanvasRuler 
                  type="horizontal" 
                  size={window.innerWidth - 352} 
                  zoom={zoom / 100} 
                  offset={offset.x - 24} 
                  onAddGuide={(pos) => addGuide('horizontal', pos)}
                  canvas={canvas}
                  setGhostGuide={setGhostGuide}
                  unit={unit}
                />
              </div>
              <div className="absolute top-6 left-0 bottom-0 w-6 z-30 border-r border-zinc-800">
                <CanvasRuler 
                  type="vertical" 
                  size={window.innerHeight - 92} 
                  zoom={zoom / 100} 
                  offset={offset.y - 24} 
                  onAddGuide={(pos) => addGuide('vertical', pos)}
                  canvas={canvas}
                  setGhostGuide={setGhostGuide}
                  unit={unit}
                />
              </div>
              <div className="absolute top-0 left-0 w-6 h-6 bg-[#191919] border-r border-b border-zinc-800 z-40 flex items-center justify-center">
                <div className="w-2 h-2 border-r border-b border-zinc-700" />
              </div>
            </>
          )}

          {/* Guides Overlay */}
          {showGrid && blindMode && mousePos && mousePos.x >= 0 && mousePos.x <= artboardSize.width && mousePos.y >= 0 && mousePos.y <= artboardSize.height && (
            <div 
              className="fixed pointer-events-none z-[100] bg-[#0057FF]/90 text-white px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider shadow-lg whitespace-nowrap"
              style={{
                left: lastMousePosRef.current ? lastMousePosRef.current.x + 15 : 0,
                top: lastMousePosRef.current ? lastMousePosRef.current.y : 0,
                transform: 'translateY(-50%)'
              }}
            >
              {(() => {
                const col = Math.floor(mousePos.x / GRID_SIZE);
                const row = Math.floor(mousePos.y / GRID_SIZE);
                
                // Optimized column label generator
                let s = '';
                let i = col;
                do {
                  s = String.fromCharCode(65 + (i % 26)) + s;
                  i = Math.floor(i / 26) - 1;
                } while (i >= 0);
                
                return `${s}-${row + 1}`;
              })()}
            </div>
          )}
          {showGuides && canvas && guides.map(guide => (
            <div
              key={guide.id}
              onMouseDown={(e) => {
                if (lockGuides) return;
                e.stopPropagation();
                
                let newSelection = [...selectedGuideIds];
                if (!e.ctrlKey && !e.metaKey) {
                  if (!selectedGuideIds.includes(guide.id)) {
                    newSelection = [guide.id];
                    setSelectedGuideIds(newSelection);
                  }
                } else {
                  if (!selectedGuideIds.includes(guide.id)) {
                    newSelection = [...selectedGuideIds, guide.id];
                    setSelectedGuideIds(newSelection);
                  }
                }
                
                const mainElement = e.currentTarget.parentElement;
                if (!mainElement) return;
                
                const startX = e.clientX;
                const startY = e.clientY;
                const initialPositions = guides
                  .filter(g => newSelection.includes(g.id))
                  .map(g => ({ id: g.id, pos: g.position }));

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  if (!canvas) return;
                  const zoom = canvas.getZoom();
                  
                  const dx = (moveEvent.clientX - startX) / zoom;
                  const dy = (moveEvent.clientY - startY) / zoom;
                  
                  setGuides(prev => prev.map(g => {
                    const initial = initialPositions.find(ip => ip.id === g.id);
                    if (initial) {
                      return { ...g, position: initial.pos + (g.type === 'horizontal' ? dy : dx) };
                    }
                    return g;
                  }));
                };
                
                const handleMouseUp = () => {
                  window.removeEventListener('mousemove', handleMouseMove);
                  window.removeEventListener('mouseup', handleMouseUp);
                };
                
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={cn(
                "absolute z-25 group transition-colors",
                guide.type === 'horizontal' ? "h-2 -translate-y-1/2 cursor-ns-resize" : "w-2 -translate-x-1/2 cursor-ew-resize",
                !guide.artboardId && (guide.type === 'horizontal' ? "left-0 right-0" : "top-0 bottom-0")
              )}
              style={{
                top: guide.type === 'horizontal' ? (guide.position * (canvas.getZoom() || 1) + (canvas.viewportTransform?.[5] || 0)) : (guide.start !== undefined ? (guide.start * (canvas.getZoom() || 1) + (canvas.viewportTransform?.[5] || 0)) : 0),
                left: guide.type === 'vertical' ? (guide.position * (canvas.getZoom() || 1) + (canvas.viewportTransform?.[4] || 0)) : (guide.start !== undefined ? (guide.start * (canvas.getZoom() || 1) + (canvas.viewportTransform?.[4] || 0)) : 0),
                height: guide.type === 'vertical' && guide.start !== undefined && guide.end !== undefined ? ((guide.end - guide.start) * (canvas.getZoom() || 1)) : undefined,
                width: guide.type === 'horizontal' && guide.start !== undefined && guide.end !== undefined ? ((guide.end - guide.start) * (canvas.getZoom() || 1)) : undefined,
              }}
            >
              <div className={cn(
                "absolute transition-colors",
                guide.type === 'horizontal' ? "left-0 right-0 h-[1px] top-1/2 -translate-y-1/2" : "top-0 bottom-0 w-[1px] left-1/2 -translate-x-1/2",
                selectedGuideIds.includes(guide.id) ? "bg-amber-500" : ""
              )} 
              style={{
                backgroundColor: !selectedGuideIds.includes(guide.id) ? (guide.color || '#22d3ee') : undefined
              }}
              />
              
              <div className={cn(
                "absolute opacity-0 group-hover:opacity-100 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[8px] text-white pointer-events-none whitespace-nowrap z-50",
                guide.type === 'horizontal' ? "left-2 -top-4" : "top-2 -left-4"
              )}>
                {Math.round(guide.position)}px
              </div>
            </div>
          ))}

          {/* Ghost Guide */}
          {ghostGuide && canvas && (
            <div 
              className={cn(
                "absolute z-[60] bg-cyan-400 pointer-events-none",
                ghostGuide.type === 'horizontal' ? "left-0 right-0 h-[1px] -translate-y-1/2" : "top-0 bottom-0 w-[1px] -translate-x-1/2"
              )}
              style={{
                top: ghostGuide.type === 'horizontal' ? (ghostGuide.position * (canvas.getZoom() || 1) + (canvas.viewportTransform?.[5] || 0)) : 0,
                left: ghostGuide.type === 'vertical' ? (ghostGuide.position * (canvas.getZoom() || 1) + (canvas.viewportTransform?.[4] || 0)) : 0,
              }}
            />
          )}

          {/* Canvas Container */}
          <div 
            ref={containerRef}
            className="w-full h-full relative z-20 bg-[#121212] overflow-hidden"
            onContextMenu={handleContextMenu}
            id="canvas-wrapper"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <canvas ref={canvasRef} id="mosca-canvas" />

            {/* Artboard Selection Overlay removed */}
            {showGrid && blindMode && canvas && offset && (
              <CanvasCoordinateRuler 
                canvasWidth={artboardSize?.width || 1080}
                canvasHeight={artboardSize?.height || 1350}
                canvasOffsetX={offset?.x || 0}
                canvasOffsetY={offset?.y || 0}
                zoom={(zoom || 50) / 100}
                cellSize={GRID_SIZE || 50}
                mouseDocX={mousePos?.x || 0}
                mouseDocY={mousePos?.y || 0}
              />
            )}

            {lassoState && (
              <LassoOverlay
                points={lassoState.points || []}
                mousePos={lassoState.mousePos || { x: 0, y: 0 }}
                selectionClosed={lassoState.selectionClosed || false}
                nearStartPoint={lassoState.nearStartPoint || false}
                canvasRect={canvasRef.current?.getBoundingClientRect() ?? null}
                zoom={canvas?.getZoom() ?? 1}
                vpTransform={canvas?.viewportTransform ?? [1, 0, 0, 1, 0, 0]}
              />
            )}

            {marqueeState && (
              <MarqueeOverlay
                rect={marqueeState}
                canvasRect={canvasRef.current?.getBoundingClientRect() ?? null}
                zoom={canvas?.getZoom() ?? 1}
                vpTransform={canvas?.viewportTransform ?? [1, 0, 0, 1, 0, 0]}
              />
            )}

            {magicWandSelection && (
              <MagicWandOverlay 
                selection={magicWandSelection}
                canvasRect={canvasRef.current?.getBoundingClientRect() ?? null}
                zoom={canvas?.getZoom() ?? 1}
                vpTransform={canvas?.viewportTransform ?? [1, 0, 0, 1, 0, 0]}
              />
            )}

                  {/* Banners for modes */}

            {/* Mask Editing Mode Banner */}
            <AnimatePresence>
              {isFilling && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] bg-amber-600/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-amber-400/30 shadow-2xl flex flex-col gap-2 min-w-[300px]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-white animate-pulse" />
                      <span className="text-xs font-bold text-white tracking-wider">{t('editor.tools.smart_fill', 'Preenchimento inteligente (IA Local)')}</span>
                    </div>
                    <span className="text-[10px] font-black text-amber-100">{fillProgress.percent}%</span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${fillProgress.percent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  
                  <span className="text-[10px] text-amber-50 text-center font-medium">{fillProgress.status}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Context Menu */}
            <AnimatePresence>
              {contextMenu && contextMenu.visible && (
                <>
                  <div 
                    className="fixed inset-0 z-[999]" 
                    onClick={() => setContextMenu(null)}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    className="fixed z-[1000] min-w-[170px] bg-[#1a1a1a] border border-zinc-800/50 rounded-lg shadow-2xl py-1 overflow-visible"
                  >
                    {/* Object Context Menu Operations */}
                    {canvas?.getActiveSelection && canvas.getActiveObject()?.type === 'activeSelection' && (
                      <>
                        <button 
                          onClick={() => { handlePathfinder('union'); setContextMenu(null); }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center gap-2 transition-colors"
                        >
                          <Ungroup size={12} className="text-zinc-400" /> {t('editor.pathfinder.union', 'Unir objetos')}
                        </button>
                        <button 
                          onClick={() => { handlePathfinder('subtract'); setContextMenu(null); }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center gap-2 transition-colors"
                        >
                          <Minus size={12} className="text-zinc-400" /> {t('editor.pathfinder.subtract', 'Subtrair objetos')}
                        </button>
                        <button 
                          onClick={() => { handlePathfinder('intersect'); setContextMenu(null); }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center gap-2 transition-colors"
                        >
                          <BoxSelect size={12} className="text-zinc-400" /> {t('editor.pathfinder.intersect', 'Interseção de objetos')}
                        </button>
                        <button 
                          onClick={() => { handlePathfinder('exclude'); setContextMenu(null); }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center gap-2 transition-colors"
                        >
                          <X size={12} className="text-zinc-400" /> {t('editor.pathfinder.exclude', 'Excluir sobreposição')}
                        </button>
                        <div className="h-px bg-zinc-800/50 my-1" />
                      </>
                    )}

                    {(lassoState.selectionClosed || marqueeState) && (
                      <>
                        <button 
                          onClick={() => { 
                            if (lassoState.selectionClosed) {
                              actionExtractOnly().then(extracted => {
                                if (extracted) {
                                  clipboardRef.current = extracted;
                                  showToast(t('editor.messages.copied_selection', 'Seleção copiada'), 'success');
                                }
                              });
                            } else {
                              handleMarqueePixelAction('copy');
                            }
                            setContextMenu(null); 
                          }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><Copy size={12} className="text-zinc-400" /> {t('common.copy', 'Copiar')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+C</span>
                        </button>
                        <button 
                          onClick={() => { 
                            if (lassoState.selectionClosed) {
                              actionCutOnly().then(extracted => {
                                if (extracted) {
                                  clipboardRef.current = extracted;
                                  showToast(t('editor.messages.cut_selection', 'Seleção recortada'), 'success');
                                }
                              });
                            } else {
                              handleMarqueePixelAction('cut');
                            }
                            setContextMenu(null); 
                          }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><Scissors size={12} className="text-zinc-400" /> {t('common.cut', 'Recortar')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+X</span>
                        </button>
                        <button 
                          onClick={() => { 
                            if (lassoState.selectionClosed) {
                              actionCropAsObject();
                            } else {
                              handleMarqueePixelAction('duplicate');
                            }
                            setContextMenu(null); 
                          }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><Copy size={12} className="text-zinc-400" /> {t('common.duplicate', 'Duplicar')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+J</span>
                        </button>
                        <button 
                          onClick={() => { 
                            if (lassoState.selectionClosed) {
                              cancelSelection();
                            } else {
                              setMarqueeState(null);
                            }
                            setContextMenu(null); 
                          }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors border-t border-zinc-800/50 mt-0.5"
                        >
                          <div className="flex items-center gap-2"><X size={12} className="text-zinc-400" /> {t('common.deselect', 'Desmarcar')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+D</span>
                        </button>
                        <div className="h-px bg-zinc-800/50 my-1" />
                      </>
                    )}

                    {magicWandSelection && (
                      <>
                        <button 
                          onClick={() => { handleMagicWandAction('copy'); setContextMenu(null); }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><Copy size={12} className="text-zinc-400" /> {t('common.copy', 'Copiar')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+C</span>
                        </button>
                        <button 
                          onClick={() => { handleMagicWandAction('cut'); setContextMenu(null); }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><Scissors size={12} className="text-zinc-400" /> {t('common.cut', 'Recortar')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+X</span>
                        </button>
                        <button 
                          onClick={() => { handleMagicWandAction('duplicate'); setContextMenu(null); }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><Copy size={12} className="text-zinc-400" /> {t('common.duplicate', 'Duplicar')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+J</span>
                        </button>
                        <button 
                          onClick={() => { deselectMagicWand(); setContextMenu(null); }}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors border-t border-zinc-800/50 mt-0.5"
                        >
                          <div className="flex items-center gap-2"><X size={12} className="text-zinc-400" /> {t('common.deselect', 'Desmarcar')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+D</span>
                        </button>
                        <div className="h-px bg-zinc-800/50 my-1" />
                      </>
                    )}

                    {canvas?.getActiveObjects().length === 2 && 
                     canvas.getActiveObjects().some(obj => obj.type === 'image') && (
                      <button 
                        onClick={() => { triggerContentAwareFill(); setContextMenu(null); }}
                        onMouseEnter={() => setContextMenu(prev => prev ? { ...prev, submenu: undefined } : null)}
                        className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors border-b border-zinc-800/50 mb-0.5"
                      >
                        <div className="flex items-center gap-2"><Sparkles size={12} className="text-amber-400" /> {t('editor.tools.smart_fill', 'Preenchimento Inteligente')}</div>
                        <span className="text-[9px] opacity-40 font-mono">IA Local</span>
                      </button>
                    )}

                    {canvas?.getActiveObjects().length >= 2 && (
                      <button 
                        onClick={() => { groupSelectedElements(); setContextMenu(null); }}
                        onMouseEnter={() => setContextMenu(prev => prev ? { ...prev, submenu: undefined } : null)}
                        className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2"><FolderPlus size={12} className="text-zinc-400" /> {t('editor.header.group', 'Colocar em Pasta')}</div>
                        <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+G</span>
                      </button>
                    )}
                    {canvas?.getActiveObject()?.type === 'group' && (
                      <button 
                        onClick={() => { ungroupSelectedElement(); setContextMenu(null); }}
                        onMouseEnter={() => setContextMenu(prev => prev ? { ...prev, submenu: undefined } : null)}
                        className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2"><FolderMinus size={12} className="text-zinc-400" /> {t('editor.header.ungroup', 'Desfazer Pasta')}</div>
                        <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+{t('a11y.shortcuts.keys.shift', 'Shift')}+G</span>
                      </button>
                    )}

                    {canvas?.getActiveObject() && (
                      <div className="relative group/submenu">
                        <button 
                          onMouseEnter={() => setContextMenu(prev => prev ? { ...prev, submenu: 'organize' } : null)}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><LayersIcon size={12} className="text-zinc-400" /> {t('editor.header.organize', 'Organizar')}</div>
                          <ChevronRight size={10} className="text-zinc-500" />
                        </button>
                        
                        {contextMenu.submenu === 'organize' && (
                          <motion.div 
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="absolute left-full top-0 ml-1 min-w-[160px] bg-[#1a1a1a] border border-zinc-800/50 rounded-lg shadow-2xl py-1"
                          >
                            <button 
                              onClick={() => { canvas.bringToFront(canvas.getActiveObject()); setContextMenu(null); canvas.renderAll(); updateLayers(canvas); }}
                              className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-2"><ArrowUpToLine size={12} className="text-zinc-400" /> {t('editor.header.bring_to_front', 'Trazer para a frente')}</div>
                              <span className="text-[9px] opacity-40 font-mono">⇧⌘]</span>
                            </button>
                            <button 
                              onClick={() => { canvas.bringForward(canvas.getActiveObject()); setContextMenu(null); canvas.renderAll(); updateLayers(canvas); }}
                              className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-2"><ArrowUp size={12} className="text-zinc-400" /> {t('editor.header.bring_forward', 'Avançar')}</div>
                              <span className="text-[9px] opacity-40 font-mono">⌘]</span>
                            </button>
                            <button 
                              onClick={() => { canvas.sendBackwards(canvas.getActiveObject()); setContextMenu(null); canvas.renderAll(); updateLayers(canvas); }}
                              className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-2"><ArrowDown size={12} className="text-zinc-400" /> {t('editor.header.send_backward', 'Recuar')}</div>
                              <span className="text-[9px] opacity-40 font-mono">⌘[</span>
                            </button>
                            <button 
                              onClick={() => { 
                                const active = canvas.getActiveObject();
                                canvas.sendToBack(active);
                                // Ensure artboard and grid stay at the very back
                                const artboard = canvas.getObjects().find(obj => (obj as any).id === 'artboard_bg');
                                if (artboard) canvas.sendToBack(artboard);
                                setContextMenu(null); 
                                canvas.renderAll(); 
                                updateLayers(canvas); 
                              }}
                              className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-2"><ArrowDownToLine size={12} className="text-zinc-400" /> {t('editor.header.send_to_back', 'Enviar para trás')}</div>
                              <span className="text-[9px] opacity-40 font-mono">⇧⌘[</span>
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {canvas?.getActiveObject() && (
                      <>
                        <button 
                          onClick={() => { copyStyle(); setContextMenu(null); }}
                          onMouseEnter={() => setContextMenu(prev => prev ? { ...prev, submenu: undefined } : null)}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><Copy size={12} className="text-zinc-400" /> {t('editor.header.copy_style', 'Copiar Estilo')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+{t('a11y.shortcuts.keys.shift', 'Shift')}+C</span>
                        </button>
                        <button 
                          onClick={() => { pasteStyle(); setContextMenu(null); }}
                          onMouseEnter={() => setContextMenu(prev => prev ? { ...prev, submenu: undefined } : null)}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><ClipboardPaste size={12} className="text-zinc-400" /> {t('editor.header.paste_style', 'Colar Estilo')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+{t('a11y.shortcuts.keys.shift', 'Shift')}+V</span>
                        </button>

                        <button 
                          onClick={() => { duplicateObject(); setContextMenu(null); }}
                          onMouseEnter={() => setContextMenu(prev => prev ? { ...prev, submenu: undefined } : null)}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><Copy size={12} className="text-zinc-400" /> {t('editor.header.duplicate', 'Duplicar')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+D</span>
                        </button>
                        
                        <button 
                          onClick={() => { deleteActive(); setContextMenu(null); }}
                          onMouseEnter={() => setContextMenu(prev => prev ? { ...prev, submenu: undefined } : null)}
                          className="w-full px-2 py-1 text-left text-[11px] font-medium text-red-400 hover:text-white hover:bg-red-600 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2"><Trash2 size={12} /> {t('editor.header.delete', 'Excluir')}</div>
                          <span className="text-[9px] opacity-40 font-mono">{t('a11y.shortcuts.keys.delete', 'Del')}</span>
                        </button>

                        <div className="h-px bg-zinc-800/50 my-1" />
                      </>
                    )}

                    {/* Distort Section */}
                    {activeObject && activeObject.type !== 'activeSelection' && (
                      <button 
                        onClick={() => { toggleDistort(activeObject); setContextMenu(null); }}
                        onMouseEnter={() => setContextMenu(prev => prev ? { ...prev, submenu: undefined } : null)}
                        className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center gap-2 transition-colors"
                      >
                        <BoxSelect size={12} className="text-zinc-400" /> 
                        {(activeObject as any).edit ? t('editor.distort.finish') : t('editor.distort.start')}
                      </button>
                    )}

                    {/* PowerClip Section */}
                    {pcm && (
                      <>
                        {isPowerClipEditing && (
                          <button 
                            onClick={() => { exitPowerClipEdit(); setContextMenu(null); }}
                            className="w-full px-2 py-1 text-left text-[11px] font-medium text-blue-400 hover:text-white hover:bg-blue-600 flex items-center gap-2 transition-colors"
                          >
                            <LogOut size={12} /> {t('editor.powerclip.finish_edit', 'Finalizar Edição')}
                          </button>
                        )}

                        {activeObject && (activeObject as any)._pcProxy && !isPowerClipEditing && (
                          <>
                            <button 
                              onClick={() => { enterPowerClipEditMode(activeObject); setContextMenu(null); }}
                              className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center gap-2 transition-colors"
                            >
                              <Edit3 size={12} className="text-zinc-400" /> {t('editor.powerclip.edit_contents', 'Editar Conteúdo')}
                            </button>
                            <button 
                              onClick={() => { extractPowerClip(activeObject); setContextMenu(null); }}
                              className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center gap-2 transition-colors"
                            >
                              <Scissors size={12} className="text-zinc-400" /> {t('editor.powerclip.extract_contents', 'Extrair Conteúdo')}
                            </button>
                          </>
                        )}

                        {activeObject && !(activeObject as any)._pcProxy && !(activeObject as any)._pcContent && !(activeObject as any)._pcContainer && (
                          <button 
                            onClick={() => { handlePowerClip(); setContextMenu(null); }}
                            className="w-full px-2 py-1 text-left text-[11px] font-medium text-zinc-200 hover:text-white hover:bg-blue-600 flex items-center gap-2 transition-colors"
                          >
                            <Scissors size={12} className="text-zinc-400" /> {t('editor.powerclip.place_inside', 'PowerClip')}
                          </button>
                        )}
                        <div className="h-px bg-zinc-800/50 my-1" />
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Outline Mode Indicator */}
            {isOutlineMode && (
              <div className="absolute bottom-4 right-4 bg-blue-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-xl z-50 border border-blue-400/30 animate-pulse pointer-events-none">
                <Eye size={14} />
                <span className="text-[10px] font-black tracking-widest">{t('editor.header.outline_mode_active', 'Modo contorno ativo')}</span>
              </div>
            )}
            
            {isRemovingBg && activeObject && (
              <motion.div 
                drag
                dragMomentum={false}
                initial={{ x: '-50%', y: '-50%', left: '50%', top: '50%' }}
                className="absolute z-50 flex flex-col items-center gap-2 cursor-move"
              >
                <div className="bg-[#1a1a1a] backdrop-blur-2xl p-4 rounded-2xl border border-zinc-800/50 flex flex-col items-center gap-4 shadow-[0_20px_80px_rgba(0,0,0,0.8)] min-w-[280px] max-w-[360px]">
                  
                  {bgRemovalProgress < 100 ? (
                    <div className="w-full space-y-4 flex flex-col items-center">
                      <h3 className="text-[14px] font-medium text-white text-center">
                        {t('editor.tools.removing_bg_wait', 'Aguarde, estamos removendo o fundo da sua imagem')}
                      </h3>
                      
                      <div className="w-full space-y-2">
                        <div className="flex justify-end">
                          <span className="text-[12px] font-semibold text-blue-500">
                            {bgRemovalProgress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${bgRemovalProgress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setIsRemovingBg(false);
                          isRemovingBgRef.current = false;
                        }}
                        className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[13px] font-semibold rounded-lg transition-all"
                      >
                        {t('common.cancel', 'Cancelar')}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-4 flex flex-col items-center">
                      <h3 className="text-[18px] font-bold text-white text-center">
                        {t('editor.tools.cutout_finished', 'Recorte Concluído!')}
                      </h3>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-4 pt-4 border-t border-zinc-800/50"
                      >
                        <div className="flex justify-between items-center">
                          <label className="text-[12px] text-zinc-200 font-medium flex items-center gap-2">
                            <Sliders size={14} className="text-blue-500" /> {t('editor.tools.edge_refinement', 'Ajuste fino de bordas')}
                          </label>
                          <span className="text-[12px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-lg">
                            {refinement}%
                          </span>
                        </div>
                        
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={refinement} 
                          onChange={(e) => setRefinement(parseInt(e.target.value))}
                          className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                        />
                        
                        <div className="flex justify-between text-[10px] text-zinc-500 font-normal px-1">
                          <span>{t('editor.tools.hard_edges', 'Bordas duras')}</span>
                          <span>{t('editor.tools.balanced', 'Equilibrado')}</span>
                          <span>{t('editor.tools.soft_edges', 'Bordas suaves')}</span>
                        </div>

                        <button 
                          onClick={() => setIsRemovingBg(false)}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold rounded-lg transition-all"
                        >
                          {t('editor.tools.finish_and_complete', 'Finalizar e concluir')}
                        </button>
                      </motion.div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {showNewDocModal && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-transparent"
                  onClick={() => setShowNewDocModal(false)}
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-[95%] sm:w-[90%] lg:w-[75%] max-w-3xl bg-[#191919] border border-zinc-800 rounded-[12px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"
                >
                  <div className="p-2 sm:p-3 lg:p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                        <PenTool size={14} className="text-white sm:size-[16px] lg:size-[18px]" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base lg:text-lg font-bold leading-tight">{t('modals.new_doc.title', 'New Document')}</h2>
                        <p className="text-[8px] sm:text-[10px] lg:text-xs text-zinc-500">{t('modals.new_doc.subtitle', 'Choose a preset or define a custom size')}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowNewDocModal(false)} className="p-1 sm:p-2 hover:bg-zinc-800 rounded-full transition-colors">
                      <X size={16} className="sm:size-4 lg:size-5" />
                    </button>
                  </div>

                  {/* Blind Mode Toggle in Modal */}
                  <div className="px-4 sm:px-5 lg:px-6 py-2 sm:py-3 bg-blue-600/5 border-b border-blue-500/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                      <Accessibility size={16} className="text-blue-500 sm:size-5 lg:size-6" />
                      <div>
                        <p className="text-[9px] sm:text-[11px] lg:text-xs font-bold text-white">{t('a11y.blindMode.label')}</p>
                        {blindMode && <p className="text-[7px] sm:text-[9px] lg:text-[10px] text-blue-400">{t('a11y.blindMode.hint')}</p>}
                      </div>
                    </div>
                    <button 
                      onClick={() => setBlindMode(!blindMode)}
                      className={cn(
                        "relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900",
                        blindMode ? "bg-blue-600" : "bg-zinc-700"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform",
                        blindMode ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex-grow overflow-y-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 custom-scrollbar">
                    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                      <h3 className="text-[9px] lg:text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{t('modals.new_doc.custom', 'Personalizado')}</h3>
                      <div className="space-y-2 sm:space-y-2.5 lg:space-y-3">
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-3">
                          <div className="space-y-1 lg:space-y-1">
                            <label className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-zinc-400">{t('modals.new_doc.width', 'Width')}</label>
                            <input 
                              type="number" 
                              value={newDocUnit === 'px' ? Math.round(newDocWidth) : parseFloat(newDocWidth.toFixed(2))} 
                              onChange={(e) => setNewDocWidth(parseFloat(e.target.value) || 0)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg lg:rounded-xl px-2 sm:px-3 lg:px-3 py-1.5 sm:py-2 lg:py-2 text-[11px] sm:text-xs lg:text-sm focus:border-blue-500 outline-none transition-colors" 
                            />
                          </div>
                          <div className="space-y-1 lg:space-y-1">
                            <label className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-zinc-400">{t('modals.new_doc.height', 'Altura')}</label>
                            <input 
                              type="number" 
                              value={newDocUnit === 'px' ? Math.round(newDocWidth) : parseFloat(newDocHeight.toFixed(2))} 
                              onChange={(e) => setNewDocHeight(parseFloat(e.target.value) || 0)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg lg:rounded-xl px-2 sm:px-3 lg:px-3 py-1.5 sm:py-2 lg:py-2 text-[11px] sm:text-xs lg:text-sm focus:border-blue-500 outline-none transition-colors" 
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                          <div className="space-y-1 lg:space-y-1.5">
                            <label className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-zinc-400">{t('modals.new_doc.unit', 'Unit')}</label>
                            <select 
                              value={newDocUnit}
                              onChange={(e) => handleNewDocUnitChange(e.target.value as any)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg lg:rounded-xl px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-[11px] sm:text-xs lg:text-sm focus:border-blue-500 outline-none transition-colors"
                            >
                              {UNITS.filter(u => u.id !== 'percent').map(u => (
                                <option key={u.id} value={u.id}>{t(u.label)}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1 lg:space-y-1.5">
                            <label className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-zinc-400">{t('modals.new_doc.pages', 'Pages')}</label>
                            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg lg:rounded-xl px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1">
                              <input 
                                type="number" 
                                value={newDocPages}
                                onChange={(e) => setNewDocPages(parseInt(e.target.value) || 1)}
                                min={1}
                                className="w-full bg-transparent py-1 lg:py-1.5 text-[11px] sm:text-xs lg:text-sm outline-none" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-1 sm:pt-1.5 lg:pt-3 space-y-2 sm:space-y-2.5 lg:space-y-3">
                          <button 
                            onClick={() => {
                              const unitFactor = UNITS.find(u => u.id === newDocUnit)?.factor || 1;
                              const wPx = Math.round(newDocWidth * unitFactor);
                              const hPx = Math.round(newDocHeight * unitFactor);
                              
                              handleNewDoc(wPx, hPx, newDocPages);
                              setUnit(newDocUnit as any);
                            }}
                            className="w-full py-2.5 sm:py-3 lg:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm lg:text-base rounded-lg transition-all active:scale-[0.98]"
                          >
                            {t('modals.new_doc.create_action', 'Create Document')}
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2 lg:gap-3 mt-2 sm:mt-0">
                            <button 
                              onClick={() => {
                                setShowNewDocModal(false);
                                fileInputRef.current?.click();
                              }}
                              className="w-full py-3.5 sm:py-2.5 lg:py-3 bg-transparent border border-zinc-700 hover:border-white text-white text-[11px] sm:text-[10px] lg:text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 lg:gap-2"
                            >
                              <img src="https://moscatee.com/img/pdf.webp" alt="PDF" className="w-4.5 h-4.5 sm:w-3.5 sm:h-3.5 lg:w-4.5 lg:h-4.5 object-contain" referrerPolicy="no-referrer" />
                              {t('modals.new_doc.presets.open_pdf', 'Open PDF')}
                            </button>
                            <button 
                              onClick={() => {
                                setShowNewDocModal(false);
                                fileInputRef.current?.click();
                              }}
                              className="w-full py-3.5 sm:py-2.5 lg:py-3 bg-transparent border border-zinc-700 hover:border-white text-white text-[11px] sm:text-[10px] lg:text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 lg:gap-2"
                            >
                              <img src="https://moscatee.com/img/ps.webp" alt="PSD" className="w-4.5 h-4.5 sm:w-3.5 sm:h-3.5 lg:w-4.5 lg:h-4.5 object-contain" referrerPolicy="no-referrer" />
                              {t('modals.new_doc.presets.open_psd', 'Open PSD')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-3 sm:space-y-5 lg:space-y-6">
                      <h3 className="text-[9px] lg:text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{t('modals.new_doc.popular_presets', 'Popular Presets')}</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                        <PresetCard 
                          icon={Instagram} 
                          name={t('modals.new_doc.presets.instagram_post', 'Instagram Post')} 
                          size={formatPresetSize(1080, 1350)} 
                          onClick={() => {
                            const factor = UNITS.find(u => u.id === newDocUnit)?.factor || 1;
                            setNewDocWidth(1080 / factor);
                            setNewDocHeight(1350 / factor);
                            setNewDocPages(1);
                            setIsPulsingPages(true);
                          }} 
                        />
                        <PresetCard 
                          icon={Smartphone} 
                          name={t('modals.new_doc.presets.instagram_story', 'Instagram Story')} 
                          size={formatPresetSize(1080, 1920)} 
                          onClick={() => {
                            const factor = UNITS.find(u => u.id === newDocUnit)?.factor || 1;
                            setNewDocWidth(1080 / factor);
                            setNewDocHeight(1920 / factor);
                            setNewDocPages(1);
                            setIsPulsingPages(true);
                          }} 
                        />
                        <PresetCard 
                          icon={Youtube} 
                          name={t('modals.new_doc.presets.youtube_thumb', 'YouTube Thumb')} 
                          size={formatPresetSize(1280, 720)} 
                          onClick={() => {
                            const factor = UNITS.find(u => u.id === newDocUnit)?.factor || 1;
                            setNewDocWidth(1280 / factor);
                            setNewDocHeight(720 / factor);
                            setNewDocPages(1);
                            setIsPulsingPages(true);
                          }} 
                        />
                        <PresetCard 
                          icon={Linkedin} 
                          name={t('modals.new_doc.presets.linkedin_banner', 'LinkedIn Banner')} 
                          size={formatPresetSize(1584, 396)} 
                          onClick={() => {
                            const factor = UNITS.find(u => u.id === newDocUnit)?.factor || 1;
                            setNewDocWidth(1584 / factor);
                            setNewDocHeight(396 / factor);
                            setNewDocPages(1);
                            setIsPulsingPages(true);
                          }} 
                        />
                        <PresetCard 
                          icon={Monitor} 
                          name={t('modals.new_doc.presets.full_hd', 'Full HD')} 
                          size={formatPresetSize(1920, 1080)} 
                          onClick={() => {
                            const factor = UNITS.find(u => u.id === newDocUnit)?.factor || 1;
                            setNewDocWidth(1920 / factor);
                            setNewDocHeight(1080 / factor);
                            setNewDocPages(1);
                            setIsPulsingPages(true);
                          }} 
                        />
                        <PresetCard 
                          icon={Printer} 
                          name={t('modals.new_doc.presets.a4_paper', 'A4 Paper')} 
                          size={formatPresetSize(2480, 3508)} 
                          onClick={() => {
                            const factor = UNITS.find(u => u.id === newDocUnit)?.factor || 1;
                            setNewDocWidth(2480 / factor);
                            setNewDocHeight(3508 / factor);
                            setNewDocPages(1);
                            setIsPulsingPages(true);
                          }} 
                        />
                      </div>
                    </div>

                    {canInstallPWA && (
                      <div className="md:col-span-3 p-2 sm:p-3 bg-blue-600/10 border border-blue-600/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-2">
                        <div className="flex items-center gap-2 sm:gap-3 text-center sm:text-left">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                            <Download size={16} className="sm:size-[20px]" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">{t('modals.pwa.title', 'Instale o Mosca Tee')}</h4>
                            <p className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5">{t('modals.pwa.description', 'Tenha uma experiência mais rápida e profissional direto no seu desktop.')}</p>
                          </div>
                        </div>
                        <button 
                          onClick={handleInstallPWA}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] sm:text-xs rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-2"
                        >
                          {t('modals.pwa.install_action', 'Instalar agora')}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </main>

        {/* Right Panel */}
        <aside id="properties-panel" className="w-[320px] shrink-0 border-l border-zinc-800 flex flex-col bg-[#191919] z-40 h-full overflow-hidden">
          <div className="flex border-b border-zinc-800">
            {[
              { id: 'layers', icon: Layers, label: t('editor.panels.layers', 'Camadas') },
              { id: 'color', icon: Palette, label: t('editor.panels.color', 'Cor') },
              { id: 'text', icon: Type, label: t('editor.panels.text', 'Texto'), condition: activeObject?.type === 'i-text' },
              { id: 'transform', icon: Settings, label: t('editor.panels.transform', 'Ajustes') },
              { id: 'history', icon: History, label: t('editor.panels.history', 'Histórico') },
              { id: 'assets', icon: Library, label: t('editor.panels.assets', 'Biblioteca') }
            ].filter(tab => !tab.condition || tab.condition).map(tab => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'assets') {
                    const currentResults = searchType === 'pexels' ? pexelsResults : iconifyResults;
                    if (currentResults.length === 0) {
                      if (searchType === 'pexels') searchPexels(DEFAULT_IMAGE_QUERY);
                      else if (searchType === 'iconify') searchIconify(DEFAULT_ICON_QUERY);
                    }
                  }
                }}
                className={cn(
                  "flex-grow py-3 flex flex-col items-center gap-1 transition-all", 
                  activeTab === tab.id ? "text-blue-500 border-b-2 border-blue-500 bg-blue-500/5" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <tab.icon size={14} />
                <span className="text-[9px] font-bold tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar">
            {activeTab === 'layers' && (
              <div id="layers-panel" className="flex flex-col h-full overflow-hidden">
                <div className="p-4 space-y-2 overflow-y-auto custom-scrollbar flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.layers_list', 'Lista de camadas')}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveLayer('up')} className="p-1 hover:bg-zinc-800 rounded-md" title={t('editor.tools.bring_to_front', 'Trazer para frente')}><ChevronRight size={14} className="-rotate-90" /></button>
                      <button onClick={() => moveLayer('down')} className="p-1 hover:bg-zinc-800 rounded-md" title="Enviar para trás"><ChevronRight size={14} className="rotate-90" /></button>
                      <button onClick={addWhiteBackground} className="p-1 hover:bg-zinc-800 rounded-md" title="Adicionar fundo branco"><Plus size={14} /></button>
                      <button onClick={deleteActive} className="p-1 hover:bg-zinc-800 rounded-md text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={layers.map(l => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {layers.map((layer) => (
                        <SortableLayerItem 
                          key={layer.id}
                          layer={layer}
                          activeObject={activeObject}
                          canvas={canvas}
                          toggleVisibility={toggleVisibility}
                          toggleLock={toggleLock}
                          onRename={renameLayer}
                          isEditing={editingLayerId === layer.id}
                          onStartEditing={(id: string) => setEditingLayerId(id)}
                          onCancelEditing={() => setEditingLayerId(null)}
                          isSelected={selectedLayerIds.includes(layer.id)}
                          onClick={handleLayerClick}
                          onOpenStyles={handleOpenStyles}
                          onConvertToSmartObject={convertToSmartObject}
                          onEditSmartObject={editSmartObject}
                          onResetSmartObject={resetSmartObject}
                          enterPowerClipEditMode={enterPowerClipEditMode}
                          extractPowerClip={extractPowerClip}
                          onToggleExpansion={toggleGroupExpansion}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryPanel 
                key="history-panel-full"
                history={historyState.history}
                currentIndex={historyState.index}
                goToHistoryIndex={goToHistoryIndex}
                clearHistory={clearHistory}
              />
            )}

            {activeTab === 'text' && (activeObject?.type === 'i-text' || (activeObject as any)?.isTextOnPath) && (
              <div className="p-4 space-y-6">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.typography', 'Tipografia')}</span>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] text-zinc-500">{t('editor.panels.font', 'Fonte')}</label>
                        <button 
                          onClick={() => fontInputRef.current?.click()}
                          className="text-[9px] font-bold text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Plus size={10} /> {t('editor.panels.import', 'Importar')}
                        </button>
                      </div>
                      <select 
                        value={activeObject.get('fontFamily')} 
                        onChange={(e) => {
                          if (e.target.value === 'IMPORT_CTA') {
                            fontInputRef.current?.click();
                          } else {
                            updateActiveObject('fontFamily', e.target.value);
                          }
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs"
                      >
                        {fonts.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                        <option value="IMPORT_CTA" className="text-blue-500 font-bold bg-blue-500/10">
                          {t('editor.panels.import_font_option', '+ Importar fonte')}
                        </option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-zinc-500">{t('editor.panels.font_weight', 'Peso da fonte')}</label>
                      <select 
                        value={activeObject.fontWeight || 'normal'} 
                        onChange={(e) => updateActiveObject('fontWeight', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs"
                      >
                        <option value="100">100 - {t('editor.panels.thin', 'Thin')}</option>
                        <option value="200">200 - {t('editor.panels.extra_light', 'Extra Light')}</option>
                        <option value="300">300 - {t('editor.panels.light', 'Light')}</option>
                        <option value="normal">400 - {t('editor.panels.regular', 'Regular')}</option>
                        <option value="500">500 - {t('editor.panels.medium', 'Medium')}</option>
                        <option value="600">600 - {t('editor.panels.semi_bold', 'Semi Bold')}</option>
                        <option value="bold">700 - {t('editor.panels.bold', 'Bold')}</option>
                        <option value="800">800 - {t('editor.panels.extra_bold', 'Extra Bold')}</option>
                        <option value="900">900 - {t('editor.panels.black', 'Black')}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] text-zinc-500">{t('editor.panels.color', 'Cor')}</label>
                        <ColorPicker 
                          color={typeof activeObject.fill === 'string' ? activeObject.fill : '#000000'} 
                          onChange={(color) => updateActiveObject('fill', color)}
                          variant="square"
                          side="bottom"
                        />
                      </div>
                    </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => toggleTextProperty('fontStyle')}
                          className={cn("p-2 rounded-md border border-zinc-800 flex items-center justify-center gap-2 text-[10px] font-bold", activeObject.fontStyle === 'italic' && "bg-blue-600 border-blue-600")}
                        >
                          <Italic size={14} /> {t('editor.panels.italic', 'Itálico')}
                        </button>
                        <button 
                          onClick={() => toggleTextProperty('underline')}
                          className={cn("p-2 rounded-md border border-zinc-800 flex items-center justify-center gap-2 text-[10px] font-bold", activeObject.underline && "bg-blue-600 border-blue-600")}
                        >
                          <Underline size={14} /> {t('editor.panels.underline', 'Sublinhado')}
                        </button>
                      </div>
                      
                      {(activeObject as any).isTextOnPath && (
                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between">
                            <label className="text-[9px] text-zinc-500">{t('editor.panels.path_alignment', 'Alinhamento no Caminho')}</label>
                            <span className="text-[9px] font-bold text-blue-500">{topOptions.offset}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="-100" max="100" 
                            value={topOptions.offset} 
                            onChange={(e) => updateActiveObject('offset', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                          />
                        </div>
                      )}
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.alignment', 'Alinhamento')}</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => {
                        if (activeObject?.type?.includes('text')) {
                          updateActiveObject('textAlign', 'left');
                        }
                      }}
                      className={cn("p-2 rounded-md border border-zinc-800 flex items-center justify-center", activeObject.textAlign === 'left' && "bg-blue-600 border-blue-600")}
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        if (activeObject?.type?.includes('text')) {
                          updateActiveObject('textAlign', 'center');
                        }
                      }}
                      className={cn("p-2 rounded-md border border-zinc-800 flex items-center justify-center", activeObject.textAlign === 'center' && "bg-blue-600 border-blue-600")}
                    >
                      <AlignCenter size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        if (activeObject?.type?.includes('text')) {
                          updateActiveObject('textAlign', 'right');
                        }
                      }}
                      className={cn("p-2 rounded-md border border-zinc-800 flex items-center justify-center", activeObject.textAlign === 'right' && "bg-blue-600 border-blue-600")}
                    >
                      <AlignRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.size_spacing', 'Tamanho e espaçamento')}</span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] text-zinc-500">{t('editor.panels.font_size', 'Tamanho da fonte')}</label>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => updateActiveObject('fontSize', Math.max(1, (activeObject.fontSize || 40) - 1))}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                        >
                          <Minus size={10} />
                        </button>
                        <input 
                          type="number"
                          value={Math.round(activeObject.fontSize || 40)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) updateActiveObject('fontSize', val);
                          }}
                          className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button 
                          onClick={() => updateActiveObject('fontSize', (activeObject.fontSize || 40) + 1)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                        >
                          <Plus size={10} />
                        </button>
                        <span className="text-[9px] font-bold text-zinc-500 ml-1">px</span>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="8" max="200" 
                      value={activeObject.fontSize} 
                      onChange={(e) => updateActiveObject('fontSize', parseInt(e.target.value))}
                      className="w-full accent-blue-500" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-[9px] text-zinc-500">{t('editor.panels.tracking', 'Espaçamento (Tracking/Kerning)')}</label>
                      <span className="text-[9px] font-bold">{activeObject.charSpacing}</span>
                    </div>
                    <input 
                      type="range" 
                      min="-100" max="1000" 
                      value={activeObject.charSpacing} 
                      onChange={(e) => updateActiveObject('charSpacing', parseInt(e.target.value))}
                      className="w-full accent-blue-500" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[9px] text-zinc-500">{t('editor.panels.leading', 'Leading (Entrelinhas)')}</label>
                        <span className="text-[9px] font-bold">{activeObject.lineHeight?.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" max="5" step="0.1"
                        value={activeObject.lineHeight} 
                        onChange={(e) => updateActiveObject('lineHeight', parseFloat(e.target.value))}
                        className="w-full accent-blue-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[9px] text-zinc-500">{t('editor.panels.baseline_shift', 'Baseline Shift')}</label>
                        <span className="text-[9px] font-bold">{activeObject.deltaY || 0}</span>
                      </div>
                      <input 
                        type="range" 
                        min="-50" max="50" 
                        value={activeObject.deltaY || 0} 
                        onChange={(e) => updateActiveObject('deltaY', parseInt(e.target.value))}
                        className="w-full accent-blue-500" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.transform_style', 'Transformação e Estilo')}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={toggleTextTransform}
                      className="p-2 bg-zinc-900 border border-zinc-800 rounded-md flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-zinc-800"
                    >
                      <CaseUpper size={14} /> {t('editor.panels.uppercase', 'Maiúsculas')}
                    </button>
                    <button 
                      onClick={() => {
                        const currentV = activeObject.get('_originalStrokeWidth') || (activeObject.strokeWidth ? activeObject.strokeWidth / 2 : 0);
                        updateActiveObject('strokeWidth', currentV > 0 ? 0 : 2);
                      }}
                      className={cn("p-2 bg-zinc-900 border border-zinc-800 rounded-md flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-zinc-800", (activeObject.get('_originalStrokeWidth') !== undefined ? activeObject.get('_originalStrokeWidth') : (activeObject.strokeWidth / 2)) > 0 && "text-blue-500 border-blue-500")}
                    >
                      <Scissors size={14} /> {t('editor.panels.outline', 'Contorno')}
                    </button>
                  </div>
                  {(activeObject.get('_originalStrokeWidth') !== undefined || activeObject.strokeWidth !== undefined) && (
                    <div className="space-y-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] text-zinc-500">{t('editor.panels.outline_width', 'Largura do contorno')}</label>
                        <input 
                          type="number" 
                          min="0"
                          max="200"
                          value={activeObject.get('_originalStrokeWidth') !== undefined ? activeObject.get('_originalStrokeWidth') : (activeObject.strokeWidth / 2) || 0}
                          onChange={(e) => updateActiveObject('strokeWidth', parseFloat(e.target.value))}
                          className="w-12 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[10px]"
                        />
                      </div>
                      <input 
                        type="range" min="0" max="200" step="0.5"
                        value={activeObject.get('_originalStrokeWidth') !== undefined ? activeObject.get('_originalStrokeWidth') : (activeObject.strokeWidth / 2) || 0}
                        onChange={(e) => updateActiveObject('strokeWidth', parseFloat(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-[9px] text-zinc-500">{t('editor.panels.outline_color', 'Cor do contorno')}</label>
                        <ColorPicker 
                          color={activeObject.stroke || '#000000'} 
                          onChange={(color) => updateActiveObject('stroke', color)}
                          variant="square"
                          side="top"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        if (activeObject.shadow) updateActiveObject('shadow', null);
                        else updateTextShadow('rgba(0,0,0,0.5)', 10, 5, 5);
                      }}
                      className={cn("w-full p-2 bg-zinc-900 border border-zinc-800 rounded-md flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-zinc-800", activeObject.shadow && "text-blue-500 border-blue-500")}
                    >
                      <MaskIcon size={14} /> {t('editor.panels.drop_shadow', 'Sombra Projetada')}
                    </button>
                    {activeObject.shadow && (
                      <div className="space-y-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] text-zinc-500">{t('editor.panels.blur', 'Desfoque')}</label>
                          <input 
                            type="range" min="0" max="50"
                            value={activeObject.shadow.blur}
                            onChange={(e) => updateTextShadow(activeObject.shadow.color, parseInt(e.target.value), activeObject.shadow.offsetX, activeObject.shadow.offsetY)}
                            className="w-2/3 accent-blue-500"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] text-zinc-500">{t('editor.panels.offset_x', 'Deslocamento X')}</label>
                          <input 
                            type="range" min="-50" max="50"
                            value={activeObject.shadow.offsetX}
                            onChange={(e) => updateTextShadow(activeObject.shadow.color, activeObject.shadow.blur, parseInt(e.target.value), activeObject.shadow.offsetY)}
                            className="w-2/3 accent-blue-500"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] text-zinc-500">{t('editor.panels.offset_y', 'Deslocamento Y')}</label>
                          <input 
                            type="range" min="-50" max="50"
                            value={activeObject.shadow.offsetY}
                            onChange={(e) => updateTextShadow(activeObject.shadow.color, activeObject.shadow.blur, activeObject.shadow.offsetX, parseInt(e.target.value))}
                            className="w-2/3 accent-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] text-zinc-500">{t('editor.panels.shadow_color', 'Cor da sombra')}</label>
                          <ColorPicker 
                            color={activeObject.shadow.color} 
                            onChange={(color) => updateTextShadow(color, activeObject.shadow.blur, activeObject.shadow.offsetX, activeObject.shadow.offsetY)}
                            variant="square"
                            side="top"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'color' && (
              <div className="p-4 space-y-6">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-500">
                    {activeObject ? t('editor.panels.object_color', 'Cor do objeto') : t('editor.panels.background_color', 'Cor do fundo')}
                  </span>
                  <div className="flex items-center gap-4">
                    <ColorPicker 
                      color={(() => {
                        if (activeObject) return typeof activeObject.fill === 'string' ? activeObject.fill : '#000000';
                        const artboard = canvas?.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
                        if (artboard) return typeof artboard.fill === 'string' ? artboard.fill : '#ffffff';
                        return '#ffffff';
                      })()} 
                      onChange={(color) => {
                        if (activeObject) {
                          updateActiveObject('fill', color);
                        } else if (canvas) {
                          const artboard = canvas.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
                          if (artboard) {
                            artboard.set('fill', color);
                            canvas.renderAll();
                            saveToHistory(canvas);
                          }
                        }
                      }}
                      variant="square"
                      side="bottom"
                    />
                    <div className="flex-grow space-y-1">
                      <div className="text-[9px] text-zinc-500">{t('editor.panels.hexadecimal', 'HEX')}</div>
                      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs font-mono text-zinc-300">
                        {(() => {
                          if (activeObject) return typeof activeObject.fill === 'string' ? activeObject.fill : '#000000';
                          const artboard = canvas?.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
                          if (artboard) return typeof artboard.fill === 'string' ? artboard.fill : '#ffffff';
                          return '#ffffff';
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.suggested_palette', 'Paleta sugerida')}</span>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      '#2563EB', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
                      '#000000', '#FFFFFF', '#333333', '#666666', '#999999', '#CCCCCC'
                    ].map(c => {
                      const colorName = getColorName(c, i18n.language.startsWith('pt') ? 'pt' : 'en');
                      return (
                        <button 
                          key={c} 
                          className="w-full aspect-square rounded-md border border-zinc-800 hover:scale-110 transition-transform focus:ring-2 focus:ring-blue-500 outline-none" 
                          style={{ backgroundColor: c }}
                          aria-label={colorName}
                          onClick={() => {
                            if (activeObject) {
                              updateActiveObject('fill', c);
                            } else if (canvas) {
                              const artboard = canvas.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
                              if (artboard) {
                                artboard.set('fill', c);
                                canvas.renderAll();
                                saveToHistory(canvas);
                                // Announce for artboard only here
                                announce(colorName);
                              }
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.glass_effects', 'Efeitos de Vidro')}</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {GLASS_PRESETS.map((p, idx) => (
                      <button 
                        key={idx} 
                        className="w-full aspect-square rounded-md border border-zinc-800 hover:scale-110 transition-transform flex items-center justify-center relative overflow-hidden" 
                        style={{ backgroundColor: p.fill }}
                        onClick={() => applyGlassEffect(p)}
                        title={p.name}
                      >
                        <div className="absolute inset-0 border border-white/20 rounded-md" />
                        <span className="text-[8px] text-white/50 font-bold">{p.name[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.gradients', 'Degradês')}</span>
                  <div className="grid grid-cols-6 gap-2">
                    {GRADIENTS.map((g, idx) => (
                      <button 
                        key={idx} 
                        className="w-full aspect-square rounded-md border border-zinc-800 hover:scale-110 transition-transform" 
                        style={{ background: `linear-gradient(to bottom right, ${g.colors[0]}, ${g.colors[1]})` }}
                        onClick={() => applyGradient(g.colors)}
                      />
                    ))}
                  </div>
                </div>

                {activeObject?.fill instanceof fabric.Gradient && (
                  <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.edit_gradient', 'Editar Degradê')}</span>
                    </div>
                    
                    {/* Gradient Type and Angle */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">{t('editor.panels.type', 'Tipo')}</label>
                        <div className="flex bg-zinc-900 rounded p-0.5 border border-zinc-800">
                          <button 
                            onClick={() => updateGradientType('linear')}
                            className={cn("flex-grow py-1 text-[9px] font-bold rounded transition-all", activeObject.fill.type === 'linear' ? "bg-zinc-800 text-blue-500" : "text-zinc-500")}
                          >
                            Linear
                          </button>
                          <button 
                            onClick={() => updateGradientType('radial')}
                            className={cn("flex-grow py-1 text-[9px] font-bold rounded transition-all", activeObject.fill.type === 'radial' ? "bg-zinc-800 text-blue-500" : "text-zinc-500")}
                          >
                            Radial
                          </button>
                        </div>
                      </div>
                      {activeObject.fill.type === 'linear' && (
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-500">{t('editor.panels.angle', 'Ângulo')} (°)</label>
                          <input 
                            type="number"
                            value={gradientAngle}
                            onChange={(e) => updateGradientAngle(parseInt(e.target.value) || 0)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {activeObject.fill.colorStops.map((stop: any, idx: number) => (
                        <div key={idx} className="space-y-1 relative group">
                          <div className="flex justify-between items-center pr-1">
                            {activeObject.fill.colorStops.length > 2 && (
                              <button 
                                onClick={() => removeGradientColor(idx)}
                                className="absolute -top-1 -right-1 z-10 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <Minus size={8} />
                              </button>
                            )}
                          </div>
                          <ColorPicker 
                            color={stop.color} 
                            onChange={(color) => updateGradientColor(idx, color)}
                            variant="square"
                            side="top"
                          />
                        </div>
                      ))}
                      <button 
                        onClick={addGradientColor}
                        className="w-10 h-10 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg text-zinc-600 hover:text-blue-500 hover:border-blue-500/50 transition-all"
                        title={t('editor.panels.add_color', 'Adicionar Cor')}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transform' && (
              <div className="p-4 space-y-6">
                {activeObject ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.position_size', 'Posição e tamanho')}</span>
                        <div className="relative group">
                          <button className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-white bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                            {t(UNITS.find(u => u.id === unit)?.label || '', unit) as string} <ChevronDown size={10} />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            {UNITS.map(u => (
                              <button 
                                key={u.id}
                                onClick={() => handleUnitChange(u.id as any)}
                                className={cn(
                                  "w-full text-left px-3 py-1.5 text-[10px] hover:bg-zinc-800 flex items-center justify-between",
                                  unit === u.id && "text-blue-500"
                                )}
                              >
                                {t(u.label, u.id) as string}
                                {unit === u.id && <Check size={10} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-500">X</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={formatValue(activeObject.left)} 
                              onChange={(e) => {
                                const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                                updateActiveObject('left', parseFloat(e.target.value) * factor);
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs pr-6" 
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase">{unit === 'percent' ? '%' : unit}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-500">Y</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={formatValue(activeObject.top)} 
                              onChange={(e) => {
                                const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                                updateActiveObject('top', parseFloat(e.target.value) * factor);
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs pr-6" 
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase">{unit === 'percent' ? '%' : unit}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-500">{t('editor.panels.width', 'Largura')}</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={formatValue(activeObject.width * activeObject.scaleX)} 
                              onChange={(e) => {
                                const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                                const val = parseFloat(e.target.value) * factor;
                                updateActiveObject('scaleX', val / activeObject.width);
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs pr-6" 
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase">{unit === 'percent' ? '%' : unit}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-500">{t('editor.panels.height', 'Altura')}</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={formatValue(activeObject.height * activeObject.scaleY)} 
                              onChange={(e) => {
                                const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                                const val = parseFloat(e.target.value) * factor;
                                updateActiveObject('scaleY', val / activeObject.height);
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs pr-6" 
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase">{unit === 'percent' ? '%' : unit}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {activeObject.type === 'activeSelection' && (
                      <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.pathfinder', 'Pathfinder')}</span>
                        <div className="grid grid-cols-4 gap-2">
                          <button 
                            onClick={() => handlePathfinder('union')}
                            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 flex flex-col items-center gap-1.5 transition-colors"
                            title={t('editor.pathfinder.union', 'Unir')}
                          >
                            <Ungroup size={16} className="text-zinc-400" />
                            <span className="text-[7px] font-bold uppercase tracking-widest">{t('editor.pathfinder.union_short', 'Unir')}</span>
                          </button>
                          <button 
                            onClick={() => handlePathfinder('subtract')}
                            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 flex flex-col items-center gap-1.5 transition-colors"
                            title={t('editor.pathfinder.subtract', 'Subtrair')}
                          >
                            <Minus size={16} className="text-zinc-400" />
                            <span className="text-[7px] font-bold uppercase tracking-widest">{t('editor.pathfinder.subtract_short', 'Subtrair')}</span>
                          </button>
                          <button 
                            onClick={() => handlePathfinder('intersect')}
                            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 flex flex-col items-center gap-1.5 transition-colors"
                            title={t('editor.pathfinder.intersect', 'Interseção')}
                          >
                            <BoxSelect size={16} className="text-zinc-400" />
                            <span className="text-[7px] font-bold uppercase tracking-widest">{t('editor.pathfinder.intersect_short', 'Inter')}</span>
                          </button>
                          <button 
                            onClick={() => handlePathfinder('exclude')}
                            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 flex flex-col items-center gap-1.5 transition-colors"
                            title={t('editor.pathfinder.exclude', 'Exclusão')}
                          >
                            <X size={16} className="text-zinc-400" />
                            <span className="text-[7px] font-bold uppercase tracking-widest">{t('editor.pathfinder.exclude_short', 'Excluir')}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {activeObject.type === 'image' && (
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.filters', 'Filtros')}</span>
                        <div className="grid grid-cols-3 gap-2">
                          {IMAGE_FILTERS.map(filter => (
                            <button 
                              key={filter.id}
                              onClick={() => applyImageFilter(filter.id)}
                              className="px-1 py-2 bg-zinc-900 border border-zinc-800 rounded text-[8px] font-bold hover:bg-zinc-800 transition-colors"
                            >
                              {t(filter.label)}
                            </button>
                          ))}
                        </div>

                        <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.image_tools', 'Ferramentas de imagem')}</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={handleRemoveBackground}
                            disabled={isRemovingBg}
                            className="px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold hover:bg-zinc-800 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Wand2 size={12} className={cn("text-blue-500")} /> 
                            {isRemovingBg ? `${t('editor.panels.removing', 'Removendo')} (${bgRemovalProgress}%)` : t('editor.panels.remove_bg', 'Remover fundo')}
                          </button>

                          <button 
                            onClick={async () => {
                              if (!activeObject || activeObject.type !== 'image') return;
                              setIsProcessing(true);
                              showToast(t('editor.messages.detecting_subject'), 'info');
                              try {
                                const dataURL = activeObject.toDataURL();
                                const blob = await (await fetch(dataURL)).blob();
                                const { removeBackground } = await import('@imgly/background-removal');
                                const resultBlob = await removeBackground(blob, {
                                  publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/browser/',
                                });
                                const url = URL.createObjectURL(resultBlob);
                                fabric.Image.fromURL(url, (newImg) => {
                                  newImg.set({
                                    left: activeObject.left,
                                    top: activeObject.top,
                                    scaleX: activeObject.scaleX,
                                    scaleY: activeObject.scaleY,
                                    angle: activeObject.angle,
                                    name: activeObject.name || t('editor.panels.subject', 'Sujeito'),
                                    objectCaching: true,
                                  });
                                  canvas?.remove(activeObject);
                                  canvas?.add(newImg);
                                  canvas?.setActiveObject(newImg);
                                  newImg.set('dirty', true);
                                  newImg.setCoords();
                                  canvas?.renderAll();
                                  saveToHistory(canvas!);
                                  showToast(t('editor.messages.subject_selected'), 'success');
                                  URL.revokeObjectURL(url);
                                });
                              } catch (e) {
                                showToast(t('editor.messages.subject_detection_error'), 'error');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            className="px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold hover:bg-zinc-800 flex items-center justify-center gap-2"
                          >
                            <Sparkles size={12} className="text-purple-500" /> {t('editor.panels.select_subject', 'Selecionar sujeito')}
                          </button>
                          
                          <button 
                            onClick={handleVectorize}
                            className="px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold hover:bg-zinc-800 flex items-center justify-center gap-2"
                          >
                            <Zap size={12} className="text-emerald-500" /> {t('editor.panels.vectorize', 'Vetorizar')}
                          </button>

                          {(activeObject.isProcessed || activeObject.get('isProcessed')) && (
                            <div className="col-span-2 space-y-3 px-1 pt-2 border-t border-zinc-800/50 mt-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] text-zinc-400 font-bold flex items-center gap-1.5">
                                  <Sliders size={10} className="text-blue-500" /> {t('editor.panels.refinement', 'Ajuste fino (bordas)')}
                                </label>
                                <span className="text-[9px] font-mono text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">{refinement}%</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={refinement} 
                                onChange={(e) => setRefinement(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                              />
                              <div className="flex justify-between text-[7px] text-zinc-600 font-bold px-0.5">
                                <span>{t('editor.panels.harder', 'Mais duro')}</span>
                                <span>{t('editor.panels.default', 'Padrão')}</span>
                                <span>{t('editor.panels.softer', 'Mais suave')}</span>
                              </div>
                              <p className="text-[8px] text-zinc-600 leading-tight italic">
                                {t('editor.panels.refinement_hint', 'Use o slider para refinar as bordas da imagem após a remoção do fundo.')}
                              </p>
                            </div>
                          )}
                          
                          <button 
                            onClick={handleCompress}
                            className="px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold hover:bg-zinc-800 flex items-center justify-center gap-2"
                          >
                            <Minus size={12} className="text-amber-500" /> {t('editor.panels.compress', 'Comprimir')}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.appearance', 'Aparência')}</span>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-[9px] text-zinc-500">{t('editor.panels.opacity', 'Opacidade')}</label>
                          <span className="text-[9px] text-zinc-500">{Math.round(activeObject.opacity * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={activeObject.opacity * 100} 
                          onChange={(e) => updateActiveObject('opacity', parseFloat(e.target.value))}
                          className="w-full accent-blue-600" 
                        />
                      </div>
                      
                      <div className="space-y-1 pt-2">
                        <label className="text-[9px] text-zinc-500">{t('editor.panels.blend_mode', 'Modo de Mesclagem')}</label>
                        <select 
                          value={activeObject.globalCompositeOperation || 'source-over'} 
                          onChange={(e) => updateActiveObject('globalCompositeOperation', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs"
                        >
                          {BLEND_MODES.map(mode => (
                            <option key={mode.value} value={mode.value}>{t(`editor.constants.blend_modes.${mode.value}`, mode.label)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-[9px] text-zinc-500">{t('editor.panels.rotation', 'Rotação')}</label>
                          <span className="text-[9px] text-zinc-500">{Math.round(activeObject.angle)}°</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="360" 
                          value={activeObject.angle} 
                          onChange={(e) => updateActiveObject('angle', parseFloat(e.target.value))}
                          className="w-full accent-blue-600" 
                        />
                      </div>

                      <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.shadow', 'Sombra')}</span>
                          <button 
                            onClick={() => {
                              if (activeObject.shadow) {
                                updateActiveObject('shadow', null);
                              } else {
                                updateActiveObject('shadow', new fabric.Shadow({
                                  color: 'rgba(0,0,0,0.5)',
                                  blur: 10,
                                  offsetX: 5,
                                  offsetY: 5
                                }));
                              }
                            }}
                            className={cn(
                              "w-8 h-4 rounded-full transition-colors relative",
                              activeObject.shadow ? "bg-blue-600" : "bg-zinc-700"
                            )}
                          >
                            <div className={cn(
                              "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                              activeObject.shadow ? "left-4.5" : "left-0.5"
                            )} />
                          </button>
                        </div>

                        {activeObject.shadow && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] text-zinc-500">{t('editor.panels.color', 'Cor')}</label>
                              <ColorPicker 
                                color={activeObject.shadow.color || '#000000'} 
                                onChange={(color) => {
                                  const s = activeObject.shadow;
                                  updateActiveObject('shadow', new fabric.Shadow({
                                    color,
                                    blur: s.blur,
                                    offsetX: s.offsetX,
                                    offsetY: s.offsetY
                                  }));
                                }}
                                variant="square"
                                side="bottom"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <label className="text-[9px] text-zinc-500">{t('editor.panels.blur', 'Desfoque')}</label>
                                <span className="text-[9px] text-zinc-500">{Math.round(activeObject.shadow.blur)}px</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={activeObject.shadow.blur} 
                                onChange={(e) => {
                                  const s = activeObject.shadow;
                                  updateActiveObject('shadow', new fabric.Shadow({
                                    color: s.color,
                                    blur: parseFloat(e.target.value),
                                    offsetX: s.offsetX,
                                    offsetY: s.offsetY
                                  }));
                                }}
                                className="w-full accent-blue-600" 
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <label className="text-[9px] text-zinc-500">Offset X</label>
                                  <span className="text-[9px] text-zinc-500">{Math.round(activeObject.shadow.offsetX)}px</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="-100" 
                                  max="100" 
                                  value={activeObject.shadow.offsetX} 
                                  onChange={(e) => {
                                    const s = activeObject.shadow;
                                    updateActiveObject('shadow', new fabric.Shadow({
                                      color: s.color,
                                      blur: s.blur,
                                      offsetX: parseFloat(e.target.value),
                                      offsetY: s.offsetY
                                    }));
                                  }}
                                  className="w-full accent-blue-600" 
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <label className="text-[9px] text-zinc-500">Offset Y</label>
                                  <span className="text-[9px] text-zinc-500">{Math.round(activeObject.shadow.offsetY)}px</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="-100" 
                                  max="100" 
                                  value={activeObject.shadow.offsetY} 
                                  onChange={(e) => {
                                    const s = activeObject.shadow;
                                    updateActiveObject('shadow', new fabric.Shadow({
                                      color: s.color,
                                      blur: s.blur,
                                      offsetX: s.offsetX,
                                      offsetY: parseFloat(e.target.value)
                                    }));
                                  }}
                                  className="w-full accent-blue-600" 
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {activeObject.type === 'i-text' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.text', 'Texto')}</span>
                          <button 
                            onClick={insertLoremIpsum}
                            className="text-[9px] text-blue-500 hover:underline font-bold"
                          >
                            {t('editor.panels.lorem_ipsum', 'Lorem Ipsum')}
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <button 
                            onClick={() => toggleTextProperty('fontWeight')}
                            className={cn("p-2 bg-zinc-900 rounded-md", activeObject.fontWeight === 'bold' && "text-blue-500 bg-blue-500/10")}
                          >
                            <Bold size={14} />
                          </button>
                          <button 
                            onClick={() => toggleTextProperty('fontStyle')}
                            className={cn("p-2 bg-zinc-900 rounded-md", activeObject.fontStyle === 'italic' && "text-blue-500 bg-blue-500/10")}
                          >
                            <Italic size={14} />
                          </button>
                          <button 
                            onClick={() => toggleTextProperty('underline')}
                            className={cn("p-2 bg-zinc-900 rounded-md", activeObject.underline && "text-blue-500 bg-blue-500/10")}
                          >
                            <Underline size={14} />
                          </button>
                          <button className="p-2 bg-zinc-900 rounded-md"><AlignLeft size={14} /></button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.workspace', 'Workspace')}</span>
                          <div className="relative group">
                            <button className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-white bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                              {t(UNITS.find(u => u.id === unit)?.label || '', unit) as string} <ChevronDown size={10} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              {UNITS.map(u => (
                                <button 
                                  key={u.id}
                                  onClick={() => handleUnitChange(u.id as any)}
                                  className={cn(
                                    "w-full text-left px-3 py-1.5 text-[10px] hover:bg-zinc-800 flex items-center justify-between",
                                    unit === u.id && "text-blue-500"
                                  )}
                                >
                                  {t(u.label, u.id) as string}
                                  {unit === u.id && <Check size={10} />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500">X</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                value={formatValue(offset.x)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value.replace(',', '.'));
                                  if (!isNaN(val)) {
                                    const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                                    const newX = val * factor;
                                    setOffset(prev => ({ ...prev, x: newX }));
                                    if (canvas) {
                                      const vpt = [...canvas.viewportTransform as number[]];
                                      vpt[4] = newX;
                                      canvas.setViewportTransform(vpt);
                                      canvas.requestRenderAll();
                                    }
                                  }
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-white"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase">{unit === 'percent' ? '%' : unit}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500">Y</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                value={formatValue(offset.y)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value.replace(',', '.'));
                                  if (!isNaN(val)) {
                                    const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                                    const newY = val * factor;
                                    setOffset(prev => ({ ...prev, y: newY }));
                                    if (canvas) {
                                      const vpt = [...canvas.viewportTransform as number[]];
                                      vpt[5] = newY;
                                      canvas.setViewportTransform(vpt);
                                      canvas.requestRenderAll();
                                    }
                                  }
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-white"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase">{unit === 'percent' ? '%' : unit}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500">{t('editor.panels.width', 'Largura')}</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                value={formatValue(artboardSize.width)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value.replace(',', '.'));
                                  if (!isNaN(val)) {
                                    const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                                    const newWidth = val * factor;
                                    setArtboardSize(prev => ({ ...prev, width: newWidth }));
                                    if (canvas) {
                                      canvas.setDimensions({ width: newWidth, height: canvas.height! });
                                      canvas.renderAll();
                                    }
                                  }
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-white"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase">{unit === 'percent' ? '%' : unit}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500">{t('editor.panels.height', 'Altura')}</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                value={formatValue(artboardSize.height)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value.replace(',', '.'));
                                  if (!isNaN(val)) {
                                    const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                                    const newHeight = val * factor;
                                    setArtboardSize(prev => ({ ...prev, height: newHeight }));
                                    if (canvas) {
                                      canvas.setDimensions({ width: canvas.width!, height: newHeight });
                                      canvas.renderAll();
                                    }
                                  }
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-white"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase">{unit === 'percent' ? '%' : unit}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                          <span className="text-[10px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.document', 'Document')}</span>
                          <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500">{t('editor.panels.preset', 'Preset')}</label>
                            <select 
                              value={canvasPreset} 
                              onChange={(e) => {
                                const preset = CANVAS_PRESETS.find(p => p.id === e.target.value);
                                if (preset) {
                                  setCanvasPreset(preset.id);
                                  if (preset.width && preset.height) {
                                    setArtboardSize({ width: preset.width, height: preset.height });
                                    if (canvas) {
                                      canvas.setDimensions({ width: preset.width, height: preset.height });
                                      canvas.renderAll();
                                      updateLayers(canvas);
                                    }
                                  }
                                }
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs text-white"
                            >
                              {CANVAS_PRESETS.map(p => (
                                <option key={p.id} value={p.id}>{t(p.label, p.id) as string}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.background_settings', 'Configurações de fundo')}</span>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-[9px] text-zinc-500">{t('editor.panels.background_opacity', 'Opacidade do Fundo')}</label>
                            <span className="text-[9px] text-zinc-500">{getBackgroundOpacity()}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={getBackgroundOpacity()} 
                            onChange={(e) => updateBackgroundOpacity(parseInt(e.target.value))}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer custom-slider" 
                          />
                        </div>
                      </div>
                    </div>
                )}
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="p-4 space-y-4">
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-grow py-1.5 text-[9px] font-bold rounded-md transition-all bg-zinc-800 text-blue-500 hover:text-blue-400 flex items-center justify-center gap-1.5"
                  >
                    <Upload size={10} />
                    {t('editor.panels.import', 'Importar')}
                  </button>
                  <div className="w-px h-4 bg-zinc-800 self-center mx-1" />
                  <button 
                    onClick={() => setSearchType('pexels')}
                    className={cn("flex-grow py-1.5 text-[9px] font-bold rounded-md transition-all", searchType === 'pexels' ? "bg-blue-600 text-white" : "text-zinc-500")}
                  >
                    {t('editor.panels.images', 'Imagens')}
                  </button>
                  <button 
                    onClick={() => setSearchType('iconify')}
                    className={cn("flex-grow py-1.5 text-[9px] font-bold rounded-md transition-all", searchType === 'iconify' ? "bg-blue-600 text-white" : "text-zinc-500")}
                  >
                    {t('editor.panels.icons', 'Ícones')}
                  </button>
                  <button 
                    onClick={() => setSearchType('qrcode')}
                    className={cn("flex-grow py-1.5 text-[9px] font-bold rounded-md transition-all", searchType === 'qrcode' ? "bg-blue-600 text-white" : "text-zinc-500")}
                  >
                    {t('editor.tools.qrcode', 'QR Code')}
                  </button>
                </div>

                {searchType === 'qrcode' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500">{t('editor.panels.qr_text', 'Texto ou URL')}</label>
                      <textarea 
                        value={qrText}
                        onChange={(e) => setQrText(e.target.value)}
                        placeholder={i18n.language.startsWith('pt') ? "https://exemplo.com" : "https://example.com"}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none h-24"
                      />
                    </div>
                    <button 
                      onClick={generateQRCode}
                      disabled={isProcessing || !qrText}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {isProcessing ? t('editor.panels.generating', 'Gerando...') : t('editor.panels.generate_qr', 'Gerar QR Code')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (searchType === 'pexels' ? searchPexels() : searchIconify())}
                        placeholder={searchType === 'pexels' ? t('editor.panels.search_images', "Buscar imagens...") : t('editor.panels.search_icons', "Buscar ícones...")}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 outline-none"
                      />
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    </div>

                    <div className={cn("grid gap-2", searchType === 'iconify' ? "grid-cols-3" : "grid-cols-2")}>
                      {(searchType === 'pexels' ? pexelsResults : iconifyResults).length === 0 && isProcessing ? (
                        <div className="col-span-full py-12 flex justify-center">
                          <RefreshCw size={24} className="animate-spin text-blue-500" />
                        </div>
                      ) : (searchType === 'pexels' ? pexelsResults : iconifyResults).length === 0 ? (
                        <div className="col-span-full py-12 text-center">
                          <p className="text-zinc-600 text-xs italic">{t('editor.panels.search_start', 'Busque algo para começar')}</p>
                        </div>
                      ) : (
                        (searchType === 'pexels' ? pexelsResults : iconifyResults).map((item, idx) => {
                          const itemId = searchType === 'pexels' ? String(item.id) : item;
                          const isLoading = loadingAssetId === itemId;
                          const isSelected = selectedAssetId === itemId;
                          const itemName = searchType === 'pexels' ? (item.alt || t('editor.panels.image', 'Imagem')) : item;
                          
                          return (
                            <button 
                              key={idx}
                              onClick={() => handleAssetClick(
                                searchType === 'pexels' ? item.src?.original : `https://api.iconify.design/${item}.svg`, 
                                itemId,
                                itemName
                              )}
                              disabled={isLoading}
                              className={cn(
                                "aspect-square rounded-lg overflow-hidden border transition-all relative group",
                                isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-zinc-800 hover:border-zinc-700",
                                searchType === 'iconify' ? "bg-gray-200 p-2" : "bg-zinc-900 p-1"
                              )}
                              title={itemName}
                            >
                              {isLoading && (
                                <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center gap-2">
                                  <RefreshCw size={16} className="animate-spin text-blue-500" />
                                  <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 animate-[shimmer_1.5s_infinite] w-full" />
                                  </div>
                                </div>
                              )}
                              
                              {isSelected && !isLoading && (
                                <div className="absolute inset-0 z-10 bg-blue-600/40 flex items-center justify-center backdrop-blur-[1px]">
                                  <div className="bg-white text-blue-600 rounded-full p-1 shadow-lg transform scale-110 animate-in zoom-in duration-200">
                                    <Plus size={16} strokeWidth={3} />
                                  </div>
                                </div>
                              )}

                              {searchType === 'pexels' ? (
                                item.src?.tiny ? (
                                  <img src={item.src.tiny} alt={itemName} className="w-full h-full object-cover rounded-md" referrerPolicy="no-referrer" />
                                ) : null
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {item && <img src={`https://api.iconify.design/${item}.svg`} alt={itemName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />}
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                      {(searchType === 'pexels' ? hasMorePexels : hasMoreIconify) && (searchType === 'pexels' ? pexelsResults : iconifyResults).length > 0 && (
                        <button 
                          onClick={() => searchType === 'pexels' ? searchPexels(undefined, true) : searchIconify(undefined, true)}
                          disabled={isProcessing}
                          className="col-span-full py-4 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoadingMore ? <RefreshCw size={12} className="animate-spin" /> : <ChevronDown size={12} />}
                          {isLoadingMore ? t('editor.panels.loading', 'Carregando...') : t('editor.panels.load_more', 'Carregar mais...')}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

            <div className="p-4 border-t border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500">{t('editor.tools.accessibility', 'Acessibilidade')}</span>
                <button 
                  onClick={() => setShowAcessibilidadeInfo(!showAcessibilidadeInfo)}
                  className={cn("p-1 hover:bg-zinc-800 rounded-md transition-colors", showAcessibilidadeInfo ? "text-blue-500 bg-blue-500/10" : "text-zinc-500")}
                >
                  <Info size={14} />
                </button>
              </div>
              
              {showAcessibilidadeInfo && (
                <div className="p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                  <p className="text-[9px] text-zinc-400 leading-relaxed">
                    {t('editor.tools.accessibility_info', 'As ferramentas de acessibilidade ajudam a garantir que seu design seja inclusivo. O teste de contraste verifica a legibilidade do texto, enquanto os filtros de daltonismo permitem visualizar como pessoas com diferentes percepções de cores verão sua arte.')}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <button 
                    onClick={checkContrast}
                    className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold hover:bg-zinc-800"
                  >
                    {t('editor.tools.contrast', 'Contraste')}
                  </button>
                  
                  {contrastResult && (
                    <div className={cn(
                      "px-2 py-1 rounded text-[8px] font-bold flex flex-col gap-0.5",
                      contrastResult.status === 'fail' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                    )}>
                      <div className="flex justify-between">
                        <span>{t('editor.tools.ratio', 'Ratio')}: {contrastResult.ratio.toFixed(2)}:1</span>
                        <span>{contrastResult.status === 'fail' ? t('editor.tools.failed', 'Falhou') : t('editor.tools.passed', 'Passou')}</span>
                      </div>
                      <span className="text-[7px] opacity-70">
                        {contrastResult.status === 'aa-normal' ? 'WCAG AA (Normal)' : 
                         contrastResult.status === 'aa-large' ? 'WCAG AA (Grande)' : 
                         t('editor.tools.insufficient', 'Insuficiente')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="relative group">
                  <button className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold hover:bg-zinc-800">
                    {t('editor.tools.color_blindness', 'Daltonismo')}
                  </button>
                  <div className="absolute bottom-full left-0 mb-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                    {VISION_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setVisionType(type.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-[10px] rounded-lg hover:bg-zinc-800 transition-colors",
                          visionType === type.id ? "text-blue-500 bg-blue-500/10" : "text-zinc-400"
                        )}
                      >
                        {t(type.label)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
        </aside>
      </div>
    </div>

      {/* Status Bar */}
      <footer className="h-8 bg-[#121212] flex items-center justify-between px-4 text-[10px] font-medium text-zinc-500 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Layout size={12} />
            <span>{artboardSize.width} × {artboardSize.height} px</span>
          </div>
          <div className="flex items-center gap-2">
            <Palette size={12} />
            <span>{t('editor.common.mode')}: {t('editor.panels.hexadecimal', 'Hexadecimal')}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <MousePointer2 size={12} />
            <span>X: {mousePos.x} Y: {mousePos.y}</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>{t('editor.tools.auto_save_active', 'Auto-save ativo')}</span>
          </div>
        </div>
      </footer>

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*,application/pdf,.heic,.psd,.ai,.cdr" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={teeInputRef} 
        onChange={handleTeeImport} 
        accept=".tee" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={fontInputRef} 
        onChange={handleFontImport} 
        accept=".ttf,.otf,.woff,.woff2" 
        className="hidden" 
      />

      {/* New Document Modal */}
      <AnimatePresence>
        {showPickerModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1e1e1e] border border-zinc-800 rounded-xl p-4 w-48 shadow-2xl flex flex-col items-center gap-3 relative pointer-events-auto"
            >
              <div className="w-full flex justify-between items-center mb-1">
                <h3 className="text-[9px] font-bold text-zinc-500 tracking-widest">{t('editor.tools.captured_color', 'Cor capturada')}</h3>
                <button onClick={() => setShowPickerModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
              
              <div 
                className="w-24 h-24 rounded-lg border-2 border-zinc-800 shadow-inner"
                style={{ backgroundColor: pickedColor }}
              />
              
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xl font-mono font-bold text-white tracking-tighter">{pickedColor}</span>
                <span className="text-[8px] text-zinc-500 font-bold tracking-widest">{t('editor.panels.hexadecimal', 'Hexadecimal')}</span>
              </div>

              <button 
                onClick={() => setShowPickerModal(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded-lg transition-all mt-1"
              >
                {t('editor.panels.confirm', 'Confirmar')}
              </button>
            </motion.div>
          </div>
        )}

        {/* PDF Choice Modal */}
      {showPdfChoiceModal && pendingPdfFile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPdfChoiceModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white">{t('modals.pdf_choice.title', 'Como deseja abrir o PDF?')}</h3>
              <p className="text-sm text-zinc-400">{t('modals.pdf_choice.subtitle', 'Escolha entre editar o conteúdo ou importar como imagem.')}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={async () => {
                  setShowPdfChoiceModal(false);
                  setIsProcessing(true);
                  try {
                    const pages = await pdfService.loadPdf(pendingPdfFile);
                    setPdfPages(pages);
                    setIsPdfMode(true);
                    setCurrentPdfPageIndex(0);
                    setPdfFileName(pendingPdfFile.name);
                    if (pages.length > 0) {
                      if (canvas) {
                        loadPdfPage(0, pages);
                      } else {
                        pendingPdfPages.current = pages;
                        addNewDocument(pages[0].width, pages[0].height);
                      }
                    }
                    showToast(t('editor.messages.pdf_loaded', 'PDF carregado para edição'), 'success');
                  } catch (e) {
                    console.error(e);
                    showToast(t('editor.messages.pdf_error', 'Erro ao carregar PDF'), 'error');
                  } finally {
                    setIsProcessing(false);
                    setPendingPdfFile(null);
                  }
                }}
                className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Edit3 size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{t('modals.pdf_choice.edit_title', 'Editar PDF')}</p>
                  <p className="text-[10px] opacity-70">{t('modals.pdf_choice.edit_desc', 'Edite textos, adicione anotações e gerencie páginas.')}</p>
                </div>
              </button>

              <button 
                onClick={async () => {
                  setShowPdfChoiceModal(false);
                  setIsProcessing(true);
                  try {
                    const arrayBuffer = await pendingPdfFile.arrayBuffer();
                    const pdfjsLib = await import('pdfjs-dist');
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
                    
                    if (pdf.numPages > 1) {
                      setPdfFile(pendingPdfFile);
                      const thumbs = await generateAllThumbnails(arrayBuffer, 0.5);
                      setPdfThumbnails(thumbs);
                      setSelectedPdfPages([]);
                      setShowPdfModal(true);
                    } else {
                      const thumbnailUrl = await generateThumbnail(arrayBuffer, 1, 2);
                      if (thumbnailUrl) {
                        addImageToCanvas(thumbnailUrl);
                      }
                    }
                  } catch (e) {
                    console.error(e);
                    showToast(t('editor.messages.pdf_error', 'Erro ao importar PDF'), 'error');
                  } finally {
                    setIsProcessing(false);
                    setPendingPdfFile(null);
                  }
                }}
                className="w-full p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{t('modals.pdf_choice.import_title', 'Importar como Imagem')}</p>
                  <p className="text-[10px] opacity-70">{t('modals.pdf_choice.import_desc', 'Insere as páginas como imagens no seu design atual.')}</p>
                </div>
              </button>
            </div>

            <button 
              onClick={() => {
                setShowPdfChoiceModal(false);
                setPendingPdfFile(null);
              }}
              className="w-full py-2 text-xs text-zinc-500 hover:text-white transition-colors"
            >
              {t('common.cancel', 'Cancelar')}
            </button>
          </motion.div>
        </div>
      )}

      {showPdfModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPdfModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <div>
                  <h3 className="text-lg font-bold text-white">{t('modals.pdf_import.title', 'Importar PDF')}</h3>
                  <p className="text-xs text-zinc-500">{t('modals.pdf_import.subtitle', 'Selecione as páginas que deseja importar')}</p>
                </div>
                <button 
                  onClick={() => setShowPdfModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pdfThumbnails.map((thumb, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        const pageNum = idx + 1;
                        setSelectedPdfPages(prev => 
                          prev.includes(pageNum) 
                            ? prev.filter(p => p !== pageNum) 
                            : [...prev, pageNum]
                        );
                      }}
                      className={cn(
                        "group relative aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                        selectedPdfPages.includes(idx + 1) ? "border-blue-500 ring-4 ring-blue-500/20" : "border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      {thumb && <img src={thumb} alt={t('modals.pdf_import.page_label', { number: idx + 1 })} className="w-full h-full object-cover" />}
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                        {idx + 1}
                      </div>
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center transition-opacity",
                        selectedPdfPages.includes(idx + 1) ? "opacity-100 bg-blue-500/10" : "opacity-0 group-hover:opacity-100 bg-black/20"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          selectedPdfPages.includes(idx + 1) ? "bg-blue-500 text-white scale-110" : "bg-white/20 backdrop-blur-md text-white"
                        )}>
                          <Check size={16} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between gap-4">
                <div className="text-xs text-zinc-500">
                  {selectedPdfPages.length === 1 
                    ? t('modals.pdf_import.selected_count_singular', { count: selectedPdfPages.length })
                    : t('modals.pdf_import.selected_count_plural', { count: selectedPdfPages.length })}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handlePdfImportAll}
                    className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                  >
                    {t('modals.pdf_import.import_all', 'Importar tudo')}
                  </button>
                  <button 
                    onClick={handlePdfImportSelected}
                    disabled={selectedPdfPages.length === 0}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    {t('modals.pdf_import.import_selected', 'Importar Selecionadas')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Processing Overlay - Removed as per user request for in-element progress bars */}
      
      {/* Modals with Suspense */}
      <React.Suspense fallback={null}>
        {showAbout && <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />}
        
        <ExportModal 
          isOpen={showExportModal} 
          onClose={() => setShowExportModal(false)} 
          onExport={handleExport}
          canvas={canvas}
          artboardSize={artboardSize}
          carouselPages={carouselPages}
        />

        <VectorizerModal
          isOpen={showVectorizerModal}
          onClose={() => setShowVectorizerModal(false)}
          onApply={handleVectorizerApply}
          imageUrl={vectorizerImageUrl}
        />

        <HelpModal 
          isOpen={showHelpModal} 
          onClose={() => setShowHelpModal(false)} 
        />

        <KeyboardShortcutsModal 
          isOpen={showShortcutsModal} 
          onClose={() => setShowShortcutsModal(false)} 
        />

        <BlindOnboardingModal 
          isOpen={showA11yOnboarding} 
          onClose={() => {
            setShowA11yOnboarding(false);
            localStorage.setItem('moscatee_a11y_onboarding_done', 'true');
          }} 
        />
        <ReportProblemModal 
          isOpen={showReportModal} 
          onClose={() => setShowReportModal(false)} 
          t={t} 
        />

        <LayerStylesModal
          isOpen={showLayerStylesModal}
          onClose={() => setShowLayerStylesModal(false)}
          activeObject={stylesTargetObject}
          onApply={(styles) => applyLayerStyles(styles, false)}
          onConfirm={(styles) => applyLayerStyles(styles, true)}
        />

        <SmartObjectModal
          isOpen={showSmartObjectModal}
          onClose={() => setShowSmartObjectModal(false)}
          smartObject={smartObjectTarget}
          onUpdateSource={handleUpdateSmartObjectSource}
        />

        <LevelsModal
          isOpen={showLevelsModal}
          onClose={() => setShowLevelsModal(false)}
          onApply={(levelsData) => {
            if (adjustmentTarget) {
              adjustmentTarget.set('adjustmentData', levelsData);
              applyAdjustmentLayer(adjustmentTarget);
            }
          }}
          initialLevels={adjustmentTarget ? (adjustmentTarget as any).adjustmentData : undefined}
          imageElement={(() => {
            // Find an image object that is affected by this adjustment
            if (!canvas || !adjustmentTarget) return null;
            const idx = canvas.getObjects().indexOf(adjustmentTarget);
            for (let i = idx - 1; i >= 0; i--) {
              const obj = canvas.getObjects()[i];
              if (obj.type === 'image' && (obj as any).getElement) {
                return (obj as any).getElement();
              }
            }
            return null;
          })()}
        />

        <AdjustmentModal
          isOpen={showAdjustmentModal}
          onClose={() => {
            if (adjustmentTarget) {
              // @ts-ignore
              delete adjustmentTarget.isNewAdjustment;
            }
            setShowAdjustmentModal(false);
          }}
          onCancel={() => {
            if (adjustmentTarget && (adjustmentTarget as any).isNewAdjustment) {
              canvas?.remove(adjustmentTarget);
              if (canvas) refreshFilters(canvas);
              if (canvas) updateLayers(canvas);
            }
            setShowAdjustmentModal(false);
          }}
          adjustmentLayer={adjustmentTarget}
          onApply={(data) => {
            if (adjustmentTarget) {
              adjustmentTarget.set('adjustmentData', data);
              applyAdjustmentLayer(adjustmentTarget);
            }
          }}
        />
      </React.Suspense>
      </motion.div>
    </div>
  );
};

export default MoscaTeePage;
