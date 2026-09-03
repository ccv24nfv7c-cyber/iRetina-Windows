import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('iretina', {
  prefs: {
    get: (key: string) => ipcRenderer.invoke('prefs:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('prefs:set', key, value),
    getAll: () => ipcRenderer.invoke('prefs:getAll')
  },
  engine: {
    getState: () => ipcRenderer.invoke('engine:getState'),
    triggerNow: () => ipcRenderer.invoke('engine:triggerNow'),
    skipBreak: () => ipcRenderer.invoke('engine:skipBreak'),
    snoozeBreak: (minutes: number) => ipcRenderer.invoke('engine:snoozeBreak', minutes),
    pauseTimer: (reason: string) => ipcRenderer.invoke('engine:pauseTimer', reason),
    resumeTimer: () => ipcRenderer.invoke('engine:resumeTimer'),
    activateDND: (hours: number) => ipcRenderer.invoke('engine:activateDND', hours),
    deactivateDND: () => ipcRenderer.invoke('engine:deactivateDND'),
    onStateChanged: (cb: (state: unknown) => void) =>
      ipcRenderer.on('engine:stateChanged', (_e, state) => cb(state))
  },
  app: {
    openSettings: () => ipcRenderer.invoke('app:openSettings'),
    closePopup: () => ipcRenderer.invoke('app:closePopup'),
    quit: () => ipcRenderer.invoke('app:quit'),
    setLoginItem: (enabled: boolean) => ipcRenderer.invoke('app:setLoginItem', enabled),
    getVersion: () => ipcRenderer.invoke('app:getVersion')
  }
})
