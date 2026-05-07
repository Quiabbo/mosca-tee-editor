import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();
  const [isOpen, setIsOpen] = React.useState(false);

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'pt-br', label: 'Português', flag: '🇧🇷' }
  ];

  const currentLangCode = lang?.toLowerCase() || (location.pathname.startsWith('/pt-br') ? 'pt-br' : 'en');
  const currentLang = languages.find(l => l.code === currentLangCode) || languages[0];

  const handleLanguageChange = (newLang: string) => {
    const currentPath = location.pathname;
    const detectedLang = lang || (currentPath.startsWith('/pt-br') ? 'pt-br' : 'en');
    
    let newPath = currentPath.replace(`/${detectedLang}`, `/${newLang}`);
    
    // Handle about/sobre mapping
    if (newLang === 'en' && currentPath.includes('/sobre')) {
      newPath = '/en/about';
    } else if (newLang === 'pt-br' && currentPath.includes('/about')) {
      newPath = '/pt-br/sobre';
    }
    
    navigate(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-xs font-medium text-zinc-300"
      >
        <Globe size={16} className="text-zinc-500" />
        <span>{currentLang.label}</span>
        <ChevronDown size={14} className={cn("text-zinc-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-zinc-800",
                    currentLangCode === l.code ? "text-blue-400 bg-blue-500/5" : "text-zinc-400"
                  )}
                >
                  <span className="text-lg leading-none">{l.flag}</span>
                  <span className="font-medium">{l.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
