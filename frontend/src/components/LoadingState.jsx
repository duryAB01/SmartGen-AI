import React from 'react'
import { motion } from 'framer-motion'
import { MdAutoAwesome } from 'react-icons/md'

export default function LoadingState({ label = 'Creating your content...', compact = false }) {
  return (
    <div className={`premium-loading-state ${compact ? 'compact' : ''}`} role="status" aria-live="polite">
      <div className="premium-loader-visual" aria-hidden="true">
        <motion.span
          className="premium-loader-orbit"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
        >
          <i /><i /><i />
        </motion.span>
        <motion.span
          className="premium-loader-core"
          animate={{ scale: [0.9, 1.06, 0.9], opacity: [0.78, 1, 0.78] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <MdAutoAwesome />
        </motion.span>
      </div>
      <div className="premium-loader-copy">
        <strong>{label}</strong>
        <span>SmartGen is shaping a polished result</span>
        <div className="premium-loader-shimmer"><i /></div>
      </div>
    </div>
  )
}
