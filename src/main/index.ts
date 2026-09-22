import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, powerMonitor, screen, shell } from 'electron'
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
let onboardingWindow: BrowserWindow | null = null
let checkoutWindow: BrowserWindow | null = null

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
    title: 'iRetina',
    icon: getWindowIcon(),
    show: false,
    // Hidden title bar: keeps the native Win11 caption buttons (min/max/close)
    // and drag region but removes the title text row so our renderer owns the
    // top of the window. The titleBarOverlay tints the caption-button area to
    // match our dark Mica background on Windows.
    titleBarStyle: 'hidden',
    ...(process.platform === 'win32' && {
      titleBarOverlay: {
        color: '#00000000',
        symbolColor: '#ffffff',
        height: 44
      }
    }),
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

// --- Onboarding window (first-run guided setup) ---
function createOnboardingWindow() {
  if (onboardingWindow && !onboardingWindow.isDestroyed()) {
    if (process.platform === 'darwin') app.focus({ steal: true })
    onboardingWindow.show()
    onboardingWindow.focus()
    return
  }

  onboardingWindow = new BrowserWindow({
    width: 720,
    height: 680,
    resizable: false,
    maximizable: false,
    title: 'iRetina',
    icon: getWindowIcon(),
    show: false,
    titleBarStyle: 'hidden',
    ...(process.platform === 'win32' && {
      titleBarOverlay: {
        color: '#00000000',
        symbolColor: '#ffffff',
        height: 40
      }
    }),
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
    onboardingWindow.setBackgroundMaterial('mica')
  }

  const query = { onboarding: '1' }
  if (process.env['ELECTRON_RENDERER_URL']) {
    onboardingWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?onboarding=1')
  } else {
    onboardingWindow.loadFile(resolve(__dirname, '../renderer/index.html'), { query })
  }

  onboardingWindow.once('ready-to-show', () => {
    if (process.platform === 'darwin') app.focus({ steal: true })
    onboardingWindow!.show()
    onboardingWindow!.focus()
  })

  onboardingWindow.on('closed', () => {
    onboardingWindow = null
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

  // No background material here: acrylic fills the whole rectangular window,
  // including the corner triangles outside the card's border-radius, which shows
  // up as white square corners. A plain transparent window lets the rounded card
  // float cleanly with real transparent corners.

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
    // Attach the dismiss-on-blur handler only after the window has settled -
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

// The hosted backend (Supabase Edge Functions). Not a secret — it's the public
// API endpoint. An env var still overrides it for local development.
const DEFAULT_API_BASE_URL = 'https://ekrknhbtgwkmzwkgzzez.supabase.co/functions/v1/api'
const API_BASE_URL = process.env.IRETINA_API_BASE_URL || DEFAULT_API_BASE_URL

function requireApiBase() {
  if (!API_BASE_URL) {
    throw new Error('Set IRETINA_API_BASE_URL to your iRetina backend before using accounts or Stripe.')
  }
  return API_BASE_URL.replace(/\/$/, '')
}

async function apiPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${requireApiBase()}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(store.get('authToken') ? { authorization: `Bearer ${store.get('authToken')}` } : {})
    },
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : `Request failed (${res.status})`)
  }
  return data as Record<string, unknown>
}

function saveAccount(data: Record<string, unknown>, fallbackEmail = '') {
  if (typeof data.token === 'string') store.set('authToken', data.token)
  if (typeof data.customerId === 'string') store.set('customerId', data.customerId)
  if (typeof data.email === 'string') store.set('accountEmail', data.email)
  else if (fallbackEmail) store.set('accountEmail', fallbackEmail)
  if (data.plan === 'pro') store.set('plan', 'pro')
}

function createCheckoutWindow(url: string) {
  if (checkoutWindow && !checkoutWindow.isDestroyed()) checkoutWindow.close()

  return new Promise<{ ok: boolean; message?: string }>((resolveCheckout) => {
    let settled = false
    const settle = (result: { ok: boolean; message?: string }) => {
      if (settled) return
      settled = true
      resolveCheckout(result)
      if (checkoutWindow && !checkoutWindow.isDestroyed()) checkoutWindow.close()
    }

    checkoutWindow = new BrowserWindow({
      width: 520,
      height: 720,
      minWidth: 460,
      minHeight: 620,
      title: 'iRetina Checkout',
      parent: onboardingWindow ?? settingsWindow ?? undefined,
      modal: Boolean(onboardingWindow ?? settingsWindow),
      icon: getWindowIcon(),
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    const handleCheckoutUrl = (targetUrl: string) => {
      if (targetUrl.startsWith('iretina://checkout/success')) {
        store.set('plan', 'pro')
        settle({ ok: true })
        return true
      }
      if (targetUrl.startsWith('iretina://checkout/cancel')) {
        settle({ ok: false, message: 'Checkout was canceled.' })
        return true
      }
      return false
    }

    checkoutWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
      if (handleCheckoutUrl(targetUrl)) return { action: 'deny' }
      shell.openExternal(targetUrl)
      return { action: 'deny' }
    })
    checkoutWindow.webContents.on('will-navigate', (event, targetUrl) => {
      if (handleCheckoutUrl(targetUrl)) event.preventDefault()
    })
    checkoutWindow.webContents.on('will-redirect', (event, targetUrl) => {
      if (handleCheckoutUrl(targetUrl)) event.preventDefault()
    })
    checkoutWindow.loadURL(url)
    checkoutWindow.once('ready-to-show', () => checkoutWindow?.show())
    checkoutWindow.on('closed', () => {
      checkoutWindow = null
      if (!settled) settle({ ok: false, message: 'Checkout window was closed.' })
    })
  })
}

// --- Google sign-in (in-app OAuth window) ---
// Google refuses OAuth inside embedded webviews, so we present a normal-looking
// window with a plain desktop Chrome user-agent, then capture the session token


// --- Setup tray ---
function setupTray() {
  tray = new Tray(getTrayIcon())
  tray.setToolTip('iRetina · Eye Break Reminder')

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
      {
        label: 'Run Setup Again…',
        click: () => createOnboardingWindow()
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
// --- In-app Google OAuth window ---
// Opens a small focused window with a clean Chrome user agent so Google doesn't
// block it as an unsafe webview. We intercept the iretina://auth/callback
// redirect (which the window can't load as a URL) and grab the token.
const GOOGLE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function openGoogleSignInWindow(startUrl: string): Promise<{ ok: boolean; message?: string }> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result: { ok: boolean; message?: string }) => {
      if (settled) return
      settled = true
      if (!win.isDestroyed()) win.close()
      resolve(result)
    }

    const win = new BrowserWindow({
      width: 480,
      height: 640,
      title: 'Sign in with Google',
      parent: onboardingWindow ?? settingsWindow ?? undefined,
      modal: Boolean(onboardingWindow ?? settingsWindow),
      icon: getWindowIcon(),
      show: false,
      autoHideMenuBar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
    })

    const tryCapture = (url: string) => {
      if (!url.startsWith('iretina://auth/callback')) return false
      const hash = url.includes('#') ? url.split('#')[1] : ''
      const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : ''
      const p = new URLSearchParams(hash || query)
      const token = p.get('access_token')
      const err = p.get('error_description') || p.get('error')
      if (token) { store.set('authToken', token); finish({ ok: true }) }
      else finish({ ok: false, message: err ?? 'Google sign-in failed.' })
      return true
    }

    win.webContents.setUserAgent(GOOGLE_UA)
    win.webContents.on('will-navigate', (e, url) => { if (url.startsWith('iretina://')) { e.preventDefault(); tryCapture(url) } })
    win.webContents.on('will-redirect', (e, url) => { if (url.startsWith('iretina://')) { e.preventDefault(); tryCapture(url) } })
    win.webContents.on('did-navigate', (_, url) => { if (url.startsWith('iretina://')) tryCapture(url) })
    win.webContents.setWindowOpenHandler(({ url }) => { win.loadURL(url, { userAgent: GOOGLE_UA }); return { action: 'deny' } })
    win.once('ready-to-show', () => win.show())
    win.on('closed', () => { if (!settled) finish({ ok: false, message: 'Sign-in was canceled.' }) })
    win.loadURL(startUrl, { userAgent: GOOGLE_UA })
  })
}

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

  ipcMain.handle('app:completeOnboarding', () => {
    store.set('onboardingComplete', true)
    if (onboardingWindow && !onboardingWindow.isDestroyed()) onboardingWindow.close()
    onboardingWindow = null
    // Drop the user straight into the main window so setup feels continuous.
    createSettingsWindow()
  })

  ipcMain.handle('app:setPlan', (_e, plan: 'free' | 'pro') => {
    store.set('plan', plan === 'pro' ? 'pro' : 'free')
  })

  ipcMain.handle('app:setLoginItem', (_e, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled })
    store.set('launchAtLogin', enabled)
  })

  ipcMain.handle('app:getVersion', () => app.getVersion())

  ipcMain.handle('account:signUp', async (_e, { email, password }: { email: string; password: string }) => {
    try {
      const data = await apiPost('/auth/signup', { email, password })
      saveAccount(data, email)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Sign up failed.' }
    }
  })

  ipcMain.handle('account:login', async (_e, { email, password }: { email: string; password: string }) => {
    try {
      const data = await apiPost('/auth/login', { email, password })
      saveAccount(data, email)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Login failed.' }
    }
  })

  ipcMain.handle('account:google', async () => {
    try {
      const data = await apiPost('/auth/google/start', {})
      if (typeof data.url !== 'string') {
        return { ok: false, message: 'Google sign-in did not return a sign-in URL.' }
      }
      return await openGoogleSignInWindow(data.url)
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Google sign-in failed.' }
    }
  })

  ipcMain.handle('account:startCheckout', async (_e, { billing }: { billing: 'yearly' | 'monthly' }) => {
    try {
      const data = await apiPost('/billing/checkout', {
        billing,
        customerId: store.get('customerId'),
        email: store.get('accountEmail'),
        successUrl: 'iretina://checkout/success',
        cancelUrl: 'iretina://checkout/cancel'
      })
      if (typeof data.url !== 'string') {
        return { ok: false, message: 'Stripe checkout did not return a checkout URL.' }
      }
      return await createCheckoutWindow(data.url)
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Checkout failed.' }
    }
  })

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
// --- Custom protocol (deep-link) handler ---
// The system browser redirects to iretina://auth/callback#access_token=...
// after a successful Google sign-in. We intercept that here.
if (process.defaultApp) {
  if (process.argv.length >= 2) app.setAsDefaultProtocolClient('iretina', process.execPath, [resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient('iretina')
}

let pendingGoogleResolve: ((result: { ok: boolean; message?: string }) => void) | null = null

function handleDeepLink(url: string) {
  if (!url.startsWith('iretina://auth/callback')) return
  const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? ''
  const params = new URLSearchParams(fragment)
  const token = params.get('access_token')
  const err = params.get('error_description') || params.get('error')
  if (pendingGoogleResolve) {
    if (token) {
      store.set('authToken', token)
      pendingGoogleResolve({ ok: true })
    } else {
      pendingGoogleResolve({ ok: false, message: err ?? 'Google sign-in failed.' })
    }
    pendingGoogleResolve = null
  }
}

// Required for second-instance deep-link handling on Windows.
if (!app.requestSingleInstanceLock()) app.quit()

// macOS: the URL arrives via the open-url event.
app.on('open-url', (_e, url) => handleDeepLink(url))

// Windows / Linux: the URL is passed as a command-line argument to a second instance.
app.on('second-instance', (_e, args) => {
  const url = args.find((a) => a.startsWith('iretina://'))
  if (url) handleDeepLink(url)
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) settingsWindow.restore()
    settingsWindow.focus()
  }
})

app.whenReady().then(() => {
  // Don't show in taskbar - tray-only app
  app.setAppUserModelId('com.iretina.windows')

  // Remove the native menu bar (File / Edit / View / Help).
  Menu.setApplicationMenu(null)

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

  // First run → guided onboarding; afterwards the app lives quietly in the tray.
  if (!store.get('onboardingComplete')) {
    createOnboardingWindow()
  }
})

app.on('window-all-closed', () => {
  // iRetina lives in the tray - closing the settings window must not quit it.
})

app.on('before-quit', () => {
  tray?.destroy()
})
