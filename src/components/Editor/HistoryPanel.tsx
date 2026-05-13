import React from 'react';
import { History, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

import { HistoryItem } from '../../types/tee';

interface HistoryPanelProps {
  history: HistoryItem[];
  currentIndex: number;
  goToHistoryIndex: (index: number) => void;
  clearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  goToHistoryIndex,
  clearHistory
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-3 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/50">
        <div className="flex items-center gap-2">
          <History size={14} className="text-zinc-400" />
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest">{t('editor.panels.history', 'Histórico')}</span>
        </div>
        <button 
          onClick={clearHistory}
          className="p-1.5 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-red-400 transition-colors"
          title={t('editor.panels.clear_history', 'Limpar Histórico')}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-zinc-600 gap-2">
            <History size={24} strokeWidth={1.5} />
            <p className="text-[10px] tracking-wider font-medium">{t('editor.messages.no_history', 'Sem histórico')}</p>
          </div>
        ) : (
          [...history].reverse().map((item, revIndex) => {
            const index = history.length - 1 - revIndex;
            return (
              <button
                key={`${item.id || 'legacy'}-${item.timestamp}-${index}`}
                onClick={() => goToHistoryIndex(index)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left group",
                  index === currentIndex 
                    ? "bg-blue-500/10 border border-blue-500/20" 
                    : index > currentIndex 
                      ? "opacity-40 hover:opacity-100 hover:bg-zinc-900 border border-transparent" 
                      : "hover:bg-zinc-900 border border-transparent"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded flex items-center justify-center shrink-0",
                  index === currentIndex ? "bg-blue-500 text-white" : "bg-zinc-900 text-zinc-500"
                )}>
                  {index <= currentIndex ? <RotateCcw size={12} /> : <RotateCw size={12} />}
                </div>
                <div className="flex-grow min-w-0">
                  <p className={cn(
                    "text-[11px] font-medium truncate",
                    index === currentIndex ? "text-blue-400" : "text-zinc-300"
                  )}>
                    {item.name}
                  </p>
                  <p className="text-[9px] text-zinc-600 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
                {index === currentIndex && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
              </button>
            );
          })
        )}
      </div>
      
      <div className="p-3 border-t border-zinc-900 bg-zinc-950/50">
        <div className="flex items-center justify-between text-[9px] text-zinc-500 tracking-tighter font-bold">
          <span>{history.length} {t('editor.panels.steps', 'Passos')}</span>
          <span>{currentIndex + 1} / {history.length}</span>
        </div>
      </div>
    </div>
  );
};
