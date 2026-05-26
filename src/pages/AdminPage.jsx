import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const API = '/api/admin';
const NM = "'Neue Montreal', 'Inter', sans-serif";

/* ── Design tokens matching pricing page ─────────────────── */
const BG   = 'linear-gradient(160deg, #050a13 0%, #07111e 60%, #050e1a 100%)';
const CARD = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.08)';
const BLUE  = '#3b82f6';
const BLUE2 = '#0ea5e9';

/* ── Small helpers ───────────────────────────────────────── */
function Badge({ role }) {
  const map = {
    admin:     '#a78bfa',
    unlimited: '#60a5fa',
    pro:       '#34d399',
    free:      'rgba(255,255,255,0.3)',
  };
  return (
    <span style={{ fontFamily: NM, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
      textTransform: 'uppercase', padding: '3px 8px', borderRadius: 9999,
      border: `1px solid ${map[role] || map.free}40`, color: map[role] || map.free,
      background: `${map[role] || map.free}10` }}>
      {role}
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px 28px',
      borderLeft: `3px solid ${accent || BLUE}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%',
        background: `${accent || BLUE}`, opacity: 0.06, filter: 'blur(16px)' }} />
      <div style={{ fontFamily: NM, fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

/* ── SVG Line Chart ──────────────────────────────────────── */
function SignupChart({ daily }) {
  const W = 800, H = 160, PAD = { top: 16, right: 16, bottom: 28, left: 36 };

  // Build 30-day series
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });

  const byDay = {};
  (daily || []).forEach(r => { byDay[r.day?.slice(0, 10)] = parseInt(r.count, 10); });
  const values = days.map(d => byDay[d] || 0);
  const maxVal = Math.max(...values, 1);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const step = innerW / (values.length - 1);

  const px = (i) => PAD.left + i * step;
  const py = (v) => PAD.top + innerH - (v / maxVal) * innerH;

  const linePath = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
  const areaPath = `${linePath} L ${px(values.length - 1)} ${PAD.top + innerH} L ${px(0)} ${PAD.top + innerH} Z`;

  // Show every 5th label
  const labelIndices = [0, 4, 9, 14, 19, 24, 29];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.25" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={BLUE} />
          <stop offset="100%" stopColor={BLUE2} />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={PAD.left} x2={W - PAD.right}
          y1={PAD.top + innerH * (1 - f)} y2={PAD.top + innerH * (1 - f)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#chartArea)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="url(#chartLine)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Data points */}
      {values.map((v, i) => v > 0 && (
        <circle key={i} cx={px(i)} cy={py(v)} r="3" fill={BLUE} />
      ))}
      {/* X-axis labels */}
      {labelIndices.map(i => (
        <text key={i} x={px(i)} y={H - 4} textAnchor="middle"
          style={{ fontFamily: NM, fontSize: 8, fill: 'rgba(255,255,255,0.3)' }}>
          {days[i]?.slice(5)}
        </text>
      ))}
      {/* Y-axis label */}
      <text x={PAD.left - 8} y={PAD.top + innerH / 2} textAnchor="middle"
        transform={`rotate(-90, ${PAD.left - 8}, ${PAD.top + innerH / 2})`}
        style={{ fontFamily: NM, fontSize: 8, fill: 'rgba(255,255,255,0.25)' }}>
        Registrace
      </text>
    </svg>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Správce');

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [flags, setFlags] = useState([]);
  const [emails, setEmails] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [previewTpl, setPreviewTpl] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) navigate('/app');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') loadAll();
  }, [user]);

  async function loadAll() {
    setBusy(true);
    try {
      const [sRes, uRes, fRes, eRes, tRes] = await Promise.all([
        fetch(`${API}/stats`,           { credentials: 'include' }),
        fetch(`${API}/users`,           { credentials: 'include' }),
        fetch(`${API}/features`,        { credentials: 'include' }),
        fetch(`${API}/emails`,          { credentials: 'include' }),
        fetch(`${API}/email-templates`, { credentials: 'include' }),
      ]);
      setStats(await sRes.json());
      setUsers(await uRes.json());
      setFlags(await fRes.json());
      setEmails(await eRes.json());
      setTemplates(await tRes.json());
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3500); }

  async function changeRole(userId, role) {
    const res = await fetch(`${API}/users/${userId}/role`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      flash(`Role changed to ${role}`);
    }
  }

  async function toggleOptIn(userId, current) {
    const res = await fetch(`${API}/users/${userId}/email-opt-in`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ optIn: !current }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, email_opt_in: !current } : u));
      setEmails(prev =>
        !current
          ? prev
          : prev.filter(e => e.id !== userId)
      );
    }
  }

  async function toggleFlag(featureKey, plan, enabled) {
    const res = await fetch(`${API}/features`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ featureKey, plan, enabled }),
    });
    if (res.ok) setFlags(prev => prev.map(f =>
      f.feature_key === featureKey && f.plan === plan ? { ...f, enabled } : f
    ));
  }

  async function resetCredits() {
    const res = await fetch(`${API}/reset-credits`, { method: 'POST', credentials: 'include' });
    if (res.ok) { const d = await res.json(); flash(d.message); loadAll(); }
  }

  const filteredUsers = users.filter(u => {
    if (userFilter === 'free') return u.role === 'free';
    if (userFilter === 'paid') return ['pro', 'unlimited', 'admin'].includes(u.role);
    return true;
  });

  /* ── Loading / auth guard ── */
  if (loading || !user) return (
    <div style={{ minHeight: '100vh', background: '#050a13', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: BLUE, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const TABS = [
    { id: 'overview',   label: 'PŘEHLED'  },
    { id: 'users',      label: 'UŽIVATELÉ' },
    { id: 'emails',     label: 'EMAILY'   },
    { id: 'templates',  label: 'ŠABLONY'  },
    { id: 'settings',   label: 'NASTAVENÍ' },
  ];

  const s = stats?.totals;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: NM }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:4px}
        .tab-btn:hover{color:#fff!important}
        .row-hover:hover{background:rgba(255,255,255,0.03)!important}
        .action-btn:hover{background:rgba(255,255,255,0.12)!important}
        .tpl-card:hover{border-color:${BLUE}80!important;transform:translateY(-2px)}
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(5,10,19,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: NM, fontWeight: 900, fontSize: 14, letterSpacing: '0.25em', color: '#fff', textTransform: 'uppercase' }}>
            TypeBeatz
          </span>
          <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontFamily: NM, fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', color: BLUE, textTransform: 'uppercase' }}>
            Správce
          </span>
        </div>
        <button onClick={() => navigate('/app')}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
            fontFamily: NM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '6px 16px', borderRadius: 9999, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.5)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
          ← Zpět do aplikace
        </button>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px 60px' }}>

        {/* Flash message */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ marginBottom: 24, padding: '12px 20px', borderRadius: 12, background: `${BLUE}15`,
                border: `1px solid ${BLUE}30`, color: '#60a5fa', fontFamily: NM, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
              {msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 40, background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${BORDER}`, borderRadius: 14, padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}
              style={{ fontFamily: NM, fontWeight: 900, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? '#000' : 'rgba(255,255,255,0.35)',
                boxShadow: tab === t.id ? '0 2px 12px rgba(0,0,0,0.4)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {busy ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: BLUE, animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ═══════════════ PŘEHLED ═══════════════ */}
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 style={{ fontFamily: NM, fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 28 }}>
                  Přehled platformy
                </h2>

                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
                  <StatCard label="Celkem uživatelů" value={s?.total_users ?? 0} sub="všechny registrace" accent={BLUE} />
                  <StatCard label="Free uživatelé" value={s?.free_users ?? 0} sub="5 kreditů/měsíc" accent="rgba(255,255,255,0.4)" />
                  <StatCard label="Platící uživatelé" value={s?.paid_users ?? 0} sub="PRO + UNLIMITED" accent="#34d399" />
                  <StatCard label="E-mail odběratelé" value={s?.email_optins ?? 0} sub="opt-in zapnutý" accent="#a78bfa" />
                </div>

                {/* Chart */}
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px 24px 16px' }}>
                  <div style={{ fontFamily: NM, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                    Registrace za posledních 30 dní
                  </div>
                  <SignupChart daily={stats?.daily} />
                </div>
              </motion.div>
            )}

            {/* ═══════════════ UŽIVATELÉ ═══════════════ */}
            {tab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
                  <h2 style={{ fontFamily: NM, fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>
                    Uživatelé
                    <span style={{ marginLeft: 12, fontFamily: NM, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                      background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 9999, padding: '2px 10px' }}>
                      {filteredUsers.length}
                    </span>
                  </h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Filter pills */}
                    {['all', 'free', 'paid'].map(f => (
                      <button key={f} onClick={() => setUserFilter(f)}
                        style={{ fontFamily: NM, fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '6px 14px', borderRadius: 9999, cursor: 'pointer', border: `1px solid ${userFilter === f ? BLUE : BORDER}`,
                          background: userFilter === f ? `${BLUE}20` : 'transparent',
                          color: userFilter === f ? BLUE : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
                        {f === 'all' ? 'Všichni' : f === 'free' ? 'Free' : 'Platící'}
                      </button>
                    ))}
                    <button onClick={() => window.open(`${API}/users/export`, '_blank')} className="action-btn"
                      style={{ fontFamily: NM, fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                        padding: '7px 16px', borderRadius: 9999, cursor: 'pointer', border: `1px solid ${BORDER}`,
                        background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
                      ↓ Export CSV
                    </button>
                  </div>
                </div>

                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${BORDER}` }}>
                        {['Uživatel', 'Role', 'Kredity', 'E-mail opt-in', 'Registrace', 'Akce'].map(h => (
                          <th key={h} style={{ fontFamily: NM, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.3)', padding: '14px 20px', textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, i) => (
                        <tr key={u.id} className="row-hover" style={{ borderBottom: i < filteredUsers.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none', transition: 'background 0.15s' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
                                border: `1px solid ${BORDER}`, overflow: 'hidden', flexShrink: 0 }}>
                                {u.profile_image_url && <img src={u.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                              </div>
                              <div>
                                <div style={{ fontFamily: NM, fontWeight: 700, fontSize: 13, color: '#fff' }}>
                                  {[u.first_name, u.last_name].filter(Boolean).join(' ') || 'Anonymous'}
                                </div>
                                <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', marginTop: 1 }}>
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}><Badge role={u.role} /></td>
                          <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                            {['free'].includes(u.role) ? (u.credits_remaining ?? '—') : '∞'}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <button onClick={() => toggleOptIn(u.id, u.email_opt_in)}
                              style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', transition: 'background 0.2s', position: 'relative',
                                background: u.email_opt_in ? BLUE : 'rgba(255,255,255,0.1)' }}>
                              <span style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                                left: u.email_opt_in ? 21 : 3 }} />
                            </button>
                          </td>
                          <td style={{ padding: '14px 20px', fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('cs-CZ') : '—'}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 8,
                                padding: '5px 10px', color: '#fff', fontFamily: NM, fontSize: 9, fontWeight: 900,
                                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', outline: 'none' }}>
                              <option value="free">FREE</option>
                              <option value="pro">PRO</option>
                              <option value="unlimited">UNLIMITED</option>
                              <option value="admin">ADMIN</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: NM, fontSize: 12 }}>
                          Žádní uživatelé
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ EMAILY ═══════════════ */}
            {tab === 'emails' && (
              <motion.div key="emails" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
                  <div>
                    <h2 style={{ fontFamily: NM, fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4 }}>
                      E-mail odběratelé
                    </h2>
                    <p style={{ fontFamily: NM, fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                      Uživatelé, kteří souhlasili s odebíráním e-mailů (automaticky při registraci)
                    </p>
                  </div>
                  <button onClick={() => window.open(`${API}/emails/export`, '_blank')} className="action-btn"
                    style={{ fontFamily: NM, fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '10px 20px', borderRadius: 9999, cursor: 'pointer', border: `1px solid ${BORDER}`,
                      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
                    ↓ Stáhnout .CSV
                  </button>
                </div>

                {/* Summary pills */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Celkem opt-in', value: emails.length, accent: BLUE },
                    { label: 'Free', value: emails.filter(e => e.role === 'free').length, accent: 'rgba(255,255,255,0.4)' },
                    { label: 'Platící', value: emails.filter(e => ['pro', 'unlimited', 'admin'].includes(e.role)).length, accent: '#34d399' },
                  ].map(p => (
                    <div key={p.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 18px',
                      display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: NM, fontSize: 18, fontWeight: 900, color: p.accent }}>{p.value}</span>
                      <span style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${BORDER}` }}>
                        {['E-mail', 'Jméno', 'Tarif', 'Datum registrace'].map(h => (
                          <th key={h} style={{ fontFamily: NM, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.3)', padding: '14px 20px', textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {emails.map((e, i) => (
                        <tr key={e.id} className="row-hover" style={{ borderBottom: i < emails.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none', transition: 'background 0.15s' }}>
                          <td style={{ padding: '12px 20px', fontFamily: NM, fontSize: 12, color: '#fff', fontWeight: 600 }}>{e.email}</td>
                          <td style={{ padding: '12px 20px', fontFamily: NM, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                            {[e.first_name, e.last_name].filter(Boolean).join(' ') || '—'}
                          </td>
                          <td style={{ padding: '12px 20px' }}><Badge role={e.role} /></td>
                          <td style={{ padding: '12px 20px', fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                            {e.created_at ? new Date(e.created_at).toLocaleDateString('cs-CZ') : '—'}
                          </td>
                        </tr>
                      ))}
                      {emails.length === 0 && (
                        <tr><td colSpan={4} style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: NM, fontSize: 12 }}>
                          Žádní opt-in odběratelé zatím
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ ŠABLONY ═══════════════ */}
            {tab === 'templates' && (
              <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontFamily: NM, fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>
                    E-mailové šablony
                  </h2>
                  <p style={{ fontFamily: NM, fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    Přesné náhledy e-mailů, které jsou automaticky odesílány zákazníkům.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {templates.map(tpl => (
                    <div key={tpl.id} className="tpl-card"
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px',
                        cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => setPreviewTpl(tpl)}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${BLUE}15`,
                        border: `1px solid ${BLUE}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, marginBottom: 16 }}>
                        {tpl.id === 'welcome' ? '👋' : tpl.id.startsWith('purchase') ? '🎉' : '⚡'}
                      </div>
                      <div style={{ fontFamily: NM, fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
                        {tpl.name}
                      </div>
                      <div style={{ fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 16, lineHeight: 1.6 }}>
                        {tpl.trigger}
                      </div>
                      <div style={{ fontFamily: NM, fontSize: 9, color: BLUE, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                        background: `${BLUE}10`, border: `1px solid ${BLUE}20`, borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
                        Zobrazit náhled →
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preview Modal */}
                <AnimatePresence>
                  {previewTpl && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
                        onClick={() => setPreviewTpl(null)} />
                      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 700, maxHeight: '90vh',
                          background: '#0a1020', border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden',
                          display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '16px 24px', borderBottom: `1px solid ${BORDER}` }}>
                          <div>
                            <div style={{ fontFamily: NM, fontSize: 14, fontWeight: 800, color: '#fff' }}>{previewTpl.name}</div>
                            <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                              Předmět: {previewTpl.subject}
                            </div>
                          </div>
                          <button onClick={() => setPreviewTpl(null)}
                            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: '50%',
                              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: '#fff', fontSize: 16, flexShrink: 0 }}>
                            ×
                          </button>
                        </div>
                        <iframe
                          src={`${API}/email-templates/${previewTpl.id}/preview`}
                          style={{ flex: 1, border: 'none', minHeight: 520 }}
                          title={previewTpl.name}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ═══════════════ NASTAVENÍ ═══════════════ */}
            {tab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ display: 'grid', gap: 32 }}>

                  {/* Feature flags */}
                  <div>
                    <h2 style={{ fontFamily: NM, fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20 }}>
                      Feature Flags
                    </h2>
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${BORDER}` }}>
                            {['Funkce', 'Tarif', 'Popis', 'Stav'].map(h => (
                              <th key={h} style={{ fontFamily: NM, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.3)', padding: '14px 20px', textAlign: 'left' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {flags.map((f, i) => (
                            <tr key={`${f.feature_key}-${f.plan}`} className="row-hover"
                              style={{ borderBottom: i < flags.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none', transition: 'background 0.15s' }}>
                              <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: 11, color: '#fff', letterSpacing: '0.04em' }}>
                                {f.feature_key}
                              </td>
                              <td style={{ padding: '14px 20px' }}><Badge role={f.plan} /></td>
                              <td style={{ padding: '14px 20px', fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                {f.description || '—'}
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <button onClick={() => toggleFlag(f.feature_key, f.plan, !f.enabled)}
                                  style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', transition: 'background 0.2s', position: 'relative',
                                    background: f.enabled ? BLUE : 'rgba(255,255,255,0.1)' }}>
                                  <span style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                                    left: f.enabled ? 21 : 3 }} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Email SMTP settings info */}
                  <div>
                    <h2 style={{ fontFamily: NM, fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
                      E-mail / SMTP
                    </h2>
                    <div style={{ background: `${BLUE}08`, border: `1px solid ${BLUE}20`, borderRadius: 14, padding: '20px 24px' }}>
                      <p style={{ fontFamily: NM, fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px', lineHeight: 1.7 }}>
                        Pro aktivaci automatického odesílání e-mailů nastav tyto proměnné prostředí:
                      </p>
                      {[
                        { key: 'SMTP_HOST',  ex: 'smtp.gmail.com' },
                        { key: 'SMTP_PORT',  ex: '587' },
                        { key: 'SMTP_USER',  ex: 'your@email.com' },
                        { key: 'SMTP_PASS',  ex: 'app-password' },
                        { key: 'EMAIL_FROM', ex: 'TypeBeatz <noreply@yourdomain.com>' },
                      ].map(v => (
                        <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <code style={{ fontFamily: 'monospace', fontSize: 11, color: BLUE, background: `${BLUE}15`, padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>
                            {v.key}
                          </code>
                          <span style={{ fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>např. {v.ex}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reset credits */}
                  <div>
                    <h2 style={{ fontFamily: NM, fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
                      Správa kreditů
                    </h2>
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <div style={{ fontFamily: NM, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                          Ruční reset kreditů
                        </div>
                        <div style={{ fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          Free → 5 kreditů · PRO → 31 kreditů · Automaticky 1. každého měsíce
                        </div>
                      </div>
                      <button onClick={resetCredits}
                        style={{ fontFamily: NM, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '10px 20px', borderRadius: 9999, cursor: 'pointer', border: `1px solid ${BORDER}`,
                          background: 'rgba(255,255,255,0.06)', color: '#fff', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.target.style.background = '#fff'; e.target.style.color = '#000'; }}
                        onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.color = '#fff'; }}>
                        Resetovat kredity
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
