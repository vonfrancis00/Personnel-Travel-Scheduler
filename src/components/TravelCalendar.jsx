import { useState } from "react"
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
    green: "bg-[#dff4e9] text-[#177a55]",
    blue: "bg-[#e5efff] text-[#2859bf]",
    violet: "bg-[#eee8ff] text-[#6848bd]",
    orange: "bg-[#fff0dc] text-[#a76518]",
  })[color]
const detailColor = (color) =>
  ({ green: "bg-[#43aa78]", blue: "bg-[#4b78dc]", violet: "bg-[#795dc9]", orange: "bg-[#dd8c32]" })[
    color
  ]
export default function TravelCalendar({ events = [], loading, onAssign, onMonthChange }) {
  const [month, setMonth] = useState(() => new Date()),
    [selected, setSelected] = useState(null)
  const todayStart = startOfDay(new Date())
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
  return (
    <article className={`${ui.panel} overflow-hidden`}>
      <header className="flex min-h-[82px] items-center justify-between border-b border-[#e5e9f1] px-5 py-[17px]">
        <div className="flex items-center gap-3">
          <span className="grid size-[46px] place-items-center rounded-[11px] bg-[#edf3ff] text-[#3267e3]">
            <Icon name="calendar" />
          </span>
          <div>
            <h2 className="m-0 font-[Manrope] text-lg font-bold">Travel Calendar</h2>
            <p className="mb-0 mt-1 text-xs text-[#8b94a3]">
              {events.length} events synchronized from Google Calendar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[5px]">
          <button
            className={`${ui.secondaryButton} px-[17px] text-[13px]`}
            onClick={() => selectMonth(new Date())}
          >
            Today
          </button>
          <button
            className={`${ui.iconButton} size-10 border border-[#e5e9f1] p-0 text-[25px]`}
            onClick={() => move(-1)}
          >
            ‹
          </button>
          <button
            className={`${ui.iconButton} size-10 border border-[#e5e9f1] p-0 text-[25px]`}
            onClick={() => move(1)}
          >
            ›
          </button>
          <strong className="ml-2 min-w-[175px] text-right font-[Manrope] text-[17px] font-bold">
            {month.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </strong>
        </div>
      </header>
      {loading && (
        <div
          className="bg-[#edf3ff] px-5 py-[7px] text-[9px] text-[#3267e3]"
          role="status"
          aria-live="polite"
        >
          Synchronizing Google Calendar… The first sync may take a moment.
        </div>
      )}
      <div className="grid grid-cols-7 border-b border-[#e5e9f1] bg-[#fafbfc]">
        {DAYS.map((day) => (
          <span
            className="px-1 py-[13px] text-center text-[11px] font-bold text-[#778194]"
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
            visibleEventLimit = totalEvents > MAX_EVENT_ROWS ? MAX_EVENT_ROWS - 1 : MAX_EVENT_ROWS,
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
              className={`relative h-[124px] min-w-0 cursor-pointer overflow-visible border-b border-r border-[#e7eaf0] bg-white p-[9px] hover:bg-[#f8faff] [&:nth-child(7n)]:border-r-0 max-[1100px]:h-28 ${outside ? "bg-[#fafbfc] text-[#b8bec9]" : ""} ${past ? "bg-[#fafbfc] [&_.event]:opacity-45 [&_.event]:saturate-[.65] [&_.more]:opacity-45 [&_.more]:saturate-[.65]" : ""}`}
              onClick={() => openDay(date)}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => e.key === "Enter" && openDay(date)}
            >
              <span
                className={`mb-[5px] grid size-[27px] place-items-center rounded-full text-[13px] font-semibold ${today ? "bg-[#3267e3] text-white" : past ? "text-[#aeb5c1]" : ""}`}
              >
                {date.getDate()}
              </span>
              <div className="relative flex min-w-0 flex-col gap-1">
                {visibleEvents.map((entry, index) => (
                  <button
                    key={`${entry.event.id}-${entry.event.start?.toISOString()}-${index}`}
                    className={`event relative h-6 overflow-hidden text-ellipsis whitespace-nowrap rounded-[5px] border-0 px-2 py-1 text-left text-[11px] font-semibold [&_span]:mr-[5px] [&_span]:font-medium [&_span]:opacity-80 ${eventColor(colorForEvent(entry.event))} ${entry.span > 1 ? "z-[4] max-w-none w-[calc(var(--day-span)*(100%+18px)-18px)]" : "z-[5] w-full max-w-full"}`}
                    style={{
                      "--day-span": entry.span,
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
      {selected && (
        <div
          className={ui.backdrop}
          onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <section className="max-h-[calc(100vh-40px)] w-[min(620px,100%)] overflow-auto rounded-[17px] bg-white shadow-[0_24px_70px_#0711274f]">
            <header className="flex justify-between border-b border-[#e5e9f1] px-7 py-6">
              <div className="flex gap-[11px]">
                <span className="mt-1 size-[13px] rounded-[3px] bg-[#45ad7b]" />
                <div>
                  <h3 className="m-0 font-[Manrope] text-[19px] font-bold">
                    {selected.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                  <p className="mb-0 mt-1.5 text-xs text-[#8c95a4]">
                    {selected.events.length} scheduled event
                    {selected.events.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <button className={ui.iconButton} onClick={() => setSelected(null)}>
                <Icon name="close" />
              </button>
            </header>
            <div className="p-[14px]">
              {selected.events.length ? (
                selected.events.map((event, index) => (
                  <article
                    key={`${event.id}-${event.start?.toISOString()}-${index}`}
                    className={`grid grid-cols-[6px_1fr] gap-4 rounded-[10px] p-5 hover:bg-[#f7f9fc] ${selected.active === event ? "bg-[#f7f9fc]" : ""}`}
                  >
                    <span className={`rounded ${detailColor(COLORS[index % 4])}`} />
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
                        <div className="mt-[13px] whitespace-pre-wrap rounded-lg bg-[#f6f7f9] px-[14px] py-[13px] text-xs leading-[1.55] text-[#596375]">
                          {event.description}
                        </div>
                      )}
                      <button
                        className="mt-4 inline-flex items-center gap-2 rounded-[9px] border-0 bg-[#3267e3] px-[15px] py-[11px] text-xs font-bold text-white shadow-[0_5px_14px_#3267e326] hover:-translate-y-px hover:bg-[#285aca]"
                        onClick={() => {
                          setSelected(null)
                          onAssign(event)
                        }}
                      >
                        <Icon name="users" size={15} />{" "}
                        {event.personnel?.length ? "Change assignment" : "Assign Personnel"}
                      </button>
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
    </article>
  )
}
