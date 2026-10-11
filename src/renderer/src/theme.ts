import type { CSSProperties } from 'react'

/**
 * Windows 11 design tokens as CSS custom properties.
 *
 * The window itself paints a Mica backdrop (see main/index.ts), so the app
 * background is intentionally *transparent* - the desktop tint shows through
 * exactly like the real Settings app. Content sits on layered "card" surfaces
 * that mimic WinUI's Layer / CardBackground fills, with the system accent used
 * sparingly. Every value has a light and dark definition tuned to Win11.
 */
export type Scheme = 'light' | 'dark'

const DARK: Record<string, string> = {
  // Only the very base is transparent so Mica tints the window edges/nav.
  // Cards themselves are near-solid (Win11 "CardBackground") for crisp
  // definition and cheap compositing on low-end hardware.
  '--bg': 'radial-gradient(circle at 84% 8%, rgba(48, 132, 255, 0.13), transparent 34%), linear-gradient(145deg, rgba(15, 20, 30, 0.90), rgba(21, 23, 30, 0.78))',
  '--surface': 'rgba(36, 39, 48, 0.86)',
  '--surface-2': 'rgba(49, 53, 64, 0.78)',
  '--surface-hover': 'rgba(63, 68, 82, 0.86)',
  '--surface-active': 'rgba(70, 76, 92, 0.90)',
  '--layer': 'rgba(27, 30, 38, 0.76)',
  '--border': 'rgba(255, 255, 255, 0.09)',
  '--border-strong': 'rgba(255, 255, 255, 0.18)',
  '--text': '#FFFFFF',
  '--text-dim': 'rgba(255, 255, 255, 0.792)',
  '--text-mute': 'rgba(255, 255, 255, 0.549)',
  // Windows 11 system accent (default blue), light-on-dark variants.
  '--accent': '#60CDFF',
  '--accent-hover': '#75D5FF',
  '--accent-press': '#4AB8EC',
  '--accent-soft': 'rgba(96, 205, 255, 0.12)',
  '--on-accent': '#000000',
  '--ring-track': 'rgba(255, 255, 255, 0.10)',
  '--focus': '#60CDFF',
  '--shadow-sm': '0 4px 16px rgba(0,0,0,0.22)',
  '--shadow': '0 18px 42px rgba(0,0,0,0.38)',
  '--danger': '#FF99A4',
  '--danger-soft': 'rgba(255, 153, 164, 0.12)',
  '--warn': '#FCE100',
  '--good': '#6CCB5F',
  '--scrim': 'rgba(0,0,0,0.55)'
}

const LIGHT: Record<string, string> = {
  '--bg': 'radial-gradient(circle at 82% 4%, rgba(0, 120, 212, 0.12), transparent 34%), linear-gradient(145deg, rgba(248, 251, 255, 0.92), rgba(237, 243, 251, 0.78))',
  '--surface': 'rgba(255, 255, 255, 0.84)',
  '--surface-2': 'rgba(245, 248, 252, 0.82)',
  '--surface-hover': 'rgba(234, 241, 249, 0.92)',
  '--surface-active': 'rgba(224, 234, 245, 0.94)',
  '--layer': 'rgba(250, 252, 255, 0.72)',
  '--border': 'rgba(32, 64, 96, 0.09)',
  '--border-strong': 'rgba(32, 64, 96, 0.16)',
  '--text': 'rgba(0, 0, 0, 0.896)',
  '--text-dim': 'rgba(0, 0, 0, 0.606)',
  '--text-mute': 'rgba(0, 0, 0, 0.447)',
  // Windows 11 system accent (default blue) for light backgrounds.
  '--accent': '#005FB8',
  '--accent-hover': '#1A6FC0',
  '--accent-press': '#26518C',
  '--accent-soft': 'rgba(0, 95, 184, 0.08)',
  '--on-accent': '#FFFFFF',
  '--ring-track': 'rgba(0, 0, 0, 0.09)',
  '--focus': '#005FB8',
  '--shadow-sm': '0 5px 18px rgba(32,64,96,0.08)',
  '--shadow': '0 18px 42px rgba(32,64,96,0.15)',
  '--danger': '#C42B1C',
  '--danger-soft': 'rgba(196, 43, 28, 0.06)',
  '--warn': '#9D5D00',
  '--good': '#0F7B0F',
  '--scrim': 'rgba(0,0,0,0.35)'
}

export function themeVars(scheme: Scheme): Record<string, string> {
  return scheme === 'dark' ? DARK : LIGHT
}

/** Inline-style object for a root element. */
export function themeStyle(scheme: Scheme): CSSProperties {
  return themeVars(scheme) as unknown as CSSProperties
}
