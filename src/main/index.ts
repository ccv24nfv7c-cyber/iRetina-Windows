import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, powerMonitor, screen, shell, net } from 'electron'
import { existsSync, readFileSync } from 'fs'
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http'
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
  beginOverlayFadeOut,
  onOverlayFinished
} from './break-engine'

let tray: Tray | null = null
let settingsWindow: BrowserWindow | null = null
let trayPopupWindow: BrowserWindow | null = null
let onboardingWindow: BrowserWindow | null = null
let checkoutWindow: BrowserWindow | null = null
let pendingGoogleResolve: ((r: { ok: boolean; message?: string }) => void) | null = null
let googleCallbackServer: Server | null = null
let googleCallbackStarting: Promise<void> | null = null

const GOOGLE_CALLBACK_PORT = 47829

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
  // tray-icon.png has a matching @2x representation so Windows can choose a
  // crisp asset at every taskbar scale instead of upscaling a forced 16 px copy.
  return loadIcon('tray-icon.png', 'icon.png')
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
    width: 900,
    height: 680,
    minWidth: 760,
    minHeight: 560,
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
    width: 760,
    height: 720,
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
  const winWidth = 336
  const winHeight = 408

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

function focusAccountWindow() {
  const win = onboardingWindow ?? settingsWindow
  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }
  if (process.platform === 'darwin') app.focus({ steal: true })
}

function settleGoogleAuth(result: { ok: boolean; message?: string }) {
  const resolveAuth = pendingGoogleResolve
  pendingGoogleResolve = null
  resolveAuth?.(result)
  focusAccountWindow()
}

async function completeGoogleAuth(params: URLSearchParams): Promise<boolean> {
  const token = params.get('access_token')
  const authError = params.get('error_description') || params.get('error')

  if (!token) {
    settleGoogleAuth({ ok: false, message: authError ?? 'Google sign-in did not return a session.' })
    return false
  }

  try {
    // Do not trust arbitrary local requests. Validate the returned Supabase
    // token with the backend before persisting it or advancing onboarding.
    const response = await net.fetch(`${requireApiBase()}/me`, {
      headers: { authorization: `Bearer ${token}` }
    })
    const account = await response.json().catch(() => ({})) as Record<string, unknown>
    if (!response.ok) {
      throw new Error(typeof account.message === 'string' ? account.message : 'Google session validation failed.')
    }
    saveAccount({ ...account, token })
    settleGoogleAuth({ ok: true })
    return true
  } catch (error) {
    settleGoogleAuth({
      ok: false,
      message: error instanceof Error ? error.message : 'Google sign-in failed.'
    })
    return false
  }
}

function authCompletionPage(success: boolean) {
  const heading = success ? 'Signed in successfully' : 'Sign-in could not be completed'
  const message = success
    ? 'You can close this tab —<br>iRetina is ready.'
    : 'Return to iRetina and try Google sign-in again.'
  const icon = success
    ? '<polyline points="20 6 9 17 4 12" />'
    : '<path d="M7 7l10 10M17 7 7 17" />'

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>iRetina</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d1117;color:#f0f2f5;font-family:-apple-system,'Segoe UI Variable','Segoe UI',sans-serif;text-align:center}
.card{padding:48px 32px}.logo{width:96px;height:96px;border-radius:22px;overflow:hidden;margin:0 auto 28px;box-shadow:0 16px 42px rgba(0,120,212,.24),0 0 0 1px rgba(255,255,255,.08)}
.logo img{display:block;width:100%;height:100%;object-fit:cover}.status{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;margin:0 auto 24px;background:rgba(0,120,212,.18);border:1.5px solid rgba(0,120,212,.4)}
.status svg{width:22px;height:22px;fill:none;stroke:#60aaff;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}h1{font-size:24px;margin:0 0 10px;letter-spacing:-.3px}p{margin:0;color:rgba(240,242,245,.55);font-size:15px;line-height:1.6}
</style><script>history.replaceState(null,'','/auth/complete')</script></head><body><main class="card">
<div class="logo"><img src="/logo.png" alt="iRetina logo"></div><div class="status"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg></div>
<h1>${heading}</h1><p>${message}</p></main></body></html>`
}

async function handleGoogleCallbackRequest(request: IncomingMessage, response: ServerResponse) {
  const requestUrl = new URL(request.url ?? '/', `http://127.0.0.1:${GOOGLE_CALLBACK_PORT}`)
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Referrer-Policy', 'no-referrer')

  if (requestUrl.pathname === '/logo.png') {
    response.writeHead(200, { 'Content-Type': 'image/png' })
    response.end(readFileSync(resolve(ASSETS_DIR, 'logo.png')))
    return
  }

  if (requestUrl.pathname === '/auth/callback') {
    const success = await completeGoogleAuth(requestUrl.searchParams)
    response.writeHead(303, { Location: success ? '/auth/complete' : '/auth/error' })
    response.end()
    return
  }

  if (requestUrl.pathname === '/auth/complete' || requestUrl.pathname === '/auth/error') {
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'"
    })
    response.end(authCompletionPage(requestUrl.pathname === '/auth/complete'))
    return
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  response.end('Not found')
}

async function ensureGoogleCallbackServer() {
  if (googleCallbackServer?.listening) return
  if (googleCallbackStarting) return await googleCallbackStarting

  googleCallbackStarting = new Promise<void>((resolveServer, rejectServer) => {
    const server = createServer((request, response) => {
      void handleGoogleCallbackRequest(request, response).catch(() => {
        if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        response.end('Could not finish iRetina sign-in.')
      })
    })
    server.once('error', () => {
      rejectServer(new Error('Could not start the local Google sign-in callback. Restart iRetina and try again.'))
    })
    server.listen(GOOGLE_CALLBACK_PORT, '127.0.0.1', () => {
      googleCallbackServer = server
      resolveServer()
    })
  })

  try {
    await googleCallbackStarting
  } finally {
    googleCallbackStarting = null
  }
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
    // Start the break timer now that onboarding is done.
    scheduleNextBreak()
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
      await ensureGoogleCallbackServer()
      const data = await apiPost('/auth/google/start', {})
      if (typeof data.url !== 'string') {
        return { ok: false, message: 'Google sign-in did not return a sign-in URL.' }
      }
      // Install the resolver BEFORE opening the browser. A user who is already
      // signed into Google can complete the redirect almost instantly; the old
      // ordering could lose that deep link and leave onboarding waiting forever.
      const authResult = new Promise<{ ok: boolean; message?: string }>((resolve) => {
        pendingGoogleResolve = resolve
        setTimeout(() => {
          if (pendingGoogleResolve === resolve) {
            pendingGoogleResolve = null
            resolve({ ok: false, message: 'Google sign-in timed out. Please try again.' })
          }
        }, 120_000)
      })
      // Google OAuth belongs in the system browser. The HTTPS bridge forwards
      // the result to the loopback listener above, which works in unpackaged
      // Electron on macOS as well as the installed Windows application.
      const oauthUrl = new URL(data.url)
      oauthUrl.searchParams.set('redirect_to', 'https://iretina.app/auth/callback.html')
      oauthUrl.searchParams.set('prompt', 'select_account')
      await shell.openExternal(oauthUrl.toString())
      return await authResult
    } catch (err) {
      pendingGoogleResolve = null
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
  ipcMain.on('overlay:closing', () => beginOverlayFadeOut())
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

// --- iretina:// deep link handler ---
// Supabase returns the completed Google session to our registered desktop
// protocol. The OS routes iretina:// to this app, where we persist the token,
// resolve the pending sign-in, and bring onboarding back to the foreground.
if (process.defaultApp) {
  if (process.argv.length >= 2) app.setAsDefaultProtocolClient('iretina', process.execPath, [resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient('iretina')
}

function handleDeepLink(url: string) {
  if (url.startsWith('iretina://auth/callback')) {
    const frag = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? ''
    void completeGoogleAuth(new URLSearchParams(frag))
  }
}

// macOS
app.on('open-url', (_e, url) => handleDeepLink(url))

// Required so only one instance runs.
if (!app.requestSingleInstanceLock()) app.quit()

// Windows / Linux: deep link URL arrives as argv in a second instance.
app.on('second-instance', (_e, args) => {
  const url = args.find((a) => a.startsWith('iretina://'))
  if (url) handleDeepLink(url)
  const win = onboardingWindow ?? settingsWindow
  if (win && !win.isDestroyed()) { if (win.isMinimized()) win.restore(); win.focus() }
})

app.whenReady().then(() => {
  // Don't show in taskbar - tray-only app
  app.setAppUserModelId('com.iretina.windows')

  // Remove the native menu bar (File / Edit / View / Help).
  Menu.setApplicationMenu(null)

  // Fresh-install detection: if installedVersion was never written, the
  // AppData config is either brand-new or was left over from a stale test run.
  // Reset onboarding so the user always sees it on a clean install.
  // Updates (where installedVersion is already set) preserve all settings.
  if (!store.get('installedVersion')) {
    store.set('onboardingComplete', false)
  }
  store.set('installedVersion', app.getVersion())

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

  // Only start the break timer once onboarding is fully complete (plan chosen,
  // account created). New users go through onboarding first.
  if (store.get('onboardingComplete')) {
    scheduleNextBreak()
  }

  setStateChangeCallback(() => pushStateToRenderer())

  // First run → guided onboarding; afterwards the app lives quietly in the tray.
  if (!store.get('onboardingComplete')) {
    createOnboardingWindow()
  }

  // Local visual QA: opt into an immediate break without adding a production
  // menu item or changing a user's saved timer.
  if (!app.isPackaged && process.env['IRETINA_PREVIEW_BREAK'] === '1') {
    setTimeout(() => triggerNow(), 700)
  }
})

app.on('window-all-closed', () => {
  // iRetina lives in the tray - closing the settings window must not quit it.
})

app.on('before-quit', () => {
  googleCallbackServer?.close()
  tray?.destroy()
})
