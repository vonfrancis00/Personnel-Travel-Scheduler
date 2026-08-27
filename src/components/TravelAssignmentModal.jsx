import { useState } from "react"
import Icon from "./Icon"
import { personnel } from "../data/personnel"
import { ui } from "../styles"

const initialForm = { eventKey: "", personnel: [], notes: "" }

export default function TravelAssignmentModal({
  open,
  onClose,
  onSubmit,
  saving,
  error,
  events = [],
  selectedEvent,
}) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    eventKey: selectedEvent ? `${selectedEvent.id}::${selectedEvent.start?.toISOString()}` : "",
    personnel: selectedEvent?.personnel?.filter((name) => personnel.includes(name)) || [],
    notes: selectedEvent?.assignmentNotes || "",
  }))
  const isEditing = Boolean(selectedEvent?.personnel?.length)
  if (!open) return null
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const changeCalendarEvent = (input) => {
    setForm((current) => ({
      ...current,
      eventKey: input.target.value,
    }))
  }
  const togglePersonnel = (name) =>
    setForm((current) => ({
      ...current,
      personnel: current.personnel.includes(name)
        ? current.personnel.filter((item) => item !== name)
        : [...current.personnel, name],
    }))
  const submit = async (event) => {
    event.preventDefault()
    if (!form.personnel.length) return
    const [eventId, eventStart] = form.eventKey.split("::")
    const selected = events.find(
      (calendarEvent) =>
        calendarEvent.id === eventId && calendarEvent.start?.toISOString() === eventStart,
    )
    if (!selected) return
    const success = await onSubmit({
      ...form,
      eventId,
      eventStart,
      personnel: form.personnel.join(", "),
    })
    if (success) {
      setForm(initialForm)
      onClose()
    }
  }
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#0b1325a8] p-5 backdrop-blur-[4px] max-[520px]:p-2"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="max-h-[calc(100vh-40px)] w-[min(780px,100%)] overflow-auto rounded-[18px] bg-white shadow-[0_28px_80px_#07112755] max-[520px]:max-h-[calc(100dvh-16px)] max-[520px]:rounded-[14px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="travel-modal-title"
      >
        <header className="flex justify-between gap-5 border-b border-[#e5e9f1] px-[25px] pb-[19px] pt-[23px] max-[520px]:gap-3 max-[520px]:px-4 max-[520px]:py-4">
          <div>
            <span className={ui.pill}>GOOGLE CALENDAR</span>
            <h2 className="mb-1 mt-[5px] font-[Manrope] text-xl font-extrabold max-[520px]:text-lg" id="travel-modal-title">
              {isEditing ? "Change Travel Assignment" : "New Travel Assignment"}
            </h2>
            <p className="m-0 text-[10px] text-[#7f8898]">Select a Calendar event, then assign the personnel who will attend.</p>
          </div>
          <button className={ui.iconButton} onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <form className="px-[25px] py-[22px] max-[520px]:px-4 max-[520px]:py-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-[15px] max-[520px]:grid-cols-1">
            <label className="col-span-full grid w-full gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[.05em] text-[#5e6879]">Google Calendar Event *</span>
              <select className={ui.formControl} name="eventKey" value={form.eventKey} onChange={changeCalendarEvent} required>
                <option value="">Select an event</option>
                {events.map((event) => (
                  <option
                    key={`${event.id}-${event.start?.toISOString()}`}
                    value={`${event.id}::${event.start?.toISOString()}`}
                  >
                    {event.start?.toLocaleString(
                      "en-PH",
                      event.allDay
                        ? { dateStyle: "medium" }
                        : { dateStyle: "medium", timeStyle: "short" },
                    )}{" "}
                    — {event.title}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="col-span-full m-0 min-w-0 border-0 p-0">
              <legend className="mb-2 text-[9px] font-bold uppercase tracking-[.05em] text-[#5e6879]">
                Personnel * <small className="ml-[5px] font-medium normal-case tracking-normal text-[#959dac]">Select one or more</small>
              </legend>
              <div className="grid max-h-[220px] grid-cols-[repeat(auto-fit,minmax(190px,1fr))] items-stretch gap-2 overflow-auto rounded-[10px] border border-[#dfe4ec] bg-[#fbfcfe] p-2.5 max-[520px]:grid-cols-1">
                {personnel.map((name) => (
                  <label key={name} className={`flex min-h-[42px] cursor-pointer items-center gap-[9px] rounded-lg border px-[11px] py-[9px] text-[10px] leading-[1.35] transition hover:border-[#b8c9ee] hover:bg-[#f8faff] ${form.personnel.includes(name) ? "border-[#8ba9ed] bg-[#edf3ff] font-semibold text-[#2f5fcf]" : "border-[#edf0f5] bg-white text-[#525d6f]"}`}>
                    <input
                      className="pointer-events-none absolute opacity-0" type="checkbox"
                      checked={form.personnel.includes(name)}
                      onChange={() => togglePersonnel(name)}
                    />
                    <span className={`grid size-[19px] shrink-0 place-items-center rounded-[5px] border ${form.personnel.includes(name) ? "border-[#3267e3] bg-[#3267e3] text-white [&_svg]:visible" : "border-[#c7cfdb] bg-white text-transparent [&_svg]:invisible"}`}>
                      <Icon name="check" size={13} />
                    </span>
                    <span className="min-w-0 break-words">{name}</span>
                  </label>
                ))}
              </div>
              {form.personnel.length > 0 && <p className="mx-0.5 mb-0 mt-[7px] text-[9px] font-semibold text-[#4773dc]">{form.personnel.length} personnel selected</p>}
            </fieldset>
            <label className="col-span-full grid w-full gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[.05em] text-[#5e6879]">Notes</span>
              <textarea className={`${ui.formControl} resize-y`} name="notes" value={form.notes} onChange={change} rows="3" />
            </label>
          </div>
          {error && <div className={`${ui.error} mb-0 mt-4`}>{error}</div>}
          <footer className="flex justify-end gap-[9px] pt-5 max-[520px]:flex-col-reverse max-[520px]:[&>button]:w-full">
            <button type="button" className={ui.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button
              className={ui.primaryButton}
              disabled={saving || !form.personnel.length || !form.eventKey}
            >
              <Icon name="calendar" size={17} />
              {saving
                ? "Saving assignment…"
                : isEditing
                  ? "Save changes"
                  : "Assign to Calendar event"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
