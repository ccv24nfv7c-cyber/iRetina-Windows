import { BrowserWindow, Notification, screen, app } from 'electron'
import { store } from './preferences'
import { resolve } from 'path'

type PauseReason = 'away' | 'dnd' | 'app-blocked' | 'subscription' | null

let breakTimer: ReturnType<typeof setTimeout> | null = null
let headsUpTimer: ReturnType<typeof setTimeout> | null = null
let nextBreakETA: Date | null = null
let isPaused = false
let pauseReason: PauseReason = null
let isBreakActive = false
let overlayWindows: BrowserWindow[] = []

let onStateChange: (() => void) | null = null

export function setStateChangeCallback(cb: () => void) {
  onStateChange = cb
}

function notify() {
  onStateChange?.()
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
  if (breakTimer) { clearTimeout(breakTimer); breakTimer = null }
  if (headsUpTimer) { clearTimeout(headsUpTimer); headsUpTimer = null }
  nextBreakETA = null
}

function showHeadsUpNotification() {
  if (store.get('soundEnabled')) {
    // Notification with sound on Windows goes through Action Center
  }
  new Notification({
    title: '1 minute until break',
    body: 'Get ready to rest your eyes',
    silent: false
  }).show()
}

export function startBreak() {
  if (isBreakActive) return
  clearTimers()
  isBreakActive = true
  notify()
  showOverlay()
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
  clearTimers()
  const count = store.get('breaksCompleted') + 1
  store.set('breaksCompleted', count)
  isBreakActive = false
  closeOverlay()
  scheduleNextBreak()
  notify()
}

export function snoozeBreak(minutes: number) {
  clearTimers()
  isBreakActive = false
  closeOverlay()
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
  overlayWindows = displays.map((display) => {
    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      fullscreen: true,
      show: false,
      webPreferences: {
        preload: resolve(__dirname, '../preload/overlay.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    if (process.env['ELECTRON_RENDERER_URL']) {
      win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/overlay.html')
    } else {
      win.loadFile(resolve(__dirname, '../renderer/overlay.html'))
    }

    win.setAlwaysOnTop(true, 'screen-saver')
    win.setVisibleOnAllWorkspaces(true)

    win.once('ready-to-show', () => {
      win.show()
      win.focus()
      win.webContents.send('overlay:start', {
        durationSec: store.get('breakDurationSec'),
        strict: store.get('strictBreakModeEnabled'),
        breakNumber: store.get('breaksCompleted') + 1
      })
    })

    return win
  })
}

function closeOverlay() {
  overlayWindows.forEach((w) => {
    try { w.close() } catch (_) {}
  })
  overlayWindows = []
}

export function onOverlayFinished() {
  const count = store.get('breaksCompleted') + 1
  store.set('breaksCompleted', count)
  isBreakActive = false
  closeOverlay()
  scheduleNextBreak()
  notify()
}
