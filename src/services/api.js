import { resolvePersonnelName } from "../data/personnel"

const GOOGLE_IDENTITY_URL = "https://accounts.google.com/gsi/client"
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
let tokenClient

function loadGoogleIdentity() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_IDENTITY_URL}"]`)
    if (existing) {
      existing.addEventListener("load", resolve, { once: true })
      existing.addEventListener("error", reject, { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = GOOGLE_IDENTITY_URL
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = () => reject(new Error("Could not load Google Identity Services."))
    document.head.appendChild(script)
  })
}

export async function requestCalendarAccess() {
  if (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL) return "apps-script"
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId)
    throw new Error(
      "Google Calendar is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env.local file.",
    )
  await loadGoogleIdentity()
  return new Promise((resolve, reject) => {
    if (!tokenClient)
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: CALENDAR_SCOPE,
        callback: () => {},
        error_callback: (error) =>
          reject(new Error(error?.message || "Google authorization was cancelled.")),
      })
    tokenClient.callback = (response) => {
      if (response.error) reject(new Error(response.error_description || response.error))
      else resolve(response.access_token)
    }
    tokenClient.requestAccessToken({ prompt: "consent" })
  })
}

export async function getCalendarEvents(accessToken, options = {}) {
  const appsScriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL
  if (appsScriptUrl) return getAppsScriptEvents(appsScriptUrl, options)
  const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID || "primary"
  const params = new URLSearchParams({
    timeMin: options.timeMin || new Date().toISOString(),
    maxResults: String(options.maxResults || 100),
    singleEvents: "true",
    orderBy: "startTime",
    showDeleted: "false",
  })
  if (options.timeMax) params.set("timeMax", options.timeMax)
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(
      payload.error?.message || `Google Calendar request failed (${response.status}).`,
    )
  }
  const payload = await response.json()
  const colorContext = await getGoogleColorContext(accessToken, calendarId)
  return (payload.items || []).map((event) => normalizeCalendarEvent(event, colorContext))
}

async function getGoogleColorContext(accessToken, calendarId) {
  const headers = { Authorization: `Bearer ${accessToken}` }
  const [colorsResponse, calendarResponse] = await Promise.all([
    fetch("https://www.googleapis.com/calendar/v3/colors", { headers }),
    fetch(
      `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(calendarId)}`,
      { headers },
    ),
  ])
  const colors = colorsResponse.ok ? await colorsResponse.json() : {}
  const calendar = calendarResponse.ok ? await calendarResponse.json() : {}
  return {
    eventColors: colors.event || {},
    calendarColor:
      calendar.backgroundColor ||
      (calendar.colorId && colors.calendar?.[calendar.colorId]?.background),
    calendarForegroundColor: calendar.foregroundColor || "#ffffff",
  }
}

export async function createCalendarEvent(event) {
  const endpoint = getAppsScriptEndpoint()
  if (!endpoint) throw new Error("Creating events requires the Apps Script integration.")
  const body = new URLSearchParams({
    code: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_ACCESS_CODE || "",
    action: event.eventId ? "assign" : "create",
    eventId: event.eventId || "",
    eventStart: event.eventStart || "",
    personnel: event.personnel,
    notes: event.notes || "",
  })
  if (!event.eventId) {
    body.set("title", event.title || "Official Travel")
    body.set("start", new Date(event.start).toISOString())
    body.set("end", new Date(event.end).toISOString())
    body.set("location", event.location || "")
    body.set("purpose", event.purpose || "")
  }
  const response = await fetch(endpoint, { method: "POST", body })
  if (!response.ok) throw new Error(`Apps Script request failed (${response.status}).`)
  const payload = await readJsonResponse(response)
  if (!payload.ok) throw new Error(payload.error || "The travel schedule could not be created.")
  return payload
}

export async function deleteCalendarEvent(event) {
  const endpoint = getAppsScriptEndpoint()
  if (!endpoint) throw new Error("Deleting events requires the Apps Script integration.")
  const body = new URLSearchParams({
    code: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_ACCESS_CODE || "",
    action: "delete",
    eventId: event.id || "",
    eventStart: event.start instanceof Date ? event.start.toISOString() : event.start || "",
  })
  const response = await fetch(endpoint, { method: "POST", body })
  if (!response.ok) throw new Error(`Apps Script request failed (${response.status}).`)
  const payload = await readJsonResponse(response)
  if (!payload.ok) throw new Error(payload.error || "The calendar event could not be deleted.")
  return payload
}

async function getAppsScriptEvents(endpoint, options = {}) {
  const requestEndpoint = import.meta.env.DEV ? getAppsScriptEndpoint() : endpoint
  const url = new URL(requestEndpoint, window.location.origin)
  const accessCode = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_ACCESS_CODE
  if (accessCode) url.searchParams.set("code", accessCode)
  url.searchParams.set("action", "events")
  if (options.timeMin) url.searchParams.set("timeMin", options.timeMin)
  if (options.timeMax) url.searchParams.set("timeMax", options.timeMax)
  const controller = new AbortController()
  // Apps Script cold starts can exceed 20 seconds even when Calendar succeeds.
  // Keep this below the local proxy's 85-second limit so failures still settle.
  const timeout = window.setTimeout(() => controller.abort(), 75000)
  let response
  try {
    response = await fetch(url, { signal: controller.signal })
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Google Calendar took too long to respond. Select Sync now to try again.", {
        cause: error,
      })
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
  if (!response.ok) {
    throw new Error(`Apps Script request failed (${response.status}).`)
  }
  const payload = await readJsonResponse(response)
  if (payload.ok === false)
    throw new Error(payload.error || "Apps Script could not load the calendar.")
  return (payload.events || []).map(normalizeCalendarEvent)
}

function getAppsScriptEndpoint() {
  if (import.meta.env.DEV) return "/calendar-api"
  return import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL
}

async function readJsonResponse(response) {
  const body = await response.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new Error(
      body.trimStart().startsWith("<")
        ? "Google Calendar returned a webpage instead of event data. Verify the Apps Script deployment is accessible to Anyone."
        : "Google Calendar returned an invalid response.",
    )
  }
}

function normalizeCalendarEvent(event, colorContext = {}) {
  const isAllDay = Boolean(event.start?.date)

  const startValue = event.start?.dateTime || event.start?.date
  const endValue = event.end?.dateTime || event.end?.date

  let start = null
  let end = null

  /*
   * Google Calendar all-day events use DATE values.
   *
   * Example:
   *
   * start: 2026-08-07
   * end:   2026-08-08
   *
   * This means:
   * August 7 only.
   *
   * The end date is EXCLUSIVE.
   */
  if (isAllDay) {
    if (startValue) {
      start = parseCalendarDate(startValue)
    }

    if (endValue) {
      /*
       * Convert Google's exclusive end date
       * into the actual final calendar date.
       *
       * 2026-08-08 -> 2026-08-07
       */
      end = parseCalendarDate(endValue)
      end.setDate(end.getDate() - 1)

      /*
       * Put the end near the end of that day.
       * This makes the event occupy only that
       * calendar date.
       */
      end.setHours(23, 59, 59, 999)
    }
  } else {
    /*
     * Timed events use dateTime values.
     */
    start = startValue ? new Date(startValue) : null
    end = endValue ? new Date(endValue) : null
  }

  const assignmentNotes = event.assignmentNotes || extractAssignmentNotes(event.description || "")
  const assignedPersonnel = normalizePersonnel(
    event.personnel || extractPersonnel(event.description || ""),
  )
  const googleEventColor = event.color || colorContext.eventColors?.[event.colorId]
  const color =
    googleEventColor ||
    (colorContext.calendarColor
      ? {
          background: colorContext.calendarColor,
          foreground: colorContext.calendarForegroundColor,
        }
      : null)

  return {
    id: event.id,

    title: event.summary || "Untitled event",

    start,

    end,

    allDay: isAllDay,

    location: event.location || "Location not specified",

    description: assignmentNotes ? `Notes: ${assignmentNotes}` : "",

    assignmentNotes,

    personnel: assignedPersonnel.length
      ? assignedPersonnel
      : (event.guests || []).map((guest) => guest.displayName || guest.email),

    guests: event.guests || [],

    status: event.status === "confirmed" ? "Confirmed" : "Pending",

    htmlLink: event.htmlLink,

    color,
  }
}
function parseCalendarDate(value) {
  if (!value) return null

  /*
   * Google Calendar returns all-day dates as:
   *
   * YYYY-MM-DD
   *
   * We intentionally construct the date using
   * the local calendar date instead of:
   *
   * new Date("YYYY-MM-DD")
   *
   * which can introduce timezone shifts.
   */
  const [year, month, day] = value.split("-").map(Number)

  return new Date(year, month - 1, day)
}

function extractAssignmentNotes(description) {
  const match = description.match(/(?:^|\n)Notes:\s*([^\n]*)/i)
  return match ? match[1].trim() : ""
}

function normalizePersonnel(value) {
  const names = Array.isArray(value) ? value : String(value || "").split(",")
  return names.map(resolvePersonnelName).filter(Boolean)
}

function extractPersonnel(description) {
  const personnelMatch = description.match(/(?:^|\n)Personnel:\s*([^\n]*)/i)
  if (personnelMatch) return personnelMatch[1]

  const withLines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^WITH\s+/i.test(line))
  const assignmentLine = withLines.at(-1)?.replace(/^WITH\s+/i, "")
  return assignmentLine ? assignmentLine.split(/\s+AND\s+/i).join(", ") : ""
}
