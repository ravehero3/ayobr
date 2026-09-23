import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const NM = "'Neue Montreal', 'Inter', sans-serif";

export default function UserDetailsModal({ plan, interval, onClose, onSubmit, loading, initialValues }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? user?.first_name ?? '');
  const [lastName, setLastName] = useState(initialValues?.lastName ?? user?.last_name ?? '');
  const [producerName, setProducerName] = useState(initialValues?.producerName ?? user?.producer_name ?? '');

  const isCzech = language === 'cs';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), producerName: producerName.trim() });
  };

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '12px 14px', color: '#fff', fontFamily: NM, fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };
  const labelStyle = { fontFamily: NM, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', letterSpacing: '0.04em' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth: 440,
          background: 'linear-gradient(to bottom, rgba(8,8,12,0.98), rgba(4,14,50,0.98))',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)',
        }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: NM, fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.03em' }}>
            {isCzech ? 'Ještě jeden krok' : 'One last step'}
          </h2>
          <p style={{ fontFamily: NM, fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
            {isCzech ? 'Vyplňte prosím své jméno před platbou.' : 'Fill in your details before proceeding to payment.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>{isCzech ? 'JMÉNO *' : 'FIRST NAME *'}</label>
            <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)}
              placeholder={isCzech ? 'Jan' : 'John'} required
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.35)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
          </div>
          <div>
            <label style={labelStyle}>{isCzech ? 'PŘÍJMENÍ *' : 'LAST NAME *'}</label>
            <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)}
              placeholder={isCzech ? 'Novák' : 'Smith'} required
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.35)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
          </div>
          <div>
            <label style={labelStyle}>{isCzech ? 'JMÉNO PRODUCENTA (VOLITELNÉ)' : 'PRODUCER NAME (OPTIONAL)'}</label>
            <input style={inputStyle} value={producerName} onChange={e => setProducerName(e.target.value)}
              placeholder={isCzech ? 'DJ Tvoje Jméno' : 'DJ YourName'}
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.35)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
          </div>

          <button type="submit" disabled={loading || !firstName.trim() || !lastName.trim()}
            style={{
              marginTop: 8, width: '100%', height: 46, borderRadius: 9999, border: 'none', cursor: 'pointer',
              background: '#fff', color: '#000', fontFamily: NM, fontWeight: 700, fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (!firstName.trim() || !lastName.trim()) ? 0.5 : 1,
              transition: 'opacity 0.2s, transform 0.1s',
            }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
            {loading ? (
              <><span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                {isCzech ? 'Přesměrovávám...' : 'Redirecting...'}</>
            ) : (isCzech ? 'Pokračovat k platbě →' : 'Continue to payment →')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
