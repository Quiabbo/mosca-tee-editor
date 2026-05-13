import React from 'react';

interface PresetCardProps {
  icon: any;
  name: string;
  size: string;
  onClick: () => void;
}

export const PresetCard = ({ icon: Icon, name, size, onClick }: PresetCardProps) => (
  <button 
    onClick={onClick}
    className="p-3 sm:p-4 lg:p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-blue-500/50 hover:bg-zinc-800 transition-all text-left group"
  >
    <div className="p-1.5 sm:p-2 lg:p-2 bg-zinc-800 rounded-lg w-fit mb-2 sm:mb-3 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-colors">
      <Icon size={18} className="sm:size-[20px] lg:size-[20px]" />
    </div>
    <div className="text-[7.5px] sm:text-[10px] lg:text-sm font-bold mb-0.5 sm:mb-1 truncate leading-tight">{name}</div>
    <div className="text-[7px] sm:text-[9px] lg:text-[11px] text-zinc-500 truncate">{size}</div>
  </button>
);
