import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, powerMonitor, screen, shell, net } from 'electron'
import { existsSync } from 'fs'
import { createServer } from 'http'
import type { AddressInfo } from 'net'
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
  // net.fetch uses Chromium's network stack (respects system proxy, Windows CA
  // store, and works in packaged apps) — unlike Node's built-in fetch (undici)
  // which can fail with "fetch failed" in installed Electron apps on Windows.
  const res = await net.fetch(`${requireApiBase()}${path}`, {
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
    let close: (() => void) | null = null
    try {
      const { port, tokenPromise, close: closeServer } = await startCallbackServer()
      close = closeServer
      const redirectTo = `http://127.0.0.1:${port}/callback`
      const data = await apiPost('/auth/google/start', { redirectTo })
      if (typeof data.url !== 'string') {
        closeServer()
        return { ok: false, message: 'Google sign-in did not return a sign-in URL.' }
      }
      // Open the system browser — Google blocks OAuth in embedded webviews.
      // The browser will show "You can close this tab" after sign-in, and the
      // app receives the token silently via the local HTTP server.
      await shell.openExternal(data.url)
      const token = await Promise.race([
        tokenPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Google sign-in timed out. Please try again.')), 120_000)
        )
      ])
      store.set('authToken', token)
      // Bring app to front
      const win = onboardingWindow ?? settingsWindow
      if (win && !win.isDestroyed()) {
        if (win.isMinimized()) win.restore()
        win.show()
        win.focus()
        if (process.platform === 'darwin') app.focus({ steal: true })
      }
      return { ok: true }
    } catch (err) {
      close?.()
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

// --- Localhost OAuth callback server ---
// Opens a temporary HTTP server on a random local port. After Google sign-in
// the browser lands on /callback; a tiny JS snippet reads the access_token from
// the URL fragment and POSTs it to /token on the same server. This is the
// standard desktop OAuth approach (used by VS Code, GitHub CLI) — it is
// explicitly Google-approved and requires no protocol registration.
const CALLBACK_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>iRetina</title>
<style>body{font-family:-apple-system,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9f9f9;}</style>
</head><body>
<div style="text-align:center;max-width:360px">
  <h2 style="color:#0078d4;margin-bottom:8px">You're signed in!</h2>
  <p style="color:#555">You can close this tab and return to iRetina.</p>
</div>
<script>
var p=new URLSearchParams(location.hash.slice(1)||location.search.slice(1));
fetch('/token',{method:'POST',headers:{'content-type':'application/json'},
body:JSON.stringify({token:p.get('access_token'),error:p.get('error_description')||p.get('error')})}).catch(function(){});
</script></body></html>`

function startCallbackServer(): Promise<{
  port: number
  tokenPromise: Promise<string>
  close: () => void
}> {
  return new Promise((resolveServer, rejectServer) => {
    let resolveToken!: (t: string) => void
    let rejectToken!: (e: Error) => void
    const tokenPromise = new Promise<string>((res, rej) => { resolveToken = res; rejectToken = rej })

    const server = createServer((req, res) => {
      const urlPath = req.url?.split('?')[0] ?? ''
      if (urlPath === '/callback') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(CALLBACK_HTML)
      } else if (urlPath === '/token' && req.method === 'POST') {
        let body = ''
        req.on('data', (c: Buffer) => { body += c.toString() })
        req.on('end', () => {
          try {
            const { token, error } = JSON.parse(body) as { token?: string; error?: string }
            if (token) resolveToken(token)
            else rejectToken(new Error(error ?? 'Google sign-in failed.'))
          } catch { rejectToken(new Error('Invalid callback response.')) }
          res.writeHead(204); res.end()
          server.close()
        })
      } else {
        res.writeHead(404); res.end()
      }
    })
    server.on('error', (e) => rejectServer(e))
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolveServer({ port, tokenPromise, close: () => server.close() })
    })
  })
}

// Required so only one instance runs (second-instance event for checkout deep-links).
if (!app.requestSingleInstanceLock()) app.quit()

// Keep checkout deep-link working on Windows via second-instance.
app.on('second-instance', (_e, args) => {
  const url = args.find((a) => a.startsWith('iretina://checkout/'))
  if (url) {
    // Handled in createCheckoutWindow via will-navigate/will-redirect — no-op here.
  }
  const win = onboardingWindow ?? settingsWindow
  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore()
    win.focus()
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
