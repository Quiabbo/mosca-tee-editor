import React, { useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Calendar, ArrowRight, Share2, ChevronRight, ArrowUpRight, Mail } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Helmet } from 'react-helmet-async';
import { blogPosts } from '../data/blogPosts';
import { Logo } from '../components/Logo';
import { LanguageSelector } from '../components/Layout/LanguageSelector';

export const PostPage: React.FC = () => {
  const { slug, lang: langParam } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lang = langParam || (location.pathname.startsWith('/pt-br') ? 'pt-br' : 'en');

  const post = blogPosts.find(p => p.slug === slug && p.lang === lang);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-black mb-4">{t('sobre.blog.not_found')}</h1>
        <Link to={`/${lang}/blog`} className="text-blue-500 hover:underline">{t('sobre.blog.back_to_blog')}</Link>
      </div>
    );
  }

  const relatedPosts = blogPosts
    .filter(p => p.id !== post.id && p.lang === lang)
    .slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      <Helmet>
        <title>{post.metaTitle}</title>
        <meta name="description" content={post.metaDescription} />
        <meta name="keywords" content={post.keywords.join(', ')} />
      </Helmet>

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
            <Link to={`/${lang}/blog`} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              {t('sobre.header.blog')}
            </Link>
            <LanguageSelector />
            <Link to={`/${lang}`} className="bg-white text-black px-6 py-2.5 rounded-[12px] text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95">
              {t('sobre.header.open_editor')}
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-40 pb-20 px-6">
        <article className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Link 
            to={`/${lang}/blog`}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm uppercase tracking-widest">{t('sobre.blog.back_to_blog')}</span>
          </Link>

          {/* Post Header */}
          <header className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase">
                {post.category}
              </span>
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
              <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  {post.readTime}
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-12 leading-[1.05]">
              {post.title}
            </h1>

            <div className="aspect-[16/10] rounded-3xl overflow-hidden bg-zinc-900 mb-16">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </header>

          {/* Post Content */}
          <div className="prose-custom">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Footer Actions */}
          <footer className="mt-24 pt-12 border-t border-zinc-900">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-xs font-black uppercase tracking-widest transition-colors"
              >
                <Share2 size={16} />
                {t('sobre.blog.share')}
              </button>
            </div>
          </footer>
        </article>

        {/* Related Posts */}
        <section className="max-w-7xl mx-auto mt-40">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-black tracking-tighter">{t('sobre.blog.related_posts')}</h2>
            <Link 
              to={`/${lang}/blog`} 
              className="text-blue-500 font-bold hover:text-blue-400 transition-colors flex items-center gap-2 text-sm"
            >
              {t('sobre.blog.view_all')} <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost) => (
              <Link 
                key={relatedPost.id}
                to={`/${lang}/blog/${relatedPost.slug}`}
                className="group block"
              >
                <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-900 mb-6">
                  <img 
                    src={relatedPost.image} 
                    alt={relatedPost.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="space-y-3">
                  <span className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase">
                    {relatedPost.category}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors leading-tight">
                    {relatedPost.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
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

      <style>{`
        .prose-custom {
          font-size: 1.125rem;
          line-height: 1.8;
          color: #a1a1aa;
        }
        .prose-custom h2 {
          font-size: 2.25rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          color: #ffffff;
          margin-top: 4rem;
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }
        .prose-custom h3 {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          color: #ffffff;
          margin-top: 3rem;
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        .prose-custom p {
          margin-bottom: 2rem;
        }
        .prose-custom strong {
          color: #ffffff;
          font-weight: 700;
        }
        .prose-custom blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 2rem;
          margin: 3rem 0;
          font-style: italic;
          color: #ffffff;
          font-size: 1.25rem;
          line-height: 1.6;
        }
        .prose-custom ul, .prose-custom ol {
          margin-bottom: 2rem;
          padding-left: 1.5rem;
        }
        .prose-custom li {
          margin-bottom: 0.75rem;
        }
        .prose-custom a {
          color: #3b82f6;
          text-decoration: underline;
          text-underline-offset: 4px;
          transition: color 0.2s;
        }
        .prose-custom a:hover {
          color: #60a5fa;
        }
        .prose-custom hr {
          border: 0;
          border-top: 1px solid #18181b;
          margin: 4rem 0;
        }
      `}</style>
    </div>
  );
};

export default PostPage;
