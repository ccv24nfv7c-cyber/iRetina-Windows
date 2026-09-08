import { useEffect, useState } from 'react'
import { makeStyles } from '@fluentui/react-components'
import { Play16Filled, Settings16Regular, ArrowExit16Regular } from '@fluentui/react-icons'
import type { Prefs, EngineState } from './App'
import Logo from './Logo'
import Ring from './Ring'
import { Btn } from './pages/ui'

const useStyles = makeStyles({
  root: {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: '14px',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
    color: 'var(--text)',
    fontFamily:
      "'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '13px 14px',
    borderBottom: '1px solid var(--border)'
  },
  brand: { fontSize: '13px', fontWeight: '700', letterSpacing: '-0.01em', flex: 1 },
  iconBtn: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    ':hover': { background: 'var(--surface-2)', color: 'var(--text)' }
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '20px 16px 16px'
  },
  big: {
    fontSize: '32px',
    fontWeight: '400',
    lineHeight: 1,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums'
  },
  word: { fontSize: '20px', fontWeight: '600', color: 'var(--text)' },
  sub: {
    fontSize: '10.5px',
    fontWeight: '700',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--text-mute)',
    whiteSpace: 'nowrap'
  },
  footer: {
    padding: '12px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid var(--border)'
  },
  footRow: { display: 'flex', gap: '8px' },
  grow: { flex: 1 }
})

function fmt(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

export default function TrayPopup({
  prefs,
  engineState,
  setPref: _setPref,
  refresh
}: {
  prefs: Prefs
  engineState: EngineState
  setPref: (key: keyof Prefs, value: unknown) => Promise<void>
  refresh: () => Promise<void>
}) {
  const s = useStyles()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const intervalMs = prefs.intervalMinutes * 60_000
  const remaining = engineState.nextBreakETA ? engineState.nextBreakETA - now : 0
  let progress = engineState.nextBreakETA ? 1 - remaining / intervalMs : 0

  let center = <div className={s.big}>{fmt(remaining)}</div>
  let sub = 'until your next break'
  if (engineState.isBreakActive) {
    center = <div className={s.word}>On a break</div>
    sub = 'break screen is showing'
    progress = 1
  } else if (engineState.isPaused) {
    center = <div className={s.word}>Paused</div>
    sub =
      engineState.pauseReason === 'dnd'
        ? 'do not disturb'
        : engineState.pauseReason === 'away'
          ? "you're away"
          : 'timer paused'
    progress = 0
  }

  async function openSettings() {
    await window.iretina.app.openSettings()
    await window.iretina.app.closePopup()
  }
  async function resume() {
    await window.iretina.engine.resumeTimer()
    await refresh()
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <Logo size={20} />
        <span className={s.brand}>iRetina</span>
        <button className={s.iconBtn} aria-label="Settings" onClick={openSettings}>
          <Settings16Regular />
        </button>
      </div>

      <div className={s.body}>
        <Ring size={152} stroke={10} progress={progress} dim={engineState.isPaused}>
          {center}
        </Ring>
        <div className={s.sub}>{sub}</div>
      </div>

      <div className={s.footer}>
        <Btn
          variant="primary"
          icon={<Play16Filled />}
          onClick={() => window.iretina.engine.triggerNow()}
        >
          Take a break now
        </Btn>
        <div className={s.footRow}>
          {engineState.isPaused && (
            <Btn size="sm" className={s.grow} onClick={resume}>
              Resume
            </Btn>
          )}
          <Btn size="sm" className={s.grow} icon={<Settings16Regular />} onClick={openSettings}>
            Settings
          </Btn>
          <Btn
            size="sm"
            variant="subtle"
            icon={<ArrowExit16Regular />}
            onClick={() => window.iretina.app.quit()}
          >
            Quit
          </Btn>
        </div>
      </div>
    </div>
  )
}
