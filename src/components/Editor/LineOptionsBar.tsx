import React from 'react';
import { ColorPicker } from '../ColorPicker';
import { Minus, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LineOptionsBarProps {
  lineOptions: {
    strokeWidth: number;
    stroke: string;
    strokeLineCap: string;
    strokeDashArray: number[] | null;
    opacity: number;
    dashGap: number;
    dashLen: number;
    arrowType: string;
    lineStyle: string;
  };
  updateLineProperty: (prop: string, value: any) => void;
  setLineStyle: (style: string) => void;
  setLineCap: (cap: string) => void;
  setLineArrow: (type: string) => void;
  updateLineDashGap: (gap: number) => void;
  t: any;
}

export const LineOptionsBar: React.FC<LineOptionsBarProps> = ({
  lineOptions,
  updateLineProperty,
  setLineStyle,
  setLineCap,
  setLineArrow,
  updateLineDashGap,
  t
}) => {
  return (
    <div className="flex items-center gap-4 px-4 h-12 bg-[#191919] border-b border-zinc-800 shadow-sm shrink-0 z-[90]">
      
      {/* ESPESSURA */}
      <div className="flex items-center gap-1.5">
        <Minus size={14} className="text-zinc-500" />
        <input
          type="number"
          min="0.5"
          max="200"
          step="0.5"
          value={lineOptions.strokeWidth}
          onChange={(e) => updateLineProperty('strokeWidth', parseFloat(e.target.value) || 1)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="w-14 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-blue-500 text-center"
        />
        <span className="text-[10px] text-zinc-500">px</span>
      </div>

      <div className="w-px h-5 bg-zinc-800 shrink-0" />

      {/* COLOR */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.color', 'Color')}</span>
        <ColorPicker 
          color={lineOptions.stroke} 
          onChange={(color) => updateLineProperty('stroke', color)}
          variant="square"
          side="bottom"
        />
      </div>

      <div className="w-px h-5 bg-zinc-800 shrink-0" />

      {/* LINE STYLE */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.style', 'Style')}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setLineStyle('solid')}
            className={cn(
              "w-11 h-7 rounded-md border flex items-center justify-center transition-all",
              lineOptions.lineStyle === 'solid' ? "bg-[#0f0f0f] border-zinc-700" : "bg-transparent border-zinc-800 hover:border-zinc-700"
            )}
            title={t('editor.tools.line_style_solid', 'Solid line')}
          >
            <svg width="26" height="2" viewBox="0 0 26 2">
              <line x1="0" y1="1" x2="26" y2="1" stroke={lineOptions.lineStyle === 'solid' ? "#d4d4d8" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <button
            onClick={() => setLineStyle('dashed')}
            className={cn(
              "w-11 h-7 rounded-md border flex items-center justify-center transition-all",
              lineOptions.lineStyle === 'dashed' ? "bg-[#0f0f0f] border-zinc-700" : "bg-transparent border-zinc-800 hover:border-zinc-700"
            )}
            title={t('editor.tools.line_style_dashed', 'Dashed line')}
          >
            <svg width="26" height="2" viewBox="0 0 26 2">
              <line x1="0" y1="1" x2="26" y2="1" stroke={lineOptions.lineStyle === 'dashed' ? "#d4d4d8" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
            </svg>
          </button>

          <button
            onClick={() => setLineStyle('dotted')}
            className={cn(
              "w-11 h-7 rounded-md border flex items-center justify-center transition-all",
              lineOptions.lineStyle === 'dotted' ? "bg-[#0f0f0f] border-zinc-700" : "bg-transparent border-zinc-800 hover:border-zinc-700"
            )}
            title={t('editor.tools.line_style_dotted', 'Dotted line')}
          >
            <svg width="26" height="2" viewBox="0 0 26 2">
              <line x1="0" y1="1" x2="26" y2="1" stroke={lineOptions.lineStyle === 'dotted' ? "#d4d4d8" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" strokeDasharray="1 4" />
            </svg>
          </button>
        </div>
      </div>

      {/* GAP (only for dashed/dotted) */}
      {(lineOptions.lineStyle === 'dashed' || lineOptions.lineStyle === 'dotted') && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.gap', 'Gap')}</span>
          <input
            type="range"
            min="1"
            max="40"
            step="1"
            value={lineOptions.dashGap}
            onChange={(e) => updateLineDashGap(parseInt(e.target.value))}
            className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-[10px] text-zinc-500 font-mono w-7">{lineOptions.dashGap}px</span>
        </div>
      )}

      <div className="w-px h-5 bg-zinc-800 shrink-0" />

      {/* CAPS */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.caps', 'Caps')}</span>
        <div className="flex gap-1">
          {['butt', 'round', 'square'].map((cap) => (
            <button
              key={cap}
              onClick={() => setLineCap(cap)}
              title={t(`editor.tools.cap_${cap}`, cap)}
              className={cn(
                "px-2 py-1 text-[10px] font-bold rounded-md border transition-all",
                lineOptions.strokeLineCap === cap ? "bg-[#0f0f0f] border-zinc-700 text-zinc-300" : "bg-transparent border-zinc-800 text-zinc-400 hover:border-zinc-700"
              )}
            >
              {cap === 'butt' ? '|—|' : cap === 'round' ? '●—●' : '■—■'}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-zinc-800 shrink-0" />

      {/* ARROW */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.arrow', 'Arrow')}</span>
        <div className="relative group">
          <button className="flex items-center gap-1 text-[10px] text-zinc-300 hover:text-white bg-zinc-900 px-2 py-1 rounded border border-zinc-800 min-w-[80px] justify-between">
            {lineOptions.arrowType === 'none' ? t('editor.tools.arrow_none', 'None') :
             lineOptions.arrowType === 'end' ? t('editor.tools.arrow_end', '→ End') :
             lineOptions.arrowType === 'start' ? t('editor.tools.arrow_start', '← Start') :
             t('editor.tools.arrow_both', '↔ Both')}
            <ChevronDown size={10} />
          </button>
          <div className="absolute left-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[200]">
            {[
              { id: 'none', label: t('editor.tools.arrow_none', 'None') },
              { id: 'end', label: t('editor.tools.arrow_end', '→ End') },
              { id: 'start', label: t('editor.tools.arrow_start', '← Start') },
              { id: 'both', label: t('editor.tools.arrow_both', '↔ Both') }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setLineArrow(type.id)}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-[10px] hover:bg-zinc-800",
                  lineOptions.arrowType === type.id ? "text-zinc-300" : "text-zinc-400"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-px h-5 bg-zinc-800 shrink-0" />

      {/* OPACITY */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 font-bold tracking-wider">{t('editor.tools.opacity', 'Opacity')}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(lineOptions.opacity * 100)}
          onChange={(e) => updateLineProperty('opacity', parseInt(e.target.value) / 100)}
          className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-[10px] text-zinc-500 font-mono w-8">{Math.round(lineOptions.opacity * 100)}%</span>
      </div>

    </div>
  );
};
