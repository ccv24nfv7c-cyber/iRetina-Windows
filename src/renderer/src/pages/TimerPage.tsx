import { makeStyles, mergeClasses, Switch, Slider } from '@fluentui/react-components'
import {
  Timer20Regular,
  Clock20Regular,
  Alert20Regular,
  LockClosed20Regular,
  Speaker220Regular,
  Checkmark16Filled
} from '@fluentui/react-icons'
import type { Prefs } from '../App'
import { Page, Section, Card, Row, useUi } from './ui'

const useLocal = makeStyles({
  slider: { width: '170px' },
  modes: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  mode: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    padding: '16px',
    cursor: 'pointer',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'border-color .12s ease, background .12s ease',
    ':hover': { background: 'var(--surface-hover)' }
  },
  modeOn: {
    border: '1px solid var(--accent)',
    background: 'var(--accent-soft)'
  },
  modeHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--text)'
  },
  modeCheck: {
    marginLeft: 'auto',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--accent)',
    color: 'var(--on-accent)'
  },
  modeDesc: { fontSize: '12px', lineHeight: 1.5, color: 'var(--text-mute)' }
})

export default function TimerPage({
  prefs,
  setPref
}: {
  prefs: Prefs
  setPref: (key: keyof Prefs, value: unknown) => Promise<void>
}) {
  const u = useUi()
  const l = useLocal()
  const strict = prefs.strictBreakModeEnabled

  return (
    <Page title="Break Timer" subtitle="Tune the rhythm of your breaks">
      <Section label="Schedule">
        <Card>
          <Row
            first
            icon={<Timer20Regular />}
            title="Time between breaks"
            desc="How long you work before the next reminder"
            value={`${prefs.intervalMinutes} min`}
            right={
              <Slider
                className={l.slider}
                min={2}
                max={90}
                value={prefs.intervalMinutes}
                onChange={(_e, d) => setPref('intervalMinutes', d.value)}
              />
            }
          />
          <Row
            icon={<Clock20Regular />}
            title="Break length"
            desc="How long each break lasts"
            value={`${prefs.breakDurationSec} s`}
            right={
              <Slider
                className={l.slider}
                min={10}
                max={180}
                step={5}
                value={prefs.breakDurationSec}
                onChange={(_e, d) => setPref('breakDurationSec', d.value)}
              />
            }
          />
        </Card>
      </Section>

      <Section label="Before a break">
        <Card>
          <Row
            first
            icon={<Alert20Regular />}
            title="Heads-up notification"
            desc="A quiet nudge one minute before the break begins"
            right={
              <Switch
                checked={prefs.headsUpEnabled}
                onChange={(_e, d) => setPref('headsUpEnabled', d.checked)}
              />
            }
          />
        </Card>
      </Section>

      <Section label="Break mode">
        <div className={l.modes}>
          <div
            className={mergeClasses(l.mode, !strict ? l.modeOn : undefined)}
            onClick={() => setPref('strictBreakModeEnabled', false)}
          >
            <div className={l.modeHead}>
              Relaxed
              {!strict && <span className={l.modeCheck}><Checkmark16Filled /></span>}
            </div>
            <div className={l.modeDesc}>Skip or postpone a break whenever you need to.</div>
          </div>
          <div
            className={mergeClasses(l.mode, strict ? l.modeOn : undefined)}
            onClick={() => setPref('strictBreakModeEnabled', true)}
          >
            <div className={l.modeHead}>
              <LockClosed20Regular />
              Strict
              {strict && <span className={l.modeCheck}><Checkmark16Filled /></span>}
            </div>
            <div className={l.modeDesc}>The break screen can&apos;t be dismissed early.</div>
          </div>
        </div>
      </Section>

      <Section label="Sound">
        <Card>
          <Row
            first
            icon={<Speaker220Regular />}
            title="Break chime"
            desc="A soft tone when a break starts and ends"
            right={
              <Switch
                checked={prefs.soundEnabled}
                onChange={(_e, d) => setPref('soundEnabled', d.checked)}
              />
            }
          />
        </Card>
      </Section>

      <div className={u.body}>
        iRetina follows the 20-20-20 rule — every 20 minutes, look at something about 20 feet away
        for 20 seconds.
      </div>
    </Page>
  )
}
