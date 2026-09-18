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
  // Only the very base is transparent so Mica tints the window edges/nav.
  // Cards themselves are near-solid (Win11 "CardBackground") for crisp
  // definition and cheap compositing on low-end hardware.
  '--bg': 'transparent',
  '--surface': '#2B2B2D',
  '--surface-2': '#333336',
  '--surface-hover': '#3A3A3E',
  '--surface-active': '#404045',
  '--layer': '#272729',
  '--border': 'rgba(255, 255, 255, 0.086)',
  '--border-strong': 'rgba(255, 255, 255, 0.16)',
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
  '--shadow-sm': '0 2px 4px rgba(0,0,0,0.32)',
  '--shadow': '0 8px 20px rgba(0,0,0,0.44)',
  '--danger': '#FF99A4',
  '--danger-soft': 'rgba(255, 153, 164, 0.12)',
  '--warn': '#FCE100',
  '--good': '#6CCB5F',
  '--scrim': 'rgba(0,0,0,0.55)'
}

const LIGHT: Record<string, string> = {
  '--bg': 'transparent',
  '--surface': '#FFFFFF',
  '--surface-2': '#F6F6F8',
  '--surface-hover': '#F0F0F3',
  '--surface-active': '#E9E9ED',
  '--layer': '#FBFBFB',
  '--border': 'rgba(0, 0, 0, 0.0578)',
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
  '--shadow-sm': '0 1px 3px rgba(0,0,0,0.08)',
  '--shadow': '0 8px 20px rgba(0,0,0,0.16)',
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
