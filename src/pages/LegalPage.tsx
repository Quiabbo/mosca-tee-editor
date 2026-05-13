import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, FileText } from 'lucide-react';
import { motion } from 'motion/react';

const LegalPage = ({ type }: { type: 'terms' | 'privacy' }) => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const currentLang = lang?.toLowerCase() === 'pt-br' ? 'pt-br' : 'en';

  const content = type === 'terms' ? (
    <div className="space-y-8 text-zinc-300 leading-relaxed">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
        <p>Ao acessar o Mosca Tee, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">2. Propriedade Intelectual</h2>
        <p>O design, a interface, o código-fonte, os logotipos e a marca Mosca Tee são propriedade intelectual exclusiva. A reprodução, cópia ou redistribuição não autorizada de qualquer parte deste software é estritamente proibida.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">3. Uso do Software</h2>
        <p>O Mosca Tee é fornecido "como está". Não garantimos que o software será ininterrupto ou livre de erros. O processamento de arquivos (como PSD) ocorre localmente no seu navegador.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">4. Limitação de Responsabilidade</h2>
        <p>Em nenhum caso o Mosca Tee será responsável por quaisquer danos decorrentes do uso ou da incapacidade de usar o software.</p>
      </section>
    </div>
  ) : (
    <div className="space-y-8 text-zinc-300 leading-relaxed">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Privacidade Absoluta</h2>
        <p>O Mosca Tee foi construído com o princípio de "Privacy by Design". Suas imagens, designs e arquivos nunca são enviados para nossos servidores.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Coleta de Dados</h2>
        <p>Não coletamos informações pessoalmente identificáveis. Não exigimos login, e-mail ou qualquer forma de cadastro para o uso das ferramentas profissionais.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Processamento Local</h2>
        <p>Todo o processamento gráfico, incluindo a importação de arquivos PSD e a remoção de fundo por IA, ocorre localmente no seu navegador utilizando o poder do seu hardware.</p>
      </section>
    </div>
  );

  const enContent = type === 'terms' ? (
    <div className="space-y-8 text-zinc-300 leading-relaxed">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
        <p>By accessing Mosca Tee, you agree to comply with these terms of service, all applicable laws and regulations.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">2. Intellectual Property</h2>
        <p>The design, interface, source code, logos, and the Mosca Tee brand are exclusive intellectual property. Unauthorized reproduction, copying, or redistribution of any part of this software is strictly prohibited.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">3. Software Use</h2>
        <p>Mosca Tee is provided "as is". We do not guarantee that the software will be uninterrupted or error-free. File processing (such as PSD) occurs locally in your browser.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">4. Limitation of Liability</h2>
        <p>In no case shall Mosca Tee be liable for any damages arising from the use or inability to use the software.</p>
      </section>
    </div>
  ) : (
    <div className="space-y-8 text-zinc-300 leading-relaxed">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Absolute Privacy</h2>
        <p>Mosca Tee was built with the "Privacy by Design" principle. Your images, designs, and files are never sent to our servers.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Data Collection</h2>
        <p>We do not collect personally identifiable information. We do not require login, email, or any form of registration to use professional tools.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Local Processing</h2>
        <p>All graphic processing, including PSD file import and AI background removal, occurs locally in your browser using your hardware's power.</p>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to={`/${currentLang}/sobre`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span className="font-bold">{t('common.about')}</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tighter">
              {type === 'terms' ? t('common.terms') : t('common.privacy_policy')}
            </h1>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      <main className="pt-40 pb-32 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {currentLang === 'pt-br' ? content : enContent}
          </motion.div>
        </div>
      </main>

      <footer className="py-20 px-6 border-t border-zinc-900 text-center">
        <p className="text-zinc-600 text-sm">{t('footer.copyright')}</p>
      </footer>
    </div>
  );
};

export default LegalPage;
