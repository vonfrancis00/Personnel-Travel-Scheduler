export const SETTINGS_KEY = "personnel-travel-settings"

export const defaultSettings = {
  notifications: { travelReminders: true, syncAlerts: true, reminderMinutes: 30 },
  preferences: { defaultPage: "Dashboard", compactMode: false, reduceMotion: false },
}

export const loadSettings = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}")
    return {
      notifications: { ...defaultSettings.notifications, ...saved.notifications },
      preferences: { ...defaultSettings.preferences, ...saved.preferences },
    }
  } catch {
    return defaultSettings
  }
}

export const saveSettings = (settings) => {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
