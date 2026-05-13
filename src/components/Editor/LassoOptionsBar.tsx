import React from 'react';
import { BoxSelect, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LassoOptionsBarProps {
  onCancel: () => void;
  hasSelection: boolean;
  onAction: (action: 'copy' | 'cut' | 'duplicate' | 'erase') => void;
}

export const LassoOptionsBar: React.FC<LassoOptionsBarProps> = ({
  onCancel,
  hasSelection,
  onAction
}) => {
  const { t } = useTranslation();

  return (
    <div className="h-12 bg-[#191919] border-b border-zinc-800 shadow-sm shrink-0 flex items-center px-4 gap-6 z-[90]">
      <div className="flex items-center gap-2 border-r border-zinc-800 pr-6">
        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-500">
          <BoxSelect size={16} />
        </div>
        <span className="text-[11px] font-bold tracking-wider text-zinc-400">
          {t('tools.lasso', 'Lasso')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {hasSelection && (
          <>
            <div className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg">
              <button 
                onClick={() => onAction('copy')}
                className="p-1.5 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-md transition-all flex items-center gap-2 px-3"
                title={t('common.copy', 'Copy')}
              >
                <BoxSelect size={14} className="text-blue-400" />
                <span className="text-[10px] font-bold uppercase">{t('common.copy', 'Copiar')}</span>
              </button>
              <button 
                onClick={() => onAction('cut')}
                className="p-1.5 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-md transition-all flex items-center gap-2 px-3"
                title={t('common.cut', 'Cut')}
              >
                <BoxSelect size={14} className="text-red-400" />
                <span className="text-[10px] font-bold uppercase">{t('common.cut', 'Recortar')}</span>
              </button>
              <button 
                onClick={() => onAction('duplicate')}
                className="p-1.5 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-md transition-all flex items-center gap-2 px-3"
                title={t('common.duplicate', 'Duplicate')}
              >
                <BoxSelect size={14} className="text-green-400" />
                <span className="text-[10px] font-bold uppercase">{t('common.duplicate', 'Duplicar')}</span>
              </button>
              <button 
                onClick={() => onAction('erase')}
                className="p-1.5 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-md transition-all flex items-center gap-2 px-3"
                title={t('common.erase', 'Erase')}
              >
                <BoxSelect size={14} className="text-zinc-500" />
                <span className="text-[10px] font-bold uppercase">{t('common.erase', 'Apagar')}</span>
              </button>
            </div>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
          </>
        )}
        <button 
          onClick={onCancel}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all"
        >
          <X size={14} />
          <span className="text-[10px] font-bold">{t('common.cancel', 'Cancel')}</span>
        </button>
      </div>
      
      <div className="flex-grow" />
      
      <div className="text-[10px] text-zinc-500 italic">
        {t('editor.lasso.hint', 'Clique e arraste para desenhar uma seleção livre.')}
      </div>
    </div>
  );
};
