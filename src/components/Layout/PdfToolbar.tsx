import React from 'react';
import { 
  Type, Highlighter, Underline, Strikethrough, 
  MessageSquare, Stamp, ArrowRight, MousePointer2,
  Lock, Unlock, Download, FileText, Settings,
  Save, Trash2, Copy, RotateCw, Plus, Scissors,
  CheckCircle2, AlertCircle, Shield, ShieldCheck,
  Zap, Image as ImageIcon, Shapes, Library
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

interface PdfToolbarProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  onExport: () => void;
  onOcr: () => void;
  onCompress: () => void;
  onProtect: () => void;
}

export const PdfToolbar: React.FC<PdfToolbarProps> = ({
  activeTool,
  setActiveTool,
  onExport,
  onOcr,
  onCompress,
  onProtect
}) => {
  const { t } = useTranslation();

  const categories = [
    {
      id: 'annotate',
      label: t('editor.pdf.annotate', 'Anotar'),
      tools: [
        { id: 'highlight', icon: Highlighter, label: t('editor.pdf.highlight', 'Destaque') },
        { id: 'underline', icon: Underline, label: t('editor.pdf.underline', 'Sublinhado') },
        { id: 'strikethrough', icon: Strikethrough, label: t('editor.pdf.strikethrough', 'Tachado') },
        { id: 'comment', icon: MessageSquare, label: t('editor.pdf.comment', 'Comentário') },
        { id: 'stamp', icon: Stamp, label: t('editor.pdf.stamp', 'Carimbo') },
        { id: 'arrow', icon: ArrowRight, label: t('editor.pdf.arrow', 'Seta') },
      ]
    },
    {
      id: 'tools',
      label: t('editor.pdf.tools', 'Ferramentas'),
      tools: [
        { id: 'ocr', icon: Zap, label: 'OCR', action: onOcr },
        { id: 'form-text', icon: Type, label: 'Campo de Texto' },
        { id: 'form-check', icon: CheckCircle2, label: 'Checkbox' },
      ]
    },
    {
      id: 'security',
      label: t('editor.pdf.security', 'Segurança'),
      tools: [
        { id: 'password', icon: Lock, label: 'Senha', action: onProtect },
        { id: 'watermark', icon: Shield, label: 'Marca d\'água' },
      ]
    },
    {
      id: 'export',
      label: t('editor.pdf.export', 'Exportar'),
      tools: [
        { id: 'compress', icon: Scissors, label: 'Comprimir', action: onCompress },
        { id: 'save-pdf', icon: Download, label: 'Salvar PDF', action: onExport, primary: true },
      ]
    }
  ];

  return (
    <div className="flex items-center gap-1 px-4">
      {categories.map((cat) => (
        <div key={cat.id} className="flex items-center gap-1 border-r border-zinc-800 pr-1 last:border-0 last:pr-0">
          {cat.tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => tool.action ? tool.action() : setActiveTool(tool.id)}
              className={cn(
                "p-2 rounded-lg transition-all flex items-center justify-center",
                activeTool === tool.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : tool.primary 
                    ? "bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
              title={tool.label}
            >
              <tool.icon size={16} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};
