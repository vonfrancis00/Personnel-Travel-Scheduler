import { useMemo, useState } from "react"
import Icon from "../components/Icon"
import { Page } from "./TravelSchedules"
import { getInitials, personnel } from "../data/personnel"
import { colorClass, ui } from "../styles"

const colors = ["blue", "amber", "violet", "green"]

export default function Personnel({ calendar }) {
  const [selectedPerson, setSelectedPerson] = useState(null)
  const schedules = useMemo(() => {
    if (!selectedPerson) return []
    return calendar.events
      .filter((event) => event.personnel?.includes(selectedPerson))
      .sort((first, second) => {
        const firstStart = first.start?.getTime()
        const secondStart = second.start?.getTime()
        const firstTime = Number.isFinite(firstStart) ? firstStart : Infinity
        const secondTime = Number.isFinite(secondStart) ? secondStart : Infinity
        return firstTime - secondTime
      })
  }, [calendar.events, selectedPerson])

  return (
    <Page
      title="Personnel directory"
      sub={`${personnel.length} personnel available for travel assignment`}
    >
      <div className={ui.toolbar}>
        <label className={ui.search}>
          <Icon name="search" size={18} />
          <input placeholder="Search personnel..." />
        </label>
        <button className={`${ui.primaryButton} ml-auto`}>
          <Icon name="plus" size={17} /> Add personnel
        </button>
      </div>
      <div className="grid grid-cols-2 gap-[15px] max-[760px]:grid-cols-1">
        {personnel.map((name, index) => {
          const eventCount = calendar.events.filter((event) =>
            event.personnel?.includes(name),
          ).length
          return (
            <article
              className={`${ui.panel} flex cursor-pointer items-center gap-[14px] p-[19px] transition hover:-translate-y-0.5 hover:border-[#cbd8f5] hover:shadow-[0_10px_28px_#26395c12] [&>div]:flex-1 [&>svg]:text-[#9aa3b2]`}
              key={name}
              role="button"
              tabIndex="0"
              onClick={() => setSelectedPerson(name)}
              onKeyDown={(event) => event.key === "Enter" && setSelectedPerson(name)}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-[14px] text-xs font-bold ${colorClass(colors[index % colors.length])}`}>
                {getInitials(name)}
              </span>
              <div>
                <h3 className="m-0 font-[Manrope] text-xs font-bold">{name}</h3>
                <p className="mb-2 mt-1 text-[9px] text-[#8b94a3]">Personnel</p>
                <span className={`inline-flex items-center rounded-[10px] px-[7px] py-1 text-[8px] font-semibold ${eventCount ? "bg-[#edf1f7] text-[#657084]" : "bg-[#e7f8f1] text-[#15996a]"}`}>
                  <i className={`mr-[5px] inline-block size-1.5 rounded-full ${eventCount ? "bg-[#7d8798]" : "bg-[#37c992]"}`} />
                  {eventCount
                    ? `${eventCount} scheduled event${eventCount === 1 ? "" : "s"}`
                    : "No scheduled events"}
                </span>
              </div>
              <Icon name="chevron" size={18} />
            </article>
          )
        })}
      </div>
      {selectedPerson && (
        <div
          className={ui.backdrop}
          onMouseDown={(event) => event.target === event.currentTarget && setSelectedPerson(null)}
        >
          <section className="max-h-[calc(100vh-40px)] w-[min(640px,100%)] overflow-auto rounded-[18px] bg-white shadow-[0_24px_70px_#0711274f]">
            <header className="flex items-center justify-between border-b border-[#e5e9f1] px-[25px] py-[22px]">
              <div className="flex items-center gap-[13px]">
                <span className={`grid size-12 place-items-center rounded-[14px] text-xs font-bold ${colorClass("blue")}`}>{getInitials(selectedPerson)}</span>
                <div>
                  <h2 className="m-0 font-[Manrope] text-lg font-bold">{selectedPerson}</h2>
                  <p className="mb-0 mt-1 text-[11px] text-[#8a94a4]">
                    {schedules.length} scheduled event{schedules.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <button
                className={ui.iconButton}
                onClick={() => setSelectedPerson(null)}
                aria-label="Close schedule"
              >
                <Icon name="close" />
              </button>
            </header>
            <div className="p-3">
              {schedules.length ? (
                schedules.map((event, index) => (
                  <article className="grid grid-cols-[62px_1fr] gap-4 border-b border-[#edf0f5] p-4 last:border-b-0 hover:rounded-[10px] hover:bg-[#f8faff]" key={`${event.id}-${event.start?.toISOString()}-${index}`}>
                    <div className="grid h-[58px] place-content-center rounded-[10px] bg-[#edf3ff] text-center text-[#3267e3]">
                      <strong className="font-[Manrope] text-xl font-extrabold leading-none">{event.start?.getDate()}</strong>
                      <span className="mt-[5px] text-[9px] uppercase">
                        {event.start?.toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="[&_p]:my-1.5 [&_p]:flex [&_p]:items-center [&_p]:gap-[7px] [&_p]:text-[11px] [&_p]:text-[#737d8e]">
                      <h3 className="mb-2 mt-px font-[Manrope] text-sm font-bold">{event.title}</h3>
                      <p>
                        <Icon name="clock" size={16} />
                        {event.allDay
                          ? "All day"
                          : event.start?.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                      </p>
                      <p>
                        <Icon name="location" size={16} />
                        {event.location || "Location not specified"}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="p-[35px] text-center text-[#8993a4] [&_strong]:mb-1 [&_strong]:mt-[9px] [&_strong]:block [&_strong]:text-[11px] [&_strong]:text-[#465164] [&_p]:m-0 [&_p]:text-[9px]">
                  <Icon name="calendar" size={34} />
                  <strong>No scheduled events</strong>
                  <p>This personnel has no current Google Calendar assignments.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </Page>
  )
}
