import React from 'react';
import { 
  DndContext, 
  closestCenter, 
  DragEndEvent,
  SensorDescriptor,
  SensorOptions
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Layers as LayersIcon } from 'lucide-react';
import { SortableLayerItem } from './SortableLayerItem';
import { Layer } from '../../types/tee';
import { useTranslation } from 'react-i18next';

interface LayerPanelProps {
  layers: Layer[];
  activeObject: any;
  selectedLayerIds: string[];
  toggleVisibility: (layer: Layer) => void;
  toggleLock: (layer: Layer) => void;
  onRename: (id: string, name: string) => void;
  isEditing: string | null;
  onStartEditing: (id: string, name: string) => void;
  onCancelEditing: () => void;
  selectLayer: (e: React.MouseEvent, layer: Layer) => void;
  onDragEnd: (event: DragEndEvent) => void;
  sensors: SensorDescriptor<SensorOptions>[];
  canvas: any;
  onOpenStyles?: (layer: any) => void;
  enterPowerClipEditMode?: (pc: any) => void;
  extractPowerClip?: (pc: any) => void;
  onToggleExpansion?: (id: string) => void;
}

export const LayerPanel = React.memo(({
  layers,
  activeObject,
  selectedLayerIds,
  toggleVisibility,
  toggleLock,
  onRename,
  isEditing,
  onStartEditing,
  onCancelEditing,
  selectLayer,
  onDragEnd,
  sensors,
  canvas,
  onOpenStyles,
  enterPowerClipEditMode,
  extractPowerClip,
  onToggleExpansion,
}: LayerPanelProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#191919]">
        <span className="text-[10px] font-bold text-zinc-500 tracking-widest flex items-center gap-2">
          <LayersIcon size={12} className="text-zinc-400" /> {t('editor.panels.layers', 'Camadas')} ({layers.length})
        </span>
      </div>
      <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext 
            items={layers.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {layers.map((layer) => (
                <SortableLayerItem 
                   key={layer.id} 
                   layer={layer}
                   activeObject={activeObject}
                   canvas={canvas}
                   toggleVisibility={toggleVisibility}
                   toggleLock={toggleLock}
                   onRename={onRename}
                   isEditing={isEditing === layer.id}
                   onStartEditing={onStartEditing}
                   onCancelEditing={onCancelEditing}
                   isSelected={selectedLayerIds.includes(layer.id)}
                   onClick={selectLayer}
                   onOpenStyles={onOpenStyles}
                   enterPowerClipEditMode={enterPowerClipEditMode}
                   extractPowerClip={extractPowerClip}
                   onToggleExpansion={onToggleExpansion}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
});
