import React, { useEffect, useState, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom/client'

declare global {
  interface Window {
    overlayBridge: {
      onStart: (cb: (data: { durationSec: number; strict: boolean; breakNumber: number }) => void) => void
      finished: () => void
      skip: () => void
      activateDND: (hours: number) => void
    }
  }
}

function OverlayApp() {
  const [durationSec, setDurationSec] = useState(30)
  const [strict, setStrict] = useState(false)
  const [breakNumber, setBreakNumber] = useState(1)
  const [displaySec, setDisplaySec] = useState(30)
  const [visible, setVisible] = useState(false)
  const [now, setNow] = useState(() => new Date())

  // Smooth progress bar via rAF — no go-stop-go
  const progressRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(0)
  const durationMsRef = useRef<number>(30000)
  const rafRef = useRef<number>(0)

  const enterCountRef = useRef(0)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleFinish = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    window.overlayBridge.finished()
  }, [])

  const handleDismiss = useCallback(() => {
    if (strict) return
    cancelAnimationFrame(rafRef.current)
    window.overlayBridge.skip()
  }, [strict])

  const handleDND = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    window.overlayBridge.activateDND(2.5)
  }, [])

  // rAF loop — updates progress bar at 60fps, perfectly smooth
  const startProgressLoop = useCallback((startMs: number, totalMs: number) => {
    durationMsRef.current = totalMs
    startTimeRef.current = startMs

    function tick() {
      const elapsed = Date.now() - startTimeRef.current
      const fraction = Math.min(1, elapsed / durationMsRef.current)
      const pct = fraction * 100

      if (progressRef.current) progressRef.current.style.width = `${pct}%`
      if (dotRef.current) dotRef.current.style.left = `${pct}%`

      // Update countdown every ~100ms is fine; rAF fires every 16ms
      const remainingSec = Math.max(0, Math.ceil((durationMsRef.current - elapsed) / 1000))
      setDisplaySec(remainingSec)

      if (fraction < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        handleFinish()
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [handleFinish])

  useEffect(() => {
    window.overlayBridge.onStart(({ durationSec: d, strict: s, breakNumber: n }) => {
      setDurationSec(d)
      setStrict(s)
      setBreakNumber(n ?? 1)
      setDisplaySec(d)
      setTimeout(() => {
        setVisible(true)
        startProgressLoop(Date.now(), d * 1000)
      }, 80)
    })
  }, [startProgressLoop])

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Double-Enter to dismiss
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !strict) {
        enterCountRef.current += 1
        if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
        if (enterCountRef.current >= 2) {
          enterCountRef.current = 0
          handleDismiss()
        } else {
          enterTimerRef.current = setTimeout(() => { enterCountRef.current = 0 }, 1500)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [strict, handleDismiss])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const mins = Math.floor(displaySec / 60)
  const secs = displaySec % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#050810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 1.6s cubic-bezier(0.4,0,0.2,1)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Segoe UI Variable','Segoe UI',sans-serif"
    }}>

      {/* Top bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 28px',
        zIndex: 10
      }}>
        {/* Left: logo + name + break count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="../../assets/logo.png" style={{ width: 28, height: 28, borderRadius: '6px' }} />
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.85)' }}>iRetina</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '15px' }}>|</span>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>
            Break {breakNumber}
          </span>
        </div>

        {/* Right: time only */}
        <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>
          {timeDisplay}
        </div>
      </div>

      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -58%)',
        width: '580px', height: '580px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,100,200,0.18) 0%, rgba(0,60,140,0.08) 50%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Circle border */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -58%)',
        width: '480px', height: '480px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.05)',
        pointerEvents: 'none'
      }} />

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '0',
        paddingBottom: '60px'
      }}>
        <div style={{
          fontSize: 'clamp(38px, 4.5vw, 58px)',
          fontWeight: '700',
          color: '#fff',
          letterSpacing: '-0.5px',
          lineHeight: '1.1',
          marginBottom: '12px'
        }}>
          Rest your eyes
        </div>

        <div style={{
          fontSize: 'clamp(14px, 1.6vw, 18px)',
          color: 'rgba(255,255,255,0.5)',
          fontWeight: '400',
          marginBottom: '32px'
        }}>
          Focus on something 20 feet away
        </div>

        {/* Countdown */}
        <div style={{
          fontSize: 'clamp(72px, 9vw, 110px)',
          fontWeight: '300',
          color: '#fff',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-4px',
          lineHeight: '1',
          marginBottom: '40px',
          fontFamily: "'Segoe UI Variable', system-ui"
        }}>
          {timeStr}
        </div>

        {/* Progress bar — width controlled by rAF, perfectly smooth */}
        <div style={{ position: 'relative', width: '440px', maxWidth: '70vw' }}>
          {/* Track */}
          <div style={{
            height: '2px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '999px',
            overflow: 'visible',
            position: 'relative'
          }}>
            {/* Fill */}
            <div
              ref={progressRef}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                height: '100%',
                width: '0%',
                background: 'linear-gradient(90deg, #0078D4, #4DA3FF)',
                borderRadius: '999px'
              }}
            />
          </div>
          {/* Dot */}
          <div
            ref={dotRef}
            style={{
              position: 'absolute',
              top: '50%',
              left: '0%',
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#4DA3FF',
              boxShadow: '0 0 8px rgba(77,163,255,0.8)',
              marginTop: '-1px'
            }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{
        position: 'absolute',
        bottom: '64px',
        display: 'flex',
        gap: '10px'
      }}>
        {strict ? (
          <div style={{
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            🔒 Strict Mode — break cannot be skipped
          </div>
        ) : (
          <>
            <OverlayBtn primary onClick={handleDismiss}>Dismiss Break</OverlayBtn>
            <OverlayBtn onClick={handleDND}>Do Not Disturb</OverlayBtn>
          </>
        )}
      </div>

      {/* Hint */}
      {!strict && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.25)',
          fontWeight: '400',
          letterSpacing: '0.1px'
        }}>
          Press Esc twice to skip · Space to add two minutes
        </div>
      )}
    </div>
  )
}

function OverlayBtn({ children, onClick, primary }: {
  children: React.ReactNode
  onClick: () => void
  primary?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '11px 28px',
        background: primary
          ? hov ? '#106EBE' : '#0078D4'
          : hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
        border: primary
          ? '1px solid rgba(0,120,212,0.5)'
          : '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: "'Segoe UI Variable','Segoe UI',sans-serif",
        transition: 'background 0.15s ease',
        outline: 'none'
      }}
    >
      {children}
    </button>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<OverlayApp />)
