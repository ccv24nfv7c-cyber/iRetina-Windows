import React from 'react'
import ReactDOM from 'react-dom/client'
import { FluentProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components'
import App from './App'
import { THEME_EVENT } from './theme-events'
import { themeVars, type Scheme } from './theme'

const isPopup = new URLSearchParams(window.location.search).get('popup') === '1'
type ThemePref = 'system' | 'light' | 'dark'

function useScheme(): Scheme {
  const [pref, setPref] = React.useState<ThemePref>('system')
  const [system, setSystem] = React.useState<Scheme>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )

  React.useEffect(() => {
    let alive = true
    const read = () =>
      window.iretina.prefs
        .get('theme')
        .then((t) => {
          if (alive && (t === 'system' || t === 'light' || t === 'dark')) setPref(t)
        })
        .catch(() => {})
    read()

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystem = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onSystem)

    const onEvt = (e: Event) => {
      const v = (e as CustomEvent).detail
      if (v === 'system' || v === 'light' || v === 'dark') setPref(v)
    }
    window.addEventListener(THEME_EVENT, onEvt)
    return () => {
      alive = false
      mq.removeEventListener('change', onSystem)
      window.removeEventListener(THEME_EVENT, onEvt)
    }
  }, [])

  return pref === 'system' ? system : pref
}

function Root() {
  const scheme = useScheme()

  React.useEffect(() => {
    document.documentElement.style.colorScheme = scheme
    const vars = themeVars(scheme)
    for (const k of Object.keys(vars)) document.documentElement.style.setProperty(k, vars[k])
    document.body.style.background = isPopup ? 'transparent' : 'var(--bg)'
  }, [scheme])

  return (
    <FluentProvider
      theme={scheme === 'dark' ? webDarkTheme : webLightTheme}
      style={{ height: '100%', background: 'transparent', colorScheme: scheme }}
    >
      <App isPopup={isPopup} />
    </FluentProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
