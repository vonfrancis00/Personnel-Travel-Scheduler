export const personnel = [
  "Albert Rio",
  "Clifford Jay",
  "Czharlyz Nicole",
  "Duke Vincent Paul",
  "Ian Christopher",
  "Atty.Lisha",
  "Marc Anthony",
  "Marvin Harrould",
  "Regine Mae",
  "Von Francis",
]

export function getInitials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function personnelKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
}

function personnelAliases(name) {
  const words = name.match(/[a-z0-9]+/gi) || []
  return new Set([
    personnelKey(name),
    personnelKey(getInitials(name)),
    personnelKey(words.map((word) => word[0]).join("")),
  ])
}

/** Resolve legacy Calendar labels such as "CJ" to the directory's full name. */
export function resolvePersonnelName(value) {
  const key = personnelKey(value)
  if (!key) return ""
  return personnel.find((name) => personnelAliases(name).has(key)) || String(value).trim()
}
