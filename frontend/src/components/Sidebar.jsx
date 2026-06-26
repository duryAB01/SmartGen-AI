import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, useVoiceJob } from '../App.jsx'
import { motion } from 'framer-motion'
import api from '../services/api.js'
import {
  MdDashboard,
  MdImage,
  MdRecordVoiceOver,
  MdEditNote,
  MdHistory,
  MdMessage,
  MdAccountCircle,
  MdClose,
  MdMenu,
  MdAdminPanelSettings,
  MdLogout,
  MdSettings,
  MdAutoAwesome
} from 'react-icons/md'


const NAV = [
  { icon: MdDashboard, label: 'Dashboard', path: '/dashboard', color: '#2563eb' },
  { icon: MdImage, label: 'Image Studio', path: '/image-gen', color: '#0f766e' },
  { icon: MdRecordVoiceOver, label: 'Voice Cloning', path: '/voice-cloning', color: '#14b8a6' },
  { icon: MdEditNote, label: 'Rewrite', path: '/rewrite', color: '#ffd93d' },
  { icon: MdHistory, label: 'History', path: '/history', color: '#8b7aff' },
  { icon: MdMessage, label: 'Feedback', path: '/feedback', color: '#ff6b9d' },
  { icon: MdSettings, label: 'Preferences', path: '/preferences', color: '#7c6af7' },
  { icon: MdAccountCircle, label: 'Profile', path: '/profile', color: '#a8afc7' }
];

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { job: voiceJob } = useVoiceJob()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true
    api.get('/auth/stats')
      .then((res) => { if (active) setStats(res.data?.stats || null) })
      .catch(() => {})
    return () => { active = false }
  }, [pathname])

  const go = (path) => { navigate(path); setOpen(false) }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="btn btn-secondary"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        onClick={() => setOpen(!open)}
        style={{ 
          position: 'fixed', 
          top: 20, 
          left: 20, 
          zIndex: 1100, 
          display: 'none',
          boxShadow: 'var(--shadow-lg)',
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          padding: '10px'
        }}
        id="mob-menu"
      >
        {open ? <MdClose size={20}/> : <MdMenu size={20}/>}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,11,26,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000
          }}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}><MdAutoAwesome size={18} /></div>
          <div>
            <div className="sidebar-logo-text" style={{ fontSize: 16 }}>SmartGen AI</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Content workspace</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Workspace</div>
          {NAV.map(({ icon: Icon, label, path, color }) => (
            <motion.button
              type="button"
              key={path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              aria-current={pathname === path ? 'page' : undefined}
              className={`nav-item ${pathname === path ? 'active' : ''}`}
              onClick={() => go(path)}
              style={{ position: 'relative', width: '100%', textAlign: 'left' }}
            >
              {pathname === path && (
                <motion.div 
                  layoutId="active-pill"
                  className="nav-item-active-bg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ background: `${color}15` }}
                />
              )}
              <Icon size={20} style={{ position: 'relative', zIndex: 1, color: pathname === path ? color : 'var(--text3)' }} />
              <span style={{ position: 'relative', zIndex: 1, color: pathname === path ? 'var(--text)' : 'var(--text2)' }}>{label}</span>
              {path === '/voice-cloning' && ['queued', 'processing'].includes(voiceJob?.status) && (
                <motion.span className="voice-nav-job-dot" animate={{ opacity: [0.45, 1, 0.45] }} transition={{ repeat: Infinity, duration: 1.4 }} title={voiceJob.stage} />
              )}
              {path === '/voice-cloning' && voiceJob?.status === 'completed' && (
                <span className="voice-nav-job-dot complete" title="Voice ready" />
              )}
            </motion.button>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>Admin</div>
              <motion.button
                type="button"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}
                onClick={() => go('/admin')}
                style={{ position: 'relative', width: '100%', textAlign: 'left' }}
              >
                {pathname === '/admin' && (
                  <motion.div 
                    layoutId="active-pill"
                    className="nav-item-active-bg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{ background: 'rgba(255, 77, 106, 0.15)' }}
                  />
                )}
                <MdAdminPanelSettings size={20} style={{ position: 'relative', zIndex: 1, color: pathname === '/admin' ? 'var(--danger)' : 'var(--text3)' }} />
                <span style={{ position: 'relative', zIndex: 1 }}>Admin Panel</span>
              </motion.button>
            </>
          )}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }}>
          <div className="sidebar-user-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 12, borderRadius: 'var(--radius)', background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#0a0b1a',
              boxShadow: '0 2px 8px rgba(0,245,160,0.2)',
              flexShrink: 0
            }}>
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>
                {user?.name || (user?.email ? user.email.split('@')[0] : 'User')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                {user?.role === 'admin' ? 'Administrator' : `${stats?.plan === 'starter' ? 'Starter' : 'Free'} Workspace`}
              </div>
              {stats && (
                <>
                  <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4 }}>
                    {stats.generationsThisMonth} generations this month
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                    {stats.remainingToday ?? 0} credits left today
                  </div>
                </>
              )}
            </div>
          </div>

          <motion.button
            type="button"
            className="nav-item" 
            onClick={() => { logout(); navigate('/') }} 
            style={{ color: 'var(--danger)', border: '1px solid rgba(225,29,72,0.18)', background: 'rgba(225,29,72,0.05)', width: '100%', textAlign: 'left' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MdLogout size={18} />
            Sign out
          </motion.button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          #mob-menu { display: flex !important; }
        }
      `}</style>
    </>
  )
}



