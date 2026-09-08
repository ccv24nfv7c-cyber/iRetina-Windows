import { useEffect, useState } from 'react'
import { makeStyles } from '@fluentui/react-components'
import { OpenRegular } from '@fluentui/react-icons'
import Logo from '../Logo'
import { Page } from './ui'

const useLocal = makeStyles({
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '10px',
    padding: '32px 24px 28px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '14px'
  },
  name: { fontSize: '20px', fontWeight: '700', letterSpacing: '-0.01em', color: 'var(--text)' },
  tagline: { fontSize: '13px', color: 'var(--text-dim)', maxWidth: '320px', lineHeight: 1.5 },
  ver: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-mute)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em'
  },

  rule: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    overflow: 'hidden'
  },
  ruleCell: {
    padding: '18px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    borderLeft: '1px solid var(--border)',
    ':first-child': { borderLeft: 'none' }
  },
  ruleNum: { fontSize: '24px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '-0.02em' },
  ruleLabel: { fontSize: '11.5px', color: 'var(--text-mute)', fontWeight: '600', textAlign: 'center' },
  ruleCopy: { fontSize: '12.5px', lineHeight: 1.6, color: 'var(--text-dim)', padding: '0 2px' },

  sectionLabel: {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-mute)',
    padding: '0 2px'
  },
  links: { display: 'flex', flexDirection: 'column', gap: '2px' },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '11px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'var(--text)',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'background 160ms ease',
    ':hover': { background: 'var(--surface-2)' }
  },
  linkSub: { fontSize: '12px', fontWeight: '400', color: 'var(--text-mute)', flex: 1 },
  ext: { color: 'var(--text-mute)', display: 'flex', fontSize: '14px' }
})

export default function AboutPage() {
  const l = useLocal()
  const [version, setVersion] = useState('1.0.0')

  useEffect(() => {
    window.iretina.app.getVersion().then(setVersion).catch(() => {})
  }, [])

  return (
    <Page title="About">
      <div className={l.hero}>
        <Logo size={56} />
        <div className={l.name}>iRetina for Windows</div>
        <div className={l.tagline}>
          A quiet reminder to rest your eyes, built on the doctor-recommended 20-20-20 rule.
        </div>
        <div className={l.ver}>Version {version}</div>
      </div>

      <div className={l.sectionLabel}>The 20-20-20 rule</div>
      <div className={l.rule}>
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
        focusing muscles in your eyes and cuts the strain of long screen sessions. iRetina keeps the
        habit for you and stays out of the way the rest of the time.
      </div>

      <div className={l.sectionLabel}>Links</div>
      <div className={l.links}>
        <a className={l.link} href="https://apps.apple.com" target="_blank" rel="noreferrer">
          iRetina for Mac
          <span className={l.linkSub}>The original, on the Mac App Store</span>
          <span className={l.ext}>
            <OpenRegular />
          </span>
        </a>
        <a className={l.link} href="https://iretina.app" target="_blank" rel="noreferrer">
          iretina.app
          <span className={l.linkSub}>Product site and support</span>
          <span className={l.ext}>
            <OpenRegular />
          </span>
        </a>
      </div>
    </Page>
  )
}
