import { useEffect, useState, useCallback } from 'react'
import { makeStyles, mergeClasses } from '@fluentui/react-components'
import {
  Home20Regular,
  Timer20Regular,
  PaintBrush20Regular,
  Info20Regular
} from '@fluentui/react-icons'
import Logo from './Logo'
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

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    color: 'var(--text)',
    background: 'var(--bg)',
    fontFamily:
      "'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
  },
  rail: {
    width: '212px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '18px 12px',
    boxSizing: 'border-box',
    gap: '2px'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 10px 18px'
  },
  brandName: { fontSize: '15px', fontWeight: '600', letterSpacing: '-0.01em' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: '8px 11px',
    borderRadius: '8px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-dim)',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    position: 'relative',
    transition: 'background 160ms ease, color 160ms ease',
    ':hover': { background: 'var(--surface-2)', color: 'var(--text)' },
    ':focus-visible': { outline: '2px solid var(--focus)', outlineOffset: '-2px' }
  },
  navItemOn: {
    background: 'var(--accent-soft)',
    color: 'var(--accent)',
    ':hover': { background: 'var(--accent-soft)', color: 'var(--accent)' }
  },
  navBar: {
    position: 'absolute',
    left: '-12px',
    top: '8px',
    bottom: '8px',
    width: '3px',
    borderRadius: '0 3px 3px 0',
    background: 'var(--accent)'
  },
  navIcon: { fontSize: '18px', display: 'flex', flexShrink: 0 },
  content: {
    flex: 1,
    minWidth: 0,
    overflowY: 'auto',
    background: 'var(--bg)',
    borderLeft: '1px solid var(--border)'
  }
})

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

const NAV = [
  { id: 'home', label: 'Dashboard', icon: <Home20Regular /> },
  { id: 'timer', label: 'Break Timer', icon: <Timer20Regular /> },
  { id: 'appearance', label: 'Appearance', icon: <PaintBrush20Regular /> },
  { id: 'about', label: 'About', icon: <Info20Regular /> }
]

export default function App({ isPopup }: { isPopup: boolean }) {
  const s = useStyles()
  const [tab, setTab] = useState('home')
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [engineState, setEngineState] = useState<EngineState | null>(null)

  const refreshAll = useCallback(async () => {
    const [p, st] = await Promise.all([
      window.iretina.prefs.getAll(),
      window.iretina.engine.getState()
    ])
    setPrefs(p)
    setEngineState(st)
  }, [])

  useEffect(() => {
    refreshAll()
    window.iretina.engine.onStateChanged((st) => setEngineState(st))
  }, [refreshAll])

  const setPref = useCallback(async (key: keyof Prefs, value: unknown) => {
    await window.iretina.prefs.set(key, value)
    setPrefs((p) => (p ? { ...p, [key]: value } : p))
  }, [])

  if (!prefs || !engineState) return null

  if (isPopup) {
    return (
      <TrayPopup prefs={prefs} engineState={engineState} setPref={setPref} refresh={refreshAll} />
    )
  }

  return (
    <div className={s.root}>
      <div className={s.rail}>
        <div className={s.brand}>
          <Logo size={26} />
          <span className={s.brandName}>iRetina</span>
        </div>
        {NAV.map((n) => (
          <button
            key={n.id}
            className={mergeClasses(s.navItem, tab === n.id ? s.navItemOn : undefined)}
            aria-current={tab === n.id ? 'page' : undefined}
            onClick={() => setTab(n.id)}
          >
            {tab === n.id && <span className={s.navBar} />}
            <span className={s.navIcon}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>

      <div className={s.content}>
        {tab === 'home' && (
          <GeneralPage
            prefs={prefs}
            engineState={engineState}
            setPref={setPref}
            refresh={refreshAll}
          />
        )}
        {tab === 'timer' && <TimerPage prefs={prefs} setPref={setPref} />}
        {tab === 'appearance' && <AppearancePage prefs={prefs} setPref={setPref} />}
        {tab === 'about' && <AboutPage />}
      </div>
    </div>
  )
}
