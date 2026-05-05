import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API = '/api/admin';

function Badge({ role }) {
  const styles = {
    admin: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    pro: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    free: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${styles[role] || styles.free}`}>
      {role?.toUpperCase()}
    </span>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
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

  async function changeRole(userId, role) {
    const res = await fetch(`${API}/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      setMessage(`User role updated to ${role}`);
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

  const freeUsers = users.filter(u => u.role === 'free').length;
  const proUsers = users.filter(u => u.role === 'pro').length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

  if (loading || !user) {
    return <div className="min-h-screen bg-[#050a13] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#050a13] text-white">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(5,10,19,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,165,0,0.2)' }}>
        <div className="flex items-center gap-3">
          <span className="text-orange-400 font-bold">⚙️ Admin Panel</span>
          <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">TypeBeatz</span>
        </div>
        <button onClick={() => navigate('/app')} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to App
        </button>
      </div>

      <div className="pt-20 p-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', val: users.length, color: 'text-white' },
            { label: 'Free Users', val: freeUsers, color: 'text-gray-300' },
            { label: 'PRO Users', val: proUsers, color: 'text-blue-400' },
            { label: 'Admins', val: adminUsers, color: 'text-orange-400' }
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className={`text-3xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {message && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-sm">
            ✓ {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['users', 'features'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}>
              {tab === 'users' ? '👤 Users' : '🚩 Feature Flags'}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">All Users ({users.length})</h2>
                  <button onClick={resetCredits}
                    className="px-4 py-2 rounded-lg text-sm border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                    🔄 Reset Monthly Credits
                  </button>
                </div>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }} className="text-gray-400 text-left">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Credits Left</th>
                        <th className="px-4 py-3">Used This Month</th>
                        <th className="px-4 py-3">Joined</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {u.profile_image_url && (
                                <img src={u.profile_image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                              )}
                              <div>
                                <div className="font-medium text-white">
                                  {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Unknown'}
                                </div>
                                <div className="text-gray-500 text-xs">{u.email || u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge role={u.role} /></td>
                          <td className="px-4 py-3">
                            <span className={u.role === 'pro' || u.role === 'admin' ? 'text-blue-400' : 'text-white'}>
                              {u.role === 'pro' || u.role === 'admin' ? '∞' : (u.credits_remaining ?? '—')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400">{u.credits_used_this_month ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={e => changeRole(u.id, e.target.value)}
                              className="bg-transparent border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-400"
                              style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <option value="free">Free</option>
                              <option value="pro">PRO</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No users yet</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Feature Flags Tab */}
            {activeTab === 'features' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-lg font-semibold mb-4">Feature Flags</h2>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }} className="text-gray-400 text-left">
                        <th className="px-4 py-3">Feature</th>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Enabled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flags.map((f, i) => (
                        <tr key={`${f.feature_key}-${f.plan}`} className="border-t border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-mono text-xs text-blue-300">{f.feature_key}</td>
                          <td className="px-4 py-3"><Badge role={f.plan} /></td>
                          <td className="px-4 py-3 text-gray-400">{f.description || '—'}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleFlag(f.feature_key, f.plan, !f.enabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f.enabled ? 'bg-blue-500' : 'bg-gray-600'}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${f.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
