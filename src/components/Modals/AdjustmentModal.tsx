import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, Sun, Contrast, Droplets, Palette, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  adjustmentLayer: any;
  onApply: (data: any) => void;
}

export const AdjustmentModal = ({ isOpen, onClose, onCancel, adjustmentLayer, onApply }: AdjustmentModalProps) => {
  const { t } = useTranslation();
  const [data, setData] = useState<any>({});

  useEffect(() => {
    if (adjustmentLayer && isOpen) {
      setData(adjustmentLayer.adjustmentData || {});
    }
  }, [adjustmentLayer, isOpen]);

  const applyTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const updateData = (field: string, value: any) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    
    // Debounce the application to image to keep UI responsive
    if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    applyTimeoutRef.current = setTimeout(() => {
      onApply(newData);
    }, 500); // 500ms debounce as requested for maximum fluidity
  };

  if (!isOpen || !adjustmentLayer) return null;

  const type = adjustmentLayer.adjustmentType;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <motion.div 
        drag
        dragMomentum={false}
        dragListener={true}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col pointer-events-auto"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#191919] cursor-move">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Sliders size={18} />
            </div>
            <h2 className="text-sm font-bold text-white leading-none">
              {t(`editor.adjustments.${type}`, type) as string}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[400px]">
          {type === 'brightness_contrast' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.adjustments.brightness', 'Brightness')}</label>
                  <input 
                    type="number"
                    value={data.brightness || 0}
                    onChange={(e) => updateData('brightness', parseInt(e.target.value) || 0)}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                  />
                </div>
                <input 
                  type="range" min="-100" max="100"
                  value={data.brightness || 0}
                  onChange={(e) => updateData('brightness', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.adjustments.contrast', 'Contrast')}</label>
                  <input 
                    type="number"
                    value={data.contrast || 0}
                    onChange={(e) => updateData('contrast', parseInt(e.target.value) || 0)}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                  />
                </div>
                <input 
                  type="range" min="-100" max="100"
                  value={data.contrast || 0}
                  onChange={(e) => updateData('contrast', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </>
          )}

          {type === 'hue_saturation' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.adjustments.hue', 'Hue')}</label>
                  <input 
                    type="number"
                    value={data.hue || 0}
                    onChange={(e) => updateData('hue', parseInt(e.target.value) || 0)}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                  />
                </div>
                <input 
                  type="range" min="-100" max="100"
                  value={data.hue || 0}
                  onChange={(e) => updateData('hue', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.adjustments.saturation', 'Saturation')}</label>
                  <input 
                    type="number"
                    value={data.saturation || 0}
                    onChange={(e) => updateData('saturation', parseInt(e.target.value) || 0)}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                  />
                </div>
                <input 
                  type="range" min="-100" max="100"
                  value={data.saturation || 0}
                  onChange={(e) => updateData('saturation', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </>
          )}

          {type === 'color_balance' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Red</label>
                  <input 
                    type="number"
                    value={data.red || 0}
                    onChange={(e) => updateData('red', parseInt(e.target.value) || 0)}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-red-500 outline-none"
                  />
                </div>
                <input 
                  type="range" min="-100" max="100"
                  value={data.red || 0}
                  onChange={(e) => updateData('red', parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Green</label>
                  <input 
                    type="number"
                    value={data.green || 0}
                    onChange={(e) => updateData('green', parseInt(e.target.value) || 0)}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-green-500 outline-none"
                  />
                </div>
                <input 
                  type="range" min="-100" max="100"
                  value={data.green || 0}
                  onChange={(e) => updateData('green', parseInt(e.target.value))}
                  className="w-full accent-green-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Blue</label>
                  <input 
                    type="number"
                    value={data.blue || 0}
                    onChange={(e) => updateData('blue', parseInt(e.target.value) || 0)}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                  />
                </div>
                <input 
                  type="range" min="-100" max="100"
                  value={data.blue || 0}
                  onChange={(e) => updateData('blue', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </>
          )}

          {type === 'gaussian_blur' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.gallery_filters.blur', 'Blur')}</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="number"
                    value={data.blur || 0}
                    onChange={(e) => updateData('blur', parseInt(e.target.value) || 0)}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] font-mono text-zinc-500">px</span>
                </div>
              </div>
              <input 
                type="range" min="0" max="100"
                value={data.blur || 0}
                onChange={(e) => updateData('blur', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {type === 'vibrance' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.adjustments.vibrance', 'Vibrance')}</label>
                <input 
                  type="number"
                  value={data.amount || 0}
                  onChange={(e) => updateData('amount', parseInt(e.target.value) || 0)}
                  className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                />
              </div>
              <input 
                type="range" min="-100" max="100"
                value={data.amount || 0}
                onChange={(e) => updateData('amount', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {type === 'gamma' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.adjustments.gamma', 'Gamma')}</label>
                <input 
                  type="number"
                  step="0.01"
                  value={((data.amount || 100) / 100).toFixed(2)}
                  onChange={(e) => updateData('amount', Math.round(parseFloat(e.target.value) * 100) || 100)}
                  className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                />
              </div>
              <input 
                type="range" min="1" max="220"
                value={data.amount || 100}
                onChange={(e) => updateData('amount', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
                <span>0.01</span>
                <span>1.0</span>
                <span>2.20</span>
              </div>
            </div>
          )}

          {type === 'motion_blur' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.gallery_filters.amount', 'Amount')}</label>
                <input 
                  type="number"
                  value={data.amount || 0}
                  onChange={(e) => updateData('amount', parseInt(e.target.value) || 0)}
                  className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                />
              </div>
              <input 
                type="range" min="0" max="100"
                value={data.amount || 0}
                onChange={(e) => updateData('amount', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {type === 'radial_blur' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.gallery_filters.amount', 'Amount')}</label>
                <input 
                  type="number"
                  value={data.amount || 0}
                  onChange={(e) => updateData('amount', parseInt(e.target.value) || 0)}
                  className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                />
              </div>
              <input 
                type="range" min="0" max="100"
                value={data.amount || 0}
                onChange={(e) => updateData('amount', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {type === 'noise' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.gallery_filters.noise', 'Noise')}</label>
                <input 
                  type="number"
                  value={data.noise || 0}
                  onChange={(e) => updateData('noise', parseInt(e.target.value) || 0)}
                  className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                />
              </div>
              <input 
                type="range" min="0" max="1000"
                value={data.noise || 0}
                onChange={(e) => updateData('noise', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {(type === 'sharpen' || type === 'sharpness') && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.gallery_filters.amount', 'Amount')}</label>
                <input 
                  type="number"
                  step="0.1"
                  value={data.amount || 0}
                  onChange={(e) => updateData('amount', parseFloat(e.target.value) || 0)}
                  className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                />
              </div>
              <input 
                type="range" min="0" max="5" step="0.1"
                value={data.amount || 0}
                onChange={(e) => updateData('amount', parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {['black_white', 'grayscale'].includes(type) && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.gallery_filters.amount', 'Intensidade')}</label>
                  <input 
                    type="number"
                    value={data.amount || 0}
                    onChange={(e) => updateData('amount', parseInt(e.target.value) || 0)}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                  />
                </div>
                <input 
                  type="range" min="0" max="100"
                  value={data.amount || 0}
                  onChange={(e) => updateData('amount', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          )}

          {['warm', 'cold', 'pop', 'contrast', 'color', 'cinema'].includes(type) && (
            <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800">
              <span className="text-xs text-zinc-300">{t('editor.adjustments.enabled', 'Ativado')}</span>
              <div 
                onClick={() => updateData('enabled', !data.enabled)}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors cursor-pointer relative",
                  data.enabled ? "bg-blue-600" : "bg-zinc-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                  data.enabled ? "left-6" : "left-1"
                )} />
              </div>
            </div>
          )}

          {type === 'skew' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.gallery_filters.skew_x', 'Skew X')}</label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number"
                      value={data.skewX || 0}
                      onChange={(e) => updateData('skewX', parseInt(e.target.value) || 0)}
                      className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                    />
                    <span className="text-[10px] font-mono text-zinc-500">°</span>
                  </div>
                </div>
                <input 
                  type="range" min="-45" max="45"
                  value={data.skewX || 0}
                  onChange={(e) => updateData('skewX', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.gallery_filters.skew_y', 'Skew Y')}</label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number"
                      value={data.skewY || 0}
                      onChange={(e) => updateData('skewY', parseInt(e.target.value) || 0)}
                      className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                    />
                    <span className="text-[10px] font-mono text-zinc-500">°</span>
                  </div>
                </div>
                <input 
                  type="range" min="-45" max="45"
                  value={data.skewY || 0}
                  onChange={(e) => updateData('skewY', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          )}

          {(type === 'perspective' || type === 'warp') && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.gallery_filters.amount', 'Amount')}</label>
                <input 
                  type="number"
                  value={data.amount || 0}
                  onChange={(e) => updateData('amount', parseInt(e.target.value) || 0)}
                  className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                />
              </div>
              <input 
                type="range" min="0" max="100"
                value={data.amount || 0}
                onChange={(e) => updateData('amount', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
              <p className="text-[9px] text-zinc-500 italic mt-2">
                {t('editor.gallery_filters.transform_hint', 'Transformations are applied to objects below.')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-[#191919]">
          <button 
            onClick={() => {
              const resetData: any = {};
              if (type === 'brightness_contrast') { resetData.brightness = 0; resetData.contrast = 0; }
              else if (type === 'hue_saturation') { resetData.hue = 0; resetData.saturation = 0; }
              else if (type === 'color_balance') { resetData.red = 0; resetData.green = 0; resetData.blue = 0; }
              else if (type === 'gaussian_blur') { resetData.blur = 0; }
              else if (type === 'vibrance') { resetData.amount = 0; }
              else if (type === 'gamma') { resetData.amount = 100; }
              else if (['motion_blur', 'radial_blur', 'noise', 'perspective', 'warp'].includes(type as string)) { resetData.amount = 0; resetData.noise = 0; }
              else if (['sharpen', 'sharpness', 'black_white', 'grayscale'].includes(type as string)) { resetData.amount = 0; }
              else if (type === 'skew') { resetData.skewX = 0; resetData.skewY = 0; }
              else { resetData.enabled = false; }
              
              setData(resetData);
              onApply(resetData);
            }}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            {t('common.reset', 'Redefinir')}
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onCancel || onClose}
              className="px-6 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition-all"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all"
            >
              {t('common.ok', 'OK')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdjustmentModal;
