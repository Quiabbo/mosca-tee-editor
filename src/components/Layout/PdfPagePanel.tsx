import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Copy, RotateCw, Plus, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

interface PdfPagePanelProps {
  pages: any[];
  currentIndex: number;
  onSelectPage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onDuplicatePage: (index: number) => void;
  onRotatePage: (index: number) => void;
  onAddBlankPage: (index: number) => void;
  onReorderPages: (from: number, to: number) => void;
}

export const PdfPagePanel: React.FC<PdfPagePanelProps> = ({
  pages,
  currentIndex,
  onSelectPage,
  onDeletePage,
  onDuplicatePage,
  onRotatePage,
  onAddBlankPage,
  onReorderPages
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-24 border-r border-zinc-800 bg-[#191919] flex flex-col h-full z-30">
      <div className="flex-grow overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {pages.map((page, index) => (
          <div key={index} className="group relative">
            <div 
              onClick={() => onSelectPage(index)}
              className={cn(
                "relative aspect-[3/4] bg-zinc-900 rounded-lg border-2 transition-all cursor-pointer overflow-hidden group",
                currentIndex === index ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-zinc-800 hover:border-zinc-600"
              )}
            >
              <div className="absolute right-1 top-1 flex flex-col gap-1 z-20 opacity-100 transition-opacity">
                <button 
                  disabled={index === 0}
                  onClick={(e) => { e.stopPropagation(); onReorderPages(index, index - 1); }}
                  className="p-1 bg-black/60 backdrop-blur-md hover:bg-blue-600 rounded text-white disabled:opacity-20 transition-colors shadow-sm"
                  title="Mover para cima"
                >
                  <ChevronUp size={12} />
                </button>
                <button 
                  disabled={index === pages.length - 1}
                  onClick={(e) => { e.stopPropagation(); onReorderPages(index, index + 1); }}
                  className="p-1 bg-black/60 backdrop-blur-md hover:bg-blue-600 rounded text-white disabled:opacity-20 transition-colors shadow-sm"
                  title="Mover para baixo"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
              {page.backgroundImage ? (
                <img 
                  src={page.backgroundImage} 
                  alt={`Page ${index + 1}`} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                  <FileText size={32} />
                </div>
              )}
              
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white">
                {index + 1}
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-md px-1 py-1 flex items-center justify-between translate-y-full group-hover:translate-y-0 transition-transform">
                <button onClick={(e) => { e.stopPropagation(); onRotatePage(index); }} className="p-0.5 hover:bg-zinc-700 rounded text-zinc-300" title="Rotacionar">
                  <RotateCw size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDuplicatePage(index); }} className="p-0.5 hover:bg-zinc-700 rounded text-zinc-300" title="Duplicar">
                  <Copy size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onAddBlankPage(index); }} className="p-0.5 hover:bg-zinc-700 rounded text-zinc-300" title="Adicionar em branco">
                  <Plus size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDeletePage(index); }} className="p-0.5 hover:bg-red-500/20 rounded text-red-500" title="Deletar">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-800">
        <button 
          onClick={() => onAddBlankPage(pages.length - 1)}
          className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 flex items-center justify-center transition-all"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};
