import React from 'react';
import { 
  Square, Circle, Triangle, Star, Heart, Hexagon,
  Pentagon, ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ShapeOptionsBarProps {
  activeShape: string;
  setActiveShape: (shape: any) => void;
  t: any;
}

export const ShapeOptionsBar: React.FC<ShapeOptionsBarProps> = ({
  activeShape,
  setActiveShape,
  t
}) => {
  const shapes = [
    { id: 'rectangle', icon: Square, label: t('editor.tools.rectangle', 'Retângulo') },
    { id: 'circle', icon: Circle, label: t('editor.tools.circle', 'Círculo') },
    { id: 'triangle', icon: Triangle, label: t('editor.tools.triangle', 'Triângulo') },
    { id: 'star', icon: Star, label: t('editor.tools.star', 'Estrela') },
    { id: 'heart', icon: Heart, label: t('editor.tools.heart', 'Coração') },
  ];

  return (
    <div 
      className="h-12 bg-[#191919] border-b border-zinc-800 shadow-sm shrink-0 flex items-center px-4 gap-4 overflow-x-auto no-scrollbar z-[90]"
    >
      <div className="flex items-center gap-1 mr-4 border-r border-zinc-800 pr-4">
        <span className="text-[10px] font-bold text-zinc-500 tracking-widest">{t('editor.tools.shapes', 'Formas')}</span>
      </div>

      <div className="flex items-center gap-1">
        {shapes.map((shape) => {
          const Icon = shape.icon;
          return (
            <button
              key={shape.id}
              onClick={() => setActiveShape(shape.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all",
                activeShape === shape.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              )}
              title={shape.label}
            >
              <Icon size={16} />
              <span className="text-xs font-medium hidden sm:inline">{shape.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
