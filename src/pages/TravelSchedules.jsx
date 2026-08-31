import { useEffect, useMemo, useState } from "react"
import Icon from "../components/Icon"
import ScheduleDetailsModal from "../components/ScheduleDetailsModal"
import { statusClass, ui } from "../styles"

const samples = [
  { id: 1, start: new Date("2026-08-28T09:00:00"), personnel: ["Juan Dela Cruz"], title: "Official Meeting", location: "Cagayan de Oro City", status: "Confirmed" },
  { id: 2, start: new Date("2026-08-30T13:30:00"), personnel: ["Maria Santos"], title: "Conference", location: "Cebu City", status: "Pending" },
  { id: 3, start: new Date("2026-09-02T08:00:00"), personnel: ["Pedro Reyes"], title: "Coordination", location: "Metro Manila", status: "Confirmed" },
]
const getDate = (event) => event.start instanceof Date ? event.start : new Date(event.start)
const getStatus = (event) => event.status === "Confirmed" ? "Confirmed" : "Pending"
const initials = (name) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
const destination = (location) => /^https?:\/\//i.test(String(location || "")) ? "Online meeting" : location || "Location not specified"

export function Page({ title, sub, children }) {
  return <div>
    <section className={`${ui.pageHeading} mb-[27px]`}>
      <div><span className={ui.pill}>MANAGEMENT</span><h1 className={ui.pageTitle}>{title}</h1><p className={ui.pageSubtitle}>{sub}</p></div>
    </section>
    {children}
  </div>
}

export default function TravelSchedules({ calendar, connectCalendar, refreshCalendar, loadCalendarMonth, openTravelModal, removeTravelEvent }) {
  const [month, setMonth] = useState(() => new Date())
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("All")
  const [selectedEvent, setSelectedEvent] = useState(null)
  const selectMonth = (date) => setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
  const moveMonth = (amount) => selectMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1))

  useEffect(() => {
    if (calendar.connected) loadCalendarMonth(month)
  }, [calendar.connected, loadCalendarMonth, month])

  const monthLabel = month.toLocaleDateString("en-PH", { month: "long", year: "numeric" })
  const events = useMemo(() => (calendar.connected ? calendar.events : samples)
    .filter((event) => { const date = getDate(event); return Number.isFinite(date.getTime()) && date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth() })
    .sort((a, b) => getDate(a) - getDate(b)), [calendar.connected, calendar.events, month])
  const shown = useMemo(() => events.filter((event) => {
    const haystack = [event.title, event.location, ...(event.personnel || [])].join(" ").toLowerCase()
    return (filter === "All" || getStatus(event) === filter) && haystack.includes(query.trim().toLowerCase())
  }), [events, filter, query])
  const nextTrip = events.find((event) => getDate(event) >= new Date()) || events[0]

  return <div className="space-y-5">
    <section className="relative isolate overflow-hidden rounded-[24px] bg-[#101d3a] px-7 py-7 text-white shadow-[0_18px_45px_#172b5d22] max-[640px]:px-5">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_20%,#3b6ee080,transparent_28%),radial-gradient(circle_at_10%_120%,#6555d660,transparent_35%)]" />
      <div className="absolute -right-14 -top-20 -z-10 size-64 rounded-full border-[38px] border-white/[.035]" />
      <div className="flex items-start justify-between gap-6 max-[720px]:flex-col">
        <div className="max-w-[620px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.15em] text-[#c5d6ff]">
            <i className={`size-1.5 rounded-full ${calendar.connected ? "bg-[#54d9aa]" : "bg-[#aab4c5]"}`} />
            {calendar.connected ? "Calendar connected" : "Preview workspace"}
          </span>
          <h1 className="mb-2 mt-4 font-[Manrope] text-[30px] font-extrabold tracking-[-.04em] max-[520px]:text-[25px]">Travel Schedules</h1>
          <p className="m-0 text-[12px] leading-relaxed text-[#aebbd4]">Plan assignments, track trip readiness, and keep every personnel movement visible in one operational timeline.</p>
        </div>
        {calendar.connected ? (
          <button className="inline-flex shrink-0 items-center gap-2 rounded-[11px] bg-white px-4 py-3 text-[11px] font-bold text-[#18305f] shadow-[0_10px_28px_#07112745] transition hover:-translate-y-0.5" onClick={openTravelModal}>
            <Icon name="plus" size={17} /> New assignment
          </button>
        ) : (
          <button className="inline-flex shrink-0 items-center gap-2 rounded-[11px] bg-white px-4 py-3 text-[11px] font-bold text-[#18305f] disabled:opacity-60" onClick={connectCalendar} disabled={calendar.loading}>
            <Icon name="calendar" size={17} /> {calendar.loading ? "Connecting…" : "Connect calendar"}
          </button>
        )}
      </div>
    </section>

    {calendar.error && <div className={ui.error}><span>{calendar.error}</span><button className={ui.textButton} onClick={refreshCalendar}>Try again</button></div>}

    <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_30px_#26395c0a]">
      <header className="flex items-center justify-between gap-4 border-b border-[#edf0f5] px-5 py-4 max-[760px]:flex-col max-[760px]:items-stretch">
        <div className="flex items-center gap-2">
          <button className="grid size-9 place-items-center rounded-[10px] border border-[#e3e8f1] text-lg text-[#59667b]" onClick={() => moveMonth(-1)} aria-label="Previous month">‹</button>
          <button className="min-w-[150px] rounded-[10px] border-0 bg-[#f4f7fc] px-4 py-2.5 text-[11px] font-bold text-[#28364e]" onClick={() => selectMonth(new Date())} title="Return to current month">{monthLabel}</button>
          <button className="grid size-9 place-items-center rounded-[10px] border border-[#e3e8f1] text-lg text-[#59667b]" onClick={() => moveMonth(1)} aria-label="Next month">›</button>
        </div>
        <div className="flex gap-2 max-[560px]:flex-col">
          <label className="flex h-10 min-w-[250px] items-center gap-2 rounded-[10px] border border-[#e3e8f1] bg-[#fbfcfe] px-3 text-[#8b95a6] focus-within:border-[#7092e5] max-[560px]:min-w-0"><Icon name="search" size={16} /><input className="w-full border-0 bg-transparent text-[11px] text-[#344054] outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trip, person, destination…" /></label>
          <select className="h-10 rounded-[10px] border border-[#e3e8f1] bg-white px-3 text-[11px] font-semibold text-[#566174] outline-none" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status"><option>All</option><option>Confirmed</option><option>Pending</option></select>
          {calendar.connected && <button className={`${ui.secondaryButton} whitespace-nowrap`} onClick={refreshCalendar} disabled={calendar.loading}><Icon name="sync" size={16} />{calendar.loading ? "Syncing…" : "Sync"}</button>}
        </div>
      </header>

      {nextTrip && !query && filter === "All" && <div className="mx-5 mt-5 flex items-center gap-4 rounded-[14px] border border-[#dfe7f7] bg-gradient-to-r from-[#f4f7ff] to-[#fbfcff] p-4 max-[560px]:items-start">
        <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-gradient-to-br from-[#3267e3] to-[#6658d6] text-white shadow-[0_7px_16px_#3267e32e]"><Icon name="plane" size={18} /></span>
        <div className="min-w-0 flex-1"><span className="text-[8px] font-bold uppercase tracking-[.14em] text-[#6680b8]">Next on the itinerary</span><strong className="mt-1 block truncate font-[Manrope] text-[13px] text-[#202c43]">{nextTrip.title || "Untitled event"}</strong><span className="mt-1 block text-[10px] text-[#788397]">{getDate(nextTrip).toLocaleDateString("en-PH", { weekday: "short", month: "long", day: "numeric" })} · {destination(nextTrip.location)}</span></div>
        <span className={statusClass(getStatus(nextTrip).toLowerCase())}><i />{getStatus(nextTrip)}</span>
      </div>}

      <div className="space-y-2 p-5 max-[560px]:p-3">{shown.map((event, index) => { const date = getDate(event); const people = event.personnel || []; return <article key={`${event.id || event.title}-${index}`} className="group grid cursor-pointer grid-cols-[64px_minmax(0,1.6fr)_minmax(150px,.8fr)_minmax(150px,.8fr)_auto] items-center gap-4 rounded-[14px] border border-[#e6ebf3] bg-[#fbfcfe] px-4 py-3 transition hover:-translate-y-px hover:border-[#cdd9ed] hover:bg-white hover:shadow-[0_8px_22px_#26395c0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3267e3] max-[900px]:grid-cols-[58px_1fr_auto] max-[560px]:grid-cols-[48px_1fr] max-[560px]:gap-3 max-[560px]:p-3" role="button" tabIndex={0} aria-label={`View ${event.title || "untitled event"} details`} onClick={() => setSelectedEvent(event)} onKeyDown={(keyboardEvent) => { if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") { keyboardEvent.preventDefault(); setSelectedEvent(event) } }}>
        <div className="grid h-14 place-items-center rounded-[11px] bg-[#eaf1ff] text-center text-[#3267e3] max-[560px]:h-12"><span><strong className="block font-[Manrope] text-xl leading-none max-[560px]:text-lg">{date.getDate()}</strong><span className="mt-1 block text-[7px] font-bold uppercase tracking-[.1em]">{date.toLocaleDateString("en-US", { month: "short" })}</span></span></div>
        <div className="min-w-0"><div className="mb-1.5 flex items-center gap-2"><span className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7890bd]">{event.allDay ? "All day" : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span><span className="size-1 rounded-full bg-[#c7cfdd]" /><span className="text-[8px] text-[#929baa]">Travel assignment</span></div><h3 className="m-0 truncate font-[Manrope] text-[12px] font-extrabold text-[#273247]">{event.title || "Untitled event"}</h3><div className="mt-2 hidden items-center gap-3 text-[9px] text-[#697487] max-[900px]:flex max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-1"><span className="flex items-center gap-1.5"><Icon name="users" size={12} />{people.join(", ") || "Unassigned"}</span><span className="flex items-center gap-1.5"><Icon name="location" size={12} />{destination(event.location)}</span></div></div>
        <div className="flex min-w-0 items-center gap-2 max-[900px]:hidden"><div className="flex -space-x-2">{people.slice(0, 3).map((person) => <span key={person} title={person} className="grid size-7 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#5178d8] to-[#7898e4] text-[7px] font-bold text-white">{initials(person)}</span>)}</div><span className="truncate text-[9px] font-semibold text-[#596579]">{people.join(", ") || "Unassigned"}</span></div>
        <div className="flex min-w-0 items-center gap-2 text-[#697487] max-[900px]:hidden"><span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-[#f0edff] text-[#735bd2]"><Icon name="location" size={13} /></span><span className="truncate text-[9px] font-medium">{destination(event.location)}</span></div>
        <div className="flex items-center gap-3 max-[560px]:col-span-2 max-[560px]:justify-between"><span className={statusClass(getStatus(event).toLowerCase())}><i />{getStatus(event)}</span><span className="grid size-7 place-items-center rounded-full text-[#8090ab] opacity-0 transition group-hover:bg-[#eef3fc] group-hover:text-[#4773dc] group-hover:opacity-100 max-[900px]:opacity-100"><Icon name="chevron" size={13} /></span></div>
      </article> })}</div>
      {calendar.loading && !events.length && <div className="p-12 text-center text-[11px] text-[#8b94a3]" role="status">Synchronizing Google Calendar…</div>}
      {!calendar.loading && !shown.length && <div className="flex flex-col items-center px-5 py-14 text-center"><span className="grid size-12 place-items-center rounded-full bg-[#f1f5fb] text-[#7083a3]"><Icon name="calendar" size={21} /></span><strong className="mt-4 font-[Manrope] text-sm text-[#374256]">No matching schedules</strong><p className="mb-0 mt-1 text-[10px] text-[#8b94a3]">Try another month or adjust your search and status filter.</p></div>}
      <footer className="flex items-center justify-between border-t border-[#edf0f5] px-5 py-3 text-[9px] text-[#8a94a5]"><span>Showing {shown.length} of {events.length} schedules</span><span>{calendar.connected ? "Live Google Calendar data" : "Preview data"}</span></footer>
    </section>
    <ScheduleDetailsModal event={selectedEvent} connected={calendar.connected} onClose={() => setSelectedEvent(null)} onAssign={openTravelModal} onDelete={removeTravelEvent} />
  </div>
}
