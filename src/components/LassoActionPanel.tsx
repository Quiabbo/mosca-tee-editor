import { X, Crop, Square, Trash2 } from 'lucide-react';
import type { LassoPoint } from '../tools/PolygonalLassoTool';

interface LassoActionPanelProps {
  points: LassoPoint[];
  visible: boolean;
  lang: 'pt' | 'en';
  zoom: number;
  vpTransform: number[];
  onCrop:   () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function LassoActionPanel({
  points, visible, lang, zoom, vpTransform,
  onCrop, onDelete, onCancel,
}: LassoActionPanelProps) {
  if (!visible || points.length === 0) return null;

  const t = (pt: string, en: string) => lang === 'pt' ? pt : en;

  // Posicionar abaixo do bounding box
  const maxY = Math.max(...points.map(p => p.y));
  const midX = (Math.min(...points.map(p => p.x)) + Math.max(...points.map(p => p.x))) / 2;
  const screenX = midX * zoom + vpTransform[4];
  const screenY = maxY * zoom + vpTransform[5] + 24;

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(40,40,50,0.8)',
    color: 'white',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  };

  return (
    <div style={{
      position: 'absolute',
      left: screenX,
      top: screenY,
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      zIndex: 100,
      background: 'rgba(20,20,25,0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 12,
      padding: '8px 12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    }}>
      <button 
        style={btnStyle} 
        onClick={onCrop}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(60,60,75,0.9)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(40,40,50,0.8)'}
      >
        <Crop size={16} />
        {t('Recortar objeto', 'Crop object')}
      </button>
      <button 
        style={{ ...btnStyle, color: '#ff4444' }} 
        onClick={onDelete}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,68,68,0.1)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(40,40,50,0.8)'}
      >
        <Trash2 size={16} />
        {t('Excluir área', 'Delete area')}
      </button>
      
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
      
      <button 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'rgba(255,255,255,0.5)', 
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4
        }} 
        onClick={onCancel}
        onMouseOver={e => e.currentTarget.style.color = 'white'}
        onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
      >
        <X size={18} />
      </button>
    </div>
  );
}
