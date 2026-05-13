import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Sun, Palette, Type, Layers, Box, RefreshCw, Plus, Minus, BoxSelect } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { ColorPicker } from '../ColorPicker';
import { GRADIENTS } from '../../constants/tee';

interface LayerStyles {
  dropShadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
  };
  innerShadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
  };
  outerGlow: {
    enabled: boolean;
    color: string;
    blur: number;
    opacity: number;
  };
  innerGlow: {
    enabled: boolean;
    color: string;
    blur: number;
    opacity: number;
  };
  colorOverlay: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  gradientOverlay: {
    enabled: boolean;
    type: 'linear' | 'radial';
    angle: number;
    colorStops: Array<{ color: string; offset: number }>;
    opacity: number;
    blendMode?: string;
  };
  stroke: {
    enabled: boolean;
    color: string;
    width: number;
    position: 'inside' | 'center' | 'outside';
    opacity: number;
    gradient?: {
      enabled: boolean;
      type: 'linear' | 'radial';
      angle: number;
      colorStops: Array<{ color: string; offset: number }>;
    };
  };
}

interface LayerStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeObject: any;
  onApply: (styles: LayerStyles) => void;
  onConfirm?: (styles: LayerStyles) => void;
}

const DEFAULT_STYLES: LayerStyles = {
  dropShadow: { enabled: false, color: '#000000', blur: 10, offsetX: 5, offsetY: 5, opacity: 0.5 },
  innerShadow: { enabled: false, color: '#000000', blur: 10, offsetX: 5, offsetY: 5, opacity: 0.5 },
  outerGlow: { enabled: false, color: '#ffff00', blur: 20, opacity: 0.5 },
  innerGlow: { enabled: false, color: '#ffff00', blur: 20, opacity: 0.5 },
  colorOverlay: { enabled: false, color: '#ff0000', opacity: 1 },
  gradientOverlay: { 
    enabled: false, 
    type: 'linear', 
    angle: 90, 
    colorStops: [
      { color: '#ffffff', offset: 0 },
      { color: '#000000', offset: 1 }
    ],
    opacity: 1,
    blendMode: 'normal'
  },
  stroke: { 
    enabled: false, 
    color: '#000000', 
    width: 2, 
    position: 'center', 
    opacity: 1,
    gradient: {
      enabled: false,
      type: 'linear',
      angle: 90,
      colorStops: [
        { color: '#ffffff', offset: 0 },
        { color: '#000000', offset: 1 }
      ]
    }
  }
};

const GradientControl = ({ 
  gradient, 
  onChange, 
  t 
}: { 
  gradient: any, 
  onChange: (field: string, value: any) => void,
  t: any
}) => {
  const addStop = () => {
    const stops = [...gradient.colorStops];
    const lastColor = stops[stops.length - 1].color;
    stops.push({ color: lastColor, offset: 1 });
    // Redistribute offsets
    const newStops = stops.map((s, i) => ({
      color: s.color,
      offset: i / (stops.length - 1)
    }));
    onChange('colorStops', newStops);
  };

  const removeStop = (idx: number) => {
    if (gradient.colorStops.length <= 2) return;
    const stops = [...gradient.colorStops];
    stops.splice(idx, 1);
    // Redistribute
    const newStops = stops.map((s, i) => ({
      color: s.color,
      offset: i / (stops.length - 1)
    }));
    onChange('colorStops', newStops);
  };

  const updateStopColor = (idx: number, color: string) => {
    const stops = [...gradient.colorStops];
    stops[idx] = { ...stops[idx], color };
    onChange('colorStops', stops);
  };

  const applyPreset = (preset: any) => {
    if (preset.colorStops) {
      onChange('colorStops', preset.colorStops.map((s: any) => ({ ...s })));
    } else if (preset.colors) {
      // Map simple colors array to colorStops
      const stops = preset.colors.map((c: string, i: number) => ({
        color: c,
        offset: i / (preset.colors.length - 1)
      }));
      onChange('colorStops', stops);
    }
    
    if (preset.type) {
      onChange('type', preset.type);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Presets Row */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('editor.panels.presets', 'Presets')}</label>
        <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50 max-h-[80px] overflow-y-auto custom-scrollbar">
          {GRADIENTS.map((g: any, idx) => {
            const background = g.colorStops 
              ? (g.type === 'linear' 
                  ? `linear-gradient(${g.angle || 0}deg, ${g.colorStops.map((s: any) => s.color).join(', ')})`
                  : `radial-gradient(circle, ${g.colorStops.map((s: any) => s.color).join(', ')})`)
              : `linear-gradient(135deg, ${g.colors.join(', ')})`;
            
            return (
              <button
                key={idx}
                onClick={() => applyPreset(g)}
                className="w-6 h-6 rounded-md border border-zinc-700 hover:border-blue-500 transition-all shrink-0"
                title={t(g.name, g.id)}
                style={{ background }}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.type', 'Type')}</label>
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            {(['linear', 'radial'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onChange('type', type)}
                className={cn(
                  "flex-grow py-1 text-[10px] font-bold rounded-md transition-all capitalize",
                  gradient.type === type ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        {gradient.type === 'linear' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.angle', 'Angle')}</label>
            <div className="flex items-center gap-2">
              <input 
                type="range" min="0" max="360"
                value={gradient.angle || 0}
                onChange={(e) => onChange('angle', parseInt(e.target.value) || 0)}
                className="flex-grow accent-blue-500 h-1"
              />
              <input 
                type="number"
                value={gradient.angle || 0}
                onChange={(e) => onChange('angle', parseInt(e.target.value) || 0)}
                className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.edit_gradient', 'Edit Gradient')}</label>
        <div className="flex flex-wrap items-center gap-2 bg-zinc-900/30 p-2 rounded-xl border border-zinc-800/50">
          {gradient.colorStops.map((stop: any, idx: number) => (
            <div key={idx} className="relative group">
              <ColorPicker 
                color={stop.color}
                onChange={(c) => updateStopColor(idx, c)}
                variant="square"
                className="w-8 h-8 rounded-lg shadow-lg"
              />
              {gradient.colorStops.length > 2 && (
                <button 
                  onClick={() => removeStop(idx)}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110"
                >
                  <Minus size={8} />
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={addStop}
            className="w-8 h-8 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg text-zinc-600 hover:text-blue-500 hover:border-blue-500/50 transition-all"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const LayerStylesModal = ({ isOpen, onClose, activeObject, onApply, onConfirm }: LayerStylesModalProps) => {
  const { t } = useTranslation();
  const [styles, setStyles] = useState<LayerStyles>(DEFAULT_STYLES);
  const [activeSection, setActiveSection] = useState<keyof LayerStyles>('dropShadow');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  useEffect(() => {
    if (activeObject && isOpen) {
      // Try to load existing styles from object metadata if available
      const existingStyles = activeObject.get('layerStyles');
      if (existingStyles) {
        setStyles(existingStyles);
      } else {
        // Fallback: try to infer from fabric properties
        const inferred: LayerStyles = JSON.parse(JSON.stringify(DEFAULT_STYLES));
        if (activeObject.shadow) {
          inferred.dropShadow = {
            enabled: true,
            color: activeObject.shadow.color || '#000000',
            blur: activeObject.shadow.blur || 10,
            offsetX: activeObject.shadow.offsetX || 0,
            offsetY: activeObject.shadow.offsetY || 0,
            opacity: 1 // Fabric shadow color might have opacity
          };
        }
        if (activeObject.stroke && activeObject.strokeWidth > 0) {
          inferred.stroke = {
            enabled: true,
            color: activeObject.stroke,
            width: activeObject.strokeWidth,
            position: 'center',
            opacity: 1
          };
        }
        setStyles(inferred);
      }
    }
  }, [activeObject, isOpen]);

  const applyTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const updateStyle = (section: keyof LayerStyles, field: string, value: any) => {
    const newStyles = {
      ...styles,
      [section]: {
        ...styles[section],
        [field]: value
      }
    };
    setStyles(newStyles);
    
    // Debounce to keep sliders fluid
    if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    applyTimeoutRef.current = setTimeout(() => {
      onApply(newStyles);
    }, 50);
  };

  const toggleSection = (section: keyof LayerStyles) => {
    const newStyles = {
      ...styles,
      [section]: {
        ...styles[section],
        enabled: !styles[section].enabled
      }
    };
    setStyles(newStyles);
    onApply(newStyles);
  };

  if (!isOpen) return null;

  const sections = [
    { id: 'dropShadow', label: t('editor.panels.layer_styles.drop_shadow', 'Drop Shadow'), icon: Layers },
    { id: 'innerShadow', label: t('editor.panels.layer_styles.inner_shadow', 'Inner Shadow'), icon: Layers },
    { id: 'outerGlow', label: t('editor.panels.layer_styles.outer_glow', 'Outer Glow'), icon: Sun },
    { id: 'innerGlow', label: t('editor.panels.layer_styles.inner_glow', 'Inner Glow'), icon: Sun },
    { id: 'colorOverlay', label: t('editor.panels.layer_styles.color_overlay', 'Color Overlay'), icon: Palette },
    { id: 'gradientOverlay', label: t('editor.panels.layer_styles.gradient_overlay', 'Sobreposição de Gradiente'), icon: RefreshCw },
    { id: 'stroke', label: t('editor.panels.layer_styles.stroke', 'Stroke'), icon: Type },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <motion.div 
        drag
        dragMomentum={false}
        dragListener={true}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[480px] pointer-events-auto"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-[#191919] cursor-move">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">{t('editor.panels.layer_styles.title', 'Layer Styles')}</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">{activeObject?.name || t('editor.panels.layer_styles.layer', 'Layer')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-grow overflow-hidden">
          {/* Sidebar */}
          <div className="w-52 border-r border-zinc-800 bg-[#191919] overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {sections.map((section) => {
              const Icon = section.icon;
              const isEnabled = styles[section.id as keyof LayerStyles].enabled;
              const isActive = activeSection === section.id;

              return (
                <div 
                  key={section.id}
                  className={cn(
                    "flex items-center gap-2 p-1.5 rounded-lg transition-all cursor-pointer group",
                    isActive ? "bg-blue-500/10 text-blue-400" : "hover:bg-zinc-800 text-zinc-400"
                  )}
                  onClick={() => {
                    setActiveSection(section.id as keyof LayerStyles);
                    if (!isEnabled) {
                      toggleSection(section.id as keyof LayerStyles);
                    }
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={isEnabled}
                    onChange={() => toggleSection(section.id as keyof LayerStyles)}
                    className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-900"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Icon size={14} className={cn(isEnabled ? "opacity-100" : "opacity-40")} />
                  <span className="text-[11px] font-medium flex-grow truncate">{section.label}</span>
                  <ChevronRight size={12} className={cn("transition-transform shrink-0", isActive ? "rotate-90" : "opacity-0 group-hover:opacity-100")} />
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-4 bg-[#1e1e1e] custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    {sections.find(s => s.id === activeSection)?.label}
                  </h3>
                </div>

                <div className={cn("space-y-3", !styles[activeSection].enabled && "opacity-40 pointer-events-none")}>
                  {/* Common Controls: Color & Opacity / Blend Mode & Opacity */}
                  <div className="grid grid-cols-2 gap-3">
                    {activeSection !== 'gradientOverlay' ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.color', 'Color')}</label>
                        <div className="relative">
                          <ColorPicker 
                            color={(styles[activeSection] as any).color} 
                            onChange={(c) => updateStyle(activeSection, 'color', c)} 
                            variant="square"
                            showText={true}
                            className="w-full h-8"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.layer_styles.blend_mode', 'Modo de Mesclagem')}</label>
                        <select
                          value={(styles.gradientOverlay as any).blendMode || 'normal'}
                          onChange={(e) => updateStyle('gradientOverlay', 'blendMode', e.target.value)}
                          className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-[11px] font-medium text-zinc-300 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                        >
                          <option value="normal">Normal</option>
                          <option value="multiply">Multiply</option>
                          <option value="screen">Screen</option>
                          <option value="overlay">Overlay</option>
                          <option value="darken">Darken</option>
                          <option value="lighten">Lighten</option>
                          <option value="color-burn">Color Burn</option>
                          <option value="color-dodge">Color Dodge</option>
                          <option value="hard-light">Hard Light</option>
                          <option value="soft-light">Soft Light</option>
                          <option value="difference">Difference</option>
                          <option value="exclusion">Exclusion</option>
                          <option value="hue">Hue</option>
                          <option value="saturation">Saturation</option>
                          <option value="color">Color</option>
                          <option value="luminosity">Luminosity</option>
                        </select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.opacity', 'Opacity')}</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="0" max="1" step="0.01"
                          value={(styles[activeSection] as any).opacity || 0}
                          onChange={(e) => updateStyle(activeSection, 'opacity', parseFloat(e.target.value) || 0)}
                          className="flex-grow accent-blue-500 h-1"
                        />
                        <div className="flex items-center gap-0.5">
                          <input 
                            type="number"
                            value={Math.round(((styles[activeSection] as any).opacity || 0) * 100)}
                            onChange={(e) => updateStyle(activeSection, 'opacity', (parseInt(e.target.value) || 0) / 100)}
                            className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                          />
                          <span className="text-[10px] font-mono text-zinc-500">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Specific Controls */}
                  {(activeSection === 'dropShadow' || activeSection === 'innerShadow') && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.layer_styles.blur', 'Blur')}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="range" min="0" max="100"
                            value={(styles[activeSection] as any).blur || 0}
                            onChange={(e) => updateStyle(activeSection, 'blur', parseInt(e.target.value) || 0)}
                            className="flex-grow accent-blue-500 h-1"
                          />
                          <div className="flex items-center gap-0.5">
                            <input 
                              type="number"
                              value={(styles[activeSection] as any).blur || 0}
                              onChange={(e) => updateStyle(activeSection, 'blur', parseInt(e.target.value) || 0)}
                              className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                            />
                            <span className="text-[10px] font-mono text-zinc-500">px</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.layer_styles.distance_x', 'Distance X')}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="range" min="-100" max="100"
                            value={(styles[activeSection] as any).offsetX || 0}
                            onChange={(e) => updateStyle(activeSection, 'offsetX', parseInt(e.target.value) || 0)}
                            className="flex-grow accent-blue-500 h-1"
                          />
                          <div className="flex items-center gap-0.5">
                            <input 
                              type="number"
                              value={(styles[activeSection] as any).offsetX || 0}
                              onChange={(e) => updateStyle(activeSection, 'offsetX', parseInt(e.target.value) || 0)}
                              className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                            />
                            <span className="text-[10px] font-mono text-zinc-500">px</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.layer_styles.distance_y', 'Distance Y')}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="range" min="-100" max="100"
                            value={(styles[activeSection] as any).offsetY || 0}
                            onChange={(e) => updateStyle(activeSection, 'offsetY', parseInt(e.target.value) || 0)}
                            className="flex-grow accent-blue-500 h-1"
                          />
                          <div className="flex items-center gap-0.5">
                            <input 
                              type="number"
                              value={(styles[activeSection] as any).offsetY || 0}
                              onChange={(e) => updateStyle(activeSection, 'offsetY', parseInt(e.target.value) || 0)}
                              className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                            />
                            <span className="text-[10px] font-mono text-zinc-500">px</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(activeSection === 'outerGlow' || activeSection === 'innerGlow') && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.layer_styles.size', 'Size')}</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" min="0" max="200"
                          value={(styles[activeSection] as any).blur}
                          onChange={(e) => updateStyle(activeSection, 'blur', parseInt(e.target.value))}
                          className="flex-grow accent-blue-500 h-1"
                        />
                        <div className="flex items-center gap-0.5">
                          <input 
                            type="number"
                            value={(styles[activeSection] as any).blur}
                            onChange={(e) => updateStyle(activeSection, 'blur', parseInt(e.target.value) || 0)}
                            className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                          />
                          <span className="text-[10px] font-mono text-zinc-500">px</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'gradientOverlay' && (
                    <GradientControl 
                      gradient={styles.gradientOverlay} 
                      t={t} 
                      onChange={(field, value) => updateStyle('gradientOverlay', field, value)} 
                    />
                  )}

                  {activeSection === 'stroke' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('editor.panels.layer_styles.width', 'Width')}</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" min="0" max="50"
                              value={styles.stroke.width || 0}
                              onChange={(e) => updateStyle('stroke', 'width', parseInt(e.target.value) || 0)}
                              className="flex-grow accent-blue-500 h-1"
                            />
                            <div className="flex items-center gap-0.5">
                              <input 
                                type="number"
                                value={styles.stroke.width || 0}
                                onChange={(e) => updateStyle('stroke', 'width', parseInt(e.target.value) || 0)}
                                className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-zinc-400 text-center focus:border-blue-500 outline-none"
                              />
                              <span className="text-[10px] font-mono text-zinc-500">px</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500">{t('editor.panels.layer_styles.position', 'Position')}</label>
                          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                            {(['inside', 'center', 'outside'] as const).map((pos) => (
                              <button
                                key={pos}
                                onClick={() => updateStyle('stroke', 'position', pos)}
                                className={cn(
                                  "flex-grow py-1 text-[10px] font-bold rounded-md transition-all",
                                  styles.stroke.position === pos ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                )}
                              >
                                {t(`editor.panels.layer_styles.pos_${pos}`, pos)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={styles.stroke.gradient?.enabled}
                            onChange={(e) => updateStyle('stroke', 'gradient', { ...styles.stroke.gradient, enabled: e.target.checked })}
                            className="w-3 h-3 rounded border-zinc-700 bg-zinc-800 text-blue-500"
                            id="stroke-gradient-toggle"
                          />
                          <label htmlFor="stroke-gradient-toggle" className="text-[10px] font-bold text-zinc-400 cursor-pointer">
                            {t('editor.panels.layer_styles.use_gradient', 'Usar Gradiente no Traçado')}
                          </label>
                        </div>

                        {styles.stroke.gradient?.enabled && (
                          <div className="p-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50 scale-95 origin-top">
                            <GradientControl 
                              gradient={styles.stroke.gradient} 
                              t={t} 
                              onChange={(field, value) => updateStyle('stroke', 'gradient', { ...styles.stroke.gradient, [field]: value })}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between bg-[#191919]">
          <button 
            onClick={() => {
              setStyles(DEFAULT_STYLES);
              onApply(DEFAULT_STYLES);
            }}
            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 tracking-widest uppercase"
          >
            <RefreshCw size={12} />
            {t('editor.panels.layer_styles.reset', 'Reset styles')}
          </button>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition-all"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button 
              onClick={() => {
                if (onConfirm) onConfirm(styles);
                else onApply(styles);
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              {t('common.ok', 'OK')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LayerStylesModal;
