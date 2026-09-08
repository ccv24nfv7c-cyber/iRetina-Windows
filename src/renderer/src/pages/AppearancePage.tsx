import { makeStyles, mergeClasses } from '@fluentui/react-components'
import { Checkmark12Filled } from '@fluentui/react-icons'
import type { Prefs } from '../App'
import { THEME_EVENT } from '../theme-events'
import Ring from '../Ring'
import { Page, Section } from './ui'

const useLocal = makeStyles({
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '10px',
    cursor: 'pointer',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    transition: 'border-color 160ms ease, background 160ms ease',
    ':hover': { background: 'var(--surface-hover)' },
    ':focus-visible': { outline: '2px solid var(--focus)', outlineOffset: '2px' }
  },
  cardOn: { border: '1px solid var(--accent)' },
  // mini app mock
  mock: {
    height: '74px',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    border: '1px solid rgba(128,128,128,0.18)'
  },
  mockRail: { width: '22px', height: '100%', display: 'flex', flexDirection: 'column', gap: '4px', padding: '7px 5px' },
  mockDot: { width: '10px', height: '3px', borderRadius: '2px' },
  mockBody: { flex: 1, padding: '9px', display: 'flex', flexDirection: 'column', gap: '5px' },
  mockLine: { height: '5px', borderRadius: '3px' },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12.5px',
    fontWeight: '600',
    color: 'var(--text)',
    padding: '0 2px'
  },
  check: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--accent)',
    color: 'var(--on-accent)'
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '12px'
  },
  previewText: { fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text-dim)' },
  ringMini: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums'
  }
})

type Opt = { value: 'system' | 'light' | 'dark'; label: string; rail: string; body: string; line: string; dot: string }
const OPTIONS: Opt[] = [
  { value: 'light', label: 'Light', rail: '#EDEFF3', body: '#FFFFFF', line: '#D8DCE3', dot: '#B7BDC8' },
  { value: 'dark', label: 'Dark', rail: '#12161C', body: '#1A1F27', line: '#2C333E', dot: '#3C444F' },
  { value: 'system', label: 'System', rail: '#12161C', body: 'linear-gradient(100deg,#1A1F27 0 50%,#FFFFFF 50%)', line: '#5b6270', dot: '#6b7280' }
]

export default function AppearancePage({
  prefs,
  setPref
}: {
  prefs: Prefs
  setPref: (key: keyof Prefs, value: unknown) => Promise<void>
}) {
  const l = useLocal()

  async function choose(v: Opt['value']) {
    await setPref('theme', v)
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: v }))
  }

  return (
    <Page title="Appearance" subtitle="How iRetina looks on your screen">
      <Section label="Theme">
        <div className={l.grid}>
          {OPTIONS.map((o) => {
            const on = prefs.theme === o.value
            return (
              <button
                key={o.value}
                className={mergeClasses(l.card, on ? l.cardOn : undefined)}
                onClick={() => choose(o.value)}
              >
                <div className={l.mock}>
                  <div className={l.mockRail} style={{ background: o.rail }}>
                    <span className={l.mockDot} style={{ background: 'var(--accent)' }} />
                    <span className={l.mockDot} style={{ background: o.dot }} />
                    <span className={l.mockDot} style={{ background: o.dot }} />
                  </div>
                  <div className={l.mockBody} style={{ background: o.body }}>
                    <span className={l.mockLine} style={{ background: o.line, width: '70%' }} />
                    <span className={l.mockLine} style={{ background: o.line, width: '90%' }} />
                    <span className={l.mockLine} style={{ background: o.line, width: '55%' }} />
                  </div>
                </div>
                <div className={l.head}>
                  {o.label}
                  {on && (
                    <span className={l.check}>
                      <Checkmark12Filled />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      <Section label="Break screen">
        <div className={l.preview}>
          <Ring size={64} stroke={5} progress={0.68}>
            <span className={l.ringMini}>0:07</span>
          </Ring>
          <div className={l.previewText}>
            The break screen fades in, counts down on a ring like this one, and fades back out with a
            soft chime when your break is over. Turn the chime on or off under{' '}
            <strong style={{ color: 'var(--text)' }}>Break Timer → Sound</strong>.
          </div>
        </div>
      </Section>
    </Page>
  )
}
