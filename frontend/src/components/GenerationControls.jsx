import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdCheckCircle, MdAutoAwesome, MdExpandMore } from 'react-icons/md'

const getOptionId = (item) => (typeof item === 'string' ? item : item.id)
const getOptionLabel = (item) => (typeof item === 'string' ? item : item.label)

export function PlatformSelector({ platforms, value, onChange }) {
  return (
    <div className="gen-chip-grid">
      {platforms.map((item) => {
        const id = getOptionId(item)
        const label = getOptionLabel(item)
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

export function PlatformDropdownSelector({ platforms, value, onChange, title = 'Select platform', hint = 'Formats below update automatically.', summary }) {
  const [open, setOpen] = useState(false)
  const selected = platforms.find((item) => getOptionId(item) === value || getOptionLabel(item) === value) || platforms[0]
  const selectedId = getOptionId(selected)
  const selectedLabel = getOptionLabel(selected)
  const SelectedIcon = selected?.icon || MdAutoAwesome
  const selectedColor = selected?.color || '#00e5b0'
  const selectedAccent = selected?.accent || selectedColor
  const selectedSummary = summary || selected?.summary || selected?.desc || `${selectedLabel} workflow`

  return (
    <div className="dashboard-platform-shell">
      <motion.button
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="dashboard-platform-summary"
        onClick={() => setOpen((next) => !next)}
        style={{ '--platform-color': selectedColor, '--platform-accent': selectedAccent }}
      >
        <span className="dashboard-platform-icon">
          <SelectedIcon size={18} />
        </span>
        <span className="dashboard-platform-copy">
          <strong>{selectedLabel} workflow</strong>
          <small>{selectedSummary}</small>
        </span>
        <MdExpandMore className={open ? 'open' : ''} size={20} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="dashboard-platform-popover"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="dashboard-platform-popover-head">
              <span>{title}</span>
              <small>{hint}</small>
            </div>
            <div className="dashboard-platform-picker">
              {platforms.map((item) => {
                const id = getOptionId(item)
                const label = getOptionLabel(item)
                const Icon = item?.icon || MdAutoAwesome
                const active = selectedId === id || value === label
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => { onChange(id); setOpen(false) }}
                    className={`dashboard-platform-chip ${active ? 'active' : ''}`}
                    style={{ '--platform-color': item?.color || '#00e5b0', '--platform-accent': item?.accent || item?.color || '#00e5b0' }}
                  >
                    <Icon size={15} />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="dashboard-format-grid">
      {options.map((item) => {
        const id = item.id || item
        const label = item.label || item
        const Icon = item.icon || MdAutoAwesome
        const active = selected.includes(id)
        return (
          <motion.button
            type="button"
            key={id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`dashboard-format-card ${active ? 'active' : ''}`}
            onClick={() => toggle(id)}
            style={{ '--format-color': item.color || '#00e5b0' }}
          >
            <Icon size={16} />
            <span>{label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

export function ToneSelector({ tones, value, onChange }) {
  const toneItems = tones.map((tone) => (typeof tone === 'string' ? { id: tone, label: tone } : tone))
  return (
    <div className="dashboard-tone-grid">
      {toneItems.map((item) => (
        <motion.button
          type="button"
          key={item.id || item.label}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`dashboard-tone-chip ${value === item.id || value === item.label ? 'active' : ''}`}
          onClick={() => onChange(item.id || item.label)}
        >
          <strong>{item.label}</strong>
          {item.desc && <span>{item.desc}</span>}
        </motion.button>
      ))}
    </div>
  )
}

export function UsageRemainingBadge({ stats }) {
  if (!stats) return <span className="usage-badge muted">Usage limit unavailable</span>
  return <span className="usage-badge">{stats.remainingToday ?? 0} credits left today</span>
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
