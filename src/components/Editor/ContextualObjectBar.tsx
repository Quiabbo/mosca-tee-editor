import React from 'react';
import { ColorPicker } from '../ColorPicker';
import { 
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignLeft, AlignCenter, AlignRight,
  FlipHorizontal, FlipVertical,
  Minus, Plus, Bold, Italic, Underline,
  Copy, Trash2, ChevronDown, Check,
  Maximize2, Move, Layout, Sliders,
  Box, ArrowUpRight, Lock as LockIcon, Unlock as UnlockIcon,
  Edit3, Scissors, ExternalLink,
  Ungroup, BoxSelect, X,
  BringToFront, SendToBack, ArrowUp, ArrowDown,
  RotateCw, Link as LinkIcon, Link2 as UnlinkIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { PdfToolbar } from '../Layout/PdfToolbar';

interface ContextualObjectBarProps {
  activeObject: any;
  updateActiveObject: (prop: string, value: any, skipHistory?: boolean) => void;
  toggleTextProperty: (prop: string) => void;
  duplicateObject: () => void;
  deleteActive: () => void;
  alignActiveObject: (alignment: string) => void;
  flipActiveObject: (direction: string) => void;
  alignmentMode?: 'selection' | 'artboard';
  setAlignmentMode?: (mode: 'selection' | 'artboard') => void;
  fonts: string[];
  fontInputRef: React.RefObject<HTMLInputElement>;
  toHex: (color: any) => string;
  t: any;
  canvas: any;
  saveToHistory: (canvas: any) => void;
  updateLayers: (canvas: any) => void;
  forceUpdate: () => void;
  // Artboard props
  artboardSize?: { width: number, height: number };
  setArtboardSize?: React.Dispatch<React.SetStateAction<{ width: number, height: number }>>;
  offset?: { x: number, y: number };
  setOffset?: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  canvasPreset?: string;
  setCanvasPreset?: (id: string) => void;
  CANVAS_PRESETS?: any[];
  getBackgroundOpacity?: () => number;
  updateBackgroundOpacity?: (val: number) => void;
  unit?: string;
  handleUnitChange?: (u: string) => void;
  UNITS?: any[];
  formatValue?: (v: number) => any;
  // PDF props
  isPdfMode?: boolean;
  activeTool?: string;
  setActiveTool?: (tool: string) => void;
  onExportPdf?: () => void;
  onOcr?: () => void;
  onCompressPdf?: () => void;
  onProtectPdf?: () => void;
  handlePathfinder: (op: any) => void;
  handlePowerClip?: () => void;
  isPowerClipEditing?: boolean;
  exitPowerClipEdit?: () => void;
  topOptions?: { 
    fontSize: number, 
    color: string, 
    offset: number, 
    fontFamily: string, 
    fontWeight: string, 
    fontStyle: string, 
    underline: boolean 
  };
  setTopOptions?: React.Dispatch<React.SetStateAction<{ 
    fontSize: number, 
    color: string, 
    offset: number, 
    fontFamily: string, 
    fontWeight: string, 
    fontStyle: string, 
    underline: boolean 
  }>>;
}

export const ContextualObjectBar: React.FC<ContextualObjectBarProps> = ({
  activeObject,
  updateActiveObject,
  toggleTextProperty,
  duplicateObject,
  deleteActive,
  alignActiveObject,
  flipActiveObject,
  alignmentMode = 'selection',
  setAlignmentMode,
  fonts,
  fontInputRef,
  toHex,
  t,
  canvas,
  saveToHistory,
  updateLayers,
  forceUpdate,
  artboardSize,
  setArtboardSize,
  offset,
  setOffset,
  canvasPreset,
  setCanvasPreset,
  CANVAS_PRESETS,
  getBackgroundOpacity,
  updateBackgroundOpacity,
  unit,
  handleUnitChange,
  UNITS,
  formatValue,
  isPdfMode,
  activeTool,
  setActiveTool,
  onExportPdf,
  onOcr,
  onCompressPdf,
  onProtectPdf,
  handlePathfinder,
  handlePowerClip,
  isPowerClipEditing,
  exitPowerClipEdit,
  topOptions,
  setTopOptions
}) => {
  return (
    <div className="flex items-center gap-2 px-4 h-12 bg-[#191919] border-b border-zinc-800 shadow-sm overflow-visible shrink-0 z-[90]">
      {(activeTool === 'text-on-path' || (activeObject && activeObject.isTextOnPath)) && topOptions && setTopOptions && (
        <div className="flex items-center gap-4 px-4 h-full bg-[#191919] border-x border-zinc-800 animate-in fade-in slide-in-from-left-4">
          {/* Fonte */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-500 font-bold">{t('editor.panels.typography', 'Fonte')}</span>
            <select 
              value={topOptions.fontFamily || 'Inter'}
              onChange={(e) => {
                const newVal = e.target.value;
                if (newVal === 'IMPORT_CTA') {
                  fontInputRef.current?.click();
                } else if (activeObject && activeObject.isTextOnPath) {
                  updateActiveObject('fontFamily', newVal);
                } else {
                  setTopOptions(prev => ({ ...prev, fontFamily: newVal }));
                }
              }}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 w-24"
            >
              {fonts.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
              <option value="IMPORT_CTA" className="text-blue-500 font-bold bg-blue-500/10">
                {t('editor.panels.import_font_option', '+ Importar fonte')}
              </option>
            </select>
          </div>

          {/* Peso/Estilo */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button 
              onClick={() => toggleTextProperty('fontWeight')}
              className={cn("p-1 hover:bg-zinc-800 rounded transition-colors", topOptions.fontWeight === 'bold' ? "bg-blue-600 text-white" : "text-zinc-400")}
              title={t('editor.tools.bold_action', 'Negrito')}
            >
              <Bold size={14} />
            </button>
            <button 
              onClick={() => toggleTextProperty('fontStyle')}
              className={cn("p-1 hover:bg-zinc-800 rounded transition-colors", topOptions.fontStyle === 'italic' ? "bg-blue-600 text-white" : "text-zinc-400")}
              title={t('editor.tools.italic_action', 'Itálico')}
            >
              <Italic size={14} />
            </button>
            <button 
              onClick={() => toggleTextProperty('underline')}
              className={cn("p-1 hover:bg-zinc-800 rounded transition-colors", topOptions.underline ? "bg-blue-600 text-white" : "text-zinc-400")}
              title={t('editor.tools.underline_action', 'Sublinhado')}
            >
              <Underline size={14} />
            </button>
          </div>

          {/* Tamanho da Fonte */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-500 font-bold">{t('editor.panels.font_size', 'Tamanho')}</span>
            <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 p-0.5">
              <button 
                onClick={() => {
                  const newVal = Math.max(8, (topOptions.fontSize || 32) - 2);
                  if (activeObject && activeObject.isTextOnPath) {
                    updateActiveObject('fontSize', newVal);
                  } else {
                    setTopOptions(prev => ({ ...prev, fontSize: newVal }));
                  }
                }}
                className="p-1 hover:bg-zinc-800 text-zinc-400 rounded transition-colors"
              >
                <Minus size={12} />
              </button>
              <input 
                type="number"
                value={topOptions.fontSize || 32}
                onChange={(e) => {
                  const newVal = parseInt(e.target.value) || 18;
                  if (activeObject && activeObject.isTextOnPath) {
                    updateActiveObject('fontSize', newVal);
                  } else {
                    setTopOptions(prev => ({ ...prev, fontSize: newVal }));
                  }
                }}
                className="w-10 bg-transparent text-[10px] text-center text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button 
                onClick={() => {
                  const newVal = (topOptions.fontSize || 32) + 2;
                  if (activeObject && activeObject.isTextOnPath) {
                    updateActiveObject('fontSize', newVal);
                  } else {
                    setTopOptions(prev => ({ ...prev, fontSize: newVal }));
                  }
                }}
                className="p-1 hover:bg-zinc-800 text-zinc-400 rounded transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Cor */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-500 font-bold">{t('editor.panels.color', 'Cor')}</span>
            <ColorPicker 
              color={topOptions.color} 
              onChange={(color) => {
                if (activeObject && activeObject.isTextOnPath) {
                  updateActiveObject('fill', color);
                } else {
                  setTopOptions(prev => ({ ...prev, color }));
                }
              }}
              variant="square"
              side="bottom"
            />
          </div>

          {/* Offset (Alinhamento) */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-zinc-500 font-bold">{t('editor.tools.alignment', 'Alinhamento')}</span>
            <input 
              type="range"
              min="0"
              max="100"
              value={topOptions.offset || 0}
              onChange={(e) => {
                const newVal = parseInt(e.target.value);
                if (activeObject && activeObject.isTextOnPath) {
                  updateActiveObject('offset', newVal);
                } else {
                  setTopOptions(prev => ({ ...prev, offset: newVal }));
                }
              }}
              className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[10px] text-blue-400 font-mono w-8">{topOptions.offset}%</span>
          </div>

          <div className="w-px h-4 bg-zinc-800" />
          
          <button 
            onClick={() => setActiveTool?.('select')}
            className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
            title={t('common.cancel', 'Cancelar')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isPdfMode && (
        <div className="flex items-center border-r border-zinc-800 pr-2 mr-2">
          <PdfToolbar 
            activeTool={activeTool || 'select'}
            setActiveTool={setActiveTool || (() => {})}
            onExport={onExportPdf || (() => {})}
            onOcr={onOcr || (() => {})}
            onCompress={onCompressPdf || (() => {})}
            onProtect={onProtectPdf || (() => {})}
          />
        </div>
      )}

      {(!activeObject || (activeObject && activeObject.id && activeObject.id.toString().startsWith('artboard_bg')) || activeTool === 'artboard') ? (
        !isPdfMode && (
          <div className="flex items-center gap-6 w-full">
            {/* Unit Selector */}
          <div className="flex items-center gap-2 border-r border-zinc-800 pr-4">
            <span className="text-[9px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.unit_short', 'Unidade')}</span>
            <div className="relative group">
              <button className="flex items-center gap-1 text-[10px] text-zinc-300 hover:text-white bg-zinc-900 px-2 py-1 rounded border border-zinc-800 min-w-[60px] justify-between">
                {t(UNITS?.find(u => u.id === unit)?.label || '', unit) as string} <ChevronDown size={10} />
              </button>
              <div className="absolute left-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {UNITS?.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => handleUnitChange?.(u.id as any)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-[10px] hover:bg-zinc-800 flex items-center justify-between",
                      unit === u.id ? "text-blue-500" : "text-zinc-400"
                    )}
                  >
                    {t(u.label, u.id) as string}
                    {unit === u.id && <Check size={10} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Artboard Position (X, Y) */}
          <div className="flex items-center gap-3 border-r border-zinc-800 pr-4">
            <div className="flex items-center gap-1.5">
              <Move size={12} className="text-zinc-500" />
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-500 font-bold">X</span>
                <input 
                  type="text" 
                  value={formatValue?.(offset?.x || 0)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(',', '.'));
                    if (!isNaN(val)) {
                      const factor = UNITS?.find(u => u.id === unit)?.factor || 1;
                      const newX = val * factor;
                      setOffset?.(prev => ({ ...prev, x: newX }));
                      if (canvas) {
                        const vpt = [...canvas.viewportTransform as number[]];
                        vpt[4] = newX;
                        canvas.setViewportTransform(vpt);
                        canvas.requestRenderAll();
                      }
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-500 font-bold">Y</span>
                <input 
                  type="text" 
                  value={formatValue?.(offset?.y || 0)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(',', '.'));
                    if (!isNaN(val)) {
                      const factor = UNITS?.find(u => u.id === unit)?.factor || 1;
                      const newY = val * factor;
                      setOffset?.(prev => ({ ...prev, y: newY }));
                      if (canvas) {
                        const vpt = [...canvas.viewportTransform as number[]];
                        vpt[5] = newY;
                        canvas.setViewportTransform(vpt);
                        canvas.requestRenderAll();
                      }
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Artboard Size (W, H) */}
          <div className="flex items-center gap-3 border-r border-zinc-800 pr-4">
            <div className="flex items-center gap-1.5">
              <Maximize2 size={12} className="text-zinc-500" />
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-500 font-bold">{t('editor.panels.width_short', 'W')}</span>
                <input 
                  type="text" 
                  value={formatValue?.(artboardSize?.width || 0)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(',', '.'));
                    if (!isNaN(val)) {
                      const factor = UNITS?.find(u => u.id === unit)?.factor || 1;
                      const newWidth = val * factor;
                      setArtboardSize?.(prev => ({ ...prev, width: newWidth }));
                      if (canvas) {
                        canvas.setDimensions({ width: newWidth, height: canvas.height! });
                        canvas.renderAll();
                      }
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-500 font-bold">{t('editor.panels.height_short', 'H')}</span>
                <input 
                  type="text" 
                  value={formatValue?.(artboardSize?.height || 0)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(',', '.'));
                    if (!isNaN(val)) {
                      const factor = UNITS?.find(u => u.id === unit)?.factor || 1;
                      const newHeight = val * factor;
                      setArtboardSize?.(prev => ({ ...prev, height: newHeight }));
                      if (canvas) {
                        canvas.setDimensions({ width: canvas.width!, height: newHeight });
                        canvas.renderAll();
                      }
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-2 border-r border-zinc-800 pr-4">
            <Layout size={12} className="text-zinc-500" />
            <select 
              value={canvasPreset} 
              onChange={(e) => {
                const preset = CANVAS_PRESETS?.find(p => p.id === e.target.value);
                if (preset) {
                  setCanvasPreset?.(preset.id);
                  if (preset.width && preset.height) {
                    setArtboardSize?.({ width: preset.width, height: preset.height });
                    if (canvas) {
                      canvas.setDimensions({ width: preset.width, height: preset.height });
                      canvas.renderAll();
                      updateLayers(canvas);
                    }
                  }
                }
              }}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-blue-500 w-32"
            >
              {CANVAS_PRESETS?.map(p => (
                <option key={p.id} value={p.id}>{t(p.label, p.id) as string}</option>
              ))}
            </select>
          </div>

          {/* Background Opacity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sliders size={12} className="text-zinc-500" />
              <span className="text-[9px] text-zinc-500 font-bold">{t('editor.panels.bg_opacity_short', 'Fundo')}</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={getBackgroundOpacity?.() || 100} 
                onChange={(e) => updateBackgroundOpacity?.(parseInt(e.target.value))}
                className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
              />
              <span className="text-[9px] text-zinc-500 font-mono w-8">{getBackgroundOpacity?.() || 100}%</span>
            </div>
          </div>
          </div>
        )
      ) : (
        <div className="flex-grow min-w-0 flex items-center gap-2">
          {activeObject && activeObject.type === 'activeSelection' && (
            <div className="flex items-center gap-1 border-r border-zinc-800 pr-2 mr-2">
              <button 
                onClick={() => handlePathfinder('union')}
                className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                title={t('editor.pathfinder.union', 'Unir')}
              >
                <Ungroup size={16} />
              </button>
              <button 
                onClick={() => handlePathfinder('subtract')}
                className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                title={t('editor.pathfinder.subtract', 'Subtrair')}
              >
                <Minus size={16} />
              </button>
              <button 
                onClick={() => handlePathfinder('intersect')}
                className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                title={t('editor.pathfinder.intersect', 'Interseção')}
              >
                <BoxSelect size={16} />
              </button>
              <button 
                onClick={() => handlePathfinder('exclude')}
                className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                title={t('editor.pathfinder.exclude', 'Excluir')}
              >
                <X size={16} />
              </button>
              
              <div className="w-px h-4 bg-zinc-800 mx-1" />
              
              <button 
                onClick={() => { handlePowerClip?.(); canvas && saveToHistory(canvas); }}
                className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-blue-400 hover:text-blue-300"
                title={t('editor.powerclip.place_inside', 'PowerClip (Place Inside)')}
              >
                <Scissors size={16} />
              </button>
            </div>
          )}

          {isPowerClipEditing && (
            <div className="flex items-center gap-2 border-r border-zinc-800 pr-2 mr-2">
              <button 
                onClick={() => { exitPowerClipEdit?.(); canvas && saveToHistory(canvas); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold transition-colors"
                title={t('editor.powerclip.finish_editing', 'Finish PowerClip Editing')}
              >
                <Check size={14} />
                {t('editor.powerclip.finish', 'Finish Edit')}
              </button>
            </div>
          )}

          {!isPdfMode && (
            <div className="flex items-center gap-1 mr-2 relative">
              {/* Alinhamento ao... Toggle */}
              <div className="relative group mr-1">
                <button 
                  className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white flex items-center gap-0.5"
                  title={alignmentMode === 'selection' ? t('editor.tools.align_to_selection', 'Align to Selection') : t('editor.tools.align_to_artboard', 'Align to Artboard')}
                >
                  {alignmentMode === 'selection' ? <BoxSelect size={16} className="text-zinc-300" /> : <Layout size={16} className="text-blue-400" />}
                  <ChevronDown size={8} />
                </button>
                <div className="absolute left-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] py-1">
                  <button 
                    onClick={() => setAlignmentMode?.('selection')}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-[10px] hover:bg-zinc-800 flex items-center gap-2",
                      alignmentMode === 'selection' ? "text-blue-500" : "text-zinc-400"
                    )}
                  >
                    <div className="w-4 flex justify-center">
                      {alignmentMode === 'selection' && <Check size={10} />}
                    </div>
                    <BoxSelect size={12} />
                    {t('editor.tools.align_to_selection', 'Align to Selection')}
                  </button>
                  <button 
                    onClick={() => setAlignmentMode?.('artboard')}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-[10px] hover:bg-zinc-800 flex items-center gap-2",
                      alignmentMode === 'artboard' ? "text-blue-500" : "text-zinc-400"
                    )}
                  >
                    <div className="w-4 flex justify-center">
                      {alignmentMode === 'artboard' && <Check size={10} />}
                    </div>
                    <Layout size={12} />
                    {t('editor.tools.align_to_artboard', 'Align to Artboard')}
                  </button>
                </div>
              </div>

              <div className="w-px h-4 bg-zinc-800 mx-1" />

              {/* Controles de Alinhamento */}
              <div className="flex items-center gap-0.5">
                <button 
                  onClick={() => alignActiveObject('left')}
                  className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                  title={t('editor.tools.align_left', 'Align Left')}
                >
                  <AlignLeft size={16} />
                </button>
                <button 
                  onClick={() => alignActiveObject('center')}
                  className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                  title={t('editor.tools.align_center', 'Align Horizontally')}
                >
                  <AlignCenter size={16} />
                </button>
                <button 
                  onClick={() => alignActiveObject('right')}
                  className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                  title={t('editor.tools.align_right', 'Align Right')}
                >
                  <AlignRight size={16} />
                </button>
                
                <div className="w-px h-4 bg-zinc-800 mx-1" />
                
                <button 
                  onClick={() => alignActiveObject('top')}
                  className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                  title={t('editor.tools.align_top', 'Align Top')}
                >
                  <AlignStartVertical size={16} />
                </button>
                <button 
                  onClick={() => alignActiveObject('middle')}
                  className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                  title={t('editor.tools.align_middle', 'Align Vertically')}
                >
                  <AlignCenterVertical size={16} />
                </button>
                <button 
                  onClick={() => alignActiveObject('bottom')}
                  className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                  title={t('editor.tools.align_bottom', 'Align Bottom')}
                >
                  <AlignEndVertical size={16} />
                </button>
              </div>

              <div className="w-px h-4 bg-zinc-800 mx-1" />
              
              <button 
                onClick={() => flipActiveObject('horizontal')}
                className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                title={t('editor.tools.flip_horizontal', 'Virar horizontalmente')}
              >
                <FlipHorizontal size={16} />
              </button>
              <button 
                onClick={() => flipActiveObject('vertical')}
                className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                title={t('editor.tools.flip_vertical', 'Virar verticalmente')}
              >
                <FlipVertical size={16} />
              </button>
              <div className="w-px h-4 bg-zinc-800 mx-1" />
              <div className="flex items-center gap-1 bg-zinc-900 rounded border border-zinc-800 px-1.5 py-0.5">
                <RotateCw size={12} className="text-zinc-500" />
                <select 
                  value={Math.round(activeObject.angle || 0)}
                  onChange={(e) => updateActiveObject('angle', parseInt(e.target.value))}
                  className="bg-transparent text-[10px] text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="0">0°</option>
                  <option value="30">30°</option>
                  <option value="60">60°</option>
                  <option value="90">90°</option>
                  <option value="120">120°</option>
                  <option value="150">150°</option>
                  <option value="180">180°</option>
                  <option value="210">210°</option>
                  <option value="240">240°</option>
                  <option value="270">270°</option>
                  <option value="300">300°</option>
                  <option value="330">330°</option>
                </select>
              </div>
            </div>
          )}

      {/* Text Controls (Conditional) */}
      {(activeObject.type === 'i-text' || activeObject.type === 'text' || activeObject.type === 'textbox' || (activeObject.type === 'activeSelection' && activeObject.getObjects().some((obj: any) => obj.type?.includes('text')))) && !activeObject.isTextOnPath && (
        <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
          <div className="flex items-center gap-1">
            <select 
              value={activeObject.fontFamily}
              onChange={(e) => {
                if (e.target.value === 'IMPORT_CTA') {
                  fontInputRef.current?.click();
                } else {
                  updateActiveObject('fontFamily', e.target.value);
                }
              }}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 w-24"
            >
              {fonts.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
              <option value="IMPORT_CTA" className="text-blue-500 font-bold bg-blue-500/10">
                {t('editor.panels.import_font_option', '+ Importar fonte')}
              </option>
            </select>
            <select 
              value={activeObject.fontWeight || 'normal'} 
              onChange={(e) => updateActiveObject('fontWeight', e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 w-20"
            >
              <option value="100">{t('editor.panels.thin', 'Thin')}</option>
              <option value="200">{t('editor.panels.extra_light', 'Extra Light')}</option>
              <option value="300">{t('editor.panels.light', 'Light')}</option>
              <option value="normal">{t('editor.panels.regular', 'Regular')}</option>
              <option value="500">{t('editor.panels.medium', 'Medium')}</option>
              <option value="600">{t('editor.panels.semi_bold', 'Semi Bold')}</option>
              <option value="bold">{t('editor.panels.bold', 'Bold')}</option>
              <option value="800">{t('editor.panels.extra_bold', 'Extra Bold')}</option>
              <option value="900">{t('editor.panels.black', 'Black')}</option>
            </select>
            <button 
              onClick={() => fontInputRef.current?.click()}
              className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-blue-500"
              title={t('editor.panels.import_font', 'Importar Fonte')}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => updateActiveObject('fontSize', Math.max(1, (activeObject.fontSize || 40) - 1))}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
            >
              <Minus size={12} />
            </button>
            <input 
              type="number"
              value={Math.round(activeObject.fontSize || 40)}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) updateActiveObject('fontSize', val);
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-1 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button 
              onClick={() => updateActiveObject('fontSize', (activeObject.fontSize || 40) + 1)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
            >
              <Plus size={12} />
            </button>
            <span className="text-[10px] text-zinc-500 ml-1">px</span>
          </div>

          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            <span className="text-[9px] text-zinc-500 font-bold">{t('editor.tools.tracking', 'Tracking')}</span>
            <input 
              type="number"
              value={activeObject.charSpacing || 0}
              onChange={(e) => updateActiveObject('charSpacing', parseInt(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-12 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300"
              step="10"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            <span className="text-[9px] text-zinc-500 font-bold">{t('editor.tools.line_height_label', 'Entrelinhas')}</span>
            <input 
              type="number"
              value={activeObject.lineHeight || 1.16}
              onChange={(e) => updateActiveObject('lineHeight', parseFloat(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-12 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300"
              step="0.1"
            />
          </div>

          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button 
              onClick={() => toggleTextProperty('fontWeight')}
              className={cn("p-1 hover:bg-zinc-800 rounded transition-colors", activeObject.fontWeight === 'bold' ? "bg-blue-600 text-white" : "text-zinc-400")}
              title={t('editor.tools.bold_action', 'Negrito')}
            >
              <Bold size={14} />
            </button>
            <button 
              onClick={() => toggleTextProperty('fontStyle')}
              className={cn("p-1 hover:bg-zinc-800 rounded transition-colors", activeObject.fontStyle === 'italic' ? "bg-blue-600 text-white" : "text-zinc-400")}
              title={t('editor.tools.italic_action', 'Itálico')}
            >
              <Italic size={14} />
            </button>
            <button 
              onClick={() => toggleTextProperty('underline')}
              className={cn("p-1 hover:bg-zinc-800 rounded transition-colors", activeObject.underline ? "bg-blue-600 text-white" : "text-zinc-400")}
              title={t('editor.tools.underline_action', 'Sublinhado')}
            >
              <Underline size={14} />
            </button>
          </div>

          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button 
              onClick={() => {
                if (activeObject?.type?.includes('text')) {
                  updateActiveObject('textAlign', 'left');
                }
              }}
              className={cn("p-1 hover:bg-zinc-800 rounded transition-colors", activeObject.textAlign === 'left' ? "bg-blue-600 text-white" : "text-zinc-400")}
              title={t('editor.tools.align_text_left', 'Alinhar Texto à Esquerda')}
            >
              <AlignLeft size={14} />
            </button>
            <button 
              onClick={() => {
                if (activeObject?.type?.includes('text')) {
                  updateActiveObject('textAlign', 'center');
                }
              }}
              className={cn("p-1 hover:bg-zinc-800 rounded transition-colors", activeObject.textAlign === 'center' ? "bg-blue-600 text-white" : "text-zinc-400")}
              title={t('editor.tools.align_text_center', 'Alinhar Texto ao Centro')}
            >
              <AlignCenter size={14} />
            </button>
            <button 
              onClick={() => {
                if (activeObject?.type?.includes('text')) {
                  updateActiveObject('textAlign', 'right');
                }
              }}
              className={cn("p-1 hover:bg-zinc-800 rounded transition-colors", activeObject.textAlign === 'right' ? "bg-blue-600 text-white" : "text-zinc-400")}
              title={t('editor.tools.align_text_right', 'Alinhar Texto à Direita')}
            >
              <AlignRight size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <ColorPicker 
              color={toHex(activeObject.fill as string || '#000000')} 
              onChange={(color) => updateActiveObject('fill', color)}
              variant="square"
              side="bottom"
            />
          </div>
        </div>
      )}

      {/* Shape Controls (Conditional) */}
      {activeObject && (activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'triangle' || activeObject.type === 'path' || activeObject.type === 'polygon' || activeObject.type === 'polyline' || activeObject.type === 'activeSelection') && (
        <div className="flex items-center gap-3 border-l border-zinc-800 pl-4 ml-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.fill_label', 'Preenchimento')}</span>
            <ColorPicker 
              color={toHex((activeObject.type === 'activeSelection' ? activeObject.getObjects()[0]?.fill : activeObject.fill) as string || '#000000')} 
              onChange={(color) => updateActiveObject('fill', color)}
              variant="square"
              side="bottom"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.border', 'Borda')}</span>
            <ColorPicker 
              color={toHex((activeObject.type === 'activeSelection' ? activeObject.getObjects()[0]?.stroke : activeObject.stroke) as string || '#000000')} 
              onChange={(color) => updateActiveObject('stroke', color)}
              variant="square"
              side="bottom"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.thickness', 'Espessura')}</span>
            <input 
              type="number"
              min="0"
              max="200"
              value={activeObject.type === 'activeSelection' ? 
                (activeObject.getObjects()[0]?._originalStrokeWidth !== undefined ? activeObject.getObjects()[0]._originalStrokeWidth : (activeObject.getObjects()[0]?.strokeWidth || 0)) : 
                (activeObject._originalStrokeWidth !== undefined ? activeObject._originalStrokeWidth : (activeObject.strokeWidth || 0))}
              onFocus={() => {
                if (!activeObject.stroke || activeObject.stroke === 'transparent') {
                  updateActiveObject('stroke', '#000000');
                  if (!activeObject.strokeWidth) {
                    updateActiveObject('strokeWidth', 1);
                  }
                }
              }}
              onChange={(e) => updateActiveObject('strokeWidth', parseInt(e.target.value), true)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              onBlur={() => saveToHistory(canvas)}
              className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300"
            />
          </div>
          {(activeObject.type === 'rect' || activeObject.type === 'textbox' || (activeObject.type === 'activeSelection' && activeObject.getObjects().some((obj: any) => (obj.type === 'rect' || obj.type === 'textbox')))) && (
            <div className="flex items-center gap-1.5 px-2 border-l border-zinc-800 ml-2">
              <span className="text-[9px] text-zinc-500 font-bold tracking-wider mr-1">{t('editor.tools.round', 'Arredondar')}</span>
              
              <button 
                onClick={() => {
                  const isLinked = activeObject.get('cornersLinked') !== false;
                  updateActiveObject('cornersLinked', !isLinked, true);
                  if (!isLinked) {
                    const val = activeObject.radiusTopLeft || activeObject.rx || 0;
                    updateActiveObject('rx', val, true);
                    updateActiveObject('ry', val, true);
                    updateActiveObject('radiusTopLeft', val, true);
                    updateActiveObject('radiusTopRight', val, true);
                    updateActiveObject('radiusBottomRight', val, true);
                    updateActiveObject('radiusBottomLeft', val, true);
                  }
                  saveToHistory(canvas);
                  forceUpdate();
                }}
                className={cn(
                  "p-1 rounded hover:bg-zinc-800 transition-colors mr-1",
                  activeObject.get('cornersLinked') !== false ? "text-blue-500" : "text-zinc-500"
                )}
                title={activeObject.get('cornersLinked') !== false ? t('editor.tools.unlink_corners', 'Sincronizar cantos') : t('editor.tools.link_corners', 'Individualizar cantos')}
              >
                {activeObject.get('cornersLinked') !== false ? <LinkIcon size={12} /> : <UnlinkIcon size={12} />}
              </button>

              {activeObject.get('cornersLinked') !== false ? (
                <input 
                  type="text"
                  inputMode="numeric"
                  value={Math.round((activeObject.type === 'activeSelection' ? (activeObject.getObjects().find((obj: any) => (obj.type === 'rect' || obj.type === 'textbox'))?.rx || 0) : (activeObject.rx || 0)) * (activeObject.scaleX || 1))}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                    if (cleanVal === '') {
                      // Allow empty for typing, but set to 0 in fabric
                      updateActiveObject('rx', 0, true);
                      return;
                    }
                    const val = parseInt(cleanVal) || 0;
                    updateActiveObject('rx', val, true);
                    updateActiveObject('ry', val, true);
                    updateActiveObject('radiusTopLeft', val, true);
                    updateActiveObject('radiusTopRight', val, true);
                    updateActiveObject('radiusBottomRight', val, true);
                    updateActiveObject('radiusBottomLeft', val, true);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  onBlur={() => saveToHistory(canvas)}
                  className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 text-center"
                />
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] text-zinc-600 font-bold">TL</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={Math.round((activeObject.radiusTopLeft || 0) * (activeObject.scaleX || 1))}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                        const val = cleanVal === '' ? 0 : parseInt(cleanVal) || 0;
                        updateActiveObject('radiusTopLeft', val, true);
                      }}
                      onBlur={() => saveToHistory(canvas)}
                      className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] text-zinc-600 font-bold">TR</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={Math.round((activeObject.radiusTopRight || 0) * (activeObject.scaleX || 1))}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                        const val = cleanVal === '' ? 0 : parseInt(cleanVal) || 0;
                        updateActiveObject('radiusTopRight', val, true);
                      }}
                      onBlur={() => saveToHistory(canvas)}
                      className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] text-zinc-600 font-bold">BL</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={Math.round((activeObject.radiusBottomLeft || 0) * (activeObject.scaleX || 1))}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                        const val = cleanVal === '' ? 0 : parseInt(cleanVal) || 0;
                        updateActiveObject('radiusBottomLeft', val, true);
                      }}
                      onBlur={() => saveToHistory(canvas)}
                      className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] text-zinc-600 font-bold">BR</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={Math.round((activeObject.radiusBottomRight || 0) * (activeObject.scaleX || 1))}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                        const val = cleanVal === '' ? 0 : parseInt(cleanVal) || 0;
                        updateActiveObject('radiusBottomRight', val, true);
                      }}
                      onBlur={() => saveToHistory(canvas)}
                      className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 text-center"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Icon Controls (Conditional) */}
      {activeObject && activeObject.get('isIcon') && (
        <div className="flex items-center gap-3 border-l border-zinc-800 pl-4 ml-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.fill_label', 'Preenchimento')}</span>
            <ColorPicker 
              color={toHex((activeObject.fill as string) || (activeObject.getObjects?.()?.[0]?.fill as string))} 
              onChange={(color) => updateActiveObject('fill', color)}
              variant="square"
              side="bottom"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.border', 'Borda')}</span>
            <ColorPicker 
              color={toHex((activeObject.stroke as string) || (activeObject.getObjects?.()?.[0]?.stroke as string))} 
              onChange={(color) => updateActiveObject('stroke', color)}
              variant="square"
              side="bottom"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.thickness', 'Espessura')}</span>
            <input 
              type="number"
              min="0"
              max="200"
              value={(activeObject._originalStrokeWidth || activeObject.strokeWidth || activeObject.getObjects?.()?.[0]?._originalStrokeWidth || activeObject.getObjects?.()?.[0]?.strokeWidth) || 0}
              onChange={(e) => updateActiveObject('strokeWidth', parseInt(e.target.value), true)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              onBlur={() => saveToHistory(canvas)}
              className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300"
            />
          </div>
        </div>
      )}

      {/* Opacity & Blend Mode Controls (For all objects) */}
      {activeObject && (
        <div className="flex items-center gap-3 border-l border-zinc-800 pl-4 ml-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.blend_mode', 'Mesclagem')}</span>
            <select 
              value={activeObject.globalCompositeOperation || 'source-over'}
              onChange={(e) => updateActiveObject('globalCompositeOperation', e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 w-24"
            >
              <option value="source-over">{t('editor.constants.blend_modes.normal', 'Normal')}</option>
              <option value="darken">{t('editor.constants.blend_modes.darken', 'Escurecer')}</option>
              <option value="multiply">{t('editor.constants.blend_modes.multiply', 'Multiplicar')}</option>
              <option value="color-burn">{t('editor.constants.blend_modes.color_burn', 'Subexposição de Cor')}</option>
              <option value="lighten">{t('editor.constants.blend_modes.lighten', 'Clarear')}</option>
              <option value="screen">{t('editor.constants.blend_modes.screen', 'Divisão')}</option>
              <option value="color-dodge">{t('editor.constants.blend_modes.color_dodge', 'Subexposição Linear')}</option>
              <option value="overlay">{t('editor.constants.blend_modes.overlay', 'Sobrepor')}</option>
              <option value="soft-light">{t('editor.constants.blend_modes.soft_light', 'Luz Suave')}</option>
              <option value="hard-light">{t('editor.constants.blend_modes.hard_light', 'Luz Direta')}</option>
              <option value="difference">{t('editor.constants.blend_modes.difference', 'Diferença')}</option>
              <option value="exclusion">{t('editor.constants.blend_modes.exclusion', 'Exclusão')}</option>
              <option value="hue">{t('editor.constants.blend_modes.hue', 'Matiz')}</option>
              <option value="saturation">{t('editor.constants.blend_modes.saturation', 'Saturação')}</option>
              <option value="color">{t('editor.constants.blend_modes.color', 'Cor')}</option>
              <option value="luminosity">{t('editor.constants.blend_modes.luminosity', 'Luminosidade')}</option>
            </select>
          </div>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.opacity', 'Opacidade')}</span>
            <input 
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round((activeObject.opacity || 1) * 100)}
              onChange={(e) => updateActiveObject('opacity', parseFloat(e.target.value))}
              className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[9px] text-zinc-500 font-mono w-6">{Math.round((activeObject.opacity || 1) * 100)}%</span>
          </div>
        </div>
      )}



      <div className="flex items-center gap-1 border-l border-zinc-800 pl-4 ml-2">
        <button 
          onClick={duplicateObject}
          className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
          title={t('editor.header.duplicate', 'Duplicar')}
        >
          <Copy size={16} />
        </button>
        <button 
          onClick={deleteActive}
          className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-red-500 hover:bg-red-500/10"
          title={t('editor.header.delete', 'Excluir')}
        >
          <Trash2 size={16} />
        </button>
      </div>
        </div>
      )}
    </div>
  );
};
