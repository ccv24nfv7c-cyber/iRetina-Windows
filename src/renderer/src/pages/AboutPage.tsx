import { useEffect, useState } from 'react'
import { makeStyles } from '@fluentui/react-components'
import { OpenRegular, HeartRegular, GlobeRegular } from '@fluentui/react-icons'
import Logo from '../Logo'
import { Page, Section, Card } from './ui'

const useLocal = makeStyles({
  // Hero: logo beside the name / version / tagline, on a softly tinted card.
  hero: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    padding: '20px 22px',
    background:
      'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--surface)) 0%, var(--surface) 60%)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    boxShadow: 'var(--shadow-sm)'
  },
  heroText: { display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 },
  name: { fontSize: '18px', fontWeight: '600', letterSpacing: '-0.01em', color: 'var(--text)' },
  tagline: { fontSize: '12.5px', color: 'var(--text-dim)', lineHeight: 1.5 },
  ver: {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    marginTop: '4px',
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-mute)',
    fontVariantNumeric: 'tabular-nums'
  },

  // 20-20-20 rule, three equal cells inside a card.
  ruleGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' },
  ruleCell: {
    padding: '18px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    borderLeft: '1px solid var(--border)',
    ':first-child': { borderLeft: 'none' }
  },
  ruleNum: { fontSize: '26px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1 },
  ruleLabel: { fontSize: '11.5px', color: 'var(--text-mute)', fontWeight: '600', textAlign: 'center' },
  ruleCopy: {
    fontSize: '12.5px',
    lineHeight: 1.6,
    color: 'var(--text-dim)',
    padding: '14px 16px',
    borderTop: '1px solid var(--border)'
  },

  // Link rows inside a card, divided like Settings.
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    padding: '14px 16px',
    textDecoration: 'none',
    color: 'var(--text)',
    transition: 'background 120ms ease',
    ':hover': { background: 'var(--surface-hover)' },
    ':not(:first-child)': { borderTop: '1px solid var(--border)' }
  },
  linkIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '16px',
    color: 'var(--accent)',
    background: 'var(--accent-soft)'
  },
  linkText: { display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, minWidth: 0 },
  linkTitle: { fontSize: '13.5px', fontWeight: '600' },
  linkSub: { fontSize: '12px', color: 'var(--text-mute)' },
  ext: { color: 'var(--text-mute)', display: 'flex', fontSize: '15px', flexShrink: 0 }
})

export default function AboutPage() {
  const l = useLocal()
  const [version, setVersion] = useState('1.0.0')

  useEffect(() => {
    window.iretina.app.getVersion().then(setVersion).catch(() => {})
  }, [])

  return (
    <Page title="About">
      <Section index={0}>
        <div className={l.hero}>
          <Logo size={52} />
          <div className={l.heroText}>
            <div className={l.name}>iRetina for Windows</div>
            <div className={l.tagline}>
              A quiet reminder to rest your eyes, built on the doctor-recommended 20-20-20 rule.
            </div>
            <span className={l.ver}>Version {version}</span>
          </div>
        </div>
      </Section>

      <Section label="The 20-20-20 rule" index={1}>
        <Card>
          <div className={l.ruleGrid}>
            <div className={l.ruleCell}>
              <span className={l.ruleNum}>20</span>
              <span className={l.ruleLabel}>minutes of screen time</span>
            </div>
            <div className={l.ruleCell}>
              <span className={l.ruleNum}>20</span>
              <span className={l.ruleLabel}>feet away to look</span>
            </div>
            <div className={l.ruleCell}>
              <span className={l.ruleNum}>20</span>
              <span className={l.ruleLabel}>seconds to rest</span>
            </div>
          </div>
          <div className={l.ruleCopy}>
            Every 20 minutes, look at something at least 20 feet away for 20 seconds. It relaxes the
            focusing muscles in your eyes and cuts the strain of long screen sessions. iRetina keeps
            the habit for you and stays out of the way the rest of the time.
          </div>
        </Card>
      </Section>

      <Section label="Links" index={2}>
        <Card>
          <a className={l.link} href="https://apps.apple.com" target="_blank" rel="noreferrer">
            <span className={l.linkIcon}><HeartRegular /></span>
            <span className={l.linkText}>
              <span className={l.linkTitle}>iRetina for Mac</span>
              <span className={l.linkSub}>The original, on the Mac App Store</span>
            </span>
            <span className={l.ext}><OpenRegular /></span>
          </a>
          <a className={l.link} href="https://iretina.app" target="_blank" rel="noreferrer">
            <span className={l.linkIcon}><GlobeRegular /></span>
            <span className={l.linkText}>
              <span className={l.linkTitle}>iretina.app</span>
              <span className={l.linkSub}>Product site and support</span>
            </span>
            <span className={l.ext}><OpenRegular /></span>
          </a>
        </Card>
      </Section>
    </Page>
  )
}
