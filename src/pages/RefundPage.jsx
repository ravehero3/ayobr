import React from 'react';
import { useNavigate } from 'react-router-dom';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import AccordionSection from '../components/AccordionSection';
import { useLanguage } from '../context/LanguageContext';

export default function RefundPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const sections = [
    { id: 's1', title: t('refund.s1.title'), desc: t('refund.s1.desc') },
    { id: 's2', title: t('refund.s2.title'), desc: t('refund.s2.desc') },
    { id: 's3', title: t('refund.s3.title'), desc: t('refund.s3.desc') },
    { id: 's4', title: t('refund.s4.title'), desc: t('refund.s4.desc') }
  ];

  return (
    <div className="min-h-screen bg-[#050a13] text-white selection:bg-blue-500/30">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4"
        style={{ background: 'rgba(5,10,19,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 20 }} />
        </button>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white transition-colors" style={{ fontFamily: "'Neue Montreal', 'Inter', sans-serif" }}>
          {t('back')}
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: "'GT Walsheim Framer Medium', sans-serif" }}>
          {t('refund.title')}
        </h1>
        <p className="text-white/[0.4] text-sm mb-16" style={{ fontFamily: "'Neue Montreal', 'Inter', sans-serif" }}>
          {t('lastUpdated')} {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
