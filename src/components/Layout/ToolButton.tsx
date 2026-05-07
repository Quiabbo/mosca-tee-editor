import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';

export interface SubTool {
  id: string;
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface ToolButtonProps {
  icon: any;
  active: boolean;
  onClick: () => void;
  tooltip: string;
  className?: string;
  subTools?: SubTool[];
}

export const ToolButton = ({ icon: Icon, active, onClick, tooltip, className, subTools }: ToolButtonProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (subTools && subTools.length > 0) {
      e.preventDefault();
      setShowMenu(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="relative group">
      <button 
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className={cn(
          "flex items-center justify-center rounded-xl transition-all border relative",
          "h-7 w-7 sm:h-8 sm:w-8 lg:h-8 lg:w-8", 
          active 
            ? "bg-[#0f0f0f] text-white border-zinc-800" 
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white border-transparent",
          className
        )}
      >
        <div className="scale-[0.85] sm:scale-95 lg:scale-95">
          <Icon size={18} />
        </div>
        {subTools && subTools.length > 0 && (
          <div className="absolute bottom-1 right-1 w-0 h-0 border-t-[3px] border-t-transparent border-r-[3px] border-r-zinc-500" />
        )}
      </button>

      {!showMenu && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          {tooltip}
        </div>
      )}

      <AnimatePresence>
        {showMenu && subTools && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-full top-0 ml-1 bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-2xl z-[100] py-1 min-w-[160px]"
          >
            {subTools.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  sub.onClick();
                  setShowMenu(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-xs transition-colors hover:bg-zinc-800",
                  sub.active ? "text-white bg-zinc-800/50" : "text-zinc-400"
                )}
              >
                <sub.icon size={16} />
                <span className="flex-grow text-left">{sub.label}</span>
                {sub.active && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
