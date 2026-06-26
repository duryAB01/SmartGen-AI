import React from 'react'
import { motion } from 'framer-motion'
import { MdCheckCircle, MdAutoAwesome } from 'react-icons/md'

export function PlatformSelector({ platforms, value, onChange }) {
  return (
    <div className="gen-chip-grid">
      {platforms.map((item) => {
        const id = typeof item === 'string' ? item : item.id
        const label = typeof item === 'string' ? item : item.label
        const active = value === id || value === label
        return (
          <motion.button
            type="button"
            key={id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`gen-chip ${active ? 'active' : ''}`}
            onClick={() => onChange(id)}
          >
            {label}
          </motion.button>
        )
      })}
    </div>
  )
}

export function OutputTypeSelector({ options, value, onChange, multi = false }) {
  const selected = Array.isArray(value) ? value : [value]
  const toggle = (id) => {
    if (!multi) return onChange(id)
    if (selected.includes(id)) return onChange(selected.length === 1 ? selected : selected.filter((item) => item !== id))
    return onChange([...selected, id])
  }

  return (
    <div className="gen-chip-grid output-types">
      {options.map((item) => {
        const id = item.id || item
        const label = item.label || item
        const active = selected.includes(id)
        return (
          <motion.button
            type="button"
            key={id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`gen-chip ${active ? 'active' : ''}`}
            onClick={() => toggle(id)}
          >
            {label}
          </motion.button>
        )
      })}
    </div>
  )
}

export function ToneSelector({ tones, value, onChange }) {
  return <PlatformSelector platforms={tones} value={value} onChange={onChange} />
}

export function UsageRemainingBadge({ stats }) {
  if (!stats) return <span className="usage-badge muted">Usage limit unavailable</span>
  return <span className="usage-badge">{stats.remainingToday ?? 0} generations left today</span>
}

export function AutoSavedIndicator({ visible = true }) {
  if (!visible) return null
  return <span className="auto-saved-indicator"><MdCheckCircle /> Auto-saved to History</span>
}

export function GenerateButton({ loading, disabled, children, onClick }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className="btn btn-primary gen-generate-button"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <><span className="button-loading-dots" aria-hidden="true"><i /><i /><i /></span> Generating</> : <><MdAutoAwesome /> {children}</>}
    </motion.button>
  )
}
