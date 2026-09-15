export const ui = {
  panel: "rounded-[14px] border border-[#e5e9f1] bg-white shadow-[0_2px_8px_#26395c08]",
  iconButton: "grid place-items-center rounded-[10px] border-0 bg-transparent p-2 text-inherit",
  primaryButton: "inline-flex items-center justify-center gap-2 rounded-[9px] border-0 bg-gradient-to-br from-[#3267e3] to-[#4d70de] px-4 py-[11px] text-[11px] font-semibold text-white shadow-[0_7px_18px_#3267e32b] transition hover:-translate-y-px hover:shadow-[0_9px_22px_#3267e33b] disabled:cursor-wait disabled:opacity-65",
  secondaryButton: "inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#e5e9f1] bg-white px-[14px] py-[10px] text-[11px] font-semibold text-[#4d5667] disabled:cursor-wait disabled:opacity-65",
  textButton: "inline-flex items-center justify-center gap-2 rounded-[9px] border-0 bg-transparent text-[11px] font-semibold text-[#3267e3]",
  pageHeading: "mb-6 flex items-end justify-between max-[520px]:block",
  pill: "text-[9px] font-bold tracking-[.16em] text-[#4773dc]",
  pageTitle: "my-1.5 font-[Manrope] text-[26px] font-extrabold tracking-[-.035em] text-[#152039] max-[520px]:text-[23px]",
  pageSubtitle: "m-0 text-xs text-[#6f7889]",
  toolbar: "mb-4 flex gap-2.5 max-[760px]:flex-wrap",
  search: "flex h-[38px] min-w-[260px] items-center gap-2 rounded-[9px] border border-[#e5e9f1] bg-white px-3 text-[#8d95a4] max-[760px]:min-w-full [&_input]:w-full [&_input]:border-0 [&_input]:text-[11px] [&_input]:outline-0",
  error: "mb-[14px] flex items-center justify-between gap-3 rounded-[9px] border border-[#f1c8c8] bg-[#fff0f0] px-[14px] py-[11px] text-[11px] text-[#a74343]",
  backdrop: "fixed inset-0 z-[110] grid place-items-center bg-[#0b13256b] p-5 backdrop-blur-[2px] max-[520px]:p-2",
  status: "inline-flex items-center rounded-[10px] px-[7px] py-1 text-[8px] font-semibold",
  formControl: "w-full rounded-[9px] border border-[#dfe4ec] bg-[#fbfcfe] px-[11px] py-[10px] text-[11px] text-[#2f394a] outline-none focus:border-[#5e86e5] focus:shadow-[0_0_0_3px_#3267e314]",
}

export const statusClass = (status) => {
  const variants = {
    "happening now": "bg-[#fff0f0] text-[#c14646] [&_i]:bg-[#ef6363]",
    upcoming: "bg-[#eaf1ff] text-[#3267e3] [&_i]:bg-[#5e86e5]",
    confirmed: "bg-[#e7f8f1] text-[#15996a] [&_i]:bg-[#37c992]",
    accomplished: "bg-[#eef2f8] text-[#68758a] [&_i]:bg-[#8e96a3]",
    pending: "bg-[#fff3e2] text-[#bf7824] [&_i]:bg-[#e49a3f]",
    draft: "bg-[#eef0f3] text-[#6e7787] [&_i]:bg-[#8e96a3]",
  }
  return `${ui.status} ${variants[status] || variants.draft} [&_i]:mr-[5px] [&_i]:inline-block [&_i]:size-1.5 [&_i]:rounded-full`
}

export const colorClass = (color) => ({
  blue: "bg-[#eaf1ff] text-[#3267e3]",
  violet: "bg-[#f0ecff] text-[#7559db]",
  green: "bg-[#e7f8f1] text-[#21a875]",
  orange: "bg-[#fff2df] text-[#d88727]",
  amber: "bg-[#fff2df] text-[#d88727]",
}[color])
