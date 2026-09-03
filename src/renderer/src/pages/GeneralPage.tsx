import React, { useEffect, useState } from 'react'
import {
  makeStyles,
  tokens,
  Switch,
  Button,
  Text,
  Badge,
  Divider,
  Spinner
} from '@fluentui/react-components'
import {
  PauseCircle24Regular,
  Play24Regular,
  Timer24Regular,
  WeatherMoon24Regular
} from '@fluentui/react-icons'
import type { Prefs, EngineState } from '../App'

const useStyles = makeStyles({
  root: {
    padding: '28px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    height: '100%',
    overflowY: 'auto'
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '14px 20px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: `1px solid rgba(255,255,255,0.04)`
  },
  rowLast: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px'
  },
  rowLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  rowTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1
  },
  rowSub: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3
  },
  countdown: {
    fontFamily: "'Segoe UI Variable', monospace",
    fontSize: '28px',
    fontWeight: '700',
    color: tokens.colorBrandForeground1,
    fontVariantNumeric: 'tabular-nums'
  },
  countdownPaused: {
    fontSize: '16px',
    fontWeight: '700',
    color: tokens.colorStatusDangerForeground1
  },
  dndActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  }
})

function formatTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(hours: number) {
  if (hours === 1) return '1 hour'
  if (hours % 1 === 0) return `${hours} hours`
  const mins = Math.round((hours % 1) * 60)
  const h = Math.floor(hours)
  if (h === 0) return `${mins}m`
  return `${h}h ${mins}m`
}

export default function GeneralPage({
  prefs,
  engineState,
  setPref,
  refresh
}: {
  prefs: Prefs
  engineState: EngineState
  setPref: (key: keyof Prefs, value: unknown) => Promise<void>
  refresh: () => Promise<void>
}) {
  const styles = useStyles()
  const [now, setNow] = useState(Date.now())
  const [loginEnabled, setLoginEnabled] = useState(prefs.launchAtLogin)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const remaining = engineState.nextBreakETA ? engineState.nextBreakETA - now : 0
  const dndActive = prefs.dndEndTime ? Date.now() < prefs.dndEndTime : false
  const dndRemaining = dndActive && prefs.dndEndTime ? formatDuration((prefs.dndEndTime - Date.now()) / 3_600_000) : ''

  async function handleLoginToggle(enabled: boolean) {
    setLoginEnabled(enabled)
    await window.iretina.app.setLoginItem(enabled)
    await setPref('launchAtLogin', enabled)
  }

  async function handleDNDActivate(hours: number) {
    await window.iretina.engine.activateDND(hours)
    await refresh()
  }

  async function handleDNDDeactivate() {
    await window.iretina.engine.deactivateDND()
    await refresh()
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageTitle}>General</div>

      {/* Countdown */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>Until Next Break</div>
        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>Countdown</div>
          </div>
          <div>
            {engineState.isBreakActive ? (
              <Badge appearance="tint" color="warning">Break Active</Badge>
            ) : engineState.isPaused ? (
              <div className={styles.countdownPaused}>Paused — {engineState.pauseReason}</div>
            ) : engineState.nextBreakETA ? (
              <div className={styles.countdown}>{formatTime(remaining)}</div>
            ) : (
              <Spinner size="tiny" />
            )}
          </div>
        </div>
        <div className={styles.rowLast}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>Actions</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="small"
              icon={<Play24Regular />}
              appearance="primary"
              onClick={() => window.iretina.engine.triggerNow()}
            >
              Take Break Now
            </Button>
          </div>
        </div>
      </div>

      {/* Smart Pause */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>Smart Features</div>
        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>Smart Pause</div>
            <div className={styles.rowSub}>Pauses breaks when you lock your screen or put PC to sleep</div>
          </div>
          <Switch
            checked={prefs.smartPauseEnabled}
            onChange={(_e, d) => setPref('smartPauseEnabled', d.checked)}
          />
        </div>
        <div className={styles.rowLast}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>Activity Status</div>
          </div>
          <Badge
            appearance="tint"
            color={!prefs.smartPauseEnabled ? 'subtle' : engineState.isPaused ? 'warning' : 'success'}
          >
            {!prefs.smartPauseEnabled ? 'Inactive' : engineState.isPaused ? 'Away' : 'Active'}
          </Badge>
        </div>
      </div>

      {/* Do Not Disturb */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>Do Not Disturb</div>
        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>Status</div>
          </div>
          <Badge appearance="tint" color={dndActive ? 'danger' : 'subtle'}>
            {dndActive ? `Active — ${dndRemaining} left` : 'Inactive'}
          </Badge>
        </div>
        <div className={styles.rowLast}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>{dndActive ? 'End DND' : 'Activate DND for...'}</div>
          </div>
          <div className={styles.dndActions}>
            {dndActive ? (
              <Button size="small" appearance="secondary" onClick={handleDNDDeactivate}>
                End Now
              </Button>
            ) : (
              <>
                <Button size="small" onClick={() => handleDNDActivate(1)}>1 hr</Button>
                <Button size="small" onClick={() => handleDNDActivate(2)}>2 hrs</Button>
                <Button size="small" onClick={() => handleDNDActivate(4)}>4 hrs</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Startup */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>Startup</div>
        <div className={styles.rowLast}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>Launch at Login</div>
            <div className={styles.rowSub}>Start iRetina automatically when Windows starts</div>
          </div>
          <Switch
            checked={loginEnabled}
            onChange={(_e, d) => handleLoginToggle(d.checked)}
          />
        </div>
      </div>
    </div>
  )
}
