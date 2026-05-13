import React from 'react';
import { BoxSelect, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MagneticLassoOptionsBarProps {
  onComplete: () => void;
  onCancel: () => void;
  pointsCount: number;
}

export const MagneticLassoOptionsBar: React.FC<MagneticLassoOptionsBarProps> = ({
  onComplete,
  onCancel,
  pointsCount
}) => {
  const { t } = useTranslation();

  return (
    <div className="h-12 bg-[#191919] border-b border-zinc-800 shadow-sm shrink-0 flex items-center px-4 gap-6 z-[90]">
      <div className="flex items-center gap-2 border-r border-zinc-800 pr-6">
        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-500">
          <BoxSelect size={16} />
        </div>
        <span className="text-[11px] font-bold tracking-wider text-zinc-400">
          {t('tools.magnetic_lasso', 'Magnetic Lasso')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 tracking-tight">
            {t('editor.pen.points', 'Points')}:
          </span>
          <span className="text-[11px] font-mono text-white">{pointsCount}</span>
        </div>

        <div className="h-4 w-[1px] bg-zinc-800" />

        <div className="flex items-center gap-2">
          <button 
            onClick={onComplete}
            disabled={pointsCount < 2}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-all"
          >
            <Check size={14} />
            <span className="text-[10px] font-bold">{t('common.complete', 'Complete')}</span>
          </button>
          <button 
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all"
          >
            <X size={14} />
            <span className="text-[10px] font-bold">{t('common.cancel', 'Cancel')}</span>
          </button>
        </div>
      </div>
      
      <div className="flex-grow" />
      
      <div className="text-[10px] text-zinc-500 italic">
        {t('editor.magnetic_lasso.hint', 'Clique para adicionar pontos. Ele tentará seguir as bordas automaticamente.')}
      </div>
    </div>
  );
};
