import { useEffect, useState } from 'react'
import { SECTIONS } from '../data.js'
import { scrollToSection } from '../lib/scroll.js'

/* Desktop-only scroll progress dots (kept from wireframe 1c) — hidden on mobile */
export default function ScrollDots() {
  const [active, setActive] = useState('home')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <nav
      aria-label="Section progress"
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex"
    >
      {SECTIONS.map(({ id, label }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => scrollToSection(id)}
            aria-label={`Go to ${label}`}
            aria-current={isActive ? 'true' : undefined}
            className="group relative flex h-4 w-4 items-center justify-center"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? 'h-2.5 w-2.5 bg-accent shadow-[0_0_12px_rgba(232,196,118,0.8)]'
                  : 'h-1.5 w-1.5 bg-ink-faint group-hover:bg-ink'
              }`}
            />
            <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded border border-line bg-canvas/95 px-2 py-1 text-[11px] text-ink opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
