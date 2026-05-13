import React from 'react';
import { fabric } from 'fabric';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  Minus, Plus, CaseUpper, CaseLower, Scissors, Square as MaskIcon 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { useA11yStore } from '../../store/useA11yStore';
import { speech } from '../../services/speechService';
import { ColorPicker } from '../ColorPicker';

interface TextPanelProps {
  activeObject: any;
  updateActiveObject: (key: string, value: any, skipHistory?: boolean) => void;
  fonts: string[];
  toggleTextProperty: (property: string) => void;
  toggleTextTransform: () => void;
  updateTextShadow: (color: string, blur: number, offsetX: number, offsetY: number) => void;
  fontInputRef: React.RefObject<HTMLInputElement | null>;
  canvas: any;
  topOptions: any;
  setTopOptions: React.Dispatch<React.SetStateAction<any>>;
  saveToHistory: (canvas: any) => void;
}

export const TextPanel: React.FC<TextPanelProps> = ({
  activeObject,
  updateActiveObject,
  fonts,
  toggleTextProperty,
  toggleTextTransform,
  updateTextShadow,
  fontInputRef,
  canvas,
  topOptions,
  setTopOptions,
  saveToHistory
}) => {
  const { t } = useTranslation();
  const { blindMode } = useA11yStore();

  const announce = (msg: string) => {
    if (blindMode) speech.speak(msg);
  };

  if (!activeObject || (activeObject.type !== 'i-text' && !activeObject.isTextOnPath)) return null;

  return (
    <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar h-full">
      {activeObject.isTextOnPath && (
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{t('editor.panels.text_content', 'Conteúdo do Texto')}</span>
          <textarea
            value={activeObject.originalText || ''}
            onChange={(e) => updateActiveObject('text', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-2 text-xs text-white min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
            placeholder={t('editor.panels.type_something', 'Digite seu texto aqui...')}
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.typography', 'Tipografia')}</span>
          <button 
            onClick={() => fontInputRef.current?.click()}
            className="text-[9px] font-bold text-zinc-400 hover:text-zinc-300 flex items-center gap-1"
          >
            <Plus size={10} /> {t('editor.tools.upload', 'Import')}
          </button>
        </div>
        <select 
          value={activeObject.get('fontFamily') || 'Inter'} 
          onFocus={() => announce(t('editor.panels.typography'))}
          onChange={(e) => {
            if (e.target.value === 'IMPORT_CTA') {
              fontInputRef.current?.click();
            } else {
              updateActiveObject('fontFamily', e.target.value);
              announce(`${t('editor.panels.typography')}: ${e.target.value}`);
            }
          }}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs"
          aria-label={t('editor.panels.typography')}
        >
          {fonts.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
          <option value="IMPORT_CTA" className="text-zinc-400 font-bold bg-zinc-800">
            + {t('editor.panels.import_font', 'Import font')}
          </option>
        </select>
        <div className="space-y-2">
          <label className="text-[9px] text-zinc-500">{t('editor.panels.font_weight', 'Font Weight')}</label>
          <select 
            value={activeObject.fontWeight || 'normal'} 
            onFocus={() => announce(t('editor.panels.font_weight'))}
            onChange={(e) => {
              updateActiveObject('fontWeight', e.target.value);
              announce(`${t('editor.panels.font_weight')}: ${e.target.value}`);
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs"
            aria-label={t('editor.panels.font_weight')}
          >
            <option value="100">100 - {t('editor.panels.thin', 'Thin')}</option>
            <option value="200">200 - {t('editor.panels.extra_light', 'Extra Light')}</option>
            <option value="300">300 - {t('editor.panels.light', 'Light')}</option>
            <option value="normal">400 - {t('editor.panels.regular', 'Regular')}</option>
            <option value="500">500 - {t('editor.panels.medium', 'Medium')}</option>
            <option value="600">600 - {t('editor.panels.semi_bold', 'Semi Bold')}</option>
            <option value="bold">700 - {t('editor.panels.bold', 'Bold')}</option>
            <option value="800">800 - {t('editor.panels.extra_bold', 'Extra Bold')}</option>
            <option value="900">900 - {t('editor.panels.black', 'Black')}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => toggleTextProperty('fontStyle')}
            className={cn("p-2 rounded-md border border-zinc-800 flex items-center justify-center gap-2 text-[10px] font-bold", activeObject.fontStyle === 'italic' ? "bg-[#0f0f0f] border-zinc-700 text-white" : "text-zinc-400")}
          >
            <Italic size={14} /> {t('editor.panels.italic', 'Italic')}
          </button>
          <button 
            onClick={() => toggleTextProperty('underline')}
            className={cn("p-2 rounded-md border border-zinc-800 flex items-center justify-center gap-2 text-[10px] font-bold", activeObject.underline ? "bg-[#0f0f0f] border-zinc-700 text-white" : "text-zinc-400")}
          >
            <Underline size={14} /> {t('editor.panels.underline', 'Underline')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.alignment', 'Alignment')}</span>
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => updateActiveObject('textAlign', 'left')}
            className={cn("p-2 rounded-md border border-zinc-800 flex items-center justify-center", activeObject.textAlign === 'left' ? "bg-[#0f0f0f] border-zinc-700 text-white" : "text-zinc-400")}
          >
            <AlignLeft size={14} />
          </button>
          <button 
            onClick={() => updateActiveObject('textAlign', 'center')}
            className={cn("p-2 rounded-md border border-zinc-800 flex items-center justify-center", activeObject.textAlign === 'center' ? "bg-[#0f0f0f] border-zinc-700 text-white" : "text-zinc-400")}
          >
            <AlignCenter size={14} />
          </button>
          <button 
            onClick={() => updateActiveObject('textAlign', 'right')}
            className={cn("p-2 rounded-md border border-zinc-800 flex items-center justify-center", activeObject.textAlign === 'right' ? "bg-[#0f0f0f] border-zinc-700 text-white" : "text-zinc-400")}
          >
            <AlignRight size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.size_spacing', 'Size and Spacing')}</span>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[9px] text-zinc-500">{t('editor.panels.font_size', 'Font Size')}</label>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => updateActiveObject('fontSize', Math.max(1, (activeObject.fontSize || 40) - 1))}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
              >
                <Minus size={10} />
              </button>
              <input 
                type="number"
                value={Math.round(activeObject.fontSize || 40)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) updateActiveObject('fontSize', val, true);
                }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                onBlur={() => saveToHistory(canvas)}
                className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] focus:outline-none focus:border-blue-500 text-zinc-300 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button 
                onClick={() => updateActiveObject('fontSize', (activeObject.fontSize || 40) + 1)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
              >
                <Plus size={10} />
              </button>
              <span className="text-[9px] font-bold text-zinc-500 ml-1">px</span>
            </div>
          </div>
          <input 
            type="range" 
            min="8" max="200" 
            value={activeObject.fontSize || 12} 
            onChange={(e) => updateActiveObject('fontSize', parseInt(e.target.value), true)}
            onBlur={() => saveToHistory(canvas)}
            className="w-full" 
          />
        </div>
      <div className="space-y-4">
        <span className="text-[10px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.character', 'Caractere')}</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-[9px] text-zinc-500">{t('editor.panels.tracking', 'Tracking')}</label>
              <span className="text-[9px] font-bold">{activeObject.charSpacing}</span>
            </div>
            <input 
              type="range" 
              min="-100" max="1000" 
              value={activeObject.charSpacing || 0} 
              onChange={(e) => updateActiveObject('charSpacing', parseInt(e.target.value), true)}
              onBlur={() => saveToHistory(canvas)}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-[9px] text-zinc-500">{t('editor.panels.leading', 'Leading')}</label>
              <span className="text-[9px] font-bold">{activeObject.lineHeight}</span>
            </div>
            <input 
              type="range" 
              min="0.1" max="5" step="0.1"
              value={activeObject.lineHeight || 1} 
              onChange={(e) => updateActiveObject('lineHeight', parseFloat(e.target.value), true)}
              onBlur={() => saveToHistory(canvas)}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-[9px] text-zinc-500">{t('editor.panels.baseline_shift', 'Baseline Shift')}</label>
              <span className="text-[9px] font-bold">{activeObject.styles?.[0]?.[0]?.deltaY || 0}</span>
            </div>
            <input 
              type="range" 
              min="-50" max="50" step="1"
              value={activeObject.styles?.[0]?.[0]?.deltaY || 0} 
              onChange={(e) => updateActiveObject('deltaY', parseInt(e.target.value), true)}
              onBlur={() => saveToHistory(canvas)}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
            />
          </div>
          <div className="space-y-2 flex flex-col justify-end">
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-zinc-500">{t('editor.panels.kerning', 'Auto Kerning')}</label>
              <button 
                onClick={() => updateActiveObject('kerning', !activeObject.kerning)}
                className={cn("px-2 py-1 rounded text-[9px] font-bold border transition-colors", activeObject.kerning ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-zinc-900 border-zinc-800 text-zinc-500")}
              >
                {activeObject.kerning ? t('common.on', 'On') : t('common.off', 'Off')}
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="space-y-4">
        <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.text_on_path', 'Text on Path')}</span>
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-[9px] text-zinc-500">{t('editor.panels.curve', 'Curve')}</label>
            <span className="text-[9px] font-bold">{activeObject.path ? 'Active' : '0'}</span>
          </div>
          <input 
            type="range" 
            min="-100" max="100" step="1"
            value={activeObject._curve || 0} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              activeObject._curve = val; // Store for UI
              if (val === 0) {
                updateActiveObject('path', null);
              } else {
                const radius = 2000 / Math.abs(val);
                const w = activeObject.width * activeObject.scaleX;
                const sweep = val > 0 ? 1 : 0;
                const pathData = `M 0 0 A ${radius} ${radius} 0 0 ${sweep} ${w} 0`;
                updateActiveObject('path', new fabric.Path(pathData, { fill: 'transparent', stroke: 'transparent' }));
              }
            }}
            className="w-full" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] text-zinc-500">{t('editor.panels.select_path', 'Select a path to follow')}</label>
          <select 
            value={activeObject.path ? 'HAS_PATH' : ''}
            onChange={(e) => {
              if (e.target.value === '') {
                updateActiveObject('path', null);
              } else {
                const pathObj = canvas?.getObjects().find((o: any) => o.id === e.target.value);
                if (pathObj) {
                  // Clone the path to avoid issues with the original object
                  pathObj.clone((clonedPath: any) => {
                    updateActiveObject('path', clonedPath);
                  });
                }
              }
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs"
          >
            <option value="">{t('editor.panels.no_path', 'No Path')}</option>
            {canvas?.getObjects().filter((o: any) => o.type === 'path' && o !== activeObject).map((o: any) => (
              <option key={o.id} value={o.id}>{o.name || `Path ${o.id?.substring(0, 5)}`}</option>
            ))}
            {activeObject.path && <option value="HAS_PATH">{t('editor.panels.current_path', 'Current Path')}</option>}
          </select>
          {activeObject.path && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="space-y-1">
                <label className="text-[8px] text-zinc-600">{t('editor.panels.path_side', 'Lado')}</label>
                <select 
                  value={activeObject.pathSide || 'left'}
                  onChange={(e) => updateActiveObject('pathSide', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[10px]"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-zinc-600">{t('editor.panels.path_align', 'Alinhamento')}</label>
                <select 
                  value={activeObject.pathAlign || 'baseline'}
                  onChange={(e) => updateActiveObject('pathAlign', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[10px]"
                >
                  <option value="baseline">Baseline</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="center">Center</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-[10px] font-bold text-zinc-500 tracking-widest">{t('editor.panels.case', 'Maiúsculas/Minúsculas')}</span>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={toggleTextTransform}
            className={cn("p-2 bg-zinc-900 border border-zinc-800 rounded-md flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-zinc-800", activeObject.text?.toUpperCase() === activeObject.text && "text-blue-400 border-blue-500/50 bg-blue-500/10")}
          >
            <CaseUpper size={14} /> {t('editor.panels.uppercase', 'Maiúsculas')}
          </button>
          <button 
            onClick={() => updateActiveObject('text', activeObject.text?.toLowerCase())}
            className={cn("p-2 bg-zinc-900 border border-zinc-800 rounded-md flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-zinc-800", activeObject.text?.toLowerCase() === activeObject.text && "text-blue-400 border-blue-500/50 bg-blue-500/10")}
          >
            <CaseLower size={14} /> {t('editor.panels.lowercase', 'Minúsculas')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.transform_style', 'Style')}</span>
        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={() => updateActiveObject('strokeWidth', activeObject.strokeWidth ? 0 : 2)}
            className={cn("p-2 bg-zinc-900 border border-zinc-800 rounded-md flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-zinc-800", activeObject.strokeWidth > 0 && "text-blue-500 border-blue-500")}
          >
            <Scissors size={14} /> {t('editor.panels.outline', 'Outline')}
          </button>
        </div>
        {activeObject.strokeWidth > 0 && (
          <div className="space-y-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center">
              <label className="text-[9px] text-zinc-500">{t('editor.panels.outline_width', 'Outline Width')}</label>
              <input 
                type="number" 
                value={activeObject.get?.('_originalStrokeWidth') || activeObject.strokeWidth || 0}
                onChange={(e) => updateActiveObject('strokeWidth', parseFloat(e.target.value), true)}
                onBlur={() => saveToHistory(canvas)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-12 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[10px]"
              />
            </div>
            <input 
              type="range" min="0" max="200" step="0.5"
              value={activeObject.get?.('_originalStrokeWidth') || activeObject.strokeWidth || 0}
              onChange={(e) => updateActiveObject('strokeWidth', parseFloat(e.target.value), true)}
              onBlur={() => saveToHistory(canvas)}
              className="w-full"
            />
            <div className="flex items-center gap-2">
              <label className="text-[9px] text-zinc-500">{t('editor.panels.outline_color', 'Outline Color')}</label>
              <ColorPicker 
                color={activeObject.stroke || '#000000'} 
                onChange={(color) => updateActiveObject('stroke', color)}
                variant="square"
                side="top"
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <button 
            onClick={() => {
              if (activeObject.shadow) updateActiveObject('shadow', null);
              else updateTextShadow('rgba(0,0,0,0.5)', 10, 5, 5);
            }}
            className={cn("w-full p-2 bg-zinc-900 border border-zinc-800 rounded-md flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-zinc-800", activeObject.shadow && "text-zinc-300 border-zinc-700 bg-[#0f0f0f]")}
          >
            <MaskIcon size={14} /> {t('editor.panels.drop_shadow', 'Drop Shadow')}
          </button>
          {activeObject.shadow && (
            <div className="space-y-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.blur', 'Blur')}</label>
                <input 
                  type="range" min="0" max="50"
                  value={activeObject.shadow.blur}
                  onChange={(e) => updateTextShadow(activeObject.shadow.color, parseInt(e.target.value), activeObject.shadow.offsetX, activeObject.shadow.offsetY)}
                  className="w-2/3"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.offset_x', 'Offset X')}</label>
                <input 
                  type="range" min="-50" max="50"
                  value={activeObject.shadow.offsetX}
                  onChange={(e) => updateTextShadow(activeObject.shadow.color, activeObject.shadow.blur, parseInt(e.target.value), activeObject.shadow.offsetY)}
                  className="w-2/3"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.offset_y', 'Offset Y')}</label>
                <input 
                  type="range" min="-50" max="50"
                  value={activeObject.shadow.offsetY}
                  onChange={(e) => updateTextShadow(activeObject.shadow.color, activeObject.shadow.blur, activeObject.shadow.offsetX, parseInt(e.target.value))}
                  className="w-2/3"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.shadow_color', 'Shadow Color')}</label>
                <ColorPicker 
                  color={activeObject.shadow.color} 
                  onChange={(color) => updateTextShadow(color, activeObject.shadow.blur, activeObject.shadow.offsetX, activeObject.shadow.offsetY)}
                  variant="square"
                  side="top"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
