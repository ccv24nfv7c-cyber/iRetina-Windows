import React, { useEffect, useState } from 'react'
import {
  makeStyles,
  tokens,
  Link,
  Divider,
  Text,
  Switch
} from '@fluentui/react-components'

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
  heroCard: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center'
  },
  heroEmoji: {
    fontSize: '52px'
  },
  heroTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1
  },
  heroSub: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    maxWidth: '340px',
    lineHeight: '1.5'
  },
  version: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    fontFamily: 'monospace'
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
  }
})

export default function AboutPage() {
  const styles = useStyles()
  const [version, setVersion] = useState('1.0.0')

  useEffect(() => {
    window.iretina.app.getVersion().then(setVersion).catch(() => {})
  }, [])

  return (
    <div className={styles.root}>
      <div className={styles.pageTitle}>About</div>

      <div className={styles.heroCard}>
        <div className={styles.heroEmoji}>👁</div>
        <div className={styles.heroTitle}>iRetina for Windows</div>
        <div className={styles.heroSub}>
          The eye care app that reminds you to rest your eyes. Built around the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.
        </div>
        <div className={styles.version}>v{version}</div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>The 20-20-20 Rule</div>
        <div style={{ padding: '16px 20px' }}>
          <Text size={300} style={{ color: tokens.colorNeutralForeground2, lineHeight: '1.6' }}>
            Recommended by eye care professionals to reduce digital eye strain. Every 20 minutes of screen time, take a 20-second break and look at something at least 20 feet (6 meters) away. iRetina automates this habit for you.
          </Text>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>Links</div>
        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>GitHub</div>
            <div className={styles.rowSub}>Source code & issue tracker</div>
          </div>
          <Link href="https://github.com" target="_blank">Open</Link>
        </div>
        <div className={styles.rowLast}>
          <div className={styles.rowLeft}>
            <div className={styles.rowTitle}>macOS Version</div>
            <div className={styles.rowSub}>iRetina is also available on Mac App Store</div>
          </div>
          <Link href="https://apps.apple.com" target="_blank">View</Link>
        </div>
      </div>
    </div>
  )
}
