import { BrowserWindow, Notification, screen } from 'electron'
import { store } from './preferences'
import { resolve } from 'path'

type PauseReason = 'away' | 'dnd' | 'app-blocked' | 'subscription' | null

let breakTimer: ReturnType<typeof setTimeout> | null = null
let headsUpTimer: ReturnType<typeof setTimeout> | null = null
let breakWatchdog: ReturnType<typeof setTimeout> | null = null
let nextBreakETA: Date | null = null
let isPaused = false
let pauseReason: PauseReason = null
let isBreakActive = false
let overlayWindows: BrowserWindow[] = []

// The payload the overlay renderer needs. Kept around so we can re-send it if the
// overlay window reloads (e.g. Vite HMR in dev, or a renderer crash) — otherwise
// the overlay would sit there invisible while the engine still thinks a break is
// running.
type BreakPayload = {
  durationSec: number
  strict: boolean
  soundEnabled: boolean
  isPrimary: boolean
}
let onStateChange: (() => void) | null = null

export function setStateChangeCallback(cb: () => void) {
  onStateChange = cb
}

function notify() {
  onStateChange?.()
}

function liveOverlayCount() {
  return overlayWindows.filter((w) => !w.isDestroyed()).length
}

export function getState() {
  return {
    nextBreakETA: nextBreakETA?.getTime() ?? null,
    isPaused,
    pauseReason,
    isBreakActive,
    breaksCompleted: store.get('breaksCompleted')
  }
}

export function scheduleNextBreak() {
  clearTimers()
  if (isPaused || isBreakActive) return
  const dndEnd = store.get('dndEndTime')
  if (dndEnd && Date.now() < dndEnd) return

  const intervalMs = store.get('intervalMinutes') * 60 * 1000
  nextBreakETA = new Date(Date.now() + intervalMs)
  notify()

  if (store.get('headsUpEnabled')) {
    const headsUpDelay = intervalMs - 60_000
    if (headsUpDelay > 0) {
      headsUpTimer = setTimeout(() => showHeadsUpNotification(), headsUpDelay)
    }
  }

  breakTimer = setTimeout(() => {
    if (!isPaused && !isBreakActive) {
      startBreak()
    }
  }, intervalMs)
}

function clearTimers() {
  if (breakTimer) {
    clearTimeout(breakTimer)
    breakTimer = null
  }
  if (headsUpTimer) {
    clearTimeout(headsUpTimer)
    headsUpTimer = null
  }
  nextBreakETA = null
}

function showHeadsUpNotification() {
  new Notification({
    title: '1 minute until your break',
    body: 'Find a good stopping point and get ready to rest your eyes.',
    silent: !store.get('soundEnabled')
  }).show()
}

// Force everything back to a clean "no break" state. Used to recover if a break
// somehow got wedged (overlay closed without reporting, HMR during a break, etc.).
function resetBreakState() {
  if (breakWatchdog) {
    clearTimeout(breakWatchdog)
    breakWatchdog = null
  }
  isBreakActive = false
  closeOverlay()
}

export function startBreak() {
  // Self-heal: if we think a break is active but no overlay is actually on
  // screen, the previous one got wedged — clear it and start fresh.
  if (isBreakActive && liveOverlayCount() === 0) {
    resetBreakState()
  }
  if (isBreakActive) return

  clearTimers()
  isBreakActive = true
  notify()
  showOverlay()

  // Safety net: never let a break outlive its duration by more than 10s.
  const maxMs = store.get('breakDurationSec') * 1000 + 10_000
  if (breakWatchdog) clearTimeout(breakWatchdog)
  breakWatchdog = setTimeout(() => {
    if (isBreakActive) onOverlayFinished()
  }, maxMs)
}

export function pauseTimer(reason: PauseReason) {
  if (isPaused) return
  isPaused = true
  pauseReason = reason
  clearTimers()
  notify()
}

export function resumeTimer() {
  if (!isPaused) return
  isPaused = false
  pauseReason = null
  notify()
  scheduleNextBreak()
}

export function skipBreak() {
  if (store.get('strictBreakModeEnabled')) return
  // Multiple overlay windows (one per monitor) can each report a skip — only
  // act on the first one so the completed-break count stays accurate.
  if (!isBreakActive) return
  resetBreakState()
  clearTimers()
  store.set('breaksCompleted', store.get('breaksCompleted') + 1)
  scheduleNextBreak()
  notify()
}

export function snoozeBreak(minutes: number) {
  clearTimers()
  resetBreakState()
  isPaused = false
  pauseReason = null
  const intervalMs = minutes * 60 * 1000
  nextBreakETA = new Date(Date.now() + intervalMs)
  notify()
  breakTimer = setTimeout(() => {
    if (!isPaused && !isBreakActive) startBreak()
  }, intervalMs)
}

export function triggerNow() {
  clearTimers()
  // Clear any wedged break so "Take a break now" always works.
  resetBreakState()
  startBreak()
}

export function activateDND(durationHours: number) {
  const endTime = Date.now() + durationHours * 3_600_000
  store.set('dndEndTime', endTime)
  pauseTimer('dnd')
  setTimeout(() => deactivateDND(), durationHours * 3_600_000)
}

export function deactivateDND() {
  store.set('dndEndTime', null)
  if (pauseReason === 'dnd') {
    resumeTimer()
  }
}

function showOverlay() {
  const displays = screen.getAllDisplays()
  const primaryId = screen.getPrimaryDisplay().id

  overlayWindows = displays.map((display) => {
    const isPrimary = display.id === primaryId
    const payload: BreakPayload = {
      durationSec: store.get('breakDurationSec'),
      strict: store.get('strictBreakModeEnabled'),
      soundEnabled: store.get('soundEnabled'),
      isPrimary
    }

    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      // Native fullscreen fights with transparent windows on macOS; cover the
      // display bounds instead and use simple-fullscreen there.
      fullscreen: process.platform === 'win32',
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      show: false,
      webPreferences: {
        preload: resolve(__dirname, '../preload/overlay.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    if (process.platform === 'darwin') {
      win.setSimpleFullScreen(true)
    }
    win.setAlwaysOnTop(true, 'screen-saver')
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    // Re-send the start payload on every load — covers the initial load AND any
    // reload (HMR / crash recovery), so the overlay never ends up blank.
    win.webContents.on('did-finish-load', () => {
      win.webContents.send('overlay:start', payload)
    })

    win.once('ready-to-show', () => {
      if (win.isDestroyed()) return
      win.show()
      if (isPrimary) win.focus()
    })

    if (process.env['ELECTRON_RENDERER_URL']) {
      win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/overlay.html')
    } else {
      win.loadFile(resolve(__dirname, '../renderer/overlay.html'))
    }

    return win
  })
}

function closeOverlay() {
  overlayWindows.forEach((w) => {
    try {
      if (!w.isDestroyed()) {
        if (process.platform === 'darwin' && w.isSimpleFullScreen()) {
          w.setSimpleFullScreen(false)
        }
        w.close()
      }
    } catch {
      /* window already gone */
    }
  })
  overlayWindows = []
}

export function onOverlayFinished() {
  // One "finished" per monitor arrives — count the break once.
  if (!isBreakActive) return
  resetBreakState()
  store.set('breaksCompleted', store.get('breaksCompleted') + 1)
  scheduleNextBreak()
  notify()
}
