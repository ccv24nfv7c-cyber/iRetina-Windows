import Store from 'electron-store'

interface Schema {
  intervalMinutes: number
  breakDurationSec: number
  theme: 'system' | 'light' | 'dark'
  headsUpEnabled: boolean
  strictBreakModeEnabled: boolean
  smartPauseEnabled: boolean
  soundEnabled: boolean
  launchAtLogin: boolean
  dndEndTime: number | null
  dndDefaultDurationHours: number
  breaksCompleted: number
  analyticsEnabled: boolean
  onboardingComplete: boolean
  plan: 'free' | 'pro'
  referralSource: string
  accountEmail: string
}

const defaults: Schema = {
  intervalMinutes: 20,
  breakDurationSec: 30,
  theme: 'light',
  headsUpEnabled: true,
  strictBreakModeEnabled: false,
  smartPauseEnabled: true,
  soundEnabled: true,
  launchAtLogin: false,
  dndEndTime: null,
  dndDefaultDurationHours: 2.5,
  breaksCompleted: 0,
  analyticsEnabled: false,
  onboardingComplete: false,
  plan: 'free',
  referralSource: '',
  accountEmail: ''
}

export const store = new Store<Schema>({ defaults })
