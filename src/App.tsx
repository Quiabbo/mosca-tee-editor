import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from './lib/utils';

// Lazy load pages
const MoscaTeePage = lazy(() => import('./pages/MoscaTeePage'));
const SobrePage = lazy(() => import('./pages/SobrePage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const PostPage = lazy(() => import('./pages/PostPage'));

const LoadingPage = () => {
  return (
    <div className="min-h-screen bg-[#000000]" />
  );
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (pathname.includes('/faq') || hash === '#faq') {
      const element = document.getElementById('faq');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    if (pathname.includes('/blog') || hash === '#blog') {
      const element = document.getElementById('blog');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

const LanguageWrapper = ({ children, langOverride }: { children: React.ReactNode, langOverride?: string }) => {
  const { lang: langParam } = useParams();
  const lang = langOverride || langParam;
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const supportedLangs = ['en', 'pt-br', 'pt-BR'];
    const currentLang = lang?.toLowerCase();

    if (currentLang && supportedLangs.includes(currentLang)) {
      const targetLang = currentLang === 'pt-br' ? 'pt-br' : 'en';
      if (i18n.language !== targetLang) {
        i18n.changeLanguage(targetLang);
      }
    } else if (location.pathname === '/') {
      // Root redirect based on browser language
      const browserLang = navigator.language.toLowerCase();
      const targetLang = browserLang.startsWith('pt') ? 'pt-br' : 'en';
      navigate(`/${targetLang}`, { replace: true });
    }
  }, [lang, i18n, navigate, location.pathname]);

  return <>{children}</>;
};

export default function App() {
  return (
    <div className={cn("min-h-screen bg-black font-sans text-white")}>
      <ScrollToTop />
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/:lang" element={<LanguageWrapper><MoscaTeePage /></LanguageWrapper>} />
          <Route path="/en/about" element={<LanguageWrapper langOverride="en"><SobrePage /></LanguageWrapper>} />
          <Route path="/pt-br/sobre" element={<LanguageWrapper langOverride="pt-br"><SobrePage /></LanguageWrapper>} />
          
          {/* Blog Routes */}
          <Route path="/en/blog" element={<LanguageWrapper langOverride="en"><BlogPage /></LanguageWrapper>} />
          <Route path="/pt-br/blog" element={<LanguageWrapper langOverride="pt-br"><BlogPage /></LanguageWrapper>} />
          <Route path="/en/blog/:slug" element={<LanguageWrapper langOverride="en"><PostPage /></LanguageWrapper>} />
          <Route path="/pt-br/blog/:slug" element={<LanguageWrapper langOverride="pt-br"><PostPage /></LanguageWrapper>} />
          
          {/* Legacy Blog Post Routes */}
          <Route path="/en/about/:slug" element={<LanguageWrapper langOverride="en"><PostPage /></LanguageWrapper>} />
          <Route path="/pt-br/sobre/:slug" element={<LanguageWrapper langOverride="pt-br"><PostPage /></LanguageWrapper>} />
          <Route path="/:lang/terms" element={<LanguageWrapper><LegalPage type="terms" /></LanguageWrapper>} />
          <Route path="/:lang/privacy" element={<LanguageWrapper><LegalPage type="privacy" /></LanguageWrapper>} />
          
          {/* Redirects for about/sobre */}
          <Route path="/en/sobre" element={<Navigate to="/en/about" replace />} />
          <Route path="/pt-br/about" element={<Navigate to="/pt-br/sobre" replace />} />
          <Route path="/:lang/sobre" element={<Navigate to="/pt-br/sobre" replace />} />
          <Route path="/:lang/about" element={<Navigate to="/en/about" replace />} />

          <Route path="/:lang/moscatee/*" element={<LanguageWrapper><MoscaTeePage /></LanguageWrapper>} />
          
          {/* Fallback for root */}
          <Route path="/" element={<LanguageWrapper><LoadingPage /></LanguageWrapper>} />
          
          {/* Legacy redirects if any */}
          <Route path="/sobre" element={<Navigate to="/pt-br/sobre" replace />} />
          <Route path="*" element={<Navigate to="/en" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
