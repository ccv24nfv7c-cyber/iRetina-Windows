import React, { useEffect, useState } from 'react'
import { makeStyles, tokens, Button, Divider, Text } from '@fluentui/react-components'
import { Eye24Regular, Settings24Regular, ArrowExit20Regular, Play24Regular } from '@fluentui/react-icons'
import type { Prefs, EngineState } from './App'

const useStyles = makeStyles({
  root: {
    width: '100%',
    height: '100%',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'rgba(32, 32, 32, 0.92)',
    backdropFilter: 'blur(20px)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    color: tokens.colorNeutralForeground1
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  eyeIcon: {
    fontSize: '22px'
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column'
  },
  countdown: {
    fontFamily: "'Segoe UI Variable', monospace",
    fontSize: '36px',
    fontWeight: '700',
    color: tokens.colorBrandForeground1,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: '1'
  },
  statusLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginTop: '2px'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '4px'
  }
})

function formatTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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
  const styles = useStyles()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const remaining = engineState.nextBreakETA ? engineState.nextBreakETA - now : 0
  const isPaused = engineState.isPaused
  const isBreakActive = engineState.isBreakActive

  let countdownText = '—'
  let statusText = 'Tracking eyes...'

  if (isBreakActive) {
    countdownText = 'NOW'
    statusText = 'Break in progress'
  } else if (isPaused) {
    countdownText = 'Paused'
    statusText = engineState.pauseReason ?? 'Paused'
  } else if (engineState.nextBreakETA) {
    countdownText = formatTime(remaining)
    statusText = 'Until next break'
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.eyeIcon}>👁</span>
        <Text weight="semibold" size={400}>iRetina</Text>
      </div>

      <Divider style={{ opacity: 0.15 }} />

      <div>
        <div className={styles.countdown}>{countdownText}</div>
        <div className={styles.statusLabel}>{statusText}</div>
      </div>

      <div className={styles.actions}>
        <Button
          icon={<Play24Regular />}
          appearance="primary"
          onClick={() => window.iretina.engine.triggerNow()}
        >
          Take Break Now
        </Button>
        <Button
          icon={<Settings24Regular />}
          appearance="subtle"
          onClick={async () => {
            await window.iretina.app.openSettings()
            await window.iretina.app.closePopup()
          }}
        >
          Settings
        </Button>
        <Button
          icon={<ArrowExit20Regular />}
          appearance="subtle"
          onClick={() => window.iretina.app.quit()}
        >
          Quit iRetina
        </Button>
      </div>
    </div>
  )
}
