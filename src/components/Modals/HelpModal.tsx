import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, HelpCircle, Keyboard, Accessibility, 
  MousePointer2, Type, Square, Circle, Trash2, 
  Undo2, Redo2, Copy, ClipboardPaste, Eye,
  CheckCircle2, Info, Pipette, Brush, Eraser,
  Layers, Sliders, Palette, Maximize2, Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useA11yStore } from '../../store/useA11yStore';
import { speech } from '../../services/speechService';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { blindMode } = useA11yStore();

  useEffect(() => {
    if (isOpen && blindMode) {
      const title = t('common.accessibility_short', 'Acessibilidade');
      const onboardingTitle = t('a11y.shortcuts.onboarding.title');
      const onboardingText = t('a11y.shortcuts.onboarding.text');
      speech.speak(`${title}. ${onboardingTitle}. ${onboardingText}.`);
    }
  }, [isOpen, blindMode, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-[#191919] border border-zinc-800 rounded-[12px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Accessibility size={20} className="text-white" />
            </div>
            <h2 id="help-title" className="text-xl font-bold">{t('common.accessibility_short', 'Acessibilidade')}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
            aria-label={t('editor.common.cancel')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-6">
            <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-xl text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Accessibility size={32} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('a11y.shortcuts.onboarding.title')}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t('a11y.shortcuts.onboarding.text')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                  <Info size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-wider">{t('a11y.shortcuts.canvas')}</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {t('a11y.speech.canvas.description_action', 'Descrever canvas')}: {t('a11y.speech.canvas.description_desc', 'Pressione F1 para ouvir uma descrição detalhada de todos os elementos presentes no seu design.')}
                </p>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                  <CheckCircle2 size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-wider">{t('a11y.shortcuts.tools')}</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {t('a11y.speech.tools.desc', 'Ao trocar de ferramenta, o sistema anunciará qual está ativa e como utilizá-la.')}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-[#141414] border-t border-zinc-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-all"
          >
            {t('editor.common.accept', 'Entendi')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
