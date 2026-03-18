import { EVENT_ICON_OPTIONS } from '../lib/budget.js'

const iconByValue = new Map(EVENT_ICON_OPTIONS.map((option) => [option.value, option]))

function getEventIconOption(value) {
  return iconByValue.get(value) ?? EVENT_ICON_OPTIONS[0]
}

function Glyph({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const iconComponents = {
  calendar: () => (
    <Glyph>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M7.5 3.5v4" />
      <path d="M16.5 3.5v4" />
      <path d="M3.5 10.5h17" />
    </Glyph>
  ),
  work: () => (
    <Glyph>
      <rect x="3.5" y="7.5" width="17" height="11" rx="2.5" />
      <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
      <path d="M3.5 12h17" />
    </Glyph>
  ),
  home: () => (
    <Glyph>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5v10h11v-10" />
      <path d="M10 19.5v-5h4v5" />
    </Glyph>
  ),
  shopping: () => (
    <Glyph>
      <path d="M4 6.5h2l1.3 8.2a1 1 0 0 0 1 .8h8.5a1 1 0 0 0 1-.7l1.6-5.8H7.1" />
      <circle cx="9.5" cy="18.5" r="1" />
      <circle cx="17" cy="18.5" r="1" />
    </Glyph>
  ),
  utilities: () => (
    <Glyph>
      <path d="M13.5 2.5 6.5 13h5L10.5 21.5 17.5 11h-5z" />
    </Glyph>
  ),
  travel: () => (
    <Glyph>
      <path d="M6 14.5h12l1-3.5-2.5-4H7.5L5 11z" />
      <path d="M7.5 7v-1a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 16.5 6v1" />
      <circle cx="8.5" cy="17.5" r="1.5" />
      <circle cx="15.5" cy="17.5" r="1.5" />
    </Glyph>
  ),
  health: () => (
    <Glyph>
      <path d="M12 20s-6.5-4.1-8.1-8.2A4.7 4.7 0 0 1 8.4 5a5 5 0 0 1 3.6 1.9A5 5 0 0 1 15.6 5a4.7 4.7 0 0 1 4.5 6.8C18.5 15.9 12 20 12 20Z" />
    </Glyph>
  ),
  gift: () => (
    <Glyph>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M12 10v10" />
      <path d="M4 13.5h16" />
      <path d="M12 10H8.5A2.5 2.5 0 1 1 11 6.5L12 10Z" />
      <path d="M12 10h3.5A2.5 2.5 0 1 0 13 6.5L12 10Z" />
    </Glyph>
  ),
  savings: () => (
    <Glyph>
      <path d="M6 8.5C6 6 8.7 4 12 4s6 2 6 4.5S15.3 13 12 13s-6-2-6-4.5Z" />
      <path d="M6 8.5v3.5C6 14.5 8.7 16.5 12 16.5s6-2 6-4.5V8.5" />
      <path d="M6 12v3.5C6 18 8.7 20 12 20s6-2 6-4.5V12" />
    </Glyph>
  ),
}

export default function EventIcon({ icon, className = '' }) {
  const option = getEventIconOption(icon)
  const IconComponent = iconComponents[option.value] ?? iconComponents.calendar

  return (
    <span className={`event-icon-badge event-icon-${option.value} ${className}`.trim()} aria-hidden="true">
      <IconComponent />
    </span>
  )
}
