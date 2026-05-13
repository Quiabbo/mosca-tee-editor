import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Search, Filter, ArrowUpRight, 
  ChevronRight, Clock, Calendar, User, Mail
} from 'lucide-react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { blogPosts } from '../data/blogPosts';
import { cn } from '../lib/utils';
import { Logo } from '../components/Logo';
import { LanguageSelector } from '../components/Layout/LanguageSelector';

export const BlogPage: React.FC = () => {
  const { t } = useTranslation();
  const { lang: langParam } = useParams();
  const location = useLocation();
  const lang = langParam || (location.pathname.startsWith('/pt-br') ? 'pt-br' : 'en');
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    return blogPosts
      .filter(post => post.lang === lang)
      .filter(post => selectedCategory === 'all' || post.category.toLowerCase() === selectedCategory.toLowerCase())
      .filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [lang, selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const cats = blogPosts
      .filter(post => post.lang === lang)
      .map(post => post.category);
    return ['all', ...Array.from(new Set(cats))];
  }, [lang]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to={`/${lang}`} className="flex flex-col gap-0 group">
            <Logo className="h-6 w-auto" />
            <span className="text-[13px] text-zinc-500 lowercase">{t('editor.header.subtitle')}</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to={lang === 'en' ? '/en/about' : '/pt-br/sobre'} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              {t('common.about')}
            </Link>
            <span className="text-sm font-bold text-white">
              {t('sobre.header.blog')}
            </span>
            <LanguageSelector />
            <Link to={`/${lang}`} className="bg-white text-black px-6 py-2.5 rounded-[12px] text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95">
              {t('sobre.header.open_editor')}
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
                {t('sobre.header.blog')}
              </h1>
              <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                {t('sobre.blog.subtitle')}
              </p>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-zinc-900 pb-8">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all border",
                    selectedCategory === cat 
                      ? "bg-white text-black border-white" 
                      : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600"
                  )}
                >
                  {cat === 'all' ? (lang === 'en' ? 'All' : 'Todos') : cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link 
                    to={`/${lang}/blog/${post.slug}`}
                    className="group block"
                  >
                    <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-900 mb-6">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase">
                          {post.category.charAt(0).toUpperCase() + post.category.slice(1).toLowerCase()}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">
                          {post.readTime}
                        </span>
                      </div>
                      
                      <h2 className="text-2xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors leading-tight">
                        {post.title}
                      </h2>
                      
                      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>

                      <div className="pt-4 flex items-center gap-2 text-white font-bold text-xs">
                        {t('sobre.blog.read_more')}
                        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-zinc-500 text-lg">{t('sobre.blog.not_found')}</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-md">
            <div className="flex flex-col items-start mb-6">
              <Logo className="h-6 w-auto -ml-[0px]" />
              <span className="text-[9px] text-zinc-500 font-medium lowercase tracking-widest -mt-1">{t('editor.header.subtitle')}</span>
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
    </div>
  );
};

export default BlogPage;
