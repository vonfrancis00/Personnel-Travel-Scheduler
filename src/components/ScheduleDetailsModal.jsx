import { useEffect, useState } from "react"
import Icon from "./Icon"
import { ui } from "../styles"

const asDate = (value) => (value instanceof Date ? value : new Date(value))
const place = (value) =>
  /^https?:\/\//i.test(String(value || "")) ? "Online meeting" : value || "Location not specified"

export default function ScheduleDetailsModal({
  event,
  connected,
  onClose,
  onAssign,
  onDelete,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!event) return undefined
    const closeOnEscape = (keyboardEvent) => {
      if (keyboardEvent.key === "Escape" && !deleting) {
        if (confirmDelete) setConfirmDelete(false)
        else onClose()
      }
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [confirmDelete, deleting, event, onClose])

  if (!event) return null

  const start = asDate(event.start)
  const people = event.personnel || []
  const isPast = new Date(start.getFullYear(), start.getMonth(), start.getDate()) <
    new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  return (
    <div className={ui.backdrop} onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && !deleting && onClose()}>
      <section className="max-h-[calc(100dvh-32px)] w-[min(650px,100%)] overflow-auto rounded-[22px] bg-white shadow-[0_28px_90px_#0711275c] max-[520px]:rounded-[16px]" role="dialog" aria-modal="true" aria-labelledby="schedule-detail-title">
        <header className="relative flex justify-between gap-4 overflow-hidden bg-gradient-to-br from-[#13264f] via-[#234a99] to-[#4f59cc] px-7 py-7 text-white max-[520px]:px-4 max-[520px]:py-5">
          <span className="absolute -right-12 -top-20 size-48 rounded-full border-[30px] border-white/[.05]" />
          <div className="relative flex gap-[13px]">
            <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-[11px] bg-white/10 text-[#dce7ff]"><Icon name="calendar" size={18} /></span>
            <div>
              <p className="mb-2 mt-0 text-[9px] font-bold uppercase tracking-[.15em] text-[#b9cbf3]">Daily itinerary</p>
              <h2 id="schedule-detail-title" className="m-0 font-[Manrope] text-[20px] font-extrabold tracking-[-.02em] max-[520px]:text-base">
                {start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </h2>
              <p className="mb-0 mt-1.5 text-[10px] text-[#c8d7f5]">1 scheduled event</p>
            </div>
          </div>
          <button type="button" className="relative grid size-9 shrink-0 place-items-center rounded-full border-0 bg-white/10 text-white hover:bg-white/20" onClick={onClose} aria-label="Close daily itinerary"><Icon name="close" /></button>
        </header>

        <div className="p-4 max-[520px]:p-2.5">
          <article className="relative overflow-hidden rounded-[16px] bg-[#f7f9fd] px-7 py-6 pl-[52px] max-[520px]:px-4 max-[520px]:py-5 max-[520px]:pl-9">
            <span className="absolute bottom-6 left-[26px] top-6 w-[6px] rounded-full bg-[#76e2c1] max-[520px]:left-4" />
            <h3 className="m-0 font-[Manrope] text-[16px] font-extrabold text-[#202b42]">{event.title || "Untitled event"}</h3>
            <div className="mt-4 space-y-3 text-[12px] text-[#7b879b]">
              <p className="m-0 flex items-center gap-3"><Icon name="clock" size={17} />{event.allDay ? "All day" : start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
              <p className="m-0 flex items-center gap-3"><Icon name="location" size={17} />{place(event.location)}</p>
              <p className="m-0 flex items-center gap-3"><Icon name="users" size={18} />{people.join(", ") || "Unassigned"}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button type="button" className="inline-flex items-center gap-2 rounded-[9px] border-0 bg-[#3267e3] px-[15px] py-[11px] text-xs font-bold text-white shadow-[0_5px_14px_#3267e326] hover:-translate-y-px hover:bg-[#285aca] disabled:cursor-not-allowed disabled:bg-[#aeb7c8] disabled:shadow-none disabled:hover:translate-y-0" disabled={!connected || isPast} title={!connected ? "Connect the calendar to edit assignments." : isPast ? "Past assignments cannot be changed." : undefined} onClick={() => { onClose(); onAssign(event) }}>
                <Icon name="users" size={15} />{people.length ? "Change assignment" : "Assign personnel"}
              </button>
              <button type="button" className="inline-flex items-center rounded-[9px] border border-[#e5a7a7] bg-white px-[15px] py-[11px] text-xs font-bold text-[#b42318] hover:bg-[#fff1f0] disabled:cursor-not-allowed disabled:opacity-50" disabled={!connected || deleting} onClick={() => setConfirmDelete(true)}>Delete event</button>
            </div>
          </article>
        </div>
      </section>

      {confirmDelete && (
        <div className="fixed inset-0 z-[140] grid place-items-center bg-[#0b13258f] p-5 backdrop-blur-[3px]" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && !deleting && setConfirmDelete(false)}>
          <section className="w-[min(430px,100%)] rounded-[18px] bg-white p-7 text-center shadow-[0_24px_70px_#0711275c]" role="alertdialog" aria-modal="true" aria-labelledby="confirm-schedule-delete">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[#fff0ef] text-[#b42318]"><Icon name="trash" size={25} /></div>
            <h2 id="confirm-schedule-delete" className="m-0 font-[Manrope] text-xl font-extrabold text-[#172033]">Delete this event?</h2>
            <p className="mb-0 mt-3 text-[13px] leading-relaxed text-[#6f798a]"><strong className="text-[#344054]">{event.title || "Untitled event"}</strong> will be permanently removed from Google Calendar.</p>
            <div className="mt-6 flex justify-center gap-2.5">
              <button type="button" className={`${ui.secondaryButton} min-w-[105px]`} disabled={deleting} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button type="button" className="inline-flex min-w-[125px] items-center justify-center gap-2 rounded-[9px] border-0 bg-[#b42318] px-4 py-[11px] text-[11px] font-semibold text-white disabled:cursor-wait disabled:opacity-65" disabled={deleting} onClick={async () => { setDeleting(true); const deleted = await onDelete(event); setDeleting(false); if (deleted) onClose() }}><Icon name="trash" size={15} />{deleting ? "Deleting…" : "Delete event"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
