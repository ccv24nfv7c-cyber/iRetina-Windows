import React from 'react'
import ReactDOM from 'react-dom/client'
import { FluentProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components'
import App from './App'

const isPopup = new URLSearchParams(window.location.search).get('popup') === '1'

function Root() {
  const [scheme, setScheme] = React.useState<'dark' | 'light'>('dark')

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setScheme(mq.matches ? 'dark' : 'light')
    const handler = (e: MediaQueryListEvent) => setScheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <FluentProvider theme={scheme === 'dark' ? webDarkTheme : webLightTheme} style={{ height: '100%', background: 'transparent' }}>
      <App isPopup={isPopup} />
    </FluentProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
