import { useEffect, useRef, useState } from 'react'
import { makeStyles, Switch } from '@fluentui/react-components'
import {
  Eye24Regular,
  Timer24Regular,
  Power24Regular,
  Checkmark12Filled,
  Sparkle20Filled,
  ChevronRight16Regular,
  ChevronLeft16Regular
} from '@fluentui/react-icons'
import Logo from './Logo'
import { DUR, EASE } from './motion'

const useStyles = makeStyles({
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text)',
    overflow: 'hidden',
    fontFamily:
      "'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
  },
  // Ambient accent glow behind the content - a soft radial (no blur filter,
  // which is expensive on low-end GPUs).
  glowField: {
    position: 'absolute',
    top: '-200px',
    left: '50%',
    width: '560px',
    height: '460px',
    transform: 'translateX(-50%)',
    background:
      'radial-gradient(ellipse at center, var(--accent-soft) 0%, transparent 70%)',
    pointerEvents: 'none',
    opacity: 0.9
  },
  body: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden'
  },
  // Each step is absolutely stacked so the outgoing/incoming steps can animate.
  step: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '44px 64px 20px',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  glyph: {
    width: '76px',
    height: '76px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '34px',
    color: 'var(--accent)',
    background:
      'linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, var(--surface)) 0%, color-mix(in srgb, var(--accent) 6%, var(--surface)) 100%)',
    border: '1px solid color-mix(in srgb, var(--accent) 24%, transparent)',
    boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 18%, transparent)',
    marginBottom: '22px'
  },
  // Welcome logo focal treatment: the mark on a soft accent halo.
  logoHalo: {
    width: '132px',
    height: '132px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '28px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, color-mix(in srgb, var(--accent) 26%, transparent) 0%, transparent 68%)'
  },
  title: {
    fontSize: '27px',
    fontWeight: '650',
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
    marginBottom: '12px'
  },
  lede: {
    fontSize: '14.5px',
    lineHeight: 1.6,
    color: 'var(--text-dim)',
    maxWidth: '430px'
  },
  card: {
    marginTop: '30px',
    width: '100%',
    maxWidth: '440px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    textAlign: 'left'
  },
  row: { display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px' },
  rowDivider: { borderTop: '1px solid var(--border)' },
  rowIcon: { fontSize: '22px', color: 'var(--accent)', display: 'flex', flexShrink: 0 },
  rowText: { display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 },
  rowTitle: { fontSize: '14px', fontWeight: '600' },
  rowDesc: { fontSize: '12px', color: 'var(--text-mute)', lineHeight: 1.4 },
  fieldLabel: { fontSize: '13px', fontWeight: '600', marginBottom: '10px' },
  seg: { display: 'flex', gap: '8px' },
  choice: {
    flex: 1,
    padding: '12px 8px',
    borderRadius: '8px',
    border: '1px solid var(--border-strong)',
    background: 'var(--surface-2)',
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: `background ${DUR.fast}ms ${EASE.standard}, border-color ${DUR.fast}ms ${EASE.standard}, transform ${DUR.faster}ms ${EASE.standard}`,
    ':hover': { background: 'var(--surface-hover)' },
    ':active': { transform: 'scale(0.97)' }
  },
  choiceOn: {
    border: '1px solid var(--accent)',
    background: 'var(--accent-soft)',
    color: 'var(--accent)'
  },
  choiceSub: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '400',
    color: 'var(--text-mute)',
    marginTop: '3px'
  },

  // Paywall — a single self-contained plan card.
  proPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    marginBottom: '14px',
    padding: '4px 11px',
    borderRadius: '20px',
    background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
    color: 'var(--accent)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase'
  },
  planCard: {
    marginTop: '22px',
    width: '100%',
    maxWidth: '380px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    textAlign: 'left'
  },
  planHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '6px',
    padding: '18px 20px',
    background:
      'linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, var(--surface)) 0%, var(--surface) 100%)',
    borderBottom: '1px solid var(--border)'
  },
  priceNum: { fontSize: '40px', fontWeight: '700', letterSpacing: '-0.02em', lineHeight: 1 },
  pricePer: { fontSize: '14px', fontWeight: '400', color: 'var(--text-mute)' },
  perks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px 20px 18px'
  },
  perk: { display: 'flex', alignItems: 'center', gap: '11px', fontSize: '13.5px' },
  perkCheck: {
    width: '19px',
    height: '19px',
    borderRadius: '50%',
    background: 'var(--accent)',
    color: 'var(--on-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '10px'
  },

  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 26px',
    borderTop: '1px solid var(--border)',
    background: 'var(--surface-2)',
    gap: '12px'
  },
  dots: { display: 'flex', gap: '7px' },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--border-strong)',
    transition: `width ${DUR.normal}ms ${EASE.decel}, background ${DUR.normal}ms ${EASE.decel}`
  },
  dotOn: { background: 'var(--accent)', width: '22px', borderRadius: '4px' },
  footerRight: { display: 'flex', alignItems: 'center', gap: '8px' },

  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '36px',
    padding: '0 20px',
    borderRadius: '6px',
    border: '1px solid transparent',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: `background ${DUR.fast}ms ${EASE.standard}, border-color ${DUR.fast}ms ${EASE.standard}, transform ${DUR.faster}ms ${EASE.standard}`,
    ':active': { transform: 'scale(0.97)' },
    ':focus-visible': { outline: '2px solid var(--focus)', outlineOffset: '2px' }
  },
  btnPrimary: {
    background: 'var(--accent)',
    color: 'var(--on-accent)',
    boxShadow: 'var(--shadow-sm)',
    ':hover': { background: 'var(--accent-hover)' }
  },
  btnGhost: {
    background: 'var(--surface)',
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
const TOTAL = 5

export default function Onboarding() {
  const s = useStyles()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [interval, setInterval] = useState(20)
  const [duration, setDuration] = useState(30)
  const [launch, setLaunch] = useState(true)
  const firstRender = useRef(true)

  // Persist the schedule choices as they're made, so nothing is lost on skip.
  useEffect(() => {
    window.iretina.prefs.set('intervalMinutes', interval)
  }, [interval])
  useEffect(() => {
    window.iretina.prefs.set('breakDurationSec', duration)
  }, [duration])
  useEffect(() => {
    firstRender.current = false
  }, [])

  async function finish(plan: 'free' | 'pro') {
    await window.iretina.app.setLoginItem(launch)
    await window.iretina.prefs.set('launchAtLogin', launch)
    await window.iretina.app.setPlan(plan)
    await window.iretina.app.completeOnboarding()
  }

  function go(to: number) {
    setDir(to > step ? 1 : -1)
    setStep(Math.max(0, Math.min(TOTAL - 1, to)))
  }

  // Incoming step slides from the right on forward nav, left on back nav.
  const stepAnim = firstRender.current
    ? `winFadeIn ${DUR.normal}ms ${EASE.decel} both`
    : `${dir === 1 ? 'winSlideInRight' : 'winSlideInLeft'} ${DUR.normal}ms ${EASE.decel} both`

  // Stagger the glyph/title/lede for a lively but quick entrance.
  const rise = (i: number): React.CSSProperties => ({
    animation: `winFadeUp ${DUR.entrance}ms ${EASE.decel} ${80 + i * 55}ms both`
  })

  return (
    <div className={s.root}>
      <div className={s.body}>
        <div className={s.glowField} />
        <div key={step} className={s.step} style={{ animation: stepAnim }}>
          {step === 0 && (
            <>
              <div className={s.logoHalo} style={rise(0)}>
                <Logo size={104} />
              </div>
              <div className={s.title} style={rise(1)}>Welcome to iRetina</div>
              <div className={s.lede} style={rise(2)}>
                Gentle, well-timed reminders to rest your eyes, so long screen
                days feel a little easier. Let’s get you set up in a few quick steps.
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className={s.glyph} style={rise(0)}><Eye24Regular /></div>
              <div className={s.title} style={rise(1)}>The 20-20-20 rule</div>
              <div className={s.lede} style={rise(2)}>
                Every 20 minutes, look at something about 20 feet away for 20
                seconds. It relaxes the focusing muscles in your eyes and eases the
                strain of staring at a screen. iRetina keeps that rhythm for you.
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className={s.glyph} style={rise(0)}><Timer24Regular /></div>
              <div className={s.title} style={rise(1)}>Set your rhythm</div>
              <div className={s.lede} style={rise(2)}>
                Pick how often you’d like a break and how long it should last. You
                can change these anytime.
              </div>
              <div className={s.card} style={rise(3)}>
                <div className={s.row}>
                  <div className={s.rowText}>
                    <div className={s.fieldLabel}>Break every</div>
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
                    <div className={s.fieldLabel}>Break lasts</div>
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
              <div className={s.glyph} style={rise(0)}><Power24Regular /></div>
              <div className={s.title} style={rise(1)}>Always ready</div>
              <div className={s.lede} style={rise(2)}>
                iRetina runs quietly in your system tray. Start it automatically
                when you sign in so your eyes are always looked after.
              </div>
              <div className={s.card} style={rise(3)}>
                <div className={s.row}>
                  <span className={s.rowIcon}><Power24Regular /></span>
                  <div className={s.rowText}>
                    <div className={s.rowTitle}>Launch at sign-in</div>
                    <div className={s.rowDesc}>Recommended. Keeps iRetina running in the background</div>
                  </div>
                  <Switch checked={launch} onChange={(_e, d) => setLaunch(d.checked)} />
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className={s.proPill} style={rise(0)}>
                <Sparkle20Filled style={{ fontSize: 13 }} /> iRetina Pro
              </div>
              <div className={s.title} style={rise(1)}>Unlock the full experience</div>
              <div className={s.lede} style={rise(2)}>
                Everything iRetina has to offer, to keep your eyes at their best.
              </div>
              <div className={s.planCard} style={rise(3)}>
                <div className={s.planHead}>
                  <span className={s.priceNum}>$2.99</span>
                  <span className={s.pricePer}>/ month</span>
                </div>
                <div className={s.perks}>
                  {PERKS.map((p) => (
                    <div key={p} className={s.perk}>
                      <span className={s.perkCheck}><Checkmark12Filled /></span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={s.footer}>
        <div className={s.dots}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span key={i} className={`${s.dot} ${i === step ? s.dotOn : ''}`} />
          ))}
        </div>

        <div className={s.footerRight}>
          {step > 0 && step < TOTAL - 1 && (
            <button className={`${s.btn} ${s.btnSubtle}`} onClick={() => go(step - 1)}>
              <ChevronLeft16Regular /> Back
            </button>
          )}

          {step < TOTAL - 1 && (
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => go(step + 1)}>
              {step === 0 ? 'Get started' : 'Continue'} <ChevronRight16Regular />
            </button>
          )}

          {step === TOTAL - 1 && (
            <>
              <button className={`${s.btn} ${s.btnSubtle}`} onClick={() => finish('free')}>
                Skip for now
              </button>
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => finish('pro')}>
                <Sparkle20Filled /> Upgrade to Pro
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
