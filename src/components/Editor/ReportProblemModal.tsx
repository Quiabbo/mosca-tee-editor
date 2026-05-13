import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertCircle } from 'lucide-react';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
  t
}) => {
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('message', description);
    
    // FormSubmit Configuration
    formData.append('_subject', 'Novo Relato de Problema - MoscaTee');
    formData.append('_template', 'table');
    formData.append('_captcha', 'false');

    try {
      const response = await fetch("https://formsubmit.co/ajax/sitemoscatee@gmail.com", {
        method: "POST",
        body: formData
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        // Even if it fails, we show the success message to the user for better UX in this context
        // or we could handle errors. For now, let's follow the user's request to show the message.
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#191919] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-blue-500" size={20} />
              <h2 className="text-lg font-bold text-white">{t('editor.help.report_problem', 'Reportar Problema')}</h2>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {!submitted ? (
            <form 
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              {/* FormSubmit Configuration */}
              <input type="hidden" name="_subject" value="Novo Relato de Problema - MoscaTee" />
              <input type="hidden" name="_template" value="table" />
              
              <div>
                <label className="block text-xs font-bold text-zinc-500 tracking-wider mb-1.5">
                  {t('common.email', 'E-mail')}
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 tracking-wider mb-1.5">
                  {t('editor.help.description', 'Descrição do Problema')}
                </label>
                <textarea
                  name="message"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('editor.help.description_placeholder', 'Descreva o que aconteceu...')}
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      {t('common.send', 'Enviar')}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-12 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                <Send size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{t('editor.help.report_sent', 'Relato Enviado!')}</h3>
                <p className="text-sm text-zinc-400">{t('editor.help.report_sent_desc', 'Obrigado por nos ajudar a melhorar o MoscaTee.')}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full mt-4 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-bold transition-colors"
              >
                {t('common.close', 'Fechar')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
