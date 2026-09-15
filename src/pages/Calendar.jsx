import TravelCalendar from "../components/TravelCalendar"
import { ui } from "../styles"

export default function Calendar({
  calendar,
  connectCalendar,
  refreshCalendar,
  loadCalendarMonth,
  openTravelModal,
  removeTravelEvent,
  addCalendarEvent,
}) {
  return (
    <div className="space-y-5">
      {calendar.error && (
        <div className={ui.error}>
          <span>{calendar.error}</span>
          <button
            className={`${ui.textButton} whitespace-nowrap text-[#a74343]`}
            onClick={calendar.connected ? () => refreshCalendar() : connectCalendar}
          >
            {calendar.connected ? "Try again" : "Connect calendar"}
          </button>
        </div>
      )}
      <TravelCalendar
        events={calendar.events}
        loading={calendar.loading}
        onAssign={openTravelModal}
        onMonthChange={loadCalendarMonth}
        onDelete={removeTravelEvent}
        onCreateEvent={addCalendarEvent}
      />
    </div>
  )
}
