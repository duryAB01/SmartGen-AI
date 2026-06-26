import React, { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import WorkspaceThemeToggle from '../components/WorkspaceThemeToggle.jsx'
import { useToast, useAuth } from '../App.jsx'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdEditNote, MdAutoAwesome, MdContentCopy, MdSave,
  MdRefresh, MdDelete, MdAccountCircle, MdSettings,
  MdAdminPanelSettings, MdLogout
} from 'react-icons/md'
import { FaPen, FaMagic, FaCompress, FaExpand } from 'react-icons/fa'
import api from '../services/api.js'
import getApiErrorMessage from '../utils/getApiErrorMessage.js'
import LoadingState from '../components/LoadingState.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import { PlatformSelector, ToneSelector, UsageRemainingBadge, AutoSavedIndicator, GenerateButton } from '../components/GenerationControls.jsx'

const REWRITE_ACTIONS = [
  { id: 'grammar',      label: 'Improve Grammar',    icon: MdEditNote, color: '#00b8ff' },
  { id: 'shorten',      label: 'Shorten',            icon: FaCompress, color: '#ff4d6a' },
  { id: 'expand',       label: 'Expand',             icon: FaExpand,   color: '#00e5b0' },
  { id: 'formalize',    label: 'Make Professional',  icon: FaPen,      color: '#ffb830' },
  { id: 'casualize',    label: 'Make Casual',        icon: FaMagic,    color: '#7c6af7' },
  { id: 'creative',     label: 'Make Creative',      icon: FaMagic,    color: '#ff6b9d' },
]

const TONES = ['Professional', 'Casual', 'Creative', 'Formal', 'Friendly']
const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'X', 'Threads', 'WhatsApp', 'Blog', 'Pinterest', 'Email', 'Business']

export default function RewritePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [input, setInput]     = useState('')
  const [action, setAction]   = useState('grammar')
  const [tone, setTone]       = useState('Professional')
  const [platform, setPlatform] = useState('General')
  const [output, setOutput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [stats, setStats] = useState(null)
  const [autoSaved, setAutoSaved] = useState(false)
  
  const dropdownRef = useRef(null)

  useEffect(() => {
    api.get('/auth/stats').then((res) => setStats(res.data?.stats || null)).catch(() => {})
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRewrite = async () => {
    if (loading) return // prevent double-click
    if (!input.trim()) { toast('Please enter some text to rewrite.', 'error'); return }
    setLoading(true); setOutput(''); setError(''); setAutoSaved(false)

    try {
      const res = await api.post('/content/rewrite', {
        inputText: input,
        rewriteAction: action,
        tone,
        platform
      })
      setOutput(res.data.result || '')
      setAutoSaved(Boolean(res.data.autoSaved))
      api.get('/auth/stats').then((statsRes) => setStats(statsRes.data?.stats || null)).catch(() => {})
      toast(res.data.autoSaved ? 'Content rewritten and auto-saved!' : 'Content rewritten successfully!', 'success')
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Rewrite failed. Please try again.')
      if (process.env.NODE_ENV !== 'production') {
        console.error('[RewritePage] rewrite error:', err)
      }
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveContent = async () => {
    if (!output) { toast('Nothing to save yet.', 'error'); return }
    setSaving(true)
    try {
      await api.post('/content/save', {
        type: 'rewrite',
        prompt: input.substring(0, 200),
        inputText: input,
        result: output,
        tone,
        platform,
        contentType: action,
        metadata: { rewriteAction: action }
      })
      toast('Content saved to history!', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = () => { navigator.clipboard.writeText(output); toast('Copied to clipboard!', 'success') }
  const clearInput      = () => { setInput(''); setOutput(''); toast('Input cleared!', 'info') }

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User')
  const avatarLetter = (user?.name || user?.email || 'U')[0].toUpperCase()

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        
        {/* â”€â”€ Navbar/Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              Rewrite Content <span style={{ color: '#ffb830', display: 'inline-flex' }}><MdEditNote /></span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Transform your text with AI-powered rewriting and refinement tools.</p>
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
                  {user?.role === 'admin' && <button onClick={() => { navigate('/admin'); setShowDropdown(false) }} className="avatar-dropdown-item" style={{ color: 'var(--accent3)' }}><MdAdminPanelSettings size={16}/> Admin Panel</button>}
                  <div style={{ borderTop: '1px solid var(--border)' }} />
                  <button onClick={() => { logout(); navigate('/') }} className="avatar-dropdown-item" style={{ color: 'var(--danger)' }}><MdLogout size={16}/> Sign Out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Section */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>Original Text</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{input.length} characters</span>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={clearInput} style={{ color: '#ff4d6a' }}>
                <MdDelete size={16} />
              </motion.button>
            </div>
          </div>

          <textarea
            placeholder="Paste your text here to rewrite or improve it..."
            value={input} onChange={(e) => setInput(e.target.value)}
            style={{ minHeight: 180, marginBottom: 20, fontSize: 14, lineHeight: 1.6, resize: 'vertical' }}
          />

          {/* Action Buttons */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>Rewrite Action</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {REWRITE_ACTIONS.map((act) => (
                <motion.button key={act.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className={`btn ${action === act.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setAction(act.id)}
                  style={{ justifyContent: 'center', border: action === act.id ? `1px solid ${act.color}44` : '1px solid var(--border)', background: action === act.id ? `${act.color}15` : 'var(--bg)' }}>
                  <act.icon size={16} style={{ marginRight: 8, color: action === act.id ? act.color : 'var(--text3)' }} />
                  <span style={{ color: action === act.id ? act.color : 'var(--text)' }}>{act.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Target Platform</label>
              <PlatformSelector platforms={PLATFORMS} value={platform} onChange={setPlatform} />
            </div>
            <div className="form-group">
              <label className="form-label">Target Tone</label>
              <ToneSelector tones={TONES} value={tone} onChange={setTone} />
            </div>
          </div>
          <div style={{ margin: '4px 0 12px' }}><UsageRemainingBadge stats={stats} /></div>
          <GenerateButton loading={loading} disabled={!input.trim()} onClick={handleRewrite}>Rewrite Content</GenerateButton>
        </motion.div>

        {/* Output Section */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>Rewritten Content</div>
            {output && (
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={handleRewrite} title="Regenerate" style={{ color: '#7c6af7' }}><MdRefresh size={18}/></motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={copyToClipboard} title="Copy" style={{ color: '#00b8ff' }}><MdContentCopy size={18}/></motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={saveContent} title="Save" style={{ color: '#ffb830' }} disabled={saving}><MdSave size={18}/></motion.button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LoadingState label="AI is refining your text..." />
              </motion.div>
            )}
            {!loading && !output && !error && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
                <MdEditNote size={48} style={{ color: 'var(--text3)' }} />
                <h3>Your rewritten text will appear here</h3>
                <p style={{ fontSize: 13 }}>Fill in the details above and click Rewrite Content</p>
              </motion.div>
            )}
            {!loading && error && (
              <motion.div key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <ErrorAlert message={error} />
              </motion.div>
            )}
            {!loading && output && (
              <motion.div key="output" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="output-box" style={{ whiteSpace: 'pre-line' }}>{output}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{output.length} characters</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-green">AI Processed</span>
                    <AutoSavedIndicator visible={autoSaved} />
                    <span className="badge badge-blue">{REWRITE_ACTIONS.find(a => a.id === action)?.label}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  )
}

