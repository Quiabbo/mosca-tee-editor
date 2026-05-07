import { fabric } from 'fabric';

export interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  object: fabric.Object;
  depth?: number;
  parentId?: string;
  isExpanded?: boolean;
  isGroup?: boolean;
  childrenIds?: string[];
}

export interface HistoryItem {
  id: string;
  name: string;
  state: string;
  timestamp: number;
  activeDocumentId?: string;
  artboardSize?: ArtboardSize;
  carouselPages?: number;
  zoom?: number;
  viewportTransform?: number[];
}

export interface HistoryState {
  history: HistoryItem[];
  index: number;
}

export interface ArtboardSize {
  width: number;
  height: number;
}

export interface VisionType {
  id: string;
  label: string;
  filter: string;
}

export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  color?: string;
  artboardId?: string;
  start?: number;
  end?: number;
}

export interface GuideLayoutConfig {
  columns: {
    enabled: boolean;
    number: number;
    width: number | null;
    gutter: number;
  };
  rows: {
    enabled: boolean;
    number: number;
    height: number | null;
    gutter: number;
  };
  margin: {
    enabled: boolean;
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
  centerColumns: boolean;
  clearExisting: boolean;
  applyToAllPages?: boolean;
  color: string;
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp' | 'svg' | 'pdf' | 'psd';
  quality: number;
  multiplier: number;
  area: 'canvas' | 'selection';
  transparent: boolean;
  exportLayers: boolean;
}

export interface Macro {
  id: string;
  name: string;
  actions: {
    type: string;
    property?: string;
    value?: any;
    data?: any;
  }[];
  timestamp: number;
}
