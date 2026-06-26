import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import WorkspaceThemeToggle from '../components/WorkspaceThemeToggle.jsx'
import { useToast, useAuth } from '../App.jsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdAutoAwesome, MdContentCopy, MdDownload, MdSave,
  MdRefresh, MdStar, MdInfoOutline, MdAccountCircle,
  MdSettings, MdAdminPanelSettings, MdLogout, MdHistory,
  MdExpandMore, MdRecordVoiceOver, MdImage
} from 'react-icons/md'
import {
  FaHashtag, FaFileLines, FaBullhorn, FaEnvelope,
  FaCamera, FaWandMagicSparkles, FaRegLightbulb,
  FaInstagram, FaLinkedin, FaFacebook, FaArrowsRotate,
  FaImage, FaTiktok, FaYoutube, FaXTwitter, FaThreads,
  FaPinterest, FaSnapchat, FaWhatsapp, FaPenNib, FaEarthAmericas
} from 'react-icons/fa6'
import api from '../services/api.js'
import getApiErrorMessage from '../utils/getApiErrorMessage.js'
import AnimatedEmojiToggle from '../components/AnimatedEmojiToggle.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import UpgradeProModal from '../components/UpgradeProModal.jsx'
import { AutoSavedIndicator, UsageRemainingBadge } from '../components/GenerationControls.jsx'

const CONTENT_TYPES = [
  { id: 'post-caption',  label: 'Post Caption', icon: FaCamera,      color: '#00f5a0' },
  { id: 'hashtag-set',   label: 'Hashtag Set',  icon: FaHashtag,     color: '#00d4ff' },
  { id: 'blog-snippet',  label: 'Blog Snippet', icon: FaFileLines,   color: '#8b7aff' },
  { id: 'ad-promo-copy', label: 'Ad Copy',      icon: FaBullhorn,    color: '#ffd93d' },
  { id: 'short-form',    label: 'Short Form',   icon: MdAutoAwesome, color: '#ff6b9d' },
  { id: 'email-draft',   label: 'Email Draft',  icon: FaEnvelope,    color: '#00f5a0' },
]

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, color: '#E1306C', accent: '#F77737' },
  { id: 'tiktok',    label: 'TikTok',    icon: FaTiktok,    color: '#00F2EA', accent: '#FF0050' },
  { id: 'youtube',   label: 'YouTube',   icon: FaYoutube,   color: '#FF0033', accent: '#FF6B6B' },
  { id: 'linkedin',  label: 'LinkedIn',  icon: FaLinkedin,  color: '#0A66C2', accent: '#70B5F9' },
  { id: 'facebook',  label: 'Facebook',  icon: FaFacebook,  color: '#1877F2', accent: '#8AB4F8' },
  { id: 'twitter',   label: 'X',         icon: FaXTwitter,  color: '#F8FAFC', accent: '#94A3B8' },
  { id: 'threads',   label: 'Threads',   icon: FaThreads,   color: '#F8FAFC', accent: '#A78BFA' },
  { id: 'pinterest', label: 'Pinterest', icon: FaPinterest, color: '#E60023', accent: '#FF8AA1' },
  { id: 'snapchat',  label: 'Snapchat',  icon: FaSnapchat,  color: '#FFFC00', accent: '#FFF7AD' },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: FaWhatsapp,  color: '#25D366', accent: '#86EFAC' },
  { id: 'email',     label: 'Email',     icon: FaEnvelope,  color: '#FFB830', accent: '#FDE68A' },
  { id: 'blog',      label: 'Blog',      icon: FaPenNib,    color: '#FF5722', accent: '#FDBA74' },
  { id: 'website',   label: 'Website',   icon: FaEarthAmericas, color: '#00E5B0', accent: '#67E8F9' }
]

const TONES = [
  { id: 'Professional', label: 'Professional', desc: 'Clear business voice' },
  { id: 'Friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { id: 'Creative', label: 'Creative', desc: 'Fresh hooks and ideas' },
  { id: 'Casual', label: 'Casual', desc: 'Relaxed social style' },
  { id: 'Persuasive', label: 'Persuasive', desc: 'Conversion focused' },
  { id: 'Formal', label: 'Formal', desc: 'Polished and precise' },
]

const PLATFORM_FORMATS = {
  instagram: [
    { id: 'reel-caption', label: 'Reel Caption', icon: FaCamera, color: '#E1306C' },
    { id: 'post-caption', label: 'Post Caption', icon: FaInstagram, color: '#F77737' },
    { id: 'carousel-caption', label: 'Carousel Caption', icon: FaFileLines, color: '#A78BFA' },
    { id: 'story-text', label: 'Story Text', icon: MdAutoAwesome, color: '#00D4FF' },
    { id: 'hashtag-set', label: 'Hashtag Set', icon: FaHashtag, color: '#00E5B0' },
  ],
  tiktok: [
    { id: 'tiktok-caption', label: 'TikTok Caption', icon: FaTiktok, color: '#00F2EA' },
    { id: 'hook-caption', label: 'Hook + Caption', icon: MdAutoAwesome, color: '#FF0050' },
    { id: 'video-script', label: 'Video Script', icon: FaFileLines, color: '#A78BFA' },
    { id: 'on-screen-text', label: 'On-screen Text', icon: FaCamera, color: '#FFD93D' },
    { id: 'five-hashtags', label: '5 Hashtags', icon: FaHashtag, color: '#00E5B0' },
  ],
  youtube: [
    { id: 'shorts-title', label: 'Shorts Title', icon: FaYoutube, color: '#FF0033' },
    { id: 'long-video-title', label: 'Long Video Title', icon: FaFileLines, color: '#FF6B6B' },
    { id: 'youtube-description', label: 'Description', icon: FaFileLines, color: '#A78BFA' },
    { id: 'chapters', label: 'Chapters', icon: MdAutoAwesome, color: '#38BDF8' },
    { id: 'pinned-comment', label: 'Pinned Comment', icon: FaRegLightbulb, color: '#FFD93D' },
  ],
  linkedin: [
    { id: 'professional-post', label: 'Professional Post', icon: FaLinkedin, color: '#0A66C2' },
    { id: 'article-intro', label: 'Article Intro', icon: FaFileLines, color: '#70B5F9' },
    { id: 'hiring-post', label: 'Hiring Post', icon: FaBullhorn, color: '#FFD93D' },
    { id: 'thought-leadership', label: 'Thought Leadership', icon: FaRegLightbulb, color: '#A78BFA' },
  ],
  facebook: [
    { id: 'page-post', label: 'Page Post', icon: FaFacebook, color: '#1877F2' },
    { id: 'group-post', label: 'Group Post', icon: FaFileLines, color: '#8AB4F8' },
    { id: 'event-promo', label: 'Event Promo', icon: FaBullhorn, color: '#FFD93D' },
    { id: 'community-update', label: 'Community Update', icon: FaRegLightbulb, color: '#00E5B0' },
  ],
  twitter: [
    { id: 'single-post', label: 'Single Post', icon: FaXTwitter, color: '#F8FAFC' },
    { id: 'thread-starter', label: 'Thread Starter', icon: FaThreads, color: '#A78BFA' },
    { id: 'reply-post', label: 'Reply Post', icon: FaFileLines, color: '#38BDF8' },
    { id: 'punchy-hook', label: 'Punchy Hook', icon: MdAutoAwesome, color: '#00E5B0' },
  ],
  email: [
    { id: 'email-draft', label: 'Email Draft', icon: FaEnvelope, color: '#FFB830' },
    { id: 'subject-lines', label: 'Subject Lines', icon: MdAutoAwesome, color: '#38BDF8' },
    { id: 'follow-up-email', label: 'Follow-up Email', icon: FaFileLines, color: '#A78BFA' },
  ],
  blog: [
    { id: 'blog-snippet', label: 'Blog Snippet', icon: FaPenNib, color: '#FF5722' },
    { id: 'seo-intro', label: 'SEO Intro', icon: FaFileLines, color: '#00E5B0' },
    { id: 'outline', label: 'Outline', icon: FaRegLightbulb, color: '#FFD93D' },
    { id: 'meta-description', label: 'Meta Description', icon: MdAutoAwesome, color: '#38BDF8' },
  ],
  website: [
    { id: 'hero-headline', label: 'Hero Headline', icon: FaEarthAmericas, color: '#00E5B0' },
    { id: 'landing-copy', label: 'Landing Copy', icon: FaFileLines, color: '#38BDF8' },
    { id: 'cta-lines', label: 'CTA Lines', icon: MdAutoAwesome, color: '#FFD93D' },
    { id: 'product-description', label: 'Product Description', icon: FaBullhorn, color: '#A78BFA' },
  ],
  threads: [
    { id: 'threads-post', label: 'Conversational Post', icon: FaThreads, color: '#F8FAFC' },
    { id: 'thread-starter', label: 'Thread Starter', icon: FaFileLines, color: '#A78BFA' },
    { id: 'community-prompt', label: 'Community Prompt', icon: FaRegLightbulb, color: '#00E5B0' },
  ],
  pinterest: [
    { id: 'pin-title', label: 'Pin Title', icon: FaPinterest, color: '#E60023' },
    { id: 'pin-description', label: 'Pin Description', icon: FaFileLines, color: '#FF8AA1' },
    { id: 'shopping-pin', label: 'Shopping Pin', icon: FaBullhorn, color: '#FFD93D' },
  ],
  snapchat: [
    { id: 'story-caption', label: 'Story Caption', icon: FaSnapchat, color: '#FFFC00' },
    { id: 'spotlight-hook', label: 'Spotlight Hook', icon: MdAutoAwesome, color: '#00E5B0' },
    { id: 'overlay-text', label: 'Overlay Text', icon: FaCamera, color: '#38BDF8' },
  ],
  whatsapp: [
    { id: 'broadcast-message', label: 'Broadcast Message', icon: FaWhatsapp, color: '#25D366' },
    { id: 'status-caption', label: 'Status Caption', icon: FaCamera, color: '#86EFAC' },
    { id: 'customer-reply', label: 'Customer Reply', icon: FaEnvelope, color: '#FFB830' },
  ],
}

const PLATFORM_GUIDES = {
  instagram: {
    summary: 'Reels, captions, carousels, and hashtags.',
    topicPlaceholder: 'e.g. New summer collection reel for Instagram',
    topicHint: 'Describe the post, reel, carousel, product, or campaign idea.',
    keywordPlaceholder: 'e.g. fashion, reels, summer sale, lifestyle',
    keywordHint: 'Use niche words, campaign names, and audience interests.',
    formatHint: 'Pick the exact Instagram output you want before writing.'
  },
  tiktok: {
    summary: 'Short hooks, captions, scripts, and 5 hashtag sets.',
    topicPlaceholder: 'e.g. 15-second TikTok hook for a skincare launch',
    topicHint: 'Mention the video idea, audience, product, or trend angle.',
    keywordPlaceholder: 'e.g. skincare, glow up, viral hook, Gen Z',
    keywordHint: 'Add trend words or niche hashtags to guide the hook.',
    formatHint: 'TikTok works best with short, punchy formats.'
  },
  youtube: {
    summary: 'Shorts titles, long video titles, descriptions, chapters.',
    topicPlaceholder: 'e.g. YouTube long video about AI tools for students',
    topicHint: 'Mention whether it is a Short, long video, tutorial, vlog, or review.',
    keywordPlaceholder: 'e.g. AI tools, students, productivity, tutorial',
    keywordHint: 'Add searchable keywords for titles, descriptions, and SEO.',
    formatHint: 'Choose Shorts, long video, description, chapters, or pinned comment.'
  },
  linkedin: {
    summary: 'Professional posts, article intros, hiring, leadership.',
    topicPlaceholder: 'e.g. LinkedIn post announcing a startup milestone',
    topicHint: 'Describe the professional update, lesson, hiring need, or insight.',
    keywordPlaceholder: 'e.g. startup, leadership, product launch, growth',
    keywordHint: 'Add industry words and audience role for better positioning.',
    formatHint: 'LinkedIn formats are tuned for credibility and clarity.'
  },
  facebook: {
    summary: 'Page posts, groups, events, and community updates.',
    topicPlaceholder: 'e.g. Facebook event promo for a university gala',
    topicHint: 'Mention the page, group, event, product, or community update.',
    keywordPlaceholder: 'e.g. event, community, offer, announcement',
    keywordHint: 'Add audience and location/context words if relevant.',
    formatHint: 'Facebook outputs can be warmer and community-focused.'
  },
  email: {
    summary: 'Email drafts, subject lines, and follow-ups.',
    topicPlaceholder: 'e.g. Follow-up email after a client meeting',
    topicHint: 'Explain recipient, purpose, and desired action.',
    keywordPlaceholder: 'e.g. follow-up, proposal, deadline, thank you',
    keywordHint: 'Add important points that must be included in the email.',
    formatHint: 'Email formats focus on structure, clarity, and CTA.'
  },
  blog: {
    summary: 'Blog snippets, SEO intros, outlines, and meta descriptions.',
    topicPlaceholder: 'e.g. Blog intro about social media content planning',
    topicHint: 'Mention the article topic, audience, and angle.',
    keywordPlaceholder: 'e.g. SEO, content planning, social media, AI',
    keywordHint: 'Add SEO keywords and reader intent.',
    formatHint: 'Blog formats are more search-friendly and structured.'
  },
  website: {
    summary: 'Hero headlines, landing copy, CTAs, product descriptions.',
    topicPlaceholder: 'e.g. Website hero copy for an AI content tool',
    topicHint: 'Describe the product, audience, benefit, and offer.',
    keywordPlaceholder: 'e.g. AI writer, fast captions, creators, workflow',
    keywordHint: 'Add value props and conversion keywords.',
    formatHint: 'Website formats are built for conversion and scanning.'
  },
  default: {
    summary: 'Platform-specific copy formats.',
    topicPlaceholder: 'e.g. Campaign idea for a new product launch',
    topicHint: 'Describe the topic, audience, and goal for the content.',
    keywordPlaceholder: 'e.g. launch, creator, sale, audience',
    keywordHint: 'Comma-separated keywords to guide the AI.',
    formatHint: 'Choose the output format that matches your platform.'
  }
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  
  const [activeTab, setActiveTab] = useState('writer')
  const [playgroundMode, setPlaygroundMode] = useState('write')
  const [playgroundInput, setPlaygroundInput] = useState('')
  const [type, setType]         = useState(['post-caption'])
  const [keywords, setKeywords] = useState('')
  const [topic, setTopic]       = useState('')
  const [tone, setTone]         = useState('Professional')
  const [platform, setPlatform] = useState('instagram')
  const [includeEmojis, setIncludeEmojis] = useState(true)
  const [output, setOutput]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [charCount, setCharCount] = useState(0)
  const [prefBanner, setPrefBanner] = useState(null)
  
  const [historyItems, setHistoryItems] = useState([])
  const [fetchingHistory, setFetchingHistory] = useState(true)
  const [workspaceStats, setWorkspaceStats] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showPlatformPicker, setShowPlatformPicker] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [checkoutReady, setCheckoutReady] = useState(false)
  
  const dropdownRef = useRef(null)

  // Determine Greeting based on time
  const getGreeting = () => {
    const hrs = new Date().getHours()
    if (hrs < 12) return 'Good morning'
    if (hrs < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Load user history & preferences on mount
  useEffect(() => {
    if (location.state?.openUpgrade) {
      setShowUpgradeModal(true)
      navigate('/dashboard', { replace: true, state: null })
    }
    fetchHistory()
    fetchPreferences()
    fetchWorkspaceStats()
    
    // Close dropdown on click outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchHistory = async () => {
    setFetchingHistory(true)
    try {
      const res = await api.get('/content/history')
      setHistoryItems(res.data.history || [])
    } catch {
      // Silently catch
    } finally {
      setFetchingHistory(false)
    }
  }

  const fetchWorkspaceStats = async () => {
    try {
      const res = await api.get('/auth/stats')
      setWorkspaceStats(res.data?.stats || null)
    } catch {
      // Silently catch
    }
  }

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/preferences')
      const p = res.data?.preferences
      if (p) {
        setPrefBanner(p)
        if (p.preferredTone) setTone(p.preferredTone)
        if (p.preferredPlatform) {
          const preferredPlatform = p.preferredPlatform.toLowerCase()
          const nextPlatform = PLATFORMS.some((item) => item.id === preferredPlatform) ? preferredPlatform : 'instagram'
          const nextFormats = PLATFORM_FORMATS[nextPlatform] || CONTENT_TYPES
          setPlatform(nextPlatform)
          setType((current) => {
            const currentList = Array.isArray(current) ? current : [current]
            const valid = currentList.filter((item) => nextFormats.some((format) => format.id === item))
            return valid.length ? valid : [nextFormats[0].id]
          })
        }
      }
    } catch {
      // Silently catch
    }
  }

  // ── Generate content via real Gemini API ─────────────────────────────────────
  const handleGenerate = async () => {
    if (loading) return // prevent double-click
    if (!topic.trim()) { toast('Please enter a topic.', 'error'); return }

    setLoading(true)
    setOutput('')
    setError('')

    try {
      const res = await api.post('/content/generate-text', {
        prompt: topic,
        keywords,
        tone,
        platform,
        contentTypes: type,
        contentType: type.join(', '),
        includeEmojis
      })
      const result = res.data.result || ''
      setOutput(result)
      setCharCount(result.length)
      toast('Content generated successfully!', 'success')
      fetchHistory()
      fetchWorkspaceStats()
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Generation failed. Please try again.')
      if (import.meta.env.DEV) {
        console.error('[Dashboard] generate error:', err)
      }
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Save content to MongoDB ───────────────────────────────────────────────────
  const saveContent = async () => {
    if (!output) { toast('Nothing to save yet.', 'error'); return }
    setSaving(true)
    try {
      await api.post('/content/save', {
        type: 'text',
        prompt: topic,
        result: output,
        tone,
        platform,
        contentType: type.join(', '),
        metadata: { keywords, outputTypes: type, includeEmojis, autoSaved: false }
      })
      toast('Content saved to history!', 'success')
      fetchHistory()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    toast('Copied to clipboard!', 'success')
  }

  const downloadText = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${type.join('-')}-content-${Date.now()}.txt`
    a.click()
    toast('Downloaded!', 'success')
  }

  const handlePlatformChange = (platformId) => {
    const nextFormats = PLATFORM_FORMATS[platformId] || CONTENT_TYPES
    setPlatform(platformId)
    setType((current) => {
      const currentList = Array.isArray(current) ? current : [current]
      const valid = currentList.filter((item) => nextFormats.some((format) => format.id === item))
      return valid.length ? valid : [nextFormats[0].id]
    })
    setShowPlatformPicker(false)
  }

  const handleQuickAction = (ctType) => {
    const quickMap = {
      caption: { platform: 'instagram', type: 'post-caption' },
      hashtags: { platform: 'instagram', type: 'hashtag-set' },
      blog: { platform: 'blog', type: 'blog-snippet' },
      marketing: { platform: 'website', type: 'landing-copy' },
      email: { platform: 'email', type: 'email-draft' }
    }
    const next = quickMap[ctType] || { platform, type: ctType }
    setPlatform(next.platform)
    setType([next.type])
    setActiveTab('writer')
    setOutput('')
    setError('')
  }

  const handlePlaygroundGo = () => {
    if (!playgroundInput.trim()) return
    if (playgroundMode === 'write') {
      setTopic(playgroundInput)
      setActiveTab('writer')
      setPlaygroundInput('')
    } else if (playgroundMode === 'image') {
      navigate('/image-gen', { state: { initialPrompt: playgroundInput } })
    } else if (playgroundMode === 'voice') {
      navigate('/voice-cloning', { state: { initialTopic: playgroundInput } })
    } else if (playgroundMode === 'rewrite') {
      navigate('/rewrite', { state: { initialInput: playgroundInput } })
    }
  }

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User')
  const avatarLetter = (user?.name || user?.email || 'U')[0].toUpperCase()
  const platformMeta = PLATFORMS.find((item) => item.id === platform) || PLATFORMS[0]
  const formatOptions = PLATFORM_FORMATS[platform] || CONTENT_TYPES
  const selectedFormatLabel = type.map((selected) => (
    formatOptions.find((item) => item.id === selected)?.label ||
    CONTENT_TYPES.find((item) => item.id === selected)?.label ||
    selected
  )).join(' + ')
  const selectedGuide = PLATFORM_GUIDES[platform] || PLATFORM_GUIDES.default

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content dashboard-page">
        
        {/* ── Navbar/Header ─────────────────────────────────────────────────── */}
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, position: 'relative' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {getGreeting()}, {displayName}!
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span className="badge badge-green" style={{ textTransform: 'none', padding: '3px 10px', fontSize: 11 }}>
                {workspaceStats?.plan === 'starter' ? 'Starter Workspace' : 'Workspace'}
              </span>
              <button 
                onClick={() => setShowUpgradeModal(true)}
                style={{ fontSize: 11, color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
          
          {/* Avatar dropdown */}
          <div className='workspace-header-actions' style={{ position: 'relative' }} ref={dropdownRef}>
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
                  <button onClick={() => { navigate('/preferences'); setShowDropdown(false) }} className="avatar-dropdown-item"><MdSettings size={16}/> Preferences</button>
                  <button onClick={() => { navigate('/history'); setShowDropdown(false) }} className="avatar-dropdown-item"><MdHistory size={16}/> History</button>
                  <button onClick={() => { navigate('/feedback'); setShowDropdown(false) }} className="avatar-dropdown-item"><MdInfoOutline size={16}/> Feedback</button>
                  <button onClick={() => { setShowUpgradeModal(true); setShowDropdown(false) }} className="avatar-dropdown-item"><MdStar size={16}/> Upgrade to Pro</button>
                  {user?.role === 'admin' && <button onClick={() => { navigate('/admin'); setShowDropdown(false) }} className="avatar-dropdown-item" style={{ color: 'var(--accent3)' }}><MdAdminPanelSettings size={16}/> Admin Panel</button>}
                  <div style={{ borderTop: '1px solid var(--border)' }} />
                  <button onClick={() => { logout(); navigate('/') }} className="avatar-dropdown-item" style={{ color: 'var(--danger)' }}><MdLogout size={16}/> Sign Out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
        <div className="tabs dashboard-tabs" style={{ marginBottom: 18, maxWidth: 300 }}>
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={`tab ${activeTab === 'writer' ? 'active' : ''}`} onClick={() => setActiveTab('writer')}>
            Content Writer
          </button>
        </div>

        {/* ── Main Tab Contents ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Statistics Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--accent)' }}>
                    {workspaceStats ? workspaceStats.generationsThisMonth : (fetchingHistory ? '...' : historyItems.length)}
                  </div>
                  <div className="stat-label">Generations This Month</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--accent2)' }}>
                    {workspaceStats ? workspaceStats.savedTotal : (fetchingHistory ? '...' : historyItems.length)}
                  </div>
                  <div className="stat-label">Saved Items</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--accent4)' }}>
                    {workspaceStats?.plan === 'starter' ? 'Starter' : 'Free'}
                  </div>
                  <div className="stat-label">Current Plan</div>
                </div>
              </div>

              {/* ── AI Playground Card ───────────────────────────────────────────── */}
              <motion.div
                className="dashboard-playground-card"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="dashboard-playground-glow" />

                {/* Left – copy */}
                <div className="dashboard-playground-copy">
                  <div className="dashboard-playground-kicker">
                    <MdAutoAwesome size={12} />
                    AI Playground
                  </div>
                  <h3>Create anything,<br />in seconds.</h3>
                  <p>Type a topic or idea below, choose your tool, and SmartGen AI will take it from there — captions, images, voice-overs, and more.</p>
                </div>

                {/* Right – interactive panel */}
                <div className="dashboard-playground-panel">
                  {/* Mode pills */}
                  <div className="dashboard-playground-modes">
                    {[
                      { id: 'write',   label: 'Writer',  Icon: FaWandMagicSparkles },
                      { id: 'image',   label: 'Image',   Icon: MdImage },
                      { id: 'voice',   label: 'Voice',   Icon: MdRecordVoiceOver },
                      { id: 'rewrite', label: 'Rewrite', Icon: FaArrowsRotate },
                    ].map(({ id, label, Icon }) => (
                      <motion.button
                        key={id}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        className={playgroundMode === id ? 'active' : ''}
                        onClick={() => setPlaygroundMode(id)}
                      >
                        <Icon size={13} />
                        {label}
                      </motion.button>
                    ))}
                  </div>

                  {/* Input + Go */}
                  <div className="dashboard-playground-input-row">
                    <input
                      type="text"
                      placeholder={
                        playgroundMode === 'write'   ? 'e.g. summer sale launch for Instagram' :
                        playgroundMode === 'image'   ? 'e.g. cozy coffee shop flat-lay caption' :
                        playgroundMode === 'voice'   ? 'e.g. product promo for TikTok' :
                        'Paste the text you want to rewrite…'
                      }
                      value={playgroundInput}
                      onChange={e => setPlaygroundInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePlaygroundGo()}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handlePlaygroundGo}
                    >
                      Open Tool →
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)', marginBottom: 16 }}>
                Quick Actions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                <motion.div whileHover={{ y: -4 }} onClick={() => handleQuickAction('caption')} className="card card-glass card-interactive" style={{ padding: 18 }}>
                  <FaCamera size={22} color="var(--accent)" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Generate Caption</h4>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Create social captions for feeds</p>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} onClick={() => handleQuickAction('hashtags')} className="card card-glass card-interactive" style={{ padding: 18 }}>
                  <FaHashtag size={22} color="var(--accent2)" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Generate Hashtags</h4>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Find relevant trending hashtags</p>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} onClick={() => handleQuickAction('blog')} className="card card-glass card-interactive" style={{ padding: 18 }}>
                  <FaFileLines size={22} color="var(--accent3)" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Blog Snippet</h4>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Draft structured search-friendly posts</p>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} onClick={() => handleQuickAction('marketing')} className="card card-glass card-interactive" style={{ padding: 18 }}>
                  <FaBullhorn size={22} color="var(--accent5)" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Marketing Copy</h4>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Persuasive ad or product blurbs</p>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} onClick={() => handleQuickAction('email')} className="card card-glass card-interactive" style={{ padding: 18 }}>
                  <FaEnvelope size={22} color="var(--accent2)" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Email Draft</h4>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Compose quick subject-ready emails</p>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/rewrite')} className="card card-glass card-interactive" style={{ padding: 18 }}>
                  <FaArrowsRotate size={22} color="var(--accent4)" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Rewrite Content</h4>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Fix grammar, expand, or condense</p>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/image-gen')} className="card card-glass card-interactive" style={{ padding: 18 }}>
                  <FaImage size={22} color="var(--accent)" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Image Caption</h4>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Analyze photos for captions</p>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/voice-cloning')} className="card card-glass card-interactive dashboard-voice-quick-card" style={{ padding: 18 }}>
                  <MdRecordVoiceOver size={22} color="#00b8ff" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Voice Cloning</h4>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Generate AI voice-overs from scripts</p>
                </motion.div>
              </div>

              {/* Recent Activity */}
              <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)', marginBottom: 16 }}>
                Recent Activity
              </h3>
              <div className="card">
                {fetchingHistory ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="shimmer" style={{ height: 50, borderRadius: 8, width: '100%' }} />
                    ))}
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="empty-state">
                    <MdHistory size={40} />
                    <h3>No activity recorded</h3>
                    <p style={{ fontSize: 13 }}>Your saved generations will be listed here.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {historyItems.slice(0, 4).map((item, idx) => (
                      <div key={item._id || idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <span className={`badge ${item.type === 'text' ? 'badge-green' : item.type === 'image' ? 'badge-blue' : 'badge-purple'}`} style={{ minWidth: 60, textAlign: 'center' }}>
                          {item.type}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.prompt || 'No Prompt'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                            Generated on {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(item.result)
                            toast('Copied to clipboard!', 'success')
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--accent)' }}
                        >
                          <MdContentCopy size={14} />
                        </button>
                      </div>
                    ))}
                    {historyItems.length > 4 && (
                      <button 
                        onClick={() => navigate('/history')}
                        style={{ marginTop: 8, fontSize: 13, color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', width: '100%', outline: 'none' }}
                      >
                        View Full History &rarr;
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="writer"
              className="tool-workspace-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            >
              {/* ── Input Panel ────────────────────────────────────────────── */}
              <div className="fade-up-1">
                {/* Platform and format */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="card dashboard-compact-card" style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>
                    1. Platform & Format
                  </div>

                  <div className="dashboard-platform-shell">
                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="dashboard-platform-summary"
                      onClick={() => setShowPlatformPicker((value) => !value)}
                      style={{ '--platform-color': platformMeta.color, '--platform-accent': platformMeta.accent }}
                    >
                      <span className="dashboard-platform-icon">
                        {React.createElement(platformMeta.icon, { size: 18 })}
                      </span>
                      <span className="dashboard-platform-copy">
                        <strong>{platformMeta.label} workflow</strong>
                        <small>{selectedGuide.summary}</small>
                      </span>
                      <MdExpandMore className={showPlatformPicker ? 'open' : ''} size={20} />
                    </motion.button>

                    <AnimatePresence>
                      {showPlatformPicker && (
                        <motion.div
                          className="dashboard-platform-popover"
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                          <div className="dashboard-platform-popover-head">
                            <span>Select platform</span>
                            <small>Formats below update automatically.</small>
                          </div>
                          <div className="dashboard-platform-picker">
                            {PLATFORMS.map((item) => {
                              const Icon = item.icon
                              const active = platform === item.id
                              return (
                                <button
                                  type="button"
                                  key={item.id}
                                  onClick={() => handlePlatformChange(item.id)}
                                  className={`dashboard-platform-chip ${active ? 'active' : ''}`}
                                  style={{ '--platform-color': item.color, '--platform-accent': item.accent }}
                                >
                                  <Icon size={15} />
                                  <span>{item.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="dashboard-format-header">
                    <div>
                      <span>Choose {platformMeta.label} format</span>
                    </div>
                    <strong>{selectedFormatLabel}</strong>
                  </div>

                  <div className="dashboard-format-grid">
                    {formatOptions.map((ct) => (
                      <motion.button
                        type="button"
                        key={ct.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`dashboard-format-card ${type.includes(ct.id) ? 'active' : ''}`}
                        onClick={() => setType((current) => {
                          const currentList = Array.isArray(current) ? current : [current]
                          if (currentList.includes(ct.id)) return currentList.length === 1 ? currentList : currentList.filter((item) => item !== ct.id)
                          return [...currentList, ct.id]
                        })}
                        style={{ '--format-color': ct.color }}
                      >
                        <ct.icon size={16} />
                        <span>{ct.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Inputs */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="card">
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>
                    2. Describe Your {platformMeta.label} Content
                  </div>

                  <div className="form-group">
                    <label className="form-label">Topic *</label>
                    <input type="text" placeholder={selectedGuide.topicPlaceholder}
                      value={topic} onChange={e => setTopic(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Keywords (optional)</label>
                    <input type="text" placeholder={selectedGuide.keywordPlaceholder}
                      value={keywords} onChange={e => setKeywords(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tone &amp; Style</label>
                    <div className="dashboard-tone-grid">
                      {TONES.map((item) => (
                        <motion.button
                          type="button"
                          key={item.id}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`dashboard-tone-chip ${tone === item.id ? 'active' : ''}`}
                          onClick={() => setTone(item.id)}
                        >
                          <strong>{item.label}</strong>
                          <span>{item.desc}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Content Options</label>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                      <AnimatedEmojiToggle value={includeEmojis} onChange={setIncludeEmojis} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                    <UsageRemainingBadge stats={workspaceStats} />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 15 }}
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    {loading
                      ? <><span className="button-loading-dots" aria-hidden="true"><i /><i /><i /></span> Generating</>
                      : <><FaWandMagicSparkles size={17} style={{ marginRight: 8 }}/> Generate {platformMeta.label} {selectedFormatLabel}</>}
                  </motion.button>
                </motion.div>
              </div>

              {/* ── Output Panel ───────────────────────────────────────────── */}
              <div className="fade-up-2">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>
                      3. Your Generated Content
                    </div>
                    {output && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={handleGenerate} title="Regenerate" style={{ color: '#7c6af7' }}><MdRefresh size={18}/></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={copyToClipboard} title="Copy" style={{ color: '#00b8ff' }}><MdContentCopy size={18}/></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={saveContent} title="Save to History" style={{ color: '#ffb830' }} disabled={saving}><MdSave size={18}/></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-sm" onClick={downloadText} title="Download" style={{ color: '#00e5b0' }}><MdDownload size={18}/></motion.button>
                      </div>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {loading && (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1 }}>
                        <LoadingState label="AI is writing your content..." />
                      </motion.div>
                    )}

                    {!loading && !output && !error && (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state" style={{ flex: 1 }}>
                        <div style={{ color: '#7c6af7', marginBottom: 16 }}><FaWandMagicSparkles size={48} /></div>
                        <h3>Your content will appear here</h3>
                        <p style={{ fontSize: 13 }}>Choose your options and generate.</p>
                      </motion.div>
                    )}

                    {!loading && error && (
                      <motion.div key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1 }}>
                        <ErrorAlert message={error} />
                      </motion.div>
                    )}

                    {!loading && output && (
                      <motion.div key="output" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="output-box" style={{ flex: 1, whiteSpace: 'pre-line' }}>{output}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{charCount} characters</span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span className="badge badge-green">AI Generated</span>
                            <AutoSavedIndicator visible={autoSaved} />
                            <span className={`badge ${type.includes('blog') || type.includes('article') ? 'badge-purple' : 'badge-blue'}`}>{selectedFormatLabel}</span>
                          </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-secondary"
                          style={{ marginTop: 14, justifyContent: 'center' }}
                          onClick={() => navigate('/feedback')}>
                          Rate this content <MdStar size={18} style={{ marginLeft: 6, color: '#ffb830' }}/>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <UpgradeProModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onCheckout={() => { setCheckoutReady(true); toast('Checkout details prepared for SmartGen Pro.', 'success') }}
      />
      {checkoutReady && <div className="checkout-status-pill">Checkout request ready - payment gateway can be connected here.</div>}
    </div>
  )
}











