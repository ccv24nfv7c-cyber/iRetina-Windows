import { useEffect, useState } from 'react'
import { makeStyles, Switch } from '@fluentui/react-components'
import {
  Play16Filled,
  Pause16Regular,
  Prohibited20Regular,
  WeatherMoon20Regular,
  Power20Regular
} from '@fluentui/react-icons'
import type { Prefs, EngineState } from '../App'
import Ring from '../Ring'
import { Page, Section, Card, Row, Btn } from './ui'

const useLocal = makeStyles({
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '18px',
    padding: '34px 24px 26px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-sm)'
  },
  ringWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
  big: {
    fontSize: '38px',
    fontWeight: '400',
    letterSpacing: '-0.02em',
    lineHeight: 1,
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums'
  },
  bigWord: { fontSize: '24px', fontWeight: '600', letterSpacing: '-0.01em', color: 'var(--text)' },
  ringLabel: {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-mute)',
    whiteSpace: 'nowrap'
  },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  stat: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: 'var(--shadow-sm)'
  },
  statNum: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.01em'
  },
  statLabel: { fontSize: '11px', color: 'var(--text-mute)', fontWeight: '600' },
  seg: { display: 'flex', gap: '6px' }
})

function fmt(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
function durLabel(hours: number) {
  if (hours <= 0) return ''
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
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
  const l = useLocal()
  const [now, setNow] = useState(Date.now())
  const [login, setLogin] = useState(prefs.launchAtLogin)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const intervalMs = prefs.intervalMinutes * 60_000
  const remaining = engineState.nextBreakETA ? engineState.nextBreakETA - now : 0
  const progress = engineState.nextBreakETA ? 1 - remaining / intervalMs : 0
  const dndActive = prefs.dndEndTime ? Date.now() < prefs.dndEndTime : false
  const dndLeft = dndActive && prefs.dndEndTime ? durLabel((prefs.dndEndTime - Date.now()) / 3_600_000) : ''

  async function toggleLogin(v: boolean) {
    setLogin(v)
    await window.iretina.app.setLoginItem(v)
    await setPref('launchAtLogin', v)
  }
  async function dnd(hours: number) {
    await window.iretina.engine.activateDND(hours)
    await refresh()
  }
  async function endDnd() {
    await window.iretina.engine.deactivateDND()
    await refresh()
  }
  async function pause() {
    await window.iretina.engine.pauseTimer('manual')
    await refresh()
  }
  async function resume() {
    await window.iretina.engine.resumeTimer()
    await refresh()
  }

  let center = <div className={l.big}>{fmt(remaining)}</div>
  let ringLabel = 'until your next break'
  let ringProgress = progress
  if (engineState.isBreakActive) {
    center = <div className={l.bigWord}>On a break</div>
    ringLabel = 'break screen is showing'
    ringProgress = 1
  } else if (engineState.isPaused) {
    center = <div className={l.bigWord}>Paused</div>
    ringLabel =
      engineState.pauseReason === 'dnd'
        ? 'do not disturb is on'
        : engineState.pauseReason === 'away'
          ? "you're away"
          : 'timer is paused'
    ringProgress = 0
  }

  return (
    <Page title="Dashboard">
      <div className={l.hero}>
        <div className={l.ringWrap}>
          <Ring size={220} stroke={12} progress={ringProgress} dim={engineState.isPaused}>
            {center}
          </Ring>
          <div className={l.ringLabel}>{ringLabel}</div>
        </div>
        <div className={l.actions}>
          <Btn variant="primary" icon={<Play16Filled />} onClick={() => window.iretina.engine.triggerNow()}>
            Take a break now
          </Btn>
          {engineState.isPaused ? (
            <Btn onClick={resume}>Resume timer</Btn>
          ) : (
            <Btn icon={<Pause16Regular />} onClick={pause} disabled={engineState.isBreakActive}>
              Pause
            </Btn>
          )}
        </div>
      </div>

      <div className={l.stats}>
        <div className={l.stat}>
          <span className={l.statNum}>{engineState.breaksCompleted}</span>
          <span className={l.statLabel}>Breaks completed</span>
        </div>
        <div className={l.stat}>
          <span className={l.statNum}>{prefs.intervalMinutes}<span style={{ fontSize: 13, color: 'var(--text-mute)' }}> min</span></span>
          <span className={l.statLabel}>Between breaks</span>
        </div>
        <div className={l.stat}>
          <span className={l.statNum}>{prefs.breakDurationSec}<span style={{ fontSize: 13, color: 'var(--text-mute)' }}> s</span></span>
          <span className={l.statLabel}>Break length</span>
        </div>
      </div>

      <Section label="Do Not Disturb">
        <Card>
          <Row
            first
            icon={<Prohibited20Regular />}
            title="Do Not Disturb"
            desc={
              dndActive
                ? `On — about ${dndLeft} left. All breaks are paused.`
                : 'Silence every break for a set stretch of time'
            }
            right={
              dndActive ? (
                <Btn size="sm" variant="danger" onClick={endDnd}>
                  Turn off
                </Btn>
              ) : (
                <div className={l.seg}>
                  <Btn size="sm" onClick={() => dnd(1)}>1h</Btn>
                  <Btn size="sm" onClick={() => dnd(2)}>2h</Btn>
                  <Btn size="sm" onClick={() => dnd(4)}>4h</Btn>
                </div>
              )
            }
          />
        </Card>
      </Section>

      <Section label="Automation">
        <Card>
          <Row
            first
            icon={<WeatherMoon20Regular />}
            title="Smart pause"
            desc="Pause when the screen locks or the computer sleeps, then pick up where you left off"
            right={
              <Switch
                checked={prefs.smartPauseEnabled}
                onChange={(_e, d) => setPref('smartPauseEnabled', d.checked)}
              />
            }
          />
          <Row
            icon={<Power20Regular />}
            title="Launch at sign-in"
            desc="Start iRetina automatically and keep it in the menu bar"
            right={<Switch checked={login} onChange={(_e, d) => toggleLogin(d.checked)} />}
          />
        </Card>
      </Section>
    </Page>
  )
}
