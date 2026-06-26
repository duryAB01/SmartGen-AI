import React from 'react'
import { flushSync } from 'react-dom'
import { motion } from 'framer-motion'
import { MdDarkMode, MdLightMode } from 'react-icons/md'
import { useTheme } from '../App.jsx'

export default function WorkspaceThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'
  const nextMode = isLight ? 'dark' : 'light'

  const handleToggle = (event) => {
    const x = event.clientX
    const y = event.clientY
    document.documentElement.style.setProperty('--theme-reveal-x', `${x}px`)
    document.documentElement.style.setProperty('--theme-reveal-y', `${y}px`)

    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      toggleTheme()
      return
    }

    document.startViewTransition(() => {
      flushSync(() => toggleTheme())
    })
  }

  return (
    <motion.button
      type="button"
      className={`workspace-header-theme-button ${isLight ? 'is-light' : 'is-dark'}`}
      onClick={handleToggle}
      aria-label={`Switch to ${nextMode} mode`}
      title={`Switch to ${nextMode} mode`}
      whileTap={{ scale: 0.94 }}
    >
      <span className="theme-switch-track" aria-hidden="true">
        <MdDarkMode className="theme-track-icon moon" size={13} />
        <MdLightMode className="theme-track-icon sun" size={14} />
        <motion.span
          className="theme-switch-thumb"
          animate={{ x: isLight ? 24 : 0, rotate: isLight ? 360 : 0 }}
          transition={{ type: 'spring', stiffness: 430, damping: 28 }}
        >
          <motion.span
            key={theme}
            initial={{ scale: 0.65, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
          >
            {isLight ? <MdLightMode size={15} /> : <MdDarkMode size={14} />}
          </motion.span>
        </motion.span>
      </span>
    </motion.button>
  )
}
