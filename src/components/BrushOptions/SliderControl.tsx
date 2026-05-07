import React, { useState, useEffect } from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
  inputWidth?: string;
}

export function SliderControl({ label, value, min, max, unit, onChange, inputWidth = 'w-12' }: SliderControlProps) {
  const [inputValue, setInputValue] = useState(String(value));

  // Sincronizar input quando o valor externo mudar
  useEffect(() => setInputValue(String(value)), [value]);

  const handleInputCommit = () => {
    const parsed = parseInt(inputValue);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    } else {
      setInputValue(String(value)); // revert
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase font-bold text-zinc-500 whitespace-nowrap">{label}</span>
      
      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
      />

      {/* Input numérico */}
      <div className="flex items-center gap-0.5">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleInputCommit();
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              onChange(Math.min(max, value + 1));
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              onChange(Math.max(min, value - 1));
            }
          }}
          className={`${inputWidth} bg-zinc-900 border border-zinc-800 rounded px-1 
                      text-[11px] text-center text-zinc-200 focus:border-zinc-700 
                      focus:outline-none hover:border-zinc-700 transition-colors font-mono`}
        />
        <span className="text-[10px] text-zinc-600 font-bold">{unit}</span>
      </div>
    </div>
  );
}
