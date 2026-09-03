import React from 'react'
import {
  makeStyles,
  tokens,
  Switch,
  Button,
  Slider,
  Text,
  SpinButton
} from '@fluentui/react-components'
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
  modeCards: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    padding: '16px 20px'
  },
  modeCard: {
    padding: '16px',
    borderRadius: '10px',
    border: '2px solid transparent',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.04)',
    transition: 'all 0.15s ease'
  },
  modeCardSelected: {
    padding: '16px',
    borderRadius: '10px',
    border: `2px solid ${tokens.colorBrandStroke1}`,
    cursor: 'pointer',
    background: `${tokens.colorBrandBackground2}`,
    transition: 'all 0.15s ease'
  },
  modeTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
    marginBottom: '4px'
  },
  modeSub: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3
  }
})

export default function TimerPage({
  prefs,
  engineState: _engineState,
  setPref
}: {
  prefs: Prefs
  engineState: EngineState
  setPref: (key: keyof Prefs, value: unknown) => Promise<void>
}) {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <div className={styles.pageTitle}>Break Timer</div>

      {/* Timing */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>Timing</div>
        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>Break Interval</div>
            <div className={styles.rowSub}>How often to remind you to rest your eyes</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Slider
              min={2}
              max={90}
              step={1}
              value={prefs.intervalMinutes}
              onChange={(_e, d) => setPref('intervalMinutes', d.value)}
              style={{ width: '120px' }}
            />
            <Text weight="semibold" style={{ minWidth: '50px', textAlign: 'right' }}>
              {prefs.intervalMinutes} min
            </Text>
          </div>
        </div>
        <div className={styles.rowLast}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>Break Duration</div>
            <div className={styles.rowSub}>How long each break lasts</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Slider
              min={10}
              max={180}
              step={5}
              value={prefs.breakDurationSec}
              onChange={(_e, d) => setPref('breakDurationSec', d.value)}
              style={{ width: '120px' }}
            />
            <Text weight="semibold" style={{ minWidth: '50px', textAlign: 'right' }}>
              {prefs.breakDurationSec}s
            </Text>
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>Reminder</div>
        <div className={styles.rowLast}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>Heads-Up Notification</div>
            <div className={styles.rowSub}>Get a Windows notification 1 minute before your break</div>
          </div>
          <Switch
            checked={prefs.headsUpEnabled}
            onChange={(_e, d) => setPref('headsUpEnabled', d.checked)}
          />
        </div>
      </div>

      {/* Break Mode */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>Break Mode</div>
        <div className={styles.modeCards}>
          <div
            className={!prefs.strictBreakModeEnabled ? styles.modeCardSelected : styles.modeCard}
            onClick={() => setPref('strictBreakModeEnabled', false)}
          >
            <div className={styles.modeTitle}>Normal Mode</div>
            <div className={styles.modeSub}>You can dismiss or snooze breaks anytime</div>
          </div>
          <div
            className={prefs.strictBreakModeEnabled ? styles.modeCardSelected : styles.modeCard}
            onClick={() => setPref('strictBreakModeEnabled', true)}
          >
            <div className={styles.modeTitle}>🔒 Strict Mode</div>
            <div className={styles.modeSub}>Breaks cannot be skipped — enforces the full duration</div>
          </div>
        </div>
      </div>

      {/* Sound */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>Sound</div>
        <div className={styles.rowLast}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>Sound Notifications</div>
            <div className={styles.rowSub}>Play a sound when a break starts and ends</div>
          </div>
          <Switch
            checked={prefs.soundEnabled}
            onChange={(_e, d) => setPref('soundEnabled', d.checked)}
          />
        </div>
      </div>
    </div>
  )
}
