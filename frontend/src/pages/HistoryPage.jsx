import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import WorkspaceThemeToggle from '../components/WorkspaceThemeToggle.jsx'
import { useToast, useAuth } from '../App.jsx'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdHistory, MdContentCopy, MdDelete, MdSearch, MdFormatListBulleted,
  MdAccountCircle, MdSettings, MdAdminPanelSettings, MdLogout, MdFeedback, MdWorkspacePremium, MdRecordVoiceOver
} from 'react-icons/md'
import {
  FaCamera, FaHashtag, FaFileLines, FaBullhorn,
  FaEnvelope, FaWandMagicSparkles, FaArrowsRotate, FaImage
} from 'react-icons/fa6'
import api from '../services/api.js'

const TYPE_COLORS = {
  text: 'badge-green', image: 'badge-blue', rewrite: 'badge-purple', voice: 'badge-orange'
}
const TYPE_HEX = {
  text: '#00e5b0', image: '#00b8ff', rewrite: '#7c6af7', voice: '#ffb830'
}
const TYPE_ICONS = {
  text: FaWandMagicSparkles, image: FaImage, rewrite: FaArrowsRotate, voice: MdRecordVoiceOver
}

export default function HistoryPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [items, setItems]       = useState([])
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchHistory()
    
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchHistory = async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/content/history')
      setItems(res.data.history || [])
    } catch (err) {
      setError('Failed to load history. Please try again.')
      toast('Failed to load history.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this content item?')) return
    setDeleting(id)
    try {
      await api.delete(`/content/${id}`)
      setItems(prev => prev.filter(i => i._id !== id))
      toast('Entry deleted', 'info')
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const copy = (text) => { navigator.clipboard.writeText(text); toast('Copied!', 'success') }

  const filtered = items.filter(i =>
    (filter === 'all' || i.type === filter) &&
    (search === '' ||
      i.prompt?.toLowerCase().includes(search.toLowerCase()) ||
      i.result?.toLowerCase().includes(search.toLowerCase()))
  )

  const TYPES = ['all', 'text', 'image', 'rewrite', 'voice']
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
              Content History <span style={{ color: '#8b7aff', display: 'inline-flex' }}><MdHistory /></span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>View and manage your previously generated content drafts.</p>
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

        {/* Filters */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <MdSearch size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}/>
              <input placeholder="Search history prompts or results…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TYPES.map(t => (
                <motion.button key={t} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter(t)} style={{ textTransform: 'capitalize' }}>
                  {t === 'all'
                    ? <><MdFormatListBulleted size={16} style={{ marginRight: 6 }}/>All</>
                    : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{React.createElement(TYPE_ICONS[t] || FaWandMagicSparkles, { size: 14 })} {t}</span>}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="spinner" style={{ borderTopColor: 'var(--accent)', width: 36, height: 36, borderWidth: 3, margin: '0 auto 16px' }}/>
            <p style={{ color: 'var(--text2)' }}>Loading your history…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#ff4d6a' }}>
            <p>{error}</p>
            <motion.button whileHover={{ scale: 1.05 }} className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchHistory}>Retry</motion.button>
          </div>
        )}

        {/* List */}
        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="empty-state">
                <MdHistory size={48} style={{ margin: '0 auto 16px', color: 'var(--text3)' }}/>
                <h3>No drafts found</h3>
                <p>Generated content will appear here. Start by creating some content!</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/dashboard')}>
                  Generate Content
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="list" layout style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map((item, i) => {
                  const IconComp = TYPE_ICONS[item.type] || FaWandMagicSparkles
                  const color = TYPE_HEX[item.type] || '#00e5b0'
                  const isExp = expanded === item._id
                  
                  return (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: Math.min(i * 0.05, 0.3) }}
                      className="card card-glass"
                      style={{ padding: 18, borderLeft: `4px solid ${color}` }}
                    >
                      <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                          <div style={{ width: 34, height: 34, background: color + '15', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <IconComp size={16} color={color} />
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.prompt || 'No Prompt'}
                            </h4>
                            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                              Generated on {new Date(item.createdAt).toLocaleString()} {item.platform ? `· Platform: ${item.platform}` : ''} {item.tone ? `· Tone: ${item.tone}` : ''}
                            </p>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => setExpanded(isExp ? null : item._id)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: 12 }}>
                            {isExp ? 'Hide Draft' : 'Show Draft'}
                          </button>
                          <button onClick={() => copy(item.result)} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)', padding: '6px 10px' }} title="Copy Draft">
                            <MdContentCopy size={16} />
                          </button>
                          <button onClick={() => deleteItem(item._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '6px 10px' }} title="Delete Draft" disabled={deleting === item._id}>
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExp && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 14 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="output-box" style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: 14 }}>
                              {item.result}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}




