import Icon from "./Icon"
import { ui } from "../styles"

const menu = [
  { name: "Dashboard", icon: "dashboard", hint: "Overview" },
  { name: "Calendar", icon: "calendar", hint: "Travel calendar" },
  { name: "Travel Schedules", icon: "plane", hint: "All itineraries" },
  { name: "Personnel", icon: "users", hint: "Team directory" },
  { name: "Settings", icon: "settings", hint: "Preferences" },
]

export default function Sidebar({ activePage, setActivePage, open, onClose, calendar }) {
  const connected = calendar.connected
  return (
    <>
      <div
        className={`fixed inset-0 z-25 bg-[#07101dcc] backdrop-blur-sm transition-all duration-500 min-[761px]:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0 backdrop-blur-none"}`}
        onClick={onClose}
      />
      <aside className={`sidebar-shell fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col overflow-hidden border-r border-white/[.07] bg-[#0c162a] px-4 pb-[18px] text-white shadow-[18px_0_60px_#08112628] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] max-[760px]:-translate-x-[108%] ${open ? "max-[760px]:translate-x-0" : ""}`}>
        <div className="sidebar-aurora pointer-events-none absolute -left-24 -top-32 size-72 rounded-full bg-[#3267e3]/25 blur-[65px]" />
        <div className="sidebar-aurora-delayed pointer-events-none absolute -right-28 top-[38%] size-64 rounded-full bg-[#7958e8]/15 blur-[75px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[.035] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="relative flex h-[92px] items-center gap-3 border-b border-white/[.08] px-2">
          <div className="sidebar-logo relative grid size-[44px] shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[#4b83fa] via-[#4e6de7] to-[#7a5ae8] shadow-[0_10px_28px_#315fd855]">
            <span className="absolute inset-px rounded-[13px] border border-white/20" />
            <Icon name="plane" size={21} />
          </div>
          <div className="min-w-0 [&_strong]:block [&_strong]:font-[Manrope] [&_strong]:text-[17px] [&_strong]:tracking-[-.02em] [&_span]:mt-0.5 [&_span]:block [&_span]:text-[9px] [&_span]:uppercase [&_span]:tracking-[.11em] [&_span]:text-[#77859f]">
            <strong>TravelOps</strong><span>Personnel Management</span>
          </div>
          <button className={`${ui.iconButton} ml-auto hidden !bg-white/[.06] !text-[#aebbd0] hover:!rotate-90 hover:!bg-white/[.12] hover:!text-white max-[760px]:grid`} onClick={onClose} aria-label="Close navigation">
            <Icon name="close" />
          </button>
        </div>

        <div className="relative mx-2 mb-3 mt-5 flex items-center gap-2">
          <p className="m-0 text-[9px] font-bold uppercase tracking-[.19em] text-[#61708c]">Workspace</p>
          <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        <nav className="relative grid gap-1.5" aria-label="Main navigation">
          {menu.map((item, index) => {
            const active = activePage === item.name
            return (
              <button
                key={item.name}
                onClick={() => setActivePage(item.name)}
                style={{ "--item-delay": `${80 + index * 45}ms` }}
                aria-current={active ? "page" : undefined}
                className={`sidebar-nav-item group relative flex items-center gap-3 overflow-hidden rounded-[12px] border px-2.5 py-2.5 text-left transition-all duration-300 ${active ? "border-[#7296ff24] bg-gradient-to-r from-[#376ee329] to-[#705de510] text-white shadow-[inset_0_1px_0_#ffffff0a,0_7px_20px_#050b1820]" : "border-transparent bg-transparent text-[#8997ae] hover:translate-x-1 hover:border-white/[.06] hover:bg-white/[.045] hover:text-white"}`}
              >
                <span className={`relative grid size-9 shrink-0 place-items-center rounded-[10px] transition-all duration-300 group-hover:scale-105 ${active ? "bg-gradient-to-br from-[#477cf0] to-[#6559dd] text-white shadow-[0_6px_15px_#3267e33d]" : "bg-white/[.045] text-[#8391aa] group-hover:bg-white/[.08] group-hover:text-[#a9c0ff]"}`}>
                  <Icon name={item.icon} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[12px] font-semibold">{item.name}</strong>
                  <small className={`mt-0.5 block truncate text-[8px] font-medium tracking-[.03em] transition-colors ${active ? "text-[#91a9db]" : "text-[#5f6d85] group-hover:text-[#75849d]"}`}>{item.hint}</small>
                </span>
                <span className={`transition-all duration-300 ${active ? "text-[#91abed]" : "-translate-x-1 text-[#4e5d75] opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}><Icon name="chevron" size={13} /></span>
                {active && <span className="sidebar-active-line absolute bottom-2 right-0 top-2 w-[3px] rounded-l-full bg-gradient-to-b from-[#86a8ff] to-[#725ee9] shadow-[0_0_13px_#7298ff]" />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-status relative mt-auto overflow-hidden rounded-[15px] border border-white/[.08] bg-white/[.035] p-[15px] shadow-[inset_0_1px_0_#ffffff08] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/[.13] hover:bg-white/[.05]">
          <span className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-[#2aaa7c]/10 blur-2xl" />
          <span className={`relative mb-[11px] grid size-[33px] place-items-center rounded-[10px] ${connected ? "bg-[#20a97920] text-[#56d7a7]" : "bg-[#ffffff10] text-[#8792a6]"} ${calendar.loading ? "sidebar-syncing" : ""}`}><Icon name="sync" /></span>
          <strong className="relative block text-[11px]">{connected ? "Calendar connected" : "Calendar not connected"}</strong>
          <p className="relative mb-2.5 mt-[5px] text-[10px] leading-normal text-[#7f8ba1]">
            {connected ? `${calendar.events.length} upcoming events loaded.` : "Connect your Google account in Settings."}
          </p>
          <span className="relative text-[9px] text-[#69758c]">
            <i className={`mr-[6px] inline-block size-1.5 rounded-full ${connected ? "sidebar-live-dot bg-[#37c992]" : "bg-[#8792a6]"}`} />
            {calendar.loading ? "Syncing…" : connected ? "Synced this session" : "Setup required"}
          </span>
        </div>

        <div className="group relative mt-[14px] flex items-center gap-[9px] border-t border-white/[.07] px-[7px] pt-[14px]">
          <div className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-gradient-to-br from-[#2d3d5b] to-[#202c43] text-[9px] font-bold text-[#b9c5d9] ring-1 ring-white/[.06] transition group-hover:ring-white/[.13]">OT</div>
          <div className="min-w-0 flex-1 [&_strong]:block [&_strong]:truncate [&_strong]:text-[10px] [&_span]:mt-[3px] [&_span]:block [&_span]:text-[9px] [&_span]:text-[#69758c]">
            <strong>Office of Commissioner Desiderio R. Apag III</strong><span>Central Office</span>
          </div>
          <span className="text-[#586780] transition-transform group-hover:translate-x-0.5 group-hover:text-[#91a4c4]"><Icon name="chevron" size={15} /></span>
        </div>
      </aside>
    </>
  )
}
