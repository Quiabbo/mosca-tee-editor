import React from 'react';
import { fabric } from 'fabric';
import { Pipette, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getColorName } from '../../utils/colorName';
import { speech } from '../../services/speechService';
import { useA11yStore } from '../../store/useA11yStore';
import { ColorPicker } from '../ColorPicker';

interface ColorPanelProps {
  activeObject: any;
  canvas: fabric.Canvas | null;
  updateActiveObject: (key: string, value: any, skipHistory?: boolean) => void;
  saveToHistory: (canvas: fabric.Canvas) => void;
  harmonyRule: string;
  generateHarmony: (color: string, rule: string) => void;
  harmonies: string[];
  extractColorsFromImage: (file: File) => void;
  GLASS_PRESETS: any[];
  applyGlassEffect: (preset: any) => void;
  GRADIENTS: any[];
  applyGradient: (colors: string[]) => void;
  updateGradientColor: (index: number, color: string) => void;
  addGradientColor: () => void;
  removeGradientColor: (index: number) => void;
  updateGradientType: (type: 'linear' | 'radial') => void;
  updateGradientAngle: (angle: number) => void;
}

export const ColorPanel: React.FC<ColorPanelProps> = ({
  activeObject,
  canvas,
  updateActiveObject,
  saveToHistory,
  harmonyRule,
  generateHarmony,
  harmonies,
  extractColorsFromImage,
  GLASS_PRESETS,
  applyGlassEffect,
  GRADIENTS,
  applyGradient,
  updateGradientColor,
  addGradientColor,
  removeGradientColor,
  updateGradientType,
  updateGradientAngle
}) => {
  const { t, i18n } = useTranslation();

  const getArtboard = () => {
    return canvas?.getObjects().find(obj => (obj as any).id && (obj as any).id.toString().startsWith('artboard_bg'));
  };

  const getFillColor = () => {
    const artboard = getArtboard();
    if (activeObject) return typeof activeObject.fill === 'string' ? activeObject.fill : (activeObject.fill instanceof fabric.Gradient ? (activeObject.fill.colorStops[0]?.color || '#000000') : '#000000');
    if (artboard) return typeof artboard.fill === 'string' ? artboard.fill : (artboard.fill instanceof fabric.Gradient ? (artboard.fill.colorStops[0]?.color || '#ffffff') : '#ffffff');
    return '#ffffff';
  };

  const handleColorChange = (color: string) => {
    const { blindMode } = useA11yStore.getState();
    const lang = i18n.language.startsWith('pt') ? 'pt' : 'en';

    if (activeObject) {
      updateActiveObject('fill', color);
    } else if (canvas) {
      const artboard = getArtboard();
      if (artboard) {
        artboard.set('fill', color);
        canvas.renderAll();
        saveToHistory(canvas);
      }
      
      if (blindMode) {
        const colorName = getColorName(color, lang);
        speech.speak(colorName);
      }
    }
    generateHarmony(color, harmonyRule);
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar h-full">
      <div className="space-y-4">
        <span className="text-[10px] font-bold text-zinc-500">
          {activeObject ? t('editor.panels.object_color', 'Object Color') : t('editor.panels.background_color', 'Background Color')}
        </span>
        <div className="flex items-center gap-4">
          <ColorPicker 
            color={getFillColor()} 
            onChange={handleColorChange}
            variant="square"
            side="bottom"
            className="!block"
          />
          <div className="flex-grow space-y-1">
            <div className="text-[9px] text-zinc-500">Hex</div>
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs font-mono text-zinc-300">
              {getFillColor()}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.glass_effects', 'Glass Effects')}</span>
        <div className="grid grid-cols-5 gap-1.5">
          {GLASS_PRESETS.map((p, idx) => (
            <button 
              key={idx} 
              className="w-full aspect-square rounded-md border border-zinc-800 hover:scale-110 transition-transform flex items-center justify-center relative overflow-hidden" 
              style={{ backgroundColor: p.fill }}
              onClick={() => applyGlassEffect(p)}
              title={t(p.label, p.id) as string}
            >
              <div className="absolute inset-0 border border-white/20 rounded-md" />
              <span className="text-[8px] text-white/50 font-bold">{(t(p.label, p.id) as string)[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold text-zinc-500">{t('editor.panels.gradients', 'Gradients')}</span>
        <div className="grid grid-cols-6 gap-2">
          {GRADIENTS.map((g, idx) => (
            <button 
              key={idx} 
              className="w-full aspect-square rounded-md border border-zinc-800 hover:scale-110 transition-transform" 
              style={{ background: `linear-gradient(to bottom right, ${g.colors[0]}, ${g.colors[1]})` }}
              onClick={() => applyGradient(g.colors)}
              title={t(g.name, g.id) as string}
            />
          ))}
        </div>
      </div>

      {/* Gradient Editor Section */}
      {(() => {
        const artboard = getArtboard();
        const activeFill = activeObject?.fill;
        const artboardFill = artboard?.fill;
        
        const hasActiveGradient = activeFill && (activeFill instanceof fabric.Gradient || (typeof activeFill === 'object' && (activeFill as any).type === 'gradient' || (activeFill as any).colorStops));
        const hasArtboardGradient = artboardFill && (artboardFill instanceof fabric.Gradient || (typeof artboardFill === 'object' && (artboardFill as any).type === 'gradient' || (artboardFill as any).colorStops));
        
        if (!hasActiveGradient && !hasArtboardGradient) return null;
        
        const target = hasActiveGradient ? activeObject : artboard;
        const fill = target.fill as fabric.Gradient;
        if (!fill) return null;

        return (
          <div className="space-y-4 pt-4 border-t border-zinc-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {hasActiveGradient ? t('editor.panels.edit_object_gradient', 'Editar Degradê do Objeto') : t('editor.panels.edit_artboard_gradient', 'Editar Degradê da Prancheta')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500">{t('editor.panels.gradient_type', 'Tipo')}</label>
                <select 
                  value={fill.type}
                  onChange={(e) => updateGradientType(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-[10px] text-zinc-300 outline-none focus:border-blue-500"
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
              </div>
              {fill.type === 'linear' && (
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500">{t('editor.panels.gradient_angle', 'Ângulo')}</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={(fill as any).angle || 0}
                      onChange={(e) => updateGradientAngle(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-[10px] text-zinc-300 outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">°</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              {fill.colorStops?.map((stop: any, idx: number) => (
                <div key={idx} className="space-y-1 relative group">
                  <div className="flex justify-between items-center pr-1">
                    <label className="text-[9px] text-zinc-500">{t('editor.panels.color', 'Cor')} {idx + 1}</label>
                    {fill.colorStops!.length > 2 && (
                      <button 
                        onClick={() => removeGradientColor(idx)}
                        className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                  <ColorPicker 
                    color={stop.color} 
                    onChange={(color) => updateGradientColor(idx, color)}
                    variant="square"
                    side="top"
                  />
                </div>
              ))}
              <button 
                onClick={addGradientColor}
                className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 border-dashed rounded-md hover:border-blue-500 hover:text-blue-500 transition-all text-zinc-500 mb-[2px]"
                title={t('editor.panels.add_color', 'Adicionar Cor')}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
