import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import api from './services/api.js'

import LandingPage        from './pages/LandingPage.jsx'
import AuthPage           from './pages/AuthPage.jsx'
import Dashboard          from './pages/Dashboard.jsx'
import ImageGeneratorPage from './pages/ImageGeneratorPage.jsx'
import VoiceCloningPage   from './pages/VoiceCloningPage.jsx'
import HistoryPage        from './pages/HistoryPage.jsx'
import FeedbackPage       from './pages/FeedbackPage.jsx'
import AdminPage          from './pages/AdminPage.jsx'
import PreferencesPage    from './pages/PreferencesPage.jsx'
import ProfilePage        from './pages/ProfilePage.jsx'
import RewritePage        from './pages/RewritePage.jsx'

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

// ─── Toast Context ────────────────────────────────────────────────────────────
export const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

import { motion, AnimatePresence } from 'framer-motion'

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const show = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  const icons = { success: '✓', error: '✕', info: 'ℹ' }
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`toast ${t.type}`}
            >
              <span style={{ fontWeight: 700 }}>{icons[t.type]}</span>
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export const VoiceJobCtx = createContext(null)
export const useVoiceJob = () => useContext(VoiceJobCtx)

function VoiceJobProvider({ children }) {
  const showToast = useToast()
  const [job, setJob] = useState(null)
  const [jobId, setJobId] = useState(() => localStorage.getItem('scg_voice_job_id') || '')
  const notifiedRef = useRef('')

  const trackJob = useCallback((nextJob) => {
    const id = typeof nextJob === 'string' ? nextJob : nextJob?.id
    if (!id) return
    localStorage.setItem('scg_voice_job_id', id)
    notifiedRef.current = ''
    setJobId(id)
    if (typeof nextJob === 'object') setJob(nextJob)
  }, [])

  const clearJob = useCallback(() => {
    localStorage.removeItem('scg_voice_job_id')
    notifiedRef.current = ''
    setJobId('')
    setJob(null)
  }, [])

  const cancelJob = useCallback(async () => {
    if (!jobId) return
    const response = await api.delete('/voice/jobs/' + jobId)
    setJob(response.data?.job || null)
    localStorage.removeItem('scg_voice_job_id')
    setJobId('')
  }, [jobId])

  const downloadJobAudio = useCallback(async () => {
    if (!jobId) throw new Error('Voice job not found')
    return api.get('/voice/jobs/' + jobId + '/audio', {
      responseType: 'blob',
      timeout: 90_000
    })
  }, [jobId])

  useEffect(() => {
    if (!jobId) return undefined

    let active = true
    let timeoutId

    const poll = async () => {
      try {
        const response = await api.get('/voice/jobs/' + jobId)
        if (!active) return
        const nextJob = response.data?.job || null
        setJob(nextJob)

        if (nextJob?.status === 'completed') {
          if (notifiedRef.current !== nextJob.id + ':completed') {
            notifiedRef.current = nextJob.id + ':completed'
            showToast('Your voice result is ready.', 'success')
          }
          return
        }

        if (nextJob?.status === 'failed') {
          if (notifiedRef.current !== nextJob.id + ':failed') {
            notifiedRef.current = nextJob.id + ':failed'
            showToast(nextJob.error?.message || 'Voice generation failed.', 'error')
          }
          return
        }

        if (nextJob?.status === 'canceled') return
        timeoutId = setTimeout(poll, 3000)
      } catch (error) {
        if (!active) return
        if (error.response?.status === 404) clearJob()
        else timeoutId = setTimeout(poll, 5000)
      }
    }

    poll()
    return () => {
      active = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [jobId, clearJob, showToast])

  return (
    <VoiceJobCtx.Provider value={{
      job,
      jobId,
      trackJob,
      clearJob,
      cancelJob,
      downloadJobAudio
    }}>
      {children}
    </VoiceJobCtx.Provider>
  )
}
export default function App() {
  // Read user and token from localStorage on init
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('scg_user')) } catch { return null }
  })

  // login: stores both user object and JWT token
  const login = (userData, token) => {
    setUser(userData)
    localStorage.setItem('scg_user', JSON.stringify(userData))
    if (token) localStorage.setItem('scg_token', token)
  }

  // logout: clears all session data
  const logout = () => {
    setUser(null)
    localStorage.removeItem('scg_user')
    localStorage.removeItem('scg_token')
    localStorage.removeItem('scg_voice_job_id')
  }

  const [theme, setTheme] = useState(() => localStorage.getItem('scg_theme') || 'dark')

  const toggleTheme = () => {
    setTheme(current => {
      const next = current === 'dark' ? 'light' : 'dark'
      document.body.dataset.workspaceTheme = next
      localStorage.setItem('scg_theme', next)
      return next
    })
  }

  useEffect(() => {
    document.body.dataset.workspaceTheme = theme
  }, [theme])

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      <ThemeCtx.Provider value={{ theme, toggleTheme }}>
        <ToastProvider>
          <VoiceJobProvider>
          <BrowserRouter basename={import.meta.env.DEV ? '/' : '/SmartGen-AI'}>
            <Routes>
              <Route path="/"          element={<LandingPage />} />
              <Route path="/auth"      element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
              <Route path="/image-gen" element={user ? <ImageGeneratorPage /> : <Navigate to="/auth" />} />
              <Route path="/voice-cloning" element={user ? <VoiceCloningPage /> : <Navigate to="/auth" />} />
              <Route path="/rewrite"   element={user ? <RewritePage /> : <Navigate to="/auth" />} />
              <Route path="/history"   element={user ? <HistoryPage /> : <Navigate to="/auth" />} />
              <Route path="/feedback"  element={user ? <FeedbackPage /> : <Navigate to="/auth" />} />
              <Route path="/profile"   element={user ? <ProfilePage /> : <Navigate to="/auth" />} />
              <Route path="/preferences" element={user ? <PreferencesPage /> : <Navigate to="/auth" />} />
              <Route path="/admin"     element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/dashboard" />} />
              <Route path="*"          element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
          </VoiceJobProvider>
        </ToastProvider>
      </ThemeCtx.Provider>
    </AuthCtx.Provider>
  )
}

