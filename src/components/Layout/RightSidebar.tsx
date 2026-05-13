import React from 'react';
import { fabric } from 'fabric';
import { 
  Type, Sliders, Palette, Maximize2, Image as ImageIcon, 
  ChevronRight, ChevronLeft, Layers, Zap 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TextPanel } from './TextPanel';
import { ImageAdjustPanel } from './ImageAdjustPanel';
import { ColorPanel } from './ColorPanel';
import { TransformPanel } from './TransformPanel';
import { AssetPanel } from './AssetPanel';
import { LayerPanel } from './LayerPanel';
import { MacroPanel } from './MacroPanel';
import { AdjustmentPanel } from '../Editor/AdjustmentPanel';
import { Macro, Layer, HistoryItem } from '../../types/tee';
import { useTranslation } from 'react-i18next';
import { HistoryPanel } from '../Editor/HistoryPanel';
import { History as HistoryIcon } from 'lucide-react';

interface RightSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeObject: any;
  updateActiveObject: (key: string, value: any, skipHistory?: boolean) => void;
  fonts: string[];
  toggleTextProperty: (property: string) => void;
  toggleTextTransform: () => void;
  updateTextShadow: (color: string, blur: number, offsetX: number, offsetY: number) => void;
  fontInputRef: React.RefObject<HTMLInputElement | null>;
  imageAdjustments: Record<string, any>;
  applyImageAdjustment: (id: string, value: number) => void;
  resetImageAdjustments: () => void;
  canvas: fabric.Canvas | null;
  saveToHistory: (canvas: fabric.Canvas, name?: string) => void;
  history: HistoryItem[];
  historyIndex: number;
  goToHistoryIndex: (index: number) => void;
  clearHistory: () => void;
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
  unit: string;
  setUnit: (unit: any) => void;
  UNITS: any[];
  formatValue: (val: number) => string;
  IMAGE_FILTERS: any[];
  applyImageFilter: (id: string) => void;
  handleRemoveBackground: () => void;
  isRemovingBg: boolean;
  bgRemovalProgress: number;
  handleVectorize: () => void;
  refinement: number;
  setRefinement: (val: number) => void;
  handleCompress: () => void;
  offset: { x: number, y: number };
  setOffset: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  artboardSize: { width: number, height: number };
  setArtboardSize: React.Dispatch<React.SetStateAction<{ width: number, height: number }>>;
  canvasPreset: string;
  setCanvasPreset: (preset: string) => void;
  CANVAS_PRESETS: any[];
  updateLayers: (canvas: fabric.Canvas) => void;
  getBackgroundOpacity: () => number;
  updateBackgroundOpacity: (val: number) => void;
  handleSelectSubject: () => void;
  searchType: string;
  setSearchType: (type: string) => void;
  qrText: string;
  setQrText: (text: string) => void;
  generateQRCode: () => void;
  isProcessing: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchPexels: (query?: string, loadMore?: boolean) => void;
  searchIconify: (query?: string, loadMore?: boolean) => void;
  pexelsResults: any[];
  iconifyResults: any[];
  loadingAssetId: string | null;
  addImageToCanvas: (url: string, id: string, name?: string) => void;
  hasMorePexels: boolean;
  hasMoreIconify: boolean;
  isLoadingMore: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (open: boolean) => void;
  layers: Layer[];
  sensors: any;
  handleDragEnd: (event: any) => void;
  toggleVisibility: (layer: Layer) => void;
  toggleLock: (layer: Layer) => void;
  renameLayer: (id: string, name: string) => void;
  editingLayerId: string | null;
  setEditingLayerId: (id: string | null) => void;
  selectedLayerIds: string[];
  handleLayerClick: (e: React.MouseEvent, layer: Layer) => void;
  moveLayer: (direction: 'up' | 'down') => void;
  addWhiteBackground: () => void;
  deleteActive: () => void;
  onCancelEditing: () => void;
  onStartEditing: (id: string, name: string) => void;
  onOpenStyles?: (layer: any) => void;
  onAddAdjustment?: (type: string) => void;
  enterPowerClipEditMode?: (pc: any) => void;
  extractPowerClip?: (pc: any) => void;
  onToggleExpansion?: (id: string) => void;
  macros: Macro[];
  isRecordingMacro: boolean;
  currentMacro: Macro | null;
  startRecordingMacro: (name: string) => void;
  stopRecordingMacro: () => void;
  playMacro: (macro: Macro) => void;
  deleteMacro: (id: string) => void;
  topOptions: any;
  setTopOptions: React.Dispatch<React.SetStateAction<any>>;
}

export const RightSidebar = React.memo(({
  activeTab,
  setActiveTab,
  activeObject,
  updateActiveObject,
  fonts,
  toggleTextProperty,
  toggleTextTransform,
  updateTextShadow,
  fontInputRef,
  imageAdjustments,
  applyImageAdjustment,
  resetImageAdjustments,
  canvas,
  saveToHistory,
  history,
  historyIndex,
  goToHistoryIndex,
  clearHistory,
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
  updateGradientAngle,
  unit,
  setUnit,
  UNITS,
  formatValue,
  IMAGE_FILTERS,
  applyImageFilter,
  handleRemoveBackground,
  isRemovingBg,
  bgRemovalProgress,
  handleVectorize,
  refinement,
  setRefinement,
  handleCompress,
  offset,
  setOffset,
  artboardSize,
  setArtboardSize,
  canvasPreset,
  setCanvasPreset,
  CANVAS_PRESETS,
  updateLayers,
  getBackgroundOpacity,
  updateBackgroundOpacity,
  handleSelectSubject,
  searchType,
  setSearchType,
  qrText,
  setQrText,
  generateQRCode,
  isProcessing,
  searchQuery,
  setSearchQuery,
  searchPexels,
  searchQuery: searchQueryProp, // Renamed to avoid conflict
  searchIconify,
  pexelsResults,
  iconifyResults,
  loadingAssetId,
  addImageToCanvas,
  hasMorePexels,
  hasMoreIconify,
  isLoadingMore,
  fileInputRef,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  layers,
  sensors,
  handleDragEnd,
  toggleVisibility,
  toggleLock,
  renameLayer,
  editingLayerId,
  setEditingLayerId,
  selectedLayerIds,
  handleLayerClick,
  moveLayer,
  addWhiteBackground,
  deleteActive,
  onCancelEditing,
  onStartEditing,
  onOpenStyles,
  onAddAdjustment,
  enterPowerClipEditMode,
  extractPowerClip,
  onToggleExpansion,
  macros,
  isRecordingMacro,
  currentMacro,
  startRecordingMacro,
  stopRecordingMacro,
  playMacro,
  deleteMacro,
  topOptions,
  setTopOptions
}: RightSidebarProps) => {
  const { t } = useTranslation();

  const TABS = [
    { id: 'layers', icon: Layers, label: t('editor.tabs.layers', 'Camadas'), show: true },
    { id: 'text', icon: Type, label: t('editor.tabs.text', 'Texto'), show: activeObject?.type === 'i-text' || activeObject?.isTextOnPath },
    { id: 'macros', icon: Zap, label: t('editor.tabs.macros', 'Ações'), show: true },
    { id: 'color', icon: Palette, label: t('editor.tabs.color', 'Cor'), show: true },
    { id: 'transform', icon: Maximize2, label: t('editor.tabs.transform', 'Transformar'), show: true },
    { id: 'adjust', icon: Sliders, label: t('editor.tabs.adjust', 'Ajustes'), show: true },
    { id: 'history', icon: HistoryIcon, label: t('editor.tabs.history', 'Histórico'), show: true },
    { id: 'assets', icon: ImageIcon, label: t('editor.tabs.library', 'Biblioteca'), show: true },
  ];

  return (
    <div className={cn(
      "fixed right-0 top-12 bottom-0 bg-zinc-950 border-l border-zinc-800 flex transition-all duration-300 z-40 shadow-2xl",
      isRightSidebarOpen ? "w-80" : "w-12"
    )}>
      <button 
        onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors z-50 shadow-lg"
      >
        {isRightSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="w-12 border-r border-zinc-900 flex flex-col items-center py-4 gap-4 bg-zinc-950/50 backdrop-blur-sm">
        {TABS.filter(t => t.show).map(tab => (
          <button 
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (!isRightSidebarOpen) setIsRightSidebarOpen(true);
            }}
            className={cn(
              "p-2 rounded-lg transition-all group relative border",
              activeTab === tab.id ? "bg-[#0f0f0f] text-white border-zinc-800" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border-transparent"
            )}
            title={tab.label}
          >
            <tab.icon size={18} />
            {!isRightSidebarOpen && (
              <div className="absolute right-full mr-2 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-zinc-800">
                {tab.label}
              </div>
            )}
          </button>
        ))}
      </div>

      {isRightSidebarOpen && (
        <div className="flex-grow flex flex-col min-w-0 bg-zinc-950">
          <div className="h-12 border-b border-zinc-900 flex items-center px-4 justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
            <span className="text-[11px] font-bold text-zinc-400 tracking-widest">
              {TABS.find(t => t.id === activeTab)?.label}
            </span>
          </div>
          
          <div className="flex-grow overflow-hidden">
            {activeTab === 'layers' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-grow overflow-hidden">
                  <LayerPanel 
                    layers={layers}
                    sensors={sensors}
                    onDragEnd={handleDragEnd}
                    activeObject={activeObject}
                    selectedLayerIds={selectedLayerIds}
                    canvas={canvas}
                    toggleVisibility={toggleVisibility}
                    toggleLock={toggleLock}
                    onRename={renameLayer}
                    isEditing={editingLayerId}
                    onStartEditing={onStartEditing}
                    onCancelEditing={onCancelEditing}
                    selectLayer={handleLayerClick}
                    onOpenStyles={onOpenStyles}
                    enterPowerClipEditMode={enterPowerClipEditMode}
                    extractPowerClip={extractPowerClip}
                    onToggleExpansion={onToggleExpansion}
                  />
                </div>
              </div>
            )}
            {activeTab === 'history' && (
              <HistoryPanel 
                history={history}
                currentIndex={historyIndex}
                goToHistoryIndex={goToHistoryIndex}
                clearHistory={clearHistory}
              />
            )}
            {activeTab === 'text' && (
              <TextPanel 
                activeObject={activeObject}
                updateActiveObject={updateActiveObject}
                fonts={fonts}
                toggleTextProperty={toggleTextProperty}
                toggleTextTransform={toggleTextTransform}
                updateTextShadow={updateTextShadow}
                fontInputRef={fontInputRef}
                canvas={canvas}
                topOptions={topOptions}
                setTopOptions={setTopOptions}
                saveToHistory={saveToHistory}
              />
            )}
            {activeTab === 'image-adjust' && (
              <ImageAdjustPanel 
                activeObject={activeObject}
                imageAdjustments={imageAdjustments}
                applyImageAdjustment={applyImageAdjustment}
                resetImageAdjustments={resetImageAdjustments}
              />
            )}
            {activeTab === 'color' && (
              <ColorPanel 
                activeObject={activeObject}
                canvas={canvas}
                updateActiveObject={updateActiveObject}
                saveToHistory={saveToHistory}
                harmonyRule={harmonyRule}
                generateHarmony={generateHarmony}
                harmonies={harmonies}
                extractColorsFromImage={extractColorsFromImage}
                GLASS_PRESETS={GLASS_PRESETS}
                applyGlassEffect={applyGlassEffect}
                GRADIENTS={GRADIENTS}
                applyGradient={applyGradient}
                updateGradientColor={updateGradientColor}
                addGradientColor={addGradientColor}
                removeGradientColor={removeGradientColor}
                updateGradientType={updateGradientType}
                updateGradientAngle={updateGradientAngle}
              />
            )}
            {activeTab === 'transform' && (
              <TransformPanel 
                activeObject={activeObject}
                unit={unit}
                setUnit={setUnit}
                UNITS={UNITS}
                formatValue={formatValue}
                updateActiveObject={updateActiveObject}
                IMAGE_FILTERS={IMAGE_FILTERS}
                applyImageFilter={applyImageFilter}
                handleRemoveBackground={handleRemoveBackground}
                isRemovingBg={isRemovingBg}
                bgRemovalProgress={bgRemovalProgress}
                handleVectorize={handleVectorize}
                refinement={refinement}
                setRefinement={setRefinement}
                handleCompress={handleCompress}
                offset={offset}
                setOffset={setOffset}
                artboardSize={artboardSize}
                setArtboardSize={setArtboardSize}
                canvas={canvas}
                canvasPreset={canvasPreset}
                setCanvasPreset={setCanvasPreset}
                CANVAS_PRESETS={CANVAS_PRESETS}
                updateLayers={updateLayers}
                saveToHistory={saveToHistory}
                getBackgroundOpacity={getBackgroundOpacity}
                updateBackgroundOpacity={updateBackgroundOpacity}
                handleSelectSubject={handleSelectSubject}
              />
            )}
            {activeTab === 'assets' && (
              <AssetPanel 
                searchType={searchType}
                setSearchType={setSearchType}
                qrText={qrText}
                setQrText={setQrText}
                generateQRCode={generateQRCode}
                isProcessing={isProcessing}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchPexels={searchPexels}
                searchIconify={searchIconify}
                pexelsResults={pexelsResults}
                iconifyResults={iconifyResults}
                loadingAssetId={loadingAssetId}
                addImageToCanvas={addImageToCanvas}
                hasMorePexels={hasMorePexels}
                hasMoreIconify={hasMoreIconify}
                isLoadingMore={isLoadingMore}
                fileInputRef={fileInputRef}
              />
            )}

            {activeTab === 'adjust' && onAddAdjustment && (
              <AdjustmentPanel onAddAdjustment={onAddAdjustment} />
            )}
            {activeTab === 'macros' && (
              <MacroPanel 
                macros={macros}
                isRecording={isRecordingMacro}
                currentMacro={currentMacro}
                startRecording={startRecordingMacro}
                stopRecording={stopRecordingMacro}
                playMacro={playMacro}
                deleteMacro={deleteMacro}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
});
