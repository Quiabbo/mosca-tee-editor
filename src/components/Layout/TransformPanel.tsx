import React from 'react';
import { fabric } from 'fabric';
import { 
  ChevronDown, Check, Wand2, Sparkles, Zap, Minus, Sliders 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { useA11yStore } from '../../store/useA11yStore';
import { speech } from '../../services/speechService';

interface TransformPanelProps {
  activeObject: any;
  unit: string;
  setUnit: (unit: any) => void;
  UNITS: any[];
  formatValue: (val: number) => string;
  updateActiveObject: (key: string, value: any, skipHistory?: boolean) => void;
  IMAGE_FILTERS: any[];
  applyImageFilter: (id: string) => void;
  handleRemoveBackground: () => void;
  isRemovingBg: boolean;
  bgRemovalProgress: number;
  handleVectorize: () => void;
  refinement: number;
  setRefinement: (val: number) => void;
  handleCompress: () => void;
  offset: { x: number, y: number };
  setOffset: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  artboardSize: { width: number, height: number };
  setArtboardSize: React.Dispatch<React.SetStateAction<{ width: number, height: number }>>;
  canvas: fabric.Canvas | null;
  canvasPreset: string;
  setCanvasPreset: (preset: string) => void;
  CANVAS_PRESETS: any[];
  updateLayers: (canvas: fabric.Canvas) => void;
  saveToHistory: (canvas: fabric.Canvas) => void;
  getBackgroundOpacity: () => number;
  updateBackgroundOpacity: (val: number) => void;
  handleSelectSubject: () => void;
}

export const TransformPanel: React.FC<TransformPanelProps> = ({
  activeObject,
  unit,
  setUnit,
  UNITS,
  formatValue,
  updateActiveObject,
  IMAGE_FILTERS,
  applyImageFilter,
  handleRemoveBackground,
  isRemovingBg,
  bgRemovalProgress,
  handleVectorize,
  refinement,
  setRefinement,
  handleCompress,
  offset,
  setOffset,
  artboardSize,
  setArtboardSize,
  canvas,
  canvasPreset,
  setCanvasPreset,
  CANVAS_PRESETS,
  updateLayers,
  saveToHistory,
  getBackgroundOpacity,
  updateBackgroundOpacity,
  handleSelectSubject
}) => {
  const { t } = useTranslation();
  const { blindMode } = useA11yStore();

  const announce = (msg: string) => {
    if (blindMode) speech.speak(msg);
  };

  const handleUnitChange = (u: any) => {
    setUnit(u);
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar h-full">
      {activeObject ? (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.position_size', 'Position and size')}</span>
              <div className="relative group">
                <button className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-white bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  {t(UNITS.find(u => u.id === unit)?.label || '', unit) as string} <ChevronDown size={10} />
                </button>
                <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {UNITS.map(u => (
                    <button 
                      key={u.id}
                      onClick={() => handleUnitChange(u.id)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-[10px] hover:bg-zinc-800 flex items-center justify-between",
                        unit === u.id && "text-zinc-300"
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
                    onFocus={() => announce('X')}
                    onChange={(e) => {
                      const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                      updateActiveObject('left', parseFloat(e.target.value) * factor, true);
                    }}
                    onBlur={() => saveToHistory(canvas!)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs pr-6" 
                    aria-label="X"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600">{unit === 'percent' ? '%' : unit}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500">Y</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formatValue(activeObject.top)} 
                    onFocus={() => announce('Y')}
                    onChange={(e) => {
                      const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                      updateActiveObject('top', parseFloat(e.target.value) * factor, true);
                    }}
                    onBlur={() => saveToHistory(canvas!)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs pr-6" 
                    aria-label="Y"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600">{unit === 'percent' ? '%' : unit}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.width', 'Width')}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formatValue(activeObject.width * activeObject.scaleX)} 
                    onFocus={() => announce(t('editor.panels.width'))}
                    onChange={(e) => {
                      const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                      const val = parseFloat(e.target.value) * factor;
                      updateActiveObject('scaleX', val / activeObject.width, true);
                    }}
                    onBlur={() => saveToHistory(canvas!)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs pr-6" 
                    aria-label={t('editor.panels.width')}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600">{unit === 'percent' ? '%' : unit}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.height', 'Height')}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formatValue(activeObject.height * activeObject.scaleY)} 
                    onFocus={() => announce(t('editor.panels.height'))}
                    onChange={(e) => {
                      const factor = UNITS.find(u => u.id === unit)?.factor || 1;
                      const val = parseFloat(e.target.value) * factor;
                      updateActiveObject('scaleY', val / activeObject.height, true);
                    }}
                    onBlur={() => saveToHistory(canvas!)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs pr-6" 
                    aria-label={t('editor.panels.height')}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600">{unit === 'percent' ? '%' : unit}</span>
                </div>
              </div>
            </div>
          </div>

          {activeObject.type === 'image' && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.filters', 'Filters')}</span>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_FILTERS.map(filter => (
                  <button 
                    key={filter.id}
                    onClick={() => {
                      applyImageFilter(filter.id);
                      announce(`${t('editor.panels.filters')}: ${t(filter.label, filter.id)}`);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-center gap-2",
                      "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 shadow-sm"
                    )}
                  >
                    <span className="text-[10px] font-bold text-zinc-300 leading-tight">
                      {t(filter.label, filter.id) as string}
                    </span>
                  </button>
                ))}
              </div>

              <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.image_tools', 'Image Tools')}</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    handleRemoveBackground();
                    announce(t('editor.panels.remove_bg'));
                  }}
                  disabled={isRemovingBg}
                  className="px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold hover:bg-zinc-800 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Wand2 size={12} className={cn("text-blue-500", isRemovingBg && "animate-pulse")} /> 
                  {isRemovingBg ? `${t('editor.panels.removing', 'Removing')} (${bgRemovalProgress}%)` : t('editor.panels.remove_bg', 'Remove Background')}
                </button>

                <button 
                  onClick={() => {
                    handleSelectSubject();
                    announce(t('editor.panels.select_subject'));
                  }}
                  className="px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold hover:bg-zinc-800 flex items-center justify-center gap-2"
                >
                  <Sparkles size={12} className="text-purple-500" /> {t('editor.panels.select_subject', 'Select Subject')}
                </button>
                
                <button 
                  onClick={() => {
                    handleVectorize();
                    announce(t('editor.panels.vectorize'));
                  }}
                  className="px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold hover:bg-zinc-800 flex items-center justify-center gap-2"
                >
                  <Zap size={12} className="text-emerald-500" /> {t('editor.panels.vectorize', 'Vectorize')}
                </button>

                {(activeObject.isProcessed || activeObject.get('isProcessed')) && (
                  <div className="col-span-2 space-y-3 px-1 pt-2 border-t border-zinc-800/50 mt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] text-zinc-400 font-bold flex items-center gap-1.5">
                        <Sliders size={10} className="text-zinc-400" /> {t('editor.panels.refinement', 'Refinement (Edges)')}
                      </label>
                      <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">{refinement}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={refinement} 
                      onChange={(e) => setRefinement(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
                    />
                    <div className="flex justify-between text-[7px] text-zinc-600 font-bold px-0.5">
                      <span>{t('editor.panels.harder', 'Harder')}</span>
                      <span>{t('editor.panels.default', 'Default')}</span>
                      <span>{t('editor.panels.softer', 'Softer')}</span>
                    </div>
                    <p className="text-[8px] text-zinc-600 leading-tight italic">
                      {t('editor.panels.refinement_hint', 'Use the slider to refine the edges of the image after background removal.')}
                    </p>
                  </div>
                )}
                
                <button 
                  onClick={handleCompress}
                  className="px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold hover:bg-zinc-800 flex items-center justify-center gap-2"
                >
                  <Minus size={12} className="text-amber-500" /> {t('editor.panels.compress', 'Compress')}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.appearance', 'Appearance')}</span>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.opacity', 'Opacity')}</label>
                <span className="text-[9px] text-zinc-500">{Math.round(activeObject.opacity * 100)}% {t('editor.panels.opacity', 'Opacity')}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={activeObject.opacity * 100} 
                onChange={(e) => updateActiveObject('opacity', parseInt(e.target.value) / 100, true)}
                onBlur={() => saveToHistory(canvas!)}
                className="w-full" 
              />
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.workspace', 'Espaço de trabalho')}</span>
              <div className="relative group">
                <button className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-white bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  {t(UNITS.find(u => u.id === unit)?.label || '', unit) as string} <ChevronDown size={10} />
                </button>
                <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {UNITS.map(u => (
                    <button 
                      key={u.id}
                      onClick={() => handleUnitChange(u.id)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-[10px] hover:bg-zinc-800 flex items-center justify-between",
                        unit === u.id && "text-zinc-300"
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
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-white"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600">{unit}</span>
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
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-white"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600">{unit}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.width', 'Width')}</label>
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
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-white"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600">{unit}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.height', 'Height')}</label>
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
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-white"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600">{unit}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.document', 'Document')}</span>
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs"
                >
                  <optgroup label={t('editor.constants.categories.custom', 'Custom')}>
                    {CANVAS_PRESETS.filter(p => p.category === 'editor.constants.categories.custom').map(p => (
                      <option key={p.id} value={p.id}>{t(p.label, p.id) as string}</option>
                    ))}
                  </optgroup>
                  <optgroup label={t('editor.constants.categories.social', 'Social Media')}>
                    {CANVAS_PRESETS.filter(p => p.category === 'editor.constants.categories.social').map(p => (
                      <option key={p.id} value={p.id}>{t(p.label, p.id) as string}</option>
                    ))}
                  </optgroup>
                  <optgroup label={t('editor.constants.categories.ui_ux', 'UI/UX Design')}>
                    {CANVAS_PRESETS.filter(p => p.category === 'editor.constants.categories.ui_ux').map(p => (
                      <option key={p.id} value={p.id}>{t(p.label, p.id) as string}</option>
                    ))}
                  </optgroup>
                  <optgroup label={t('editor.constants.categories.presentation', 'Presentation')}>
                    {CANVAS_PRESETS.filter(p => p.category === 'editor.constants.categories.presentation').map(p => (
                      <option key={p.id} value={p.id}>{t(p.label, p.id) as string}</option>
                    ))}
                  </optgroup>
                  <optgroup label={t('editor.constants.categories.web', 'Web')}>
                    {CANVAS_PRESETS.filter(p => p.category === 'editor.constants.categories.web').map(p => (
                      <option key={p.id} value={p.id}>{t(p.label, p.id) as string}</option>
                    ))}
                  </optgroup>
                  <optgroup label={t('editor.constants.categories.video', 'Video / Motion')}>
                    {CANVAS_PRESETS.filter(p => p.category === 'editor.constants.categories.video').map(p => (
                      <option key={p.id} value={p.id}>{t(p.label, p.id) as string}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.background_settings', 'Background Settings')}</span>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.background_opacity', 'Background Opacity')}</label>
                <span className="text-[9px] text-zinc-500">{getBackgroundOpacity()}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={getBackgroundOpacity()} 
                onChange={(e) => updateBackgroundOpacity(parseInt(e.target.value))}
                className="w-full" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
