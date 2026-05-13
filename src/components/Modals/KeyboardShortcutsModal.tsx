import React from 'react';
import { motion } from 'motion/react';
import { X, Keyboard, MousePointer2, Type, Square, Circle, Trash2, Undo2, Redo2, Copy, ClipboardPaste, HelpCircle, Eye, Grid3X3, Move, Shapes, Eraser, Paintbrush, Pipette, Scissors, Frame, Minus, LassoSelect, PenTool } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const sections = [
    {
      title: t('a11y.shortcuts.tools'),
      items: [
        { key: 'V', desc: t('editor.tools.select'), icon: MousePointer2 },
        { key: 'B', desc: t('editor.tools.brush'), icon: Paintbrush },
        { key: 'E', desc: t('editor.tools.eraser'), icon: Eraser },
        { key: 'T', desc: t('editor.tools.text'), icon: Type },
        { key: 'S / F', desc: t('editor.tools.shapes'), icon: Shapes },
        { key: 'M', desc: t('editor.tools.marquee'), icon: Square },
        { key: 'P', desc: t('editor.tools.pen'), icon: PenTool },
        { key: 'L', desc: t('editor.tools.polygonal_lasso'), icon: LassoSelect },
        { key: 'I', desc: t('editor.tools.pipette'), icon: Pipette },
        { key: 'A', desc: t('editor.tools.artboard'), icon: Frame },
        { key: 'N', desc: t('editor.tools.line'), icon: Minus },
      ]
    },
    {
      title: t('a11y.shortcuts.editing'),
      items: [
        { key: t('a11y.shortcuts.keys.delete', 'Delete'), desc: t('editor.header.delete_action'), icon: Trash2 },
        { key: `${t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+Z`, desc: t('editor.header.undo'), icon: Undo2 },
        { key: `${t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+${t('a11y.shortcuts.keys.shift', 'Shift')}+Z`, desc: t('editor.header.redo'), icon: Redo2 },
        { key: `${t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+C`, desc: t('editor.header.copy'), icon: Copy },
        { key: `${t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+X`, desc: t('editor.header.cut'), icon: Scissors },
        { key: `${t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+V`, desc: t('editor.header.paste'), icon: ClipboardPaste },
        { key: `${t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+D`, desc: t('editor.header.duplicate'), icon: Copy },
        { key: `${t('a11y.shortcuts.keys.ctrl', 'Ctrl')}+A`, desc: t('editor.header.select_all'), icon: MousePointer2 },
      ]
    },
    {
      title: t('a11y.shortcuts.canvas'),
      items: [
        { key: 'F1', desc: t('a11y.speech.canvas.description_action'), icon: Eye },
        { key: 'F3', desc: t('a11y.shortcuts.describe'), icon: MousePointer2 },
        { key: 'F9', desc: t('a11y.shortcuts.position'), icon: MousePointer2 },
        { key: `${t('a11y.shortcuts.keys.shift', 'Shift')}+${t('a11y.shortcuts.keys.backspace', 'Backspace')}`, desc: t('editor.panels.fill_artboard'), icon: Shapes },
        { key: 'F10', desc: t('a11y.shortcuts.title'), icon: HelpCircle },
        { key: t('a11y.shortcuts.keys.esc', 'Esc'), desc: t('editor.common.cancel'), icon: X },
      ]
    },
    {
      title: t('a11y.shortcuts.accessibility', 'Accessibility'),
      items: [
        { key: 'F6', desc: t('a11y.shortcuts.list_obj'), icon: Eye },
        { key: 'G', desc: t('a11y.shortcuts.toggle_grid'), icon: Grid3X3 },
        { key: t('a11y.shortcuts.keys.tab', 'Tab'), desc: t('a11y.shortcuts.navigate'), icon: MousePointer2 },
        { key: t('a11y.shortcuts.keys.arrows', 'Arrows'), desc: t('a11y.shortcuts.move'), icon: Move },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
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
        className="relative w-full max-w-sm bg-[#191919] border border-zinc-800 rounded-[12px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center">
              <Keyboard size={14} className="text-white" />
            </div>
            <h2 id="shortcuts-title" className="text-base font-bold">{t('a11y.shortcuts.title')}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
            aria-label={t('editor.common.cancel')}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-3 space-y-5">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{section.title}</h3>
              <div className="grid grid-cols-1 gap-2">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-zinc-900/50 border border-zinc-800/50 rounded-lg gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="text-zinc-500 shrink-0">
                        {item.icon && <item.icon size={12} />}
                      </div>
                      <span className="text-[11px] text-zinc-300 truncate font-medium" title={item.desc}>{item.desc}</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[8px] font-mono font-bold text-zinc-400 whitespace-nowrap shadow-sm shrink-0 min-w-[32px] text-center">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
