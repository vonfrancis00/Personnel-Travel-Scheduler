import { useState } from "react"
import { Page } from "./TravelSchedules"
import Icon from "../components/Icon"
import { ui } from "../styles"

const tabs = [
  { id: "integrations", icon: "sync", label: "Integrations", hint: "Connected services" },
  { id: "notifications", icon: "bell", label: "Notifications", hint: "Reminders & alerts" },
  { id: "preferences", icon: "settings", label: "Preferences", hint: "Workspace behavior" },
]
const tabCopy = {
  integrations: ["Integrations", "Manage the services and data sources connected to your workspace."],
  notifications: ["Notifications", "Decide how and when the system should keep you informed."],
  preferences: ["Workspace preferences", "Personalize how the travel system looks and behaves for you."],
}

function Toggle({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full border-0 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3267e326] ${checked ? "bg-gradient-to-r from-[#3267e3] to-[#6558d7] shadow-[0_5px_12px_#3267e32d]" : "bg-[#d5dbe5]"}`}><span className={`absolute top-1 size-5 rounded-full bg-white shadow-[0_2px_5px_#17233b30] transition-[left] ${checked ? "left-6" : "left-1"}`} /></button>
}

function SettingRow({ icon, tone = "blue", title, description, children }) {
  const tones = { blue: "bg-[#edf3ff] text-[#3267e3]", violet: "bg-[#f1edff] text-[#7058d5]", green: "bg-[#e8f8f2] text-[#15996a]", amber: "bg-[#fff3e3] text-[#c87923]" }
  return <div className="group flex items-center gap-4 rounded-[15px] border border-transparent px-3 py-4 transition hover:border-[#e6ebf4] hover:bg-[#fbfcff] max-[560px]:items-start"><span className={`grid size-10 shrink-0 place-items-center rounded-[11px] ${tones[tone]}`}><Icon name={icon} size={17} /></span><div className="min-w-0 flex-1"><h3 className="m-0 font-[Manrope] text-[12px] font-extrabold text-[#273247]">{title}</h3><p className="mb-0 mt-1 max-w-[540px] text-[10px] leading-relaxed text-[#818b9c]">{description}</p></div><div className="shrink-0 max-[560px]:mt-1">{children}</div></div>
}

function SectionHeading({ eyebrow, title, description }) {
  return <div className="mb-3 px-3 pt-2"><span className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#5277ce]">{eyebrow}</span><h2 className="mb-1 mt-1 font-[Manrope] text-[17px] font-extrabold tracking-[-.02em] text-[#1e2a42]">{title}</h2><p className="m-0 text-[10px] leading-relaxed text-[#8791a2]">{description}</p></div>
}

export default function Settings({ calendar, connectCalendar, refreshCalendar, settings, updateSettings }) {
  const [activeTab, setActiveTab] = useState("integrations")
  const [message, setMessage] = useState("")
  const notificationSupport = "Notification" in window
  const permission = notificationSupport ? Notification.permission : "unsupported"
  const [tabTitle, tabDescription] = tabCopy[activeTab]
  const updateGroup = (group, key, value) => {
    updateSettings({ ...settings, [group]: { ...settings[group], [key]: value } })
    setMessage("Your preferences have been saved")
    window.setTimeout(() => setMessage(""), 1800)
  }
  const enableBrowserNotifications = async () => {
    if (!notificationSupport) return setMessage("Browser notifications are not supported here")
    const result = await Notification.requestPermission()
    setMessage(result === "granted" ? "Browser notifications enabled" : "Notification permission was not granted")
  }
  const sendTestNotification = () => {
    if (permission !== "granted") return enableBrowserNotifications()
    new Notification("Personnel Travel System", { body: "Notifications are working correctly." })
    setMessage("Test notification sent")
  }
  const enabledOptions = [settings.notifications.travelReminders, settings.notifications.syncAlerts, settings.preferences.compactMode, settings.preferences.reduceMotion].filter(Boolean).length

  return <Page title="System Settings" sub="Configure your workspace, connected services, and alerts">
    <section className="relative mb-5 overflow-hidden rounded-[22px] bg-[#122143] px-6 py-6 text-white shadow-[0_16px_42px_#172b5d20] max-[560px]:px-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,#4776dd80,transparent_31%),radial-gradient(circle_at_8%_130%,#7258d65c,transparent_33%)]" /><span className="absolute -right-10 -top-20 size-52 rounded-full border-[34px] border-white/[.04]" />
      <div className="relative flex items-center justify-between gap-6 max-[680px]:items-start max-[680px]:flex-col"><div className="flex items-center gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-[14px] border border-white/10 bg-white/10 text-[#d8e4ff] backdrop-blur-sm"><Icon name="settings" size={22} /></span><div><span className="text-[8px] font-bold uppercase tracking-[.16em] text-[#9eb9f0]">Workspace control center</span><h2 className="mb-1 mt-1 font-[Manrope] text-xl font-extrabold tracking-[-.025em]">Everything, configured your way.</h2><p className="m-0 text-[10px] text-[#afbdd9]">Changes are saved automatically on this device.</p></div></div><div className="flex gap-2.5"><MiniStat label="Calendar" value={calendar.connected ? "Live" : "Offline"} live={calendar.connected} /><MiniStat label="Active rules" value={`${enabledOptions} enabled`} /></div></div>
    </section>

    <div className="grid grid-cols-[238px_minmax(0,1fr)] gap-4 max-[820px]:grid-cols-1">
      <aside className="h-max rounded-[17px] border border-[#e3e8f1] bg-white p-2.5 shadow-[0_8px_28px_#26395c0b] max-[820px]:flex max-[820px]:overflow-x-auto"><p className="mb-2 mt-2 px-3 text-[8px] font-extrabold uppercase tracking-[.15em] text-[#9aa3b2] max-[820px]:hidden">Settings menu</p>{tabs.map((tab) => <button key={tab.id} type="button" aria-current={activeTab === tab.id ? "page" : undefined} onClick={() => { setActiveTab(tab.id); setMessage("") }} className={`group relative flex w-full items-center gap-3 rounded-[12px] border-0 px-3 py-3 text-left transition max-[820px]:w-auto max-[820px]:min-w-max ${activeTab === tab.id ? "bg-gradient-to-r from-[#edf3ff] to-[#f4f2ff] text-[#3267e3] shadow-[inset_0_0_0_1px_#dce6fb]" : "bg-transparent text-[#697487] hover:bg-[#f7f9fc]"}`}><span className={`grid size-8 place-items-center rounded-[9px] ${activeTab === tab.id ? "bg-white shadow-[0_3px_10px_#3267e315]" : "bg-[#f2f5f9]"}`}><Icon name={tab.icon} size={15} /></span><span><strong className="block font-[Manrope] text-[11px] font-bold">{tab.label}</strong><small className="mt-0.5 block text-[8px] font-medium text-[#98a1b0] max-[820px]:hidden">{tab.hint}</small></span></button>)}<div className="mx-2 mt-3 rounded-[12px] bg-[#f6f8fc] p-3 max-[820px]:hidden"><span className="grid size-7 place-items-center rounded-[8px] bg-white text-[#5f75a4] shadow-sm"><Icon name="check" size={14} /></span><strong className="mt-2 block font-[Manrope] text-[10px] text-[#46536a]">Auto-save is on</strong><p className="mb-0 mt-1 text-[8px] leading-relaxed text-[#8b95a6]">Every change is stored instantly in your browser.</p></div></aside>

      <section className="overflow-hidden rounded-[17px] border border-[#e3e8f1] bg-white shadow-[0_8px_28px_#26395c0b]">
        <header className="flex items-center justify-between gap-4 border-b border-[#e9edf4] bg-gradient-to-r from-[#fbfcff] to-[#f6f8fd] px-6 py-5 max-[560px]:px-4"><div><h1 className="m-0 font-[Manrope] text-[18px] font-extrabold tracking-[-.02em] text-[#1d2940]">{tabTitle}</h1><p className="mb-0 mt-1 text-[10px] text-[#818b9d]">{tabDescription}</p></div><span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-[#e2e8f3] bg-white text-[#5274c5] shadow-sm"><Icon name={tabs.find((tab) => tab.id === activeTab).icon} size={16} /></span></header>
        {message && <div role="status" className="mx-6 mt-4 flex items-center gap-2 rounded-[10px] border border-[#ccebdd] bg-[#effaf6] px-3 py-2.5 text-[10px] font-semibold text-[#16845f] max-[560px]:mx-4"><span className="grid size-5 place-items-center rounded-full bg-[#d9f3e9]"><Icon name="check" size={11} /></span>{message}</div>}
        <div className="p-4 max-[560px]:p-2">
          {activeTab === "integrations" && <Integration calendar={calendar} connectCalendar={connectCalendar} refreshCalendar={refreshCalendar} />}
          {activeTab === "notifications" && <><SectionHeading eyebrow="Alert controls" title="Stay ahead of every trip" description="Fine-tune reminders and system alerts so important updates never get missed." /><div className="divide-y divide-[#edf0f5]"><SettingRow icon="bell" title="Travel reminders" description="Show a browser notification before upcoming calendar travel."><Toggle label="Travel reminders" checked={settings.notifications.travelReminders} onChange={(v) => updateGroup("notifications", "travelReminders", v)} /></SettingRow><SettingRow icon="clock" tone="violet" title="Reminder time" description="Choose how early you want to be reminded."><select className={`${ui.formControl} w-[150px] max-[480px]:w-[125px]`} value={settings.notifications.reminderMinutes} onChange={(e) => updateGroup("notifications", "reminderMinutes", Number(e.target.value))}><option value={10}>10 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={1440}>1 day</option></select></SettingRow><SettingRow icon="sync" tone="green" title="Sync alerts" description="Get an alert when calendar synchronization updates are completed."><Toggle label="Sync alerts" checked={settings.notifications.syncAlerts} onChange={(v) => updateGroup("notifications", "syncAlerts", v)} /></SettingRow><SettingRow icon="check" tone="amber" title="Browser permission" description={`Current status: ${permission}. Notifications appear while this application is open.`}><button type="button" className={ui.secondaryButton} onClick={permission === "granted" ? sendTestNotification : enableBrowserNotifications}>{permission === "granted" ? "Send test" : "Enable"}</button></SettingRow></div></>}
          {activeTab === "preferences" && <><SectionHeading eyebrow="Personalization" title="Shape your workspace" description="Set the starting view, information density, and motion behavior you prefer." /><div className="divide-y divide-[#edf0f5]"><SettingRow icon="dashboard" title="Default page" description="Choose the page shown the next time the application is opened."><select className={`${ui.formControl} w-[170px] max-[480px]:w-[130px]`} value={settings.preferences.defaultPage} onChange={(e) => updateGroup("preferences", "defaultPage", e.target.value)}><option>Dashboard</option><option>Calendar</option><option>Travel Schedules</option><option>Personnel</option><option>Settings</option></select></SettingRow><SettingRow icon="filter" tone="violet" title="Compact layout" description="Reduce page spacing to fit more information on screen."><Toggle label="Compact layout" checked={settings.preferences.compactMode} onChange={(v) => updateGroup("preferences", "compactMode", v)} /></SettingRow><SettingRow icon="trend" tone="green" title="Reduce motion" description="Minimize interface transitions and animated movement for improved comfort."><Toggle label="Reduce motion" checked={settings.preferences.reduceMotion} onChange={(v) => updateGroup("preferences", "reduceMotion", v)} /></SettingRow></div></>}
        </div>
      </section>
    </div>
  </Page>
}

function MiniStat({ label, value, live }) {
  return <div className="min-w-[92px] rounded-[12px] border border-white/10 bg-white/[.07] px-3.5 py-2.5 backdrop-blur-sm"><span className="block text-[8px] uppercase tracking-[.1em] text-[#a9b9d8]">{label}</span><strong className="mt-1 flex items-center gap-1.5 text-[10px]">{live !== undefined && <i className={`size-1.5 rounded-full ${live ? "bg-[#54d9aa]" : "bg-[#9ba8bd]"}`} />}{value}</strong></div>
}

function Integration({ calendar, connectCalendar, refreshCalendar }) {
  const facts = [["Source", import.meta.env.VITE_GOOGLE_CALENDAR_ID || "Primary calendar"], ["Permission", "Read-only access"], ["Sync status", calendar.connected ? "Ready to sync" : "Connection required"]]
  return <><SectionHeading eyebrow="Connected services" title="Calendar integration" description="Keep official travel schedules synchronized with a trusted calendar source." /><article className="relative overflow-hidden rounded-[16px] border border-[#dfe6f2] bg-gradient-to-br from-white to-[#f7f9ff] p-5 max-[560px]:p-4"><span className="absolute -right-12 -top-14 size-36 rounded-full bg-[#4285f408]" /><div className="relative flex items-start gap-4 max-[560px]:flex-wrap"><span className="grid size-12 shrink-0 place-items-center rounded-[13px] border border-[#e0e6f0] bg-white font-[Manrope] text-lg font-extrabold text-[#4285f4] shadow-[0_5px_14px_#26395c0d]">G</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 font-[Manrope] text-[13px] font-extrabold text-[#253149]">Google Calendar</h3><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[8px] font-bold ${calendar.connected ? "bg-[#e6f8f1] text-[#15996a]" : "bg-[#eef1f5] text-[#727c8c]"}`}><i className={`size-1.5 rounded-full ${calendar.connected ? "bg-[#32c58d]" : "bg-[#939ba8]"}`} />{calendar.connected ? "Connected" : "Not connected"}</span></div><p className="mb-0 mt-1.5 max-w-[520px] text-[10px] leading-relaxed text-[#7f899a]">Securely read upcoming events from your primary or configured shared calendar. Access remains read-only.</p>{calendar.error && <p className="mb-0 mt-2 text-[9px] font-semibold text-[#b14b4b]">{calendar.error}</p>}</div><button className={calendar.connected ? ui.secondaryButton : ui.primaryButton} onClick={calendar.connected ? () => refreshCalendar() : connectCalendar} disabled={calendar.loading}><Icon name="sync" size={13} />{calendar.loading ? "Please wait…" : calendar.connected ? "Sync now" : "Connect"}</button></div><div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#e8edf5] pt-4 max-[560px]:grid-cols-1">{facts.map(([label, value]) => <div key={label} className="rounded-[10px] bg-white px-3 py-2.5 shadow-[inset_0_0_0_1px_#e8ecf3]"><span className="block text-[7px] font-bold uppercase tracking-[.12em] text-[#9aa3b2]">{label}</span><strong className="mt-1 block truncate text-[9px] text-[#4d596d]" title={value}>{value}</strong></div>)}</div></article><div className="mt-4 rounded-[13px] border border-[#e5eaf3] bg-[#fafbfe] px-4 py-3 text-[9px] leading-relaxed text-[#7d8798]"><strong className="text-[#4d5c73]">Privacy first.</strong> The system only requests the calendar data required to display and coordinate official travel schedules.</div></>
}
