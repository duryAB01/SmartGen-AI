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
import { FaInstagram, FaFacebook, FaLinkedin, FaTiktok, FaYoutube, FaXTwitter, FaThreads, FaPinterest, FaSnapchat, FaWhatsapp, FaEnvelope, FaPenNib, FaEarthAmericas, FaHashtag, FaBullhorn } from 'react-icons/fa6'
import api from '../services/api.js'
import getApiErrorMessage from '../utils/getApiErrorMessage.js'
import LoadingState from '../components/LoadingState.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import { PlatformDropdownSelector, OutputTypeSelector, ToneSelector, UsageRemainingBadge, AutoSavedIndicator, GenerateButton } from '../components/GenerationControls.jsx'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, color: '#E1306C', accent: '#F77737', summary: 'Reels, captions, carousels, and hashtags.' },
  { id: 'tiktok', label: 'TikTok', icon: FaTiktok, color: '#00F2EA', accent: '#FF0050', summary: 'Short video captions, hooks, and hashtag sets.' },
  { id: 'youtube', label: 'YouTube', icon: FaYoutube, color: '#FF0033', accent: '#FF6B6B', summary: 'Thumbnails, descriptions, community posts, and tags.' },
  { id: 'linkedin', label: 'LinkedIn', icon: FaLinkedin, color: '#0A66C2', accent: '#70B5F9', summary: 'Professional image posts and carousel copy.' },
  { id: 'facebook', label: 'Facebook', icon: FaFacebook, color: '#1877F2', accent: '#8AB4F8', summary: 'Warm page posts, community updates, and promos.' },
  { id: 'twitter', label: 'X', icon: FaXTwitter, color: '#F8FAFC', accent: '#94A3B8', summary: 'Concise image posts, hooks, replies, and tags.' },
  { id: 'threads', label: 'Threads', icon: FaThreads, color: '#F8FAFC', accent: '#A78BFA', summary: 'Conversational image posts and casual hooks.' },
  { id: 'pinterest', label: 'Pinterest', icon: FaPinterest, color: '#E60023', accent: '#FF8AA1', summary: 'Pin titles, descriptions, boards, and keywords.' },
  { id: 'snapchat', label: 'Snapchat', icon: FaSnapchat, color: '#FFFC00', accent: '#FFF7AD', summary: 'Story captions, overlays, and spotlight hooks.' },
  { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, color: '#25D366', accent: '#86EFAC', summary: 'Status text, broadcasts, and friendly promos.' },
  { id: 'email', label: 'Email', icon: FaEnvelope, color: '#FFB830', accent: '#FDE68A', summary: 'Subject lines and image-led announcement copy.' },
  { id: 'blog', label: 'Blog', icon: FaPenNib, color: '#FF5722', accent: '#FDBA74', summary: 'SEO-friendly image context and article support.' },
  { id: 'website', label: 'Website', icon: FaEarthAmericas, color: '#00E5B0', accent: '#67E8F9', summary: 'Hero copy, product descriptions, and CTA lines.' }
]

const PLATFORM_FORMATS = {
  instagram: [
    { id: 'reel-caption', label: 'Reel Caption', icon: MdImage, color: '#E1306C' },
    { id: 'post-caption', label: 'Post Caption', icon: FaInstagram, color: '#F77737' },
    { id: 'carousel-caption', label: 'Carousel Caption', icon: MdAutoAwesome, color: '#A78BFA' },
    { id: 'story-text', label: 'Story Text', icon: MdAutoAwesome, color: '#00D4FF' },
    { id: 'hashtag-set', label: 'Hashtag Set', icon: FaHashtag, color: '#00E5B0' }
  ],
  tiktok: [
    { id: 'video-caption', label: 'Video Caption', icon: FaTiktok, color: '#00F2EA' },
    { id: 'hook', label: 'Hook', icon: MdAutoAwesome, color: '#FF0050' },
    { id: 'short-description', label: 'Short Description', icon: MdImage, color: '#A78BFA' },
    { id: 'hashtag-set', label: 'Hashtags', icon: FaHashtag, color: '#00E5B0' },
    { id: 'cta', label: 'CTA', icon: FaBullhorn, color: '#FFD93D' }
  ],
  youtube: [
    { id: 'thumbnail-title', label: 'Thumbnail Title', icon: FaYoutube, color: '#FF0033' },
    { id: 'shorts-caption', label: 'Shorts Caption', icon: MdImage, color: '#FF6B6B' },
    { id: 'video-description', label: 'Video Description', icon: MdAutoAwesome, color: '#A78BFA' },
    { id: 'community-post', label: 'Community Post', icon: FaBullhorn, color: '#38BDF8' },
    { id: 'tags', label: 'Tags', icon: FaHashtag, color: '#00E5B0' }
  ],
  linkedin: [
    { id: 'professional-post', label: 'Professional Post', icon: FaLinkedin, color: '#0A66C2' },
    { id: 'carousel-text', label: 'Carousel Text', icon: MdImage, color: '#70B5F9' },
    { id: 'article-intro', label: 'Article Intro', icon: FaPenNib, color: '#A78BFA' },
    { id: 'cta', label: 'CTA', icon: FaBullhorn, color: '#FFD93D' },
    { id: 'hashtag-set', label: 'Hashtags', icon: FaHashtag, color: '#00E5B0' }
  ],
  facebook: [
    { id: 'page-post', label: 'Page Post', icon: FaFacebook, color: '#1877F2' },
    { id: 'event-promo', label: 'Event Promo', icon: FaBullhorn, color: '#FFD93D' },
    { id: 'product-post', label: 'Product Post', icon: MdImage, color: '#8AB4F8' },
    { id: 'community-update', label: 'Community Update', icon: MdAutoAwesome, color: '#00E5B0' },
    { id: 'hashtag-set', label: 'Hashtags', icon: FaHashtag, color: '#38BDF8' }
  ],
  twitter: [
    { id: 'tweet', label: 'Tweet', icon: FaXTwitter, color: '#F8FAFC' },
    { id: 'thread', label: 'Thread', icon: FaThreads, color: '#A78BFA' },
    { id: 'hook', label: 'Hook', icon: MdAutoAwesome, color: '#00E5B0' },
    { id: 'reply', label: 'Reply', icon: MdImage, color: '#38BDF8' },
    { id: 'hashtag-set', label: 'Hashtags', icon: FaHashtag, color: '#94A3B8' }
  ],
  threads: [
    { id: 'thread-post', label: 'Thread Post', icon: FaThreads, color: '#F8FAFC' },
    { id: 'conversational-post', label: 'Conversational Post', icon: MdImage, color: '#A78BFA' },
    { id: 'hook', label: 'Hook', icon: MdAutoAwesome, color: '#00E5B0' },
    { id: 'cta', label: 'CTA', icon: FaBullhorn, color: '#FFD93D' }
  ],
  pinterest: [
    { id: 'pin-title', label: 'Pin Title', icon: FaPinterest, color: '#E60023' },
    { id: 'pin-description', label: 'Pin Description', icon: MdImage, color: '#FF8AA1' },
    { id: 'board-description', label: 'Board Description', icon: MdAutoAwesome, color: '#A78BFA' },
    { id: 'keywords', label: 'Keywords', icon: FaHashtag, color: '#00E5B0' },
    { id: 'cta', label: 'CTA', icon: FaBullhorn, color: '#FFD93D' }
  ],
  snapchat: [
    { id: 'story-caption', label: 'Story Caption', icon: FaSnapchat, color: '#FFFC00' },
    { id: 'overlay-text', label: 'Overlay Text', icon: MdImage, color: '#38BDF8' },
    { id: 'spotlight-hook', label: 'Spotlight Hook', icon: MdAutoAwesome, color: '#00E5B0' },
    { id: 'cta', label: 'CTA', icon: FaBullhorn, color: '#FFD93D' }
  ],
  whatsapp: [
    { id: 'status-text', label: 'Status Text', icon: FaWhatsapp, color: '#25D366' },
    { id: 'broadcast-message', label: 'Broadcast Message', icon: MdImage, color: '#86EFAC' },
    { id: 'short-promo', label: 'Short Promo', icon: FaBullhorn, color: '#FFB830' },
    { id: 'friendly-message', label: 'Friendly Message', icon: MdAutoAwesome, color: '#00E5B0' }
  ],
  email: [
    { id: 'subject-line', label: 'Subject Line', icon: FaEnvelope, color: '#FFB830' },
    { id: 'image-email', label: 'Image Email', icon: MdImage, color: '#38BDF8' },
    { id: 'announcement', label: 'Announcement', icon: FaBullhorn, color: '#FFD93D' },
    { id: 'cta', label: 'CTA', icon: MdAutoAwesome, color: '#00E5B0' }
  ],
  blog: [
    { id: 'blog-title', label: 'Blog Title', icon: FaPenNib, color: '#FF5722' },
    { id: 'introduction', label: 'Introduction', icon: MdImage, color: '#FDBA74' },
    { id: 'meta-description', label: 'Meta Description', icon: MdAutoAwesome, color: '#38BDF8' },
    { id: 'seo-keywords', label: 'SEO Keywords', icon: FaHashtag, color: '#00E5B0' },
    { id: 'cta', label: 'CTA', icon: FaBullhorn, color: '#FFD93D' }
  ],
  website: [
    { id: 'hero-copy', label: 'Hero Copy', icon: FaEarthAmericas, color: '#00E5B0' },
    { id: 'product-description', label: 'Product Description', icon: MdImage, color: '#7C6AF7' },
    { id: 'landing-copy', label: 'Landing Copy', icon: FaPenNib, color: '#38BDF8' },
    { id: 'cta-lines', label: 'CTA Lines', icon: FaBullhorn, color: '#FFD93D' }
  ]
}

const LEGACY_CONTENT_TYPE_MAP = {
  caption: 'post-caption',
  hashtags: 'hashtag-set',
  product: 'product-description',
  social: 'page-post',
  marketing: 'cta'
}

const getImageFormats = (platformId) => PLATFORM_FORMATS[platformId] || PLATFORM_FORMATS.instagram
const normalizeImageContentType = (platformId, type) => {
  const formats = getImageFormats(platformId)
  const mapped = LEGACY_CONTENT_TYPE_MAP[type] || type
  return formats.some((item) => item.id === mapped) ? mapped : formats[0].id
}
const TONES = ['Professional', 'Friendly', 'Creative', 'Casual', 'Persuasive']

export default function ImageGeneratorPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [image, setImage]           = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [prompt, setPrompt]         = useState('')
  const [contentType, setContentType] = useState('reel-caption')
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

  // Pre-fill prompt when navigating from Playground
  useEffect(() => {
    const initial = location.state?.initialPrompt
    if (initial) {
      setPrompt(initial)
      navigate('/image-gen', { replace: true, state: null })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    const selectedPlatform = draft?.platform || platform
    const selectedContentType = normalizeImageContentType(selectedPlatform, draft?.contentType || contentType)
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
    const draftPlatform = draft.platform || 'instagram'
    setPlatform(draftPlatform)
    setContentType(normalizeImageContentType(draftPlatform, draft.contentType || 'reel-caption'))
    setTone(draft.tone || 'Professional')
    navigate('/image-gen', { replace: true, state: null })

    if (location.state?.autoGenerate) {
      handleGenerate({
        image: draft.file,
        prompt: draft.prompt || '',
        platform: draftPlatform,
        contentType: normalizeImageContentType(draftPlatform, draft.contentType || 'reel-caption'),
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

  const platformMeta = PLATFORMS.find((item) => item.id === platform) || PLATFORMS[0]
  const formatOptions = getImageFormats(platform)
  const selectedFormat = formatOptions.find((item) => item.id === contentType) || formatOptions[0]

  const handlePlatformChange = (nextPlatform) => {
    setPlatform(nextPlatform)
    setContentType((current) => normalizeImageContentType(nextPlatform, current))
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        
        {/* ── Navbar/Header ─────────────────────────────────────────────────── */}
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
                <PlatformDropdownSelector platforms={PLATFORMS} value={platform} onChange={handlePlatformChange} title="Select platform" hint="Image format options update automatically." />
              </div>
              <div className="form-group">
                <div className="dashboard-format-header" style={{ marginBottom: 10 }}>
                  <span>Choose {platformMeta.label} format</span>
                  <strong>{selectedFormat.label}</strong>
                </div>
                <OutputTypeSelector options={formatOptions} value={contentType} onChange={setContentType} />
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
                        <span className="badge badge-blue">{selectedFormat.label}</span>
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
            <span>• Use high-quality images for better analysis</span>
            <span>• Add specific prompts for targeted content</span>
            <span>• Different platforms require different tones</span>
            <span>• Max file size: 5MB (JPG, PNG, WEBP only)</span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}







