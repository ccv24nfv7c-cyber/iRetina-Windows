import React, { useEffect, useState } from 'react'
import type { Prefs, EngineState } from './App'

function formatTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const btn: React.CSSProperties = {
  width: '100%',
  padding: '11px 0',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.07)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '500',
  fontFamily: "'Segoe UI Variable', 'Segoe UI', sans-serif",
  cursor: 'pointer',
  letterSpacing: '0.1px'
}

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: '#0078D4',
  border: '1px solid #106EBE',
  fontWeight: '600'
}

export default function TrayPopup({
  prefs: _prefs,
  engineState,
  setPref: _setPref,
  refresh: _refresh
}: {
  prefs: Prefs
  engineState: EngineState
  setPref: (key: keyof Prefs, value: unknown) => Promise<void>
  refresh: () => Promise<void>
}) {
  const [now, setNow] = useState(Date.now())
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const remaining = engineState.nextBreakETA ? engineState.nextBreakETA - now : 0
  const isPaused = engineState.isPaused
  const isBreakActive = engineState.isBreakActive

  let countdownText = '—'
  let statusText = 'Active'
  let statusColor = '#4CAF50'

  if (isBreakActive) {
    countdownText = 'Now'
    statusText = 'Break active'
    statusColor = '#FF9800'
  } else if (isPaused) {
    countdownText = '--:--'
    statusText = 'Paused'
    statusColor = '#F44336'
  } else if (engineState.nextBreakETA) {
    countdownText = formatTime(remaining)
    statusText = 'Active'
    statusColor = '#4CAF50'
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '18px 18px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      background: 'rgba(28, 28, 32, 0.96)',
      backdropFilter: 'blur(24px)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      fontFamily: "'Segoe UI Variable', 'Segoe UI', sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="../../assets/logo.png" style={{ width: 22, height: 22, borderRadius: '5px' }} />
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>iRetina</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: '500' }}>{statusText}</span>
        </div>
      </div>

      {/* Countdown */}
      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <div style={{
          fontSize: '52px',
          fontWeight: '700',
          color: '#4DA3FF',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: '1',
          letterSpacing: '-1px',
          fontFamily: "'Segoe UI Variable', monospace"
        }}>
          {countdownText}
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '5px', fontWeight: '400' }}>
          until your next eye break
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        <button
          style={hovered === 'break' ? { ...btnPrimary, background: '#106EBE' } : btnPrimary}
          onMouseEnter={() => setHovered('break')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => window.iretina.engine.triggerNow()}
        >
          Take Break Now
        </button>

        <div style={{ display: 'flex', gap: '7px' }}>
          <button
            style={hovered === 'settings' ? { ...btn, background: 'rgba(255,255,255,0.12)', flex: 1 } : { ...btn, flex: 1 }}
            onMouseEnter={() => setHovered('settings')}
            onMouseLeave={() => setHovered(null)}
            onClick={async () => {
              await window.iretina.app.openSettings()
              await window.iretina.app.closePopup()
            }}
          >
            Settings
          </button>
          <button
            style={hovered === 'quit' ? { ...btn, background: 'rgba(255,255,255,0.12)', flex: 1 } : { ...btn, flex: 1 }}
            onMouseEnter={() => setHovered('quit')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => window.iretina.app.quit()}
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  )
}
