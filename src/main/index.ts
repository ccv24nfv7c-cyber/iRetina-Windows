import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  powerMonitor,
  shell,
  nativeTheme
} from 'electron'
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
  onOverlayFinished,
  startBreak
} from './break-engine'

let tray: Tray | null = null
let settingsWindow: BrowserWindow | null = null
let trayPopupWindow: BrowserWindow | null = null

// --- Tray icon path ---
function getTrayIconPath() {
  // Use a simple icon — will be replaced with real icon in production
  return resolve(__dirname, '../../assets/tray-icon.png')
}

// --- Settings window ---
function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 820,
    height: 620,
    minWidth: 700,
    minHeight: 500,
    title: 'iRetina Settings',
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
    settingsWindow!.show()
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
  const winWidth = 300
  const winHeight = 220

  // Position popup above the tray icon
  const x = Math.round(trayBounds.x - winWidth / 2 + trayBounds.width / 2)
  const y = Math.round(trayBounds.y - winHeight - 8)

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
  })

  trayPopupWindow.on('blur', () => {
    closeTrayPopup()
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
  const iconPath = getTrayIconPath()
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
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

  // Create a fallback tray icon if no file exists (drawn at runtime)
  const iconPath = resolve(__dirname, '../../assets/tray-icon.png')
  const fs = require('fs')
  if (!fs.existsSync(iconPath)) {
    // Create a simple 16x16 PNG as a placeholder
    // Real icon will be in assets/tray-icon.png
    const { nativeImage } = require('electron')
    const img = nativeImage.createEmpty()
    // We'll skip and let it fail gracefully in dev
  }

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

  // On first launch, open settings
  const launchCount = (store.get('breaksCompleted') as number) === 0
  if (launchCount) {
    createSettingsWindow()
  }
})

app.on('window-all-closed', (e: Event) => {
  // Prevent quit when windows close — tray app stays running
  e.preventDefault()
})

app.on('before-quit', () => {
  tray?.destroy()
})
