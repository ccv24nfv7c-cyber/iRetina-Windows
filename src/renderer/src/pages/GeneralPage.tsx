import React, { useEffect, useState } from 'react'
import type { Prefs, EngineState } from '../App'

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '14px 18px',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
}
const ROW_LAST: React.CSSProperties = { ...ROW, borderBottom: 'none' }

const ICON_WRAP: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '8px',
  background: 'rgba(0,120,212,0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
}

const LABEL_BLOCK: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
}

const LABEL: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#fff'
}

const SUBLABEL: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(255,255,255,0.45)',
  lineHeight: '1.4'
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  padding: '0 2px',
  marginBottom: '6px'
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.07)',
  overflow: 'hidden',
  marginBottom: '22px'
}

function DropdownSelect({
  value,
  options,
  onChange
}: {
  value: number
  options: { label: string; value: number }[]
  onChange: (v: number) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '6px',
        color: '#fff',
        fontSize: '13px',
        fontWeight: '500',
        padding: '6px 28px 6px 10px',
        fontFamily: "'Segoe UI Variable','Segoe UI',sans-serif",
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        minWidth: '120px'
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: '#1c1c20' }}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: checked ? '#0078D4' : 'rgba(255,255,255,0.15)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        flexShrink: 0,
        border: checked ? '1px solid #106EBE' : '1px solid rgba(255,255,255,0.12)'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
      }} />
    </div>
  )
}

function formatTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const intervalOptions = [5,10,15,20,25,30,45,60,90].map(v => ({ label: `${v} minutes`, value: v }))
const durationOptions = [10,15,20,30,45,60,90,120,180].map(v => ({ label: `${v} seconds`, value: v }))

export default function GeneralPage({
  prefs,
  engineState,
  setPref,
  refresh
}: {
  prefs: Prefs
  engineState: EngineState
  setPref: (key: keyof Prefs, value: unknown) => Promise<void>
  refresh: () => Promise<void>
}) {
  const [now, setNow] = useState(Date.now())
  const [loginEnabled, setLoginEnabled] = useState(prefs.launchAtLogin)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const remaining = engineState.nextBreakETA ? engineState.nextBreakETA - now : 0
  const dndActive = prefs.dndEndTime ? Date.now() < prefs.dndEndTime : false

  async function handleLoginToggle(v: boolean) {
    setLoginEnabled(v)
    await window.iretina.app.setLoginItem(v)
    await setPref('launchAtLogin', v)
  }

  return (
    <div style={{
      padding: '28px 32px 32px',
      height: '100%',
      overflowY: 'auto',
      fontFamily: "'Segoe UI Variable','Segoe UI',sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* Page heading */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>General</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
          Break cadence and when iRetina should stay out of your way.
        </div>
      </div>

      <div style={{ height: '24px' }} />

      {/* Countdown section */}
      <div style={SECTION_TITLE}>Countdown</div>
      <div style={CARD}>
        <div style={ROW}>
          <div style={ICON_WRAP}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <div style={LABEL_BLOCK}>
            <span style={LABEL}>Time between breaks</span>
            <span style={SUBLABEL}>The 20-20-20 rule suggests 20 minutes</span>
          </div>
          <DropdownSelect
            value={prefs.intervalMinutes}
            options={intervalOptions}
            onChange={(v) => setPref('intervalMinutes', v)}
          />
        </div>
        <div style={ROW_LAST}>
          <div style={ICON_WRAP}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
          </div>
          <div style={LABEL_BLOCK}>
            <span style={LABEL}>Break length</span>
            <span style={SUBLABEL}>How long the full-screen overlay stays up</span>
          </div>
          <DropdownSelect
            value={prefs.breakDurationSec}
            options={durationOptions}
            onChange={(v) => setPref('breakDurationSec', v)}
          />
        </div>
      </div>

      {/* Smart Pause section */}
      <div style={SECTION_TITLE}>Smart Pause</div>
      <div style={CARD}>
        <div style={ROW_LAST}>
          <div style={ICON_WRAP}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
          </div>
          <div style={LABEL_BLOCK}>
            <span style={LABEL}>Pause the timer when I step away</span>
            <span style={SUBLABEL}>Detects idle keyboard and mouse for over 2 minutes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: prefs.smartPauseEnabled ? '#4DA3FF' : 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
              {prefs.smartPauseEnabled ? 'On' : 'Off'}
            </span>
            <Toggle checked={prefs.smartPauseEnabled} onChange={(v) => setPref('smartPauseEnabled', v)} />
          </div>
        </div>
      </div>

      {/* Do Not Disturb section */}
      <div style={SECTION_TITLE}>Do Not Disturb</div>
      <div style={CARD}>
        <div style={ROW}>
          <div style={ICON_WRAP}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div style={LABEL_BLOCK}>
            <span style={LABEL}>Skip breaks during full-screen apps</span>
          </div>
          <Toggle checked={true} onChange={() => {}} />
        </div>
        <div style={ROW}>
          <div style={ICON_WRAP}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div style={LABEL_BLOCK}>
            <span style={LABEL}>Silence during Teams calls and meetings</span>
          </div>
          <Toggle checked={false} onChange={() => {}} />
        </div>
        <div style={ROW_LAST}>
          <div style={ICON_WRAP}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </div>
          <div style={LABEL_BLOCK}>
            <span style={LABEL}>Quiet hours</span>
            <span style={SUBLABEL}>10:00 PM – 7:00 AM</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </div>
      </div>

      {/* Startup */}
      <div style={SECTION_TITLE}>Startup</div>
      <div style={CARD}>
        <div style={ROW_LAST}>
          <div style={ICON_WRAP}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round">
              <polyline points="5,12 2,12 12,2 22,12 19,12"/><polyline points="5,12 5,20 10,20 10,14 14,14 14,20 19,20 19,12"/>
            </svg>
          </div>
          <div style={LABEL_BLOCK}>
            <span style={LABEL}>Launch at login</span>
            <span style={SUBLABEL}>Start iRetina automatically when Windows starts</span>
          </div>
          <Toggle checked={loginEnabled} onChange={handleLoginToggle} />
        </div>
      </div>
    </div>
  )
}
