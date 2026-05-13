import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink } from 'lucide-react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

declare const anime: any;

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { lang: langParam } = useParams<{ lang: string }>();
  const location = useLocation();
  const lang = langParam || (location.pathname.startsWith('/pt-br') ? 'pt-br' : 'en');

  useEffect(() => {
    if (isOpen) {
      const LETTERS = ['all-M','all-o','all-s','all-c','all-a','all-dot','all-t','all-e1','all-e2'];
      const animateAboutLogo = () => {
        // @ts-ignore
        if (typeof anime === 'undefined') return;

        LETTERS.forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.style.opacity = '0';
          el.style.transform = 'translateY(12px)';
        });

        // @ts-ignore
        anime({
          targets: LETTERS.map((id) => '#' + id),
          opacity: [0, 1],
          translateY: [12, 0],
          duration: 500,
          // @ts-ignore
          delay: anime.stagger(50, { start: 200 }),
          easing: 'easeOutCubic',
          complete: () => {
            // Ponto azul pisca no modal também
            // @ts-ignore
            anime({
              targets: '#all-dot',
              opacity: [
                { value: 0, duration: 100, easing: 'easeOutQuad' },
                { value: 0, duration: 500 },
                { value: 1, duration: 100, easing: 'easeInQuad' }
              ],
              delay: 200
            });
          }
        });
      };

      const timer = setTimeout(animateAboutLogo, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative w-full max-w-[520px] bg-[#111111] rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-800/50"
          >
            {/* Header */}
            <div className="bg-[#1a1a1a] p-8 flex justify-between items-start rounded-t-[12px]">
              <div className="flex flex-col gap-0">
                <svg
                  id="about-logo-svg"
                  viewBox="0 0 510.055 100"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-auto"
                  aria-label="Mosca Tee"
                  role="img"
                >
                  <g id="all-M">
                    <path fill="#ffffff" d="M24.511,18.895l-2.258,31.732h0.878c0-4.598,0.543-9.385,1.631-14.361c1.085-4.974,3.092-9.281,6.02-12.918 c2.926-3.637,6.898-5.456,11.915-5.456c5.1,0,9.323,1.548,12.668,4.641c3.343,3.094,5.268,8.278,5.77,15.552 c1.17-5.769,3.218-10.577,6.146-14.423c2.926-3.845,6.98-5.77,12.166-5.77c5.519,0,9.991,1.819,13.42,5.456 c3.428,3.637,5.142,9.763,5.142,18.375v39.884H74.053V50.627c0-4.014-0.502-7.274-1.505-9.783 c-1.003-2.509-2.509-3.763-4.516-3.763c-2.091,0-3.743,1.297-4.954,3.888c-1.213,2.593-1.818,5.813-1.818,9.658v30.979H37.304 V50.627c0-4.014-0.501-7.274-1.505-9.783c-1.003-2.509-2.509-3.763-4.515-3.763c-2.091,0-3.743,1.297-4.955,3.888 c-1.213,2.593-1.818,5.813-1.818,9.658v30.979H0.555V18.895H24.511z"/>
                  </g>
                  <g id="all-o">
                    <path fill="#ffffff" d="M118.139,78.91c-5.311-2.634-9.513-6.416-12.605-11.351c-3.094-4.933-4.641-10.743-4.641-17.434 c0-6.689,1.546-12.48,4.641-17.371c3.092-4.892,7.294-8.633,12.605-11.226c5.309-2.591,11.226-3.888,17.748-3.888 s12.437,1.297,17.747,3.888c5.309,2.593,9.511,6.334,12.605,11.226c3.093,4.891,4.641,10.682,4.641,17.371 c0,6.69-1.548,12.501-4.641,17.434c-3.094,4.935-7.296,8.717-12.605,11.351c-5.311,2.634-11.225,3.951-17.747,3.951 S123.448,81.544,118.139,78.91z M128.549,58.09c1.964,1.965,4.409,2.947,7.337,2.947c2.926,0,5.372-0.982,7.337-2.947 c1.964-1.964,2.948-4.578,2.948-7.839c0-3.343-0.984-5.977-2.948-7.901c-1.965-1.922-4.411-2.885-7.337-2.885 c-2.928,0-5.374,0.962-7.337,2.885c-1.966,1.924-2.947,4.558-2.947,7.901C125.602,53.512,126.583,56.126,128.549,58.09z"/>
                  </g>
                  <g id="all-s">
                    <path fill="#ffffff" d="M183.734,81.544c-4.559-0.794-8.049-1.86-10.473-3.199V57.776l3.01,1.129c3.93,1.589,7.4,2.759,10.41,3.512 c3.01,0.753,6.898,1.129,11.665,1.129c2.508,0,4.515-0.458,6.021-1.379c1.505-0.919,2.257-2.173,2.257-3.763 c0-1.086-0.773-1.901-2.32-2.446c-1.548-0.543-4.076-1.191-7.587-1.944c-4.516-0.834-8.384-1.775-11.602-2.822 c-3.22-1.044-6-2.8-8.34-5.268c-2.342-2.465-3.512-5.789-3.512-9.971c0-12.542,9.197-18.813,27.593-18.813 c5.936,0,11.182,0.356,15.741,1.066c4.557,0.711,8.131,1.611,10.724,2.697v20.695c-8.529-3.428-16.891-5.143-25.084-5.143 c-2.759,0-4.829,0.482-6.208,1.442c-1.38,0.962-2.07,2.195-2.07,3.7c0,1.505,0.878,2.593,2.634,3.261 c1.756,0.67,4.597,1.38,8.528,2.132c4.598,0.837,8.36,1.736,11.288,2.697c2.926,0.962,5.476,2.571,7.651,4.829 c2.173,2.258,3.261,5.436,3.261,9.532c0,12.46-9.199,18.688-27.593,18.688C193.62,82.735,188.29,82.337,183.734,81.544z"/>
                  </g>
                  <g id="all-c">
                    <path fill="#ffffff" d="M268.706,39.464c-4.182,0-7.568,0.962-10.159,2.885c-2.593,1.924-3.888,4.558-3.888,7.901 c0,3.346,1.295,5.979,3.888,7.902c2.591,1.924,5.978,2.885,10.159,2.885c6.271,0,10.702-1.295,13.295-3.888v23.58 c-1.339,0.586-3.994,1.085-7.965,1.505c-3.972,0.417-7.004,0.627-9.093,0.627c-6.521,0-12.438-1.317-17.747-3.951 c-5.312-2.634-9.513-6.416-12.605-11.351c-3.094-4.933-4.641-10.743-4.641-17.434c0-6.689,1.547-12.48,4.641-17.371 c3.093-4.892,7.294-8.633,12.605-11.226c5.309-2.591,11.226-3.888,17.747-3.888c2.007,0,5.017,0.231,9.03,0.69 c4.014,0.46,6.688,0.984,8.027,1.568v23.329C279.324,40.719,274.892,39.464,268.706,39.464z"/>
                  </g>
                  <g id="all-a">
                    <path fill="#ffffff" d="M328.28,63.295h-1.254c0,5.854-1.799,10.516-5.394,13.984c-3.596,3.471-8.446,5.205-14.549,5.205 c-6.606,0-11.853-1.274-15.74-3.825c-3.889-2.55-5.832-6.542-5.832-11.978c0-6.688,3.637-11.602,10.911-14.737 c7.274-3.135,16.137-4.911,26.59-5.331c-1.088-1.671-2.593-2.988-4.515-3.951c-1.925-0.96-3.973-1.442-6.146-1.442 c-3.68,0-7.255,0.335-10.724,1.003c-3.471,0.67-7.296,1.63-11.476,2.885V21.78c4.18-1.254,8.297-2.258,12.354-3.01 c4.055-0.752,8.843-1.129,14.361-1.129c10.786,0,18.833,2.53,24.144,7.588c5.31,5.06,7.965,11.811,7.965,20.256v36.122h-24.709 L328.28,63.295z M315.613,67.559c1.838,0,3.866-0.668,6.083-2.007c2.214-1.336,3.323-2.967,3.323-4.892v-6.146 c-4.265,0.335-7.882,1.213-10.849,2.634c-2.97,1.423-4.453,3.386-4.453,5.895C309.718,66.054,311.681,67.559,315.613,67.559z"/>
                  </g>
                  <g id="all-dot">
                    <path fill="#2563EB" d="M376.294,79.843c-1.832-1.831-2.747-4.031-2.747-6.601c0-2.569,0.915-4.756,2.747-6.56 c1.831-1.804,4.03-2.706,6.601-2.706c2.569,0,4.756,0.902,6.561,2.706c1.804,1.804,2.706,3.991,2.706,6.56 c0,2.57-0.902,4.77-2.706,6.601c-1.805,1.831-3.991,2.747-6.561,2.747C380.324,82.59,378.125,81.674,376.294,79.843z"/>
                  </g>
                  <g id="all-t">
                    <path fill="#ffffff" d="M414.873,64.796c0.492,1.531,1.312,2.624,2.46,3.28c1.148,0.656,2.788,0.984,4.92,0.984v13.366 c-5.631,0-10.127-0.684-13.488-2.05c-3.362-1.366-5.919-3.936-7.667-7.708c-1.751-3.772-2.624-9.266-2.624-16.482v-4.182h-5.33 V40.606h5.33v-7.298h15.661v7.298h7.463v11.398h-7.463v6.314C414.135,61.106,414.381,63.267,414.873,64.796z"/>
                  </g>
                  <g id="all-e1">
                    <path fill="#ffffff" d="M426.598,49.667c2.022-3.198,4.769-5.644,8.241-7.339c3.471-1.694,7.339-2.542,11.603-2.542 c2.515,0,5.221,0.615,8.118,1.845s5.494,3.54,7.79,6.929c2.296,3.39,3.553,8.036,3.772,13.94l-26.404-0.82 c0.164,2.078,1.23,3.677,3.198,4.797c1.968,1.121,4.783,1.681,8.446,1.681c3.061,0,5.78-0.381,8.158-1.148 c2.378-0.765,3.922-1.503,4.634-2.214v16.154c-4.702,0.984-9.239,1.476-13.612,1.476c-8.419,0-15.021-1.886-19.803-5.658 c-4.784-3.772-7.176-9.02-7.176-15.744C423.564,56.651,424.576,52.865,426.598,49.667z M453.249,59.302 c-0.22-1.53-0.931-2.788-2.132-3.772c-1.203-0.984-2.488-1.476-3.854-1.476c-1.695,0-3.239,0.465-4.633,1.394 c-1.395,0.93-2.283,2.214-2.665,3.854H453.249z"/>
                  </g>
                  <g id="all-e2">
                    <path fill="#ffffff" d="M469.975,49.667c2.022-3.198,4.769-5.644,8.241-7.339c3.471-1.694,7.339-2.542,11.603-2.542 c2.515,0,5.221,0.615,8.118,1.845s5.494,3.54,7.79,6.929c2.296,3.39,3.553,8.036,3.772,13.94l-26.404-0.82 c0.164,2.078,1.23,3.677,3.198,4.797c1.968,1.121,4.783,1.681,8.446,1.681c3.061,0,5.78-0.381,8.158-1.148 c2.378-0.765,3.922-1.503,4.634-2.214v16.154c-4.702,0.984-9.239,1.476-13.612,1.476c-8.419,0-15.021-1.886-19.803-5.658 c-4.784-3.772-7.176-9.02-7.176-15.744C466.941,56.651,467.953,52.865,469.975,49.667z M496.626,59.302 c-0.22-1.53-0.931-2.788-2.132-3.772c-1.203-0.984-2.488-1.476-3.854-1.476c-1.695,0-3.239,0.465-4.633,1.394 c-1.395,0.93-2.283,2.214-2.665,3.854H496.626z"/>
                  </g>
                </svg>
                <p className="text-[13px] text-zinc-500 lowercase">{t('editor.header.subtitle')}</p>
              </div>
              <div className="px-3 py-1 bg-blue-600 rounded-full">
                <span className="text-[12px] font-semibold text-white">v1.0.0</span>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 pt-4 pb-4">
              <div className="text-[14px] leading-[1.8] text-[#cccccc] mb-6 space-y-4">
                <p>
                  {t('about.manifesto_text_1', 'We believe that good tools and privacy are a right.')}
                </p>
                <p>
                  {t('about.manifesto_text_2', 'Mosca Tee is not just a graphic editor; it is a manifesto for the democratization of design. In a world of expensive subscriptions and massive data collection, we choose the opposite path.')}
                </p>
                <p dangerouslySetInnerHTML={{ __html: t('about.manifesto_text_3', 'We are pioneers in inclusive design, being <strong>the world\'s first graphic editor with accessibility mode for blind and low vision people.</strong>') }} />
              </div>
              
              <div className="space-y-4 mb-0">
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  <p className="text-[13px] text-zinc-400"><strong>{t('about.free_title', '100% Free')}:</strong> {t('about.free_text', 'No premium plans, no watermarks, no catches. All professional tools released for everyone.')}</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  <p className="text-[13px] text-zinc-400"><strong>{t('about.no_login_title', 'No Login')}:</strong> {t('about.no_login_text', 'Start creating instantly. We don\'t ask for your email, we don\'t track your behavior.')}</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  <p className="text-[13px] text-zinc-400"><strong>{t('about.privacy_title', 'Total Privacy')}:</strong> {t('about.privacy_text', 'Everything is processed locally. Your images and designs never leave your computer.')}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800/50 p-8 py-5 flex justify-between items-center">
              <div>
                <p className="text-[11px] text-zinc-500 font-medium mb-0.5">{t('about.created_by', 'Created by')}</p>
                <p className="text-[14px] text-white font-bold">Filipi Hadji</p>
                <p className="text-[12px] text-zinc-500 mt-0.5">© 2026</p>
              </div>
              <div className="text-right">
                <Link 
                  to={lang === 'en' ? '/en/about' : '/pt-br/sobre'} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] text-blue-500 hover:text-blue-400 font-medium transition-colors"
                >
                  moscatee.com/{lang === 'en' ? 'en/about' : 'pt-br/sobre'}
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AboutModal;
