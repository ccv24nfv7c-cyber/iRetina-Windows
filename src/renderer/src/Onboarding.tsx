import { useEffect, useState } from 'react'
import { makeStyles, Switch } from '@fluentui/react-components'
import {
  Eye24Regular,
  Timer24Regular,
  Power24Regular,
  Checkmark20Filled,
  Sparkle24Filled,
  ChevronRight16Regular,
  ChevronLeft16Regular
} from '@fluentui/react-icons'
import Logo from './Logo'

const useStyles = makeStyles({
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text)',
    fontFamily:
      "'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
  },
  // Content region grows; footer stays pinned so the primary button never moves.
  body: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 56px 24px',
    textAlign: 'center'
  },
  glyph: {
    width: '72px',
    height: '72px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '34px',
    color: 'var(--accent)',
    background: 'var(--accent-soft)',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
    marginBottom: '10px'
  },
  lede: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: 'var(--text-dim)',
    maxWidth: '440px'
  },
  // Reusable settings card (mirrors the main window's Win11 card rows).
  card: {
    marginTop: '28px',
    width: '100%',
    maxWidth: '460px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    overflow: 'hidden',
    textAlign: 'left'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 18px'
  },
  rowDivider: { borderTop: '1px solid var(--border)' },
  rowIcon: { fontSize: '20px', color: 'var(--text-dim)', display: 'flex', flexShrink: 0 },
  rowText: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 },
  rowTitle: { fontSize: '14px', fontWeight: '600' },
  rowDesc: { fontSize: '12px', color: 'var(--text-mute)', lineHeight: 1.4 },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '20px'
  },
  seg: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  },
  choice: {
    flex: 1,
    padding: '14px 10px',
    borderRadius: '8px',
    border: '1px solid var(--border-strong)',
    background: 'var(--surface-2)',
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 120ms ease, border-color 120ms ease',
    ':hover': { background: 'var(--surface-hover)' }
  },
  choiceOn: {
    borderColor: 'var(--accent)',
    background: 'var(--accent-soft)',
    color: 'var(--accent)'
  },
  choiceSub: { display: 'block', fontSize: '11px', fontWeight: '400', color: 'var(--text-mute)', marginTop: '2px' },

  // Paywall
  price: { fontSize: '40px', fontWeight: '700', letterSpacing: '-0.02em', lineHeight: 1 },
  pricePer: { fontSize: '14px', fontWeight: '400', color: 'var(--text-mute)' },
  perks: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '22px', maxWidth: '380px', width: '100%', textAlign: 'left' },
  perk: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' },
  perkCheck: { color: 'var(--good)', display: 'flex', flexShrink: 0 },

  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
    gap: '12px'
  },
  dots: { display: 'flex', gap: '7px' },
  dot: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--border-strong)' },
  dotOn: { background: 'var(--accent)', width: '20px', borderRadius: '4px' },
  footerRight: { display: 'flex', alignItems: 'center', gap: '8px' },

  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '34px',
    padding: '0 18px',
    borderRadius: '5px',
    border: '1px solid transparent',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 120ms ease, border-color 120ms ease',
    ':focus-visible': { outline: '2px solid var(--focus)', outlineOffset: '2px' }
  },
  btnPrimary: {
    background: 'var(--accent)',
    color: 'var(--on-accent)',
    ':hover': { background: 'var(--accent-hover)' }
  },
  btnGhost: {
    background: 'var(--surface-2)',
    color: 'var(--text)',
    border: '1px solid var(--border-strong)',
    ':hover': { background: 'var(--surface-hover)' }
  },
  btnSubtle: {
    background: 'transparent',
    color: 'var(--text-dim)',
    ':hover': { background: 'var(--surface-2)', color: 'var(--text)' }
  }
})

const INTERVALS = [
  { v: 20, label: '20 min', sub: 'Recommended' },
  { v: 30, label: '30 min', sub: 'Relaxed' },
  { v: 45, label: '45 min', sub: 'Focused' }
]
const DURATIONS = [
  { v: 20, label: '20 sec', sub: 'Quick' },
  { v: 30, label: '30 sec', sub: 'Recommended' },
  { v: 60, label: '60 sec', sub: 'Full reset' }
]

const PERKS = [
  'Unlimited custom break schedules',
  'Strict mode & focus presets',
  'Break history & eye-health insights',
  'Priority support and future updates'
]

export default function Onboarding() {
  const s = useStyles()
  const [step, setStep] = useState(0)
  const [interval, setInterval] = useState(20)
  const [duration, setDuration] = useState(30)
  const [launch, setLaunch] = useState(true)
  const total = 5

  // Persist the schedule choices as they're made, so nothing is lost on skip.
  useEffect(() => {
    window.iretina.prefs.set('intervalMinutes', interval)
  }, [interval])
  useEffect(() => {
    window.iretina.prefs.set('breakDurationSec', duration)
  }, [duration])

  async function finish(plan: 'free' | 'pro') {
    await window.iretina.app.setLoginItem(launch)
    await window.iretina.prefs.set('launchAtLogin', launch)
    await window.iretina.app.setPlan(plan)
    await window.iretina.app.completeOnboarding()
  }

  const next = () => setStep((n) => Math.min(total - 1, n + 1))
  const back = () => setStep((n) => Math.max(0, n - 1))

  return (
    <div className={s.root}>
      <div className={s.body}>
        {step === 0 && (
          <>
            <div className={s.glyph} style={{ background: 'transparent' }}>
              <Logo size={72} />
            </div>
            <div className={s.title}>Welcome to iRetina</div>
            <div className={s.lede}>
              Gentle, well-timed reminders to rest your eyes — so long screen days
              feel a little easier. Let’s get you set up in a few quick steps.
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className={s.glyph}>
              <Eye24Regular />
            </div>
            <div className={s.title}>The 20-20-20 rule</div>
            <div className={s.lede}>
              Every 20 minutes, look at something about 20 feet away for 20 seconds.
              It relaxes the focusing muscles in your eyes and eases the strain of
              staring at a screen. iRetina quietly keeps that rhythm for you.
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className={s.glyph}>
              <Timer24Regular />
            </div>
            <div className={s.title}>Set your rhythm</div>
            <div className={s.lede}>Pick how often you’d like a break, and how long it should last. You can change these anytime.</div>
            <div className={s.card}>
              <div className={s.row}>
                <div className={s.rowText}>
                  <div className={s.rowTitle}>Break every</div>
                  <div className={s.seg}>
                    {INTERVALS.map((o) => (
                      <button
                        key={o.v}
                        className={`${s.choice} ${interval === o.v ? s.choiceOn : ''}`}
                        onClick={() => setInterval(o.v)}
                      >
                        {o.label}
                        <span className={s.choiceSub}>{o.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className={`${s.row} ${s.rowDivider}`}>
                <div className={s.rowText}>
                  <div className={s.rowTitle}>Break lasts</div>
                  <div className={s.seg}>
                    {DURATIONS.map((o) => (
                      <button
                        key={o.v}
                        className={`${s.choice} ${duration === o.v ? s.choiceOn : ''}`}
                        onClick={() => setDuration(o.v)}
                      >
                        {o.label}
                        <span className={s.choiceSub}>{o.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className={s.glyph}>
              <Power24Regular />
            </div>
            <div className={s.title}>Always ready</div>
            <div className={s.lede}>iRetina runs quietly in your system tray. Start it automatically when you sign in so your eyes are always looked after.</div>
            <div className={s.card}>
              <div className={s.row}>
                <span className={s.rowIcon}><Power24Regular /></span>
                <div className={s.rowText}>
                  <div className={s.rowTitle}>Launch at sign-in</div>
                  <div className={s.rowDesc}>Recommended — keeps iRetina running in the background</div>
                </div>
                <Switch checked={launch} onChange={(_e, d) => setLaunch(d.checked)} />
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className={s.glyph}>
              <Sparkle24Filled />
            </div>
            <div className={s.title}>iRetina Pro</div>
            <div className={s.lede}>Unlock everything iRetina has to offer and keep your eyes at their best.</div>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className={s.price}>$2.99</span>
              <span className={s.pricePer}>/ month</span>
            </div>
            <div className={s.perks}>
              {PERKS.map((p) => (
                <div key={p} className={s.perk}>
                  <span className={s.perkCheck}><Checkmark20Filled /></span>
                  {p}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className={s.footer}>
        <div className={s.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`${s.dot} ${i === step ? s.dotOn : ''}`} />
          ))}
        </div>

        <div className={s.footerRight}>
          {step > 0 && step < total - 1 && (
            <button className={`${s.btn} ${s.btnSubtle}`} onClick={back}>
              <ChevronLeft16Regular /> Back
            </button>
          )}

          {step < total - 1 && (
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={next}>
              {step === 0 ? 'Get started' : 'Continue'} <ChevronRight16Regular />
            </button>
          )}

          {step === total - 1 && (
            <>
              <button className={`${s.btn} ${s.btnSubtle}`} onClick={() => finish('free')}>
                Skip for now
              </button>
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => finish('pro')}>
                <Sparkle24Filled style={{ fontSize: 16 }} /> Upgrade to Pro
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
