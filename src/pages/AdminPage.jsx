import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';

const API = '/api/admin';
const NM = "'Neue Montreal', 'Inter', sans-serif";
const BLUE = '#3b82f6';
const BLUE2 = '#0ea5e9';
const CARD = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.08)';
const BG = '#000';

/* ── Tiny helpers ─────────────────────────────────────────── */
function Badge({ role }) {
  const col = { admin:'#a78bfa', unlimited:'#60a5fa', pro:'#34d399', free:'rgba(255,255,255,0.3)' };
  const c = col[role] || col.free;
  return <span style={{ fontFamily:NM, fontSize:9, fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase',
    padding:'3px 8px', borderRadius:9999, border:`1px solid ${c}40`, color:c, background:`${c}10` }}>{role}</span>;
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ fontFamily:NM, fontWeight:900, fontSize:10, letterSpacing:'0.08em',
      textTransform:'uppercase', padding:'8px 18px', borderRadius:9999, cursor:'pointer', border:'none',
      transition:'all 0.2s', background: active ? '#fff' : 'rgba(255,255,255,0.05)',
      color: active ? '#000' : 'rgba(255,255,255,0.5)',
      boxShadow: active ? '0 2px 12px rgba(0,0,0,0.4)' : 'none' }}>
      {label}
    </button>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, padding:'24px 28px',
      borderLeft:`3px solid ${accent||BLUE}`, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%',
        background:accent||BLUE, opacity:0.06, filter:'blur(16px)' }} />
      <div style={{ fontFamily:NM, fontSize:'2.2rem', fontWeight:900, letterSpacing:'-0.04em', color:'#fff', lineHeight:1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontFamily:NM, fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
        color:'rgba(255,255,255,0.4)', marginTop:8 }}>{label}</div>
      {sub && <div style={{ fontFamily:NM, fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

/* ── SVG Chart ────────────────────────────────────────────── */
function SignupChart({ daily }) {
  const W=800, H=160, P={top:16,right:16,bottom:28,left:36};
  const today = new Date();
  const days = Array.from({length:30},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()-(29-i));return d.toISOString().slice(0,10);});
  const byDay={}; (daily||[]).forEach(r=>{byDay[r.day?.slice(0,10)]=parseInt(r.count,10);});
  const vals = days.map(d=>byDay[d]||0);
  const max = Math.max(...vals,1);
  const iW=W-P.left-P.right, iH=H-P.top-P.bottom, step=iW/(vals.length-1);
  const px=i=>P.left+i*step, py=v=>P.top+iH-(v/max)*iH;
  const line=vals.map((v,i)=>`${i===0?'M':'L'} ${px(i)} ${py(v)}`).join(' ');
  const area=`${line} L ${px(vals.length-1)} ${P.top+iH} L ${px(0)} ${P.top+iH} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
      <defs>
        <linearGradient id="cA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.25"/><stop offset="100%" stopColor={BLUE} stopOpacity="0.01"/>
        </linearGradient>
        <linearGradient id="cL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={BLUE}/><stop offset="100%" stopColor={BLUE2}/>
        </linearGradient>
      </defs>
      {[0,.25,.5,.75,1].map(f=><line key={f} x1={P.left} x2={W-P.right} y1={P.top+iH*(1-f)} y2={P.top+iH*(1-f)} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}
      <path d={area} fill="url(#cA)"/>
      <path d={line} fill="none" stroke="url(#cL)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      {vals.map((v,i)=>v>0&&<circle key={i} cx={px(i)} cy={py(v)} r="3" fill={BLUE}/>)}
      {[0,4,9,14,19,24,29].map(i=><text key={i} x={px(i)} y={H-4} textAnchor="middle" style={{fontFamily:NM,fontSize:8,fill:'rgba(255,255,255,0.3)'}}>{days[i]?.slice(5)}</text>)}
    </svg>
  );
}

/* ── Email template scaled preview ───────────────────────── */
function EmailPreviewCard({ tpl, onOpen }) {
  const icons = { welcome:'👋', purchase_pro:'🎉', purchase_unlimited:'🚀', credit_limit:'⚡' };
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, overflow:'hidden',
      transition:'all 0.2s', cursor:'pointer' }} onClick={onOpen}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=`${BLUE}60`;e.currentTarget.style.transform='translateY(-2px)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.transform='translateY(0)';}}>
      {/* Card header */}
      <div style={{ padding:'20px 20px 16px', borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`${BLUE}15`, border:`1px solid ${BLUE}25`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
            {icons[tpl.id] || '✉️'}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:NM, fontSize:13, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>{tpl.name}</div>
            <div style={{ fontFamily:NM, fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:2 }}>
              AUTOMATICKÉ
            </div>
          </div>
        </div>
        <div style={{ fontFamily:NM, fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>
          ⏱ {tpl.trigger}
        </div>
      </div>
      {/* Scaled iframe preview */}
      <div style={{ height:240, overflow:'hidden', position:'relative', background:'#000' }}>
        <iframe
          src={`${API}/email-templates/${tpl.id}/preview`}
          style={{ position:'absolute', top:0, left:0, width:'160%', height:'160%',
            transform:'scale(0.625)', transformOrigin:'top left', border:'none', pointerEvents:'none' }}
          title={tpl.name}
        />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:60,
          background:'linear-gradient(to top, rgba(0,0,0,0.95), transparent)' }} />
        <div style={{ position:'absolute', bottom:12, left:0, right:0, textAlign:'center' }}>
          <span style={{ fontFamily:NM, fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
            color:BLUE, background:`${BLUE}15`, border:`1px solid ${BLUE}25`, borderRadius:6, padding:'4px 10px' }}>
            Kliknout pro náhled →
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── SMTP Status Banner ───────────────────────────────────── */
function SmtpBanner({ configured }) {
  if (configured === null) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderRadius:10, marginBottom:24,
      background: configured ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
      border: `1px solid ${configured ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
      <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
        background: configured ? '#10b981' : '#f59e0b',
        boxShadow: configured ? '0 0 8px #10b981' : '0 0 8px #f59e0b' }} />
      <span style={{ fontFamily:NM, fontSize:11, fontWeight:700, color: configured ? '#34d399' : '#fbbf24' }}>
        {configured
          ? 'SMTP nakonfigurováno — automatické e-maily jsou aktivní'
          : 'SMTP není nakonfigurováno — e-maily se neodesílají. Nastav SMTP_HOST, SMTP_USER, SMTP_PASS v prostředí.'}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main component
════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Admin Panel');

  const [tab, setTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  // Data
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [flags, setFlags] = useState([]);
  const [emails, setEmails] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [smtpOk, setSmtpOk] = useState(null);
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState('');

  // Users tab
  const [userFilter, setUserFilter] = useState('all');

  // Template preview modal
  const [previewTpl, setPreviewTpl] = useState(null);

  // Newsletter state
  const [nlSegment, setNlSegment]     = useState('all');
  const [nlMode, setNlMode]           = useState('template'); // 'template' | 'custom'
  const [nlTplId, setNlTplId]         = useState(null);
  const [nlSubject, setNlSubject]     = useState('');
  const [nlCustomHtml, setNlCustomHtml] = useState('');
  const [nlConfirm, setNlConfirm]     = useState(false);
  const [nlSending, setNlSending]     = useState(false);
  const [nlResult, setNlResult]       = useState(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) navigate('/app');
  }, [user, loading, navigate]);

  /* ── Load all data ── */
  const loadAll = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setBusy(true);
    try {
      const [sRes, uRes, fRes, eRes, tRes, smRes] = await Promise.all([
        fetch(`${API}/stats`,           { credentials:'include' }),
        fetch(`${API}/users`,           { credentials:'include' }),
        fetch(`${API}/features`,        { credentials:'include' }),
        fetch(`${API}/emails`,          { credentials:'include' }),
        fetch(`${API}/email-templates`, { credentials:'include' }),
        fetch(`${API}/smtp-status`,     { credentials:'include' }),
      ]);
      setStats(await sRes.json());
      setUsers(await uRes.json());
      setFlags(await fRes.json());
      setEmails(await eRes.json());
      setTemplates(await tRes.json());
      const sm = await smRes.json(); setSmtpOk(sm.configured);
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3500); }

  /* ── User actions ── */
  async function changeRole(uid, role) {
    const res = await fetch(`${API}/users/${uid}/role`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      credentials:'include', body:JSON.stringify({role})
    });
    if (res.ok) { setUsers(p=>p.map(u=>u.id===uid?{...u,role}:u)); flash(`Role → ${role}`); }
  }

  async function toggleOptIn(uid, cur) {
    await fetch(`${API}/users/${uid}/email-opt-in`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      credentials:'include', body:JSON.stringify({optIn:!cur})
    });
    setUsers(p=>p.map(u=>u.id===uid?{...u,email_opt_in:!cur}:u));
  }

  /* ── Flag actions ── */
  async function toggleFlag(key, plan, enabled) {
    const res = await fetch(`${API}/features`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      credentials:'include', body:JSON.stringify({featureKey:key,plan,enabled})
    });
    if (res.ok) setFlags(p=>p.map(f=>f.feature_key===key&&f.plan===plan?{...f,enabled}:f));
  }

  async function resetCredits() {
    const res = await fetch(`${API}/reset-credits`,{method:'POST',credentials:'include'});
    if (res.ok) { const d=await res.json(); flash(d.message); loadAll(); }
  }

  /* ── Newsletter send ── */
  async function sendCampaign() {
    setNlSending(true); setNlConfirm(false); setNlResult(null);
    try {
      const body = { segment:nlSegment, subject:nlSubject };
      if (nlMode === 'template' && nlTplId) body.templateId = nlTplId;
      else body.customHtml = nlCustomHtml;

      const res = await fetch(`${API}/newsletter`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        credentials:'include', body:JSON.stringify(body)
      });
      const d = await res.json();
      setNlResult(d);
    } catch(e) {
      setNlResult({ error: e.message });
    } finally { setNlSending(false); }
  }

  /* ── Newsletter helpers ── */
  const segmentCounts = {
    all: emails.length,
    free: emails.filter(e=>e.role==='free').length,
    pro: emails.filter(e=>e.role==='pro').length,
    unlimited: emails.filter(e=>['unlimited','admin'].includes(e.role)).length,
  };

  const selectedTpl = templates.find(t=>t.id===nlTplId);

  // Auto-fill subject when template selected
  const handleSelectTpl = (id) => {
    setNlTplId(id);
    const tpl = templates.find(t=>t.id===id);
    if (tpl && !nlSubject) setNlSubject(tpl.subject);
  };

  /* ── Loading guard ── */
  if (loading || !user) return (
    <div style={{minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:28,height:28,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.08)',
        borderTopColor:BLUE,animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const filteredUsers = users.filter(u=>{
    if(userFilter==='free') return u.role==='free';
    if(userFilter==='paid') return ['pro','unlimited','admin'].includes(u.role);
    return true;
  });

  const s = stats?.totals;

  const TABS = [
    {id:'overview',    label:'PŘEHLED'},
    {id:'users',       label:'UŽIVATELÉ'},
    {id:'emails',      label:'EMAILY'},
    {id:'autoEmails',  label:'AUTOMATICKÉ EMAILY'},
    {id:'newsletter',  label:'NEWSLETTER'},
    {id:'settings',    label:'NASTAVENÍ'},
  ];

  /* ════════════════ RENDER ════════════════ */
  return (
    <div style={{minHeight:'100vh',background:BG,color:'#fff',fontFamily:NM}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .row-h:hover{background:rgba(255,255,255,0.03)!important}
        .ab:hover{opacity:0.8}
        input,textarea,select{font-family:${NM}!important}
      `}</style>

      {/* ══════════ NAVBAR — matches exact Navbar.jsx style ══════════ */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:10000,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 64px',height:64,
        background:'rgba(0,0,0,0.38)',
        backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)'}}>

        {/* Logo — left */}
        <button onClick={()=>navigate('/')} style={{background:'none',border:'none',padding:0,cursor:'pointer'}}
          className="ab">
          <img src={typebeatLogo} alt="TypeBeatz" style={{height:20,display:'block'}}/>
        </button>

        {/* ADMIN — absolute center */}
        <button onClick={()=>navigate('/admin')} style={{
          position:'absolute',left:'50%',transform:'translateX(-50%)',
          background:'none',border:'none',cursor:'pointer',padding:'6px 16px',
          fontFamily:NM,fontWeight:900,fontSize:13,letterSpacing:'0.25em',
          textTransform:'uppercase',color:'#fff',opacity:0.9,
          transition:'opacity 0.2s'
        }} className="ab">
          ADMIN
        </button>

        {/* Avatar dropdown — right */}
        <div style={{position:'relative'}}>
          <button onClick={()=>setMenuOpen(v=>!v)} style={{
            width:32,height:32,borderRadius:'50%',overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.2)',background:'none',cursor:'pointer',padding:0,
            transition:'border-color 0.2s'
          }}>
            {user.profile_image_url
              ? <img src={user.profile_image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : <div style={{width:'100%',height:'100%',background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>
                  {(user.first_name||'A')[0]}
                </div>
            }
          </button>

          {menuOpen && (
            <>
              <div style={{position:'fixed',inset:0,zIndex:40}} onClick={()=>setMenuOpen(false)}/>
              <div style={{position:'absolute',right:0,top:44,zIndex:50,width:200,borderRadius:14,
                border:'1px solid rgba(255,255,255,0.1)',paddingTop:4,paddingBottom:4,
                background:'rgba(8,8,12,0.97)',backdropFilter:'blur(16px)'}}>
                <div style={{padding:'10px 16px 10px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>{user.first_name||'Admin'}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2}}>{user.email}</div>
                </div>
                {[
                  {label:'Aplikace', action:()=>{navigate('/app');setMenuOpen(false);}},
                  {label:'Účet', action:()=>{navigate('/account');setMenuOpen(false);}},
                ].map(item=>(
                  <button key={item.label} onClick={item.action} style={{
                    display:'block',width:'100%',textAlign:'left',padding:'8px 16px',
                    background:'none',border:'none',cursor:'pointer',fontSize:13,color:'rgba(255,255,255,0.7)',
                    transition:'all 0.15s'
                  }} onMouseEnter={e=>e.target.style.background='rgba(255,255,255,0.05)'}
                     onMouseLeave={e=>e.target.style.background='none'}>
                    {item.label}
                  </button>
                ))}
                <div style={{borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:4}}>
                  <button onClick={()=>{logout();setMenuOpen(false);}} style={{
                    display:'block',width:'100%',textAlign:'left',padding:'8px 16px',
                    background:'none',border:'none',cursor:'pointer',fontSize:13,color:'rgba(255,255,255,0.4)',
                    transition:'all 0.15s'
                  }} onMouseEnter={e=>e.target.style.color='#fff'}
                     onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.4)'}>
                    Odhlásit se
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* ══════════ CONTENT ══════════ */}
      <div style={{maxWidth:1200,margin:'0 auto',padding:'88px 32px 60px'}}>

        {/* Flash message */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{marginBottom:20,padding:'10px 20px',borderRadius:10,background:`${BLUE}15`,
                border:`1px solid ${BLUE}30`,color:'#60a5fa',fontSize:12,fontWeight:700,textAlign:'center'}}>
              {msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════ CENTERED TAB BAR ══════════ */}
        <div style={{display:'flex',justifyContent:'center',marginBottom:44}}>
          <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.03)',
            border:`1px solid ${BORDER}`,borderRadius:16,padding:4,flexWrap:'wrap',justifyContent:'center'}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                fontFamily:NM,fontWeight:900,fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',
                padding:'9px 16px',borderRadius:10,cursor:'pointer',border:'none',transition:'all 0.2s',
                background: tab===t.id ? '#fff' : 'transparent',
                color: tab===t.id ? '#000' : 'rgba(255,255,255,0.35)',
                boxShadow: tab===t.id ? '0 2px 12px rgba(0,0,0,0.4)' : 'none',
                whiteSpace:'nowrap'
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {busy ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'120px 0'}}>
            <div style={{width:28,height:28,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.08)',
              borderTopColor:BLUE,animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ══════════ PŘEHLED ══════════ */}
            {tab==='overview' && (
              <motion.div key="overview" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
                <h2 style={{fontFamily:NM,fontSize:22,fontWeight:900,letterSpacing:'-0.03em',marginBottom:28}}>Přehled platformy</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:36}}>
                  <StatCard label="Celkem uživatelů" value={s?.total_users??0} sub="všechny registrace" accent={BLUE}/>
                  <StatCard label="Free uživatelé" value={s?.free_users??0} sub="5 kreditů/měsíc" accent="rgba(255,255,255,0.35)"/>
                  <StatCard label="Platící uživatelé" value={s?.paid_users??0} sub="PRO + UNLIMITED" accent="#34d399"/>
                  <StatCard label="E-mail odběratelé" value={s?.email_optins??0} sub="opt-in zapnutý" accent="#a78bfa"/>
                </div>
                <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:'24px 24px 16px'}}>
                  <div style={{fontFamily:NM,fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
                    color:'rgba(255,255,255,0.35)',marginBottom:20}}>Registrace za posledních 30 dní</div>
                  <SignupChart daily={stats?.daily}/>
                </div>
              </motion.div>
            )}

            {/* ══════════ UŽIVATELÉ ══════════ */}
            {tab==='users' && (
              <motion.div key="users" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:28}}>
                  <h2 style={{fontFamily:NM,fontSize:22,fontWeight:900,letterSpacing:'-0.03em',margin:0}}>
                    Uživatelé <span style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.3)'}}>({filteredUsers.length})</span>
                  </h2>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {[['all','Všichni'],['free','Free'],['paid','Platící']].map(([f,l])=>(
                      <button key={f} onClick={()=>setUserFilter(f)} style={{fontFamily:NM,fontWeight:700,fontSize:9,
                        letterSpacing:'0.1em',textTransform:'uppercase',padding:'6px 14px',borderRadius:9999,cursor:'pointer',
                        border:`1px solid ${userFilter===f?BLUE:BORDER}`,
                        background:userFilter===f?`${BLUE}20`:'transparent',
                        color:userFilter===f?BLUE:'rgba(255,255,255,0.4)',transition:'all 0.2s'}}>{l}</button>
                    ))}
                    <button onClick={()=>window.open(`${API}/users/export`,'_blank')} style={{fontFamily:NM,fontWeight:700,fontSize:9,
                      letterSpacing:'0.1em',textTransform:'uppercase',padding:'7px 16px',borderRadius:9999,cursor:'pointer',
                      border:`1px solid ${BORDER}`,background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.6)'}}>
                      ↓ CSV
                    </button>
                  </div>
                </div>
                <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:800}}>
                    <thead>
                      <tr style={{background:'rgba(255,255,255,0.03)',borderBottom:`1px solid ${BORDER}`}}>
                        {['Uživatel','Role','Kredity','E-mail opt-in','Registrace','Akce'].map(h=>(
                          <th key={h} style={{fontFamily:NM,fontSize:9,fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',
                            color:'rgba(255,255,255,0.3)',padding:'14px 20px',textAlign:'left'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u,i)=>(
                        <tr key={u.id} className="row-h" style={{borderBottom:i<filteredUsers.length-1?`1px solid rgba(255,255,255,0.04)`:'none',transition:'background 0.15s'}}>
                          <td style={{padding:'14px 20px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.06)',
                                border:`1px solid ${BORDER}`,overflow:'hidden',flexShrink:0}}>
                                {u.profile_image_url&&<img src={u.profile_image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
                              </div>
                              <div>
                                <div style={{fontWeight:700,fontSize:13,color:'#fff'}}>{[u.first_name,u.last_name].filter(Boolean).join(' ')||'Anonymous'}</div>
                                <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:1}}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{padding:'14px 20px'}}><Badge role={u.role}/></td>
                          <td style={{padding:'14px 20px',fontFamily:'monospace',fontSize:12,color:'rgba(255,255,255,0.6)'}}>
                            {u.role==='free'?(u.credits_remaining??'—'):'∞'}
                          </td>
                          <td style={{padding:'14px 20px'}}>
                            <button onClick={()=>toggleOptIn(u.id,u.email_opt_in)} style={{
                              width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',
                              transition:'background 0.2s',position:'relative',
                              background:u.email_opt_in?BLUE:'rgba(255,255,255,0.1)'}}>
                              <span style={{position:'absolute',top:3,width:16,height:16,borderRadius:'50%',background:'#fff',
                                transition:'left 0.2s',left:u.email_opt_in?21:3}}/>
                            </button>
                          </td>
                          <td style={{padding:'14px 20px',fontSize:10,color:'rgba(255,255,255,0.3)'}}>
                            {u.created_at?new Date(u.created_at).toLocaleDateString('cs-CZ'):'—'}
                          </td>
                          <td style={{padding:'14px 20px'}}>
                            <select value={u.role} onChange={e=>changeRole(u.id,e.target.value)} style={{
                              background:'rgba(255,255,255,0.05)',border:`1px solid ${BORDER}`,borderRadius:8,
                              padding:'5px 10px',color:'#fff',fontSize:9,fontWeight:900,letterSpacing:'0.08em',
                              textTransform:'uppercase',cursor:'pointer',outline:'none'}}>
                              {['free','pro','unlimited','admin'].map(r=><option key={r} value={r}>{r.toUpperCase()}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ══════════ EMAILY ══════════ */}
            {tab==='emails' && (
              <motion.div key="emails" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:24}}>
                  <div>
                    <h2 style={{fontFamily:NM,fontSize:22,fontWeight:900,letterSpacing:'-0.03em',marginBottom:4,margin:0}}>E-mail odběratelé</h2>
                    <p style={{fontFamily:NM,fontSize:12,color:'rgba(255,255,255,0.35)',margin:'6px 0 0'}}>
                      Uživatelé automaticky souhlasí při registraci
                    </p>
                  </div>
                  <button onClick={()=>window.open(`${API}/emails/export`,'_blank')} style={{fontFamily:NM,fontWeight:700,fontSize:9,
                    letterSpacing:'0.1em',textTransform:'uppercase',padding:'10px 20px',borderRadius:9999,cursor:'pointer',
                    border:`1px solid ${BORDER}`,background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.6)'}}>
                    ↓ Stáhnout .CSV
                  </button>
                </div>
                <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
                  {[['Celkem opt-in',emails.length,BLUE],['Free',emails.filter(e=>e.role==='free').length,'rgba(255,255,255,0.4)'],
                    ['Platící',emails.filter(e=>['pro','unlimited','admin'].includes(e.role)).length,'#34d399']].map(([l,v,a])=>(
                    <div key={l} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:'10px 18px',display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontFamily:NM,fontSize:20,fontWeight:900,color:a}}>{v}</span>
                      <span style={{fontFamily:NM,fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)'}}>{l}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:560}}>
                    <thead>
                      <tr style={{background:'rgba(255,255,255,0.03)',borderBottom:`1px solid ${BORDER}`}}>
                        {['E-mail','Jméno','Tarif','Datum'].map(h=>(
                          <th key={h} style={{fontFamily:NM,fontSize:9,fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',
                            color:'rgba(255,255,255,0.3)',padding:'14px 20px',textAlign:'left'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {emails.map((e,i)=>(
                        <tr key={e.id} className="row-h" style={{borderBottom:i<emails.length-1?`1px solid rgba(255,255,255,0.04)`:'none',transition:'background 0.15s'}}>
                          <td style={{padding:'12px 20px',fontSize:12,fontWeight:600,color:'#fff'}}>{e.email}</td>
                          <td style={{padding:'12px 20px',fontSize:12,color:'rgba(255,255,255,0.5)'}}>{[e.first_name,e.last_name].filter(Boolean).join(' ')||'—'}</td>
                          <td style={{padding:'12px 20px'}}><Badge role={e.role}/></td>
                          <td style={{padding:'12px 20px',fontSize:10,color:'rgba(255,255,255,0.3)'}}>{e.created_at?new Date(e.created_at).toLocaleDateString('cs-CZ'):'—'}</td>
                        </tr>
                      ))}
                      {emails.length===0&&<tr><td colSpan={4} style={{padding:'48px',textAlign:'center',color:'rgba(255,255,255,0.2)',fontSize:12}}>Žádní odběratelé</td></tr>}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ══════════ AUTOMATICKÉ EMAILY ══════════ */}
            {tab==='autoEmails' && (
              <motion.div key="autoEmails" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
                <div style={{marginBottom:28}}>
                  <h2 style={{fontFamily:NM,fontSize:22,fontWeight:900,letterSpacing:'-0.03em',marginBottom:6}}>Automatické e-maily</h2>
                  <p style={{fontFamily:NM,fontSize:12,color:'rgba(255,255,255,0.4)',margin:0,lineHeight:1.7}}>
                    Tyto e-maily jsou odesílány automaticky na základě akcí uživatelů. Kliknutím zobrazíte přesný náhled.
                  </p>
                </div>
                <SmtpBanner configured={smtpOk}/>

                {/* Template cards grid */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:20}}>
                  {templates.map(tpl=>(
                    <EmailPreviewCard key={tpl.id} tpl={tpl} onOpen={()=>setPreviewTpl(tpl)}/>
                  ))}
                  {templates.length===0&&(
                    <div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'rgba(255,255,255,0.2)',fontSize:12}}>
                      Načítání šablon…
                    </div>
                  )}
                </div>

                {/* How it works */}
                <div style={{marginTop:32,background:`${BLUE}08`,border:`1px solid ${BLUE}20`,borderRadius:14,padding:'20px 24px'}}>
                  <div style={{fontFamily:NM,fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
                    color:'rgba(255,255,255,0.4)',marginBottom:14}}>Jak to funguje</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
                    {[
                      {emoji:'👋',title:'Uvítací e-mail',desc:'Odeslán ihned po prvním přihlášení'},
                      {emoji:'🎉',title:'Potvrzení platby',desc:'Odeslán při aktivaci PRO nebo UNLIMITED předplatného'},
                      {emoji:'⚡',title:'Limit kreditů',desc:'Odeslán FREE uživateli, který vyčerpal všechny kredity'},
                    ].map(item=>(
                      <div key={item.title} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                        <span style={{fontSize:20,flexShrink:0}}>{item.emoji}</span>
                        <div>
                          <div style={{fontFamily:NM,fontSize:12,fontWeight:700,color:'#fff',marginBottom:2}}>{item.title}</div>
                          <div style={{fontFamily:NM,fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.6}}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full preview modal */}
                <AnimatePresence>
                  {previewTpl&&(
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
                      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(16px)'}} onClick={()=>setPreviewTpl(null)}/>
                      <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}}
                        exit={{opacity:0,scale:0.95,y:20}} transition={{duration:0.25,ease:[0.16,1,0.3,1]}}
                        style={{position:'relative',zIndex:1,width:'100%',maxWidth:680,maxHeight:'90vh',
                          background:'#0a1020',border:`1px solid ${BORDER}`,borderRadius:20,overflow:'hidden',display:'flex',flexDirection:'column'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:`1px solid ${BORDER}`}}>
                          <div>
                            <div style={{fontFamily:NM,fontSize:14,fontWeight:800,color:'#fff'}}>{previewTpl.name}</div>
                            <div style={{fontFamily:NM,fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:2}}>Předmět: {previewTpl.subject}</div>
                          </div>
                          <button onClick={()=>setPreviewTpl(null)} style={{background:'rgba(255,255,255,0.06)',border:`1px solid ${BORDER}`,
                            borderRadius:'50%',width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',
                            cursor:'pointer',color:'#fff',fontSize:16}}>×</button>
                        </div>
                        <iframe src={`${API}/email-templates/${previewTpl.id}/preview`}
                          style={{flex:1,border:'none',minHeight:520}} title={previewTpl.name}/>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ══════════ NEWSLETTER ══════════ */}
            {tab==='newsletter' && (
              <motion.div key="newsletter" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
                <div style={{marginBottom:28}}>
                  <h2 style={{fontFamily:NM,fontSize:22,fontWeight:900,letterSpacing:'-0.03em',marginBottom:6}}>E-mailová kampaň</h2>
                  <p style={{fontFamily:NM,fontSize:12,color:'rgba(255,255,255,0.4)',margin:0}}>
                    Pošli personalizovaný e-mail segmentu uživatelů.
                  </p>
                </div>

                <SmtpBanner configured={smtpOk}/>

                <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:24,alignItems:'start'}}>

                  {/* ─── Left: Campaign builder ─── */}
                  <div style={{display:'flex',flexDirection:'column',gap:24}}>

                    {/* STEP 1 — Segment */}
                    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:24}}>
                      <div style={{fontFamily:NM,fontSize:10,fontWeight:900,letterSpacing:'0.15em',textTransform:'uppercase',
                        color:BLUE,marginBottom:16}}>1. Příjemci</div>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {[
                          {id:'all',       label:'Všichni',    count:segmentCounts.all,     desc:'Všichni opt-in uživatelé'},
                          {id:'free',      label:'Free',       count:segmentCounts.free,    desc:'Uživatelé zdarma — připomeň jim upgrade'},
                          {id:'pro',       label:'PRO',        count:segmentCounts.pro,     desc:'PRO zákazníci'},
                          {id:'unlimited', label:'Unlimited',  count:segmentCounts.unlimited,desc:'Unlimited zákazníci'},
                        ].map(seg=>(
                          <button key={seg.id} onClick={()=>setNlSegment(seg.id)}
                            title={seg.desc}
                            style={{fontFamily:NM,fontWeight:900,fontSize:10,letterSpacing:'0.08em',
                              textTransform:'uppercase',padding:'10px 18px',borderRadius:10,cursor:'pointer',
                              border:`1px solid ${nlSegment===seg.id?BLUE:BORDER}`,
                              background:nlSegment===seg.id?`${BLUE}20`:CARD,
                              color:nlSegment===seg.id?BLUE:'rgba(255,255,255,0.5)',transition:'all 0.2s',
                              display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                            <span style={{fontSize:18,fontWeight:900,color:nlSegment===seg.id?BLUE:'#fff'}}>{seg.count}</span>
                            <span>{seg.label}</span>
                          </button>
                        ))}
                      </div>
                      <div style={{fontFamily:NM,fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:10}}>
                        {segmentCounts[nlSegment] === 0
                          ? 'Žádní opt-in odběratelé v tomto segmentu.'
                          : `E-mail bude odeslán ${segmentCounts[nlSegment]} příjemcům.`}
                      </div>
                    </div>

                    {/* STEP 2 — Content type */}
                    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:24}}>
                      <div style={{fontFamily:NM,fontSize:10,fontWeight:900,letterSpacing:'0.15em',textTransform:'uppercase',
                        color:BLUE,marginBottom:16}}>2. Obsah e-mailu</div>
                      <div style={{display:'flex',gap:6,marginBottom:20,background:'rgba(255,255,255,0.04)',
                        padding:4,borderRadius:10,width:'fit-content'}}>
                        {[['template','🗂 Šablona'],['custom','✏️ Vlastní HTML']].map(([m,l])=>(
                          <button key={m} onClick={()=>setNlMode(m)} style={{fontFamily:NM,fontWeight:700,fontSize:10,
                            letterSpacing:'0.06em',padding:'7px 16px',borderRadius:7,cursor:'pointer',border:'none',
                            transition:'all 0.2s',background:nlMode===m?'#fff':'transparent',
                            color:nlMode===m?'#000':'rgba(255,255,255,0.4)'}}>{l}</button>
                        ))}
                      </div>

                      {nlMode==='template' ? (
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
                          {templates.map(tpl=>{
                            const icons={welcome:'👋',purchase_pro:'🎉',purchase_unlimited:'🚀',credit_limit:'⚡'};
                            const active = nlTplId===tpl.id;
                            return (
                              <button key={tpl.id} onClick={()=>handleSelectTpl(tpl.id)} style={{
                                textAlign:'left',padding:'14px',borderRadius:12,cursor:'pointer',border:`1px solid ${active?BLUE:BORDER}`,
                                background:active?`${BLUE}15`:CARD,transition:'all 0.2s'}}>
                                <div style={{fontSize:22,marginBottom:6}}>{icons[tpl.id]||'✉️'}</div>
                                <div style={{fontFamily:NM,fontSize:11,fontWeight:800,color:active?'#fff':'rgba(255,255,255,0.7)',marginBottom:4}}>{tpl.name}</div>
                                <div style={{fontFamily:NM,fontSize:9,color:'rgba(255,255,255,0.3)',lineHeight:1.5}}>{tpl.trigger}</div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div>
                          <div style={{fontFamily:NM,fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',
                            color:'rgba(255,255,255,0.3)',marginBottom:6}}>HTML obsah e-mailu</div>
                          <textarea
                            value={nlCustomHtml}
                            onChange={e=>setNlCustomHtml(e.target.value)}
                            placeholder="<html>...váš HTML obsah...</html>"
                            rows={10}
                            style={{width:'100%',background:'rgba(255,255,255,0.04)',border:`1px solid ${BORDER}`,borderRadius:10,
                              padding:'12px 14px',color:'#fff',fontSize:12,lineHeight:1.6,resize:'vertical',
                              outline:'none',fontFamily:'monospace',boxSizing:'border-box'}}
                          />
                        </div>
                      )}
                    </div>

                    {/* STEP 3 — Subject */}
                    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:24}}>
                      <div style={{fontFamily:NM,fontSize:10,fontWeight:900,letterSpacing:'0.15em',textTransform:'uppercase',
                        color:BLUE,marginBottom:12}}>3. Předmět e-mailu</div>
                      <input
                        type="text"
                        value={nlSubject}
                        onChange={e=>setNlSubject(e.target.value)}
                        placeholder="Například: Velká novinka od TypeBeatz 🎵"
                        style={{width:'100%',background:'rgba(255,255,255,0.05)',border:`1px solid ${BORDER}`,
                          borderRadius:10,padding:'12px 16px',color:'#fff',fontSize:14,outline:'none',
                          boxSizing:'border-box',transition:'border-color 0.2s'}}
                        onFocus={e=>e.target.style.borderColor='rgba(59,130,246,0.5)'}
                        onBlur={e=>e.target.style.borderColor=BORDER}
                      />
                    </div>

                    {/* STEP 4 — Send */}
                    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:24}}>
                      <div style={{fontFamily:NM,fontSize:10,fontWeight:900,letterSpacing:'0.15em',textTransform:'uppercase',
                        color:BLUE,marginBottom:16}}>4. Odeslat kampaň</div>

                      {nlResult ? (
                        <div style={{padding:'16px 20px',borderRadius:12,background:nlResult.error?'rgba(239,68,68,0.1)':'rgba(16,185,129,0.1)',
                          border:`1px solid ${nlResult.error?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'}`}}>
                          {nlResult.error ? (
                            <p style={{color:'#f87171',fontSize:13,margin:0}}>Chyba: {nlResult.error}</p>
                          ) : (
                            <>
                              <p style={{color:'#34d399',fontSize:14,fontWeight:800,margin:'0 0 4px'}}>Kampaň odeslána! ✓</p>
                              <p style={{color:'rgba(255,255,255,0.5)',fontSize:12,margin:0}}>
                                Odesláno: {nlResult.sent} · Nepodařilo se: {nlResult.failed} · Celkem: {nlResult.total}
                              </p>
                            </>
                          )}
                          <button onClick={()=>setNlResult(null)} style={{marginTop:12,fontFamily:NM,fontWeight:700,fontSize:9,
                            letterSpacing:'0.1em',textTransform:'uppercase',padding:'6px 14px',borderRadius:9999,cursor:'pointer',
                            border:`1px solid ${BORDER}`,background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.5)'}}>
                            Nová kampaň
                          </button>
                        </div>
                      ) : nlConfirm ? (
                        <div style={{background:'rgba(59,130,246,0.08)',border:`1px solid ${BLUE}30`,borderRadius:12,padding:'16px 20px'}}>
                          <p style={{fontFamily:NM,fontSize:13,color:'#fff',margin:'0 0 4px',fontWeight:700}}>Potvrdit odeslání</p>
                          <p style={{fontFamily:NM,fontSize:11,color:'rgba(255,255,255,0.5)',margin:'0 0 16px'}}>
                            E-mail „{nlSubject}" bude odeslán {segmentCounts[nlSegment]} příjemcům.
                          </p>
                          <div style={{display:'flex',gap:8}}>
                            <button onClick={sendCampaign} disabled={nlSending} style={{fontFamily:NM,fontWeight:900,fontSize:10,
                              letterSpacing:'0.08em',textTransform:'uppercase',padding:'10px 20px',borderRadius:9999,cursor:'pointer',
                              border:'none',background:'#fff',color:'#000',opacity:nlSending?0.6:1}}>
                              {nlSending?'Odesílám…':'Potvrdit a odeslat'}
                            </button>
                            <button onClick={()=>setNlConfirm(false)} style={{fontFamily:NM,fontWeight:700,fontSize:10,
                              letterSpacing:'0.08em',textTransform:'uppercase',padding:'10px 20px',borderRadius:9999,cursor:'pointer',
                              border:`1px solid ${BORDER}`,background:'transparent',color:'rgba(255,255,255,0.5)'}}>
                              Zrušit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={()=>setNlConfirm(true)}
                          disabled={!nlSubject||(nlMode==='template'&&!nlTplId)||(nlMode==='custom'&&!nlCustomHtml)||segmentCounts[nlSegment]===0}
                          style={{fontFamily:NM,fontWeight:900,fontSize:13,letterSpacing:'0.05em',
                            padding:'14px 32px',borderRadius:9999,cursor:'pointer',border:'none',
                            background:'#fff',color:'#000',transition:'opacity 0.2s',
                            opacity:(!nlSubject||(nlMode==='template'&&!nlTplId)||(nlMode==='custom'&&!nlCustomHtml)||segmentCounts[nlSegment]===0)?0.4:1}}>
                          Odeslat kampaň →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ─── Right: Preview panel ─── */}
                  <div style={{position:'sticky',top:80}}>
                    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,overflow:'hidden'}}>
                      <div style={{padding:'14px 18px',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:'#34d399'}}/>
                        <span style={{fontFamily:NM,fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',
                          color:'rgba(255,255,255,0.4)'}}>Náhled e-mailu</span>
                      </div>
                      <div style={{height:520,overflow:'hidden',position:'relative',background:'#050a13'}}>
                        {nlMode==='template' && nlTplId ? (
                          <iframe key={nlTplId} src={`${API}/email-templates/${nlTplId}/preview`}
                            style={{width:'100%',height:'100%',border:'none'}} title="preview"/>
                        ) : nlMode==='custom' && nlCustomHtml ? (
                          <iframe srcDoc={nlCustomHtml}
                            style={{width:'100%',height:'100%',border:'none'}} title="preview"/>
                        ) : (
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                            height:'100%',color:'rgba(255,255,255,0.15)',gap:12}}>
                            <span style={{fontSize:40}}>✉️</span>
                            <span style={{fontFamily:NM,fontSize:12}}>
                              {nlMode==='template' ? 'Vyber šablonu pro náhled' : 'Napiš HTML pro náhled'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Personalization note */}
                    {nlMode==='template' && (
                      <div style={{marginTop:12,padding:'10px 14px',background:'rgba(167,139,250,0.07)',
                        border:'1px solid rgba(167,139,250,0.2)',borderRadius:10}}>
                        <p style={{fontFamily:NM,fontSize:10,color:'rgba(167,139,250,0.8)',margin:0,lineHeight:1.6}}>
                          ✨ Každý příjemce dostane personalizovanou verzi e-mailu se svým jménem a rolí.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ NASTAVENÍ ══════════ */}
            {tab==='settings' && (
              <motion.div key="settings" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
                <div style={{display:'grid',gap:28}}>
                  {/* Feature flags */}
                  <div>
                    <h2 style={{fontFamily:NM,fontSize:22,fontWeight:900,letterSpacing:'-0.03em',marginBottom:20}}>Feature Flags</h2>
                    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',minWidth:560}}>
                        <thead>
                          <tr style={{background:'rgba(255,255,255,0.03)',borderBottom:`1px solid ${BORDER}`}}>
                            {['Funkce','Tarif','Popis','Stav'].map(h=>(
                              <th key={h} style={{fontFamily:NM,fontSize:9,fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',
                                color:'rgba(255,255,255,0.3)',padding:'14px 20px',textAlign:'left'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {flags.map((f,i)=>(
                            <tr key={`${f.feature_key}-${f.plan}`} className="row-h"
                              style={{borderBottom:i<flags.length-1?`1px solid rgba(255,255,255,0.04)`:'none',transition:'background 0.15s'}}>
                              <td style={{padding:'14px 20px',fontFamily:'monospace',fontSize:11,color:'#fff'}}>{f.feature_key}</td>
                              <td style={{padding:'14px 20px'}}><Badge role={f.plan}/></td>
                              <td style={{padding:'14px 20px',fontSize:11,color:'rgba(255,255,255,0.4)'}}>{f.description||'—'}</td>
                              <td style={{padding:'14px 20px'}}>
                                <button onClick={()=>toggleFlag(f.feature_key,f.plan,!f.enabled)} style={{
                                  width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',transition:'background 0.2s',
                                  position:'relative',background:f.enabled?BLUE:'rgba(255,255,255,0.1)'}}>
                                  <span style={{position:'absolute',top:3,width:16,height:16,borderRadius:'50%',background:'#fff',
                                    transition:'left 0.2s',left:f.enabled?21:3}}/>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SMTP */}
                  <div>
                    <h2 style={{fontFamily:NM,fontSize:22,fontWeight:900,letterSpacing:'-0.03em',marginBottom:12}}>E-mail / SMTP</h2>
                    <SmtpBanner configured={smtpOk}/>
                    <div style={{background:`${BLUE}07`,border:`1px solid ${BLUE}20`,borderRadius:14,padding:'18px 22px'}}>
                      <p style={{fontFamily:NM,fontSize:12,color:'rgba(255,255,255,0.45)',margin:'0 0 12px',lineHeight:1.7}}>
                        Proměnné prostředí pro aktivaci odesílání e-mailů:
                      </p>
                      {[['SMTP_HOST','smtp.gmail.com'],['SMTP_PORT','587'],['SMTP_USER','your@email.com'],
                        ['SMTP_PASS','app-password'],['EMAIL_FROM','TypeBeatz <noreply@yourdomain.com>']].map(([k,ex])=>(
                        <div key={k} style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                          <code style={{fontFamily:'monospace',fontSize:11,color:BLUE,background:`${BLUE}15`,padding:'2px 8px',borderRadius:4,flexShrink:0}}>{k}</code>
                          <span style={{fontFamily:NM,fontSize:11,color:'rgba(255,255,255,0.3)'}}>např. {ex}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reset credits */}
                  <div>
                    <h2 style={{fontFamily:NM,fontSize:22,fontWeight:900,letterSpacing:'-0.03em',marginBottom:12}}>Správa kreditů</h2>
                    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:'20px 24px',
                      display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
                      <div>
                        <div style={{fontFamily:NM,fontSize:13,fontWeight:700,color:'#fff',marginBottom:4}}>Ruční reset kreditů</div>
                        <div style={{fontFamily:NM,fontSize:11,color:'rgba(255,255,255,0.4)'}}>
                          Free → 5 · PRO → 31 · Automaticky 1. každého měsíce
                        </div>
                      </div>
                      <button onClick={resetCredits} style={{fontFamily:NM,fontWeight:700,fontSize:10,letterSpacing:'0.1em',
                        textTransform:'uppercase',padding:'10px 20px',borderRadius:9999,cursor:'pointer',
                        border:`1px solid ${BORDER}`,background:'rgba(255,255,255,0.06)',color:'#fff',transition:'all 0.2s'}}
                        onMouseEnter={e=>{e.target.style.background='#fff';e.target.style.color='#000';}}
                        onMouseLeave={e=>{e.target.style.background='rgba(255,255,255,0.06)';e.target.style.color='#fff';}}>
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
