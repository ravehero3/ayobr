import React from 'react';
import { useNavigate } from 'react-router-dom';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import AccordionSection from '../components/AccordionSection';
import { useLanguage } from '../context/LanguageContext';

export default function TermsPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const sections = [
    { id: 's1', title: t('terms.s1.title'), desc: t('terms.s1.desc') },
    { id: 's2', title: t('terms.s2.title'), desc: t('terms.s2.desc') },
    { id: 's3', title: t('terms.s3.title'), desc: t('terms.s3.desc') },
    { id: 's4', title: t('terms.s4.title'), desc: t('terms.s4.desc') },
    { id: 's5', title: t('terms.s5.title'), desc: t('terms.s5.desc') },
    { id: 's6', title: t('terms.s6.title'), desc: t('terms.s6.desc') },
    { id: 's7', title: t('terms.s7.title'), desc: t('terms.s7.desc') },
    { id: 's8', title: t('terms.s8.title'), desc: t('terms.s8.desc') },
    { id: 's9', title: t('terms.s9.title'), desc: t('terms.s9.desc') }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 20 }} />
        </button>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white transition-colors" style={{ fontFamily: "'Neue Montreal', 'Inter', sans-serif" }}>
          {t('back')}
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: "'GT Walsheim Framer Medium', sans-serif" }}>
          {t('terms.title')}
        </h1>
        <p className="text-white/[0.4] text-sm mb-16" style={{ fontFamily: "'Neue Montreal', 'Inter', sans-serif" }}>
          {t('lastUpdated')} {new Date().toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="border-t border-white/[0.06]">
          {sections.map(section => (
            <AccordionSection key={section.id} title={section.title}>
              {section.desc}
            </AccordionSection>
          ))}
        </div>
      </div>

      <footer className="py-8 px-6 border-t border-white/[0.06] text-center text-white/[0.3] text-sm" style={{ fontFamily: "'Neue Montreal', 'Inter', sans-serif" }}>
        © {new Date().getFullYear()} TypeBeatz. All rights reserved.
      </footer>
    </div>
  );
}
