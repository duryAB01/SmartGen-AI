import React from 'react'
import { MdErrorOutline } from 'react-icons/md'

export default function ErrorAlert({ message, title = 'Generation failed' }) {
  if (!message) return null

  return (
    <div
      className="card"
      style={{
        padding: '16px 18px',
        borderColor: 'rgba(255,107,157,0.25)',
        background: 'rgba(255,107,157,0.08)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start'
      }}
    >
      <MdErrorOutline size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{message}</div>
      </div>
    </div>
  )
}
