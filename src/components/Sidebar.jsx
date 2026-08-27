import Icon from "./Icon"
import { ui } from "../styles"
const menu = [
  { name: "Dashboard", icon: "dashboard" },
  { name: "Travel Schedules", icon: "calendar" },
  { name: "Personnel", icon: "users" },
  { name: "Settings", icon: "settings" },
]
export default function Sidebar({ activePage, setActivePage, open, onClose, calendar }) {
  const connected = calendar.connected
  return (
    <>
      <div className={`fixed inset-0 z-25 bg-[#0b122099] transition-opacity min-[761px]:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col overflow-hidden bg-gradient-to-b from-[#111c34] to-[#0d1629] px-4 pb-[18px] text-white transition-transform max-[760px]:-translate-x-full ${open ? "max-[760px]:translate-x-0" : ""}`}>
        <div className="flex h-[86px] items-center gap-3 border-b border-[#ffffff12] px-2">
          <div className="grid size-[42px] place-items-center rounded-[13px] bg-gradient-to-br from-[#4078ee] to-[#7358e8] shadow-[0_8px_22px_#315fd849]">
            <Icon name="plane" size={22} />
          </div>
          <div className="[&_strong]:block [&_strong]:font-[Manrope] [&_strong]:text-[17px] [&_span]:mt-0.5 [&_span]:block [&_span]:text-[10px] [&_span]:tracking-[.04em] [&_span]:text-[#8995ad]">
            <strong>TravelOps</strong><span>Personnel Management</span>
          </div>
          <button className={`${ui.iconButton} ml-auto hidden max-[760px]:grid`} onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <p className="mx-3 mb-2.5 mt-[25px] text-[10px] uppercase tracking-[.16em] text-[#69758c]">Workspace</p>
        <nav className="grid gap-1.5">
          {menu.map((i) => (
            <button
              key={i.name}
              onClick={() => setActivePage(i.name)}
              className={`relative flex items-center gap-[13px] rounded-[10px] border-0 bg-transparent px-[13px] py-3 text-left text-[13px] font-medium text-[#9ca8bc] hover:bg-[#ffffff0a] hover:text-white [&_svg]:shrink-0 ${activePage === i.name ? "bg-gradient-to-r from-[#3267e326] to-[#3267e309] text-white [&_svg]:text-[#79a1ff]" : ""}`}
            >
              <Icon name={i.icon} />
              <span>{i.name}</span>
              {activePage === i.name && <span className="absolute -right-4 h-6 w-[3px] rounded-l-[3px] bg-[#5e8cff]" />}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-[13px] border border-[#ffffff10] bg-[#ffffff0a] p-[15px]">
          <span className={`mb-[11px] grid size-[31px] place-items-center rounded-[9px] ${connected ? "bg-[#20a97920] text-[#56d7a7]" : "bg-[#ffffff10] text-[#8792a6]"}`}>
            <Icon name="sync" />
          </span>
          <strong className="text-xs">{connected ? "Calendar connected" : "Calendar not connected"}</strong>
          <p className="mb-2.5 mt-[5px] text-[10px] leading-normal text-[#7f8ba1]">
            {connected
              ? `${calendar.events.length} upcoming events loaded.`
              : "Connect your Google account in Settings."}
          </p>
          <span className="text-[9px] text-[#69758c]">
            <i className={`mr-[5px] inline-block size-1.5 rounded-full ${connected ? "bg-[#37c992]" : "bg-[#8792a6]"}`} />{" "}
            {calendar.loading ? "Syncing…" : connected ? "Synced this session" : "Setup required"}
          </span>
        </div>
        <div className="mt-[14px] flex items-center gap-[9px] border-t border-[#ffffff10] px-[7px] pt-[14px]">
          <div className="grid size-8 place-items-center rounded-[9px] bg-[#27344d] text-[10px]">OT</div>
          <div className="flex-1 [&_strong]:block [&_strong]:text-[10px] [&_span]:mt-[3px] [&_span]:block [&_span]:text-[9px] [&_span]:text-[#69758c]">
            <strong>Office of Commissioner Desiderio R. Apag III</strong><span>Central Office</span>
          </div>
          <Icon name="chevron" size={16} />
        </div>
      </aside>
    </>
  )
}
