import React, { useEffect, useState, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { FluentProvider, webDarkTheme } from '@fluentui/react-components'

declare global {
  interface Window {
    overlayBridge: {
      onStart: (cb: (data: { durationSec: number; strict: boolean }) => void) => void
      finished: () => void
      skip: () => void
      activateDND: (hours: number) => void
    }
  }
}

const quotes = [
  'Rest Your Eyes',
  'Time For A Break',
  'Look Into The Distance'
]

const subtitles = [
  'Focus on something 20 feet away for the next 20 seconds',
  'Let your eyes relax and look far away',
  'Give your vision a moment to rest'
]

function OverlayApp() {
  const [durationSec, setDurationSec] = useState(30)
  const [strict, setStrict] = useState(false)
  const [remaining, setRemaining] = useState(30)
  const [visible, setVisible] = useState(false)
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)])
  const [subtitle] = useState(() => subtitles[Math.floor(Math.random() * subtitles.length)])
  const [enterCount, setEnterCount] = useState(0)

  useEffect(() => {
    window.overlayBridge.onStart(({ durationSec: d, strict: s }) => {
      setDurationSec(d)
      setRemaining(d)
      setStrict(s)
      setTimeout(() => setVisible(true), 50)
    })
  }, [])

  useEffect(() => {
    if (!visible) return
    if (remaining <= 0) {
      setTimeout(() => window.overlayBridge.finished(), 800)
      return
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [visible, remaining])

  const handleDismiss = useCallback(() => {
    if (strict) return
    window.overlayBridge.skip()
  }, [strict])

  const handleDND = useCallback(() => {
    window.overlayBridge.activateDND(2.5)
  }, [])

  // Double-enter to dismiss
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && !strict) {
        setEnterCount((c) => {
          if (c + 1 >= 2) {
            handleDismiss()
            return 0
          }
          setTimeout(() => setEnterCount(0), 1500)
          return c + 1
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [strict, handleDismiss])

  const progress = Math.max(0, Math.min(1, (durationSec - remaining) / durationSec))
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // Get current time
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 40%, #0a0e18 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background accent glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0, 120, 212, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Current time */}
      <div
        style={{
          position: 'absolute',
          top: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '16px',
          color: 'rgba(255,255,255,0.5)',
          fontWeight: '500',
          letterSpacing: '0.5px'
        }}
      >
        {timeDisplay}
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          textAlign: 'center',
          maxWidth: '700px',
          padding: '0 40px'
        }}
      >
        <div
          style={{
            fontSize: 'clamp(40px, 5vw, 62px)',
            fontWeight: '700',
            color: '#ffffff',
            lineHeight: '1.1',
            fontFamily: "'Segoe UI Variable', 'Segoe UI', sans-serif",
            letterSpacing: '-0.5px'
          }}
        >
          {quote}
        </div>

        <div
          style={{
            fontSize: 'clamp(15px, 1.8vw, 20px)',
            color: 'rgba(255,255,255,0.72)',
            fontWeight: '400',
            lineHeight: '1.5',
            maxWidth: '520px'
          }}
        >
          {subtitle}
        </div>

        {/* Divider */}
        <div style={{ width: '180px', height: '1px', background: 'rgba(255,255,255,0.15)', margin: '8px 0' }} />

        {/* Countdown */}
        <div
          style={{
            fontSize: 'clamp(56px, 7vw, 80px)',
            fontWeight: '700',
            color: remaining === 0 ? '#60a5fa' : '#ffffff',
            fontFamily: "'Segoe UI Variable', monospace",
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 0.5s ease',
            letterSpacing: '-2px'
          }}
        >
          {timeStr}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '240px',
            height: '3px',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #0078d4, #60a5fa)',
              borderRadius: '999px',
              transition: 'width 1s linear'
            }}
          />
        </div>
      </div>

      {/* Bottom buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px'
        }}
      >
        {strict ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔒 Strict Mode — Break cannot be skipped
          </div>
        ) : (
          <>
            <OverlayButton onClick={handleDismiss} primary>
              Dismiss Break
            </OverlayButton>
            <OverlayButton onClick={handleDND}>
              Do Not Disturb
            </OverlayButton>
          </>
        )}
      </div>

      {/* Enter hint */}
      {!strict && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: '500'
          }}
        >
          Press Enter twice to dismiss
        </div>
      )}
    </div>
  )
}

function OverlayButton({
  children,
  onClick,
  primary
}: {
  children: React.ReactNode
  onClick: () => void
  primary?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px 28px',
        background: primary
          ? hovered
            ? '#1184e8'
            : '#0078d4'
          : hovered
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(255,255,255,0.07)',
        border: primary
          ? '1px solid rgba(0,120,212,0.6)'
          : '1px solid rgba(255,255,255,0.18)',
        borderRadius: '8px',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: "'Segoe UI Variable', 'Segoe UI', sans-serif",
        transition: 'all 0.15s ease',
        outline: 'none'
      }}
    >
      {children}
    </button>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <FluentProvider theme={webDarkTheme} style={{ height: '100%', background: 'transparent' }}>
    <OverlayApp />
  </FluentProvider>
)
