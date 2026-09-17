import type { CSSProperties } from 'react'

/**
 * Windows 11 design tokens as CSS custom properties.
 *
 * The window itself paints a Mica backdrop (see main/index.ts), so the app
 * background is intentionally *transparent* — the desktop tint shows through
 * exactly like the real Settings app. Content sits on layered "card" surfaces
 * that mimic WinUI's Layer / CardBackground fills, with the system accent used
 * sparingly. Every value has a light and dark definition tuned to Win11.
 */
export type Scheme = 'light' | 'dark'

const DARK: Record<string, string> = {
  // Transparent so the Mica material shows through the window chrome.
  '--bg': 'transparent',
  // Solid-ish layer that sits on Mica; matches WinUI CardBackgroundFillColorDefault.
  '--surface': 'rgba(58, 58, 62, 0.30)',
  '--surface-2': 'rgba(255, 255, 255, 0.05)',
  '--surface-hover': 'rgba(255, 255, 255, 0.08)',
  '--surface-active': 'rgba(255, 255, 255, 0.03)',
  // Content layer behind the nav / used for solid panels.
  '--layer': 'rgba(32, 32, 32, 0.70)',
  '--border': 'rgba(255, 255, 255, 0.07)',
  '--border-strong': 'rgba(255, 255, 255, 0.12)',
  '--text': '#FFFFFF',
  '--text-dim': 'rgba(255, 255, 255, 0.786)',
  '--text-mute': 'rgba(255, 255, 255, 0.545)',
  // Windows 11 system accent (default blue), light-on-dark variants.
  '--accent': '#60CDFF',
  '--accent-hover': '#75D5FF',
  '--accent-press': '#4AB8EC',
  '--accent-soft': 'rgba(96, 205, 255, 0.10)',
  '--on-accent': '#000000',
  '--ring-track': 'rgba(255, 255, 255, 0.10)',
  '--focus': '#60CDFF',
  '--shadow-sm': '0 1px 2px rgba(0,0,0,0.28)',
  '--shadow': '0 8px 24px rgba(0,0,0,0.40)',
  '--danger': '#FF99A4',
  '--danger-soft': 'rgba(255, 153, 164, 0.10)',
  '--warn': '#FCE100',
  '--good': '#6CCB5F',
  '--scrim': 'rgba(0,0,0,0.55)'
}

const LIGHT: Record<string, string> = {
  '--bg': 'transparent',
  '--surface': 'rgba(255, 255, 255, 0.70)',
  '--surface-2': 'rgba(0, 0, 0, 0.03)',
  '--surface-hover': 'rgba(0, 0, 0, 0.05)',
  '--surface-active': 'rgba(0, 0, 0, 0.02)',
  '--layer': 'rgba(249, 249, 249, 0.80)',
  '--border': 'rgba(0, 0, 0, 0.06)',
  '--border-strong': 'rgba(0, 0, 0, 0.11)',
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
  '--shadow-sm': '0 1px 2px rgba(0,0,0,0.06)',
  '--shadow': '0 8px 24px rgba(0,0,0,0.14)',
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
