import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const API = '/api/admin';
const NM = "'Neue Montreal', 'Inter', sans-serif";

function Badge({ role }) {
  const styles = {
    admin:     'bg-white/10 text-white border-white/20',
    unlimited: 'bg-white/10 text-white border-white/20',
    pro:       'bg-white/10 text-white border-white/20',
    free:      'bg-white/5 text-gray-500 border-white/10'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] border font-black uppercase tracking-widest ${styles[role] || styles.free}`} style={{ fontFamily: NM }}>
      {role}
    </span>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle("Admin Panel");
  const [users, setUsers] = useState([]);
  const [flags, setFlags] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/app');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoadingData(true);
    try {
      const [usersRes, flagsRes] = await Promise.all([
        fetch(`${API}/users`, { credentials: 'include' }),
        fetch(`${API}/features`, { credentials: 'include' })
      ]);
      setUsers(await usersRes.json());
      setFlags(await flagsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }

  const handleExportCSV = () => {
    window.open(`${API}/users/export`, '_blank');
  };

  async function changeRole(userId, role) {
    const res = await fetch(`${API}/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      setMessage(`Role updated to ${role}`);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function toggleFlag(featureKey, plan, enabled) {
    const res = await fetch(`${API}/features`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ featureKey, plan, enabled })
    });
    if (res.ok) {
      setFlags(prev => prev.map(f =>
        f.feature_key === featureKey && f.plan === plan ? { ...f, enabled } : f
      ));
    }
  }

  async function resetCredits() {
    const res = await fetch(`${API}/reset-credits`, { method: 'POST', credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setMessage(data.message);
      setTimeout(() => setMessage(''), 3000);
      loadData();
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/10 border-t-white" />
      </div>
    );
  }

  const paidUsers = users.filter(u => u.role === 'pro' || u.role === 'unlimited');

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 h-16 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <span className="text-sm font-black uppercase tracking-[0.3em] text-white" style={{ fontFamily: NM }}>
            SPRÁVCE ESHOPU
          </span>
          <div className="h-4 w-[1px] bg-white/20" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest" style={{ fontFamily: NM }}>
            ADMIN panel
          </span>
        </div>
        <button onClick={() => navigate('/app')} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all" style={{ fontFamily: NM }}>
          ← Back to App
        </button>
      </nav>

      <div className="pt-24 p-6 sm:p-12 max-w-7xl mx-auto">
        
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold text-center">
            {message}
          </motion.div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl w-fit mb-12 border border-white/5">
          {[
            { id: 'users', label: 'EMAILY', icon: '👤' },
            { id: 'sales', label: 'PRODEJE', icon: '💰' },
            { id: 'newsletter', label: 'NEWSLETTER', icon: '✉️' },
            { id: 'features', label: 'NASTAVENÍ', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
              style={{ fontFamily: NM }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/10 border-t-white" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* EMAILY TAB */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tighter" style={{ fontFamily: NM }}>LIST UŽIVATELŮ ({users.length})</h2>
                  <button onClick={handleExportCSV} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all" style={{ fontFamily: NM }}>
                    Stáhnout .CSV
                  </button>
                </div>
                
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[900px]">
                    <thead className="bg-white/5 border-b border-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Uživatel</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Kredity</th>
                        <th className="px-6 py-4">Využito</th>
                        <th className="px-4 py-4">Datum registrace</th>
                        <th className="px-6 py-4">Akce</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden">
                                {u.profile_image_url && <img src={u.profile_image_url} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <div className="overflow-hidden">
                                <div className="font-bold text-white truncate">{u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Anonymous'}</div>
                                <div className="text-gray-500 text-[10px] truncate uppercase tracking-wider">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><Badge role={u.role} /></td>
                          <td className="px-6 py-4 font-mono text-xs">{u.role === 'free' ? u.credits_remaining : '∞'}</td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">{u.credits_used_this_month}</td>
                          <td className="px-4 py-4 text-gray-500 text-[10px] font-bold">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={u.role}
                              onChange={e => changeRole(u.id, e.target.value)}
                              className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-white transition-all"
                            >
                              <option value="free">FREE</option>
                              <option value="pro">PRO</option>
                              <option value="unlimited">UNLIMITED</option>
                              <option value="admin">ADMIN</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* PRODEJE TAB */}
            {activeTab === 'sales' && (
              <motion.div key="sales" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-xl font-black tracking-tighter mb-8" style={{ fontFamily: NM }}>AKTIVNÍ PŘEDPLATNÁ ({paidUsers.length})</h2>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[800px]">
                    <thead className="bg-white/5 border-b border-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Uživatel</th>
                        <th className="px-6 py-4">Tarif</th>
                        <th className="px-6 py-4">Stav</th>
                        <th className="px-6 py-4">Konec období</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paidUsers.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold">{u.email}</td>
                          <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">{u.role}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${u.subscription_status === 'active' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-gray-500/30 text-gray-400 bg-gray-500/10'}`}>
                              {u.subscription_status || 'inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                            {u.current_period_end ? new Date(u.current_period_end).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* NEWSLETTER TAB */}
            {activeTab === 'newsletter' && (
              <motion.div key="newsletter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl">
                  <span className="text-4xl mb-4 block">✉️</span>
                  <h3 className="text-lg font-black tracking-tighter mb-2" style={{ fontFamily: NM }}>NEWSLETTER MODUL</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">Všichni registrovaní uživatelé jsou automaticky v databázi e-mailů k exportu.</p>
                </div>
              </motion.div>
            )}

            {/* NASTAVENÍ TAB */}
            {activeTab === 'features' && (
              <motion.div key="features" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tighter" style={{ fontFamily: NM }}>FEATURE FLAGS</h2>
                  <button onClick={resetCredits} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all" style={{ fontFamily: NM }}>
                    Resetovat kredity
                  </button>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[800px]">
                    <thead className="bg-white/5 border-b border-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Funkce</th>
                        <th className="px-6 py-4">Tarif</th>
                        <th className="px-6 py-4">Popis</th>
                        <th className="px-6 py-4">Stav</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {flags.map(f => (
                        <tr key={`${f.feature_key}-${f.plan}`} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-[10px] text-white uppercase tracking-wider">{f.feature_key}</td>
                          <td className="px-6 py-4"><Badge role={f.plan} /></td>
                          <td className="px-6 py-4 text-gray-500 text-xs">{f.description || '—'}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleFlag(f.feature_key, f.plan, !f.enabled)}
                              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${f.enabled ? 'bg-white' : 'bg-white/10'}`}
                            >
                              <span className={`inline-block h-3 w-3 transform rounded-full transition-transform ${f.enabled ? 'translate-x-6 bg-black' : 'translate-x-1 bg-gray-500'}`} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
