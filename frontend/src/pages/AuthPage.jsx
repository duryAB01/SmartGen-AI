import React, { useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth, useToast } from '../App.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdVisibility, MdVisibilityOff, MdArrowBack,
  MdLogin, MdPersonAdd, MdVerifiedUser
} from 'react-icons/md'
import api from '../services/api.js'

export default function AuthPage() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') === 'signup' ? 'signup' : 'login')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const [loginForm, setLoginForm]   = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]         = useState({})

  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.returnTo || '/dashboard'
  const destinationState = location.state?.destinationState || null
  const intentLabel = location.state?.intentLabel || ''

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateLogin = () => {
    const e = {}
    if (!loginForm.email)    e.email    = 'Email is required'
    if (!loginForm.password) e.password = 'Password is required'
    return e
  }
  const validateSignup = () => {
    const e = {}
    if (!signupForm.name)    e.name    = 'Name is required'
    if (!signupForm.email.includes('@')) e.email = 'Valid email required'
    if (signupForm.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (signupForm.password !== signupForm.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  // ── Login Handler ────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = validateLogin()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setErrors({})

    try {
      const res = await api.post('/auth/login', {
        email: loginForm.email,
        password: loginForm.password
      })
      const { token, user } = res.data
      login(user, token)
      toast('Welcome back!', 'success')
      navigate(returnTo, { replace: true, state: destinationState })
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      toast(msg, 'error')
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  // ── Signup Handler ───────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault()
    const errs = validateSignup()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setErrors({})

    try {
      const res = await api.post('/auth/signup', {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password
      })
      const { token, user } = res.data
      login(user, token)
      toast('Account created! Welcome 🎉', 'success')
      navigate(returnTo, { replace: true, state: destinationState })
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.'
      toast(msg, 'error')
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      <div className="noise"/>
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="glow-orb"
        style={{ width: 600, height: 600, background: 'var(--accent)', filter: 'blur(100px)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', position: 'absolute', zIndex: 0 }}
      />

      {/* Back link */}
      <motion.button
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ x: -4 }}
        className="btn btn-ghost"
        onClick={() => navigate('/')}
        style={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}
      >
        <MdArrowBack size={16} style={{ marginRight: 6 }}/> Back to Landing
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            style={{
              width: 48, height: 48, background: 'var(--accent)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
              fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, color: '#07080d',
              boxShadow: '0 0 20px rgba(0,229,176,0.3)'
            }}
          >S</motion.div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800 }}>
            Smart<span style={{ color: 'var(--accent)' }}>Gen</span> AI
          </h1>
        </div>

        {intentLabel && (
          <div className="auth-intent-banner">
            <MdVerifiedUser size={18} />
            <div>
              <strong>Sign in to continue</strong>
              <span>{intentLabel}</span>
            </div>
          </div>
        )}
        {/* Card */}
        <motion.div layout className="card" style={{ padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 28 }}>
            <div className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErrors({}) }}>
              <MdLogin size={16} style={{ marginRight: 6, color: tab === 'login' ? '#00e5b0' : 'inherit' }}/> Sign In
            </div>
            <div className={`tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setErrors({}) }}>
              <MdPersonAdd size={16} style={{ marginRight: 6, color: tab === 'signup' ? '#00b8ff' : 'inherit' }}/> Join Us
            </div>
          </div>

          {/* General error banner */}
          {errors.general && (
            <div style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff4d6a' }}>
              {errors.general}
            </div>
          )}

          <AnimatePresence mode="wait">
            {tab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
              >
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input type="email" placeholder="you@example.com" value={loginForm.email}
                    onChange={e => setLoginForm(f => ({...f, email: e.target.value}))} />
                  {errors.email && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="form-error">{errors.email}</motion.div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                      style={{ paddingRight: 44 }}
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({...f, password: e.target.value}))} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPwd ? <MdVisibilityOff size={18}/> : <MdVisibility size={18}/>}
                    </button>
                  </div>
                  {errors.password && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="form-error">{errors.password}</motion.div>}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="btn btn-primary w-full"
                  type="submit" disabled={loading}
                  style={{ justifyContent: 'center', width: '100%', marginTop: 8 }}
                >
                  {loading ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="spinner"/>&nbsp;Signing in…</> : <><MdLogin size={18} style={{ marginRight: 8 }}/> Sign In</>}
                </motion.button>
                <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--text3)', background: 'rgba(0,229,176,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,229,176,0.1)' }}>
                  <MdVerifiedUser size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: '#00e5b0' }}/>
                  To access admin panel, register with any email then manually set role to 'admin' in MongoDB.
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignup}
              >
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" placeholder="Your Name" value={signupForm.name}
                    onChange={e => setSignupForm(f => ({...f, name: e.target.value}))} />
                  {errors.name && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="form-error">{errors.name}</motion.div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input type="email" placeholder="you@example.com" value={signupForm.email}
                    onChange={e => setSignupForm(f => ({...f, email: e.target.value}))} />
                  {errors.email && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="form-error">{errors.email}</motion.div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPwd ? 'text' : 'password'} placeholder="Min. 6 characters"
                      style={{ paddingRight: 44 }}
                      value={signupForm.password}
                      onChange={e => setSignupForm(f => ({...f, password: e.target.value}))} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPwd ? <MdVisibilityOff size={18}/> : <MdVisibility size={18}/>}
                    </button>
                  </div>
                  {errors.password && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="form-error">{errors.password}</motion.div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" placeholder="Re-enter password" value={signupForm.confirm}
                    onChange={e => setSignupForm(f => ({...f, confirm: e.target.value}))} />
                  {errors.confirm && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="form-error">{errors.confirm}</motion.div>}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="btn btn-primary w-full"
                  type="submit" disabled={loading}
                  style={{ justifyContent: 'center', width: '100%', marginTop: 8 }}
                >
                  {loading ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="spinner"/>&nbsp;Creating account…</> : <><MdPersonAdd size={18} style={{ marginRight: 8 }}/> Create Account</>}
                </motion.button>
                <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 16 }}>
                  By signing up you agree to our Terms &amp; Privacy Policy.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}
