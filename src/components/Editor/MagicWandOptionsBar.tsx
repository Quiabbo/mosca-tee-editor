import React from 'react';
import { Wand2, Check, Copy, Scissors, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface MagicWandOptionsBarProps {
  tolerance: number;
  setTolerance: (val: number) => void;
  contiguous: boolean;
  setContiguous: (val: boolean) => void;
  hasSelection?: boolean;
  onAction?: (action: 'copy' | 'cut' | 'duplicate' | 'erase') => void;
}

export const MagicWandOptionsBar: React.FC<MagicWandOptionsBarProps> = ({
  tolerance,
  setTolerance,
  contiguous,
  setContiguous,
  hasSelection,
  onAction
}) => {
  const { t } = useTranslation();

  return (
    <div className="h-12 bg-[#191919] border-b border-zinc-800 shadow-sm shrink-0 flex items-center px-4 gap-6 z-[90]">
      <div className="flex items-center gap-2 border-r border-zinc-800 pr-6">
        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-500">
          <Wand2 size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold tracking-wider text-zinc-400">
            {t('editor.tools.magic_wand', 'Varinha mágica')}
          </span>
          <span className="text-[8px] text-zinc-600 font-medium">Shift: +, Alt: -</span>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-grow">
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-zinc-500 tracking-tight">
            {t('editor.magic_wand.tolerance', 'Tolerância')}
          </label>
          <div className="flex items-center gap-2">
            <input 
              type="range" 
              min="0" 
              max="255" 
              value={tolerance} 
              onChange={(e) => setTolerance(parseInt(e.target.value))}
              className="w-32 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[11px] font-mono text-zinc-400 w-8">{tolerance}</span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-zinc-800" />

        <button 
          onClick={() => setContiguous(!contiguous)}
          className="flex items-center gap-2 group"
        >
          <div className={cn(
            "w-4 h-4 rounded border transition-all flex items-center justify-center",
            contiguous ? "bg-blue-600 border-blue-600" : "border-zinc-700 group-hover:border-zinc-500"
          )}>
            {contiguous && <Check size={10} className="text-white" />}
          </div>
          <span className="text-[10px] font-bold text-zinc-400 tracking-tight">
            {t('editor.magic_wand.contiguous', 'Contíguo')}
          </span>
        </button>

        {hasSelection && (
          <>
            <div className="h-4 w-[1px] bg-zinc-800" />
            <div className="flex items-center gap-1">
              <button 
                onClick={() => onAction?.('copy')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all group"
                title={t('common.copy', 'Copiar (Ctrl+C)')}
              >
                <Copy size={14} />
                <span className="text-[10px] font-bold">{t('common.copy', 'Copiar')}</span>
              </button>
              <button 
                onClick={() => onAction?.('cut')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                title={t('common.cut', 'Recortar (Ctrl+X)')}
              >
                <Scissors size={14} />
                <span className="text-[10px] font-bold">{t('common.cut', 'Recortar')}</span>
              </button>
              <button 
                onClick={() => onAction?.('duplicate')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                title={t('common.duplicate', 'Duplicar (Ctrl+J)')}
              >
                <Copy size={14} />
                <span className="text-[10px] font-bold">{t('common.duplicate', 'Duplicar')}</span>
              </button>
              <button 
                onClick={() => onAction?.('erase')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-red-900/30 text-zinc-400 hover:text-red-400 transition-all"
                title={t('common.delete', 'Apagar (Del)')}
              >
                <Trash2 size={14} />
                <span className="text-[10px] font-bold">{t('common.delete', 'Apagar')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
