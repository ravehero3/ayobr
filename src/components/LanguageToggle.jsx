import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLang = () => {
    setLanguage(language === 'en' ? 'cs' : 'en');
  };

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 transition-all text-xs font-medium"
      style={{
        background: 'rgba(255,255,255,0.04)',
        fontFamily: "'Neue Montreal', 'Inter', sans-serif",
        backdropFilter: 'blur(10px)',
      }}
    >
      <span className={language === 'en' ? 'text-white' : 'text-white/40'}>EN</span>
      <span className="text-white/20">|</span>
      <span className={language === 'cs' ? 'text-white' : 'text-white/40'}>CZ</span>
    </button>
  );
}
