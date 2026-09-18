import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('overlayBridge', {
  onStart: (
    cb: (data: {
      durationSec: number
      strict: boolean
      soundEnabled: boolean
      isPrimary: boolean
      screenshot: string | null
    }) => void
  ) => ipcRenderer.on('overlay:start', (_e, data) => cb(data)),
  finished: () => ipcRenderer.send('overlay:finished'),
  skip: () => ipcRenderer.send('overlay:skip'),
  activateDND: (hours: number) => ipcRenderer.send('overlay:dnd', hours)
})
