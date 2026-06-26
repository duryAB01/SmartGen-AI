import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import { useToast, useAuth } from '../App.jsx'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdSettings, MdSave, MdRefresh, MdCheckCircle, MdError,
  MdAccountCircle, MdAdminPanelSettings, MdLogout, MdRecordVoiceOver, MdDelete
} from 'react-icons/md'
import { FaUser, FaBullseye, FaGlobe } from 'react-icons/fa'
import api from '../services/api.js'
import WorkspaceThemeToggle from '../components/WorkspaceThemeToggle.jsx'
import { deleteDefaultVoiceSample, getDefaultVoiceSample } from '../services/voiceProfileStorage.js'

const TONE_OPTIONS     = ['Professional', 'Friendly', 'Casual', 'Creative', 'Persuasive', 'Formal']
const PLATFORM_OPTIONS = ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook', 'X', 'Threads', 'Pinterest', 'Snapchat', 'WhatsApp', 'Email', 'Blog', 'Website']
const BUSINESS_TYPES   = ['Technology', 'Marketing', 'Education', 'Healthcare', 'Finance', 'Retail', 'Consulting', 'Other']

export default function PreferencesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [tone, setTone]                   = useState('Professional')
  const [platform, setPlatform]           = useState('LinkedIn')
  const [businessType, setBusinessType]   = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [writingStyle, setWritingStyle]   = useState('')
  const [voiceTone, setVoiceTone]         = useState('Friendly')
  const [voiceSpeed, setVoiceSpeed]       = useState(1)
  const [voiceQuality, setVoiceQuality]   = useState('high')
  const [voiceVariation, setVoiceVariation] = useState('natural')
  const [voiceRemoveSilence, setVoiceRemoveSilence] = useState(true)
  const [voiceNaturalize, setVoiceNaturalize] = useState(true)
  const [savedVoice, setSavedVoice]       = useState(null)
  const [savedVoiceUrl, setSavedVoiceUrl] = useState('')
  const [loading, setLoading]             = useState(false)
  const [fetching, setFetching]           = useState(true)
  const [errors, setErrors]               = useState({})
  const [showDropdown, setShowDropdown] = useState(false)
  
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchPrefs()
    
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => () => {
    if (savedVoiceUrl) URL.revokeObjectURL(savedVoiceUrl)
  }, [savedVoiceUrl])

  const fetchPrefs = async () => {
    setFetching(true)
    try {
      const res = await api.get('/preferences')
      const p   = res.data.preferences || {}
      setTone(p.preferredTone || 'Professional')
      setPlatform(p.preferredPlatform || 'LinkedIn')
      setBusinessType(p.businessType || '')
      setTargetAudience(p.targetAudience || '')
      setWritingStyle(p.writingStyle || '')
      setVoiceTone(p.preferredVoiceTone || 'Friendly')
      setVoiceSpeed(Number(p.preferredVoiceSpeed) || 1)
      setVoiceQuality(p.preferredVoiceQuality || 'high')
      setVoiceVariation(p.preferredVoiceVariation || 'natural')
      setVoiceRemoveSilence(p.preferredVoiceRemoveSilence !== false)
      setVoiceNaturalize(p.preferredVoiceNaturalize !== false)

      try {
        const localVoice = await getDefaultVoiceSample(user?._id || user?.id || user?.email || 'local')
        if (localVoice) {
          setSavedVoice(localVoice)
          setSavedVoiceUrl(URL.createObjectURL(localVoice.file))
        }
      } catch {
        // Local voice storage is optional and may be unavailable in private browsing.
      }
    } catch (err) {
      console.warn('Could not load preferences:', err.message)
    } finally {
      setFetching(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!tone.trim())    newErrors.tone    = 'Please select a preferred tone'
    if (!platform.trim()) newErrors.platform = 'Please select a preferred platform'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) { toast('Please fill in all required fields', 'error'); return }
    setLoading(true)
    try {
      await api.put('/preferences', {
        preferredTone: tone,
        preferredPlatform: platform,
        businessType,
        targetAudience,
        writingStyle,
        preferredVoiceTone: voiceTone,
        preferredVoiceSpeed: voiceSpeed,
        preferredVoiceQuality: voiceQuality,
        preferredVoiceVariation: voiceVariation,
        preferredVoiceRemoveSilence: voiceRemoveSilence,
        preferredVoiceNaturalize: voiceNaturalize
      })
      setErrors({})
      toast('Preferences saved successfully!', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save preferences.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setTone('Professional'); setPlatform('LinkedIn')
    setBusinessType(''); setTargetAudience(''); setWritingStyle('')
    setVoiceTone('Friendly'); setVoiceSpeed(1); setVoiceQuality('high')
    setVoiceVariation('natural'); setVoiceRemoveSilence(true); setVoiceNaturalize(true)
    setErrors({})
    toast('Preferences reset to defaults', 'info')
  }

  const handleRemoveSavedVoice = async () => {
    try {
      await deleteDefaultVoiceSample(user?._id || user?.id || user?.email || 'local')
      if (savedVoiceUrl) URL.revokeObjectURL(savedVoiceUrl)
      setSavedVoice(null)
      setSavedVoiceUrl('')
      toast('Default voice removed from this device.', 'info')
    } catch {
      toast('Could not remove the saved voice.', 'error')
    }
  }

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User')
  const avatarLetter = (user?.name || user?.email || 'U')[0].toUpperCase()

  if (fetching) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="spinner" style={{ borderTopColor: 'var(--accent)', width: 36, height: 36, borderWidth: 3, margin: '0 auto 16px' }}/>
            <p style={{ color: 'var(--text2)' }}>Loading preferences…</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        
        {/* ── Navbar/Header ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              User Preferences <span style={{ color: '#7c6af7', display: 'inline-flex' }}><MdSettings /></span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Personalize your AI content generation experience. Applied automatically to every generation.</p>
          </div>
          
          {/* Avatar dropdown */}
          <div className="workspace-header-actions">
            <WorkspaceThemeToggle />
            <div style={{ position: 'relative', flexShrink: 0 }} ref={dropdownRef}>
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

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="card card-glass" style={{ maxWidth: '620px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #7c6af7, #00b8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 14px rgba(124,106,247,0.3)' }}>
              <MdSettings size={30} color="white" />
            </div>
            <h2 style={{ marginBottom: 8, color: 'var(--text)', fontSize: 20 }}>Personalize Your Experience</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Set default options to save time and align copies with your brand voice.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Tone */}
            <div className="form-group">
              <label className="form-label"><MdSettings size={14} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--accent3)' }} />Preferred Tone *</label>
              <select value={tone} onChange={(e) => { setTone(e.target.value); if (errors.tone) setErrors({...errors, tone: ''}) }} className={errors.tone ? 'error' : ''}>
                {TONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.tone && <div style={{ fontSize: 12, color: '#ff4d6a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><MdError size={12}/>{errors.tone}</div>}
            </div>

            {/* Platform */}
            <div className="form-group">
              <label className="form-label"><FaGlobe size={13} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--accent2)' }} />Preferred Platform *</label>
              <select value={platform} onChange={(e) => { setPlatform(e.target.value); if (errors.platform) setErrors({...errors, platform: ''}) }} className={errors.platform ? 'error' : ''}>
                {PLATFORM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.platform && <div style={{ fontSize: 12, color: '#ff4d6a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><MdError size={12}/>{errors.platform}</div>}
            </div>

            {/* Business Type */}
            <div className="form-group">
              <label className="form-label"><FaUser size={13} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--accent)' }} />Business Type</label>
              <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                <option value="">Select your industry / type (optional)</option>
                {BUSINESS_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Target Audience */}
            <div className="form-group">
              <label className="form-label"><FaBullseye size={13} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--accent4)' }} />Target Audience</label>
              <textarea placeholder="Describe your target audience (e.g. tech entrepreneurs, designers, retail buyers...)" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} style={{ minHeight: 80, resize: 'vertical' }} />
              <div className="form-hint">Helps the AI adapt output hooks specifically for your target demographic</div>
            </div>

            {/* Writing Style */}
            <div className="form-group">
              <label className="form-label"><MdSettings size={14} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--accent5)' }} />Writing Style Instructions</label>
              <input placeholder="e.g. Use short paragraphs, avoid exclamation marks, write in active voice..." value={writingStyle} onChange={(e) => setWritingStyle(e.target.value)} />
              <div className="form-hint">Specific writing instructions or rules to enforce on output copies</div>
            </div>

            <section className="preferences-voice-section">
              <div className="preferences-section-heading">
                <span><MdRecordVoiceOver /></span>
                <div>
                  <h3>Voice Cloning Defaults</h3>
                  <p>These settings load automatically in Voice Cloning.</p>
                </div>
              </div>

              <div className="preferences-voice-grid">
                <label>
                  <span>Default tone</span>
                  <select value={voiceTone} onChange={(event) => setVoiceTone(event.target.value)}>
                    {['Calm', 'Friendly', 'Energetic', 'Serious'].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Quality</span>
                  <select value={voiceQuality} onChange={(event) => setVoiceQuality(event.target.value)}>
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label>
                  <span>Variation</span>
                  <select value={voiceVariation} onChange={(event) => setVoiceVariation(event.target.value)}>
                    <option value="stable">Stable</option>
                    <option value="natural">Natural</option>
                  </select>
                </label>
                <label className="preferences-speed-control">
                  <span>Speed <strong>{voiceSpeed.toFixed(2)}x</strong></span>
                  <input type="range" min="0.8" max="1.2" step="0.05" value={voiceSpeed} onChange={(event) => setVoiceSpeed(Number(event.target.value))} />
                </label>
              </div>

              <div className="preferences-voice-toggles">
                <label><input type="checkbox" checked={voiceNaturalize} onChange={(event) => setVoiceNaturalize(event.target.checked)} /><span>Conversational delivery</span></label>
                <label><input type="checkbox" checked={voiceRemoveSilence} onChange={(event) => setVoiceRemoveSilence(event.target.checked)} /><span>Trim extra silence</span></label>
              </div>

              <div className="preferences-saved-voice">
                {savedVoice ? (
                  <>
                    <div className="preferences-saved-voice-info">
                      <MdRecordVoiceOver />
                      <div>
                        <strong>Default voice on this device</strong>
                        <span>{savedVoice.fileName} - {(savedVoice.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                    {savedVoiceUrl && <audio controls src={savedVoiceUrl}>Audio playback is unavailable.</audio>}
                    <button type="button" className="btn btn-ghost btn-sm voice-delete-button" onClick={handleRemoveSavedVoice}><MdDelete /> Remove</button>
                  </>
                ) : (
                  <>
                    <div className="preferences-saved-voice-info">
                      <MdRecordVoiceOver />
                      <div><strong>No default voice saved</strong><span>Save one from the Voice Cloning page.</span></div>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/voice-cloning')}>Open Voice Cloning</button>
                  </>
                )}
              </div>
              <p className="preferences-local-note">Voice audio stays in this browser only. It is not stored in SmartGen's database.</p>
            </section>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleSave} disabled={loading}>
                {loading
                  ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="spinner"/>&nbsp;Saving…</>
                  : <><MdSave size={16} /> Save Settings</>}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn btn-secondary" style={{ padding: '12px 20px' }}
                onClick={handleReset} disabled={loading}>
                Reset Defaults
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}




