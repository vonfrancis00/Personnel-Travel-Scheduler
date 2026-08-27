import { useCallback, useEffect, useRef, useState } from "react"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Calendar from "./pages/Calendar"
import TravelSchedules from "./pages/TravelSchedules"
import Personnel from "./pages/Personnel"
import Settings from "./pages/Settings"
import Icon from "./components/Icon"
import TravelAssignmentModal from "./components/TravelAssignmentModal"
import SuccessPopup from "./components/SuccessPopup"
import { ui } from "./styles"
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  requestCalendarAccess,
} from "./services/api"
import { loadSettings, saveSettings } from "./services/settings"

const pages = {
  Dashboard,
  Calendar,
  "Travel Schedules": TravelSchedules,
  Personnel,
  Settings,
}

const monthRange = (date = new Date()) => {
  return {
    timeMin: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
    timeMax: new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString(),
  }
}

const monthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`
const eventKey = (event) =>
  `${event.id || event.title}|${event.start instanceof Date ? event.start.getTime() : event.start || ""}`
const mergeEvents = (current, incoming) => [
  ...new Map([...current, ...incoming].map((event) => [eventKey(event), event])).values(),
]
const eventOverlapsRange = (event, range) => {
  const start = event.start instanceof Date ? event.start : new Date(event.start)
  const end = event.end instanceof Date ? event.end : new Date(event.end || event.start)
  return start < new Date(range.timeMax) && end > new Date(range.timeMin)
}
const replaceEventsInRange = (current, incoming, range) =>
  mergeEvents(
    current.filter((event) => !eventOverlapsRange(event, range)),
    incoming,
  )

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [activePage, setActivePage] = useState(() => loadSettings().preferences.defaultPage)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [calendar, setCalendar] = useState({
    events: [],
    connected: false,
    loading: false,
    error: "",
  })
  const [travelModal, setTravelModal] = useState({
    open: false,
    saving: false,
    error: "",
    selectedEvent: null,
  })
  const [successPopup, setSuccessPopup] = useState({ open: false, title: "", message: "" })
  const accessToken = useRef("")
  const autoConnectStarted = useRef(false)
  const refreshInFlight = useRef(null)
  const monthRequests = useRef(new Map())
  const loadedMonths = useRef(new Set())
  const travelPageRetryStarted = useRef(false)
  const sentReminders = useRef(new Set())
  const ActivePage = pages[activePage]
  const navigate = (page) => {
    setActivePage(page)
    setSidebarOpen(false)
  }
  const updateSettings = (nextSettings) => {
    setSettings(nextSettings)
    saveSettings(nextSettings)
  }
  useEffect(() => {
    if (
      !settings.notifications.travelReminders ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    )
      return
    const checkReminders = () => {
      const now = Date.now()
      const lead = settings.notifications.reminderMinutes * 60 * 1000
      calendar.events.forEach((event) => {
        const start =
          event.start instanceof Date ? event.start.getTime() : new Date(event.start).getTime()
        const key = eventKey(event)
        if (start > now && start - now <= lead && !sentReminders.current.has(key)) {
          new Notification(event.title || "Upcoming travel", {
            body: `Starts ${new Date(start).toLocaleString("en-PH")}`,
          })
          sentReminders.current.add(key)
        }
      })
    }
    checkReminders()
    const interval = window.setInterval(checkReminders, 30000)
    return () => window.clearInterval(interval)
  }, [
    calendar.events,
    settings.notifications.reminderMinutes,
    settings.notifications.travelReminders,
  ])
  const refreshCalendar = useCallback(
    (token = accessToken.current, { background = false } = {}) => {
      if (!token) return
      if (refreshInFlight.current) return refreshInFlight.current
      if (!background) setCalendar((state) => ({ ...state, loading: true, error: "" }))
      const currentMonth = new Date()
      const range = monthRange(currentMonth)
      const request = getCalendarEvents(token, range)
        .then((events) => {
          loadedMonths.current.add(monthKey(currentMonth))
          setCalendar((state) => ({
            ...state,
            events: replaceEventsInRange(state.events, events, range),
            connected: true,
            loading: background ? state.loading : false,
            error: "",
            lastSync: new Date(),
          }))
          return events
        })
        .catch((error) => {
          setCalendar((state) => ({
            ...state,
            loading: background ? state.loading : false,
            error: error.message,
          }))
          return []
        })
        .finally(() => {
          refreshInFlight.current = null
        })
      refreshInFlight.current = request
      return request
    },
    [],
  )
  const loadCalendarMonth = useCallback((date, { background = false, force = false } = {}) => {
    const token = accessToken.current
    if (!token) return Promise.resolve([])
    const key = monthKey(date)
    if (!force && loadedMonths.current.has(key)) return Promise.resolve([])
    if (monthRequests.current.has(key)) return monthRequests.current.get(key)

    if (!background) setCalendar((state) => ({ ...state, loading: true, error: "" }))
    const range = monthRange(date)
    const request = getCalendarEvents(token, range)
      .then((events) => {
        loadedMonths.current.add(key)
        setCalendar((state) => ({
          ...state,
          events: replaceEventsInRange(state.events, events, range),
          connected: true,
          loading: background ? state.loading : false,
          error: "",
          lastSync: new Date(),
        }))
        return events
      })
      .catch((error) => {
        if (!background)
          setCalendar((state) => ({ ...state, loading: false, error: error.message }))
        return []
      })
      .finally(() => monthRequests.current.delete(key))
    monthRequests.current.set(key, request)
    return request
  }, [])
  useEffect(() => {
    if (!calendar.connected) return
    let cancelled = false
    const preloadAdjacentMonths = async () => {
      const now = new Date()
      const adjacentMonths = [-1, 1].map(
        (offset) => new Date(now.getFullYear(), now.getMonth() + offset, 1),
      )
      await Promise.all(
        adjacentMonths.map((month) =>
          cancelled ? Promise.resolve([]) : loadCalendarMonth(month, { background: true }),
        ),
      )
    }
    preloadAdjacentMonths()
    return () => {
      cancelled = true
    }
  }, [calendar.connected, loadCalendarMonth])
  useEffect(() => {
    if (!calendar.connected) return

    const syncLoadedMonths = () => {
      if (document.visibilityState === "hidden") return
      const currentKey = monthKey(new Date())
      refreshCalendar(accessToken.current, { background: true })
      loadedMonths.current.forEach((key) => {
        if (key === currentKey) return
        const [year, month] = key.split("-").map(Number)
        loadCalendarMonth(new Date(year, month, 1), { background: true, force: true })
      })
    }
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") syncLoadedMonths()
    }
    const interval = window.setInterval(syncLoadedMonths, 30000)
    window.addEventListener("focus", syncLoadedMonths)
    document.addEventListener("visibilitychange", syncWhenVisible)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", syncLoadedMonths)
      document.removeEventListener("visibilitychange", syncWhenVisible)
    }
  }, [calendar.connected, loadCalendarMonth, refreshCalendar])
  const connectCalendar = async () => {
    setCalendar((state) => ({ ...state, loading: true, error: "" }))
    try {
      accessToken.current = await requestCalendarAccess()
      await refreshCalendar(accessToken.current)
    } catch (error) {
      setCalendar((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }))
    }
  }
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || autoConnectStarted.current) return
    autoConnectStarted.current = true
    accessToken.current = "apps-script"
    refreshCalendar(accessToken.current)
  }, [refreshCalendar])
  useEffect(() => {
    if (activePage !== "Travel Schedules") {
      travelPageRetryStarted.current = false
      return
    }
    if (
      accessToken.current &&
      !calendar.connected &&
      !calendar.loading &&
      !travelPageRetryStarted.current
    ) {
      travelPageRetryStarted.current = true
      refreshCalendar(accessToken.current)
    }
  }, [activePage, calendar.connected, calendar.loading, refreshCalendar])
  const addTravel = async (form) => {
    setTravelModal((state) => ({ ...state, saving: true, error: "" }))
    try {
      const result = await createCalendarEvent(form)
      if (form.eventId) {
        const personnel = form.personnel
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
        setCalendar((state) => ({
          ...state,
          events: state.events.map((event) =>
            event.id === form.eventId && event.start?.toISOString() === form.eventStart
              ? {
                  ...event,
                  personnel,
                  assignmentNotes: form.notes || "",
                  description: form.notes ? `Notes: ${form.notes}` : "",
                }
              : event,
          ),
          lastSync: new Date(),
        }))
      } else {
        await refreshCalendar()
      }
      setTravelModal({ open: false, saving: false, error: "", selectedEvent: null })
      const sentCount = result.email?.sent?.length || 0
      const missingNames = result.email?.missing || []
      const failedEmails = result.email?.failed || []
      const emailMessage = sentCount
        ? ` Itinerary email${sentCount === 1 ? " was" : "s were"} sent to ${sentCount} personnel.`
        : " No itinerary emails were sent."
      const missingMessage = missingNames.length
        ? ` No configured email was available for: ${missingNames.join(", ")}.`
        : ""
      const failedMessage = failedEmails.length
        ? ` Gmail delivery failed for: ${failedEmails.map((item) => item.name).join(", ")}. ${failedEmails[0].error || "Check the Apps Script execution log and Gmail authorization."}`
        : ""
      setSuccessPopup({
        open: true,
        title: "Assignment saved",
        message: `The personnel and notes were updated in Google Calendar.${emailMessage}${missingMessage}${failedMessage}`,
      })
      return true
    } catch (error) {
      setTravelModal((state) => ({
        ...state,
        saving: false,
        error: error.message,
      }))
      return false
    }
  }
  const openTravelModal = (selectedEvent = null) =>
    setTravelModal({ open: true, saving: false, error: "", selectedEvent })
  const removeTravelEvent = async (event) => {
    try {
      await deleteCalendarEvent(event)
      const key = eventKey(event)
      setCalendar((state) => ({
        ...state,
        events: state.events.filter((item) => eventKey(item) !== key),
        error: "",
        lastSync: new Date(),
      }))
      setSuccessPopup({
        open: true,
        title: "Event deleted",
        message: "The event was successfully deleted from Google Calendar.",
      })
      return true
    } catch (error) {
      setCalendar((state) => ({ ...state, error: error.message }))
      return false
    }
  }
  const calendarProps = {
    calendar,
    connectCalendar,
    refreshCalendar,
    loadCalendarMonth,
    openTravelModal,
    removeTravelEvent,
  }
  return (
    <div
      className={`flex min-h-screen min-w-[320px] bg-[#f4f6fa] font-['DM_Sans',sans-serif] text-[#172033] antialiased [&_button]:cursor-pointer ${settings.preferences.reduceMotion ? "reduce-motion" : ""}`}
    >
      <Sidebar
        activePage={activePage}
        setActivePage={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        calendar={calendar}
      />
      <main className="ml-[260px] min-w-0 flex-1 max-[760px]:ml-0">
        <button
          className={`${ui.iconButton} fixed left-3 top-3 z-20 hidden size-10 bg-[#111c34] text-white shadow-[0_6px_18px_#111c3438] max-[760px]:grid`}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <Icon name="menu" />
        </button>
        <div
          className={`mx-auto max-w-[1600px] max-[760px]:px-4 max-[760px]:pb-[23px] max-[760px]:pt-[62px] max-[380px]:px-2.5 ${settings.preferences.compactMode ? "px-5 pb-7 pt-3" : "px-8 pb-[46px] pt-[18px]"}`}
        >
          <ActivePage
            onNavigate={navigate}
            settings={settings}
            updateSettings={updateSettings}
            {...calendarProps}
          />
        </div>
      </main>
      <TravelAssignmentModal
        key={`${travelModal.open}-${travelModal.selectedEvent?.id || "new"}-${travelModal.selectedEvent?.start?.toISOString() || ""}`}
        open={travelModal.open}
        saving={travelModal.saving}
        error={travelModal.error}
        events={calendar.events}
        selectedEvent={travelModal.selectedEvent}
        onClose={() => setTravelModal((state) => ({ ...state, open: false }))}
        onSubmit={addTravel}
      />
      <SuccessPopup
        open={successPopup.open}
        title={successPopup.title}
        message={successPopup.message}
        onClose={() => setSuccessPopup({ open: false, title: "", message: "" })}
      />
    </div>
  )
}
