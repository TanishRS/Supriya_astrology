const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

/* Line icons for the six services */
const SERVICE_PATHS = {
  planet: (
    <g {...strokeProps}>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M4.5 14.5c-1.8 1.5-2.7 2.9-2.2 3.7.8 1.4 5.6.3 10.7-2.6s8.6-6.3 7.8-7.7c-.5-.8-2.1-.8-4.3-.2" />
    </g>
  ),
  numbers: (
    <g {...strokeProps}>
      <path d="M9 4 7.5 20M16.5 4 15 20M4.5 9h16M3.5 15h16" />
    </g>
  ),
  cards: (
    <g {...strokeProps}>
      <rect x="7.5" y="4" width="10" height="15" rx="1.5" transform="rotate(6 12.5 11.5)" />
      <rect x="4.5" y="5" width="10" height="15" rx="1.5" transform="rotate(-8 9.5 12.5)" />
      <path d="m9 10.6.9 1.8 2-.3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2 .3z" strokeWidth="1.1" />
    </g>
  ),
  lotus: (
    <g {...strokeProps}>
      <path d="M12 5c1.6 2 2.4 4 2.4 6.2 0 2.1-.9 4-2.4 5.3-1.5-1.3-2.4-3.2-2.4-5.3C9.6 9 10.4 7 12 5Z" />
      <path d="M5 9.5c2.4.4 4.3 1.5 5.6 3.2M19 9.5c-2.4.4-4.3 1.5-5.6 3.2" />
      <path d="M3.5 14c2.3 3.2 5.2 4.8 8.5 4.8s6.2-1.6 8.5-4.8" />
    </g>
  ),
  book: (
    <g {...strokeProps}>
      <path d="M12 6.5C10.2 5 7.8 4.4 4 4.5v13c3.8-.1 6.2.5 8 2 1.8-1.5 4.2-2.1 8-2v-13c-3.8-.1-6.2.5-8 2Z" />
      <path d="M12 6.5v13M7.5 9c1.2.1 2.2.3 3 .7M16.5 9c-1.2.1-2.2.3-3 .7" />
    </g>
  ),
  home: (
    <g {...strokeProps}>
      <path d="m4 11 8-6.5L20 11v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8Z" />
      <path d="M9.5 20.5v-6h5v6" />
    </g>
  ),
}

export function ServiceIcon({ name, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {SERVICE_PATHS[name]}
    </svg>
  )
}

export function WhatsAppIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

export function InstagramIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <g {...strokeProps} strokeWidth="1.7">
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.4" fill="currentColor" stroke="none" />
      </g>
    </svg>
  )
}

export function GlobeIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <g {...strokeProps} strokeWidth="1.7">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.3 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.3-3.5-8.5s1.2-6.1 3.5-8.5Z" />
      </g>
    </svg>
  )
}

export function SunIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <g {...strokeProps} strokeWidth="1.7">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7" />
      </g>
    </svg>
  )
}

export function MoonIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        {...strokeProps}
        strokeWidth="1.7"
        d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"
      />
    </svg>
  )
}

export function StarRating({ label = '5 out of 5 stars' }) {
  return (
    <div className="flex gap-1 text-accent" role="img" aria-label={label}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9L10 14.4l-5.4 3.1 1.3-5.9-4.5-4 6-.6L10 1.5Z" />
        </svg>
      ))}
    </div>
  )
}
