import React, { useEffect, useState, useCallback } from 'react'
import { FluentProvider, webDarkTheme } from '@fluentui/react-components'
import GeneralPage from './pages/GeneralPage'
import TimerPage from './pages/TimerPage'
import AppearancePage from './pages/AppearancePage'
import AboutPage from './pages/AboutPage'
import TrayPopup from './TrayPopup'

export interface EngineState {
  nextBreakETA: number | null
  isPaused: boolean
  pauseReason: string | null
  isBreakActive: boolean
  breaksCompleted: number
}

export interface Prefs {
  intervalMinutes: number
  breakDurationSec: number
  theme: 'system' | 'light' | 'dark'
  headsUpEnabled: boolean
  strictBreakModeEnabled: boolean
  smartPauseEnabled: boolean
  soundEnabled: boolean
  launchAtLogin: boolean
  dndEndTime: number | null
  dndDefaultDurationHours: number
  breaksCompleted: number
  analyticsEnabled: boolean
}

declare global {
  interface Window {
    iretina: {
      prefs: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<void>
        getAll: () => Promise<Prefs>
      }
      engine: {
        getState: () => Promise<EngineState>
        triggerNow: () => Promise<void>
        skipBreak: () => Promise<void>
        snoozeBreak: (minutes: number) => Promise<void>
        pauseTimer: (reason: string) => Promise<void>
        resumeTimer: () => Promise<void>
        activateDND: (hours: number) => Promise<void>
        deactivateDND: () => Promise<void>
        onStateChanged: (cb: (state: EngineState) => void) => void
      }
      app: {
        openSettings: () => Promise<void>
        closePopup: () => Promise<void>
        quit: () => Promise<void>
        setLoginItem: (enabled: boolean) => Promise<void>
        getVersion: () => Promise<string>
      }
    }
  }
}

type Tab = 'general' | 'timer' | 'appearance' | 'about'

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'general',
    label: 'General',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )
  },
  {
    id: 'timer',
    label: 'Break Timer',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
      </svg>
    )
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z"/>
      </svg>
    )
  },
  {
    id: 'about',
    label: 'About',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    )
  }
]

function formatTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Sidebar({
  tab,
  setTab,
  engineState,
  prefs
}: {
  tab: Tab
  setTab: (t: Tab) => void
  engineState: EngineState
  prefs: Prefs
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const remaining = engineState.nextBreakETA ? engineState.nextBreakETA - now : 0
  const countdownStr = engineState.isPaused
    ? 'Paused'
    : engineState.nextBreakETA
    ? `Next break in ${formatTime(remaining)}`
    : '—'

  return (
    <div style={{
      width: '220px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(255,255,255,0.025)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      fontFamily: "'Segoe UI Variable','Segoe UI',sans-serif"
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '20px 18px 16px'
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <img src="../../assets/logo.png" style={{ width: 28, height: 28 }} />
        </div>
        <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>iRetina</span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '6px',
                border: 'none',
                background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                fontSize: '14px',
                fontWeight: active ? '600' : '400',
                fontFamily: "'Segoe UI Variable','Segoe UI',sans-serif",
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                borderLeft: active ? '2px solid #0078D4' : '2px solid transparent',
                transition: 'all 0.1s ease'
              }}
            >
              <span style={{ color: active ? '#4DA3FF' : 'rgba(255,255,255,0.4)' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom status card */}
      <div style={{
        margin: '12px',
        padding: '12px 14px',
        background: 'rgba(0,120,212,0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(0,120,212,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <img src="../../assets/logo.png" style={{ width: 18, height: 18, borderRadius: '4px', opacity: 0.8 }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#4DA3FF' }}>{countdownStr}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
            {prefs.breaksCompleted} breaks taken today
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App({ isPopup }: { isPopup: boolean }) {
  const [tab, setTab] = useState<Tab>('general')
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [engineState, setEngineState] = useState<EngineState | null>(null)

  const refreshAll = useCallback(async () => {
    const [p, s] = await Promise.all([
      window.iretina.prefs.getAll(),
      window.iretina.engine.getState()
    ])
    setPrefs(p)
    setEngineState(s)
  }, [])

  useEffect(() => {
    refreshAll()
    window.iretina.engine.onStateChanged((state) => setEngineState(state))
  }, [refreshAll])

  const setPref = useCallback(async (key: keyof Prefs, value: unknown) => {
    await window.iretina.prefs.set(key, value)
    setPrefs((p) => (p ? { ...p, [key]: value } : p))
  }, [])

  if (!prefs || !engineState) return null

  if (isPopup) {
    return (
      <FluentProvider theme={webDarkTheme} style={{ height: '100%', background: 'transparent' }}>
        <TrayPopup prefs={prefs} engineState={engineState} setPref={setPref} refresh={refreshAll} />
      </FluentProvider>
    )
  }

  return (
    <FluentProvider theme={webDarkTheme} style={{ height: '100%', background: 'transparent' }}>
      <div style={{
        display: 'flex',
        height: '100vh',
        background: 'rgba(18,18,22,0.97)',
        overflow: 'hidden'
      }}>
        <Sidebar tab={tab} setTab={setTab} engineState={engineState} prefs={prefs} />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {tab === 'general' && <GeneralPage prefs={prefs} engineState={engineState} setPref={setPref} refresh={refreshAll} />}
          {tab === 'timer' && <TimerPage prefs={prefs} engineState={engineState} setPref={setPref} />}
          {tab === 'appearance' && <AppearancePage prefs={prefs} setPref={setPref} />}
          {tab === 'about' && <AboutPage />}
        </div>
      </div>
    </FluentProvider>
  )
}
