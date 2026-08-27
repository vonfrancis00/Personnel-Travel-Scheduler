const paths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 15a2 2 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a2 2 0 0 0-2-.4 2 2 0 0 0-1.2 1.8V21h-4v-.2A2 2 0 0 0 8 19a2 2 0 0 0-2 .4l-.1.1-2.8-2.8.1-.1a2 2 0 0 0 .4-2A2 2 0 0 0 2 13.4H2v-4h.2A2 2 0 0 0 4 8a2 2 0 0 0-.4-2l-.1-.1 2.8-2.8.1.1a2 2 0 0 0 2 .4A2 2 0 0 0 9.6 2h4v.2A2 2 0 0 0 15 4a2 2 0 0 0 2-.4l.1-.1 2.8 2.8-.1.1a2 2 0 0 0-.4 2 2 2 0 0 0 1.8 1.2h.2v4h-.2A2 2 0 0 0 19 15Z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M14 21h-4" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m18 6-12 12M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  plane: (
    <>
      <path d="M22 2 9 15" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  trash: (
    <>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 10v7M14 10v7" />
    </>
  ),
  trend: (
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  location: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  sync: (
    <>
      <path d="M20 7h-5V2M4 17h5v5M5 9a7 7 0 0 1 12-3l3 1M4 17l3 1a7 7 0 0 0 12-3" />
    </>
  ),
}
export default function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
