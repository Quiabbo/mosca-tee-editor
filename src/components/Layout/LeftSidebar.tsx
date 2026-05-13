import React from 'react';
import { 
  MousePointer2, Brush, Eraser, Type, Shapes, Pipette, 
  Library, Wand2, Zap, Minus, BoxSelect,
  PenTool as PenIcon
} from 'lucide-react';
import { ToolButton } from './ToolButton';
import { ForegroundBackgroundWidget } from '../ForegroundBackgroundWidget';
import { useTranslation } from 'react-i18next';

const PolygonalLassoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <path d="M3 18 L8 6 L14 10 L18 4 L21 14 L14 18 L8 16 Z" strokeLinejoin="round"/>
    <circle cx="3" cy="18" r="1.5" fill="currentColor"/>
  </svg>
);

const MarqueeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <rect x="4" y="4" width="16" height="16" rx="1" strokeDasharray="4 2" />
  </svg>
);

const TypeOnPathIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <text x="3" y="11" fontFamily="serif" fontSize="10"
          fontWeight="bold" fill="currentColor">T</text>
    <path d="M2 16 Q10 12 18 16" stroke="currentColor"
          strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
);

interface LeftSidebarProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeObject: any;
  copyStyle: () => void;
  handleRemoveBackground: () => void;
  handleVectorize: () => void;
  isRemovingBg: boolean;
  bgRemovalProgress: number;
}

export const LeftSidebar = React.memo(({
  activeTool,
  setActiveTool,
  activeTab,
  setActiveTab,
  activeObject,
  copyStyle,
  handleRemoveBackground,
  handleVectorize,
  isRemovingBg,
  bgRemovalProgress
}: LeftSidebarProps) => {
  const { t } = useTranslation();
  const [lastShape, setLastShape] = React.useState('shapes');
  const [lastText, setLastText] = React.useState('text');

  // Update last used tools in groups
  React.useEffect(() => {
    if (['shapes', 'line'].includes(activeTool)) {
      setLastShape(activeTool);
    }
    if (['text', 'text-on-path'].includes(activeTool)) {
      setLastText(activeTool);
    }
  }, [activeTool]);

  const shapeTools = [
    { id: 'shapes', icon: Shapes, label: t('editor.tools.shapes', 'Formas (S)') },
    { id: 'line', icon: Minus, label: t('editor.tools.line', 'Linha (N)') },
  ];

  const textTools = [
    { id: 'text', icon: Type, label: t('editor.tools.text', 'Texto (T)') },
    { id: 'text-on-path', icon: TypeOnPathIcon, label: t('editor.tools.text_on_path', 'Texto em Caminho') },
  ];

  const currentShape = shapeTools.find(t => t.id === (['shapes', 'line'].includes(activeTool) ? activeTool : lastShape)) || shapeTools[0];
  const currentText = textTools.find(t => t.id === (['text', 'text-on-path'].includes(activeTool) ? activeTool : lastText)) || textTools[0];

  return (
    <aside className="w-[44px] sm:w-[48px] lg:w-[48px] border-r border-zinc-800 flex flex-col items-center py-2 lg:py-2 gap-0.5 bg-[#191919] z-40 overflow-hidden">
      <div className="flex flex-col items-center gap-px sm:gap-0.5 shrink-0 px-1">
        <ToolButton icon={MousePointer2} active={activeTool === 'select'} onClick={() => setActiveTool('select')} tooltip={t('editor.tools.select', 'Seleção (V)')} />
        
        <ToolButton 
          icon={MarqueeIcon} 
          active={activeTool === 'marquee'} 
          onClick={() => setActiveTool('marquee')} 
          tooltip={t('editor.tools.marquee', 'Letreiro Retangular (M)')} 
        />
  
        <ToolButton 
          icon={PolygonalLassoIcon} 
          active={activeTool === 'polygonal-lasso'} 
          onClick={() => setActiveTool('polygonal-lasso')} 
          tooltip={t('editor.tools.polygonal_lasso', 'Laço Poligonal (L)')} 
        />
  
        <ToolButton icon={Wand2} active={activeTool === 'magic-wand'} onClick={() => setActiveTool('magic-wand')} tooltip={t('editor.tools.magic_wand', 'Varinha Mágica (W)')} />
        <ToolButton icon={PenIcon} active={activeTool === 'pen'} onClick={() => setActiveTool('pen')} tooltip={t('editor.tools.pen', 'Caneta (P)')} />
        <ToolButton icon={Brush} active={activeTool === 'brush'} onClick={() => setActiveTool('brush')} tooltip={t('editor.tools.brush', 'Pincel (B)')} />
        <ToolButton icon={Eraser} active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} tooltip={t('editor.tools.eraser', 'Borracha (E)')} />
        
        <ToolButton 
          icon={currentText.icon} 
          active={['text', 'text-on-path'].includes(activeTool)} 
          onClick={() => setActiveTool(currentText.id)} 
          tooltip={currentText.label}
          subTools={textTools.map(tt => ({
            ...tt,
            active: activeTool === tt.id,
            onClick: () => setActiveTool(tt.id)
          }))}
        />
        
        <ToolButton 
          icon={currentShape.icon} 
          active={['shapes', 'line'].includes(activeTool)} 
          onClick={() => setActiveTool(currentShape.id)} 
          tooltip={currentShape.label}
          subTools={shapeTools.map(st => ({
            ...st,
            active: activeTool === st.id,
            onClick: () => setActiveTool(st.id)
          }))}
        />
  
        <ToolButton icon={Pipette} active={activeTool === 'picker'} onClick={() => setActiveTool('picker')} tooltip={t('editor.tools.picker', 'Conta-gotas (I)')} />
        <ToolButton icon={Library} active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} tooltip={t('editor.tools.library', 'Biblioteca (K)')} />
      </div>

      <div className="flex-grow min-h-[10px]" />
      
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 lg:gap-2 pb-2 shrink-0">
        <ForegroundBackgroundWidget />
        
        <div className="flex flex-col gap-px sm:gap-0.5">
          <ToolButton 
            icon={Wand2} 
            active={false} 
            onClick={handleRemoveBackground} 
            tooltip={t('editor.tools.remove_bg', 'Remover fundo')} 
            className="text-blue-500" 
          />
          <ToolButton icon={Zap} active={false} onClick={handleVectorize} tooltip={t('editor.tools.vectorize', 'Vetorizar')} className="text-emerald-500" />
        </div>
      </div>
    </aside>
  );
});
