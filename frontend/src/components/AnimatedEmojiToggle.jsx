import React from 'react'
import { motion } from 'framer-motion'
import { FaFaceMeh, FaFaceSmile } from 'react-icons/fa6'

export default function AnimatedEmojiToggle({ value, onChange, label = 'Emojis', disabled = false }) {
  const toggleValue = () => {
    if (!disabled) onChange(!value)
  }

  return (
    <div className={`emoji-mode-toggle ${value ? 'is-on' : ''} ${disabled ? 'disabled' : ''}`}>
      <motion.button
        type="button"
        className="emoji-switch"
        disabled={disabled}
        aria-pressed={value}
        aria-label={`${label} ${value ? 'on' : 'off'}`}
        title={`${label} ${value ? 'on' : 'off'}`}
        onClick={toggleValue}
        whileTap={disabled ? {} : { scale: 0.95 }}
      >
        <span className="emoji-switch-track" aria-hidden="true">
          <span className="emoji-switch-glow" />
          <motion.span
            className="emoji-switch-thumb"
            animate={{ x: value ? 28 : 0, rotate: value ? 360 : 0, scale: value ? 1.04 : 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 27 }}
          >
            <motion.span
              key={value ? 'smile' : 'neutral'}
              initial={{ scale: 0.65, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.16 }}
            >
              {value ? <FaFaceSmile /> : <FaFaceMeh />}
            </motion.span>
          </motion.span>
        </span>
        {label && <span className="emoji-mode-label">{label}</span>}
      </motion.button>
    </div>
  )
}
