import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Move, Square, Circle, Type, Image as ImageIcon, Box, Eye, EyeOff, Lock, Unlock, Layers, Edit3, Scissors,
  ChevronDown, ChevronRight, Folder, FolderOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { useA11yStore } from '../../store/useA11yStore';
import { speech } from '../../services/speechService';

interface SortableLayerItemProps {
  layer: any;
  activeObject: any;
  canvas: any;
  toggleVisibility: (layer: any) => void;
  toggleLock: (layer: any) => void;
  onRename: (id: string, name: string) => void;
  isEditing: boolean;
  onStartEditing: (id: string, name: string) => void;
  onCancelEditing: () => void;
  isSelected: boolean;
  onClick: (e: React.MouseEvent, layer: any) => void;
  onOpenStyles?: (layer: any) => void;
  enterPowerClipEditMode?: (pc: any) => void;
  extractPowerClip?: (pc: any) => void;
  onConvertToSmartObject?: (layer: any) => void;
  onEditSmartObject?: (layer: any) => void;
  onResetSmartObject?: (layer: any) => void;
  onToggleExpansion?: (layerId: string) => void;
}

export const SortableLayerItem = React.memo(({ 
  layer, 
  activeObject, 
  canvas, 
  toggleVisibility, 
  toggleLock,
  onRename,
  isEditing,
  onStartEditing,
  onCancelEditing,
  isSelected,
  onClick,
  onOpenStyles,
  enterPowerClipEditMode,
  extractPowerClip,
  onConvertToSmartObject,
  onEditSmartObject,
  onResetSmartObject,
  onToggleExpansion,
}: SortableLayerItemProps) => {
  const { t } = useTranslation();
  const { blindMode } = useA11yStore();
  const [showContextMenu, setShowContextMenu] = useState<{ x: number, y: number } | null>(null);

  const announce = (msg: string) => {
    if (blindMode) speech.speak(msg);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const [tempName, setTempName] = useState(layer.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      {...attributes} 
      {...listeners} 
      ref={setNodeRef}
      style={{
        ...style,
        paddingLeft: layer.depth ? `${layer.depth * 20 + 8}px` : '8px'
      }}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg border border-transparent transition-all cursor-pointer group",
        (activeObject === layer.object || isSelected) ? "bg-[#0f0f0f] border-transparent text-white" : "hover:bg-zinc-800 text-zinc-400",
        isDragging && "shadow-lg bg-zinc-800 border-zinc-700",
        (layer.object?.hasClippingMask || layer.depth > 0) && "border-l-2 border-zinc-700"
      )}
      onFocus={() => announce(`${t('editor.panels.layers')}: ${layer.name}`)}
      onClick={(e) => {
        onClick(e, layer);
        announce(`${t('editor.panels.layers')}: ${layer.name} ${t('a11y.speech.object.selected_short', 'selecionado')}`);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!isSelected) {
          onClick(e, layer);
        }
        setShowContextMenu({ x: e.clientX, y: e.clientY });
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onOpenStyles) onOpenStyles(layer);
      }}
      tabIndex={0}
      role="listitem"
      aria-label={`${layer.name}, ${layer.visible ? t('editor.panels.visible', 'visible') : t('editor.panels.hidden', 'hidden')}, ${layer.locked ? t('editor.panels.locked', 'locked') : t('editor.panels.unlocked', 'unlocked')}`}
    >
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          toggleVisibility(layer); 
          announce(layer.visible ? t('editor.panels.hidden', 'hidden') : t('editor.panels.visible', 'visible'));
        }}
        className={cn("p-1 hover:bg-white/10 rounded-md text-zinc-600 hover:text-zinc-400 flex-shrink-0 transition-colors", !layer.visible && "text-red-500")}
        aria-label={layer.visible ? t('editor.panels.hide', 'Hide') : t('editor.panels.show', 'Show')}
      >
        {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>

      {layer.isGroup && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpansion?.(layer.id);
          }}
          className="p-1 hover:bg-white/10 rounded-md text-zinc-500 hover:text-zinc-300"
        >
          {layer.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      )}

      <div className="w-8 h-8 flex-shrink-0 bg-zinc-800 rounded-md flex items-center justify-center text-zinc-500 relative">
        {layer.type === 'rect' && <Square size={13} />}
        {layer.type === 'circle' && <Circle size={13} />}
        {(layer.type === 'i-text' || layer.type === 'textbox') && <Type size={13} />}
        {layer.type === 'image' && <ImageIcon size={13} strokeWidth={2} />}
        {(layer.type === 'folder' || layer.type === 'group') && (layer.isExpanded ? <FolderOpen size={13} /> : <Folder size={13} />)}
        
        {layer.object?.isSmartObject && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 rounded-sm flex items-center justify-center border border-zinc-900" title={t('editor.layers.smart_object', 'Smart Object')}>
            <Box size={8} className="text-white" />
          </div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        {isEditing ? (
          <input
            autoFocus
            className="text-[11px] font-bold bg-zinc-900 border border-zinc-700 rounded px-1 w-full focus:outline-none"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={() => onRename(layer.id, tempName)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRename(layer.id, tempName);
              if (e.key === 'Escape') onCancelEditing();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div 
            className="text-[11px] font-bold truncate"
            onDoubleClick={(e) => {
              e.stopPropagation();
              onStartEditing(layer.id, layer.name);
            }}
          >
            {layer.name}
          </div>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            toggleLock(layer); 
            announce(layer.locked ? t('editor.panels.unlocked', 'unlocked') : t('editor.panels.locked', 'locked'));
          }}
          className={cn("p-1 hover:text-white", layer.locked && "text-amber-500")}
          aria-label={layer.locked ? t('editor.panels.unlock', 'Unlock') : t('editor.panels.lock', 'Lock')}
        >
          {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
      </div>
      
      {showContextMenu && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setShowContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setShowContextMenu(null); }}
          />
          <div 
            className="fixed bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-[101] min-w-[180px] animate-in fade-in zoom-in duration-150"
            style={{ left: showContextMenu.x, top: showContextMenu.y }}
          >
            <button 
              onClick={() => { onOpenStyles?.(layer); setShowContextMenu(null); }}
              className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"
            >
              {t('editor.layers.styles', 'Layer Styles')}
            </button>
            <div className="h-px bg-zinc-800 my-1" />
            {layer.object?.isSmartObject ? (
              <>
                <button 
                  onClick={() => { onEditSmartObject?.(layer); setShowContextMenu(null); }}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2 text-blue-400"
                >
                  {t('editor.layers.edit_smart_object', 'Edit Content')}
                </button>
                <button 
                  onClick={() => { onResetSmartObject?.(layer); setShowContextMenu(null); }}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2 text-zinc-400"
                >
                  {t('editor.layers.reset_smart_object', 'Restore Original Size')}
                </button>
              </>
            ) : (
              <button 
                onClick={() => { onConvertToSmartObject?.(layer); setShowContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2"
              >
                {t('editor.layers.convert_smart_object', 'Convert to Smart Object')}
              </button>
            )}

            {layer.object?._pcProxy && (
              <>
                <div className="h-px bg-zinc-800 my-1" />
                <button 
                  onClick={() => { enterPowerClipEditMode?.(layer.object); setShowContextMenu(null); }}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2 text-blue-400"
                >
                  <Edit3 size={12} />
                  {t('editor.powerclip.edit_contents', 'Edit Content')}
                </button>
                <button 
                  onClick={() => { extractPowerClip?.(layer.object); setShowContextMenu(null); }}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 flex items-center gap-2 text-red-400"
                >
                  <Scissors size={12} />
                  {t('editor.powerclip.extract_contents', 'Extract Content')}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
});
