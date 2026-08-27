import { useEffect, useState } from "react"
import Icon from "../components/Icon"
import { statusClass, ui } from "../styles"
const samples = [
  ["Aug 28, 2026", "Juan Dela Cruz", "Cagayan de Oro City", "Official Meeting", "Confirmed"],
  ["Aug 30, 2026", "Maria Santos", "Cebu City", "Conference", "Pending"],
  ["Sep 02, 2026", "Pedro Reyes", "Metro Manila", "Coordination", "Confirmed"],
]
const formatEventDate = (event) => {
  const date = event.start instanceof Date ? event.start : new Date(event.start)
  if (!Number.isFinite(date.getTime())) return "Date not available"
  return date.toLocaleString(
    "en-PH",
    event.allDay ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" },
  )
}

const eventStatus = (status) => (status === "Confirmed" ? "Confirmed" : "Pending")
const isSameMonth = (date, month) =>
  date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth()
export function Page({ title, sub, children }) {
  return (
    <div>
      <section className={`${ui.pageHeading} mb-[27px]`}>
        <div>
          <span className={ui.pill}>MANAGEMENT</span>
          <h1 className={ui.pageTitle}>{title}</h1>
          <p className={ui.pageSubtitle}>{sub}</p>
        </div>
      </section>
      {children}
    </div>
  )
}
export default function TravelSchedules({
  calendar,
  connectCalendar,
  refreshCalendar,
  loadCalendarMonth,
  openTravelModal,
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date())
  useEffect(() => {
    if (calendar.connected) loadCalendarMonth(selectedMonth)
  }, [calendar.connected, loadCalendarMonth, selectedMonth])

  const selectMonth = (month) => setSelectedMonth(new Date(month.getFullYear(), month.getMonth(), 1))
  const moveMonth = (amount) =>
    selectMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + amount, 1))
  const monthLabel = selectedMonth.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  })
  const monthlyEvents = calendar.events.filter((event) => {
    const date = event.start instanceof Date ? event.start : new Date(event.start)
    return Number.isFinite(date.getTime()) && isSameMonth(date, selectedMonth)
  })
  const rows = calendar.connected
    ? [...monthlyEvents]
      .sort((first, second) => {
        const firstTime = new Date(first.start).getTime()
        const secondTime = new Date(second.start).getTime()
        return (Number.isFinite(firstTime) ? firstTime : Infinity) -
          (Number.isFinite(secondTime) ? secondTime : Infinity)
      })
      .map((e) => [
        formatEventDate(e),
        e.personnel?.join(", ") || "Unassigned",
        e.title || "Untitled event",
        e.location || "Location not specified",
        eventStatus(e.status),
      ])
    : samples
  return (
    <Page
      title="Travel schedules"
      sub={
        calendar.connected
          ? `${monthLabel} · ${rows.length} event${rows.length === 1 ? "" : "s"}`
          : "Connect Google Calendar to load live schedules"
      }
    >
      <div className={ui.toolbar}>
        <div className="flex items-center gap-1 rounded-[9px] border border-[#e5e9f1] bg-white p-1">
          <button
            className={`${ui.iconButton} size-7 p-1 text-[#5f6979]`}
            onClick={() => moveMonth(-1)}
            aria-label="Previous month"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            className="min-w-[118px] border-0 bg-transparent px-2 text-[11px] font-semibold text-[#344054]"
            onClick={() => selectMonth(new Date())}
            title="Return to current month"
          >
            {monthLabel}
          </button>
          <button
            className={`${ui.iconButton} size-7 p-1 text-[#5f6979]`}
            onClick={() => moveMonth(1)}
            aria-label="Next month"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <label className={ui.search}>
          <Icon name="search" size={18} />
          <input placeholder="Search schedules..." />
        </label>
        <button className={ui.secondaryButton}>
          <Icon name="filter" size={17} /> Filters
        </button>
        {calendar.connected ? (
          <>
            <button
              className={ui.secondaryButton}
              onClick={() => refreshCalendar()}
              disabled={calendar.loading}
            >
              <Icon name="sync" size={17} />
              {calendar.loading ? "Syncing…" : "Refresh"}
            </button>
            <button className={`${ui.primaryButton} ml-auto`} onClick={openTravelModal}>
              <Icon name="plus" size={17} />
              New assignment
            </button>
          </>
        ) : (
          <button className={`${ui.primaryButton} ml-auto`} onClick={connectCalendar} disabled={calendar.loading}>
            <Icon name="calendar" size={17} />
            {calendar.loading ? "Connecting…" : "Connect Google Calendar"}
          </button>
        )}
      </div>
      {calendar.error && <div className={ui.error}>{calendar.error}</div>}
      <div className={`${ui.panel} overflow-hidden max-[520px]:-mx-2`}>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[17%]" />
              <col className="w-[20%]" />
              <col className="w-[28%]" />
              <col className="w-[23%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr>
                <th className="bg-[#fafbfc] px-[18px] py-[11px] text-[8px] font-semibold uppercase tracking-[.06em] text-[#8d95a4]">Date & time</th>
                {['Personnel','Schedule','Destination','Status'].map((h) => <th key={h} className="bg-[#fafbfc] px-[18px] py-[11px] text-[8px] font-semibold uppercase tracking-[.06em] text-[#8d95a4]">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((s, rowIndex) => (
                <tr key={`${s[1]}-${rowIndex}`}>
                  {s.map((v, i) => (
                    <td
                      className="overflow-hidden border-b border-[#eef1f5] px-[18px] py-[11px] text-[10px] text-[#555f70]"
                      key={`${i}-${v}`}
                      title={String(v)}
                    >
                      {i === 4 ? (
                        <span className={statusClass(v.toLowerCase())}>
                          <i />
                          {v}
                        </span>
                      ) : i === 1 ? (
                        <strong className="block truncate">{v}</strong>
                      ) : (
                        <span className="block truncate">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {calendar.loading && !rows.length && (
          <div className="p-[38px] text-center text-[#8b94a3]" role="status">
            Synchronizing Google Calendar…
          </div>
        )}
        {!calendar.loading && !rows.length && (
          <div className="p-[38px] text-center text-[#8b94a3] [&_svg]:mx-auto [&_strong]:my-1 [&_strong]:block [&_strong]:text-xs [&_strong]:text-[#4a5465] [&_p]:m-0 [&_p]:text-[10px]">
            <Icon name="calendar" size={28} />
            <strong>No upcoming events</strong>
            <p>There are no schedules for {monthLabel}.</p>
          </div>
        )}
      </div>
    </Page>
  )
}
