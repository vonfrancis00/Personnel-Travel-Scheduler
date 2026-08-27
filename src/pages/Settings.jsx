import { Page } from "./TravelSchedules"
import Icon from "../components/Icon"
import { statusClass, ui } from "../styles"
export default function Settings({ calendar, connectCalendar, refreshCalendar }) {
  return (
    <Page
      title="System settings"
      sub="Configure integrations, notifications, and workspace preferences"
    >
      <div className="grid grid-cols-[220px_1fr] gap-4 max-[760px]:grid-cols-1">
        <section className={`${ui.panel} h-max p-2.5 max-[760px]:flex max-[760px]:overflow-auto [&_button]:flex [&_button]:w-full [&_button]:items-center [&_button]:gap-[13px] [&_button]:whitespace-nowrap [&_button]:rounded-[10px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-[13px] [&_button]:py-3 [&_button]:text-left [&_button]:text-[13px] [&_button]:font-medium [&_button]:text-[#6f7888]`}>
          <button className="!bg-[#edf3ff] !text-[#3267e3]">
            <Icon name="sync" /> Integrations
          </button>
          <button>
            <Icon name="bell" /> Notifications
          </button>
          <button>
            <Icon name="settings" /> Preferences
          </button>
        </section>
        <section className={`${ui.panel} px-[22px] py-2`}>
          <div className="flex items-start gap-[14px] py-5 [&>div]:flex-1 [&_h3]:m-0 [&_h3]:font-[Manrope] [&_h3]:text-xs [&_h3]:font-bold [&_p]:mb-2 [&_p]:mt-1 [&_p]:max-w-[480px] [&_p]:text-[9px] [&_p]:leading-normal [&_p]:text-[#8b94a3]">
            <span className="grid size-[38px] place-items-center rounded-[10px] border border-[#e5e9f1] font-extrabold text-[#4285f4]">G</span>
            <div>
              <h3>Google Calendar</h3><p>Read upcoming events from your primary or configured shared calendar.</p>
              <span className={statusClass(calendar.connected ? "confirmed" : "draft")}>
                <i />
                {calendar.connected ? "Connected" : "Not connected"}
              </span>
              {calendar.error && <p className="!text-[#b14b4b]">{calendar.error}</p>}
            </div>
            <button
              className={ui.secondaryButton}
              onClick={calendar.connected ? () => refreshCalendar() : connectCalendar}
              disabled={calendar.loading}
            >
              {calendar.loading ? "Please wait…" : calendar.connected ? "Sync now" : "Connect"}
            </button>
          </div>
          <hr className="border-0 border-t border-[#e5e9f1]" />
          <div className="flex items-start gap-[14px] py-5 [&>div]:flex-1 [&_h3]:m-0 [&_h3]:font-[Manrope] [&_h3]:text-xs [&_h3]:font-bold [&_p]:mb-2 [&_p]:mt-1 [&_p]:text-[9px] [&_p]:text-[#8b94a3]">
            <span className="grid size-[38px] place-items-center rounded-[10px] bg-[#edf3ff] text-[#3267e3]">
              <Icon name="calendar" />
            </span>
            <div>
              <h3>Calendar source</h3>
              <p>
                {import.meta.env.VITE_GOOGLE_CALENDAR_ID || "Primary calendar"} · Read-only access
              </p>
            </div>
          </div>
        </section>
      </div>
    </Page>
  )
}
