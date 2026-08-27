import { useEffect, useState } from "react"
import Icon from "./Icon"
import { ui } from "../styles"
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
  COLORS = ["green", "blue", "violet", "orange"],
  MAX_EVENT_ROWS = 3
const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const colorForEvent = (event) => {
  const value = [...(event.id || event.title)].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  )
  return COLORS[value % COLORS.length]
}
const eventColor = (color) =>
  ({
    green: "border-[#43aa78] bg-[#e5f7ee] text-[#177a55] hover:bg-[#d9f2e6]",
    blue: "border-[#4b78dc] bg-[#eaf1ff] text-[#2859bf] hover:bg-[#dfeaff]",
    violet: "border-[#795dc9] bg-[#f0ecff] text-[#6848bd] hover:bg-[#e7e0ff]",
    orange: "border-[#dd8c32] bg-[#fff3e3] text-[#a76518] hover:bg-[#ffeaca]",
  })[color]
const detailColor = (color) =>
  ({ green: "bg-[#43aa78]", blue: "bg-[#4b78dc]", violet: "bg-[#795dc9]", orange: "bg-[#dd8c32]" })[
    color
  ]
const googleColorStyle = (event) =>
  event.color?.background
    ? {
        backgroundColor: event.color.background,
        borderLeftColor: event.color.background,
        color: event.color.foreground || "#ffffff",
      }
    : undefined
const detailColorStyle = (event) =>
  event.color?.background ? { backgroundColor: event.color.background } : undefined
export default function TravelCalendar({
  events = [],
  loading,
  onAssign,
  onDelete,
  onMonthChange,
}) {
  const [month, setMonth] = useState(() => new Date()),
    [currentDate, setCurrentDate] = useState(() => new Date()),
    [selected, setSelected] = useState(null),
    [confirmDelete, setConfirmDelete] = useState(null),
    [deletingKey, setDeletingKey] = useState("")
  const todayStart = startOfDay(currentDate)
  useEffect(() => {
    const now = new Date()
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timer = window.setTimeout(
      () => {
        const newToday = new Date()
        setCurrentDate(newToday)
        if (
          month.getFullYear() === now.getFullYear() &&
          month.getMonth() === now.getMonth() &&
          (newToday.getFullYear() !== now.getFullYear() || newToday.getMonth() !== now.getMonth())
        ) {
          const newMonth = new Date(newToday.getFullYear(), newToday.getMonth(), 1)
          setMonth(newMonth)
          onMonthChange?.(newMonth, { force: true })
        }
      },
      nextMidnight.getTime() - now.getTime() + 1000,
    )
    return () => window.clearTimeout(timer)
  }, [month, onMonthChange, currentDate])
  const first = new Date(month.getFullYear(), month.getMonth(), 1),
    gridStart = new Date(first)
  gridStart.setDate(1 - first.getDay())
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
  const visibleStartTime = startOfDay(cells[0]).getTime(),
    visibleEndTime = startOfDay(cells[cells.length - 1]).getTime()
  const { displayEvents, detailEvents } = events.reduce(
    (maps, event) => {
      if (!event.start) return maps
      const eventStart = new Date(event.start)
      const lastInstant = event.end ? new Date(event.end) : new Date(event.start)
      if (!Number.isFinite(eventStart.getTime()) || !Number.isFinite(lastInstant.getTime()))
        return maps
      if (event.allDay && event.end) lastInstant.setMilliseconds(lastInstant.getMilliseconds() - 1)
      const eventFirstDay = startOfDay(eventStart),
        eventLastDay = startOfDay(lastInstant)
      if (eventLastDay < eventFirstDay) return maps

      // Only expand the portion visible in this six-week grid. Without this
      // clamp, one accidental years-long event can exhaust the browser memory.
      const firstDay =
        eventFirstDay.getTime() < visibleStartTime ? new Date(visibleStartTime) : eventFirstDay
      const lastDay =
        eventLastDay.getTime() > visibleEndTime ? new Date(visibleEndTime) : eventLastDay
      if (firstDay > lastDay) return maps

      const cursor = new Date(firstDay)
      while (cursor <= lastDay) {
        ;(maps.detailEvents[dateKey(cursor)] ??= []).push(event)
        cursor.setDate(cursor.getDate() + 1)
      }

      const segmentStart = new Date(firstDay)
      while (segmentStart <= lastDay) {
        const daysUntilSaturday = 6 - segmentStart.getDay()
        const weekEnd = new Date(segmentStart)
        weekEnd.setDate(weekEnd.getDate() + daysUntilSaturday)
        const segmentEnd = weekEnd < lastDay ? weekEnd : lastDay
        const span = Math.round((segmentEnd - segmentStart) / 86400000) + 1
        ;(maps.displayEvents[dateKey(segmentStart)] ??= []).push({
          event,
          span,
          continuation: segmentStart > eventFirstDay,
        })
        // Advance from the actual segment end. Using only its day-of-month
        // can move backward when an event crosses a month boundary.
        segmentStart.setTime(segmentEnd.getTime())
        segmentStart.setDate(segmentStart.getDate() + 1)
      }
      return maps
    },
    { displayEvents: {}, detailEvents: {} },
  )
  const selectMonth = (date) => {
      setMonth(date)
      onMonthChange?.(date)
    },
    move = (amount) => selectMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1)),
    openDay = (date) =>
      setSelected({
        date,
        events: detailEvents[dateKey(date)] || [],
      })
  const selectedDateIsPast = selected ? startOfDay(selected.date) < todayStart : false
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const monthEvents = events.filter(
    (event) => event.start < monthEnd && (event.end || event.start) >= first,
  )
  const assignedEvents = monthEvents.filter((event) => event.personnel?.length).length
  return (
    <article className="overflow-hidden rounded-[20px] border border-[#dfe5ef] bg-white shadow-[0_10px_35px_#243b6410] max-[520px]:rounded-[16px]">
      <header className="relative flex min-h-[96px] items-center justify-between gap-5 overflow-hidden border-b border-[#e6ebf3] bg-gradient-to-r from-[#fbfcff] to-[#f5f8ff] px-6 py-5 max-[760px]:items-start max-[760px]:flex-col max-[520px]:gap-4 max-[520px]:px-4 max-[520px]:py-4">
        <span className="absolute -right-14 -top-20 size-48 rounded-full border-[28px] border-[#3267e308]" />
        <div className="flex items-center gap-3">
          <span className="grid size-[48px] shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-[#3267e3] to-[#6558d7] text-white shadow-[0_8px_20px_#3267e32b] max-[520px]:size-10">
            <Icon name="calendar" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="m-0 font-[Manrope] text-lg font-extrabold tracking-[-.02em] text-[#17233b]">
                Travel Calendar
              </h2>
              {loading && <i className="size-1.5 animate-pulse rounded-full bg-[#3267e3]" />}
            </div>
            <p className="mb-0 mt-1 text-[11px] text-[#7d8798]">
              {monthEvents.length} trips · {assignedEvents} assigned this month
            </p>
          </div>
        </div>
        <div className="relative flex items-center gap-1.5 max-[520px]:w-full max-[520px]:flex-wrap">
          <button
            className="mr-1 inline-flex h-10 items-center justify-center rounded-[10px] border border-[#dbe3f0] bg-white px-4 text-[11px] font-bold text-[#41506a] shadow-sm transition hover:border-[#bdcbea] hover:text-[#3267e3]"
            onClick={() => selectMonth(new Date())}
          >
            Today
          </button>
          <button
            className="grid size-10 place-items-center rounded-[10px] border border-[#dbe3f0] bg-white text-[22px] text-[#536078] shadow-sm transition hover:border-[#bdcbea] hover:text-[#3267e3]"
            onClick={() => move(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            className="grid size-10 place-items-center rounded-[10px] border border-[#dbe3f0] bg-white text-[22px] text-[#536078] shadow-sm transition hover:border-[#bdcbea] hover:text-[#3267e3]"
            onClick={() => move(1)}
            aria-label="Next month"
          >
            ›
          </button>
          <strong className="ml-2 min-w-[175px] text-right font-[Manrope] text-[16px] font-extrabold text-[#202c43] max-[520px]:order-first max-[520px]:w-full max-[520px]:min-w-0 max-[520px]:text-left">
            {month.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </strong>
        </div>
      </header>
      {loading && (
        <div
          className="flex items-center gap-2 border-b border-[#dce6f8] bg-[#f1f5ff] px-6 py-2 text-[9px] font-medium text-[#3267e3]"
          role="status"
          aria-live="polite"
        >
          Synchronizing Google Calendar… The first sync may take a moment.
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-b border-[#e8ecf3] bg-white px-6 py-3 max-[620px]:items-start max-[620px]:flex-col max-[520px]:px-4">
        <div className="flex flex-wrap items-center gap-4 text-[9px] font-semibold text-[#6f7a8d]">
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2 rounded-full bg-[#4285f4]" /> Colors synchronized from Google
            Calendar
          </span>
        </div>
        <span className="text-[9px] text-[#98a1b1]">Select a date to view details</span>
      </div>
      <div className="overflow-x-auto max-[620px]:hidden">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-[#e5e9f1] bg-[#f8faff]">
            {DAYS.map((day) => (
              <span
                className="px-1 py-[12px] text-center text-[10px] font-extrabold tracking-[.12em] text-[#778194]"
                key={day}
              >
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((date) => {
              const key = dateKey(date),
                dayEvents = displayEvents[key] || [],
                totalEvents = detailEvents[key]?.length || 0,
                visibleEventLimit =
                  totalEvents > MAX_EVENT_ROWS ? MAX_EVENT_ROWS - 1 : MAX_EVENT_ROWS,
                visibleEvents = [...dayEvents]
                  .sort((a, b) => Number(b.span > 1) - Number(a.span > 1))
                  .slice(0, visibleEventLimit),
                hiddenEventCount = Math.max(0, totalEvents - visibleEventLimit),
                outside = date.getMonth() !== month.getMonth(),
                today = key === dateKey(todayStart),
                past = startOfDay(date) < todayStart
              return (
                <div
                  key={dateKey(date)}
                  className={`relative h-[132px] min-w-0 cursor-pointer overflow-visible border-b border-r border-[#e8ecf3] bg-white p-[10px] transition-colors hover:bg-[#f6f9ff] [&:nth-child(7n)]:border-r-0 ${outside ? "bg-[#fafbfc] text-[#b8bec9]" : ""} ${today ? "bg-[#f8faff] shadow-[inset_0_3px_0_#3267e3]" : ""} ${past ? "bg-[#fbfcfd] [&_.event]:opacity-75 [&_.event]:saturate-[.85] [&_.more]:opacity-70" : ""}`}
                  onClick={() => openDay(date)}
                  role="button"
                  tabIndex="0"
                  onKeyDown={(e) => e.key === "Enter" && openDay(date)}
                >
                  <span
                    className={`mb-[7px] grid size-[28px] place-items-center rounded-[9px] text-[12px] font-bold ${today ? "bg-[#3267e3] text-white shadow-[0_4px_10px_#3267e32e]" : past ? "text-[#aeb5c1]" : "text-[#48546a]"}`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="relative flex min-w-0 flex-col gap-1">
                    {visibleEvents.map((entry, index) => (
                      <button
                        key={`${entry.event.id}-${entry.event.start?.toISOString()}-${index}`}
                        className={`event relative h-[25px] overflow-hidden text-ellipsis whitespace-nowrap rounded-r-[6px] rounded-l-[3px] border-0 border-l-[3px] px-2 py-1 text-left text-[10px] font-bold shadow-[0_2px_5px_#26395c0a] transition [&_span]:mr-[5px] [&_span]:font-medium [&_span]:opacity-70 ${entry.event.color?.background ? "brightness-100 hover:brightness-95" : eventColor(colorForEvent(entry.event))} ${entry.span > 1 ? "z-[4] max-w-none w-[calc(var(--day-span)*(100%+20px)-20px)]" : "z-[5] w-full max-w-full"}`}
                        style={{
                          "--day-span": entry.span,
                          ...googleColorStyle(entry.event),
                        }}
                        onClick={(e) => {
                          e.stopPropagation()

                          setSelected({
                            date,
                            events: detailEvents[dateKey(date)] || [],
                            active: entry.event,
                          })
                        }}
                      >
                        <span>
                          {!entry.continuation &&
                            !entry.event.allDay &&
                            entry.event.start.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                        </span>

                        {entry.event.title}
                      </button>
                    ))}
                    {hiddenEventCount > 0 && (
                      <button
                        className="more border-0 bg-transparent px-1.5 py-[3px] text-left text-[11px] font-bold text-[#4c64a0] hover:text-[#294a9f] hover:underline"
                        aria-label={`View ${hiddenEventCount} more event${hiddenEventCount === 1 ? "" : "s"} on ${date.toLocaleDateString("en-US")}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          openDay(date)
                        }}
                      >
                        +{hiddenEventCount} more
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="hidden max-[620px]:block">
        <div className="grid grid-cols-7 border-b border-[#e5e9f1] bg-[#f8faff]">
          {DAYS.map((day) => (
            <span
              className="py-2.5 text-center text-[8px] font-extrabold tracking-[.08em] text-[#778194]"
              key={day}
            >
              {day.slice(0, 1)}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date) => {
            const key = dateKey(date),
              dayEvents = detailEvents[key] || [],
              outside = date.getMonth() !== month.getMonth(),
              today = key === dateKey(todayStart),
              past = startOfDay(date) < todayStart
            return (
              <button
                key={key}
                type="button"
                className={`relative flex min-h-[62px] min-w-0 flex-col items-center border-b border-r border-[#e8ecf3] bg-white px-0.5 py-2 text-center [&:nth-child(7n)]:border-r-0 ${outside ? "bg-[#fafbfc] text-[#b8bec9]" : "text-[#48546a]"} ${today ? "bg-[#f3f7ff] shadow-[inset_0_2px_0_#3267e3]" : ""} ${past ? "opacity-70" : ""}`}
                onClick={() => openDay(date)}
                aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
              >
                <span className={`grid size-7 place-items-center rounded-full text-[11px] font-bold ${today ? "bg-[#3267e3] text-white" : ""}`}>
                  {date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="mt-1 flex max-w-full items-center gap-1 text-[8px] font-bold text-[#3267e3]">
                    <i className="size-1.5 shrink-0 rounded-full bg-[#4b78dc]" />
                    <span className="truncate">{dayEvents.length}</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      {selected && (
        <div
          className={ui.backdrop}
          onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <section className="max-h-[calc(100vh-40px)] w-[min(650px,100%)] overflow-auto rounded-[22px] bg-white shadow-[0_28px_90px_#0711275c] max-[520px]:max-h-[calc(100dvh-16px)] max-[520px]:rounded-[16px]">
            <header className="relative flex justify-between gap-3 overflow-hidden bg-gradient-to-br from-[#13264f] via-[#234a99] to-[#4f59cc] px-7 py-7 text-white max-[520px]:px-4 max-[520px]:py-5">
              <span className="absolute -right-12 -top-20 size-48 rounded-full border-[30px] border-white/[.05]" />
              <div className="flex gap-[11px]">
                <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-[11px] bg-white/10 text-[#dce7ff] backdrop-blur-sm">
                  <Icon name="calendar" size={18} />
                </span>
                <div>
                  <p className="mb-2 mt-0 text-[9px] font-bold uppercase tracking-[.15em] text-[#b9cbf3]">
                    Daily itinerary
                  </p>
                  <h3 className="m-0 font-[Manrope] text-[20px] font-extrabold tracking-[-.02em] max-[520px]:text-base">
                    {selected.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                  <p className="mb-0 mt-1.5 text-[10px] text-[#c8d7f5]">
                    {selected.events.length} scheduled event
                    {selected.events.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <button
                className="relative grid size-9 place-items-center rounded-full border-0 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setSelected(null)}
                aria-label="Close daily itinerary"
              >
                <Icon name="close" />
              </button>
            </header>
            <div className="p-4 max-[520px]:p-2.5">
              {selected.events.length ? (
                selected.events.map((event, index) => (
                  <article
                    key={`${event.id}-${event.start?.toISOString()}-${index}`}
                    className={`grid grid-cols-[5px_1fr] gap-4 rounded-[14px] border border-transparent p-5 transition hover:border-[#e5eaf3] hover:bg-[#f8faff] max-[520px]:gap-3 max-[520px]:p-3 ${selected.active === event ? "border-[#dce5f7] bg-[#f5f8ff] shadow-[0_5px_16px_#26395c0b]" : ""}`}
                  >
                    <span
                      className={`rounded ${event.color?.background ? "" : detailColor(COLORS[index % 4])}`}
                      style={detailColorStyle(event)}
                    />
                    <div className="[&_p]:my-[9px] [&_p]:flex [&_p]:items-center [&_p]:gap-[9px] [&_p]:text-xs [&_p]:text-[#6f798a] [&_p_svg]:size-[18px]">
                      <h4 className="mb-3 mt-0 font-[Manrope] text-base font-bold">
                        {event.title}
                      </h4>
                      <p>
                        <Icon name="clock" size={15} />
                        {event.allDay
                          ? "All day"
                          : `${event.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${event.end?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                      </p>
                      {event.location && (
                        <p>
                          <Icon name="location" size={15} />
                          {event.location}
                        </p>
                      )}
                      <p>
                        <Icon name="users" size={15} />
                        {event.personnel?.length
                          ? event.personnel.join(", ")
                          : "No personnel assigned"}
                      </p>
                      {event.description && (
                        <div className="mt-[13px] whitespace-pre-wrap rounded-[10px] border-l-[3px] border-[#4b78dc] bg-[#f4f7fb] px-[14px] py-[13px] text-xs leading-[1.55] text-[#596375]">
                          {event.description}
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-[9px] border-0 bg-[#3267e3] px-[15px] py-[11px] text-xs font-bold text-white shadow-[0_5px_14px_#3267e326] hover:-translate-y-px hover:bg-[#285aca] disabled:cursor-not-allowed disabled:bg-[#aeb7c8] disabled:shadow-none disabled:hover:translate-y-0"
                          disabled={selectedDateIsPast}
                          title={
                            selectedDateIsPast
                              ? "Personnel assignments cannot be changed for past dates."
                              : undefined
                          }
                          onClick={() => {
                            setSelected(null)
                            onAssign(event)
                          }}
                        >
                          <Icon name="users" size={15} />{" "}
                          {selectedDateIsPast
                            ? "Past date"
                            : event.personnel?.length
                              ? "Change assignment"
                              : "Assign Personnel"}
                        </button>
                        <button
                          className="inline-flex items-center rounded-[9px] border border-[#e5a7a7] bg-white px-[15px] py-[11px] text-xs font-bold text-[#b42318] hover:bg-[#fff1f0] disabled:cursor-wait disabled:opacity-60"
                          disabled={deletingKey === `${event.id}-${event.start?.toISOString()}`}
                          onClick={() => setConfirmDelete(event)}
                        >
                          Delete event
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="p-[35px] text-center text-[#8993a4] [&_strong]:mb-1 [&_strong]:mt-[9px] [&_strong]:block [&_strong]:text-[11px] [&_strong]:text-[#465164] [&_p]:m-0 [&_p]:text-[9px]">
                  <Icon name="calendar" size={30} />
                  <strong>No events on this date</strong>
                  <p>Select another date to view its schedule.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[130] grid place-items-center bg-[#0b13258f] p-5 backdrop-blur-[3px]"
          onMouseDown={(event) =>
            event.target === event.currentTarget && !deletingKey && setConfirmDelete(null)
          }
        >
          <section
            className="w-[min(430px,100%)] rounded-[18px] bg-white p-7 text-center shadow-[0_24px_70px_#0711275c] max-[520px]:p-5"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-event-title"
            aria-describedby="delete-event-description"
          >
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[#fff0ef] text-[#b42318]">
              <Icon name="trash" size={25} />
            </div>
            <h2
              id="delete-event-title"
              className="m-0 font-[Manrope] text-xl font-extrabold text-[#172033]"
            >
              Delete this event?
            </h2>
            <p
              id="delete-event-description"
              className="mb-2 mt-3 text-[13px] leading-[1.6] text-[#6f798a]"
            >
              <strong className="text-[#344054]">{confirmDelete.title}</strong> will be permanently
              removed from Google Calendar.
            </p>
            <p className="m-0 text-xs text-[#a34b45]">This action cannot be undone.</p>
            <div className="mt-6 flex justify-center gap-2.5 max-[380px]:flex-col-reverse">
              <button
                className={`${ui.secondaryButton} min-w-[105px]`}
                disabled={Boolean(deletingKey)}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="inline-flex min-w-[125px] items-center justify-center gap-2 rounded-[9px] border-0 bg-[#b42318] px-4 py-[11px] text-[11px] font-semibold text-white shadow-[0_7px_18px_#b4231830] hover:bg-[#981b12] disabled:cursor-wait disabled:opacity-65"
                disabled={Boolean(deletingKey)}
                onClick={async () => {
                  const key = `${confirmDelete.id}-${confirmDelete.start?.toISOString()}`
                  setDeletingKey(key)
                  const deleted = await onDelete(confirmDelete)
                  setDeletingKey("")
                  if (deleted) {
                    setConfirmDelete(null)
                    setSelected(null)
                  }
                }}
              >
                <Icon name="trash" size={15} />
                {deletingKey ? "Deleting…" : "Delete event"}
              </button>
            </div>
          </section>
        </div>
      )}
    </article>
  )
}
