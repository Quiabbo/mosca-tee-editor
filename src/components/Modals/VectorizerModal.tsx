import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2, Settings2, RefreshCw, Download, Layers, Check, Loader2, Maximize2, Minimize2, Trash2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageTracer from 'imagetracerjs';
import { cn } from '../../lib/utils';

interface VectorizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (svgString: string) => void;
  imageUrl: string;
}

interface VectorizerOptions {
  ltres: number;
  qtres: number;
  pathomit: number;
  colorsampling: number;
  numberofcolors: number;
  mincolorratio: number;
  blurradius: number;
  pal: { r: number; g: number; b: number; a: number }[] | null;
}

const DEFAULT_OPTIONS: VectorizerOptions = {
  ltres: 1,
  qtres: 1,
  pathomit: 8,
  colorsampling: 2,
  numberofcolors: 16,
  mincolorratio: 0,
  blurradius: 0,
  pal: null
};

export const VectorizerModal: React.FC<VectorizerModalProps> = ({ isOpen, onClose, onApply, imageUrl }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState<VectorizerOptions>(DEFAULT_OPTIONS);
  const [debouncedOptions, setDebouncedOptions] = useState<VectorizerOptions>(DEFAULT_OPTIONS);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOptions(options);
    }, 500); // Higher debounce for vectorization as requested for maximum fluidity
    return () => clearTimeout(timer);
  }, [options]);

  const vectorize = useCallback(async (imgUrl: string, opts: VectorizerOptions) => {
    setIsProcessing(true);
    
    // Pequeno delay para garantir que o loader apareça antes da tarefa pesada
    setTimeout(async () => {
      try {
        // Opção: Redimensionar imagem internamente para acelerar drasticamente o ImageTracer
        const resizeImage = (url: string, maxWidth: number = 600): Promise<string> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              
              if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(url);
            img.src = url;
          });
        };

        const processedUrl = await resizeImage(imgUrl);

        ImageTracer.imageToSVG(
          processedUrl,
          (svgString: string) => {
            setSvgContent(svgString);
            setIsProcessing(false);
          },
          opts
        );
      } catch (error) {
        console.error('Vectorization error:', error);
        setIsProcessing(false);
      }
    }, 50);
  }, []);

  useEffect(() => {
    if (isOpen && imageUrl) {
      vectorize(imageUrl, debouncedOptions);
    }
  }, [isOpen, imageUrl, debouncedOptions, vectorize]);

  const updateOption = (key: keyof VectorizerOptions, value: number) => {
    setOptions(prev => ({ ...prev, [key]: value }));
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
            className="absolute inset-0 bg-transparent"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            drag
            dragMomentum={false}
            className="relative w-full max-w-[320px] bg-[#1e1e1e] rounded-2xl shadow-2xl overflow-hidden border border-zinc-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-[#191919] cursor-move">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                  <Zap size={16} />
                </div>
                <h2 className="text-xs font-bold text-white leading-none">
                  {t('modals.vectorizer.title', 'Vetorizar')}
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <X size={16} />
              </button>
            </div>

            {/* Controls Area */}
            <div className="p-4 flex flex-col gap-4">
              <div className="space-y-4 overflow-y-auto custom-scrollbar max-h-[350px] pr-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 tracking-wider">
                      <span className="capitalize">{t('modals.vectorizer.colors', 'cores').toLowerCase()}</span>
                      <input 
                        type="number"
                        value={options.numberofcolors}
                        onChange={(e) => updateOption('numberofcolors', parseInt(e.target.value) || 2)}
                        className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-white text-center focus:border-blue-500 outline-none text-[10px]"
                      />
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="16"
                      value={options.numberofcolors}
                      onChange={(e) => updateOption('numberofcolors', parseInt(e.target.value))}
                      className="w-full accent-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 tracking-wider">
                      <span className="capitalize">{t('modals.vectorizer.precision', 'precisão').toLowerCase()}</span>
                      <input 
                        type="number"
                        step="0.1"
                        value={options.ltres}
                        onChange={(e) => updateOption('ltres', parseFloat(e.target.value) || 0.1)}
                        className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-white text-center focus:border-blue-500 outline-none text-[10px]"
                      />
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={options.ltres}
                      onChange={(e) => updateOption('ltres', parseFloat(e.target.value))}
                      className="w-full accent-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 tracking-wider">
                      <span className="capitalize">{t('modals.vectorizer.smoothing', 'suavização').toLowerCase()}</span>
                      <input 
                        type="number"
                        step="0.1"
                        value={options.qtres}
                        onChange={(e) => updateOption('qtres', parseFloat(e.target.value) || 0.1)}
                        className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-white text-center focus:border-blue-500 outline-none text-[10px]"
                      />
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={options.qtres}
                      onChange={(e) => updateOption('qtres', parseFloat(e.target.value))}
                      className="w-full accent-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 tracking-wider">
                      <span className="capitalize">{t('modals.vectorizer.omit_details', 'omitir detalhes').toLowerCase()}</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number"
                          value={options.pathomit}
                          onChange={(e) => updateOption('pathomit', parseInt(e.target.value) || 0)}
                          className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-white text-center focus:border-blue-500 outline-none text-[10px]"
                        />
                        <span className="text-[8px] text-zinc-600">px</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="64"
                      step="1"
                      value={options.pathomit}
                      onChange={(e) => updateOption('pathomit', parseInt(e.target.value))}
                      className="w-full accent-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button 
                  onClick={() => svgContent && onApply(svgContent)}
                  disabled={isProcessing || !svgContent}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {isProcessing ? t('modals.vectorizer.processing_status', 'Vetorizando...') : t('modals.vectorizer.apply_action', 'Aplicar')}
                </button>
                <button 
                  onClick={() => setOptions(DEFAULT_OPTIONS)}
                  className="w-full mt-2 py-2 text-zinc-500 hover:text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={12} />
                  {t('modals.vectorizer.reset_action', 'Resetar padrão')}
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VectorizerModal;
