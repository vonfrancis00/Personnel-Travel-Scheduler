import Icon from "../components/Icon"
import TravelCalendar from "../components/TravelCalendar"
import { ui } from "../styles"
export default function Dashboard({
  calendar,
  openTravelModal,
  refreshCalendar,
  loadCalendarMonth,
}) {
  return (
    <div className="dashboard">
      <section className={`${ui.pageHeading} mb-[14px]`}>
        <div>
          <span className={`${ui.pill} hidden`}>GOOGLE CALENDAR</span>
          <h1 className={`${ui.pageTitle} mt-[3px]`}>Personnel Travel Calendar</h1>
          <p className={ui.pageSubtitle}>
            {calendar.loading
              ? "Synchronizing schedules…"
              : `${calendar.events.length} upcoming events available.`}
          </p>
        </div>
        <button className={`${ui.primaryButton} max-[520px]:mt-4`} onClick={openTravelModal} disabled={!calendar.connected}>
          <Icon name="plus" size={18} /> Assign Personnel to an Event
        </button>
      </section>
      {calendar.error && (
        <div className={ui.error}>
          <span>{calendar.error}</span>
          <button className={`${ui.textButton} whitespace-nowrap text-[#a74343]`} onClick={() => refreshCalendar()}>
            Try again
          </button>
        </div>
      )}
      <TravelCalendar
        events={calendar.events}
        loading={calendar.loading}
        onAssign={openTravelModal}
        onMonthChange={loadCalendarMonth}
      />
    </div>
  )
}
