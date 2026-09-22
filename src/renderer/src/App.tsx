import { useEffect, useState, useCallback } from 'react'
import { makeStyles, mergeClasses } from '@fluentui/react-components'
import {
  Home20Regular,
  Timer20Regular,
  PaintBrush20Regular,
  Info20Regular
} from '@fluentui/react-icons'
import Logo from './Logo'
import { DUR, EASE } from './motion'
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
    width: '256px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    // Extra top padding so content clears the hidden title bar caption buttons.
    padding: '52px 8px 12px',
    boxSizing: 'border-box',
    gap: '2px',
    // Make the whole rail draggable; individual nav items override to no-drag.
    WebkitAppRegion: 'drag' as 'drag'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '4px 12px 16px',
    WebkitAppRegion: 'drag' as 'drag'
  },
  brandName: { fontSize: '14px', fontWeight: '600', letterSpacing: '-0.005em' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '0 12px',
    height: '38px',
    borderRadius: '5px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '400',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    position: 'relative',
    transition: 'background 100ms ease',
    WebkitAppRegion: 'no-drag' as 'no-drag',
    ':hover': { background: 'var(--surface-hover)' },
    ':focus-visible': { outline: '2px solid var(--focus)', outlineOffset: '-2px' }
  },
  navItemOn: {
    background: 'var(--surface-2)',
    fontWeight: '600',
    ':hover': { background: 'var(--surface-hover)' }
  },
  // Win11 NavigationView selection pill - a short rounded bar on the left edge.
  navBar: {
    position: 'absolute',
    left: '0',
    top: '9px',
    bottom: '9px',
    width: '3px',
    borderRadius: '3px',
    background: 'var(--accent)'
  },
  navIcon: { fontSize: '16px', display: 'flex', flexShrink: 0, color: 'var(--text-dim)' },
  content: {
    flex: 1,
    minWidth: 0,
    overflowY: 'auto',
    background: 'transparent',
    WebkitAppRegion: 'no-drag' as 'no-drag'
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
        completeOnboarding: () => Promise<void>
        setPlan: (plan: 'free' | 'pro') => Promise<void>
      }
      account: {
        signUp: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
        login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
        continueWithGoogle: () => Promise<{ ok: boolean; message?: string }>
        startCheckout: (billing: 'yearly' | 'monthly') => Promise<{ ok: boolean; message?: string }>
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
            {tab === n.id && (
              <span
                className={s.navBar}
                style={{ animation: `winPopIn ${DUR.normal}ms ${EASE.decel} both` }}
              />
            )}
            <span className={s.navIcon}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>

      <div className={s.content}>
        {/* Keyed wrapper re-mounts per tab → Win11 top-level page transition
            (rise up + fade in). */}
        <div
          key={tab}
          style={{ animation: `winFadeUp ${DUR.entrance}ms ${EASE.decel} both`, height: '100%' }}
        >
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
    </div>
  )
}
