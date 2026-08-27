import { useEffect } from "react"
import Icon from "./Icon"
import { ui } from "../styles"

export default function SuccessPopup({ open, message, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const timer = window.setTimeout(onClose, 3500)
    return () => window.clearTimeout(timer)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[130] grid place-items-center bg-[#0b13256b] p-5 backdrop-blur-[3px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="w-[min(410px,100%)] rounded-[18px] bg-white p-8 text-center shadow-[0_24px_70px_#0711274f]" role="status" aria-live="polite">
        <div className="mx-auto mb-[17px] grid size-16 place-items-center rounded-full bg-[#e1f7ed] text-[#1ba873]">
          <Icon name="check" size={30} />
        </div>
        <h2 className="m-0 font-[Manrope] text-[21px] font-extrabold text-[#172033]">Assignment saved</h2>
        <p className="mb-[22px] mt-[9px] text-[13px] leading-[1.6] text-[#6f798a]">{message}</p>
        <button className={`${ui.primaryButton} min-w-[110px] px-5 text-xs`} onClick={onClose}>
          Done
        </button>
      </section>
    </div>
  )
}
