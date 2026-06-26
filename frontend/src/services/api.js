import axios from 'axios'

// Base URL from Vite environment variable — never hardcoded
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000 // AI generation can take longer than standard API calls
})

// ── Request Interceptor — attach JWT automatically ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('scg_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor — handle 401 globally ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear session and redirect
      localStorage.removeItem('scg_token')
      localStorage.removeItem('scg_user')
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

export default api
