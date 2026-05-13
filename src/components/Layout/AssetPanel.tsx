import React, { useState } from 'react';
import { 
  Upload, Search, RefreshCw, ChevronDown, Plus 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { useA11yStore } from '../../store/useA11yStore';
import { speech } from '../../services/speechService';
import { translateDescription } from '../../lib/translationUtils';

interface AssetPanelProps {
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
}

export const AssetPanel: React.FC<AssetPanelProps> = ({
  searchType,
  setSearchType,
  qrText,
  setQrText,
  generateQRCode,
  isProcessing,
  searchQuery,
  setSearchQuery,
  searchPexels,
  searchIconify,
  pexelsResults,
  iconifyResults,
  loadingAssetId,
  addImageToCanvas,
  hasMorePexels,
  hasMoreIconify,
  isLoadingMore,
  fileInputRef
}) => {
  const { t, i18n } = useTranslation();
  const { blindMode } = useA11yStore();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const announce = (msg: string) => {
    if (blindMode) speech.speak(msg);
  };

  const handleAssetClick = (url: string, id: string, description: string) => {
    if (selectedAssetId === id) {
      addImageToCanvas(url, id, description);
      setSelectedAssetId(null);
    } else {
      setSelectedAssetId(id);
      const translatedDesc = translateDescription(description, searchType, i18n.language);
      announce(t('a11y.speech.object.describe', { description: translatedDesc }));
    }
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar h-full">
      <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex-grow py-1.5 text-[9px] font-bold rounded-md transition-all bg-zinc-800 text-blue-500 hover:text-blue-400 flex items-center justify-center gap-1.5"
        >
          <Upload size={10} />
          {t('editor.tools.upload', 'Import')}
        </button>
        <div className="w-px h-4 bg-zinc-800 self-center mx-1" />
        <button 
          onClick={() => {
            setSearchType('pexels');
            setSelectedAssetId(null);
            announce(t('editor.panels.images'));
          }}
          className={cn("flex-grow py-1.5 text-[9px] font-bold rounded-md transition-all", searchType === 'pexels' ? "bg-blue-600 text-white" : "text-zinc-500")}
        >
          {t('editor.panels.images', 'Images')}
        </button>
        <button 
          onClick={() => {
            setSearchType('iconify');
            setSelectedAssetId(null);
            announce(t('editor.panels.icons'));
          }}
          className={cn("flex-grow py-1.5 text-[9px] font-bold rounded-md transition-all", searchType === 'iconify' ? "bg-blue-600 text-white" : "text-zinc-500")}
        >
          {t('editor.panels.icons', 'Icons')}
        </button>
        <button 
          onClick={() => {
            setSearchType('qrcode');
            setSelectedAssetId(null);
            announce(t('editor.tools.qrcode'));
          }}
          className={cn("flex-grow py-1.5 text-[9px] font-bold rounded-md transition-all", searchType === 'qrcode' ? "bg-blue-600 text-white" : "text-zinc-500")}
        >
          {t('editor.tools.qrcode', 'QR Code')}
        </button>
      </div>

      {searchType === 'qrcode' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500">{t('editor.panels.qr_text', 'Text or URL')}</label>
            <textarea 
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder="https://moscatee.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none h-24"
            />
          </div>
          <button 
            onClick={generateQRCode}
            disabled={isProcessing || !qrText}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {isProcessing ? t('editor.panels.generating', 'Generating...') : t('editor.panels.generate_qr', 'Generate QR Code')}
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (searchType === 'pexels' ? searchPexels() : searchIconify())}
              placeholder={searchType === 'pexels' ? t('editor.panels.search_images', 'Search images...') : t('editor.panels.search_icons', 'Search icons...')}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 outline-none"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>

          <div className={cn("grid gap-2", searchType === 'iconify' ? "grid-cols-3" : "grid-cols-2")}>
            {(searchType === 'pexels' ? pexelsResults : iconifyResults).length === 0 && isProcessing ? (
              <div className="col-span-full py-12 flex justify-center">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
              </div>
            ) : (searchType === 'pexels' ? pexelsResults : iconifyResults).length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-zinc-600 text-xs italic">{t('editor.panels.search_start', 'Search for something to start')}</p>
              </div>
            ) : (
              (searchType === 'pexels' ? pexelsResults : iconifyResults).map((item, idx) => {
                const itemId = searchType === 'pexels' ? String(item.id) : item;
                const isLoading = loadingAssetId === itemId;
                const isSelected = selectedAssetId === itemId;
                const url = searchType === 'pexels' ? item.src?.original : `https://api.iconify.design/${item}.svg`;
                const description = searchType === 'pexels' ? (item.alt || t('editor.panels.images')) : item;
                
                return (
                  <button 
                    key={idx}
                    onClick={() => handleAssetClick(url, itemId, description)}
                    disabled={isLoading}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border transition-all relative group",
                      isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-zinc-800 hover:border-zinc-700",
                      searchType === 'iconify' ? "bg-gray-200 p-2" : "bg-zinc-900 p-1"
                    )}
                  >
                    {isLoading && (
                      <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={16} className="animate-spin text-blue-500" />
                        <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 animate-[shimmer_1.5s_infinite] w-full" />
                        </div>
                      </div>
                    )}
                    
                    {isSelected && !isLoading && (
                      <div className="absolute inset-0 z-10 bg-blue-600/40 flex items-center justify-center">
                        <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                          <Plus size={16} strokeWidth={3} />
                        </div>
                      </div>
                    )}

                    {searchType === 'pexels' ? (
                      item.src?.tiny ? (
                        <img src={item.src.tiny} alt="" className="w-full h-full object-cover rounded-md" referrerPolicy="no-referrer" />
                      ) : null
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item && <img src={`https://api.iconify.design/${item}.svg`} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />}
                      </div>
                    )}
                  </button>
                );
              })
            )}
            {(searchType === 'pexels' ? hasMorePexels : hasMoreIconify) && (searchType === 'pexels' ? pexelsResults : iconifyResults).length > 0 && (
              <button 
                onClick={() => searchType === 'pexels' ? searchPexels(undefined, true) : searchIconify(undefined, true)}
                disabled={isProcessing}
                className="col-span-full py-4 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoadingMore ? <RefreshCw size={12} className="animate-spin" /> : <ChevronDown size={12} />}
                {isLoadingMore ? t('editor.panels.loading', 'Loading...') : t('editor.panels.load_more', 'Load more...')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
