import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SubscriptionExpiredModal from '../SubscriptionExpiredModal';
import UserDetailsModal from '../UserDetailsModal';
import InsufficientCreditsModal from '../InsufficientCreditsModal';
import ReferralPanel from '../ReferralPanel';
import ScreenSizeWarning from '../ScreenSizeWarning';
import starsBg from '../../assets/stars_background_voodoo808_1778087733997.jpg';

const NM = "'Neue Montreal', 'Inter', sans-serif";
const BLUE = '#3b82f6';
const CARD = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.08)';

export default function ModalPreviewTab() {
  const [selectedModalId, setSelectedModalId] = useState('subscription_expired');
  const [activeFullscreenModal, setActiveFullscreenModal] = useState(null);
  const [previewLang, setPreviewLang] = useState('cs'); // 'cs' | 'en'
  const isCzech = previewLang === 'cs';

  // ── Sandbox State: Subscription Expired ──
  const [subPlan, setSubPlan] = useState('pro'); // 'pro' | 'unlimited'
  const [subIsAnnual, setSubIsAnnual] = useState(false);
  const [subUserName, setSubUserName] = useState('Sentiv');
  const [subExpirePreset, setSubExpirePreset] = useState('2026-07-27');

  // ── Sandbox State: User Details Checkout ──
  const [detailsPlan, setDetailsPlan] = useState('pro');
  const [detailsInterval, setDetailsInterval] = useState('monthly');
  const [detailsFirstName, setDetailsFirstName] = useState('Jan');
  const [detailsLastName, setDetailsLastName] = useState('Novák');
  const [detailsProducerName, setDetailsProducerName] = useState('Sentiv Beats');

  // ── Sandbox State: Insufficient Credits ──
  const [credIsPro, setCredIsPro] = useState(false);
  const [credNeeded, setCredNeeded] = useState(2);
  const [credRemaining, setCredRemaining] = useState(0);

  // ── Available Modals Definition ──
  const MODALS = [
    {
      id: 'subscription_expired',
      name: isCzech ? 'Vypršené předplatné' : 'Expired Subscription',
      badge: 'KRITICKÉ',
      badgeColor: '#ef4444',
      target: isCzech ? 'PRO & UNLIMITED uživatelé' : 'PRO & UNLIMITED users',
      trigger: isCzech
        ? 'Období předplatného vypršelo (current_period_end < now) nebo selhala automatická obnova'
        : 'Subscription period ended (current_period_end < now) or automatic renewal failed',
      componentName: 'SubscriptionExpiredModal.jsx',
      actions: isCzech
        ? ['Obnovit předplatné (směruje na /upgrade)', 'Odložit o 1 hodinu (uloží timestamp)']
        : ['Renew subscription (redirects to /upgrade)', 'Remind me in 1 hour (stores timestamp)'],
      description: isCzech
        ? 'Zobrazuje se přes celou obrazovku při přihlášení do aplikace, pokud má uživatel neaktivní/prošlé předplatné. Design sjednocen s Upgrade stránkou (hvězdná záře, Neue Montreal, zaoblená tlačítka).'
        : 'Shown full-screen upon login if paid period lapsed. Styled identically to the Upgrade page (stars glow, Neue Montreal, pill buttons).',
    },
    {
      id: 'user_details',
      name: isCzech ? 'Objednávka GoPay (Jméno uživatele)' : 'Checkout Details (Name Prompt)',
      badge: 'UPGRADE',
      badgeColor: '#3b82f6',
      target: isCzech ? 'Všichni uživatelé při upgradu' : 'All users at upgrade',
      trigger: isCzech
        ? 'Kliknutí na tlačítko "Přejít na PRO / Unlimited" na stránce /upgrade před přesměrováním'
        : 'Clicking "Get Pro / Go Unlimited" on /upgrade before redirecting to payment gateway',
      componentName: 'UserDetailsModal.jsx',
      actions: isCzech
        ? ['Odeslat formulář (přesměrování na platební bránu)', 'Zavřít modal (×)']
        : ['Submit form (redirect to gateway)', 'Close modal (×)'],
      description: isCzech
        ? 'Formulář sbírající křestní jméno, příjmení a jméno producenta. Vyžadováno GoPay platební bránou.'
        : 'Collects first name, last name, and optional producer name required for payment processing.',
    },
    {
      id: 'insufficient_credits',
      name: isCzech ? 'Nedostatek kreditů' : 'Insufficient Credits',
      badge: 'LIMIT',
      badgeColor: '#a78bfa',
      target: isCzech ? 'FREE i PRO uživatelé' : 'FREE and PRO users',
      trigger: isCzech
        ? 'Pokus o vygenerování videa, pokud uživateli zbývá méně kreditů, než je potřeba pro dávku'
        : 'Attempting to generate a video when remaining credits are lower than required batch count',
      componentName: 'InsufficientCreditsModal.jsx',
      actions: isCzech
        ? ['Přejít na PRO (199 Kč/měs)', 'Získat Neomezený (399 Kč/měs)', 'Zavřít']
        : ['Upgrade to PRO ($9.99/mo)', 'Go Unlimited ($19.99/mo)', 'Close'],
      description: isCzech
        ? 'Nahrazuje zastaralé hlášky moderním dialogem se skleněným gradientem a přímým odkazem na upgrade.'
        : 'Replaces raw alerts with a sleek glassmorphic modal offering one-click upgrades.',
    },
    {
      id: 'referral_panel',
      name: isCzech ? 'Doporučovací program' : 'Referral Program',
      badge: 'GROWTH',
      badgeColor: '#10b981',
      target: isCzech ? 'Všichni přihlášení uživatelé' : 'All logged-in users',
      trigger: isCzech
        ? 'Kliknutí na "Pozvat přátele" v horní navigaci aplikace'
        : 'Clicking "Invite friends" in the top navbar',
      componentName: 'ReferralPanel.jsx',
      actions: isCzech
        ? ['Kopírovat unikátní referral link', 'Zavřít panel']
        : ['Copy unique referral link', 'Close panel'],
      description: isCzech
        ? 'Panel pro sdílení referral linku. Zobrazuje počet doporučených přátel a odměnu +1 kredit.'
        : 'Referral sharing panel. Displays referred count and +1 credit bonus explanation.',
    },
    {
      id: 'screen_size_warning',
      name: isCzech ? 'Optimalizace pro Desktop' : 'Desktop Optimization',
      badge: 'RESPONSIVE',
      badgeColor: '#f59e0b',
      target: isCzech ? 'Mobilní návštěvníci (< 1280×800)' : 'Mobile visitors (< 1280×800)',
      trigger: isCzech
        ? 'Otevření aplikace na zařízení s malým rozlišením'
        : 'Opening the generator on low resolution screens',
      componentName: 'ScreenSizeWarning.jsx',
      actions: isCzech
        ? ['Pokračovat i tak (uloží volbu do localStorage)']
        : ['Continue anyway (saves preference to localStorage)'],
      description: isCzech
        ? 'Upozornění v designu Upgrade stránky informující o doporučeném rozlišení pro drag-and-drop nástroje.'
        : 'Warning informing mobile visitors that desktop provides the optimal drag-and-drop workflow.',
    },
  ];

  const currentModal = MODALS.find(m => m.id === selectedModalId) || MODALS[0];

  // Helper mock user for SubscriptionExpiredModal
  const mockSubUser = {
    id: 999,
    first_name: subUserName,
    role: subPlan,
    subscription: {
      plan: subPlan,
      is_annual: subIsAnnual,
      status: 'past_due',
      current_period_end: new Date(subExpirePreset).toISOString(),
    },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      {/* ── Header with Language Toggle ── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: NM, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: '#fff' }}>
            Uživatelské modaly & dialogy
          </h2>
          <p style={{ fontFamily: NM, fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '6px 0 0', lineHeight: 1.6 }}>
            Všechny modaly nyní striktně sdílejí jednotný designový jazyk stránky <strong>Upgrade</strong> (tmavý gradient, hvězdná záře, Neue Montreal a zaoblená tlačítka).
          </p>
        </div>

        {/* Global Language Switcher for Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
            borderRadius: 9999, padding: 4
          }}>
            <button
              onClick={() => setPreviewLang('cs')}
              style={{
                fontFamily: NM, fontWeight: 700, fontSize: 11, letterSpacing: '0.04em',
                padding: '7px 16px', borderRadius: 9999, cursor: 'pointer', border: 'none',
                background: isCzech ? '#fff' : 'transparent',
                color: isCzech ? '#000' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
              }}
            >
              🇨🇿 Čeština
            </button>
            <button
              onClick={() => setPreviewLang('en')}
              style={{
                fontFamily: NM, fontWeight: 700, fontSize: 11, letterSpacing: '0.04em',
                padding: '7px 16px', borderRadius: 9999, cursor: 'pointer', border: 'none',
                background: !isCzech ? '#fff' : 'transparent',
                color: !isCzech ? '#000' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
              }}
            >
              🇬🇧 English
            </button>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 9999,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
            <span style={{ fontFamily: NM, fontSize: 11, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.04em' }}>
              {MODALS.length} sjednocených modalů
            </span>
          </div>
        </div>
      </div>

      {/* ── Modal Selector Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 32 }}>
        {MODALS.map(m => {
          const active = m.id === selectedModalId;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedModalId(m.id)}
              style={{
                background: active ? 'linear-gradient(to bottom, rgba(8,8,12,0.98), rgba(4,14,50,0.98))' : CARD,
                border: `1px solid ${active ? 'rgba(255,255,255,0.25)' : BORDER}`,
                borderRadius: 16,
                padding: '16px 18px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 104,
                boxShadow: active ? '0 10px 30px -10px rgba(59,130,246,0.3)' : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = BORDER; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{
                  fontFamily: NM, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 9999,
                  background: `${m.badgeColor}15`, border: `1px solid ${m.badgeColor}40`, color: m.badgeColor
                }}>
                  {m.badge}
                </span>
                <span style={{ fontFamily: NM, fontSize: 11, color: active ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                  {active ? '● Aktivní' : 'Náhled →'}
                </span>
              </div>
              <div style={{ fontFamily: NM, fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {m.name}
              </div>
              <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                {m.target}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Main Interactive Split: Sandbox Controls & Canvas Preview ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: Control Sandbox & Specs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Sandbox Controls Card */}
          <div style={{
            background: 'linear-gradient(to bottom, rgba(8,8,12,0.98), rgba(4,14,50,0.98))',
            border: `1px solid ${BORDER}`, borderRadius: 20, padding: 22
          }}>
            <div style={{ fontFamily: NM, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
              🎛 Parametry testovacího prostředí
            </div>

            {/* Custom controls based on active modal */}
            {selectedModalId === 'subscription_expired' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Tarif předplatného
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['pro', 'unlimited'].map(p => (
                      <button
                        key={p}
                        onClick={() => setSubPlan(p)}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                          fontFamily: NM, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                          background: subPlan === p ? '#fff' : 'rgba(255,255,255,0.06)',
                          color: subPlan === p ? '#000' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {p === 'pro' ? (isCzech ? 'PRO (199 Kč)' : 'PRO ($9.99)') : (isCzech ? 'UNLIMITED (399 Kč)' : 'UNLIMITED ($19.99)')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Fakturační období
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { label: isCzech ? 'Měsíční' : 'Monthly', val: false },
                      { label: isCzech ? 'Roční' : 'Annual', val: true },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setSubIsAnnual(opt.val)}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                          fontFamily: NM, fontSize: 11, fontWeight: 700,
                          background: subIsAnnual === opt.val ? '#fff' : 'rgba(255,255,255,0.06)',
                          color: subIsAnnual === opt.val ? '#000' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Křestní jméno
                  </label>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {['Sentiv', 'Pavel', 'Matyáš'].map(name => (
                      <button
                        key={name}
                        onClick={() => setSubUserName(name)}
                        style={{
                          flex: 1, padding: '6px 8px', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer', fontFamily: NM, fontSize: 10, fontWeight: 600,
                          background: subUserName === name ? 'rgba(255,255,255,0.15)' : 'transparent',
                          color: '#fff',
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={subUserName}
                    onChange={e => setSubUserName(e.target.value)}
                    placeholder="Vlastní jméno..."
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                      color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Datum vypršení
                  </label>
                  <input
                    type="date"
                    value={subExpirePreset}
                    onChange={e => setSubExpirePreset(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                      color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {selectedModalId === 'user_details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Cílový tarif
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['pro', 'unlimited'].map(p => (
                      <button
                        key={p}
                        onClick={() => setDetailsPlan(p)}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                          fontFamily: NM, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                          background: detailsPlan === p ? '#fff' : 'rgba(255,255,255,0.06)',
                          color: detailsPlan === p ? '#000' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {p === 'pro' ? 'PRO' : 'UNLIMITED'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Předvyplněné Jméno a Příjmení
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <input
                      type="text"
                      value={detailsFirstName}
                      onChange={e => setDetailsFirstName(e.target.value)}
                      placeholder="Jméno"
                      style={{
                        padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${BORDER}`, color: '#fff', fontSize: 11, outline: 'none'
                      }}
                    />
                    <input
                      type="text"
                      value={detailsLastName}
                      onChange={e => setDetailsLastName(e.target.value)}
                      placeholder="Příjmení"
                      style={{
                        padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${BORDER}`, color: '#fff', fontSize: 11, outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Jméno producenta
                  </label>
                  <input
                    type="text"
                    value={detailsProducerName}
                    onChange={e => setDetailsProducerName(e.target.value)}
                    placeholder="Např. DJ Beats"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${BORDER}`, color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {selectedModalId === 'insufficient_credits' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Role uživatele
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { label: isCzech ? 'FREE (5 kr)' : 'FREE (5 cr)', val: false },
                      { label: isCzech ? 'PRO (31 kr)' : 'PRO (31 cr)', val: true },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setCredIsPro(opt.val)}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                          fontFamily: NM, fontSize: 11, fontWeight: 700,
                          background: credIsPro === opt.val ? '#fff' : 'rgba(255,255,255,0.06)',
                          color: credIsPro === opt.val ? '#000' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                      Potřebné kredity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={credNeeded}
                      onChange={e => setCredNeeded(parseInt(e.target.value, 10) || 1)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${BORDER}`, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                      Zbývající kredity
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={credRemaining}
                      onChange={e => setCredRemaining(parseInt(e.target.value, 10) || 0)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${BORDER}`, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Launch Fullscreen Button matching UpgradePage */}
            <button
              onClick={() => setActiveFullscreenModal(selectedModalId)}
              style={{
                marginTop: 22, width: '100%', height: 46, borderRadius: 9999, border: 'none', cursor: 'pointer',
                background: '#fff', color: '#000', fontFamily: NM, fontWeight: 700, fontSize: 12, letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span>🔍</span>
              <span>{isCzech ? 'Spustit živý 1:1 náhled' : 'Launch live 1:1 preview'}</span>
            </button>
          </div>

          {/* Technical Specs Card */}
          <div style={{
            background: 'linear-gradient(to bottom, rgba(8,8,12,0.98), rgba(4,14,50,0.98))',
            border: `1px solid ${BORDER}`, borderRadius: 20, padding: 22
          }}>
            <div style={{ fontFamily: NM, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
              📋 {isCzech ? 'Technická specifikace' : 'Technical Specs'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  Soubor komponenty
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#93c5fd', marginTop: 2 }}>
                  src/components/{currentModal.componentName}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  Aktivační podmínka (Trigger)
                </div>
                <div style={{ fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, lineHeight: 1.5 }}>
                  {currentModal.trigger}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  Jazykové verze
                </div>
                <div style={{ fontFamily: NM, fontSize: 11, color: '#34d399', marginTop: 2 }}>
                  ✓ 🇨🇿 Čeština &nbsp;•&nbsp; ✓ 🇬🇧 English
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT: Device Frame & Scaled Preview Stage ── */}
        <div style={{
          background: '#000', border: `1px solid ${BORDER}`,
          borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px -10px rgba(0,0,0,0.85)'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 18px', borderBottom: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: 10, fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                TypeBeatz UI Simulator — {currentModal.name} ({isCzech ? 'Čeština' : 'English'})
              </span>
            </div>

            <button
              onClick={() => setActiveFullscreenModal(selectedModalId)}
              style={{
                background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`,
                borderRadius: 9999, padding: '4px 12px', color: '#fff', cursor: 'pointer',
                fontFamily: NM, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em'
              }}
            >
              1:1 ↗
            </button>
          </div>

          {/* Canvas container with UpgradePage ambient background */}
          <div style={{
            position: 'relative', minHeight: 620, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#000',
            padding: 24
          }}>
            {/* Ambient stars backdrop from UpgradePage */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${starsBg})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: 0.25, pointerEvents: 'none',
              maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 30%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 30%, transparent 80%)'
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 450, height: 450, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
              filter: 'blur(50px)', pointerEvents: 'none'
            }} />

            {/* Embedded Live Component View */}
            <div style={{
              position: 'relative', width: '100%', maxWidth: 480, zIndex: 1,
              transform: 'scale(0.95)', transformOrigin: 'center center'
            }}>
              {selectedModalId === 'subscription_expired' && (
                <SubscriptionExpiredModal
                  user={mockSubUser}
                  lang={previewLang}
                  onDismiss={() => alert(isCzech ? 'Odloženo na 1 hodinu' : 'Reminded in 1 hour')}
                />
              )}

              {selectedModalId === 'user_details' && (
                <UserDetailsModal
                  plan={detailsPlan}
                  interval={detailsInterval}
                  lang={previewLang}
                  initialValues={{
                    firstName: detailsFirstName,
                    lastName: detailsLastName,
                    producerName: detailsProducerName
                  }}
                  onClose={() => alert(isCzech ? 'Zavřeno' : 'Closed')}
                  onSubmit={(vals) => alert(`Submit: ${JSON.stringify(vals)}`)}
                />
              )}

              {selectedModalId === 'insufficient_credits' && (
                <InsufficientCreditsModal
                  needed={credNeeded}
                  remaining={credRemaining}
                  isPro={credIsPro}
                  lang={previewLang}
                  onClose={() => alert(isCzech ? 'Zavřeno' : 'Closed')}
                  onUpgradePro={() => alert('Upgrade PRO')}
                  onUpgradeUnlimited={() => alert('Upgrade Unlimited')}
                />
              )}

              {selectedModalId === 'referral_panel' && (
                <ReferralPanel
                  lang={previewLang}
                  mockStats={{ code: 'VIP808', uses: 3 }}
                  onClose={() => alert(isCzech ? 'Zavřeno' : 'Closed')}
                />
              )}

              {selectedModalId === 'screen_size_warning' && (
                <ScreenSizeWarning
                  lang={previewLang}
                  forceShow={true}
                  onDismiss={() => alert(isCzech ? 'Pokračovat i tak' : 'Continue anyway')}
                />
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── FULLSCREEN INTERACTIVE PREVIEW OVERLAY ── */}
      <AnimatePresence>
        {activeFullscreenModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999999 }}>
            {/* Top Admin Return Bar */}
            <div style={{
              position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000001, display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(8,8,12,0.95)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 9999, padding: '8px 18px', backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
              <span style={{ fontFamily: NM, fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                {MODALS.find(m => m.id === activeFullscreenModal)?.name} ({isCzech ? '🇨🇿 CS' : '🇬🇧 EN'})
              </span>
              <button
                onClick={() => setActiveFullscreenModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 9999, padding: '4px 12px', color: '#fff', cursor: 'pointer',
                  fontFamily: NM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  marginLeft: 8, transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                ✕ Zavřít náhled
              </button>
            </div>

            {/* Render chosen modal in full screen */}
            {activeFullscreenModal === 'subscription_expired' && (
              <SubscriptionExpiredModal
                user={mockSubUser}
                lang={previewLang}
                onDismiss={() => setActiveFullscreenModal(null)}
              />
            )}

            {activeFullscreenModal === 'user_details' && (
              <UserDetailsModal
                plan={detailsPlan}
                interval={detailsInterval}
                lang={previewLang}
                initialValues={{
                  firstName: detailsFirstName,
                  lastName: detailsLastName,
                  producerName: detailsProducerName
                }}
                onClose={() => setActiveFullscreenModal(null)}
                onSubmit={(vals) => {
                  alert(`Odesláno: ${JSON.stringify(vals)}`);
                  setActiveFullscreenModal(null);
                }}
              />
            )}

            {activeFullscreenModal === 'insufficient_credits' && (
              <InsufficientCreditsModal
                needed={credNeeded}
                remaining={credRemaining}
                isPro={credIsPro}
                lang={previewLang}
                onClose={() => setActiveFullscreenModal(null)}
                onUpgradePro={() => {
                  alert('Upgrade PRO');
                  setActiveFullscreenModal(null);
                }}
                onUpgradeUnlimited={() => {
                  alert('Upgrade Unlimited');
                  setActiveFullscreenModal(null);
                }}
              />
            )}

            {activeFullscreenModal === 'referral_panel' && (
              <ReferralPanel
                lang={previewLang}
                mockStats={{ code: 'VIP808', uses: 3 }}
                onClose={() => setActiveFullscreenModal(null)}
              />
            )}

            {activeFullscreenModal === 'screen_size_warning' && (
              <ScreenSizeWarning
                lang={previewLang}
                forceShow={true}
                onDismiss={() => setActiveFullscreenModal(null)}
              />
            )}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
