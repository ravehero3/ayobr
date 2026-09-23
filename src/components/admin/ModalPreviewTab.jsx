import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SubscriptionExpiredModal from '../SubscriptionExpiredModal';
import UserDetailsModal from '../UserDetailsModal';
import InsufficientCreditsModal from '../InsufficientCreditsModal';
import ReferralPanel from '../ReferralPanel';

const NM = "'Neue Montreal', 'Inter', sans-serif";
const BLUE = '#3b82f6';
const BLUE2 = '#0ea5e9';
const CARD = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.08)';

export default function ModalPreviewTab() {
  const [selectedModalId, setSelectedModalId] = useState('subscription_expired');
  const [activeFullscreenModal, setActiveFullscreenModal] = useState(null);

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
      name: 'Vypršené předplatné',
      badge: 'KRITICKÉ',
      badgeColor: '#ef4444',
      target: 'PRO & UNLIMITED uživatelé',
      trigger: 'Období předplatného vypršelo (current_period_end < now) nebo selhala automatická obnova GoPay',
      componentName: 'SubscriptionExpiredModal.jsx',
      actions: ['Obnovit předplatné (přesměruje na /upgrade)', 'Odložit o 1 hodinu (uloží timestamp do localStorage)'],
      description: 'Zobrazuje se přes celou obrazovku při přihlášení do aplikace, pokud má uživatel neaktivní/prošlé předplatné. Dynamicky zobrazuje správnou cenu a interval (měsíční vs roční).',
    },
    {
      id: 'user_details',
      name: 'Objednávkový formulář GoPay',
      badge: 'UPGRADE',
      badgeColor: '#3b82f6',
      target: 'Všichni uživatelé při upgradu',
      trigger: 'Kliknutí na tlačítko "Přejít na PRO / Unlimited" na stránce /upgrade před přesměrováním do platební brány',
      componentName: 'UserDetailsModal.jsx',
      actions: ['Odeslat formulář (přesměrování na GoPay)', 'Zavřít modal (křížek / kliknutí mimo)'],
      description: 'Vyžaduje vyplnění křestního jména, příjmení a volitelného jména producenta pro GoPay platební bránu.',
    },
    {
      id: 'insufficient_credits',
      name: 'Nedostatek kreditů',
      badge: 'LIMIT',
      badgeColor: '#a78bfa',
      target: 'FREE i PRO uživatelé',
      trigger: 'Kliknutí na generování videa, pokud uživateli zbývá méně kreditů, než je potřeba pro zvolenou dávku',
      componentName: 'InsufficientCreditsModal.jsx',
      actions: ['Přejít na PRO (199 Kč/měs)', 'Získat Unlimited (399 Kč/měs)', 'Zavřít'],
      description: 'Elegantní tmavé okno informující o vyčerpání limitu kreditů s přímými možnostmi upgradu na vyšší plán.',
    },
    {
      id: 'referral_panel',
      name: 'Doporučovací program',
      badge: 'GROWTH',
      badgeColor: '#10b981',
      target: 'Všichni přihlášení uživatelé',
      trigger: 'Kliknutí na "Pozvat přátele" v hlavní navigaci aplikace',
      componentName: 'ReferralPanel.jsx',
      actions: ['Kopírovat unikátní referral link', 'Zavřít panel'],
      description: 'Zobrazuje referral odkaz a statistiky pozvaných uživatelů (+1 bonusový kredit pro zvacího i nového uživatele).',
    },
    {
      id: 'screen_size_warning',
      name: 'Optimalizace pro Desktop',
      badge: 'RESPONSIVE',
      badgeColor: '#f59e0b',
      target: 'Mobilní návštěvníci (< 1280x800)',
      trigger: 'Otevření aplikace na zařízení s malým rozlišením',
      componentName: 'ScreenSizeWarning.jsx',
      actions: ['Pokračovat i tak (uloží dočasnou volbu)'],
      description: 'Informuje mobilní návštěvníky, že TypeBeatz je nejlepší používat na desktopu z důvodu drag-and-drop a renderovacích nástrojů.',
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
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: NM, fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: '#fff' }}>
              Uživatelské modaly & dialogy
            </h2>
            <p style={{ fontFamily: NM, fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '6px 0 0', lineHeight: 1.6 }}>
              Interaktivní sandbox a přehled všech dialogových oken, která se zobrazují uživatelům podle stavu jejich předplatného, plateb a kreditů.
            </p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 9999,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
            <span style={{ fontFamily: NM, fontSize: 11, fontWeight: 800, color: '#93c5fd', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {MODALS.length} aktivních modalů
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
                background: active ? 'rgba(59,130,246,0.12)' : CARD,
                border: `1px solid ${active ? BLUE : BORDER}`,
                borderRadius: 14,
                padding: '16px 18px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 104,
                boxShadow: active ? `0 4px 20px ${BLUE}25` : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = BORDER; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{
                  fontFamily: NM, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 9999,
                  background: `${m.badgeColor}15`, border: `1px solid ${m.badgeColor}40`, color: m.badgeColor
                }}>
                  {m.badge}
                </span>
                <span style={{ fontFamily: NM, fontSize: 11, color: active ? BLUE : 'rgba(255,255,255,0.2)' }}>
                  {active ? '● Vybráno' : 'Zobrazit →'}
                </span>
              </div>
              <div style={{ fontFamily: NM, fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: Control Sandbox & Specs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Sandbox Controls Card */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: NM, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                🎛 Interaktivní nastavení náhledu
              </div>
            </div>

            {/* Custom controls based on active modal */}
            {selectedModalId === 'subscription_expired' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Předplatitelský plán
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['pro', 'unlimited'].map(p => (
                      <button
                        key={p}
                        onClick={() => setSubPlan(p)}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontFamily: NM, fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                          background: subPlan === p ? '#fff' : 'rgba(255,255,255,0.06)',
                          color: subPlan === p ? '#000' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {p === 'pro' ? 'PRO (199 Kč)' : 'UNLIMITED (399 Kč)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Fakturační období
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { label: 'Měsíční', val: false },
                      { label: 'Roční (12 měs)', val: true },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setSubIsAnnual(opt.val)}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontFamily: NM, fontSize: 11, fontWeight: 800,
                          background: subIsAnnual === opt.val ? BLUE : 'rgba(255,255,255,0.06)',
                          color: '#fff',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Uživatel (Křestní jméno)
                  </label>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {['Sentiv', 'Pavel', 'Matyáš'].map(name => (
                      <button
                        key={name}
                        onClick={() => setSubUserName(name)}
                        style={{
                          flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer', fontFamily: NM, fontSize: 10, fontWeight: 700,
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
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                      color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Datum vypršení
                  </label>
                  <input
                    type="date"
                    value={subExpirePreset}
                    onChange={e => setSubExpirePreset(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
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
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Cílový tarif
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['pro', 'unlimited'].map(p => (
                      <button
                        key={p}
                        onClick={() => setDetailsPlan(p)}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontFamily: NM, fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
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
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Předvyplněné Jméno a Příjmení
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <input
                      type="text"
                      value={detailsFirstName}
                      onChange={e => setDetailsFirstName(e.target.value)}
                      placeholder="Jméno"
                      style={{
                        padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${BORDER}`, color: '#fff', fontSize: 11, outline: 'none'
                      }}
                    />
                    <input
                      type="text"
                      value={detailsLastName}
                      onChange={e => setDetailsLastName(e.target.value)}
                      placeholder="Příjmení"
                      style={{
                        padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${BORDER}`, color: '#fff', fontSize: 11, outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Jméno producenta
                  </label>
                  <input
                    type="text"
                    value={detailsProducerName}
                    onChange={e => setDetailsProducerName(e.target.value)}
                    placeholder="Např. DJ Beats"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${BORDER}`, color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {selectedModalId === 'insufficient_credits' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Role uživatele
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { label: 'FREE (5 kr/měs)', val: false },
                      { label: 'PRO (31 kr/měs)', val: true },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setCredIsPro(opt.val)}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontFamily: NM, fontSize: 11, fontWeight: 800,
                          background: credIsPro === opt.val ? '#a78bfa' : 'rgba(255,255,255,0.06)',
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
                    <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                      Potřebné kredity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={credNeeded}
                      onChange={e => setCredNeeded(parseInt(e.target.value, 10) || 1)}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${BORDER}`, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                      Zbývající kredity
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={credRemaining}
                      onChange={e => setCredRemaining(parseInt(e.target.value, 10) || 0)}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${BORDER}`, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedModalId === 'referral_panel' && (
              <div style={{ fontFamily: NM, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Panel využívá přímé napojení na <code>/api/user/referral</code>. V živém náhledu můžete otestovat kopírování odkazu i zobrazení přidaných kreditů.
              </div>
            )}

            {selectedModalId === 'screen_size_warning' && (
              <div style={{ fontFamily: NM, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Upozornění se v ostrém provozu zobrazuje uživatelům s viewportem menším než 1280×800 pixelů.
              </div>
            )}

            {/* Launch Fullscreen Button */}
            <button
              onClick={() => setActiveFullscreenModal(selectedModalId)}
              style={{
                marginTop: 20, width: '100%', height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
                color: '#fff', fontFamily: NM, fontWeight: 900, fontSize: 11, letterSpacing: '0.08em',
                textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>🔍</span>
              <span>Spustit živý fullscreen náhled</span>
            </button>
          </div>

          {/* Technical Specs Card */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22 }}>
            <div style={{ fontFamily: NM, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
              📋 Technická specifikace
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Soubor komponenty
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#93c5fd', marginTop: 2 }}>
                  src/components/{currentModal.componentName}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Aktivační podmínka (Trigger)
                </div>
                <div style={{ fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, lineHeight: 1.5 }}>
                  {currentModal.trigger}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Dostupné uživatelské akce
                </div>
                <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  {currentModal.actions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT: Device Frame & Scaled Preview Stage ── */}
        <div style={{
          background: 'rgba(10,12,18,0.95)', border: `1px solid ${BORDER}`,
          borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px -10px rgba(0,0,0,0.7)'
        }}>
          {/* Mock Browser/Device Header */}
          <div style={{
            padding: '12px 18px', borderBottom: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: 10, fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                TypeBeatz UI Simulator — {currentModal.name}
              </span>
            </div>

            <button
              onClick={() => setActiveFullscreenModal(selectedModalId)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                borderRadius: 8, padding: '4px 10px', color: '#fff', cursor: 'pointer',
                fontFamily: NM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase'
              }}
            >
              Otevřít 1:1 ↗
            </button>
          </div>

          {/* Canvas container with scaled interactive render */}
          <div style={{
            position: 'relative', minHeight: 640, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at center, rgba(30,58,138,0.12) 0%, rgba(0,0,0,0.98) 75%)',
            padding: 24
          }}>
            {/* Ambient simulated grid background */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }} />

            {/* Embedded Live Component View */}
            <div style={{
              position: 'relative', width: '100%', maxWidth: 520, zIndex: 1,
              transform: 'scale(0.96)', transformOrigin: 'center center'
            }}>
              {selectedModalId === 'subscription_expired' && (
                <div style={{ position: 'relative' }}>
                  <SubscriptionExpiredModal
                    user={mockSubUser}
                    onDismiss={() => alert('Odloženo na 1 hodinu (simulace)')}
                  />
                </div>
              )}

              {selectedModalId === 'user_details' && (
                <div style={{ position: 'relative' }}>
                  <UserDetailsModal
                    plan={detailsPlan}
                    interval={detailsInterval}
                    initialValues={{
                      firstName: detailsFirstName,
                      lastName: detailsLastName,
                      producerName: detailsProducerName
                    }}
                    onClose={() => alert('Zavřeno')}
                    onSubmit={(vals) => alert(`Odesláno na GoPay: ${JSON.stringify(vals)}`)}
                  />
                </div>
              )}

              {selectedModalId === 'insufficient_credits' && (
                <div style={{ position: 'relative' }}>
                  <InsufficientCreditsModal
                    needed={credNeeded}
                    remaining={credRemaining}
                    isPro={credIsPro}
                    onClose={() => alert('Zavřeno')}
                    onUpgradePro={() => alert('Přesměrování na PRO upgrade')}
                    onUpgradeUnlimited={() => alert('Přesměrování na Unlimited upgrade')}
                  />
                </div>
              )}

              {selectedModalId === 'referral_panel' && (
                <div style={{ position: 'relative' }}>
                  <ReferralPanel onClose={() => alert('Zavřeno')} />
                </div>
              )}

              {selectedModalId === 'screen_size_warning' && (
                <div style={{
                  background: '#000', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
                }}>
                  <div style={{ color: '#eab308', marginBottom: 18 }}>
                    <svg style={{ width: 44, height: 44, margin: '0 auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 style={{ fontFamily: NM, fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                    Best on Desktop
                  </h2>
                  <p style={{ fontFamily: NM, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 24 }}>
                    TypeBeatz is a powerful batch video generator best experienced on a larger screen. You can continue on mobile, but some features like drag-and-drop may be limited.
                  </p>
                  <button
                    onClick={() => alert('Pokračovat (simulace)')}
                    style={{
                      width: '100%', height: 44, borderRadius: 12,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontFamily: NM, fontWeight: 700, fontSize: 13, cursor: 'pointer'
                    }}
                  >
                    Continue anyway
                  </button>
                </div>
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
              background: 'rgba(15,20,35,0.92)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 9999, padding: '8px 18px', backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
              <span style={{ fontFamily: NM, fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Živý náhled: {MODALS.find(m => m.id === activeFullscreenModal)?.name}
              </span>
              <button
                onClick={() => setActiveFullscreenModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 9999, padding: '4px 12px', color: '#fff', cursor: 'pointer',
                  fontFamily: NM, fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginLeft: 8, transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                ✕ Ukončit náhled (Zavřít)
              </button>
            </div>

            {/* Render chosen modal in full screen */}
            {activeFullscreenModal === 'subscription_expired' && (
              <SubscriptionExpiredModal
                user={mockSubUser}
                onDismiss={() => setActiveFullscreenModal(null)}
              />
            )}

            {activeFullscreenModal === 'user_details' && (
              <UserDetailsModal
                plan={detailsPlan}
                interval={detailsInterval}
                initialValues={{
                  firstName: detailsFirstName,
                  lastName: detailsLastName,
                  producerName: detailsProducerName
                }}
                onClose={() => setActiveFullscreenModal(null)}
                onSubmit={(vals) => {
                  alert(`Odesláno na GoPay: ${JSON.stringify(vals)}`);
                  setActiveFullscreenModal(null);
                }}
              />
            )}

            {activeFullscreenModal === 'insufficient_credits' && (
              <InsufficientCreditsModal
                needed={credNeeded}
                remaining={credRemaining}
                isPro={credIsPro}
                onClose={() => setActiveFullscreenModal(null)}
                onUpgradePro={() => {
                  alert('Kliknuto na Upgrade PRO');
                  setActiveFullscreenModal(null);
                }}
                onUpgradeUnlimited={() => {
                  alert('Kliknuto na Upgrade Unlimited');
                  setActiveFullscreenModal(null);
                }}
              />
            )}

            {activeFullscreenModal === 'referral_panel' && (
              <ReferralPanel onClose={() => setActiveFullscreenModal(null)} />
            )}

            {activeFullscreenModal === 'screen_size_warning' && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000000
              }}>
                <div style={{
                  background: '#000', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, padding: 36, maxWidth: 440, textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.9)'
                }}>
                  <div style={{ color: '#eab308', marginBottom: 18 }}>
                    <svg style={{ width: 48, height: 48, margin: '0 auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 style={{ fontFamily: NM, fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Best on Desktop</h2>
                  <p style={{ fontFamily: NM, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 24 }}>
                    TypeBeatz is a powerful batch video generator best experienced on a larger screen. You can continue on mobile, but some features like drag-and-drop may be limited.
                  </p>
                  <button
                    onClick={() => setActiveFullscreenModal(null)}
                    style={{
                      width: '100%', height: 46, borderRadius: 12,
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff', fontFamily: NM, fontWeight: 700, fontSize: 13, cursor: 'pointer'
                    }}
                  >
                    Continue anyway
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
