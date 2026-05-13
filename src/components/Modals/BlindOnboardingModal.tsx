import React from 'react';
import { motion } from 'motion/react';
import { X, Accessibility, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BlindOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlindOnboardingModal: React.FC<BlindOnboardingModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-[#191919] border border-blue-500/30 rounded-[12px] shadow-2xl overflow-hidden flex flex-col p-8 text-center"
      >
        <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Accessibility size={40} className="text-blue-500" />
        </div>
        
        <h2 id="onboarding-title" className="text-2xl font-bold mb-4 text-white">
          {t('a11y.shortcuts.onboarding.title')}
        </h2>
        
        <p className="text-zinc-400 leading-relaxed mb-8">
          {t('a11y.shortcuts.onboarding.text')}
        </p>
        
        <button 
          onClick={onClose}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[12px] transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          autoFocus
        >
          <CheckCircle2 size={20} />
          {t('a11y.shortcuts.onboarding.got_it')}
        </button>
      </motion.div>
    </div>
  );
};
