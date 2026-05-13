import React, { useState } from 'react';
import { 
  Play, Save, Trash2, Circle, StopCircle, 
  ChevronRight, Zap, History, Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { Macro } from '../../types/tee';

interface MacroPanelProps {
  macros: Macro[];
  isRecording: boolean;
  currentMacro: Macro | null;
  startRecording: (name: string) => void;
  stopRecording: () => void;
  playMacro: (macro: Macro) => void;
  deleteMacro: (id: string) => void;
}

export const MacroPanel: React.FC<MacroPanelProps> = ({
  macros,
  isRecording,
  currentMacro,
  startRecording,
  stopRecording,
  playMacro,
  deleteMacro
}) => {
  const { t } = useTranslation();
  const [newMacroName, setNewMacroName] = useState('');

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-3 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/50">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-zinc-400" />
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest">
            {t('editor.panels.macros', 'Ações (Macros)')}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {!isRecording ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input 
                type="text"
                value={newMacroName}
                onChange={(e) => setNewMacroName(e.target.value)}
                placeholder={t('editor.macros.name_placeholder', 'Nome da ação...')}
                className="flex-grow bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                onClick={() => {
                  if (newMacroName.trim()) {
                    startRecording(newMacroName);
                    setNewMacroName('');
                  }
                }}
                disabled={!newMacroName.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition-all flex items-center gap-2"
              >
                <Circle size={12} fill="currentColor" />
                <span className="text-[10px] font-bold">{t('editor.macros.record', 'Gravar')}</span>
              </button>
            </div>
            <p className="text-[9px] text-zinc-600 italic">
              {t('editor.macros.hint', 'Grave uma sequência de ações para aplicar em outros objetos rapidamente.')}
            </p>
          </div>
        ) : (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-400 tracking-wider">
                  {t('editor.macros.recording', 'Gravando...')}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">{currentMacro?.name}</span>
            </div>
            <div className="text-[9px] text-zinc-500">
              {currentMacro?.actions.length} {t('editor.macros.actions_recorded', 'ações gravadas')}
            </div>
            <button 
              onClick={stopRecording}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all flex items-center justify-center gap-2"
            >
              <StopCircle size={14} />
              <span className="text-[10px] font-bold">{t('editor.macros.stop', 'Parar gravação')}</span>
            </button>
          </div>
        )}

        <div className="space-y-2 pt-4 border-t border-zinc-900">
          <h4 className="text-[10px] font-bold text-zinc-500 tracking-widest mb-3">
            {t('editor.macros.saved_macros', 'Ações salvas')}
          </h4>
          
          {macros.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-700 gap-2">
              <Zap size={24} strokeWidth={1} />
              <p className="text-[10px] font-medium tracking-wider">{t('editor.macros.no_macros', 'Nenhuma ação salva')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {macros.map((macro) => (
                <div 
                  key={macro.id}
                  className="group flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-all"
                >
                  <div className="flex-grow min-w-0">
                    <div className="text-[11px] font-bold text-zinc-300 truncate">{macro.name}</div>
                    <div className="text-[9px] text-zinc-600">
                      {macro.actions.length} {t('editor.macros.steps', 'passos')} • {new Date(macro.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => playMacro(macro)}
                      className="p-1.5 hover:bg-blue-500/20 text-blue-500 rounded-md transition-colors"
                      title={t('editor.macros.play', 'Executar')}
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                    <button 
                      onClick={() => deleteMacro(macro.id)}
                      className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                      title={t('editor.macros.delete', 'Excluir')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
