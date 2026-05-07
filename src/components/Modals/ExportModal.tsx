import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, FileText, Image as ImageIcon, FileCode, FileJson, 
  Settings2, Layers, Check, Loader2, ChevronLeft, ChevronRight,
  Eye, ShieldCheck, AlertCircle, Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { ExportOptions } from '../../types/tee';
import { useColorStore } from '../../store/useColorStore';
import { VISION_TYPES } from '../../constants/tee';
import { colord } from 'colord';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  canvas: any;
  artboardSize: { width: number; height: number };
  carouselPages: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, canvas, artboardSize, carouselPages }) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 0.9,
    multiplier: 1,
    area: 'canvas',
    transparent: false,
    exportLayers: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [activeVisionType, setActiveVisionType] = useState('normal');

  const { t } = useTranslation();

  // Helper for WCAG Luminance
  const getLuminance = (color: any) => {
    const c = colord(color).toRgb();
    const [r, g, b] = [c.r, c.g, c.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Contrast calculation
  const contrastRatio = useMemo(() => {
    if (!canvas) return 0;
    
    try {
      const artboards = canvas.getObjects().filter((obj: any) => obj.id && obj.id.toString().startsWith('artboard_bg'));
      const currentArtboard = artboards[currentPage];
      const bgColor = currentArtboard?.fill || canvas.backgroundColor || '#ffffff';
      
      // Get most prominent foreground color (simple heuristic: first object color)
      const visibleObjects = canvas.getObjects().filter((obj: any) => 
        obj.visible && 
        !obj.id?.toString().startsWith('artboard_bg') && 
        (obj.fill || obj.stroke)
      );
      
      const fgColor = visibleObjects[0]?.fill || visibleObjects[0]?.stroke || (colord(bgColor).isDark() ? '#ffffff' : '#000000');

      const l1 = getLuminance(bgColor);
      const l2 = getLuminance(fgColor);
      
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    } catch (e) {
      return 0;
    }
  }, [canvas, currentPage, isOpen]);

  const contrastLevel = useMemo(() => {
    if (contrastRatio >= 7) return { label: 'AAA', color: 'text-green-400', bg: 'bg-green-400/10', icon: ShieldCheck };
    if (contrastRatio >= 4.5) return { label: 'AA', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: ShieldCheck };
    if (contrastRatio >= 3) return { label: 'Large Text Only', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: AlertCircle };
    return { label: 'Fail', color: 'text-red-400', bg: 'bg-red-400/10', icon: X };
  }, [contrastRatio]);

  React.useEffect(() => {
    if (!canvas || !isOpen) return;

    const artboards = canvas.getObjects().filter((obj: any) => obj.id && obj.id.toString().startsWith('artboard_bg'));
    const currentArtboard = artboards[currentPage];
    const originalBG = canvas.backgroundColor;
    const originalTransform = canvas.viewportTransform?.slice();
    const originalVisibilities = artboards.map((a: any) => a.visible);

    // Prepare for preview
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    if (options.transparent && options.format === 'png') {
      artboards.forEach((a: any) => a.set('visible', false));
      canvas.backgroundColor = undefined;
    } else {
      artboards.forEach((a: any, i: number) => a.set('visible', i === currentPage));
    }
    
    canvas.renderAll();

    const url = canvas.toDataURL({
      format: options.format === 'jpg' ? 'jpeg' : options.format,
      quality: options.quality,
      multiplier: 0.5,
      left: Math.round(currentPage * (artboardSize.width + 12)),
      top: 0,
      width: Math.round(artboardSize.width),
      height: Math.round(artboardSize.height)
    });

    setPreviewUrl(url);

    // Restore
    canvas.setViewportTransform(originalTransform!);
    canvas.backgroundColor = originalBG;
    artboards.forEach((a: any, i: number) => a.set('visible', originalVisibilities[i]));
    canvas.renderAll();
  }, [canvas, options, artboardSize, isOpen, currentPage]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(options);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
            <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-[95%] sm:w-[90%] lg:w-[70%] max-w-3xl bg-[#111111] shadow-2xl rounded-[12px] overflow-hidden border border-zinc-800 flex flex-col md:flex-row max-h-[85vh] sm:max-h-[85vh]"
          >
            {/* Preview Area */}
            <div className="flex-grow bg-[#050505] p-3 sm:p-4 lg:p-5 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-zinc-800 min-h-[280px] sm:min-h-[350px]">
              {/* Title aligned to the artboard container top-left */}
              <div className="absolute top-2 left-3 sm:top-3 sm:left-4 text-[9px] sm:text-[10px] font-bold text-zinc-500 z-20">
                {carouselPages > 1 
                  ? t('modals.export.preview_page', { current: currentPage + 1, total: carouselPages })
                  : t('modals.export.preview_title', 'Prévia da exportação')}
              </div>
              
              <div 
                className="relative group shadow-2xl overflow-hidden self-center mt-4"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
              >
                {/* Checkerboard background only behind the image */}
                <div className="absolute inset-0 z-0" 
                     style={{ 
                       backgroundImage: options.transparent ? 'conic-gradient(#1a1a1a 0.25turn, #0a0a0a 0.25turn 0.5turn, #1a1a1a 0.5turn 0.75turn, #0a0a0a 0.75turn)' : 'none', 
                       backgroundSize: '20px 20px',
                       backgroundColor: options.transparent ? 'transparent' : (canvas?.backgroundColor || '#ffffff')
                     }} 
                />
                
                {previewUrl && (
                  <img 
                    src={previewUrl} 
                    className="relative z-10 max-w-full max-h-[40vh] sm:max-h-[50vh] block transition-all duration-300"
                    alt="Export Preview"
                    style={{ 
                      filter: VISION_TYPES.find(v => v.id === activeVisionType)?.filter || 'none'
                    }}
                  />
                )}

                {/* Navigation Arrows */}
                {carouselPages > 1 && (
                  <div className="absolute inset-0 z-20 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPage(prev => (prev > 0 ? prev - 1 : carouselPages - 1));
                      }}
                      className="p-1 sm:p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-blue-600 transition-colors pointer-events-auto"
                    >
                      <ChevronLeft className="size-4 sm:size-5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPage(prev => (prev < carouselPages - 1 ? prev + 1 : 0));
                      }}
                      className="p-1 sm:p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-blue-600 transition-colors pointer-events-auto"
                    >
                      <ChevronRight className="size-4 sm:size-5" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Accessibility Insights */}
              <div className="mt-auto w-full pt-3 sm:pt-4 pb-1">
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Contrast Result */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Info size={10} className="text-zinc-500" />
                        <span className="text-[9px] font-bold text-zinc-500">{t('editor.accessibility.title', 'Acessibilidade')}</span>
                        <div className={cn("px-1 py-0.5 rounded text-[7px] font-bold", contrastLevel.bg, contrastLevel.color)}>
                          WCAG {contrastLevel.label}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400">{contrastRatio.toFixed(2)}:1</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (contrastRatio / 7) * 100)}%` }}
                        className={cn("h-full transition-colors", 
                          contrastRatio >= 4.5 ? "bg-green-500" : contrastRatio >= 3 ? "bg-yellow-500" : "bg-red-500"
                        )}
                      />
                    </div>
                  </div>

                  {/* Daltonism Miniatures */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Eye size={10} className="text-zinc-500" />
                        <span className="text-[9px] font-bold text-zinc-500">{t('editor.accessibility.daltonism', 'Daltonismo')}</span>
                      </div>
                      {activeVisionType !== 'normal' && (
                        <button 
                          onClick={() => setActiveVisionType('normal')}
                          className="text-[8px] text-blue-400 hover:text-blue-300 transition-colors font-bold"
                        >
                          {t('editor.accessibility.reset', 'Resetar')}
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-5 gap-1 sm:gap-1.5 items-end">
                      {VISION_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setActiveVisionType(type.id)}
                          className={cn(
                            "flex flex-col items-center gap-0.5 sm:gap-1 group transition-all",
                            activeVisionType === type.id ? "scale-105" : "hover:scale-105"
                          )}
                        >
                          <div 
                            className={cn(
                              "w-full rounded-sm overflow-hidden border transition-all flex items-center justify-center bg-black/20",
                              activeVisionType === type.id ? "border-blue-500 ring-1 ring-blue-500/20" : "border-zinc-800 group-hover:border-zinc-700"
                            )}
                            style={{ 
                              aspectRatio: `${artboardSize.width} / ${artboardSize.height}`,
                              maxHeight: '60px' 
                            }}
                          >
                            {previewUrl ? (
                              <img 
                                src={previewUrl} 
                                className="w-full h-full object-cover" 
                                style={{ filter: type.filter }}
                                alt={type.id}
                              />
                            ) : (
                              <div className="w-full h-full bg-zinc-900" />
                            )}
                          </div>
                          <span className={cn(
                            "text-[7px] text-center font-bold tracking-tight truncate w-full px-0.5",
                            activeVisionType === type.id ? "text-blue-400" : "text-zinc-600 group-hover:text-zinc-400"
                          )}>
                            {(() => {
                              const label = t(type.label).includes('.') ? t(type.label).split('.').pop() : t(type.label);
                              if (!label) return '';
                              if (label.toLowerCase() === 'normal') return t('editor.accessibility.vision_normal', 'Normal');
                              return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
                            })()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Area */}
            <div className="w-full md:w-[260px] lg:w-[280px] flex-shrink-0 p-3 sm:p-4 lg:p-5 flex flex-col bg-[#111111]">
              <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-5">
                <h2 className="text-xs sm:text-sm lg:text-base font-bold text-white flex items-center gap-2">
                  <Download className="size-3.5 sm:size-4 text-zinc-400" />
                  {t('modals.export.title', 'Exportar')}
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors">
                  <X className="size-3.5 sm:size-4" />
                </button>
              </div>

                <div className="flex-grow space-y-3 sm:space-y-4 pr-0.5">
                  {/* Format */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-500">{t('modals.export.format', 'Formato')}</label>
                    <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                      {(['png', 'jpg', 'webp', 'svg', 'pdf', 'psd'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setOptions({ ...options, format: f })}
                          className={cn(
                            "py-1 sm:py-1.5 rounded-lg border text-[8px] sm:text-[9px] font-bold transition-all",
                            options.format === f 
                              ? "bg-[#0f0f0f] border-zinc-700 text-white" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                          )}
                        >
                          {f === 'png' || f === 'jpg' || f === 'webp' || f === 'pdf' || f === 'psd' || f === 'svg' ? f.toUpperCase() : f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality / Resolution */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] sm:text-[10px] font-bold text-zinc-500">{t('modals.export.scale', 'Escala')}</label>
                      <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400">{options.multiplier}x</span>
                    </div>
                    <input 
                      type="range"
                      min="0.5"
                      max="4"
                      step="0.5"
                      value={options.multiplier}
                      onChange={(e) => setOptions({ ...options, multiplier: parseFloat(e.target.value) })}
                      className="w-full accent-blue-600 h-1"
                    />
                    
                    {options.format !== 'svg' && options.format !== 'pdf' && (
                      <div className="pt-0.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] sm:text-[10px] font-bold text-zinc-500">{t('modals.export.quality', 'Qualidade')}</label>
                          <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400">{Math.round(options.quality * 100)}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={options.quality}
                          onChange={(e) => setOptions({ ...options, quality: parseFloat(e.target.value) })}
                          className="w-full accent-blue-600 h-1"
                        />
                      </div>
                    )}
                  </div>

                {/* Options */}
                <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 border-t border-zinc-800/50">
                  <label className="text-[9px] sm:text-[10px] font-bold text-zinc-500">{t('modals.export.advanced_options', 'Opções avançadas')}</label>
                  
                  <div className="space-y-1 sm:space-y-1.5">
                    <button 
                      onClick={() => setOptions({ ...options, transparent: !options.transparent })}
                      className="w-full flex items-center justify-between p-1.5 sm:p-2 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 rounded border flex items-center justify-center transition-colors", options.transparent ? "bg-[#0f0f0f] border-zinc-700" : "border-zinc-700 group-hover:border-zinc-500")}>
                          {options.transparent && <Check size={8} className="text-white" />}
                        </div>
                        <span className="text-[10px] text-zinc-300">{t('modals.export.transparent_bg', 'Fundo transparente')}</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => setOptions({ ...options, exportLayers: !options.exportLayers })}
                      className="w-full flex items-center justify-between p-1.5 sm:p-2 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 rounded border flex items-center justify-center transition-colors", options.exportLayers ? "bg-[#0f0f0f] border-zinc-700" : "border-zinc-700 group-hover:border-zinc-500")}>
                          {options.exportLayers && <Check size={8} className="text-white" />}
                        </div>
                        <span className="text-[10px] text-zinc-300">{t('modals.export.export_layers', 'Exportar camadas (zip)')}</span>
                      </div>
                      <Layers size={12} className="text-zinc-600" />
                    </button>

                    </div>
                  </div>
                </div>

                  {/* Calculated Dimensions */}
                  <div className="pt-3 border-t border-zinc-800/50 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">{t('modals.new_doc.width', 'Largura')}</label>
                        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-300 font-mono flex items-center justify-between">
                          {Math.round(artboardSize.width * options.multiplier)}
                          <span className="text-[7px] text-zinc-600 font-sans font-bold">PX</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">{t('modals.new_doc.height', 'Altura')}</label>
                        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-300 font-mono flex items-center justify-between">
                          {Math.round(artboardSize.height * options.multiplier)}
                          <span className="text-[7px] text-zinc-600 font-sans font-bold">PX</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-3 sm:pt-4 mt-auto">
                    <button 
                      onClick={handleExport}
                      disabled={isExporting}
                      className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {t('modals.export.exporting_status', 'Exportando...')}
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          {t('modals.export.download_action', 'Baixar arquivo')}
                        </>
                      )}
                    </button>
                  </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExportModal;
