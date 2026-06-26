import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import WorkspaceThemeToggle from '../components/WorkspaceThemeToggle.jsx'
import { useToast, useAuth } from '../App.jsx'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdAnalytics, MdPeople, MdAutoAwesome, MdSpeed,
  MdCheckCircle, MdError, MdRefresh,
  MdAccountCircle, MdSettings, MdAdminPanelSettings, MdLogout, MdHistory, MdFeedback, MdWorkspacePremium
} from 'react-icons/md'
import api from '../services/api.js'

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, title, value, subtitle, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card card-glass"
      style={{ background: `linear-gradient(135deg, ${color}08 0%, ${color}02 100%)`, borderColor: `${color}20` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(icon, { size: 24, color })}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{subtitle}</div>
    </motion.div>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
        <span style={{ textTransform: 'capitalize' }}>{label}</span>
        <span style={{ color }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  const dropdownRef = useRef(null)

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError(null)
    try {
      const res = await api.get('/admin/stats')
      setStats(res.data.stats)
      if (isRefresh) toast('Statistics refreshed', 'success')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load admin statistics.'
      setError(msg)
      if (!isRefresh) toast(msg, 'error')
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User')
  const avatarLetter = (user?.name || user?.email || 'U')[0].toUpperCase()

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="spinner"
              style={{ borderTopColor: 'var(--accent)', width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px' }}/>
            <p style={{ color: 'var(--text2)' }}>Loading admin statistics…</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="card" style={{ textAlign: 'center', padding: 60, borderColor: 'rgba(255,77,106,0.3)', background: 'rgba(255,77,106,0.05)' }}>
            <MdError size={48} color="#ff4d6a" style={{ marginBottom: 16 }} />
            <h3 style={{ color: '#ff4d6a', marginBottom: 8 }}>Failed to Load Statistics</h3>
            <p style={{ color: 'var(--text2)', marginBottom: 24 }}>{error}</p>
            <motion.button whileHover={{ scale: 1.05 }} className="btn btn-primary" onClick={() => fetchStats()}>
              <MdRefresh size={18} style={{ marginRight: 8 }} /> Retry
            </motion.button>
          </div>
        </main>
      </div>
    )
  }

  const maxContent = Math.max(stats.textCount, stats.imageCount, stats.rewriteCount, 1)

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        
        {/* ── Navbar/Header ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              Analytics Dashboard <span style={{ color: '#7c6af7', display: 'inline-flex' }}><MdAnalytics /></span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Real-time system performance and user activity from MongoDB.</p>
          </div>
          
          {/* Avatar dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <WorkspaceThemeToggle />

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-secondary btn-sm"
              onClick={() => fetchStats(true)} disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {refreshing
                ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="spinner" />Ref...</>
                : <><MdRefresh size={16} />Refresh</>}
            </motion.button>

            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', padding: '6px 14px', border: '1px solid var(--border)', borderRadius: '99px', cursor: 'pointer', outline: 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#07080d', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, boxShadow: '0 2px 8px rgba(0,245,160,0.2)' }}>
                  {avatarLetter}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }} className="md:block hidden">{displayName}</span>
              </button>
              
              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="avatar-dropdown"
                  >
                    <div className="avatar-dropdown-header">
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{displayName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                    </div>
                    <button onClick={() => { navigate('/profile'); setShowDropdown(false) }} className="avatar-dropdown-item"><MdAccountCircle size={16}/> My Profile</button>
                    <button onClick={() => { navigate('/preferences'); setShowDropdown(false) }} className="avatar-dropdown-item"><MdSettings size={16}/> Settings</button>
                  <button onClick={() => { navigate('/history'); setShowDropdown(false) }} className="avatar-dropdown-item"><MdHistory size={16}/> History</button>
                  <button onClick={() => { navigate('/feedback'); setShowDropdown(false) }} className="avatar-dropdown-item"><MdFeedback size={16}/> Feedback</button>
                  <button onClick={() => { navigate('/dashboard', { state: { openUpgrade: true } }); setShowDropdown(false) }} className="avatar-dropdown-item"><MdWorkspacePremium size={16}/> Upgrade to Pro</button>
                    {user?.role === 'admin' && <button onClick={() => { navigate('/admin'); setShowDropdown(false) }} className="avatar-dropdown-item" style={{ color: 'var(--accent3)' }}><MdAdminPanelSettings size={16}/> Admin Panel</button>}
                    <div style={{ borderTop: '1px solid var(--border)' }} />
                    <button onClick={() => { logout(); navigate('/') }} className="avatar-dropdown-item" style={{ color: 'var(--danger)' }}><MdLogout size={16}/> Sign Out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Stats Cards ──────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
          <StatCard icon={<MdPeople />}      title="Total Users"          value={stats.totalUsers}         subtitle="Registered accounts"       color="#00b8ff" />
          <StatCard icon={<MdAutoAwesome />}  title="Total Content"        value={stats.totalContent}       subtitle="All saved generations"      color="#7c6af7" />
          <StatCard icon={<MdAutoAwesome />}  title="Text Generations"     value={stats.textCount}          subtitle="Text content created"       color="#00e5b0" />
          <StatCard icon={<MdAutoAwesome />}  title="Image Generations"    value={stats.imageCount}         subtitle="Image content created"      color="#ff4d6a" />
          <StatCard icon={<MdAutoAwesome />}  title="Rewrite Requests"     value={stats.rewriteCount}       subtitle="Content rewrites"           color="#ffb830" />
          <StatCard icon={<MdCheckCircle />}  title="Total API Requests"   value={stats.totalRequests}      subtitle="All analytics events"       color="#00b8ff" />
          <StatCard icon={<MdCheckCircle />}  title="Successful Requests"  value={stats.successfulRequests} subtitle="Status: success"            color="#00e5b0" />
          <StatCard icon={<MdError />}        title="Failed Requests"      value={stats.failedRequests}     subtitle="Status: failure"            color="#ff4d6a" />
          <StatCard icon={<MdSpeed />}        title="Avg Response Time"    value={`${stats.averageResponseTime}ms`} subtitle="Per API request"   color="#ffb830" />
        </div>

        {/* ── Content Breakdown + Recent Content ───────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Content type breakdown */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card card-glass">
            <h3 style={{ marginBottom: 20, color: 'var(--text)' }}>Content Type Breakdown</h3>
            <MiniBar label="Text Generations"  value={stats.textCount}    max={maxContent} color="#00e5b0" />
            <MiniBar label="Image Generations" value={stats.imageCount}   max={maxContent} color="#00b8ff" />
            <MiniBar label="Rewrite Requests"  value={stats.rewriteCount} max={maxContent} color="#7c6af7" />
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>Total Saved</span>
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>{stats.totalContent}</span>
            </div>
          </motion.div>

          {/* Request status breakdown */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card card-glass">
            <h3 style={{ marginBottom: 20, color: 'var(--text)' }}>Request Status</h3>
            <MiniBar label="Successful" value={stats.successfulRequests} max={Math.max(stats.totalRequests, 1)} color="#00e5b0" />
            <MiniBar label="Failed"     value={stats.failedRequests}     max={Math.max(stats.totalRequests, 1)} color="#ff4d6a" />
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>Success Rate</span>
                <span style={{ color: '#00e5b0', fontWeight: 700 }}>
                  {stats.totalRequests > 0 ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>Avg Response</span>
                <span style={{ color: '#ffb830', fontWeight: 700 }}>{stats.averageResponseTime}ms</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Recent Content ────────────────────────────────────────────────── */}
        {stats.recentContent && stats.recentContent.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card card-glass" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, color: 'var(--text)' }}>Recent Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.recentContent.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span className={`badge ${item.type === 'text' ? 'badge-green' : item.type === 'image' ? 'badge-blue' : 'badge-purple'}`} style={{ minWidth: 60, textAlign: 'center' }}>
                    {item.type}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.prompt?.substring(0, 60) || 'No prompt'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {item.userId?.name || 'Unknown'} · {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {item.platform && <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{item.platform}</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Recent Analytics Logs ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card card-glass">
          <h3 style={{ marginBottom: 20, color: 'var(--text)' }}>Recent Activity Logs</h3>
          {stats.recentLogs && stats.recentLogs.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Module', 'Action', 'Status', 'Response Time', 'User', 'Timestamp'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text3)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLogs.map((log, i) => (
                    <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg3)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{log.moduleName}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{log.action}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={`badge ${log.status === 'success' ? 'badge-green' : 'badge-orange'}`} style={{ color: log.status === 'success' ? '#00e5b0' : '#ff4d6a' }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text3)' }}>{log.responseTime}ms</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text3)' }}>{log.userId?.name || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                        {new Date(log.requestTimestamp).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
              <MdAnalytics size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p>No logs yet. Logs appear after users interact with the system.</p>
            </div>
          )}
        </motion.div>

        {/* Performance summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card card-glass"
          style={{ marginTop: 24, background: 'rgba(124, 106, 247, 0.04)', borderColor: 'rgba(124, 106, 247, 0.15)' }}>
          <h3 style={{ marginBottom: 16, color: '#7c6af7', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdAnalytics /> System Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              <strong>Total Users:</strong> {stats.totalUsers.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              <strong>Total Saved Content:</strong> {stats.totalContent.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              <strong>API Success Rate:</strong> {stats.totalRequests > 0 ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) : 0}%
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              <strong>Avg Response Time:</strong> {stats.averageResponseTime}ms
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}




