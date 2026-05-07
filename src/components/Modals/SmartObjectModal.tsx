import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Box, Upload, RefreshCw, Download, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface SmartObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  smartObject: any;
  onUpdateSource: (newSource: string) => void;
}

export const SmartObjectModal = ({ isOpen, onClose, smartObject, onUpdateSource }: SmartObjectModalProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen || !smartObject) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (previewUrl) {
      onUpdateSource(previewUrl);
      setPreviewUrl(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <motion.div 
        drag
        dragMomentum={false}
        dragListener={true}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col pointer-events-auto"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#191919] cursor-move">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Box size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">
                {t('editor.smart_object.edit_title', 'Editar Objeto Inteligente')}
              </h2>
              <p className="text-[10px] text-zinc-500 mt-1">
                {t('editor.smart_object.edit_subtitle', 'Substitua o conteúdo mantendo as transformações')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex gap-6">
          {/* Current Source Preview */}
          <div className="flex-1 space-y-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {t('editor.smart_object.current_content', 'Conteúdo Atual')}
            </label>
            <div className="aspect-square bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden flex items-center justify-center bg-[linear-gradient(45deg,#141414_25%,transparent_25%,transparent_75%,#141414_75%,#141414),linear-gradient(45deg,#141414_25%,#1a1a1a_25%,#1a1a1a_75%,#141414_75%,#141414)] bg-[0_0,4px_4px] bg-[length:8px_8px]">
              <img 
                src={smartObject.smartSource} 
                alt="Smart Object Source" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex justify-center gap-2">
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = 'smart-object-source.png';
                  link.href = smartObject.smartSource;
                  link.click();
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300 transition-all"
              >
                <Download size={12} /> {t('common.download', 'Baixar')}
              </button>
            </div>
          </div>

          <div className="w-px bg-zinc-800 self-stretch" />

          {/* New Source Upload */}
          <div className="flex-1 space-y-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {t('editor.smart_object.new_content', 'Novo Conteúdo')}
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "aspect-square rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group",
                previewUrl ? "border-blue-500/50 bg-blue-500/5" : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
              )}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="New Source Preview" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <>
                  <div className="p-4 bg-zinc-800 rounded-full text-zinc-500 group-hover:scale-110 group-hover:text-blue-500 transition-all">
                    <Upload size={24} />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs font-bold text-zinc-400">{t('editor.smart_object.upload_prompt', 'Clique para substituir')}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">PNG, JPG ou SVG</p>
                  </div>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            {previewUrl && (
              <div className="flex justify-center gap-2">
                <button 
                  onClick={() => setPreviewUrl(null)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-red-400 transition-all"
                >
                  <RefreshCw size={12} /> {t('common.reset', 'Resetar')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-end bg-[#191919] gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition-all"
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button 
            onClick={handleApply}
            disabled={!previewUrl}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} /> {t('editor.smart_object.update_action', 'Atualizar Conteúdo')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SmartObjectModal;
