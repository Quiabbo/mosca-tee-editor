import React from 'react';

declare const anime: any;

import { motion, AnimatePresence } from 'motion/react';
import { 
  MousePointer2, Brush, Eraser, Type, Square, Circle, Pipette, 
  Paintbrush, Library, Wand2, Zap, Layers, Sliders, Palette, 
  Maximize2, Image as ImageIcon, ChevronDown, Mail, ArrowRight,
  Shield, Zap as ZapIcon, Heart, Lock, Globe, Sparkles,
  Accessibility, Contrast, Eye, FileCode, Clock,
  Newspaper, ArrowUpRight, ChevronLeft, ChevronRight, Grid3X3,
  ArrowUp
} from 'lucide-react';
import { blogPosts } from '../data/blogPosts';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { LanguageSelector } from '../components/Layout/LanguageSelector';
import { Logo } from '../components/Logo';

const ToolCard = ({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) => (
  <motion.div 
    className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[12px] flex flex-col gap-4 transition-all hover:border-zinc-700 group h-full"
  >
    <div className={cn("w-12 h-12 rounded-[12px] flex items-center justify-center transition-transform group-hover:scale-110", color)}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const ToolsCarousel = ({ tools, title, subtitle }: { tools: any[], title?: string, subtitle?: string }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth } = scrollRef.current;
        const halfWidth = scrollWidth / 2;
        
        if (scrollLeft >= halfWidth) {
          scrollRef.current.scrollLeft = 0;
        } else {
          scrollRef.current.scrollLeft += 0.5;
        }
      }
    }, 20);

    return () => clearInterval(interval);
  }, [isPaused]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const itemWidth = 300;
      const gap = 24;
      const step = itemWidth + gap;
      
      const { scrollLeft, scrollWidth } = scrollRef.current;
      const halfWidth = scrollWidth / 2;
      
      let targetScroll;
      if (direction === 'left') {
        if (scrollLeft <= 5) {
          const newPos = halfWidth + scrollLeft;
          scrollRef.current.scrollLeft = newPos;
          targetScroll = newPos - step;
        } else {
          targetScroll = Math.max(0, Math.floor((scrollLeft - 10) / step) * step);
        }
      } else {
        if (scrollLeft >= halfWidth - step - 5) {
          const newPos = scrollLeft - halfWidth;
          scrollRef.current.scrollLeft = newPos;
          targetScroll = newPos + step;
        } else {
          targetScroll = Math.floor((scrollLeft + step + 10) / step) * step;
        }
      }

      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      
      setIsPaused(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsPaused(false), 3000);
    }
  };

  return (
    <div className="relative group/carousel">
      {/* Header with Arrows aligned with subtitle */}
      {(title || subtitle) && (
        <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-left">
            {title && <h2 className="text-4xl font-black tracking-tighter mb-4">{title}</h2>}
            {subtitle && <p className="text-zinc-400 max-w-2xl">{subtitle}</p>}
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <button 
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div 
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          if (!timeoutRef.current) setIsPaused(false);
        }}
        className="flex gap-6 overflow-x-auto no-scrollbar pb-8 cursor-grab active:cursor-grabbing"
      >
        {/* Double the tools for infinite effect */}
        {[...tools, ...tools].map((tool, index) => (
          <div key={index} className="w-[300px] shrink-0">
            <ToolCard {...tool} />
          </div>
        ))}
      </div>
    </div>
  );
};

const FAQItem = ({ question, answer, initialOpen = false }: { question: string, answer: string, initialOpen?: boolean }) => {
  const [isOpen, setIsOpen] = React.useState(initialOpen);
  
  return (
    <div className="border-b border-zinc-800 py-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <h3 className="text-lg font-bold text-white group-hover:text-zinc-300 transition-colors">{question}</h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-zinc-500"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <motion.div
        initial={initialOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        animate={{ 
          height: isOpen ? 'auto' : 0, 
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? 12 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{answer}</p>
      </motion.div>
    </div>
  );
};

export const SobrePage: React.FC = () => {
  const { t } = useTranslation();

  const { lang: langParam } = useParams();
  const location = useLocation();
  const lang = langParam || (location.pathname.startsWith('/pt-br') ? 'pt-br' : 'en');

  const [blogIndex, setBlogIndex] = React.useState(0);
  const postsPerPage = 4;
  const filteredPosts = blogPosts.filter(p => p.lang === lang);
  const maxIndex = Math.max(0, filteredPosts.length - postsPerPage);

  const nextBlog = () => {
    setBlogIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevBlog = () => {
    setBlogIndex(prev => Math.max(prev - 1, 0));
  };

  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowScrollTop(scrollTop > 500);
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const leftTools = [
    { icon: MousePointer2, title: t('editor.tools.select'), description: t('sobre.creation_tools.select_desc'), color: 'bg-blue-600' },
    { icon: Brush, title: t('editor.tools.brush'), description: t('sobre.creation_tools.brush_desc'), color: 'bg-purple-600' },
    { icon: Eraser, title: t('editor.tools.eraser'), description: t('sobre.creation_tools.eraser_desc'), color: 'bg-pink-600' },
    { icon: Type, title: t('editor.tools.text'), description: t('sobre.creation_tools.text_desc'), color: 'bg-amber-600' },
    { icon: Square, title: t('editor.tools.shapes'), description: t('sobre.creation_tools.shapes_desc'), color: 'bg-emerald-600' },
    { icon: Pipette, title: t('editor.tools.pipette'), description: t('sobre.creation_tools.pipette_desc'), color: 'bg-cyan-600' },
    { icon: Paintbrush, title: t('editor.tools.paintbrush'), description: t('sobre.creation_tools.paintbrush_desc'), color: 'bg-rose-600' },
    { icon: Library, title: t('editor.panels.library'), description: t('sobre.creation_tools.library_desc'), color: 'bg-orange-600' },
    { icon: Wand2, title: t('editor.tools.wand'), description: t('sobre.creation_tools.wand_desc'), color: 'bg-indigo-600' },
    { icon: Zap, title: t('editor.tools.zap'), description: t('sobre.creation_tools.zap_desc'), color: 'bg-teal-600' },
  ];

  const rightTools = [
    { icon: Layers, title: t('editor.panels.layers'), description: t('sobre.control_panels.layers_desc'), color: 'bg-blue-600' },
    { icon: Sliders, title: t('editor.tools.settings'), description: t('sobre.control_panels.settings_desc'), color: 'bg-blue-600' },
    { icon: Palette, title: t('editor.tools.palette'), description: t('sobre.control_panels.palette_desc'), color: 'bg-blue-600' },
    { icon: Sparkles, title: t('editor.tools.filters', 'Filtros'), description: t('sobre.control_panels.filters_desc', 'Aplique efeitos e filtros profissionais às suas imagens.'), color: 'bg-blue-600' },
    { icon: Maximize2, title: t('editor.tools.maximize'), description: t('sobre.control_panels.maximize_desc'), color: 'bg-blue-600' },
    { icon: ImageIcon, title: t('editor.panels.library'), description: t('sobre.control_panels.library_desc'), color: 'bg-blue-600' },
  ];

  const [accIndex, setAccIndex] = React.useState(0);
  const [accProgress, setAccProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const accessibilityTools = [
    { 
      icon: Wand2, 
      title: t('sobre.accessibility.smart_reading'), 
      description: t('sobre.accessibility.smart_reading_desc'), 
      tags: t('sobre.accessibility.smart_reading_tags', { returnObjects: true }) as string[],
      image: "https://moscatee.com/img/mulher.webp"
    },
    { 
      icon: Library, 
      title: t('sobre.accessibility.accessible_library'), 
      description: t('sobre.accessibility.accessible_library_desc'), 
      tags: t('sobre.accessibility.accessible_library_tags', { returnObjects: true }) as string[],
      image: "https://moscatee.com/img/001.webp"
    },
    { 
      icon: Contrast, 
      title: t('sobre.accessibility.wcag_contrast'), 
      description: t('sobre.accessibility.wcag_contrast_desc'), 
      tags: t('sobre.accessibility.wcag_contrast_tags', { returnObjects: true }) as string[],
      image: "https://moscatee.com/img/crianca.webp"
    },
    { 
      icon: Eye, 
      title: t('sobre.accessibility.color_blindness'), 
      description: t('sobre.accessibility.color_blindness_desc'), 
      tags: t('sobre.accessibility.color_blindness_tags', { returnObjects: true }) as string[],
      image: "https://moscatee.com/img/002.webp"
    },
    { 
      icon: Grid3X3, 
      title: t('sobre.accessibility.grid_accessibility'), 
      description: t('sobre.accessibility.grid_accessibility_desc'), 
      tags: t('sobre.accessibility.grid_accessibility_tags', { returnObjects: true }) as string[],
      image: "https://moscatee.com/img/psd.webp"
    },
  ];

  React.useEffect(() => {
    if (isPaused) return;

    const duration = 10000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setAccProgress(prev => {
        if (prev >= 100) {
          setAccIndex(current => (current + 1) % accessibilityTools.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [accIndex, accessibilityTools.length, isPaused]);

  const heroScreenshots = [
    "https://moscatee.com/img/screen001.webp",
    "https://moscatee.com/img/screen002.webp",
    "https://moscatee.com/img/screen003.webp",
    "https://moscatee.com/img/screen004.webp"
  ];

  const [currentScreen, setCurrentScreen] = React.useState(0);
  const [direction, setDirection] = React.useState(1);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentScreen((prev) => (prev + 1) % heroScreenshots.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [heroScreenshots.length]);

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen bg-black text-white font-sans selection:bg-blue-500/30 overflow-y-auto scroll-smooth"
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to={`/${lang}`} className="flex flex-col gap-0 group">
            <Logo className="h-6 w-auto" />
            <span className="text-[13px] text-zinc-500 lowercase">{t('editor.header.subtitle')}</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#ferramentas" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">{t('sobre.header.tools')}</a>
            <a href="#blog" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">{t('sobre.header.blog')}</a>
            <a href="#faq" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">{t('sobre.header.faq')}</a>
            <LanguageSelector />
            <Link to={`/${lang}`} className="bg-white text-black px-6 py-2.5 rounded-[12px] text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95">
              {t('sobre.header.open_editor')}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
              {t('sobre.hero.line1')} <span className="text-zinc-500">{t('sobre.hero.line2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 font-medium mb-12 max-w-2xl mx-auto">
              {t('sobre.hero.tagline')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <div className="relative rounded-[12px] overflow-hidden border border-zinc-800 shadow-[0_0_100px_rgba(255,255,255,0.05)] bg-zinc-900 group aspect-[16/10] sm:aspect-video mb-8">
              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={currentScreen}
                  src={heroScreenshots[currentScreen]}
                  alt={`Mosca Tee Interface ${currentScreen + 1}`}
                  custom={direction}
                  initial={{ x: direction > 0 ? '100%' : '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: direction > 0 ? '-100%' : '100%' }}
                  transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute inset-0 w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Navigation Arrows on Hover */}
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setDirection(-1);
                    setCurrentScreen((prev) => (prev - 1 + heroScreenshots.length) % heroScreenshots.length);
                  }}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setDirection(1);
                    setCurrentScreen((prev) => (prev + 1) % heroScreenshots.length);
                  }}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Pagination Dots - Outside and No Glow */}
            <div className="flex items-center justify-center gap-3">
              {heroScreenshots.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentScreen ? 1 : -1);
                    setCurrentScreen(idx);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    currentScreen === idx 
                      ? "bg-white w-10" 
                      : "bg-zinc-700 hover:bg-zinc-500"
                  )}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Left Sidebar Tools */}
      <section id="ferramentas" className="py-20 bg-zinc-950/50 overflow-hidden">
        <div className="w-full">
          <ToolsCarousel 
            tools={leftTools} 
            title={t('sobre.creation_tools.title')}
            subtitle={t('sobre.creation_tools.subtitle')}
          />
        </div>
      </section>

      {/* Accessibility Section (New Layout) */}
      <section className="py-20 px-6 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-left">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">{t('sobre.accessibility.title')}</h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-3xl leading-relaxed">
              {t('sobre.accessibility.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-stretch bg-zinc-900/20 rounded-[32px] p-4 lg:p-8 border border-zinc-900/50">
            {/* Image Side */}
            <div className="order-2 lg:order-1 relative aspect-square lg:aspect-auto rounded-2xl overflow-hidden shadow-2xl">
              <motion.div
                key={accIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <img 
                  src={accessibilityTools[accIndex].image} 
                  alt={accessibilityTools[accIndex].title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </motion.div>
            </div>

            {/* Content Side */}
            <div className="order-1 lg:order-2 flex flex-col justify-center space-y-2">
              {accessibilityTools.map((item, idx) => {
                const isActive = accIndex === idx;
                return (
                  <div key={idx} className="group">
                    <button 
                      onClick={() => {
                        setAccIndex(idx);
                        setAccProgress(0);
                        setIsPaused(true);
                      }}
                      className={cn(
                        "w-full text-left py-4 px-6 rounded-xl transition-all duration-300 flex flex-col",
                        isActive ? "bg-white/5" : "hover:bg-white/5"
                      )}
                    >
                      <h3 className={cn(
                        "text-xl font-bold transition-all",
                        isActive ? "text-white" : "text-zinc-500"
                      )}>
                        {item.title}
                      </h3>
                      
                      <AnimatePresence mode="wait">
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="text-zinc-400 text-sm mt-4 leading-relaxed max-w-md">
                              {item.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mt-6">
                              {item.tags?.map((tag, tIdx) => (
                                <span key={tIdx} className="px-3 py-1 bg-zinc-800 text-[10px] font-bold text-zinc-400 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>


                            {/* Progress bar */}
                            <div className="mt-8 h-[2px] w-full bg-zinc-800 relative overflow-hidden rounded-full">
                              <motion.div 
                                className="absolute top-0 left-0 h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${accProgress}%` }}
                                transition={{ ease: "linear", duration: 0.05 }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                    {idx < accessibilityTools.length - 1 && (
                      <div className="h-px w-full bg-zinc-900 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social Commitment Info Block */}
          <div className="mt-20 max-w-4xl mx-auto p-1px bg-gradient-to-r from-blue-500/20 via-zinc-800/50 to-blue-500/20 rounded-2xl">
            <div className="bg-zinc-950 p-8 md:p-12 rounded-2xl border border-zinc-800/50">
              <p className="text-zinc-400 text-sm md:text-lg leading-relaxed text-center font-medium italic">
                {t('sobre.accessibility.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PSD Section */}
      <section className="bg-black overflow-hidden border-t border-zinc-900">
        {/* Marquee Banner */}
        <div className="bg-blue-600 py-4 overflow-hidden flex whitespace-nowrap border-y border-blue-500/30">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-4 px-4"
          >
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-black font-black text-2xl md:text-3xl tracking-tighter uppercase flex items-center gap-4">
                {lang === 'en' ? 'TRUE CREATIVE FREEDOM' : 'LIBERDADE CRIATIVA DE VERDADE'} <span className="text-black/40">•</span>
              </span>
            ))}
          </motion.div>
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-4 px-4"
          >
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-black font-black text-2xl md:text-3xl tracking-tighter uppercase flex items-center gap-4">
                {lang === 'en' ? 'TRUE CREATIVE FREEDOM' : 'LIBERDADE CRIATIVA DE VERDADE'} <span className="text-black/40">•</span>
              </span>
            ))}
          </motion.div>
        </div>

        <div className="py-20 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, rotate: i * 15 - 30, x: i * 20 - 40 }}
                    whileInView={{ opacity: 1, rotate: i * 10 - 20, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
                    style={{ 
                      zIndex: 10 - i,
                      transform: `translate(${i * 20}px, ${i * -20}px) rotate(${i * 5}deg)`
                    }}
                  >
                    <img 
                      src={i === 1 ? "https://moscatee.com/img/mockup.png" : `https://picsum.photos/seed/psd-${i}/600/600`} 
                      alt="PSD Layer Preview" 
                      className="w-full h-full object-cover opacity-60"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-[0.9] whitespace-pre-line">
                {t('sobre.psd.title').split('PSD').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && <span className="text-blue-500">PSD</span>}
                  </React.Fragment>
                ))}
              </h2>
              <p className="text-xl text-zinc-400 mb-10 leading-relaxed max-w-xl">
                {t('sobre.psd.subtitle')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                {[
                  { label: t('sobre.psd.feature_layers'), icon: Layers },
                  { label: t('sobre.psd.feature_text'), icon: Type },
                  { label: t('sobre.psd.feature_login'), icon: Shield },
                  { label: t('sobre.psd.feature_export'), icon: FileCode },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm font-bold text-zinc-300">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-blue-500">
                      <item.icon size={16} />
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>

              <Link to={`/${lang}`} className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                {t('sobre.psd.cta')}
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">{t('sobre.psd.open_title')}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {t('sobre.psd.open_desc')}
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">{t('sobre.psd.layers_title')}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {t('sobre.psd.layers_desc')}
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">{t('sobre.psd.save_title')}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {t('sobre.psd.save_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="text-left">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter">{t('sobre.header.blog')}</h2>
              </div>
              <p className="text-zinc-400 max-w-xl">
                {t('sobre.blog.subtitle')}
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <Link 
                to={`/${lang}/blog`} 
                className="text-blue-500 font-bold hover:text-blue-400 transition-colors flex items-center gap-2 text-sm"
              >
                {t('sobre.blog.view_all')} <ArrowUpRight size={18} />
              </Link>
              <div className="flex items-center gap-2">
                <button 
                  onClick={prevBlog}
                  disabled={blogIndex === 0}
                  className={cn(
                    "w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center transition-colors",
                    blogIndex === 0 ? "text-zinc-700 cursor-not-allowed" : "text-zinc-400 hover:bg-zinc-900"
                  )}
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={nextBlog}
                  disabled={blogIndex === maxIndex}
                  className={cn(
                    "w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center transition-colors",
                    blogIndex === maxIndex ? "text-zinc-700 cursor-not-allowed" : "text-zinc-400 hover:bg-zinc-900"
                  )}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredPosts.slice(blogIndex, blogIndex + postsPerPage).map((post) => (
              <Link 
                key={post.id}
                to={`/${lang}/blog/${post.slug}`}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900"
              >
                {/* Background Image */}
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="mb-2">
                    <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                      {post.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold tracking-tight text-white leading-tight transition-colors">
                    {post.title}
                  </h3>

                  {/* Hover Content - Simplified as per new design */}
                  <div className="max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-500 ease-in-out">
                    <div className="flex items-center gap-2 text-white font-bold text-xs mt-4">
                      {t('sobre.blog.read_more')}
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-zinc-950/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black tracking-tighter mb-12 text-center">{t('common.faq')}</h2>
          <div className="space-y-4">
            <FAQItem 
              question={t('sobre.faq_items.q1')}
              answer={t('sobre.faq_items.a1')}
              initialOpen={true}
            />
            <FAQItem 
              question={t('sobre.faq_items.q2')}
              answer={t('sobre.faq_items.a2')}
            />
            <FAQItem 
              question={t('sobre.faq_items.q3')}
              answer={t('sobre.faq_items.a3')}
            />
            <FAQItem 
              question={t('sobre.faq_items.q4')}
              answer={t('sobre.faq_items.a4')}
            />
            <FAQItem 
              question={t('sobre.faq_items.q5')}
              answer={t('sobre.faq_items.a5')}
            />
            <FAQItem 
              question={t('sobre.faq_items.q6')}
              answer={t('sobre.faq_items.a6')}
            />
            <FAQItem 
              question={t('sobre.faq_items.q7')}
              answer={t('sobre.faq_items.a7')}
            />
          </div>
        </div>
      </section>

      {/* Pre-footer CTA */}
      <section className="relative py-48 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://moscatee.com/img/work" 
            alt="Work Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://picsum.photos/seed/work/1920/1080";
            }}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl tracking-tighter mb-12 leading-tight">
            <span className="font-normal block">{t('sobre.cta.line1')}</span>
            <span className="font-black block">{t('sobre.cta.line2')}</span>
          </h2>
          <Link to={`/${lang}`} className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-[12px] text-xl font-black hover:bg-zinc-200 transition-all active:scale-95 group">
            {t('common.use_mosca')}
            <ArrowRight className="transition-transform group-hover:translate-x-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-md">
            <div className="flex flex-col items-start mb-6">
              <Logo className="h-6 w-auto -ml-[0px]" />
              <span className="text-[13px] text-zinc-500 lowercase">{t('editor.header.subtitle')}</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              {t('sobre.footer.description')}
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">{t('sobre.footer.contact')}</h4>
            <a href="mailto:sitemoscatee@gmail.com" className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors group">
              <div className="w-10 h-10 rounded-[12px] bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                <Mail size={18} />
              </div>
              sitemoscatee@gmail.com
            </a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-zinc-600">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p>{t('footer.copyright')}</p>
            <p className="max-w-xl text-center md:text-left">{t('footer.legal_notice')}</p>
          </div>
          <div className="flex gap-6">
            <Link to={`/${lang}/terms`} className="hover:text-zinc-400 transition-colors tracking-widest">{t('common.terms')}</Link>
            <Link to={`/${lang}/privacy`} className="hover:text-zinc-400 transition-colors tracking-widest">{t('common.privacy_policy')}</Link>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[60] w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-95 group"
          >
            <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SobrePage;
