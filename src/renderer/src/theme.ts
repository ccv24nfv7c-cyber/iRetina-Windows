import type { CSSProperties } from 'react'

/**
 * Design tokens as CSS custom properties. Solid, opaque surfaces — no
 * translucency, no glass. One accent, used sparingly. Every value has a
 * light and a dark definition so contrast holds in both.
 */
export type Scheme = 'light' | 'dark'

const DARK: Record<string, string> = {
  '--bg': '#0D1015',
  '--surface': '#161A21',
  '--surface-2': '#1E232B',
  '--surface-hover': '#232833',
  '--surface-active': '#2A303B',
  '--border': '#2A2F38',
  '--border-strong': '#3A414D',
  '--text': '#F3F5F8',
  '--text-dim': '#AEB6C2',
  '--text-mute': '#7B838F',
  '--accent': '#4C9BFF',
  '--accent-hover': '#5FA8FF',
  '--accent-press': '#3D86E8',
  '--accent-soft': '#1B2A3E',
  '--on-accent': '#FFFFFF',
  '--ring-track': '#262B34',
  '--focus': '#6FB2FF',
  '--shadow-sm': '0 1px 2px rgba(0,0,0,0.4)',
  '--shadow': '0 12px 32px rgba(0,0,0,0.45)',
  '--danger': '#F2555A',
  '--danger-soft': '#3A2226',
  '--warn': '#E9A23B',
  '--good': '#3FBF8F',
  '--scrim': 'rgba(0,0,0,0.55)'
}

const LIGHT: Record<string, string> = {
  '--bg': '#F4F6F9',
  '--surface': '#FFFFFF',
  '--surface-2': '#F3F5F8',
  '--surface-hover': '#EDF0F4',
  '--surface-active': '#E4E9F0',
  '--border': '#E3E6EB',
  '--border-strong': '#CBD1DA',
  '--text': '#161A20',
  '--text-dim': '#565E6B',
  '--text-mute': '#828A96',
  '--accent': '#1F6FE0',
  '--accent-hover': '#1A63CC',
  '--accent-press': '#1858B8',
  '--accent-soft': '#E9F1FD',
  '--on-accent': '#FFFFFF',
  '--ring-track': '#E6E9EE',
  '--focus': '#1F6FE0',
  '--shadow-sm': '0 1px 2px rgba(16,24,40,0.06)',
  '--shadow': '0 12px 32px rgba(16,24,40,0.14)',
  '--danger': '#D22E33',
  '--danger-soft': '#FCEBEC',
  '--warn': '#B26C00',
  '--good': '#0B8A5E',
  '--scrim': 'rgba(16,24,40,0.45)'
}

export function themeVars(scheme: Scheme): Record<string, string> {
  return scheme === 'dark' ? DARK : LIGHT
}

/** Inline-style object for a root element. */
export function themeStyle(scheme: Scheme): CSSProperties {
  return themeVars(scheme) as unknown as CSSProperties
}
