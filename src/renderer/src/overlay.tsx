import React, { useEffect, useRef, useState, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { FluentProvider, webDarkTheme } from '@fluentui/react-components'
import { playBreakStart, playBreakEnd } from './sound'

declare global {
  interface Window {
    overlayBridge: {
      onStart: (
        cb: (data: {
          durationSec: number
          strict: boolean
          soundEnabled: boolean
          isPrimary: boolean
        }) => void
      ) => void
      finished: () => void
      skip: () => void
      activateDND: (hours: number) => void
    }
  }
}

const FADE_IN_MS = 360
const FADE_OUT_MS = 400
const CONTENT_OUT_MS = 260

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const quotes = ['Rest your eyes', 'Time for a break', 'Look into the distance']

const subtitles = [
  'Focus on something about 20 feet away until the timer runs out',
  'Let your eyes relax and drift toward the horizon',
  'Soften your gaze and give your vision a moment to reset'
]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

type Phase = 'hidden' | 'running' | 'leaving'

function OverlayApp(): React.JSX.Element {
  const [durationSec, setDurationSec] = useState(30)
  const [remaining, setRemaining] = useState(30)
  const [strict, setStrict] = useState(false)
  const [phase, setPhase] = useState<Phase>('hidden')
  const [quote] = useState(() => pick(quotes))
  const [subtitle] = useState(() => pick(subtitles))
  const [now, setNow] = useState(() => new Date())

  const soundRef = useRef(true)
  const primaryRef = useRef(true)
  const closingRef = useRef(false)

  const shown = phase === 'running'

  // --- Close sequence: ding, fade out, then tell the main process ---
  const beginClose = useCallback((action: 'finished' | 'skip') => {
    if (closingRef.current) return
    closingRef.current = true
    if (soundRef.current && primaryRef.current) playBreakEnd()
    setPhase('leaving')
    window.setTimeout(
      () => window.overlayBridge[action](),
      prefersReducedMotion ? 40 : FADE_OUT_MS
    )
  }, [])

  // --- Receive break parameters from the main process ---
  useEffect(() => {
    window.overlayBridge.onStart(({ durationSec: d, strict: s, soundEnabled, isPrimary }) => {
      soundRef.current = soundEnabled
      primaryRef.current = isPrimary
      setDurationSec(d)
      setRemaining(d)
      setStrict(s)
      // Two frames so the browser paints the hidden state before we transition in.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setPhase('running')
          if (soundEnabled && isPrimary) playBreakStart()
        })
      )
    })
  }, [])

  // --- Countdown ---
  // When it ticks down to the final second, the overlay fades straight out
  // (with the chime) — no separate "done" screen.
  useEffect(() => {
    if (phase !== 'running') return
    if (remaining <= 1) {
      beginClose('finished')
      return
    }
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => window.clearTimeout(t)
  }, [phase, remaining, beginClose])

  // --- Wall clock ---
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const handleDismiss = useCallback(() => {
    if (strict) return
    beginClose('skip')
  }, [strict, beginClose])

  const handleDND = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    if (soundRef.current && primaryRef.current) playBreakEnd()
    setPhase('leaving')
    window.setTimeout(
      () => window.overlayBridge.activateDND(2.5),
      prefersReducedMotion ? 60 : FADE_OUT_MS
    )
  }, [])

  // --- Press Enter twice to dismiss ---
  const enterRef = useRef(0)
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (strict) return
      if (e.key === 'Escape') {
        handleDismiss()
        return
      }
      if (e.key === 'Enter') {
        enterRef.current += 1
        if (enterRef.current >= 2) {
          enterRef.current = 0
          handleDismiss()
        } else {
          window.setTimeout(() => (enterRef.current = 0), 1500)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [strict, handleDismiss])

  const progress = Math.max(0, Math.min(1, (durationSec - remaining) / durationSec))
  const mins = Math.floor(Math.max(0, remaining) / 60)
  const secs = Math.max(0, remaining) % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Progress ring geometry
  const RING = 176
  const STROKE = 4
  const R = (RING - STROKE) / 2
  const CIRC = 2 * Math.PI * R
  const ringProgress = phase === 'leaving' ? 1 : progress

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background:
          'radial-gradient(120% 120% at 50% 30%, #12161f 0%, #0c0f17 45%, #07090f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: shown ? 1 : 0,
        transition: prefersReducedMotion
          ? 'opacity 80ms linear'
          : `opacity ${shown ? FADE_IN_MS : FADE_OUT_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      <style>{`
        @keyframes iretinaGlow {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.9;  transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>

      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '34%',
          left: '50%',
          width: '680px',
          height: '680px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0, 120, 212, 0.16) 0%, rgba(96,165,250,0.05) 40%, transparent 70%)',
          pointerEvents: 'none',
          animation: prefersReducedMotion
            ? 'none'
            : 'iretinaGlow 7s ease-in-out infinite',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Wall clock */}
      <div
        style={{
          position: 'absolute',
          top: '44px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '15px',
          color: 'rgba(255,255,255,0.42)',
          fontWeight: 500,
          letterSpacing: '0.6px'
        }}
      >
        {timeDisplay}
      </div>

      {/* Main content — the root handles opacity; this only carries a gentle rise */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '30px',
          textAlign: 'center',
          maxWidth: '700px',
          padding: '0 40px',
          transform: phase === 'running' ? 'translateY(0)' : 'translateY(12px)',
          transition: prefersReducedMotion
            ? 'none'
            : `transform ${phase === 'leaving' ? CONTENT_OUT_MS : FADE_IN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              fontSize: 'clamp(38px, 4.6vw, 58px)',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-0.6px'
            }}
          >
            {quote}
          </div>
          <div
            style={{
              fontSize: 'clamp(14px, 1.6vw, 18px)',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: '460px',
              margin: '0 auto'
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Progress ring + countdown */}
        <div
          style={{
            position: 'relative',
            width: RING,
            height: RING,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg
            width={RING}
            height={RING}
            viewBox={`0 0 ${RING} ${RING}`}
            style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
          >
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0078d4" />
                <stop offset="100%" stopColor="#7cc0ff" />
              </linearGradient>
            </defs>
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth={STROKE}
            />
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - ringProgress)}
              style={{
                transition:
                  phase === 'leaving'
                    ? 'stroke-dashoffset 400ms cubic-bezier(0.22,1,0.36,1)'
                    : 'stroke-dashoffset 1000ms linear'
              }}
            />
          </svg>

          <div
            style={{
              fontSize: '46px',
              fontWeight: 700,
              color: '#ffffff',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-1px'
            }}
          >
            {timeStr}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '56px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          opacity: phase === 'leaving' ? 0 : 1,
          transition: 'opacity 0.35s ease',
          pointerEvents: phase === 'leaving' ? 'none' : 'auto'
        }}
      >
        {strict ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 22px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              color: 'rgba(255,255,255,0.62)',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 10V8a6 6 0 0 1 12 0v2m-9 0h6M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Strict Mode — this break can’t be skipped
          </div>
        ) : (
          <>
            <OverlayButton onClick={handleDismiss} primary>
              Dismiss break
            </OverlayButton>
            <OverlayButton onClick={handleDND}>Do not disturb</OverlayButton>
          </>
        )}
      </div>

      {!strict && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11.5px',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 500,
            letterSpacing: '0.4px',
            opacity: phase === 'leaving' ? 0 : 1,
            transition: 'opacity 0.35s ease'
          }}
        >
          Press Enter twice, or Esc, to dismiss
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
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setPressed(false)
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        padding: '11px 26px',
        background: primary
          ? hovered
            ? '#1184e8'
            : '#0078d4'
          : hovered
            ? 'rgba(255,255,255,0.13)'
            : 'rgba(255,255,255,0.07)',
        border: primary
          ? '1px solid rgba(96,165,250,0.5)'
          : '1px solid rgba(255,255,255,0.16)',
        borderRadius: '10px',
        color: '#ffffff',
        fontSize: '13.5px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'background 0.15s ease, transform 0.1s ease, border-color 0.15s ease',
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
