import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLemonSqueezy } from '../hooks/useLemonSqueezy';
import Navbar from '../components/Navbar';
import LanguageToggle from '../components/LanguageToggle';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';
import useDocumentTitle from '../hooks/useDocumentTitle';

const NM = "'Neue Montreal', 'Inter', sans-serif";

const PricingIcons = {
  Video: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  Infinity: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/></svg>,
  Star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Image: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Monitor: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Cancel: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Present: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
};

function UserDetailsModal({ plan, interval, onClose, onSubmit, loading }) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [producerName, setProducerName] = useState(user?.producer_name || '');

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
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
        onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth: 440,
          background: 'linear-gradient(to bottom, rgba(8,8,12,0.98), rgba(4,14,50,0.98))',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)',
        }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>x</button>

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

export default function UpgradePage() {
  const { user, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCzech = language === 'cs';
  const [isAnnual, setIsAnnual] = useState(true);
  const [pending, setPending] = useState(null); // { plan, interval }
  const [loading, setLoading] = useState(false);
  useDocumentTitle(isCzech ? 'Upgrade plánu' : 'Upgrade Plan');

  const { openCheckout } = useLemonSqueezy();

  useEffect(() => {
    const plan = searchParams.get('plan');
    const interval = searchParams.get('interval');
    if (interval === 'monthly') setIsAnnual(false);
    else if (interval === 'yearly') setIsAnnual(true);
    if (plan === 'pro' || plan === 'unlimited') {
      setPending({
        plan,
        interval: interval === 'monthly' ? 'monthly' : 'yearly',
      });
    }
  }, [searchParams]);

  const plans = [
    {
      name: t('landing.pricing.pro.name'),
      price: isAnnual ? t('landing.pricing.pro.price.annual') : t('landing.pricing.pro.price.monthly'),
      period: t('landing.pricing.period'),
      desc: t('landing.pricing.pro.desc'),
      features: [
        { text: t('landing.pricing.pro.f1'), icon: PricingIcons.Video },
        { text: t('landing.pricing.pro.f2'), icon: PricingIcons.Monitor },
        { text: t('landing.pricing.pro.f3'), icon: PricingIcons.Image },
        { text: t('landing.pricing.pro.f4'), icon: PricingIcons.Star },
        { text: t('landing.pricing.pro.f5'), icon: PricingIcons.Cancel },
        ...(isAnnual ? [{ text: t('landing.pricing.pro.f6.annual'), icon: PricingIcons.Present }] : []),
      ],
      plan: 'pro', highlight: true, ctaStyle: 'solid',
      cta: isCzech ? 'Začít s Pro' : 'Get Pro',
    },
    {
      name: t('landing.pricing.unlimited.name'),
      price: isAnnual ? t('landing.pricing.unlimited.price.annual') : t('landing.pricing.unlimited.price.monthly'),
      period: t('landing.pricing.period'),
      desc: t('landing.pricing.unlimited.desc'),
      features: [
        { text: t('landing.pricing.unlimited.f1'), icon: PricingIcons.Infinity },
        { text: t('landing.pricing.unlimited.f2'), icon: PricingIcons.Monitor },
        { text: t('landing.pricing.unlimited.f3'), icon: PricingIcons.Image },
        { text: t('landing.pricing.unlimited.f4'), icon: PricingIcons.Star },
        { text: t('landing.pricing.unlimited.f5'), icon: PricingIcons.Cancel },
        ...(isAnnual ? [{ text: t('landing.pricing.unlimited.f6.annual'), icon: PricingIcons.Present }] : []),
      ],
      plan: 'unlimited', highlight: false, topTier: true, ctaStyle: 'ghost',
      cta: isCzech ? 'Jít na Neomezený' : 'Go Unlimited',
    },
  ];

  const handlePlanClick = (plan) => {
    if (!user) { navigate('/login'); return; }
    setPending({ plan, interval: isAnnual ? 'yearly' : 'monthly' });
  };

  const handleDetailsSubmit = async ({ firstName, lastName, producerName }) => {
    setLoading(true);
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ first_name: firstName, last_name: lastName, producer_name: producerName || undefined }),
      });
      await refreshUser();

      if (isCzech) {
        // Czech customers → GoPay (CZK)
        const res = await fetch('/api/gopay/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ plan: pending.plan, isAnnual: pending.interval === 'yearly' }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.message || 'Chyba platby. Zkuste to prosím znovu.');
          setLoading(false);
          return;
        }
        const { gwUrl } = await res.json();
        if (gwUrl) {
          window.location.href = gwUrl;
          // Page is navigating away — keep loading state, don't clear modal
          return;
        }
        alert('Nepodařilo se zahájit platbu. Zkuste to prosím znovu.');
        setLoading(false);
      } else {
        // International customers → LemonSqueezy (USD/EUR)
        const opened = await openCheckout(user?.email, pending.plan, pending.interval);
        if (!opened) { setLoading(false); return; }
        setPending(null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(isCzech ? 'Chyba platby. Zkuste to prosím znovu.' : 'Payment error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: NM }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Navbar onUpgradePro={() => handlePlanClick('pro')} onUpgradeUnlimited={() => handlePlanClick('unlimited')}
        checkoutLoading={loading} onManageSubscription={() => navigate('/upgrade')} onInvite={() => {}} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px' }}>
        {/* Back */}
        <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: NM, fontSize: '0.85rem', marginBottom: 48, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
          ← {isCzech ? 'Zpět do aplikace' : 'Back to app'}
        </button>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 16 }}>
            {isCzech ? 'Vyberte svůj plán' : 'Choose your plan'}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            {isCzech ? 'Žádné smlouvy. Zrušení kdykoli.' : 'No contracts. Cancel anytime.'}
          </motion.p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, alignItems: 'stretch' }}>
          {plans.map((plan, idx) => (
            <div key={plan.plan} style={{ position: 'relative' }}>
              {plan.highlight && (
                <>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '120%', height: '120%', background: 'rgba(59,130,246,0.25)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '120%', height: '120%', backgroundImage: `url(${starsBg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6, zIndex: 0, pointerEvents: 'none', borderRadius: '50%', maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, transparent 65%)', WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, transparent 65%)' }} />
                </>
              )}
              {plan.topTier && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '130%', height: '130%', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />}
              <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: idx * 0.1 }}
                style={{
                  position: 'relative', zIndex: 1, borderRadius: 16, padding: '32px 28px 28px',
                  display: 'flex', flexDirection: 'column', height: '100%',
                  background: plan.highlight ? 'linear-gradient(to bottom, rgba(1,5,10,0.85), rgba(7,30,87,0.85))' : plan.topTier ? 'rgba(0,0,0,0.85)' : '#0a0a0a',
                  backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
                  border: plan.topTier ? '1px solid rgba(255,255,255,0.25)' : '1px solid #333',
                  boxShadow: plan.highlight ? '0 30px 60px -12px rgba(0,0,0,0.6)' : plan.topTier ? '0 20px 50px -10px rgba(255,255,255,0.08)' : '0 10px 30px -10px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                }}>

                {/* Name + Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: NM, fontSize: 22, fontWeight: 400, color: '#fff' }}>{plan.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: NM, fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.04em', cursor: 'pointer' }} onClick={() => setIsAnnual(v => !v)}>{t('landing.pricing.toggle.annual')}</span>
                    <button onClick={() => setIsAnnual(v => !v)} style={{ width: 26, height: 14, borderRadius: 99, background: isAnnual ? '#3B82F6' : 'rgba(255,255,255,0.1)', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 0, transition: 'background 0.3s' }}>
                      <motion.div animate={{ x: isAnnual ? 12 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute', top: 1, left: 1 }} />
                    </button>
                  </div>
                </div>

                {/* Desc */}
                <p style={{ fontFamily: NM, fontSize: '0.82rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1.6, marginBottom: 24 }}>{plan.desc}</p>
                <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

                {/* Price */}
                <div style={{ marginBottom: 0 }}>
                  <AnimatePresence mode="popLayout">
                    <motion.span key={plan.price} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
                      style={{ fontFamily: NM, fontWeight: 600, fontSize: '2rem', letterSpacing: '-0.03em', color: '#fff', display: 'inline-block' }}>
                      {plan.price}
                    </motion.span>
                  </AnimatePresence>
                  <span style={{ fontFamily: NM, fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>{plan.period}</span>
                </div>

                <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24, marginTop: 16 }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ fontFamily: NM, fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: '#fff', display: 'flex', alignItems: 'center', flexShrink: 0 }}>{f.icon}</span>
                      {f.text}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button onClick={() => handlePlanClick(plan.plan)} disabled={loading}
                  style={{
                    width: '100%', height: 40, borderRadius: 9999, cursor: 'pointer', outline: 'none', fontFamily: NM, fontWeight: 600, fontSize: '0.85rem',
                    background: plan.highlight ? '#fff' : 'transparent',
                    color: plan.highlight ? '#000' : 'rgba(255,255,255,0.65)',
                    border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.14)',
                    transition: 'transform 0.15s, opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  {plan.cta}
                </button>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-4 md:px-[64px] py-4"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: '#000',
        }}>
        <LanguageToggle />
      </div>

      <AnimatePresence>
        {pending && (
          <UserDetailsModal plan={pending.plan} interval={pending.interval}
            onClose={() => setPending(null)} onSubmit={handleDetailsSubmit} loading={loading} />
        )}
      </AnimatePresence>
    </div>
  );
}
