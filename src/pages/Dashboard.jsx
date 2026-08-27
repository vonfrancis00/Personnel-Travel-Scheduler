import { useEffect, useMemo, useState } from "react"
import Icon from "../components/Icon"
import { ui } from "../styles"

const eventTime = (event) => {
  if (event.allDay) return "All day"
  const start = event.start?.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  const end = event.end?.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  return [start, end].filter(Boolean).join(" – ")
}

const eventTiming = (event, now) => {
  if (event.allDay || (event.start <= now && (!event.end || event.end >= now))) {
    return { label: "Happening now", className: "bg-[#e7f8f1] text-[#15996a]" }
  }
  if (event.start > now) {
    return { label: "Later today", className: "bg-[#eaf1ff] text-[#3267e3]" }
  }
  return { label: "Ended", className: "bg-[#eef0f3] text-[#7b8493]" }
}

const webLink = (value) => {
  const location = String(value || "").trim()
  if (!/^https?:\/\//i.test(location)) return ""
  try {
    return new URL(location).href
  } catch {
    return ""
  }
}

export default function Dashboard({
  calendar,
  openTravelModal,
  refreshCalendar,
  onNavigate,
}) {
  const [now, setNow] = useState(() => new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [tripListMode, setTripListMode] = useState(null)
  const selectedEventLink = webLink(selectedEvent?.location)
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])
  useEffect(() => {
    if (!selectedEvent && !tripListMode) return undefined
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return
      if (selectedEvent) setSelectedEvent(null)
      else setTripListMode(null)
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [selectedEvent, tripListMode])

  const monthlyEvents = useMemo(() => {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return calendar.events
      .filter(
        (event) => event.start < monthEnd && (event.end || event.start) >= monthStart,
      )
      .sort((first, second) => first.start - second.start)
  }, [calendar.events, now])

  const upcomingMonthlyEvents = useMemo(() => {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return monthlyEvents.filter((event) => (event.end || event.start) >= startOfToday)
  }, [monthlyEvents, now])

  const accomplishedMonthlyEvents = useMemo(() => {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return monthlyEvents.filter((event) => (event.end || event.start) < startOfToday)
  }, [monthlyEvents, now])

  const todaysEvents = useMemo(() => {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return calendar.events
      .filter(
        (event) =>
          event.start &&
          event.start < startOfTomorrow &&
          (event.end || event.start) >= startOfToday,
      )
      .sort((first, second) => first.start - second.start)
  }, [calendar.events, now])

  const dashboardStats = useMemo(() => {
    const futureEvents = calendar.events.filter((event) => (event.end || event.start) >= now)
    const thisMonth = monthlyEvents
    const personnel = new Set(thisMonth.flatMap((event) => event.personnel || []))
    return {
      thisMonth: thisMonth.length,
      upcoming: upcomingMonthlyEvents.length,
      personnel: personnel.size,
      accomplished: accomplishedMonthlyEvents.length,
      nextEvent: [...futureEvents].sort((first, second) => first.start - second.start)[0],
    }
  }, [accomplishedMonthlyEvents, calendar.events, monthlyEvents, now, upcomingMonthlyEvents])

  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening"
  const statCards = [
    { label: "Trips this month", value: dashboardStats.thisMonth, icon: "calendar", tone: "blue", onClick: () => setTripListMode("month") },
    { label: "Upcoming trips", value: dashboardStats.upcoming, icon: "plane", tone: "violet", onClick: () => setTripListMode("upcoming") },
    { label: "Active personnel", value: dashboardStats.personnel, icon: "users", tone: "emerald", onClick: () => onNavigate("Personnel") },
    {
      label: "Accomplished trips this month",
      value: dashboardStats.accomplished,
      icon: "trend",
      tone: "amber",
      onClick: () => setTripListMode("accomplished"),
    },
  ]

  const tripListEvents =
    tripListMode === "upcoming"
      ? upcomingMonthlyEvents
      : tripListMode === "accomplished"
        ? accomplishedMonthlyEvents
        : monthlyEvents
  const tripListHeading =
    tripListMode === "upcoming"
      ? "Today and upcoming trips"
      : tripListMode === "accomplished"
        ? "Accomplished trips"
        : "Trips"

  return (
    <div className="dashboard space-y-5">
      <section className="relative isolate overflow-hidden rounded-[24px] bg-[#101d3a] px-7 py-7 text-white shadow-[0_18px_45px_#172b5d22] max-[640px]:px-5 max-[640px]:py-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_20%,#3b6ee080,transparent_28%),radial-gradient(circle_at_15%_120%,#6555d660,transparent_32%)]" />
        <div className="absolute -right-16 -top-24 -z-10 size-72 rounded-full border-[42px] border-white/[.035]" />
        <div className="flex items-start justify-between gap-6 max-[760px]:flex-col">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.15em] text-[#c5d6ff] backdrop-blur-sm">
              <i
                className={`size-1.5 rounded-full ${calendar.connected ? "bg-[#54d9aa] shadow-[0_0_0_4px_#54d9aa20]" : "bg-[#9ba5b7]"}`}
              />
              {calendar.loading
                ? "Synchronizing calendar"
                : calendar.connected
                  ? "Calendar live"
                  : "Calendar offline"}
            </div>
            <p className="m-0 text-xs font-medium text-[#aab9d8]">{greeting}, OCDRA III Staff</p>
            <h1 className="mb-2 mt-1.5 max-w-[620px] font-[Manrope] text-[30px] font-extrabold leading-tight tracking-[-.04em] max-[520px]:text-[25px]">
              Keep every official trip moving.
            </h1>
            <p className="m-0 max-w-[580px] text-[12px] leading-relaxed text-[#aebbd4]">
              A real-time view of personnel assignments, schedules, and travel coverage.
            </p>
          </div>
          <button
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[11px] border border-white/15 bg-white px-4 py-3 text-[11px] font-bold text-[#18305f] shadow-[0_10px_28px_#07112745] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={openTravelModal}
            disabled={!calendar.connected}
          >
            <Icon name="plus" size={17} /> Assign personnel
          </button>
        </div>
        <div className="mt-7 flex items-center gap-4 border-t border-white/10 pt-4 text-[12px] text-[#91a2c1] max-[520px]:flex-wrap">
          <span className="font-semibold text-white">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
          <span className="h-3 w-px bg-white/15" />
          <span>{calendar.events.length} events synchronized</span>
          {calendar.lastSync && (
            <span>
              Updated{" "}
              {calendar.lastSync.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </section>
      {calendar.error && (
        <div className={ui.error}>
          <span>{calendar.error}</span>
          <button
            className={`${ui.textButton} whitespace-nowrap text-[#a74343]`}
            onClick={() => refreshCalendar()}
          >
            Try again
          </button>
        </div>
      )}
      <section
        className="grid grid-cols-4 gap-3 max-[1080px]:grid-cols-2 max-[520px]:grid-cols-1"
        aria-label="Travel overview"
      >
        {statCards.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={stat.onClick}
            disabled={!stat.onClick}
            aria-haspopup={stat.onClick ? "dialog" : undefined}
            className="group rounded-[16px] border border-[#e5eaf2] bg-white p-4 text-left shadow-[0_4px_16px_#243b6408] transition enabled:cursor-pointer enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_10px_28px_#243b6412] disabled:cursor-default"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`grid size-10 place-items-center rounded-[11px] ${
                  stat.tone === "blue"
                    ? "bg-[#eaf1ff] text-[#3267e3]"
                    : stat.tone === "violet"
                      ? "bg-[#f0ecff] text-[#7358d7]"
                      : stat.tone === "emerald"
                        ? "bg-[#e5f8f1] text-[#15996a]"
                        : "bg-[#fff3df] text-[#c57b1d]"
                }`}
              >
                <Icon name={stat.icon} size={18} />
              </span>
              <span className="text-[#c1c8d4] transition group-hover:text-[#6580bd]">
                <Icon name="trend" size={15} />
              </span>
            </div>
            <strong className="mt-4 block font-[Manrope] text-[24px] font-extrabold tracking-[-.04em] text-[#17233b]">
              {stat.value}
            </strong>
            <span className="mt-1 block text-[10px] font-medium text-[#7a8495]">{stat.label}</span>
          </button>
        ))}
      </section>
      {tripListMode && (
        <div
          className={ui.backdrop}
          onMouseDown={(event) => event.target === event.currentTarget && setTripListMode(null)}
        >
          <section
            className="max-h-[90vh] w-[min(760px,100%)] overflow-hidden rounded-[22px] bg-white shadow-[0_28px_90px_#07112770]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="monthly-trips-title"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#e8edf5] bg-gradient-to-r from-[#f4f7ff] to-white px-6 py-5">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#6680b8]">
                  {tripListMode === "upcoming"
                    ? "Upcoming schedule"
                    : tripListMode === "accomplished"
                      ? "Past schedule"
                      : "Monthly schedule"}
                </span>
                <h2 id="monthly-trips-title" className="mb-0 mt-1 font-[Manrope] text-xl font-extrabold text-[#17233b]">
                  {tripListHeading} in {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h2>
                <p className="mb-0 mt-1 text-[10px] text-[#7a8495]">
                  {tripListEvents.length} event{tripListEvents.length === 1 ? "" : "s"} scheduled
                </p>
              </div>
              <button className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf0fb] text-[#536681] transition hover:bg-[#dfe8f8]" onClick={() => setTripListMode(null)} aria-label="Close trip list">
                <Icon name="close" size={17} />
              </button>
            </header>
            <div className="max-h-[calc(90vh-112px)] overflow-y-auto p-4 sm:p-5">
              {tripListEvents.length ? (
                <div className="space-y-3">
                  {tripListEvents.map((event, index) => (
                    <button
                      key={`${event.id}-${event.start?.toISOString()}-${index}`}
                      type="button"
                      className="grid w-full grid-cols-[54px_1fr_auto] gap-4 rounded-[14px] border border-[#e6ebf3] bg-[#fbfcff] p-4 text-left transition hover:border-[#cdd9ee] hover:bg-white hover:shadow-[0_6px_18px_#26395c0d] max-[600px]:grid-cols-[48px_1fr]"
                      onClick={() => {
                        setTripListMode(null)
                        setSelectedEvent(event)
                      }}
                    >
                      <span className="grid h-14 place-items-center rounded-[11px] bg-[#eaf1ff] text-center text-[#3267e3]">
                        <span>
                          <strong className="block font-[Manrope] text-xl leading-none">{event.start?.getDate()}</strong>
                          <span className="mt-1 block text-[8px] font-bold uppercase">{event.start?.toLocaleDateString("en-US", { weekday: "short" })}</span>
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="font-[Manrope] text-[13px] text-[#202a3d]">{event.title}</strong>
                          <span className="rounded-full bg-[#eef2f8] px-2 py-0.5 text-[8px] font-bold text-[#68758a]">{event.status || "Calendar event"}</span>
                        </span>
                        <span className="mt-1.5 block text-[10px] text-[#737d8e]">{eventTime(event)} · {webLink(event.location) ? "Online meeting" : event.location || "Location not specified"}</span>
                        <span className="mt-1.5 block text-[10px] font-medium text-[#4e5c72]">{event.personnel?.length ? event.personnel.join(", ") : "No personnel assigned"}</span>
                        {event.description && <span className="mt-2 line-clamp-2 block whitespace-pre-wrap text-[10px] leading-relaxed text-[#7a8495]">{event.description.replace(/^Notes:\s*/i, "")}</span>}
                      </span>
                      <span className="self-center text-[#5272bd] max-[600px]:hidden"><Icon name="arrow" size={16} /></span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                  <span className="grid size-11 place-items-center rounded-full bg-[#f1f5fb] text-[#7c8ba3]"><Icon name="calendar" size={19} /></span>
                  <strong className="mt-4 font-[Manrope] text-sm text-[#273247]">
                    {tripListMode === "upcoming"
                      ? "No upcoming trips this month"
                      : tripListMode === "accomplished"
                        ? "No accomplished trips this month"
                        : "No trips this month"}
                  </strong>
                  <span className="mt-1 text-[10px] text-[#7a8495]">Calendar events for this month will appear here.</span>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      {dashboardStats.nextEvent && (
        <button
          className="group flex w-full items-center gap-4 overflow-hidden rounded-[15px] border border-[#dfe7f7] bg-gradient-to-r from-[#f4f7ff] to-white p-4 text-left shadow-[0_4px_18px_#233b6808] transition hover:border-[#c8d6f1] hover:shadow-[0_8px_24px_#233b6810] max-[520px]:items-start"
          onClick={() => setSelectedEvent(dashboardStats.nextEvent)}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-gradient-to-br from-[#3267e3] to-[#6257d5] text-white shadow-[0_7px_16px_#3267e32e]">
            <Icon name="plane" size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#6680b8]">
              Current Event
            </span>
            <strong className="mt-1 block truncate font-[Manrope] text-[15px] text-[#202c43]">
              {dashboardStats.nextEvent.title}
            </strong>
            <span className="mt-1 block text-[12px] text-[#788397]">
              {dashboardStats.nextEvent.start.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}{" "}
              · {eventTime(dashboardStats.nextEvent)} ·{" "}
              {dashboardStats.nextEvent.location || "Location not specified"}
            </span>
          </span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#446bd0] shadow-sm transition group-hover:translate-x-1 max-[520px]:hidden">
            <Icon name="arrow" size={15} />
          </span>
        </button>
      )}
      <section className={`${ui.panel} overflow-hidden`} aria-labelledby="happening-now-title">
        <div className="flex items-center justify-between gap-4 border-b border-[#edf0f5] px-5 py-4">
          <div>
            <h2
              id="happening-now-title"
              className="m-0 font-[Manrope] text-base font-extrabold text-[#172033]"
            >
              Happening Now
            </h2>
            <p className="mb-0 mt-1 text-[11px] text-[#7a8495]">
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="rounded-full bg-[#f1f5ff] px-3 py-1.5 text-[10px] font-bold text-[#4773dc]">
            {todaysEvents.length} event{todaysEvents.length === 1 ? "" : "s"} today
          </span>
        </div>
        {todaysEvents.length ? (
          <div className="grid grid-cols-2 gap-3 p-4 max-[980px]:grid-cols-1">
            {todaysEvents.map((event, index) => {
              const timing = eventTiming(event, now)
              return (
                <button
                  key={`${event.id}-${event.start?.toISOString()}-${index}`}
                  className="flex min-w-0 items-start gap-3 rounded-[11px] border border-[#e8ecf3] bg-[#fbfcfe] p-4 text-left transition hover:border-[#cfd9ee] hover:bg-white hover:shadow-[0_5px_16px_#26395c0d]"
                  onClick={() => setSelectedEvent(event)}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#eaf1ff] text-[#3267e3]">
                    <Icon name="clock" size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <strong className="truncate font-[Manrope] text-[15px] text-[#202a3d]">
                        {event.title}
                      </strong>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${timing.className}`}
                      >
                        {timing.label}
                      </span>
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#737d8e]">
                      <span>{eventTime(event)}</span>
                      <span className="min-w-0 break-words">
                        {webLink(event.location)
                          ? "Online meeting"
                          : event.location || "Location not specified"}
                      </span>
                    </span>
                    <span className="mt-2 block truncate text-[12px] font-medium text-[#4e5c72]">
                      {event.personnel?.length
                        ? event.personnel.join(", ")
                        : "No personnel assigned"}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-6 text-[11px] text-[#7a8495]">
            <span className="grid size-9 place-items-center rounded-full bg-[#f2f5fa] text-[#8b95a5]">
              <Icon name="calendar" size={17} />
            </span>
            {calendar.loading
              ? "Checking today's calendar…"
              : "There are no events scheduled for today."}
          </div>
        )}
      </section>
      {selectedEvent && (
        <div
          className={ui.backdrop}
          onMouseDown={(event) => event.target === event.currentTarget && setSelectedEvent(null)}
        >
          <section
            className="max-h-[90vh] w-[min(620px,100%)] overflow-y-auto rounded-[22px] bg-white shadow-[0_28px_90px_#07112770]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="today-event-details-title"
          >
            <header className="relative overflow-hidden bg-gradient-to-br from-[#182d5d] via-[#234b9b] to-[#3972dc] px-7 pb-8 pt-6 text-white">
              <span className="absolute -right-12 -top-16 size-48 rounded-full border-[28px] border-white/5" />
              <span className="absolute -bottom-20 right-20 size-40 rounded-full bg-white/5" />
              <div className="relative flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] backdrop-blur-sm">
                  <Icon name="calendar" size={13} /> Event details
                </span>
                <button
                  className="grid size-9 place-items-center rounded-full border-0 bg-white/10 text-white transition hover:bg-white/20"
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Close event details"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="relative mt-7">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${eventTiming(selectedEvent, now).className}`}
                >
                  {eventTiming(selectedEvent, now).label}
                </span>
                <h3
                  id="today-event-details-title"
                  className="mb-0 mt-3 max-w-[480px] font-[Manrope] text-[25px] font-extrabold leading-tight tracking-[-.025em]"
                >
                  {selectedEvent.title}
                </h3>
                <p className="mb-0 mt-2 text-[11px] text-[#dbe7ff]">
                  {selectedEvent.status || "Calendar event"}
                </p>
              </div>
            </header>
            <div className="p-7 max-[520px]:p-5">
              <div className="grid min-w-0 grid-cols-2 gap-3 max-[520px]:grid-cols-1">
                <div className="min-w-0 overflow-hidden rounded-[14px] border border-[#e6ebf3] bg-[#fbfcff] p-4">
                  <span className="mb-3 grid size-8 place-items-center rounded-[9px] bg-[#eaf1ff] text-[#3267e3]">
                    <Icon name="clock" size={16} />
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[#8a94a5]">
                    Date &amp; time
                  </span>
                  <strong className="mt-1.5 block font-[Manrope] text-xs text-[#263146]">
                    {selectedEvent.start?.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </strong>
                  <span className="mt-1 block text-[11px] text-[#687386]">
                    {eventTime(selectedEvent)}
                  </span>
                </div>
                <div className="min-w-0 overflow-hidden rounded-[14px] border border-[#e6ebf3] bg-[#fbfcff] p-4">
                  <span className="mb-3 grid size-8 place-items-center rounded-[9px] bg-[#eeeaff] text-[#745bd4]">
                    <Icon name="location" size={16} />
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[#8a94a5]">
                    Location
                  </span>
                  <strong className="mt-1.5 block break-words font-[Manrope] text-xs leading-relaxed text-[#263146]">
                    {selectedEventLink
                      ? "Online meeting"
                      : selectedEvent.location || "Location not specified"}
                  </strong>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="m-0 flex items-center gap-2 font-[Manrope] text-sm font-extrabold text-[#273247]">
                    <Icon name="users" size={17} /> Assigned personnel
                  </h4>
                  <span className="rounded-full bg-[#f0f3f8] px-2.5 py-1 text-[9px] font-bold text-[#667085]">
                    {selectedEvent.personnel?.length || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 rounded-[14px] border border-[#e8ecf2] bg-[#fafbfd] p-4">
                  {selectedEvent.personnel?.length ? (
                    selectedEvent.personnel.map((person) => (
                      <span
                        key={person}
                        className="inline-flex items-center gap-2 rounded-full border border-[#dce4f2] bg-white py-1.5 pl-1.5 pr-3 text-[10px] font-semibold text-[#43506a] shadow-sm"
                      >
                        <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-[#4773dc] to-[#6a8ee5] text-[8px] font-bold text-white">
                          {person
                            .split(/\s+/)
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                        {person}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#7b8596]">
                      No personnel assigned to this event.
                    </span>
                  )}
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mt-6">
                  <h4 className="mb-3 mt-0 font-[Manrope] text-sm font-extrabold text-[#273247]">
                    Notes
                  </h4>
                  <div className="whitespace-pre-wrap rounded-[14px] border-l-4 border-[#4773dc] bg-[#f5f7fb] px-4 py-3 text-[11px] leading-relaxed text-[#596375]">
                    {selectedEvent.description.replace(/^Notes:\s*/i, "")}
                  </div>
                </div>
              )}
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-[#edf0f5] bg-[#fbfcfe] px-7 py-4 max-[520px]:flex-col max-[520px]:items-stretch max-[520px]:px-5">
              <span className="text-[9px] text-[#8a94a5]">Synchronized from Google Calendar</span>
              <div className="flex shrink-0 gap-2 max-[520px]:flex-wrap [&>*]:max-[520px]:flex-1">
                {selectedEventLink && (
                  <a
                    className={ui.primaryButton}
                    href={selectedEventLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open meeting link
                  </a>
                )}
                <button
                  className={`${ui.secondaryButton} min-w-[86px]`}
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}
