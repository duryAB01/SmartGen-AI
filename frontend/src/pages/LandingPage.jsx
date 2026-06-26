import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MdAutoAwesome, MdCheckCircle, MdArrowForward, MdFlashOn, 
  MdExpandMore, MdExpandLess, MdUpload, MdContentCopy, MdInfoOutline,
  MdSupportAgent, MdClose, MdSend, MdQuestionAnswer, MdRecordVoiceOver, MdOutlineSecurity
} from 'react-icons/md'
import { 
  FaFileLines, FaHashtag, FaBookOpen, FaBullhorn, 
  FaWandMagicSparkles, FaEnvelope, FaImage, FaArrowsRotate,
  FaInstagram, FaLinkedin, FaFacebook, FaXTwitter, FaTiktok, FaYoutube, FaEarthAmericas,
  FaArrowRight, FaWhatsapp, FaPenNib, FaThreads, FaPinterest, FaSnapchat, FaGithub
} from 'react-icons/fa6'
import axios from 'axios'
import { useToast, useAuth } from '../App.jsx'
import getApiErrorMessage from '../utils/getApiErrorMessage.js'
import AnimatedEmojiToggle from '../components/AnimatedEmojiToggle.jsx'
import ParticleBackground from '../components/ParticleBackground.jsx'
import UpgradeProModal from '../components/UpgradeProModal.jsx'

const FEATURES = [
  { icon: FaFileLines,         title: 'AI Caption Generator',      desc: 'Generate social captions, emails, blogs, or marketing copy tailored to your topic.',  color: '#00e5b0' },
  { icon: FaHashtag,           title: 'Hashtag Generator',        desc: 'Generate relevant and trending hashtags for your content to boost engagement.',    color: '#00b8ff' },
  { icon: FaBullhorn,          title: 'Ad & Promo Copy',          desc: 'Create product ads, sale announcements, landing lines, and campaign copy.',  color: '#8b7aff' },
  { icon: FaEnvelope,          title: 'Email Drafts',             desc: 'Draft professional emails quickly with AI-powered suggestions and tone adjustment.',  color: '#ffb830' },
  { icon: FaArrowsRotate,      title: 'Rewrite & Refine',          desc: 'Improve grammar, shorten, expand, simplify, or casually adapt any existing text instantly.',  color: '#ff4d6a' },
  { icon: FaImage,             title: 'Image-Based Content',      desc: 'Upload any image to generate context-aware captions, product descriptions, or hashtags.',  color: '#00e5b0' },
  { icon: MdRecordVoiceOver,   title: 'Voice Cloning Beta',       desc: 'Turn a topic or script into natural audio using a voice sample you own or have permission to use.', color: '#14b8a6' },
  { icon: MdAutoAwesome,       title: 'Preferences',              desc: 'Save your favorite tone, platform, and content type settings for quick access.',  color: '#00b8ff' },
  { icon: FaBookOpen,          title: 'Saved History',            desc: 'Access all your generated content in one place and reuse or edit them anytime.',  color: '#8b7aff' },
]

const STEPS = [
  { n: '01', title: 'Enter topic / drop photo',  desc: 'Describe what you want to write or drop any photo to generate from visual context.',        color: '#00e5b0' },
  { n: '02', title: 'Choose preset options', desc: 'Select platform, tone, and content types optimized for specific social channels.', color: '#00b8ff' },
  { n: '03', title: 'Generate AI content',      desc: 'Get highly accurate outputs from Gemini AI in seconds.',  color: '#8b7aff' },
  { n: '04', title: 'Copy, save & reuse',      desc: 'Edit, copy, or save outputs directly to history for future use.',  color: '#ff4d6a' },
]

const PLANS = [
  {
    name: 'Starter', price: '$0', desc: 'Best for testing ideas, class projects, and light creator work.',
    features: ['Limited guest playground samples', 'Basic platform presets', 'Sign up to save history', 'Community-style support'],
    cta: 'Start Free', popular: false, highlightColor: 'var(--text3)'
  },
  {
    name: 'Pro', price: '$19', desc: 'For daily publishing, campaigns, and polished multi-platform workflows.',
    features: ['Higher generation limits', 'Priority Gemini processing', 'Advanced platform formats', 'Saved preferences and history'],
    cta: 'Upgrade to Pro', popular: true, highlightColor: 'var(--accent)'
  }
]

const FAQS = [
  { q: 'Can I try SmartGen AI without creating an account?', a: 'Yes, the homepage playground allows limited free generations. To save history and unlock full features, users need to sign up.' },
  { q: 'How does image-based content generation work?', a: 'Users upload an image, the AI analyzes visual context, and the system generates captions, hashtags, or related text. It does not create new images.' },
  { q: 'Can I remove emojis or hashtags?', a: 'Yes, emoji and hashtag toggles let users choose clean professional text or catchy social content.' },
  { q: 'Where is my generated content saved?', a: 'Logged-in users can save generated content in History and reuse it later.' },
  { q: 'Is SmartGen AI different from a general chatbot?', a: 'Yes, SmartGen AI provides structured workflows for platform, tone, content type, preferences, image analysis, saved history, and admin monitoring.' }
]

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, color: '#E1306C', accent: '#F77737' },
  { id: 'tiktok',    label: 'TikTok',    icon: FaTiktok, color: '#00F2EA', accent: '#FF0050' },
  { id: 'youtube',   label: 'YouTube',   icon: FaYoutube, color: '#FF0033', accent: '#FF6B6B' },
  { id: 'linkedin',  label: 'LinkedIn',  icon: FaLinkedin, color: '#0A66C2', accent: '#70B5F9' },
  { id: 'facebook',  label: 'Facebook',  icon: FaFacebook, color: '#1877F2', accent: '#8AB4F8' },
  { id: 'twitter',   label: 'X',         icon: FaXTwitter, color: '#F8FAFC', accent: '#94A3B8' },
  { id: 'threads',   label: 'Threads',   icon: FaThreads, color: '#F8FAFC', accent: '#A78BFA' },
  { id: 'pinterest', label: 'Pinterest', icon: FaPinterest, color: '#E60023', accent: '#FF8AA1' },
  { id: 'snapchat',  label: 'Snapchat',  icon: FaSnapchat, color: '#FFFC00', accent: '#FFF7AD' },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: FaWhatsapp, color: '#25D366', accent: '#86EFAC' },
  { id: 'email',     label: 'Email',     icon: FaEnvelope, color: '#FFB830', accent: '#FDE68A' },
  { id: 'blog',      label: 'Blog',      icon: FaPenNib, color: '#FF5722', accent: '#FDBA74' },
  { id: 'website',   label: 'Website',   icon: FaEarthAmericas, color: '#00E5B0', accent: '#67E8F9' }
]

const TONES = ['Professional', 'Friendly', 'Casual', 'Persuasive', 'Funny', 'Luxury', 'Minimal', 'Academic']
const CONTENT_TYPES = ['Post Caption', 'Hashtag Set', 'Ad & Promo Copy', 'Blog Snippet', 'Email Draft', 'Short Form', 'Product Description', 'Social Post']
const SOCIAL_PLATFORM_IDS = ['instagram', 'tiktok', 'youtube', 'linkedin', 'facebook', 'twitter', 'threads', 'pinterest', 'snapchat']
const PLATFORM_FORMATS = {
  instagram: ['Reel Caption', 'Post Caption', 'Carousel Caption', 'Story Text', 'Hashtag Set'],
  tiktok: ['TikTok Caption', 'Hook + Caption', 'Video Script', 'On-screen Text', '5 Hashtags'],
  youtube: ['Shorts Title', 'Long Video Title', 'Description', 'Chapters', 'Pinned Comment'],
  linkedin: ['Professional Post', 'Article Intro', 'Hiring Post', 'Thought Leadership', 'Company Update'],
  facebook: ['Page Post', 'Group Post', 'Event Promo', 'Product Post', 'Community Update'],
  twitter: ['Single Post', 'Thread Starter', 'Reply Post', 'Launch Update', 'Punchy Hook'],
  threads: ['Conversational Post', 'Thread Starter', 'Community Prompt', 'Short Update'],
  pinterest: ['Pin Title', 'Pin Description', 'Board Description', 'Shopping Pin'],
  snapchat: ['Story Caption', 'Spotlight Hook', 'Short CTA', 'Overlay Text'],
  whatsapp: ['Broadcast Message', 'Status Caption', 'Customer Reply'],
  email: ['Email Draft', 'Subject Lines', 'Follow-up Email', 'Announcement'],
  blog: ['Blog Snippet', 'SEO Intro', 'Outline', 'Meta Description'],
  website: ['Hero Headline', 'Landing Copy', 'CTA Lines', 'Product Description']
}
const WORKFLOW_BADGES = [
  { label: 'Text Generator', detail: 'Captions and copy' },
  { label: 'Image Captions', detail: 'Visual context posts' },
  { label: 'Rewrite Studio', detail: 'Refine any draft' },
  { label: 'Saved History', detail: 'Reuse best outputs' },
  { label: 'Preferences', detail: 'Keep your style' }
]

const SUPPORT_QUICK_PROMPTS = [
  'How do I use SmartGen?',
  'What happens after guest limit?',
  'Why Gemini API error appears?',
  'Which platforms are supported?'
]

const FOOTER_SOCIALS = [
  { label: 'Instagram', icon: FaInstagram, className: 'instagram' },
  { label: 'LinkedIn', icon: FaLinkedin, className: 'linkedin' },
  { label: 'GitHub', icon: FaGithub, className: 'github' },
  { label: 'Email', icon: FaEnvelope, className: 'email' },
  { label: 'X', icon: FaXTwitter, className: 'x' }
]

const createChatMessage = (role, text) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  text
})

const getSupportReply = (question) => {
  const q = question.toLowerCase()

  if (/(price|pricing|plan|pro|free|starter|payment|upgrade)/.test(q)) {
    return 'Starter is free for trying the playground. Pro is shown as $19/month for higher limits, priority processing, saved preferences, and stronger platform formats. Full payment activation needs backend/payment integration, so this page shows the polished pricing flow only.'
  }

  if (/(limit|quota|guest|reach|khatam|finish)/.test(q)) {
    return 'Guest mode has a limited number of generations. When the limit ends, SmartGen shows an upgrade/signup flow so the user can create an account and continue with saved history.'
  }

  if (/(api|gemini|error|demand|high demand|model|key|server)/.test(q)) {
    return 'Gemini can sometimes return high-demand or quota errors. The best user flow is: retry after a little while, confirm the API key in .env, and use the pricing/limit CTA when guest usage is finished.'
  }

  if (/(login|signin|sign in|signup|sign up|account|password)/.test(q)) {
    return 'Use Sign In for an existing account, or Get Started to create a free account. After signup, generated content can be saved to history and reused.'
  }

  if (/(platform|instagram|tiktok|youtube|linkedin|facebook|caption|hashtag)/.test(q)) {
    return 'SmartGen supports platform-specific formats for Instagram, TikTok, YouTube, LinkedIn, Facebook, X, Threads, Pinterest, Snapchat, WhatsApp, Email, Blog, and Website copy.'
  }

  if (/(image|photo|vision|upload)/.test(q)) {
    return 'Use Vision AI for image-based content. Upload a photo, choose the platform, then SmartGen creates captions, hashtags, or product-style copy based on the image context.'
  }

  if (/(how|use|start|work|help)/.test(q)) {
    return 'Start with a topic or image, choose platform and tone, select the content format, then generate. You can copy the output, and signed-in users can save history and preferences.'
  }

  return 'I can help with pricing, limits, login, Gemini API errors, image tools, and platform formats. Switch to AI mode if you want a custom generated answer.'
}

// Helper for sleek toggles
const Switch = ({ checked, onChange }) => (
  <div 
    onClick={() => onChange(!checked)}
    style={{
      width: 36, height: 20, background: checked ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
      borderRadius: 10, position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
    }}
  >
    <motion.div 
      layout transition={{ type: "spring", stiffness: 700, damping: 30 }}
      style={{
        width: 14, height: 14, background: checked ? '#0a0b1a' : '#fff',
        borderRadius: '50%', position: 'absolute', top: 3, left: checked ? 19 : 3
      }}
    />
  </div>
)

export default function LandingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  
  // Custom Advanced Mode state
  const [advancedMode, setAdvancedMode] = useState(false)
  
  // Guest playground state
  const [guestTopic, setGuestTopic] = useState('')
  const [guestPlatform, setGuestPlatform] = useState('instagram')
  const [guestTone, setGuestTone] = useState('Friendly')
  const [guestContentType, setGuestContentType] = useState('Post Caption')
  const [guestLanguage, setGuestLanguage] = useState('English')
  const [guestIncludeEmojis, setGuestIncludeEmojis] = useState(true)
  const [guestIncludeHashtags, setGuestIncludeHashtags] = useState(true)
  const [guestOutput, setGuestOutput] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)
  const [guestLimitReached, setGuestLimitReached] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const handleSuggestionClick = (chip) => {
    if (chip === 'Instagram caption for university gala') {
      setGuestTopic('Instagram caption for university gala')
      handleGuestPlatformChange('instagram')
      setGuestContentType('Post Caption')
    } else if (chip === 'LinkedIn post for new startup') {
      setGuestTopic('LinkedIn post for new startup')
      handleGuestPlatformChange('linkedin')
      setGuestContentType('Professional Post')
    } else if (chip === 'Email draft for event invitation') {
      setGuestTopic('Email draft for event invitation')
      setGuestPlatform('email')
      setGuestContentType('Email Draft')
    } else if (chip === 'Hashtags for fashion brand') {
      setGuestTopic('Hashtags for fashion brand')
      handleGuestPlatformChange('instagram')
      setGuestContentType('Hashtag Set')
    }
  }
  
  // Vision AI state
  const [visionImage, setVisionImage] = useState(null)
  const [visionPrompt, setVisionPrompt] = useState('')
  const [visionPlatform, setVisionPlatform] = useState('instagram')
  const [visionIncludeEmojis, setVisionIncludeEmojis] = useState(true)
  const [visionIncludeHashtags, setVisionIncludeHashtags] = useState(true)
  const [visionOutput, setVisionOutput] = useState('')
  const [visionLoading, setVisionLoading] = useState(false)
  const [visionLimitReached, setVisionLimitReached] = useState(false)
  const fileInputRef = useRef(null)
  
  const [openFaq, setOpenFaq] = useState(null)
  const [showPricing, setShowPricing] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [checkoutReady, setCheckoutReady] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMode, setChatMode] = useState('support')
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    createChatMessage('assistant', 'Hi! Ask me about pricing, limits, login, Gemini API errors, or switch to AI mode for custom content help.')
  ])
  const guestPlatformMeta = PLATFORMS.find((platform) => platform.id === guestPlatform) || PLATFORMS[0]
  const socialPlatforms = PLATFORMS.filter((platform) => SOCIAL_PLATFORM_IDS.includes(platform.id))
  const guestFormatOptions = PLATFORM_FORMATS[guestPlatform] || CONTENT_TYPES
  
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleGuestPlatformChange = (platformId) => {
    setGuestPlatform(platformId)
    setGuestContentType((current) => {
      const nextFormats = PLATFORM_FORMATS[platformId] || CONTENT_TYPES
      return nextFormats.includes(current) ? current : nextFormats[0]
    })
  }

  const handleLandingPointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    event.currentTarget.style.setProperty('--cursor-x', `${x}%`)
    event.currentTarget.style.setProperty('--cursor-y', `${y}%`)
  }

  const openUpgradeFlow = () => {
    setUpgradeModalOpen(true)
    setShowPricing(true)
  }

  const handleProUpgrade = () => {
    if (!user) {
      navigate('/auth?tab=signup', {
        state: {
          returnTo: '/dashboard',
          destinationState: { openUpgrade: true },
          intentLabel: 'Sign in to upgrade your plan and unlock Pro features.'
        }
      })
      return
    }
    setUpgradeModalOpen(true)
    setShowPricing(true)
  }
  
  const openVoiceCloning = () => {
    if (user) {
      navigate('/voice-cloning')
      return
    }

    toast('Sign in to use Voice Cloning.', 'info')
    navigate('/auth', {
      state: {
        returnTo: '/voice-cloning',
        intentLabel: 'Continue to Voice Cloning after signing in.'
      }
    })
  }
  const handleGuestGenerate = async () => {
    if (!guestTopic.trim()) { toast('Please enter a topic', 'error'); return; }
    if (guestLimitReached) { openUpgradeFlow(); return; }
    
    setGuestLoading(true)
    setGuestOutput('')
    
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/content/guest/generate-text`, {
        prompt: guestTopic,
        tone: guestTone,
        platform: guestPlatform,
        contentType: guestContentType.toLowerCase(),
        includeEmojis: guestIncludeEmojis,
        includeHashtags: guestIncludeHashtags
      }, { timeout: 90000 })
      setGuestOutput(res.data.result)
      toast('Content generated successfully!', 'success')
    } catch (error) {
      if (error.response?.data?.limitReached) {
        setGuestLimitReached(true)
        openUpgradeFlow()
        toast(error.response.data.message, 'info')
      } else {
        toast(getApiErrorMessage(error, 'Generation failed'), 'error')
      }
    } finally {
      setGuestLoading(false)
    }
  }
  
  const handleVisionGenerate = () => {
    if (!visionImage) {
      toast('Please upload an image', 'error')
      return
    }

    const destinationState = {
      imageDraft: {
        file: visionImage,
        prompt: visionPrompt,
        platform: visionPlatform,
        tone: 'Professional',
        contentType: 'caption',
        includeEmojis: visionIncludeEmojis,
        includeHashtags: visionIncludeHashtags
      },
      autoGenerate: true
    }

    if (user) {
      navigate('/image-gen', { state: destinationState })
      return
    }

    toast('Sign in first. Your image and settings will continue after login.', 'info')
    navigate('/auth', {
      state: {
        returnTo: '/image-gen',
        intentLabel: 'Your selected image is ready. Sign in to generate its content.',
        destinationState
      }
    })
  }
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast('Image size must be less than 5MB', 'error'); return; }
      if (!file.type.startsWith('image/')) { toast('Please upload an image file', 'error'); return; }
      setVisionImage(file)
    }
  }
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast('Copied to clipboard!', 'success')
  }

  const handleChatSubmit = async (presetQuestion) => {
    const text = (presetQuestion || chatInput).trim()
    if (!text || chatLoading) return

    setChatMessages((messages) => [...messages, createChatMessage('user', text)])
    setChatInput('')

    if (chatMode === 'support') {
      setChatMessages((messages) => [...messages, createChatMessage('assistant', getSupportReply(text))])
      return
    }

    setChatLoading(true)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/content/guest/generate-text`, {
        prompt: `Answer this SmartGen AI website visitor question in a helpful, concise way. Question: ${text}`,
        tone: 'Friendly',
        platform: 'website',
        contentType: 'support response',
        includeEmojis: false,
        includeHashtags: false
      }, { timeout: 90000 })

      setChatMessages((messages) => [...messages, createChatMessage('assistant', res.data.result || 'I generated a response, but it came back empty. Try asking in a slightly different way.')])
    } catch (error) {
      if (error.response?.data?.limitReached) {
        setGuestLimitReached(true)
        openUpgradeFlow()
        setChatMessages((messages) => [...messages, createChatMessage('assistant', 'AI chat guest limit is reached. You can still use Support mode, or create a free account to continue generating.')])
      } else {
        setChatMessages((messages) => [...messages, createChatMessage('assistant', getApiErrorMessage(error, 'AI chat is temporarily unavailable. Support mode can still answer product questions.'))])
      }
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div
      className="landing-page"
      onMouseMove={handleLandingPointerMove}
      style={{
        '--cursor-x': '50%',
        '--cursor-y': '22%',
        minHeight: '100vh',
        background: 'var(--bg)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <ParticleBackground />
      <div className="noise" />
      <div className="landing-ambient-workflows" aria-hidden="true">
        {WORKFLOW_BADGES.map((item, idx) => (
          <div
            key={item.label}
            className={`ambient-workflow-card ${idx % 2 === 0 ? 'ambient-left' : 'ambient-right'}`}
            style={{
              '--ambient-top': `${820 + idx * 280}px`,
              '--ambient-delay': `${idx * -3.4}s`
            }}
          >
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>

      {/* ── Dynamic Glowing Orbs ───────────────────────────────────── */}
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.45, 0.3] }} 
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: 'absolute', top: -220, left: '4%', width: 520, height: 520, background: 'radial-gradient(circle, rgba(0,245,160,0.055) 0%, transparent 68%)', filter: 'blur(90px)', zIndex: 0 }} 
      />
      <motion.div 
        animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.35, 0.2] }} 
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        style={{ position: 'absolute', top: 160, right: '-12%', width: 460, height: 460, background: 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 68%)', filter: 'blur(95px)', zIndex: 0 }} 
      />
      <div 
        style={{ position: 'absolute', bottom: '18%', left: '30%', width: 360, height: 360, background: 'radial-gradient(circle, rgba(0,212,255,0.035) 0%, transparent 68%)', filter: 'blur(90px)', zIndex: 0, pointerEvents: 'none' }} 
      />

      {/* ── Navigation Bar ───────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(10, 11, 26, 0.75)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div whileHover={{ rotate: 180, scale: 1.1 }} transition={{ duration: 0.5 }} style={{
            width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, color: '#07080d',
            boxShadow: '0 0 16px rgba(0,245,160,0.4)'
          }}>S</motion.div>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, letterSpacing: 0, color: '#fff' }}>
            Smart<span style={{ color: 'var(--accent)' }}>Gen</span> AI
          </span>
        </div>
        
        {/* Nav Links - hidden on small mobile via custom stylesheet classes */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div className="landing-nav-links">
            {['Features', 'Voice AI', 'Vision AI', 'How It Works', 'Pricing', 'FAQs'].map((link) => (
              <motion.button
                key={link} whileHover={{ color: 'var(--accent)' }}
                onClick={() => scrollToSection(link.toLowerCase().replace(/\s+/g, '-'))}
                style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)', background: 'none', transition: 'color 0.2s', cursor: 'pointer' }}
              >
                {link}
              </motion.button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <motion.button whileHover={{ color: '#fff' }} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)', background: 'none', cursor: 'pointer' }} onClick={() => navigate('/auth')}>
              Sign In
            </motion.button>
            <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(0,245,160,0.4)' }} whileTap={{ scale: 0.96 }} 
              style={{ background: 'linear-gradient(135deg, var(--accent), #00d4ff)', color: '#000', padding: '10px 22px', borderRadius: 99, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onClick={() => navigate('/auth?tab=signup')}>
              Get Started <MdArrowForward size={16} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── Split Hero Section ────────────────────────────────────────── */}
      <section className="hero-grid" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Left Side: Headline & Copy */}
        <motion.div 
          className="hero-left"
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6 }}
        >
          <div style={{ marginBottom: 20 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0, 245, 160, 0.08)', border: '1px solid rgba(0, 245, 160, 0.15)', padding: '8px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.03em' }}>
              <MdFlashOn size={16} /> AI content workspace
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(40px, 4.2vw, 58px)', fontWeight: 800, lineHeight: 1.08, marginBottom: 24, letterSpacing: 0, color: '#fff' }}>
            Create polished content <br/>
            <span style={{ background: 'linear-gradient(135deg, #22f7c6, #38bdf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>for every platform</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 1.8vw, 18px)', color: 'var(--text2)', maxWidth: 560, marginBottom: 32, lineHeight: 1.7 }}>
            Plan captions, hashtags, emails, product copy, and image-based posts from one focused AI workspace. Try the playground first, then save your best outputs after signup.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,245,160,0.4)' }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('features')}
              style={{ background: 'linear-gradient(135deg, var(--accent), #00d4ff)', color: '#010203', padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Try the Playground <MdArrowForward size={18} />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('vision-ai')}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              See Image Tools
            </motion.button>
          </div>

          {/* Trust Checkmarks */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {['No credit card required', 'Gemini-powered generation', 'Save history after signup'].map((text, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)' }}>
                <MdCheckCircle size={18} color="var(--accent)" />
                {text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Interactive AI Playground Card */}
        <motion.div 
          className="hero-right"
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ position: 'relative' }}
        >
          {/* Animated background glow behind card */}
          <div style={{ position: 'absolute', inset: -18, background: 'radial-gradient(circle, rgba(32, 246, 199, 0.08) 0%, transparent 70%)', filter: 'blur(48px)', zIndex: 0, pointerEvents: 'none' }} />
          
          <div 
            className="border-gradient-glow"
            style={{ 
              width: '100%',
              maxWidth: '520px',
              padding: '22px 20px 20px',
              boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
              borderRadius: '24px',
              background: 'rgba(10, 11, 26, 0.55)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
              zIndex: 1
            }}
          >
            {/* Header: Title, Subtitle and Advanced Mode Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: 0, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <FaWandMagicSparkles color="var(--accent)" size={18} style={{ filter: 'drop-shadow(0 0 8px rgba(0,245,160,0.5))' }} /> 
                  AI Playground
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--text2)', margin: '4px 0 0 0' }}>Generate a quick sample before signing up.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro Mode</span>
                <Switch checked={advancedMode} onChange={setAdvancedMode} />
              </div>
            </div>

            {/* Input Text Area Container with focus glow */}
            <div style={{ 
              background: 'rgba(7, 8, 13, 0.65)', 
              border: isFocused ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '16px', 
              padding: '14px 16px', 
              marginBottom: 12,
              boxShadow: isFocused 
                ? '0 0 20px rgba(0,245,160,0.12), inset 0 2px 8px rgba(0,0,0,0.5)' 
                : 'inset 0 2px 8px rgba(0,0,0,0.4)',
              transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}>
              <textarea
                placeholder="What do you want to create today?"
                value={guestTopic}
                onChange={(e) => setGuestTopic(e.target.value.substring(0, 2000))}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                  width: '100%', background: 'transparent', border: 'none', color: '#fff', 
                  fontSize: 14.5, outline: 'none', minHeight: '62px', resize: 'none', padding: 0,
                  lineHeight: 1.5
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 10.5, color: 'var(--text3)', marginTop: 4 }}>
                {guestTopic.length} / 2000
              </div>
            </div>

            {/* Suggestion Chips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                'Instagram caption for university gala',
                'LinkedIn post for new startup',
                'Email draft for event invitation',
                'Hashtags for fashion brand'
              ].map(s => {
                let displayLabel = s;
                if (s.includes('gala')) displayLabel = 'University Gala';
                else if (s.includes('startup')) displayLabel = 'Startup Post';
                else if (s.includes('invitation')) displayLabel = 'Event Invite';
                else if (s.includes('fashion')) displayLabel = 'Fashion Tags';

                return (
                  <button 
                    key={s} 
                    onClick={() => handleSuggestionClick(s)}
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.06)', 
                      padding: '6px 12px', 
                      borderRadius: 99, 
                      fontSize: 11, 
                      fontWeight: 650,
                      color: 'var(--text2)', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)' 
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>

            <AnimatePresence initial={false}>
              {advancedMode && (
                <motion.div
                  className="landing-pro-controls"
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {/* Platform Picker */}
                  <div className="landing-platform-block">
                    <label className="landing-control-label">Platform</label>
                    <div className="landing-platform-picker">
                      {socialPlatforms.map((platform) => {
                        const Icon = platform.icon
                        const active = guestPlatform === platform.id
                        return (
                          <motion.button
                            type="button"
                            key={platform.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleGuestPlatformChange(platform.id)}
                            className={`landing-platform-chip ${active ? 'active' : ''}`}
                            style={{ '--platform-color': platform.color, '--platform-accent': platform.accent }}
                          >
                            <Icon size={15} />
                            <span>{platform.label}</span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="landing-selected-platform">
                    {React.createElement(guestPlatformMeta.icon, { size: 15 })}
                    <span>{guestPlatformMeta.label} workflow</span>
                    <small>{guestFormatOptions.slice(0, 3).join(' / ')}</small>
                  </div>

                  {/* Configuration Selectors */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
                    <div>
                      <label className="landing-control-label">Tone</label>
                      <div style={{ position: 'relative' }}>
                        <select 
                          value={guestTone} 
                          onChange={(e) => setGuestTone(e.target.value)}
                          style={{ 
                            padding: '10px 12px', 
                            background: 'rgba(7, 8, 13, 0.6)', 
                            border: '1px solid rgba(255,255,255,0.08)', 
                            borderRadius: 12, 
                            color: '#fff', 
                            fontSize: 12.5, 
                            fontWeight: 600,
                            cursor: 'pointer', 
                            outline: 'none', 
                            width: '100%',
                            appearance: 'none',
                            WebkitAppearance: 'none'
                          }}
                        >
                          {TONES.map(t => <option key={t} value={t} style={{ background: '#0e101f' }}>{t}</option>)}
                        </select>
                        <MdExpandMore style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text3)' }} size={16} />
                      </div>
                    </div>

                    <div>
                      <label className="landing-control-label">Format</label>
                      <div style={{ position: 'relative' }}>
                        <select 
                          value={guestContentType} 
                          onChange={(e) => setGuestContentType(e.target.value)}
                          style={{ 
                            padding: '10px 12px', 
                            background: 'rgba(7, 8, 13, 0.6)', 
                            border: '1px solid rgba(255,255,255,0.08)', 
                            borderRadius: 12, 
                            color: '#fff', 
                            fontSize: 12.5, 
                            fontWeight: 600,
                            cursor: 'pointer', 
                            outline: 'none', 
                            width: '100%',
                            appearance: 'none',
                            WebkitAppearance: 'none'
                          }}
                        >
                          {guestFormatOptions.map(c => <option key={c} value={c} style={{ background: '#0e101f' }}>{c}</option>)}
                        </select>
                        <MdExpandMore style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text3)' }} size={16} />
                      </div>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 2 }}
                  >
                    <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text3)', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>Language Preset</label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        value={guestLanguage} 
                        onChange={(e) => setGuestLanguage(e.target.value)}
                        style={{ 
                          padding: '10px 12px', 
                          background: 'rgba(7, 8, 13, 0.6)', 
                          border: '1px solid rgba(255,255,255,0.08)', 
                          borderRadius: 12, 
                          color: '#fff', 
                          fontSize: 12.5, 
                          fontWeight: 650,
                          cursor: 'pointer', 
                          outline: 'none', 
                          width: '100%',
                          appearance: 'none',
                          WebkitAppearance: 'none'
                        }}
                      >
                        {['English', 'Spanish', 'French', 'German', 'Urdu'].map(l => <option key={l} value={l} style={{ background: '#0e101f' }}>{l}</option>)}
                      </select>
                      <MdExpandMore style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text3)' }} size={16} />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Switches and Extras */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                <AnimatedEmojiToggle value={guestIncludeEmojis} onChange={setGuestIncludeEmojis} />
              </div>
            </div>

            {/* Glowing Generate Button */}
            <motion.button
              whileHover={guestLoading ? {} : { scale: 1.03, boxShadow: '0 0 30px rgba(0,245,160,0.5)' }}
              whileTap={guestLoading ? {} : { scale: 0.97 }}
              onClick={handleGuestGenerate}
              disabled={guestLoading}
              style={{ 
                background: guestLimitReached
                  ? 'linear-gradient(135deg, rgba(255,184,48,0.95), rgba(32,246,199,0.95))'
                  : 'linear-gradient(135deg, var(--accent), #00d4ff)', 
                border: 'none', 
                borderRadius: '14px', 
                padding: '14px 20px', 
                color: '#07080d', 
                fontSize: 15, 
                fontWeight: 750, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8, 
                cursor: guestLoading ? 'not-allowed' : 'pointer',
                width: '100%', 
                boxShadow: '0 4px 20px rgba(0,245,160,0.25)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
            >
              {guestLoading ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>Writing</span>
                  <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                    <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} style={{ width: 4, height: 4, background: '#07080d', borderRadius: '50%', display: 'inline-block' }} />
                    <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }} style={{ width: 4, height: 4, background: '#07080d', borderRadius: '50%', display: 'inline-block' }} />
                    <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }} style={{ width: 4, height: 4, background: '#07080d', borderRadius: '50%', display: 'inline-block' }} />
                  </div>
                </div>
              ) : (
                <>
                  {guestLimitReached ? <MdArrowForward size={17} /> : <FaWandMagicSparkles size={16} />}
                  {guestLimitReached ? 'View Plans to Continue' : 'Generate Content'}
                </>
              )}
            </motion.button>

            {/* Limit Reached Premium CTA Card */}
            {guestLimitReached && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                style={{ 
                  marginTop: 20, 
                  padding: '16px', 
                  background: 'linear-gradient(135deg, rgba(139,122,255,0.1), rgba(0,245,160,0.06))', 
                  border: '1px solid rgba(0,245,160,0.4)', 
                  borderRadius: '16px', 
                  boxShadow: '0 8px 32px rgba(0,245,160,0.08)'
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ background: 'var(--accent)', color: '#000', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>!</div>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: 13.5, fontWeight: 700 }}>Guest limit reached</h4>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text2)', fontSize: 12, lineHeight: 1.4 }}>
                      Create a free account to continue generating and saving content.
                    </p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  onClick={openUpgradeFlow} 
                  style={{ 
                    width: '100%', 
                    background: 'var(--accent)', 
                    color: '#000', 
                    padding: '10px', 
                    borderRadius: 10, 
                    fontWeight: 750, 
                    fontSize: 12.5,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  View Free & Pro Options
                </motion.button>
              </motion.div>
            )}

            {/* Output container */}
            <AnimatePresence>
              {guestOutput && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.97 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 15, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ 
                    marginTop: 20, 
                    borderTop: '1px solid rgba(255,255,255,0.06)', 
                    paddingTop: 18,
                    textAlign: 'left'
                  }}
                >
                  <div style={{ 
                    padding: '16px', 
                    background: 'rgba(7, 8, 13, 0.45)', 
                    border: '1px solid rgba(0, 245, 160, 0.25)', 
                    borderRadius: '16px', 
                    position: 'relative',
                    boxShadow: '0 8px 32px rgba(0, 245, 160, 0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MdAutoAwesome/> Generation Result
                      </span>
                      <motion.button 
                        whileHover={{ scale: 1.05, color: '#fff', backgroundColor: 'rgba(255,255,255,0.12)' }} 
                        onClick={() => copyToClipboard(guestOutput)} 
                        style={{ 
                          background: 'rgba(255,255,255,0.06)', 
                          border: '1px solid rgba(255,255,255,0.08)', 
                          color: 'var(--text2)', 
                          cursor: 'pointer', 
                          padding: '6px 12px', 
                          borderRadius: 8, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          fontSize: 11,
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        <MdContentCopy size={13} /> Copy
                      </motion.button>
                    </div>
                    
                    <p style={{ color: '#fff', fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', margin: 0, paddingRight: 4 }}>
                      {guestOutput}
                    </p>

                    {/* Guest save CTA */}
                    <div style={{ 
                      marginTop: 14, 
                      paddingTop: 12, 
                      borderTop: '1px dashed rgba(255,255,255,0.08)', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>Want to save your content to history?</span>
                      <motion.button 
                        whileHover={{ scale: 1.05 }} 
                        onClick={() => navigate('/auth?tab=signup')} 
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: 'var(--accent)', 
                          fontSize: 11.5, 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        Create an account <MdArrowForward size={14} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </section>

      {/* ── Content Tools Section ───────────────── */}
      <section id="features" className="landing-section landing-tools-section">
        
        <div className="landing-section-heading">
          <span style={{ display: 'inline-block', background: 'rgba(139,122,255,0.1)', color: 'var(--accent3)', padding: '6px 16px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Workspace Features</span>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(30px, 3.5vw, 42px)', fontWeight: 800, color: '#fff', letterSpacing: 0 }}>
            Core tools for content generation.
          </h2>
        </div>

        <div className="landing-section-shell">
          
          {/* Card 1: Features List (Col span 7) */}
          <div className="bento-card bento-span-7 landing-feature-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(0, 245, 160, 0.1)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'var(--accent)' }}>
                <FaWandMagicSparkles size={16} style={{ margin: 'auto' }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Power Tools</h3>
            </div>
            
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              SmartGen AI integrates all tools in a single unified dashboard, allowing custom style variations.
            </p>

            <div className="landing-feature-grid">
              {FEATURES.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid rgba(255, 255, 255, 0.04)', 
                    borderRadius: '16px', 
                    padding: '16px',
                    transition: 'all 0.2s'
                  }}
                  className="hover-lift"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: item.color }}>
                    <item.icon size={16} />
                    <h4 style={{ fontSize: 14, fontWeight: 650, color: '#fff' }}>{item.title}</h4>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Vision AI Section ───────────────── */}
      <section id="voice-ai" className="landing-section landing-voice-section">
        <div className="landing-section-heading">
          <span className="landing-voice-eyebrow">Voice Cloning Beta</span>
          <h2>Turn one topic into a voice-ready story.</h2>
          <p>Generate a natural script, clone an authorized voice sample, and keep using SmartGen while the audio renders in the background.</p>
        </div>

        <div className="landing-voice-showcase">
          <div className="landing-voice-copy">
            <div className="landing-voice-icon"><MdRecordVoiceOver /></div>
            <div>
              <h3>Topic to Script to Voice</h3>
              <p>Record or upload a permitted sample, let AI prepare the script, then download the generated MP3 result.</p>
              <div className="landing-voice-points">
                <span><MdCheckCircle /> Background generation</span>
                <span><MdCheckCircle /> Natural pacing controls</span>
                <span><MdOutlineSecurity /> Consent-first and temporary</span>
              </div>
            </div>
          </div>

          <div className="landing-voice-action">
            <div className="landing-voice-wave" aria-hidden="true">
              <span /><span /><span /><span /><span /><span /><span />
            </div>
            <button type="button" onClick={openVoiceCloning}>
              {user ? 'Open Voice Cloning' : 'Sign in to Use Voice Cloning'}
              <MdArrowForward />
            </button>
            <small>Optimized for clear English speech</small>
          </div>
        </div>
      </section>
      <section id="vision-ai" className="landing-section landing-vision-section">
        <div className="landing-section-heading">
          <span style={{ display: 'inline-block', background: 'rgba(139,122,255,0.1)', color: 'var(--accent3)', padding: '6px 16px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Image AI</span>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(30px, 3.5vw, 42px)', fontWeight: 800, color: '#fff', letterSpacing: 0 }}>
            Analyze one image and generate ready content.
          </h2>
        </div>

        <div className="landing-section-shell landing-narrow-shell">
          <div className="bento-card landing-vision-card landing-solo-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: 'rgba(139, 122, 255, 0.1)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'var(--accent3)' }}>
                  <FaImage size={16} style={{ margin: 'auto' }} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Vision AI Analyzer</h3>
              </div>

              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                Drop an image and Gemini will read visual cues to write relevant tags, summaries or copy.
              </p>

              {/* Upload Interface */}
              <div style={{ marginBottom: 16 }}>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(139, 122, 255, 0.3)', borderRadius: '14px',
                    padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                    background: 'rgba(7, 8, 13, 0.3)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(139, 122, 255, 0.3)'}
                >
                  <MdUpload size={32} color="var(--accent3)" style={{ marginBottom: 8 }} />
                  <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    {visionImage ? visionImage.name : 'Choose local image'}
                  </p>
                  <span style={{ color: 'var(--text3)', fontSize: 10 }}>Max size 5MB</span>
                </div>
              </div>

              {/* Text Prompt input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Optional prompt input (e.g. explain image)"
                  value={visionPrompt}
                  onChange={(e) => setVisionPrompt(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(7, 8, 13, 0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', color: '#fff', fontSize: 12, outline: 'none' }}
                />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label className="landing-control-label">Target platform</label>
                    <div className="landing-platform-picker compact">
                      {socialPlatforms.slice(0, 7).map((platform) => {
                        const Icon = platform.icon
                        const active = visionPlatform === platform.id
                        return (
                          <motion.button
                            type="button"
                            key={platform.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setVisionPlatform(platform.id)}
                            className={`landing-platform-chip ${active ? 'active' : ''}`}
                            style={{ '--platform-color': platform.color, '--platform-accent': platform.accent }}
                          >
                            <Icon size={14} />
                            <span>{platform.label}</span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                    <AnimatedEmojiToggle value={visionIncludeEmojis} onChange={setVisionIncludeEmojis} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(139,122,255,0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVisionGenerate}
                disabled={visionLoading}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, rgba(139,122,255,0.8), #6b5cd6)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: visionLoading ? 'not-allowed' : 'pointer' }}
              >
                <MdAutoAwesome size={16} />
                {user ? 'Continue in Image Studio' : 'Sign in to Generate'}
              </motion.button>

              {visionOutput && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 12, padding: '12px', background: 'rgba(7, 8, 13, 0.5)', border: '1px solid rgba(139,122,255,0.3)', borderRadius: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--accent3)', fontWeight: 700 }}>Result</span>
                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => copyToClipboard(visionOutput)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                      <MdContentCopy size={10} /> Copy
                    </motion.button>
                  </div>
                  <p style={{ color: '#fff', fontSize: 11, lineHeight: 1.4, whiteSpace: 'pre-wrap', textAlign: 'left' }}>{visionOutput}</p>
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ── How It Works Section ───────────────── */}
      <section id="how-it-works" className="landing-section landing-process-section">
        <div className="landing-section-heading">
          <span style={{ display: 'inline-block', background: 'rgba(0,212,255,0.1)', color: 'var(--accent2)', padding: '6px 16px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>How It Works</span>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(30px, 3.5vw, 42px)', fontWeight: 800, color: '#fff', letterSpacing: 0 }}>
            Four steps from idea to final content.
          </h2>
        </div>

        <div className="landing-section-shell landing-narrow-shell">
          <div className="bento-card landing-process-card landing-solo-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: 'rgba(0, 212, 255, 0.1)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'var(--accent2)' }}>
                  <MdAutoAwesome size={16} style={{ margin: 'auto' }} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>How It Works</h3>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                Generate optimized content in 4 simple stages.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
              {STEPS.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    color: step.color,
                    fontWeight: 800,
                    width: 32, height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    boxShadow: `0 0 10px ${step.color}15`
                  }}>
                    {step.n}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{step.title}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Pricing Section ───────────────── */}
      <section id="pricing" className="landing-section landing-pricing-section">
        <div className="landing-pricing-teaser">
          <span>Free tier available</span>
          <h2>Choose a plan only when you need more.</h2>
          <p>Start with the free playground. When guest limits end, compare Starter and Pro options before creating an account.</p>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(32,246,199,0.28)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowPricing((value) => !value)}
            className="landing-see-plans-button"
          >
            {showPricing ? 'Hide Plans' : 'See Plans'}
            <MdArrowForward size={18} />
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {showPricing && (
            <motion.div
              className="landing-pricing-panel"
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 16, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="bento-card landing-pricing-card landing-solo-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: 'rgba(255, 217, 61, 0.1)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                  <MdCheckCircle size={16} style={{ margin: 'auto' }} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Plans & Pricing</h3>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                Clear tiers for demos and real creator workflows. Payment activation would need backend billing integration.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, alignItems: 'stretch' }}>
              {PLANS.map((plan, idx) => (
                <div 
                  key={idx} 
                  className={`landing-plan-card ${plan.popular ? 'popular' : ''}`}
                  style={{
                    background: plan.popular ? 'rgba(0, 245, 160, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                    border: `1px solid ${plan.popular ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {plan.popular && (
                    <div style={{ position: 'absolute', top: -10, right: 10, background: 'var(--accent)', color: '#000', padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>
                      PRO CHOICE
                    </div>
                  )}
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{plan.name}</h4>
                    <span style={{ fontSize: 26, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 6 }}>{plan.price}<span style={{ fontSize: 12, color: 'var(--text3)' }}>/mo</span></span>
                    <p style={{ margin: '0 0 14px', color: 'var(--text2)', fontSize: 12.5, lineHeight: 1.45 }}>{plan.desc}</p>
                    
                    <ul style={{ padding: 0, margin: '0 0 20px 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11, color: 'var(--text2)' }}>
                      {plan.features.map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MdCheckCircle size={14} color={plan.popular ? 'var(--accent)' : 'var(--accent2)'} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.03 }} 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { plan.price === '$0' ? navigate('/auth?tab=signup') : handleProUpgrade() }}
                    style={{ 
                      width: '100%', padding: '10px', borderRadius: '8px', fontSize: 12, fontWeight: 700,
                      background: plan.popular ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      color: plan.popular ? '#000' : '#fff', border: 'none', cursor: 'pointer'
                    }}
                  >
                    {plan.cta}
                  </motion.button>
                </div>
              ))}
            </div>
          </div>

            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────── */}
      <section id="faqs" style={{ padding: '60px 20px 80px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px, 3.5vw, 36px)', fontWeight: 800, color: '#fff', letterSpacing: 0 }}>
            Frequently Asked Questions
          </h2>
        </div>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {FAQS.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <motion.div
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  padding: '20px 24px', marginBottom: 12,
                  background: 'rgba(20, 22, 41, 0.4)', border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '16px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(20, 22, 41, 0.8)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(20, 22, 41, 0.4)'}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{faq.q}</span>
                {openFaq === i ? <MdExpandLess size={22} color="var(--accent)" /> : <MdExpandMore size={22} color="var(--text3)" />}
              </motion.div>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 24px 20px', color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA Banner ────────────────────────────────────────── */}
      <section style={{ padding: '40px 20px 80px', position: 'relative', zIndex: 10 }}>
        <div 
          className="border-gradient-glow"
          style={{ 
            maxWidth: '1000px', 
            margin: '0 auto', 
            padding: '50px 32px', 
            textAlign: 'center',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0, 245, 160, 0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: -1 }} />
          
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: 0 }}>
            Ready to supercharge your content workflow?
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 16, maxWidth: '580px', margin: '0 auto 32px', lineHeight: 1.5 }}>
            Create custom templates, keep active histories, and generate unlimited copy options with our Pro plans.
          </p>

          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,245,160,0.5)' }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/auth?tab=signup')}
            style={{ background: 'linear-gradient(135deg, var(--accent), #00d4ff)', color: '#010203', padding: '14px 32px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Start Creating Free <MdArrowForward size={18} />
          </motion.button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ padding: '64px 40px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10, 11, 26, 0.9)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, color: '#07080d'
              }}>S</div>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: '#fff' }}>
                Smart<span style={{ color: 'var(--accent)' }}>Gen</span> AI
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              Premium AI-powered content generation platform for modern creators, digital marketers, and agencies.
            </p>
          </div>
          
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Platform Navigation</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Features', 'Voice AI', 'Vision AI', 'How It Works', 'Pricing', 'FAQs'].map(link => (
                <motion.button key={link} whileHover={{ x: 4, color: '#fff' }} onClick={() => scrollToSection(link.toLowerCase().replace(/\s+/g, '-'))}
                  style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  {link}
                </motion.button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Core Functions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Text Generation', 'Vision Analysis', 'Content Rewriting', 'Platform Presets'].map(feature => (
                <span key={feature} style={{ fontSize: 13, color: 'var(--text2)' }}>{feature}</span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Connect</h4>
            <div style={{ display: 'flex', gap: 12 }}>
              {FOOTER_SOCIALS.map(({ icon: Icon, label, className }) => (
                <a key={label} href="#" aria-label={label} className={`footer-social-link ${className}`}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{ maxWidth: 1200, margin: '64px auto 0', paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>© 2026 SmartGen AI. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MdFlashOn color="var(--accent)" /> Gemini API Integration
            </span>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {upgradeModalOpen && (
          <UpgradeProModal
            open={upgradeModalOpen}
            authRequired={!user}
            onClose={() => setUpgradeModalOpen(false)}
            onCheckout={() => {
              if (!user) {
                navigate('/auth?tab=signup', {
                  state: {
                    returnTo: '/dashboard',
                    destinationState: { openUpgrade: true },
                    intentLabel: 'Sign in to upgrade your plan and unlock Pro features.'
                  }
                })
                return
              }
              setCheckoutReady(true)
              toast('Checkout details prepared for SmartGen Pro.', 'success')
            }}
          />
        )}
      </AnimatePresence>
      {checkoutReady && <div className="checkout-status-pill">Checkout request ready - payment gateway can be connected here.</div>}

      <div className="support-chat-shell">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              className="support-chat-panel"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              <div className="support-chat-header">
                <div>
                  <span><MdSupportAgent size={18} /> SmartGen Assistant</span>
                  <small>Support answers + optional AI mode</small>
                </div>
                <button type="button" aria-label="Close chat" onClick={() => setChatOpen(false)}>
                  <MdClose size={18} />
                </button>
              </div>

              <div className="support-chat-modes">
                {[
                  { id: 'support', label: 'Support', icon: MdQuestionAnswer },
                  { id: 'ai', label: 'AI Mode', icon: FaWandMagicSparkles }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={chatMode === id ? 'active' : ''}
                    onClick={() => setChatMode(id)}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="support-chat-messages">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`support-chat-message ${message.role}`}>
                    {message.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="support-chat-message assistant">
                    Thinking...
                  </div>
                )}
              </div>

              <div className="support-chat-quick">
                {SUPPORT_QUICK_PROMPTS.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => handleChatSubmit(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                className="support-chat-input"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleChatSubmit()
                }}
              >
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={chatMode === 'support' ? 'Ask about pricing, login, API errors...' : 'Ask a custom AI question...'}
                />
                <button type="submit" disabled={chatLoading || !chatInput.trim()} aria-label="Send chat message">
                  <MdSend size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          className="support-chat-button"
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setChatOpen((value) => !value)}
          aria-label={chatOpen ? 'Close SmartGen support chat' : 'Open SmartGen support chat'}
        >
          {chatOpen ? <MdClose size={20} /> : <MdSupportAgent size={21} />}
          <span>{chatOpen ? 'Close' : 'Support'}</span>
        </motion.button>
      </div>
    </div>
  )
}








