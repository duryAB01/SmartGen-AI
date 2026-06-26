import React, { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import WorkspaceThemeToggle from '../components/WorkspaceThemeToggle.jsx'
import { useToast, useAuth } from '../App.jsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdImage, MdCloudUpload, MdAutoAwesome, MdContentCopy, MdSave,
  MdRefresh, MdDelete, MdCheckCircle, MdAccountCircle,
  MdSettings, MdAdminPanelSettings, MdLogout
} from 'react-icons/md'
import { FaInstagram, FaFacebook, FaLinkedin } from 'react-icons/fa'
import api from '../services/api.js'
import getApiErrorMessage from '../utils/getApiErrorMessage.js'
import LoadingState from '../components/LoadingState.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import { PlatformSelector, OutputTypeSelector, ToneSelector, UsageRemainingBadge, AutoSavedIndicator, GenerateButton } from '../components/GenerationControls.jsx'

const CONTENT_TYPES = [
  { id: 'caption',    label: 'Image Caption',      color: '#00e5b0' },
  { id: 'hashtags',   label: 'Hashtags',            color: '#00b8ff' },
  { id: 'product',    label: 'Product Description', color: '#7c6af7' },
  { id: 'social',     label: 'Social Media Post',   color: '#ff4d6a' },
  { id: 'marketing',  label: 'Marketing Copy',      color: '#ffb830' },
]

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, color: '#E4405F' },
  { id: 'facebook',  label: 'Facebook',  icon: FaFacebook,  color: '#1877F2' },
  { id: 'linkedin',  label: 'LinkedIn',  icon: FaLinkedin,  color: '#0077B5' },
  { id: 'blog',      label: 'Blog',      color: '#7c6af7' },
  { id: 'general',   label: 'General',   color: '#8a8fa8' },
]

const TONES = ['Professional', 'Friendly', 'Creative', 'Casual', 'Persuasive']

export default function ImageGeneratorPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [image, setImage]           = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [prompt, setPrompt]         = useState('')
  const [contentType, setContentType] = useState('caption')
  const [platform, setPlatform]     = useState('instagram')
  const [tone, setTone]             = useState('Professional')
  const [output, setOutput]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [stats, setStats] = useState(null)
  const [autoSaved, setAutoSaved] = useState(false)
  
  const fileInputRef = useRef(null)
  const dropdownRef = useRef(null)
  const landingDraftConsumedRef = useRef(false)

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

  const validateImage = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast('Please upload a valid image file (JPG, PNG, or WEBP)', 'error')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image size must be less than 5MB', 'error')
      return false
    }
    return true
  }

  const handleFileSelect = (file) => {
    if (!validateImage(file)) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    toast('Image uploaded successfully!', 'success')
  }

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop      = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]) }
  const handleFileInputChange = (e) => { if (e.target.files.length > 0) handleFileSelect(e.target.files[0]) }

  const removeImage = () => {
    setImage(null); setImagePreview(''); setOutput('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleGenerate = async (draft = null) => {
    if (loading) return
    const selectedImage = draft?.image || image
    const selectedPrompt = draft?.prompt ?? prompt
    const selectedContentType = draft?.contentType || contentType
    const selectedPlatform = draft?.platform || platform
    const selectedTone = draft?.tone || tone

    if (!selectedImage) {
      toast('Please upload an image first', 'error')
      return
    }

    setLoading(true)
    setOutput('')
    setAutoSaved(false)
    setError('')

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)
      formData.append('prompt', selectedPrompt)
      formData.append('contentType', selectedContentType)
      formData.append('platform', selectedPlatform)
      formData.append('tone', selectedTone)

      const res = await api.post('/content/generate-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setOutput(res.data.result || '')
      setAutoSaved(Boolean(res.data.autoSaved))
      api.get('/auth/stats').then((statsRes) => setStats(statsRes.data?.stats || null)).catch(() => {})
      toast(res.data.autoSaved ? 'Content generated and auto-saved!' : 'Content generated successfully!', 'success')
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Image generation failed. Please try again.')
      if (import.meta.env.DEV) console.error('[ImageGenerator] generate error:', err)
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const draft = location.state?.imageDraft
    if (landingDraftConsumedRef.current || !draft?.file) return

    landingDraftConsumedRef.current = true
    if (!validateImage(draft.file)) {
      navigate('/image-gen', { replace: true, state: null })
      return
    }

    handleFileSelect(draft.file)
    setPrompt(draft.prompt || '')
    setContentType(draft.contentType || 'caption')
    setPlatform(draft.platform || 'instagram')
    setTone(draft.tone || 'Professional')
    navigate('/image-gen', { replace: true, state: null })

    if (location.state?.autoGenerate) {
      handleGenerate({
        image: draft.file,
        prompt: draft.prompt || '',
        contentType: draft.contentType || 'caption',
        platform: draft.platform || 'instagram',
        tone: draft.tone || 'Professional'
      })
    }
  }, [])
  const saveContent = async () => {
    if (!output) { toast('Nothing to save yet.', 'error'); return }
    setSaving(true)
    try {
      await api.post('/content/save', {
        type: 'image',
        prompt: prompt || 'Image upload',
        result: output,
        tone,
        platform,
        contentType,
        metadata: { imageName: image?.name, imageSize: image?.size }
      })
      toast('Content saved to history!', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = () => { navigator.clipboard.writeText(output); toast('Copied to clipboard!', 'success') }

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
              Image Content Generator <span style={{ color: '#00e5b0', display: 'inline-flex' }}><MdImage /></span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Upload an image and let AI generate context-aware captions, hashtags, and marketing content.</p>
          </div>
          
          {/* Avatar dropdown */}
          <div className="workspace-header-actions" style={{ position: 'relative', flexShrink: 0 }} ref={dropdownRef}>
            <WorkspaceThemeToggle />
            <button onClick={() => setShowDropdown(!showDropdown)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', padding: '6px 14px', border: '1px solid var(--border)', borderRadius: '99px', cursor: 'pointer', outline: 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#07080d', fontWeight: 700, display: 'flex', alignItems: 'center', justifyBetween: 'center', justifyContent: 'center', fontSize: 13, boxShadow: '0 2px 8px rgba(0,245,160,0.2)' }}>
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

        <div className="tool-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Input Panel */}
          <div className="fade-up-1">
            {/* Image Upload */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>
                1. Upload Your Image
              </div>

              {!image ? (
                <div
                  className={`upload-area ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: `2px dashed ${isDragging ? '#00e5b0' : 'var(--border)'}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: isDragging ? 'rgba(0,229,176,0.05)' : 'var(--bg)', transition: 'all 0.3s ease' }}
                >
                  <motion.div animate={{ scale: isDragging ? 1.1 : 1 }}>
                    <MdCloudUpload size={48} color={isDragging ? '#00e5b0' : 'var(--text3)'} style={{ marginBottom: 16 }} />
                  </motion.div>
                  <h3 style={{ marginBottom: 8, color: isDragging ? '#00e5b0' : 'var(--text)' }}>
                    {isDragging ? 'Drop your image here' : 'Drag & Drop your image'}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>or click to browse</p>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>Supports: JPG, PNG, WEBP (Max 5MB)</div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={imagePreview} alt="Uploaded" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={removeImage}
                      className="btn btn-ghost btn-sm"
                      style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MdDelete size={16} />
                    </motion.button>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text2)' }}>
                    <MdCheckCircle color="#00e5b0" style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    {image.name} ({(image.size / 1024).toFixed(1)} KB)
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileInputChange} style={{ display: 'none' }} />
            </motion.div>

            {/* Content Settings */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="card">
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>
                2. Content Settings
              </div>
              <div className="form-group">
                <label className="form-label">Optional Prompt</label>
                <textarea placeholder="Add any specific context or requirements..." value={prompt} onChange={e => setPrompt(e.target.value)} style={{ minHeight: 80 }} />
                <div className="form-hint">Helps AI generate more relevant content</div>
              </div>
              <div className="form-group">
                <label className="form-label">Platform</label>
                <PlatformSelector platforms={PLATFORMS} value={platform} onChange={setPlatform} />
              </div>
              <div className="form-group">
                <label className="form-label">Output Type</label>
                <OutputTypeSelector options={CONTENT_TYPES} value={contentType} onChange={setContentType} />
              </div>
              <div className="form-group">
                <label className="form-label">Tone</label>
                <ToneSelector tones={TONES} value={tone} onChange={setTone} />
              </div>
              <div style={{ margin: '4px 0 12px' }}><UsageRemainingBadge stats={stats} /></div>
              <GenerateButton loading={loading} disabled={!image} onClick={handleGenerate}>Generate Content</GenerateButton>
            </motion.div>
          </div>

          {/* Output Panel */}
          <div className="fade-up-2">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>3. Generated Content</div>
                {output && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={handleGenerate} title="Regenerate" style={{ color: '#7c6af7' }}><MdRefresh size={18}/></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={copyToClipboard} title="Copy" style={{ color: '#00b8ff' }}><MdContentCopy size={18}/></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={saveContent} title="Save" style={{ color: '#ffb830' }} disabled={saving}><MdSave size={18}/></motion.button>
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, minHeight: '300px', display: 'flex', alignItems: 'center' }}>
                    <LoadingState label="AI is analyzing your image..." />
                  </motion.div>
                )}
                {!loading && !output && !error && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state" style={{ flex: 1, minHeight: '300px' }}>
                    <div style={{ color: '#00e5b0', marginBottom: 16 }}><MdImage size={48} /></div>
                    <h3>Your content will appear here</h3>
                    <p style={{ fontSize: 13 }}>Upload an image and click Generate</p>
                  </motion.div>
                )}
                {!loading && error && (
                  <motion.div key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, minHeight: '300px' }}>
                    <ErrorAlert message={error} />
                  </motion.div>
                )}
                {!loading && output && (
                  <motion.div key="output" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="output-box" style={{ flex: 1, whiteSpace: 'pre-line' }}>{output}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{output.length} characters</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span className="badge badge-green">AI Generated</span>
                        <AutoSavedIndicator visible={autoSaved} />
                        <span className="badge badge-blue">{CONTENT_TYPES.find(c => c.id === contentType)?.label}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Tips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card" style={{ marginTop: 24, background: 'rgba(0,245,160,0.04)', borderColor: 'rgba(0,245,160,0.15)' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: '#00e5b0', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdCheckCircle /> PRO TIPS
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: 13, color: 'var(--text2)' }}>
            <span>â€¢ Use high-quality images for better analysis</span>
            <span>â€¢ Add specific prompts for targeted content</span>
            <span>â€¢ Different platforms require different tones</span>
            <span>â€¢ Max file size: 5MB (JPG, PNG, WEBP only)</span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}


