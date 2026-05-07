import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, LayoutGrid } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { GuideLayoutConfig } from '../../types/tee';

interface NewGuideLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: GuideLayoutConfig) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const NewGuideLayoutModal: React.FC<NewGuideLayoutModalProps> = ({ 
  isOpen, 
  onClose, 
  onApply,
  canvasWidth,
  canvasHeight
}) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<GuideLayoutConfig>({
    columns: {
      enabled: true,
      number: 4,
      width: null,
      gutter: 20
    },
    rows: {
      enabled: true,
      number: 4,
      height: null,
      gutter: 20
    },
    margin: {
      enabled: false,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    },
    centerColumns: false,
    clearExisting: true,
    applyToAllPages: false,
    color: '#00ffff'
  });

  const handleApply = () => {
    onApply(config);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
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
            className="relative w-full max-w-[500px] bg-[#1c1c1c] shadow-2xl rounded-lg border border-zinc-800 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-[#252525]">
              <div className="flex items-center gap-2 text-zinc-300">
                <LayoutGrid size={16} className="text-zinc-400" />
                <span className="text-sm font-medium">{t('modals.guide_layout.title', 'New Guide Layout')}</span>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Color Selection */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">{t('modals.guide_layout.color', 'Color')}:</label>
                <div className="flex items-center gap-3">
                  <select 
                    value={config.color}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                  >
                    <option value="#00ffff">{t('modals.guide_layout.colors.cyan', 'Cyan')}</option>
                    <option value="#ff00ff">{t('modals.guide_layout.colors.magenta', 'Magenta')}</option>
                    <option value="#ffff00">{t('modals.guide_layout.colors.yellow', 'Yellow')}</option>
                    <option value="#00ff00">{t('modals.guide_layout.colors.green', 'Green')}</option>
                    <option value="#ff0000">{t('modals.guide_layout.colors.red', 'Red')}</option>
                    <option value="#0000ff">{t('modals.guide_layout.colors.blue', 'Blue')}</option>
                    <option value="#ffffff">{t('modals.guide_layout.colors.white', 'White')}</option>
                  </select>
                  <div 
                    className="w-12 h-5 rounded border border-zinc-700"
                    style={{ backgroundColor: config.color }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Columns */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="cols-enabled"
                      checked={config.columns.enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        columns: { ...config.columns, enabled: e.target.checked }
                      })}
                      className="accent-zinc-700"
                    />
                    <label htmlFor="cols-enabled" className="text-xs font-bold text-zinc-300">{t('modals.guide_layout.columns', 'Columns')}</label>
                  </div>
                  <div className={cn("space-y-2 pl-5 transition-opacity", !config.columns.enabled && "opacity-40 pointer-events-none")}>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-zinc-500">{t('modals.guide_layout.number', 'Number')}:</label>
                      <input 
                        type="number"
                        value={config.columns.number}
                        onChange={(e) => setConfig({
                          ...config,
                          columns: { ...config.columns, number: parseInt(e.target.value) || 0 }
                        })}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-zinc-500">{t('modals.guide_layout.width', 'Width')}:</label>
                      <input 
                        type="text"
                        placeholder="Auto"
                        value={config.columns.width || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          columns: { ...config.columns, width: parseFloat(e.target.value) || null }
                        })}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-zinc-500">{t('modals.guide_layout.gutter', 'Gutter')}:</label>
                      <input 
                        type="number"
                        value={config.columns.gutter}
                        onChange={(e) => setConfig({
                          ...config,
                          columns: { ...config.columns, gutter: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Rows */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="rows-enabled"
                      checked={config.rows.enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        rows: { ...config.rows, enabled: e.target.checked }
                      })}
                      className="accent-zinc-700"
                    />
                    <label htmlFor="rows-enabled" className="text-xs font-bold text-zinc-300">{t('modals.guide_layout.rows', 'Rows')}</label>
                  </div>
                  <div className={cn("space-y-2 pl-5 transition-opacity", !config.rows.enabled && "opacity-40 pointer-events-none")}>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-zinc-500">{t('modals.guide_layout.number', 'Number')}:</label>
                      <input 
                        type="number"
                        value={config.rows.number}
                        onChange={(e) => setConfig({
                          ...config,
                          rows: { ...config.rows, number: parseInt(e.target.value) || 0 }
                        })}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-zinc-500">{t('modals.guide_layout.height', 'Height')}:</label>
                      <input 
                        type="text"
                        placeholder="Auto"
                        value={config.rows.height || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          rows: { ...config.rows, height: parseFloat(e.target.value) || null }
                        })}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-zinc-500">{t('modals.guide_layout.gutter', 'Gutter')}:</label>
                      <input 
                        type="number"
                        value={config.rows.gutter}
                        onChange={(e) => setConfig({
                          ...config,
                          rows: { ...config.rows, gutter: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="margin-enabled"
                    checked={config.margin.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      margin: { ...config.margin, enabled: e.target.checked }
                    })}
                    className="accent-zinc-700"
                  />
                  <label htmlFor="margin-enabled" className="text-xs font-bold text-zinc-300">{t('modals.guide_layout.margin', 'Margin')}</label>
                </div>
                <div className={cn("grid grid-cols-4 gap-2 pl-5 transition-opacity", !config.margin.enabled && "opacity-40 pointer-events-none")}>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase">{t('modals.guide_layout.top', 'Top')}</label>
                    <input 
                      type="number"
                      value={config.margin.top}
                      onChange={(e) => setConfig({
                        ...config,
                        margin: { ...config.margin, top: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase">{t('modals.guide_layout.left', 'Left')}</label>
                    <input 
                      type="number"
                      value={config.margin.left}
                      onChange={(e) => setConfig({
                        ...config,
                        margin: { ...config.margin, left: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase">{t('modals.guide_layout.bottom', 'Bottom')}</label>
                    <input 
                      type="number"
                      value={config.margin.bottom}
                      onChange={(e) => setConfig({
                        ...config,
                        margin: { ...config.margin, bottom: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase">{t('modals.guide_layout.right', 'Right')}</label>
                    <input 
                      type="number"
                      value={config.margin.right}
                      onChange={(e) => setConfig({
                        ...config,
                        margin: { ...config.margin, right: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="center-cols"
                    checked={config.centerColumns}
                    onChange={(e) => setConfig({ ...config, centerColumns: e.target.checked })}
                    className="accent-zinc-700"
                  />
                  <label htmlFor="center-cols" className="text-[11px] text-zinc-400">{t('modals.guide_layout.center_columns', 'Center columns')}</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="clear-existing"
                    checked={config.clearExisting}
                    onChange={(e) => setConfig({ ...config, clearExisting: e.target.checked })}
                    className="accent-zinc-700"
                  />
                  <label htmlFor="clear-existing" className="text-[11px] text-zinc-400">{t('modals.guide_layout.clear_existing', 'Clear existing guides')}</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="apply-all"
                    checked={config.applyToAllPages}
                    onChange={(e) => setConfig({ ...config, applyToAllPages: e.target.checked })}
                    className="accent-zinc-700"
                  />
                  <label htmlFor="apply-all" className="text-[11px] text-zinc-400">{t('modals.guide_layout.apply_all', 'Apply to all pages')}</label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#252525] border-t border-zinc-800 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
              >
                {t('modals.guide_layout.cancel', 'Cancel')}
              </button>
                <button 
                  onClick={handleApply}
                  className="px-6 py-1.5 text-xs font-medium bg-[#0f0f0f] hover:bg-[#141414] text-white rounded border border-zinc-700 transition-all"
                >
                  {t('modals.guide_layout.ok', 'OK')}
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewGuideLayoutModal;
