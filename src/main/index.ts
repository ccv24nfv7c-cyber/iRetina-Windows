import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, powerMonitor, screen } from 'electron'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { store } from './preferences'
import {
  scheduleNextBreak,
  pauseTimer,
  resumeTimer,
  skipBreak,
  snoozeBreak,
  triggerNow,
  activateDND,
  deactivateDND,
  getState,
  setStateChangeCallback,
  onOverlayFinished
} from './break-engine'

let tray: Tray | null = null
let settingsWindow: BrowserWindow | null = null
let trayPopupWindow: BrowserWindow | null = null

// --- Icon resolution (falls back gracefully if an asset is missing) ---
const ASSETS_DIR = resolve(__dirname, '../../assets')

// 32×32 eye icon, embedded so the tray always has something to draw.
const FALLBACK_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABk0lEQVR42u2Xy0rDQBiFsxBB7SWNUYhN2iqoGx+gjyYqoqCi4OOJRRQviHtXbo+eKZE0mX8yiU1KwMIHIfPPnG9m0lwcpwk/b3MbZfhD4AhVYBXe2xihShYabpSoK1yUcP0h6qR5AtH+uBCFBFx/AAnd4M7hHZaO7rF8PFHwmOf0IvLYRgFpZgxsnz7AO3uEf/6k4DHPsU1eEYNAd32AJOFPBx0rJxMVFlw8Y3j1ip3rNwWPeY5trJH6p3O0AlJnzo4B4eULdm/ecXD7gZa7peAxz7GNNay1kUgIRCBSJ+4vl5izZFAcnIZtrGEt+8gS07xfgY4XgUgdeJFxZlzqeOafX1AkBdjGGtayjzRenGctwCXlxcb9jsN0AoQ1rDVtg0YgBCkiIGEnMM2zFtBtgQ77LSgoMO+LMCPQ7oWIqfpvmMxKCPSRpKobUTpHFDBJ5N2KbcNnBFpuHxLh3jiD9DDS1ZrGnnkimgolERN542XeB/L+3/PmX0D7ZrzWDVAHxm+DhYZXLVH6W3G1E6AMjfjy/gZfj6zt5yJRzQAAAABJRU5ErkJggg=='

function loadIcon(...names: string[]) {
  for (const name of names) {
    const p = resolve(ASSETS_DIR, name)
    if (existsSync(p)) {
      const img = nativeImage.createFromPath(p)
      if (!img.isEmpty()) return img
    }
  }
  return nativeImage.createFromDataURL(FALLBACK_ICON)
}

function getTrayIcon() {
  if (process.platform === 'darwin') {
    // Monochrome template image → macOS renders it crisp and theme-aware in the menu bar.
    const t = loadIcon('trayTemplate.png').resize({ width: 18, height: 18 })
    t.setTemplateImage(true)
    return t
  }
  return loadIcon('tray-icon.png', 'icon.png').resize({ width: 16, height: 16 })
}

function getWindowIcon() {
  return loadIcon('icon.png', 'logo.png', 'tray-icon.png')
}

// --- Settings window ---
function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (process.platform === 'darwin') app.focus({ steal: true })
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 820,
    height: 620,
    minWidth: 700,
    minHeight: 500,
    title: 'iRetina Settings',
    icon: getWindowIcon(),
    show: false,
    frame: true,
    transparent: false,
    webPreferences: {
      preload: resolve(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Windows 11 Mica material
  if (process.platform === 'win32') {
    settingsWindow.setBackgroundMaterial('mica')
  }

  if (process.env['ELECTRON_RENDERER_URL']) {
    settingsWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    settingsWindow.loadFile(resolve(__dirname, '../renderer/index.html'))
  }

  settingsWindow.once('ready-to-show', () => {
    // No Dock icon on macOS, so nudge the app forward or the window opens behind.
    if (process.platform === 'darwin') app.focus({ steal: true })
    settingsWindow!.show()
    settingsWindow!.focus()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

// --- Tray popup (mini card near tray) ---
function createTrayPopup() {
  if (trayPopupWindow && !trayPopupWindow.isDestroyed()) {
    closeTrayPopup()
    return
  }

  const trayBounds = tray!.getBounds()
  const winWidth = 322
  const winHeight = 384

  // Anchor the popup to the tray icon, then clamp it fully on-screen.
  // macOS puts the menu bar at the top, so the popup drops *below* the icon;
  // on Windows the taskbar is usually at the bottom, so it floats *above* it.
  const work = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y }).workArea
  let x = Math.round(trayBounds.x + trayBounds.width / 2 - winWidth / 2)
  let y =
    process.platform === 'darwin'
      ? Math.round(trayBounds.y + trayBounds.height + 4)
      : Math.round(trayBounds.y - winHeight - 8)
  x = Math.max(work.x + 8, Math.min(x, work.x + work.width - winWidth - 8))
  y = Math.max(work.y + 8, Math.min(y, work.y + work.height - winHeight - 8))

  trayPopupWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    show: false,
    webPreferences: {
      preload: resolve(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.platform === 'win32') {
    trayPopupWindow.setBackgroundMaterial('acrylic')
  }

  if (process.env['ELECTRON_RENDERER_URL']) {
    trayPopupWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?popup=1')
  } else {
    trayPopupWindow.loadFile(resolve(__dirname, '../renderer/index.html'), {
      query: { popup: '1' }
    })
  }

  trayPopupWindow.once('ready-to-show', () => {
    trayPopupWindow!.show()
    trayPopupWindow!.focus()
    // Attach the dismiss-on-blur handler only after the window has settled —
    // a transparent frameless window can emit a spurious blur the instant it
    // appears, which would close it before the user sees it.
    setTimeout(() => {
      trayPopupWindow?.on('blur', () => closeTrayPopup())
    }, 300)
  })

  trayPopupWindow.on('closed', () => {
    trayPopupWindow = null
  })
}

function closeTrayPopup() {
  if (trayPopupWindow && !trayPopupWindow.isDestroyed()) {
    trayPopupWindow.close()
  }
  trayPopupWindow = null
}

// --- Setup tray ---
function setupTray() {
  tray = new Tray(getTrayIcon())
  tray.setToolTip('iRetina — Eye Break Reminder')

  tray.on('click', () => {
    createTrayPopup()
  })

  tray.on('right-click', () => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Open Settings',
        click: createSettingsWindow
      },
      { type: 'separator' },
      {
        label: 'Take Break Now',
        click: () => triggerNow()
      },
      { type: 'separator' },
      {
        label: 'Quit iRetina',
        click: () => app.quit()
      }
    ])
    tray!.popUpContextMenu(menu)
  })
}

// --- IPC handlers ---
function setupIPC() {
  ipcMain.handle('prefs:get', (_e, key: string) => store.get(key as keyof typeof store.store))
  ipcMain.handle('prefs:set', (_e, key: string, value: unknown) =>
    store.set(key as keyof typeof store.store, value as never)
  )
  ipcMain.handle('prefs:getAll', () => store.store)

  ipcMain.handle('engine:getState', () => getState())
  ipcMain.handle('engine:triggerNow', () => triggerNow())
  ipcMain.handle('engine:skipBreak', () => skipBreak())
  ipcMain.handle('engine:snoozeBreak', (_e, minutes: number) => snoozeBreak(minutes))
  ipcMain.handle('engine:pauseTimer', (_e, reason: string) => pauseTimer(reason as 'away'))
  ipcMain.handle('engine:resumeTimer', () => resumeTimer())
  ipcMain.handle('engine:activateDND', (_e, hours: number) => activateDND(hours))
  ipcMain.handle('engine:deactivateDND', () => deactivateDND())

  ipcMain.handle('app:openSettings', () => createSettingsWindow())
  ipcMain.handle('app:closePopup', () => closeTrayPopup())
  ipcMain.handle('app:quit', () => app.quit())

  ipcMain.handle('app:setLoginItem', (_e, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled })
    store.set('launchAtLogin', enabled)
  })

  ipcMain.handle('app:getVersion', () => app.getVersion())

  ipcMain.on('overlay:finished', () => onOverlayFinished())
  ipcMain.on('overlay:skip', () => {
    skipBreak()
  })
  ipcMain.on('overlay:dnd', (_e, hours: number) => {
    activateDND(hours)
    skipBreak()
  })
}

// --- Activity monitoring ---
function setupActivityMonitor() {
  if (!store.get('smartPauseEnabled')) return

  powerMonitor.on('lock-screen', () => {
    if (store.get('smartPauseEnabled')) {
      pauseTimer('away')
      pushStateToRenderer()
    }
  })

  powerMonitor.on('unlock-screen', () => {
    if (store.get('smartPauseEnabled')) {
      resumeTimer()
      pushStateToRenderer()
    }
  })

  powerMonitor.on('suspend', () => {
    pauseTimer('away')
    pushStateToRenderer()
  })

  powerMonitor.on('resume', () => {
    resumeTimer()
    pushStateToRenderer()
  })
}

function pushStateToRenderer() {
  const state = getState()
  settingsWindow?.webContents.send('engine:stateChanged', state)
  trayPopupWindow?.webContents.send('engine:stateChanged', state)
}

// --- App lifecycle ---
app.whenReady().then(() => {
  // Don't show in taskbar — tray-only app
  app.setAppUserModelId('com.iretina.windows')

  setupIPC()
  setupTray()
  setupActivityMonitor()

  // Restore DND state
  const dndEnd = store.get('dndEndTime')
  if (dndEnd && Date.now() < dndEnd) {
    pauseTimer('dnd')
    setTimeout(() => deactivateDND(), dndEnd - Date.now())
  } else {
    store.set('dndEndTime', null)
  }

  scheduleNextBreak()

  setStateChangeCallback(() => pushStateToRenderer())

  // On first launch, open settings so the user can configure their schedule
  const isFirstLaunch = (store.get('breaksCompleted') as number) === 0
  if (isFirstLaunch) {
    createSettingsWindow()
  }
})

app.on('window-all-closed', () => {
  // iRetina lives in the tray — closing the settings window must not quit it.
})

app.on('before-quit', () => {
  tray?.destroy()
})
