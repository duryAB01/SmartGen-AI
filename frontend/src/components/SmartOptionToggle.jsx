import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function SmartOptionToggle({ value, onChange, label = 'Hashtags', icon = '#', tooltip = 'Include relevant hashtags in generated content', disabled = false }) {
  const [isHovered, setIsHovered] = useState(false)

  const handleKeyDown = (e) => {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange(!value)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
      <div 
        className="smart-toggle-wrapper"
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      >
        <motion.div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-pressed={value}
          disabled={disabled}
          onClick={() => !disabled && onChange(!value)}
          onMouseEnter={() => !disabled && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onKeyDown={handleKeyDown}
          style={{
            height: 38,
            padding: '0 16px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
            userSelect: 'none',
            background: disabled
              ? 'rgba(255,255,255,0.02)'
              : value
                ? 'linear-gradient(135deg, rgba(0,245,160,0.12), rgba(0,212,255,0.12))'
                : 'rgba(255,255,255,0.03)',
            border: disabled
              ? '1px solid rgba(255,255,255,0.04)'
              : value
                ? '1px solid rgba(0,245,160,0.4)'
                : '1px solid rgba(255,255,255,0.08)',
            boxShadow: (!disabled && value)
              ? '0 0 14px rgba(0,245,160,0.18)'
              : 'none',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
          whileHover={disabled ? {} : { scale: 1.04, backgroundColor: value ? 'rgba(0,245,160,0.16)' : 'rgba(255,255,255,0.06)' }}
          whileTap={disabled ? {} : { scale: 0.96 }}
        >
          {/* Option Icon (e.g. # or another label) */}
          <span 
            style={{ 
              fontWeight: 800, 
              fontSize: 16, 
              color: disabled ? 'var(--text3)' : value ? 'var(--accent)' : 'var(--text2)',
              transition: 'color 0.2s'
            }}
          >
            {icon}
          </span>

          <span 
            style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: disabled ? 'var(--text3)' : value ? '#fff' : 'var(--text2)',
              transition: 'color 0.2s'
            }}
          >
            {label}
          </span>
        </motion.div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="smart-toggle-tooltip"
            style={{
              position: 'absolute',
              bottom: '120%',
              left: '50%',
              transform: 'translateX(-50%) translateY(4px)',
              background: '#0e101f',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 11,
              color: '#fff',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              opacity: isHovered ? 1 : 0,
              visibility: isHovered ? 'visible' : 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              transition: 'opacity 0.2s, transform 0.2s, visibility 0.2s',
              zIndex: 100
            }}
          >
            {tooltip}
          </div>
        )}
      </div>
    </div>
  )
}
