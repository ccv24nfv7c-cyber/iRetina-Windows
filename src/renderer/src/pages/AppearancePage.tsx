import React from 'react'
import {
  makeStyles,
  tokens,
  RadioGroup,
  Radio,
  Text
} from '@fluentui/react-components'
import type { Prefs } from '../App'

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
  cardBody: {
    padding: '16px 20px'
  },
  themeCards: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px'
  },
  themeCard: {
    padding: '16px 12px',
    borderRadius: '10px',
    border: '2px solid transparent',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.04)',
    textAlign: 'center',
    transition: 'all 0.15s ease'
  },
  themeCardSelected: {
    padding: '16px 12px',
    borderRadius: '10px',
    border: `2px solid ${tokens.colorBrandStroke1}`,
    cursor: 'pointer',
    background: `${tokens.colorBrandBackground2}`,
    textAlign: 'center',
    transition: 'all 0.15s ease'
  },
  themeEmoji: {
    fontSize: '28px',
    display: 'block',
    marginBottom: '8px'
  },
  themeLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1
  },
  themeSub: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    marginTop: '2px'
  }
})

export default function AppearancePage({
  prefs,
  setPref
}: {
  prefs: Prefs
  setPref: (key: keyof Prefs, value: unknown) => Promise<void>
}) {
  const styles = useStyles()

  const themes = [
    { value: 'system', emoji: '🖥', label: 'System', sub: 'Follow Windows' },
    { value: 'dark', emoji: '🌙', label: 'Dark', sub: 'Dark mode' },
    { value: 'light', emoji: '☀️', label: 'Light', sub: 'Light mode' }
  ]

  return (
    <div className={styles.root}>
      <div className={styles.pageTitle}>Appearance</div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>Theme</div>
        <div className={styles.cardBody}>
          <div className={styles.themeCards}>
            {themes.map((t) => (
              <div
                key={t.value}
                className={prefs.theme === t.value ? styles.themeCardSelected : styles.themeCard}
                onClick={() => setPref('theme', t.value)}
              >
                <span className={styles.themeEmoji}>{t.emoji}</span>
                <div className={styles.themeLabel}>{t.label}</div>
                <div className={styles.themeSub}>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>Break Overlay</div>
        <div className={styles.cardBody}>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            The break overlay uses your Windows 11 accent color and Mica material for a native, integrated look.
            It adapts automatically to your system theme.
          </Text>
        </div>
      </div>
    </div>
  )
}
