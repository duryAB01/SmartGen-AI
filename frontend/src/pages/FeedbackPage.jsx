import React, { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import WorkspaceThemeToggle from '../components/WorkspaceThemeToggle.jsx'
import { useToast, useAuth } from '../App.jsx'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MdMessage, MdSend, MdThumbUp, MdFlag, MdStar, MdCheckCircle, MdError,
  MdAccountCircle, MdSettings, MdAdminPanelSettings, MdLogout, MdHistory, MdFeedback, MdWorkspacePremium
} from 'react-icons/md'
import api from '../services/api.js'

const CATEGORIES = ['Content Quality', 'Accuracy', 'Relevance', 'Ease of Use', 'Response Speed', 'Other']

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="stars">
      {[1,2,3,4,5].map(s => (
        <motion.span 
          key={s} 
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className={`star ${s <= (hover || value) ? 'filled' : ''}`}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{ cursor: 'pointer', transition: 'color 0.2s' }}
        >★</motion.span>
      ))}
    </div>
  )
}

export default function FeedbackPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [rating, setRating]     = useState(0)
  const [comment, setComment]   = useState('')
  const [category, setCategory] = useState('Content Quality')
  const [report, setReport]     = useState('')
  const [tab, setTab]           = useState('rate')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (tab === 'rate' && rating === 0) { toast('Please select a rating', 'error'); return }
    if (tab === 'report' && !report.trim()) { toast('Please describe the issue', 'error'); return }
    setLoading(true)

    try {
      const payload = {
        type: tab,
        category: category,
        comment: tab === 'rate' ? comment : report
      }
      if (tab === 'rate') {
        payload.rating = rating
      }
      const res = await api.post('/feedback', payload)
      if (res.data.success) {
        setSubmitted(true)
        toast('Thank you for your feedback! 🙏', 'success')
      } else {
        throw new Error(res.data.message || 'Submission failed')
      }
    } catch (err) {
      toast(err.response?.data?.message || err.message || 'Failed to submit feedback.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User')
  const avatarLetter = (user?.name || user?.email || 'U')[0].toUpperCase()

  if (submitted) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', flexCol: 'column', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center" 
          style={{ maxWidth: 400 }}
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: 'var(--accent)', marginBottom: 24, display: 'flex', justifyContent: 'center' }}
          >
            <MdCheckCircle size={80} />
          </motion.div>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontFamily: 'var(--font-head)', fontSize: 26, marginBottom: 12 }}
          >Thanks for the feedback!</motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ color: 'var(--text2)', marginBottom: 32 }}
          >Your feedback helps us improve the quality of AI-generated content for everyone.</motion.p>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center' }}
          >
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary" onClick={() => { setSubmitted(false); setRating(0); setComment(''); setReport('') }}>
              Submit Another
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </motion.button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        
        {/* ── Navbar/Header ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              Feedback &amp; Ratings <span style={{ color: '#ff4d6a', display: 'inline-flex' }}><MdMessage /></span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Help us improve by rating generated content or reporting system errors.</p>
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

        <div className="tool-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Main form */}
          <div className="fade-up-1">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="tabs" 
              style={{ marginBottom: 20 }}
            >
              <div className={`tab ${tab === 'rate' ? 'active' : ''}`} onClick={() => setTab('rate')}>
                 <MdThumbUp size={16} style={{ display: 'inline', marginRight: 6, color: tab === 'rate' ? '#00e5b0' : 'inherit' }}/> Rate Content
               </div>
               <div className={`tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>
                 <MdFlag size={16} style={{ display: 'inline', marginRight: 6, color: tab === 'report' ? '#ff4d6a' : 'inherit' }}/> Report Issue
               </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card card-glass"
            >
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {tab === 'rate' ? (
                    <motion.div 
                      key="rate"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      <div className="form-group">
                        <label className="form-label">Overall Rating</label>
                        <StarRating value={rating} onChange={setRating} />
                        <div className="form-hint" style={{ height: 20 }}>
                          {rating === 0 && 'Click to select stars'}
                          {rating === 1 && 'Poor — content was not useful'}
                          {rating === 2 && 'Below average — needs improvement'}
                          {rating === 3 && 'Average — decent but could be better'}
                          {rating === 4 && 'Good — mostly satisfied'}
                          {rating === 5 && 'Excellent — exactly what I needed! 🎉'}
                        </div>
                      </div>

                      <div className="form-group" style={{ marginTop: 12 }}>
                        <label className="form-label">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)}>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Comments <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
                        <textarea
                          placeholder="Tell us what you liked or what could be improved in the outputs…"
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          style={{ minHeight: 120 }}
                        />
                        <div className="form-hint">{comment.length}/500 characters</div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="report"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      <div style={{
                        background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.2)',
                        borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 20, fontSize: 13, color: 'var(--text2)'
                      }}>
                        <strong style={{ color: 'var(--danger)' }}><MdError size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/> System Error / Report</strong><br/>
                        Report inaccurate, slow, inappropriate outputs or any interface issues.
                      </div>

                      <div className="form-group">
                        <label className="form-label">Issue Type</label>
                        <select value={category} onChange={e => setCategory(e.target.value)}>
                          {['Inaccurate Information', 'Inappropriate Content', 'Off-Topic Output', 'Technical Error', 'Other Issue'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Describe the Issue <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <textarea
                          placeholder="Please describe the issue in detail. What failed? What content was problematic?"
                          value={report}
                          onChange={e => setReport(e.target.value)}
                          style={{ minHeight: 140 }}
                          required
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-primary" 
                  type="submit" 
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                >
                  {loading ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="spinner"/>&nbsp;Submitting…</> : <><MdSend size={18} style={{ marginRight: 8 }}/> Submit Feedback</>}
                </motion.button>
              </form>
            </motion.div>
          </div>

          {/* Stats panel */}
          <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Info panel */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card" 
              style={{ background: 'rgba(0,245,160,0.03)', borderColor: 'rgba(0,245,160,0.15)' }}
            >
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--accent)', marginBottom: 8 }}>Your Feedback Matters</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>Every rating and report is directly reviewed to improve content generation and adapt prompt variables.</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text2)' }}>
                Rating Breakdown
              </div>
              {[['5 ★', 58], ['4 ★', 29], ['3 ★', 8], ['2 ★', 3], ['1 ★', 2]].map(([label, pct], i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)', width: 28 }}>{label}</span>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.5 + i * 0.1 }} className="progress-fill" style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', width: 30, textAlign: 'right' }}>{pct}%</span>
                </div>
              ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text2)' }}>
                Why Feedback Matters
              </div>
              <ul style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, paddingLeft: 16 }}>
                <li>Helps tune Gemini generation prompts</li>
                <li>Identifies slow API response rates</li>
                <li>Supports overall feature mapping</li>
                <li>Ensures a reliable workspace for all</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}


