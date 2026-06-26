import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import WorkspaceThemeToggle from '../components/WorkspaceThemeToggle.jsx'
import { useAuth, useToast } from '../App.jsx'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MdSave, MdVpnKey, MdError, MdPerson,
  MdAccountCircle, MdSettings, MdAdminPanelSettings, MdLogout, MdHistory, MdFeedback, MdWorkspacePremium
} from 'react-icons/md'
import { FaUserCircle } from 'react-icons/fa'
import api from '../services/api.js'

export default function ProfilePage() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [form, setForm]     = useState({ name: user?.name || '', email: user?.email || '' })
  const [pwdForm, setPwd]   = useState({ current: '', newPwd: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [contentCount, setContentCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchCount()
    
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchCount = async () => {
    try {
      const res = await api.get('/content/history')
      setContentCount(res.data.count || 0)
    } catch { /* fail silently */ }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast('Name cannot be empty', 'error'); return }
    if (!form.email.trim()) { toast('Email cannot be empty', 'error'); return }
    setSaving(true)
    try {
      const res = await api.put('/auth/profile', {
        name: form.name.trim(),
        email: form.email.trim()
      })
      if (res.data.success) {
        login(res.data.user, localStorage.getItem('scg_token'))
        toast('Profile updated successfully!', 'success')
      } else {
        throw new Error(res.data.message || 'Failed to update profile.')
      }
    } catch (err) {
      toast(err.response?.data?.message || err.message || 'Failed to update profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (!pwdForm.current)                    { toast('Current password is required', 'error'); return }
    if (pwdForm.newPwd.length < 6)           { toast('Password must be at least 6 characters', 'error'); return }
    if (pwdForm.newPwd !== pwdForm.confirm)  { toast('Passwords do not match', 'error'); return }
    setPwdSaving(true)
    try {
      const res = await api.put('/auth/password', {
        currentPassword: pwdForm.current,
        newPassword: pwdForm.newPwd
      })
      if (res.data.success) {
        toast('Password changed successfully!', 'success')
        setPwd({ current: '', newPwd: '', confirm: '' })
      } else {
        throw new Error(res.data.message || 'Failed to change password.')
      }
    } catch (err) {
      toast(err.response?.data?.message || err.message || 'Failed to change password.', 'error')
    } finally {
      setPwdSaving(false)
    }
  }

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User')
  const avatarLetter = (user?.name || user?.email || 'U')[0].toUpperCase()

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        
        {/* ── Navbar/Header ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              My Profile <span style={{ color: '#8a8fa8', display: 'inline-flex' }}><FaUserCircle /></span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Manage your account settings, statistics, and change password.</p>
          </div>
          
          {/* Avatar dropdown */}
          <div className="workspace-header-actions" style={{ position: 'relative', flexShrink: 0 }} ref={dropdownRef}>
            <WorkspaceThemeToggle />
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── Profile info ─────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="card card-glass">
            {/* Avatar + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <motion.div whileHover={{ rotate: 5, scale: 1.05 }} style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, color: '#07080d',
                boxShadow: '0 4px 12px rgba(0,245,160,0.25)'
              }}>
                {avatarLetter}
              </motion.div>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>{displayName}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{user?.email}</div>
                <span className={`badge ${user?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`} style={{ marginTop: 8 }}>
                  {user?.role === 'admin' ? '⚡ Admin' : '👤 User'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
              {[
                { label: 'Content Generated', value: contentCount },
                { label: 'Account Type',      value: user?.role === 'admin' ? 'Admin' : 'Free' }
              ].map(({ label, value }) => (
                <motion.div key={label} whileHover={{ y: -2 }} style={{ flex: 1, background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>{label}</div>
                </motion.div>
              ))}
            </div>

            {/* Edit form */}
            <form onSubmit={saveProfile}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <MdPerson size={14}/> Account Details
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary" type="submit" disabled={saving}>
                {saving
                  ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="spinner"/>&nbsp;Saving…</>
                  : <><MdSave size={15} style={{ marginRight: 6 }}/> Save Changes</>}
              </motion.button>
            </form>
          </motion.div>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Password */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="card card-glass">
              <form onSubmit={changePassword}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <MdVpnKey size={14}/> Change Password
                </div>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" value={pwdForm.current} onChange={e => setPwd(f => ({...f, current: e.target.value}))} placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" value={pwdForm.newPwd} onChange={e => setPwd(f => ({...f, newPwd: e.target.value}))} placeholder="Min. 6 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" value={pwdForm.confirm} onChange={e => setPwd(f => ({...f, confirm: e.target.value}))} placeholder="Re-enter new password" />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-secondary" type="submit" disabled={pwdSaving}>
                  {pwdSaving
                    ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="spinner"/>
                    : <><MdVpnKey size={15} style={{ marginRight: 6 }}/> Update Password</>}
                </motion.button>
              </form>
            </motion.div>

            {/* Danger zone */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="card card-glass" style={{ borderColor: 'rgba(255,77,106,0.2)', background: 'rgba(255,77,106,0.03)' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <MdError size={16} style={{ marginRight: 6, verticalAlign: 'middle' }}/> Danger Zone
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-danger btn-sm"
                onClick={() => toast('Account deletion requires admin confirmation.', 'info')}>
                Delete My Account
              </motion.button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}


