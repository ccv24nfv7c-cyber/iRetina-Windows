import React, { useEffect, useState, useCallback } from 'react'
import {
  makeStyles,
  tokens,
  Tab,
  TabList,
  SelectTabData
} from '@fluentui/react-components'
import {
  Settings24Regular,
  Eye24Regular,
  Timer24Regular,
  PaintBrush24Regular,
  Info24Regular
} from '@fluentui/react-icons'
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
    background: 'transparent'
  },
  sidebar: {
    width: '220px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 12px 16px',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    background: 'rgba(255,255,255,0.03)'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 8px 28px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  logoIcon: {
    fontSize: '28px'
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column'
  },
  logoTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.2'
  },
  logoSub: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    fontWeight: '400'
  },
  nav: {
    flex: 1,
    marginTop: '16px'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '0'
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

export default function App({ isPopup }: { isPopup: boolean }) {
  const styles = useStyles()
  const [tab, setTab] = useState('general')
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

  const setPref = useCallback(
    async (key: keyof Prefs, value: unknown) => {
      await window.iretina.prefs.set(key, value)
      setPrefs((p) => (p ? { ...p, [key]: value } : p))
    },
    []
  )

  if (!prefs || !engineState) return null

  if (isPopup) {
    return <TrayPopup prefs={prefs} engineState={engineState} setPref={setPref} refresh={refreshAll} />
  }

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>👁</span>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>iRetina</span>
            <span className={styles.logoSub}>Eye Break Reminder</span>
          </div>
        </div>

        <div className={styles.nav}>
          <TabList
            selectedValue={tab}
            onTabSelect={(_e: unknown, d: SelectTabData) => setTab(d.value as string)}
            vertical
            appearance="subtle"
            style={{ gap: '2px' }}
          >
            <Tab value="general" icon={<Settings24Regular />}>General</Tab>
            <Tab value="timer" icon={<Timer24Regular />}>Break Timer</Tab>
            <Tab value="appearance" icon={<PaintBrush24Regular />}>Appearance</Tab>
            <Tab value="about" icon={<Info24Regular />}>About</Tab>
          </TabList>
        </div>
      </div>

      {/* Content area */}
      <div className={styles.content}>
        {tab === 'general' && (
          <GeneralPage prefs={prefs} engineState={engineState} setPref={setPref} refresh={refreshAll} />
        )}
        {tab === 'timer' && (
          <TimerPage prefs={prefs} engineState={engineState} setPref={setPref} />
        )}
        {tab === 'appearance' && (
          <AppearancePage prefs={prefs} setPref={setPref} />
        )}
        {tab === 'about' && <AboutPage />}
      </div>
    </div>
  )
}
