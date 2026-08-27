import { useEffect, useMemo, useState } from "react"
import Icon from "../components/Icon"
import { Page } from "./TravelSchedules"
import { getInitials, personnel } from "../data/personnel"
import { ui } from "../styles"

const accents = [
  ["from-[#dbe8ff] to-[#edf3ff] text-[#2f63d8]", "bg-[#4878e8]"],
  ["from-[#eee8ff] to-[#f7f3ff] text-[#7052cf]", "bg-[#795fe0]"],
  ["from-[#dcf6ed] to-[#effbf7] text-[#178f68]", "bg-[#20aa7d]"],
  ["from-[#ffead2] to-[#fff5e9] text-[#bd741e]", "bg-[#df9137]"],
]
const eventTime = (event) => event.start?.getTime?.() ?? Infinity
const timeLabel = (event) =>
  event.allDay
    ? "All day"
    : event.start?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) ||
      "Time pending"

export default function Personnel({ calendar }) {
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("name")
  const [now] = useState(() => new Date())
  const directory = useMemo(
    () =>
      personnel.map((name, index) => {
        const events = calendar.events
          .filter((event) => event.personnel?.includes(name))
          .sort((a, b) => eventTime(a) - eventTime(b))
        const upcoming = events.filter((event) => (event.end || event.start) >= now)
        return { name, index, events, upcoming, next: upcoming[0] }
      }),
    [calendar.events, now],
  )
  const visiblePersonnel = useMemo(
    () =>
      directory
        .filter(
          ({ name, upcoming }) =>
            name.toLowerCase().includes(query.trim().toLowerCase()) &&
            (filter === "all" || (filter === "assigned" ? upcoming.length : !upcoming.length)),
        )
        .sort((a, b) =>
          sort === "workload"
            ? b.upcoming.length - a.upcoming.length || a.name.localeCompare(b.name)
            : sort === "next"
              ? eventTime(a.next || {}) - eventTime(b.next || {}) || a.name.localeCompare(b.name)
              : a.name.localeCompare(b.name),
        ),
    [directory, filter, query, sort],
  )
  const selectedProfile = directory.find(({ name }) => name === selectedPerson)
  const locations = new Set(
    directory.flatMap((item) => item.upcoming.map((event) => event.location).filter(Boolean)),
  ).size

  useEffect(() => {
    if (!selectedPerson) return undefined
    const close = (event) => event.key === "Escape" && setSelectedPerson(null)
    document.addEventListener("keydown", close)
    return () => document.removeEventListener("keydown", close)
  }, [selectedPerson])

  return (
    <Page
      title="Personnel Directory"
      sub="See team availability, workload, and travel coverage at a glance."
    >
      <section className="relative mb-5 overflow-hidden rounded-[22px] bg-[#101d3a] px-6 py-6 text-white shadow-[0_16px_40px_#172b5d20] max-[640px]:px-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_10%,#4779e766,transparent_30%),radial-gradient(circle_at_5%_130%,#785de34d,transparent_35%)]" />
        <div className="relative">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.15em] text-[#c5d6ff]">
              <i
                className={`size-1.5 rounded-full ${calendar.connected ? "bg-[#54d9aa]" : "bg-[#9ba5b7]"}`}
              />
              {calendar.connected ? "Live workforce overview" : "Directory overview"}
            </span>
            <h2 className="m-0 max-w-[510px] font-[Manrope] text-[24px] font-extrabold tracking-[-.035em]">
              Your travel team, ready when duty calls.
            </h2>
            <p className="mb-0 mt-2 max-w-[540px] text-[11px] leading-relaxed text-[#aebbd4]">
              Assignments are synchronized from Google Calendar and summarized by personnel.
            </p>
          </div>
        </div>
      </section>

      <div className="mb-4 flex items-center gap-2.5 max-[760px]:flex-wrap">
        <label className="flex h-[42px] min-w-[280px] flex-1 items-center gap-2 rounded-[11px] border border-[#e1e7f0] bg-white px-3.5 text-[#8d95a4] shadow-[0_2px_8px_#26395c08] focus-within:border-[#8caae9] focus-within:ring-4 focus-within:ring-[#3267e30b] max-[760px]:min-w-full">
          <Icon name="search" size={17} />
          <input
            className="w-full border-0 bg-transparent text-[11px] text-[#263247] outline-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by personnel name..."
          />
          {query && (
            <button
              type="button"
              className="border-0 bg-transparent p-1 text-[#8b95a5]"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </label>
        <div className="flex rounded-[11px] border border-[#e1e7f0] bg-white p-1 shadow-[0_2px_8px_#26395c08]">
          {[
            ["all", "All"],
            ["assigned", "Scheduled"],
            ["available", "Available"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-[8px] border-0 px-3 py-2 text-[9px] font-bold transition ${filter === value ? "bg-[#eaf1ff] text-[#3267e3]" : "bg-transparent text-[#788294]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex h-[42px] items-center gap-2 rounded-[11px] border border-[#e1e7f0] bg-white px-3 text-[#7e899a] shadow-[0_2px_8px_#26395c08]">
          <Icon name="filter" size={15} />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="border-0 bg-transparent text-[10px] font-semibold text-[#4d596d] outline-none"
          >
            <option value="name">Name</option>
            <option value="workload">Workload</option>
            <option value="next">Next trip</option>
          </select>
        </label>
      </div>
      <div className="mb-3 flex justify-between text-[10px] text-[#7d8798]">
        <span>
          <strong className="text-[#344057]">{visiblePersonnel.length}</strong> personnel shown
        </span>
        <span>
          {locations} upcoming destination{locations === 1 ? "" : "s"}
        </span>
      </div>

      {visiblePersonnel.length ? (
        <div className="grid grid-cols-2 gap-3.5 max-[820px]:grid-cols-1">
          {visiblePersonnel.map(({ name, index, upcoming, next }) => {
            const accent = accents[index % accents.length]
            return (
              <button
                type="button"
                className="group relative overflow-hidden rounded-[17px] border border-[#e3e8f1] bg-white p-0 text-left shadow-[0_3px_12px_#26395c08] transition hover:-translate-y-0.5 hover:border-[#cbd8f2] hover:shadow-[0_12px_30px_#26395c12]"
                key={name}
                onClick={() => setSelectedPerson(name)}
              >
                <i className={`absolute left-0 top-0 h-full w-[3px] ${accent[1]}`} />
                <div className="flex items-center gap-3.5 px-4 py-4">
                  <span
                    className={`grid size-[50px] shrink-0 place-items-center rounded-[15px] bg-gradient-to-br font-[Manrope] text-xs font-extrabold shadow-inner ${accent[0]}`}
                  >
                    {getInitials(name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="m-0 truncate font-[Manrope] text-[16px] font-extrabold text-[#202b40]">
                        {name}
                      </h3>
                      <Icon name="chevron" size={16} />
                    </div>
                    <p className="mb-0 mt-1 text-[11px] font-medium text-[#8993a4]">
                      Travel personnel • OCDRA III
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-[88px_1fr] border-t border-[#edf0f5] bg-[#fbfcfe]">
                  <div className="border-r border-[#edf0f5] px-4 py-3">
                    <strong className="block font-[Manrope] text-xl font-extrabold text-[#243149]">
                      {upcoming.length}
                    </strong>
                    <span className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#929cab]">
                      Upcoming
                    </span>
                  </div>
                  <div className="min-w-0 px-4 py-3">
                    {next ? (
                      <>
                        <span className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#738098]">
                          Next assignment
                        </span>
                        <strong className="mt-1 block truncate text-[12px] text-[#344158]">
                          {next.title}
                        </strong>
                        <span className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-[#8490a2]">
                          <Icon name="calendar" size={12} />{" "}
                          {next.start?.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          • {timeLabel(next)}
                        </span>
                      </>
                    ) : (
                      <div className="flex h-full items-center gap-2 text-[#15996a]">
                        <span className="grid size-7 place-items-center rounded-full bg-[#e7f8f1]">
                          <Icon name="check" size={14} />
                        </span>
                        <span>
                          <strong className="block text-[10px]">Available</strong>
                          <small className="text-[8px] text-[#7c8b8a]">
                            No upcoming assignment
                          </small>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className={`${ui.panel} grid min-h-[210px] place-content-center text-center`}>
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#edf3ff] text-[#3267e3]">
            <Icon name="search" />
          </span>
          <strong className="mt-3 text-[12px] text-[#354158]">No personnel found</strong>
          <p className="mb-0 mt-1 text-[10px] text-[#8a94a4]">
            Try another name or availability filter.
          </p>
        </div>
      )}

      {selectedProfile && (
        <div
          className={ui.backdrop}
          onMouseDown={(event) => event.target === event.currentTarget && setSelectedPerson(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="max-h-[calc(100vh-32px)] w-[min(680px,100%)] overflow-auto rounded-[20px] bg-white shadow-[0_24px_70px_#0711274f]"
          >
            <header className="relative overflow-hidden bg-[#101d3a] px-6 py-6 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,#4779e766,transparent_32%)]" />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid size-14 place-items-center rounded-[16px] bg-white/10 font-[Manrope] text-sm font-extrabold ring-1 ring-white/15">
                    {getInitials(selectedPerson)}
                  </span>
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-[.14em] text-[#9eb2db]">
                      Personnel profile
                    </span>
                    <h2 className="mb-1 mt-1 font-[Manrope] text-xl font-extrabold">
                      {selectedPerson}
                    </h2>
                    <p className="m-0 text-[10px] text-[#aebbd4]">OCDRA III • Travel personnel</p>
                  </div>
                </div>
                <button
                  className="grid size-9 place-items-center rounded-[10px] border border-white/10 bg-white/[.07] text-white"
                  onClick={() => setSelectedPerson(null)}
                  aria-label="Close schedule"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="relative mt-5 grid grid-cols-3 gap-2">
                {[
                  [selectedProfile.upcoming.length, "Upcoming"],
                  [selectedProfile.events.length, "All assignments"],
                  [
                    new Set(selectedProfile.events.map((e) => e.location).filter(Boolean)).size,
                    "Destinations",
                  ],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-[11px] border border-white/10 bg-white/[.06] px-3 py-2.5"
                  >
                    <strong className="block text-base">{value}</strong>
                    <span className="text-[8px] uppercase tracking-[.08em] text-[#9eafd0]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </header>
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="m-0 font-[Manrope] text-[13px] font-extrabold text-[#263249]">
                  Assignment timeline
                </h3>
                <span className="rounded-full bg-[#edf3ff] px-2.5 py-1 text-[8px] font-bold text-[#3267e3]">
                  Google Calendar
                </span>
              </div>
              {selectedProfile.events.length ? (
                <div className="space-y-2.5">
                  {selectedProfile.events.map((event, index) => {
                    const upcoming = (event.end || event.start) >= now
                    return (
                      <article
                        className={`grid grid-cols-[54px_1fr_auto] items-center gap-3 rounded-[13px] border p-3.5 max-[520px]:grid-cols-[48px_1fr] ${upcoming ? "border-[#e2e8f2] bg-[#fbfcfe]" : "border-[#edf0f4] bg-[#f8f9fb] opacity-65"}`}
                        key={`${event.id}-${eventTime(event)}-${index}`}
                      >
                        <div
                          className={`grid h-[52px] place-content-center rounded-[10px] text-center ${upcoming ? "bg-[#eaf1ff] text-[#3267e3]" : "bg-[#e9ecf1] text-[#707b8d]"}`}
                        >
                          <strong className="font-[Manrope] text-lg font-extrabold leading-none">
                            {event.start?.getDate() || "–"}
                          </strong>
                          <span className="mt-1 text-[8px] uppercase">
                            {event.start?.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="m-0 truncate font-[Manrope] text-[11px] font-bold text-[#2d394f]">
                            {event.title}
                          </h4>
                          <p className="mb-0 mt-1.5 flex items-center gap-1.5 text-[9px] text-[#7b8799]">
                            <Icon name="clock" size={13} />
                            {timeLabel(event)}
                          </p>
                          <p className="mb-0 mt-1 flex items-center gap-1.5 truncate text-[9px] text-[#7b8799]">
                            <Icon name="location" size={13} />
                            {event.location || "Location not specified"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[8px] font-bold max-[520px]:col-start-2 max-[520px]:w-fit ${upcoming ? "bg-[#e7f8f1] text-[#15996a]" : "bg-[#e9ecf1] text-[#737e90]"}`}
                        >
                          {upcoming ? "Upcoming" : "Completed"}
                        </span>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="grid min-h-[180px] place-content-center text-center text-[#8993a4]">
                  <Icon name="calendar" size={28} />
                  <strong className="mt-3 text-[11px] text-[#465164]">No scheduled events</strong>
                  <p className="mb-0 mt-1 text-[9px]">
                    This personnel has no Calendar assignments.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </Page>
  )
}
