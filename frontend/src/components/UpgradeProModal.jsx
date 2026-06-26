import React from 'react'
import { motion } from 'framer-motion'
import { MdClose, MdCheckCircle, MdWorkspacePremium } from 'react-icons/md'

const FREE_FEATURES = [
  'Starter monthly generation allowance',
  'Core text, image, rewrite, and voice tools',
  'Saved history and preferences',
  'Standard generation queue'
]

const PRO_FEATURES = [
  'Higher daily and monthly generation limits',
  'Priority provider/model routing',
  'Premium platform output presets',
  'Voice and image workflow enhancements',
  'Advanced history and preference controls',
  'Priority support for workspace issues'
]

export default function UpgradeProModal({ open, onClose, onCheckout, authRequired = false }) {
  if (!open) return null

  return (
    <div className="upgrade-modal-backdrop" onClick={onClose}>
      <motion.div
        className="upgrade-modal pro-upgrade-modal"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="upgrade-modal-close" aria-label="Close upgrade modal" onClick={onClose}>
          <MdClose size={20} />
        </button>
        <span className="upgrade-modal-kicker"><MdWorkspacePremium /> SmartGen Pro</span>
        <h3>{authRequired ? 'Sign in to upgrade your plan.' : 'Upgrade your SmartGen workspace.'}</h3>
        <p>
          {authRequired
            ? 'Sign in to upgrade your plan and unlock Pro features with saved history and workspace preferences.'
            : 'Compare your current Starter workspace with Pro and continue when you are ready to activate premium limits.'}
        </p>

        <div className="upgrade-plan-grid upgrade-compare-grid">
          <div className="upgrade-plan-card">
            <strong>Starter</strong>
            <span className="upgrade-plan-price">$0<small>/mo</small></span>
            <p>For learning, demos, and light content creation.</p>
            <ul>
              {FREE_FEATURES.map((feature) => <li key={feature}><MdCheckCircle /> {feature}</li>)}
            </ul>
          </div>
          <div className="upgrade-plan-card popular">
            <span className="upgrade-plan-badge">Recommended</span>
            <strong>Pro</strong>
            <span className="upgrade-plan-price">$19<small>/mo</small></span>
            <p>For daily publishing, campaigns, and polished multi-platform workflows.</p>
            <ul>
              {PRO_FEATURES.map((feature) => <li key={feature}><MdCheckCircle /> {feature}</li>)}
            </ul>
          </div>
        </div>

        <div className="upgrade-modal-actions">
          <button type="button" className="upgrade-primary" onClick={onCheckout}>
            {authRequired ? 'Sign in to Upgrade' : 'Continue to Checkout'}
          </button>
          <button type="button" className="upgrade-secondary" onClick={onClose}>Maybe Later</button>
        </div>
      </motion.div>
    </div>
  )
}
