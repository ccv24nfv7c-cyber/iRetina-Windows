import { useEffect, useRef, useState } from 'react'
import { makeStyles, mergeClasses } from '@fluentui/react-components'
import {
  Checkmark12Filled,
  Checkmark20Filled,
  ChevronRight16Regular,
  ChevronLeft16Regular,
  Play20Filled
} from '@fluentui/react-icons'
import Logo from './Logo'
import { DUR, EASE } from './motion'

/* ----------------------------- illustrations ----------------------------- */
/* Clean inline SVGs. Deliberately NOT eyes. */

function ArtClock() {
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" aria-hidden>
      <circle cx="38" cy="38" r="37" fill="var(--accent-soft)" />
      <circle cx="38" cy="38" r="20" stroke="var(--accent)" strokeWidth="3" />
      <path d="M38 26v13l8 5" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArtTune() {
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" aria-hidden>
      <circle cx="38" cy="38" r="37" fill="var(--accent-soft)" />
      <g stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
        <path d="M24 31h28" />
        <path d="M24 45h28" />
      </g>
      <circle cx="34" cy="31" r="5" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="3" />
      <circle cx="44" cy="45" r="5" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="3" />
    </svg>
  )
}

function ArtChat() {
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" aria-hidden>
      <circle cx="38" cy="38" r="37" fill="var(--accent-soft)" />
      <path
        d="M23 30a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H34l-8 7v-7h1a4 4 0 0 1-5-4V30Z"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M31 36h14M31 41h9" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.92v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.92a9 9 0 0 0 0 8.1l3.06-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .92 4.95l3.06 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  )
}

const useStyles = makeStyles({
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text)',
    overflow: 'hidden',
    fontFamily:
      "'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    // Make the entire window draggable (the body content clears it below).
    WebkitAppRegion: 'drag' as 'drag'
  },
  // Content areas must be non-draggable so clicks/scrolls work.
  body: { flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', WebkitAppRegion: 'no-drag' as 'no-drag' },
  step: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 60px 18px',
    textAlign: 'center',
    boxSizing: 'border-box',
    overflowY: 'auto'
  },
  logoHalo: {
    width: '128px',
    height: '128px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '22px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, color-mix(in srgb, var(--accent) 24%, transparent) 0%, transparent 68%)'
  },
  art: { marginBottom: '20px' },
  title: { fontSize: '27px', fontWeight: '650', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '10px' },
  lede: { fontSize: '14.5px', lineHeight: 1.6, color: 'var(--text-dim)', maxWidth: '440px' },

  benefits: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '26px', width: '100%', maxWidth: '360px', textAlign: 'left' },
  benefit: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text)' },
  benefitTick: {
    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--accent)', color: 'var(--on-accent)', fontSize: '11px'
  },

  card: {
    marginTop: '26px', width: '100%', maxWidth: '440px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', textAlign: 'left'
  },
  row: { display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px' },
  rowDivider: { borderTop: '1px solid var(--border)' },
  rowText: { display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 },
  fieldLabel: { fontSize: '13px', fontWeight: '600', marginBottom: '10px' },
  seg: { display: 'flex', gap: '8px' },
  choice: {
    flex: 1, padding: '12px 8px', borderRadius: '8px',
    border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    transition: `background ${DUR.fast}ms ${EASE.standard}, border-color ${DUR.fast}ms ${EASE.standard}`,
    ':hover': { background: 'var(--surface-hover)' }
  },
  choiceOn: { border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' },
  choiceSub: { display: 'block', fontSize: '11px', fontWeight: '400', color: 'var(--text-mute)', marginTop: '3px' },

  // Try-your-break: a large, appealing preview of the real break screen.
  // Mirrors the real break screen: a dark frosted tint over a softly blurred
  // desktop (represented here with out-of-focus colour blobs).
  preview: {
    position: 'relative',
    marginTop: '24px', width: '100%', maxWidth: '420px', height: '190px', borderRadius: '16px',
    overflow: 'hidden',
    background: [
      'linear-gradient(180deg, rgba(12,15,22,0.60) 0%, rgba(9,11,16,0.70) 100%)',
      'radial-gradient(circle at 24% 22%, rgba(96,165,250,0.60), transparent 46%)',
      'radial-gradient(circle at 82% 78%, rgba(45,212,191,0.45), transparent 46%)',
      'radial-gradient(circle at 62% 42%, rgba(168,85,247,0.38), transparent 50%)',
      '#12151d'
    ].join(', '),
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px'
  },
  previewGlow: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backdropFilter: 'blur(2px)'
  },
  previewRing: {
    width: '78px', height: '78px', borderRadius: '50%',
    border: '5px solid rgba(255,255,255,0.12)', borderTopColor: '#60CDFF', borderRightColor: '#60CDFF',
    transform: 'rotate(45deg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
  },
  previewTime: { transform: 'rotate(-45deg)', fontSize: '17px', fontWeight: '700', color: '#fff', fontVariantNumeric: 'tabular-nums' },
  previewText: { fontSize: '15px', fontWeight: '600', color: '#ffffff', textShadow: '0 1px 8px rgba(0,0,0,0.55)', zIndex: 1 },
  previewSub: { fontSize: '11.5px', color: 'rgba(255,255,255,0.72)', textShadow: '0 1px 6px rgba(0,0,0,0.5)', zIndex: 1 },
  tryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '9px', marginTop: '22px',
    height: '44px', padding: '0 26px', borderRadius: '10px', border: '1px solid transparent',
    background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'inherit',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
    transition: `background ${DUR.fast}ms ${EASE.standard}, transform ${DUR.faster}ms ${EASE.standard}`,
    ':hover': { background: 'var(--accent-hover)' },
    ':active': { transform: 'scale(0.97)' }
  },

  // Referral / account option lists
  optList: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '360px', marginTop: '24px' },
  optItem: {
    display: 'flex', alignItems: 'center', gap: '11px', padding: '13px 16px', borderRadius: '9px',
    border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
    transition: `background ${DUR.fast}ms ${EASE.standard}, border-color ${DUR.fast}ms ${EASE.standard}`,
    ':hover': { background: 'var(--surface-hover)' }
  },
  optItemOn: { border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' },
  optRadio: {
    width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--border-strong)', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  optRadioOn: { border: '2px solid var(--accent)' },
  optDot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' },

  // Account
  form: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '340px', marginTop: '22px' },
  input: {
    width: '100%', height: '44px', padding: '0 14px', borderRadius: '8px',
    border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box', outline: 'none',
    ':focus': { border: '1px solid var(--accent)' }
  },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', maxWidth: '340px',
    height: '44px', marginTop: '12px', borderRadius: '8px', border: '1px solid var(--border-strong)',
    background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', transition: `background ${DUR.fast}ms ${EASE.standard}`,
    ':hover': { background: 'var(--surface-hover)' }
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '340px', margin: '14px 0 2px',
    color: 'var(--text-mute)', fontSize: '11px', fontWeight: '600'
  },
  dividerLine: { flex: 1, height: '1px', background: 'var(--border)' },
  authSwitch: { marginTop: '16px', fontSize: '13px', color: 'var(--text-dim)' },
  authLink: {
    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
    color: 'var(--accent)', fontFamily: 'inherit', fontSize: '13px', fontWeight: '600'
  },
  error: {
    maxWidth: '340px', marginTop: '12px', padding: '10px 12px', borderRadius: '8px',
    background: 'color-mix(in srgb, #D13438 10%, var(--surface))',
    border: '1px solid color-mix(in srgb, #D13438 35%, var(--border))',
    color: '#D13438', fontSize: '12.5px', lineHeight: 1.4
  },

  // Paywall
  proPill: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px',
    padding: '4px 12px', borderRadius: '20px',
    background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)',
    fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase'
  },
  billingToggle: {
    display: 'flex', gap: '6px', marginTop: '22px', padding: '5px',
    background: 'var(--surface-2)', borderRadius: '11px', border: '1px solid var(--border)'
  },
  billBtn: {
    display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '8px',
    border: '1px solid transparent', background: 'transparent', color: 'var(--text-dim)',
    fontFamily: 'inherit', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    transition: `background ${DUR.fast}ms ${EASE.standard}, color ${DUR.fast}ms ${EASE.standard}`
  },
  billBtnOn: { background: 'var(--accent)', color: 'var(--on-accent)', boxShadow: 'var(--shadow-sm)' },
  saveBadge: {
    padding: '2px 8px', borderRadius: '20px', background: 'var(--accent)', color: 'var(--on-accent)',
    fontSize: '10px', fontWeight: '700'
  },
  // On the selected (accent) button, flip the badge to a white pill so it stays readable.
  saveBadgeOn: { background: '#ffffff', color: 'var(--accent)' },
  planCard: {
    marginTop: '20px', width: '100%', maxWidth: '380px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
    boxShadow: 'var(--shadow-sm)', overflow: 'hidden', textAlign: 'left'
  },
  planHead: {
    padding: '18px 20px 16px',
    background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--surface)) 0%, var(--surface) 100%)',
    borderBottom: '1px solid var(--border)'
  },
  planPrice: { display: 'flex', alignItems: 'baseline', gap: '6px' },
  priceNum: { fontSize: '40px', fontWeight: '700', letterSpacing: '-0.02em', lineHeight: 1 },
  pricePer: { fontSize: '14px', fontWeight: '400', color: 'var(--text-mute)' },
  trialNote: { fontSize: '13px', color: 'var(--accent)', fontWeight: '600', marginTop: '10px' },
  planPerks: { padding: '16px 20px 18px' },
  perks: { display: 'flex', flexDirection: 'column', gap: '11px' },
  perk: { display: 'flex', alignItems: 'center', gap: '11px', fontSize: '13.5px' },
  perkCheck: {
    width: '19px', height: '19px', borderRadius: '50%', background: 'var(--accent)', color: 'var(--on-accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px'
  },

  // All-set
  successCircle: {
    width: '84px', height: '84px', borderRadius: '50%', marginBottom: '22px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--accent)', color: 'var(--on-accent)', fontSize: '38px',
    boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 34%, transparent)'
  },
  summary: { display: 'flex', gap: '10px', marginTop: '26px', width: '100%', maxWidth: '380px' },
  summaryCell: {
    flex: 1, padding: '14px 10px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center'
  },
  summaryNum: { fontSize: '18px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.01em' },
  summaryLabel: { fontSize: '11px', color: 'var(--text-mute)', fontWeight: '600' },

  // Footer
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 26px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', gap: '12px',
    WebkitAppRegion: 'no-drag' as 'no-drag'
  },
  dots: { display: 'flex', gap: '6px' },
  dot: {
    width: '7px', height: '7px', borderRadius: '50%', background: 'var(--border-strong)',
    transition: `width ${DUR.normal}ms ${EASE.decel}, background ${DUR.normal}ms ${EASE.decel}`
  },
  dotOn: { background: 'var(--accent)', width: '22px', borderRadius: '4px' },
  footerRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  btn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    height: '36px', padding: '0 20px', borderRadius: '6px', border: '1px solid transparent',
    fontFamily: 'inherit', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    transition: `background ${DUR.fast}ms ${EASE.standard}, transform ${DUR.faster}ms ${EASE.standard}`,
    ':active': { transform: 'scale(0.97)' },
    ':focus-visible': { outline: '2px solid var(--focus)', outlineOffset: '2px' }
  },
  btnPrimary: { background: 'var(--accent)', color: 'var(--on-accent)', boxShadow: 'var(--shadow-sm)', ':hover': { background: 'var(--accent-hover)' } },
  btnSubtle: { background: 'transparent', color: 'var(--text-dim)', ':hover': { background: 'var(--surface-2)', color: 'var(--text)' } }
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
const BENEFITS = [
  'Well-timed reminders to rest your eyes',
  'Follows the doctor-recommended 20-20-20 rule',
  'Stays quietly in your tray until you need it'
]
const REFERRALS = ['TikTok', 'X (Twitter)', 'Google', 'Posters', 'Other']
// 0 welcome · 1 how · 2 rhythm · 3 try · 4 referral · 5 account · 6 paywall · 7 all-set
const TOTAL = 8

export default function Onboarding() {
  const s = useStyles()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [interval, setInterval] = useState(20)
  const [duration, setDuration] = useState(30)
  const [launch] = useState(true)
  const [referral, setReferral] = useState('')
  const [billing, setBilling] = useState<'yearly' | 'monthly'>('yearly')
  const [plan, setPlan] = useState<'free' | 'pro'>('free')
  const [authView, setAuthView] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const firstRender = useRef(true)

  useEffect(() => { window.iretina.prefs.set('intervalMinutes', interval) }, [interval])
  useEffect(() => { window.iretina.prefs.set('breakDurationSec', duration) }, [duration])
  useEffect(() => { firstRender.current = false }, [])

  async function finish(chosen: 'free' | 'pro') {
    await window.iretina.app.setLoginItem(launch)
    await window.iretina.prefs.set('launchAtLogin', launch)
    await window.iretina.prefs.set('referralSource', referral)
    await window.iretina.prefs.set('accountEmail', email.trim())
    await window.iretina.app.setPlan(chosen)
    await window.iretina.app.completeOnboarding()
  }

  function go(to: number) {
    setError('')
    setDir(to > step ? 1 : -1)
    setStep(Math.max(0, Math.min(TOTAL - 1, to)))
  }
  function tryBreak() { window.iretina.engine.triggerNow() }

  async function submitAccount() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Enter your email and password, or skip account setup for now.')
      return
    }
    setBusy(true)
    setError('')
    const result = authView === 'signup'
      ? await window.iretina.account.signUp(trimmedEmail, password)
      : await window.iretina.account.login(trimmedEmail, password)
    setBusy(false)
    if (!result.ok) {
      setError(result.message || 'Account setup failed.')
      return
    }
    go(6)
  }

  async function googleAuth() {
    setBusy(true)
    setError('')
    const result = await window.iretina.account.continueWithGoogle()
    setBusy(false)
    if (!result.ok) setError(result.message || 'Google sign-in failed.')
  }

  async function startCheckout() {
    setBusy(true)
    setError('')
    const result = await window.iretina.account.startCheckout(billing)
    setBusy(false)
    if (!result.ok) {
      setError(result.message || 'Checkout failed.')
      return
    }
    setPlan('pro')
    go(7)
  }

  const stepAnim = firstRender.current
    ? `winFadeIn ${DUR.normal}ms ${EASE.decel} both`
    : `${dir === 1 ? 'winSlideInRight' : 'winSlideInLeft'} ${DUR.normal}ms ${EASE.decel} both`
  const rise = (i: number): React.CSSProperties => ({
    animation: `winFadeUp ${DUR.entrance}ms ${EASE.decel} ${70 + i * 50}ms both`
  })

  const price = billing === 'yearly' ? '$49.99' : '$4.99'
  const per = billing === 'yearly' ? '/ year' : '/ month'

  return (
    <div className={s.root}>
      <div className={s.body}>
        <div key={step} className={s.step} style={{ animation: stepAnim }}>
          {step === 0 && (
            <>
              <div className={s.logoHalo} style={rise(0)}><Logo size={104} /></div>
              <div className={s.title} style={rise(1)}>Welcome to iRetina</div>
              <div className={s.lede} style={rise(2)}>Give your eyes the breaks they need, without thinking about it.</div>
              <div className={s.benefits} style={rise(3)}>
                {BENEFITS.map((b) => (
                  <div key={b} className={s.benefit}>
                    <span className={s.benefitTick}><Checkmark12Filled /></span>{b}
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className={s.art} style={rise(0)}><ArtClock /></div>
              <div className={s.title} style={rise(1)}>The 20-20-20 rule</div>
              <div className={s.lede} style={rise(2)}>
                Every 20 minutes, look at something about 20 feet away for 20
                seconds. It relaxes the focusing muscles in your eyes and eases the
                strain of long screen time. iRetina keeps that rhythm for you.
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className={s.art} style={rise(0)}><ArtTune /></div>
              <div className={s.title} style={rise(1)}>Set your rhythm</div>
              <div className={s.lede} style={rise(2)}>Pick how often you’d like a break and how long it should last. You can change these anytime.</div>
              <div className={s.card} style={rise(3)}>
                <div className={s.row}>
                  <div className={s.rowText}>
                    <div className={s.fieldLabel}>Break every</div>
                    <div className={s.seg}>
                      {INTERVALS.map((o) => (
                        <button key={o.v} className={mergeClasses(s.choice, interval === o.v && s.choiceOn)} onClick={() => setInterval(o.v)}>
                          {o.label}<span className={s.choiceSub}>{o.sub}</span>
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
                        <button key={o.v} className={mergeClasses(s.choice, duration === o.v && s.choiceOn)} onClick={() => setDuration(o.v)}>
                          {o.label}<span className={s.choiceSub}>{o.sub}</span>
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
              <div className={s.title} style={rise(0)}>Try your first break</div>
              <div className={s.lede} style={rise(1)}>
                This is exactly what you’ll see when it’s time to rest. Give it a go: it appears now and you can dismiss it anytime.
              </div>
              <div className={s.preview} style={rise(2)}>
                <div className={s.previewGlow} />
                <div className={s.previewRing}><span className={s.previewTime}>0:20</span></div>
                <div className={s.previewText}>Look into the distance</div>
                <div className={s.previewSub}>Rest your eyes for 20 seconds</div>
              </div>
              <button className={s.tryBtn} style={rise(3)} onClick={tryBreak}>
                <Play20Filled /> Try it now
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <div className={s.art} style={rise(0)}><ArtChat /></div>
              <div className={s.title} style={rise(1)}>Where did you hear about us?</div>
              <div className={s.lede} style={rise(2)}>It helps us reach more people who need their eyes looked after. Optional.</div>
              <div className={s.optList} style={rise(3)}>
                {REFERRALS.map((r) => {
                  const on = referral === r
                  return (
                    <button key={r} className={mergeClasses(s.optItem, on && s.optItemOn)} onClick={() => setReferral(r)}>
                      <span className={`${s.optRadio} ${on ? s.optRadioOn : ''}`}>{on && <span className={s.optDot} />}</span>
                      {r}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 5 && authView === 'signup' && (
            <>
              <div className={s.logoHalo} style={{ ...rise(0), width: 92, height: 92, marginBottom: 14 }}><Logo size={58} /></div>
              <div className={s.title} style={rise(1)}>Create your account</div>
              <div className={s.lede} style={rise(2)}>So your plan and settings follow you to any device. You can skip this for now.</div>
              <button className={s.googleBtn} style={rise(3)} onClick={googleAuth} disabled={busy}><GoogleG /> Continue with Google</button>
              <div className={s.divider} style={rise(3)}><span className={s.dividerLine} /> OR <span className={s.dividerLine} /></div>
              <div className={s.form} style={rise(4)}>
                <input className={s.input} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className={s.input} type="password" autoComplete="new-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className={s.authSwitch} style={rise(5)}>
                Already have an account? <button className={s.authLink} onClick={() => setAuthView('login')}>Log in</button>
              </div>
              {error && <div className={s.error} role="alert">{error}</div>}
            </>
          )}

          {step === 5 && authView === 'login' && (
            <>
              <div className={s.logoHalo} style={{ ...rise(0), width: 92, height: 92, marginBottom: 14 }}><Logo size={58} /></div>
              <div className={s.title} style={rise(1)}>Welcome back</div>
              <div className={s.lede} style={rise(2)}>Log in to restore your iRetina Pro plan and settings.</div>
              <button className={s.googleBtn} style={rise(3)} onClick={googleAuth} disabled={busy}><GoogleG /> Continue with Google</button>
              <div className={s.divider} style={rise(3)}><span className={s.dividerLine} /> OR <span className={s.dividerLine} /></div>
              <div className={s.form} style={rise(4)}>
                <input className={s.input} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className={s.input} type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className={s.authSwitch} style={rise(5)}>
                New to iRetina? <button className={s.authLink} onClick={() => setAuthView('signup')}>Create an account</button>
              </div>
              {error && <div className={s.error} role="alert">{error}</div>}
            </>
          )}

          {step === 6 && (
            <>
              <div className={s.proPill} style={rise(0)}>iRetina Pro</div>
              <div className={s.title} style={rise(1)}>Choose your plan</div>
              <div className={s.lede} style={rise(2)}>Everything iRetina offers, to keep your eyes at their best.</div>
              <div className={s.billingToggle} style={rise(2)}>
                <button className={mergeClasses(s.billBtn, billing === 'yearly' && s.billBtnOn)} onClick={() => setBilling('yearly')}>
                  Yearly <span className={mergeClasses(s.saveBadge, billing === 'yearly' && s.saveBadgeOn)}>7-day free trial</span>
                </button>
                <button className={mergeClasses(s.billBtn, billing === 'monthly' && s.billBtnOn)} onClick={() => setBilling('monthly')}>
                  Monthly
                </button>
              </div>
              <div className={s.planCard} style={rise(3)}>
                <div className={s.planHead}>
                  <div className={s.planPrice}>
                    <span className={s.priceNum}>{price}</span>
                    <span className={s.pricePer}>{per}</span>
                  </div>
                  <div className={s.trialNote}>
                    {billing === 'yearly' ? '7 days free, then billed yearly. Cancel anytime.' : 'Billed monthly. Cancel anytime.'}
                  </div>
                </div>
                <div className={s.planPerks}>
                  <div className={s.perks}>
                    {PERKS.map((p) => (
                      <div key={p} className={s.perk}>
                        <span className={s.perkCheck}><Checkmark12Filled /></span>{p}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {error && <div className={s.error} role="alert">{error}</div>}
            </>
          )}

          {step === 7 && (
            <>
              <div className={s.successCircle} style={rise(0)}><Checkmark20Filled /></div>
              <div className={s.title} style={rise(1)}>You’re all set</div>
              <div className={s.lede} style={rise(2)}>
                iRetina is running in your system tray and will gently remind you to rest your eyes. Change anything anytime from Settings.
              </div>
              <div className={s.summary} style={rise(3)}>
                <div className={s.summaryCell}><span className={s.summaryNum}>{interval}m</span><span className={s.summaryLabel}>Between breaks</span></div>
                <div className={s.summaryCell}><span className={s.summaryNum}>{duration}s</span><span className={s.summaryLabel}>Break length</span></div>
                <div className={s.summaryCell}><span className={s.summaryNum}>{plan === 'pro' ? 'Pro' : 'Free'}</span><span className={s.summaryLabel}>Your plan</span></div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={s.footer}>
        <div className={s.dots}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span key={i} className={mergeClasses(s.dot, i === step && s.dotOn)} />
          ))}
        </div>

        <div className={s.footerRight}>
          {step > 0 && step < 7 && (
            <button className={`${s.btn} ${s.btnSubtle}`} onClick={() => go(step - 1)}>
              <ChevronLeft16Regular /> Back
            </button>
          )}

          {/* Steps 0-4: continue */}
          {step < 5 && (
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => go(step + 1)}>
              {step === 0 ? 'Get started' : 'Continue'} <ChevronRight16Regular />
            </button>
          )}

          {/* Step 5: account (before paywall) */}
          {step === 5 && (
            <>
              <button className={mergeClasses(s.btn, s.btnSubtle)} onClick={() => go(6)} disabled={busy}>Skip</button>
              <button className={mergeClasses(s.btn, s.btnPrimary)} onClick={submitAccount} disabled={busy}>
                {busy ? 'Working...' : authView === 'signup' ? 'Create account' : 'Log in'} <ChevronRight16Regular />
              </button>
            </>
          )}

          {/* Step 6: paywall */}
          {step === 6 && (
            <>
              <button className={mergeClasses(s.btn, s.btnSubtle)} onClick={() => { setPlan('free'); go(7) }} disabled={busy}>Maybe later</button>
              <button className={mergeClasses(s.btn, s.btnPrimary)} onClick={startCheckout} disabled={busy}>
                {busy ? 'Opening checkout...' : billing === 'yearly' ? 'Start free trial' : 'Subscribe'}
              </button>
            </>
          )}

          {/* Step 7: all set */}
          {step === 7 && (
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => finish(plan)}>Start using iRetina</button>
          )}
        </div>
      </div>
    </div>
  )
}
