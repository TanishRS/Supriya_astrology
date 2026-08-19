import { lazy, Suspense, useEffect, useState } from 'react'
import { WHATSAPP_URL } from '../data.js'
import { scrollToSection } from '../lib/scroll.js'
import { WhatsAppIcon } from './Icons.jsx'

// Three.js scene is lazy-loaded so the initial bundle stays light
const ZodiacScene = lazy(() => import('./ZodiacScene.jsx'))

/* Skip WebGL on low-power / mobile / reduced-motion — the CSS cosmic
   gradient + starfield behind the canvas is the graceful static fallback. */
function canRun3D() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return false
  if (navigator.connection?.saveData) return false
  if (window.innerWidth < 768) return false
  return true
}

export default function Hero({ theme }) {
  const [show3D, setShow3D] = useState(false)

  useEffect(() => {
    if (!canRun3D()) return
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1200))
    const cancel = window.cancelIdleCallback ?? clearTimeout
    const handle = idle(() => setShow3D(true), { timeout: 2500 })
    return () => cancel(handle)
  }, [])

  return (
    <section id="home" aria-label="Home" className="relative flex min-h-svh items-center justify-center overflow-hidden">
      {/* Layer 1 — static cosmic gradient (always present, doubles as 3D fallback) */}
      <div className="cosmic-gradient absolute inset-0" aria-hidden="true" />

      {/* Layer 2 — dotted starfield, parallax-linked into the About section */}
      <div className="starfield starfield-parallax absolute -inset-y-[10%] inset-x-0" aria-hidden="true" />

      {/* Layer 3 — slow-rotating 3D zodiac wheel behind the headline */}
      {show3D && (
        <Suspense fallback={null}>
          <ZodiacScene theme={theme} />
        </Suspense>
      )}

      {/* Layer 4 — headline content, with a radial backing for readability */}
      <div className="relative z-10 px-6 pt-24 pb-16 text-center">
        <div className="hero-backing absolute inset-x-[-12%] inset-y-[-8%]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl" data-hero-content>
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.35em] text-accent">
            Vedic Wisdom · Modern Clarity
          </p>

          {/* [OPEN ITEM] Headline is still an EDITABLE PLACEHOLDER — not yet approved by the client.
              The tagline below it is client-approved copy. */}
          <h1 className="text-4xl font-semibold leading-[1.12] text-ink-hi sm:text-5xl md:text-6xl lg:text-7xl">
            Astrology, Tarot &amp; Energy Healing with{' '}
            <em className="text-gold-shimmer not-italic">Supriya</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-ink sm:text-lg">
            Guidance rooted in the stars, grounded in real life
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollToSection('book')}
              className="w-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.35)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.55)] hover:brightness-110 sm:w-auto"
            >
              Book Consultation
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong px-8 py-3.5 text-sm font-semibold text-ink-hi transition-all duration-300 hover:border-accent-strong/70 hover:text-accent sm:w-auto"
            >
              <WhatsAppIcon className="h-4.5 w-4.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        type="button"
        onClick={() => scrollToSection('about')}
        aria-label="Scroll to About section"
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-ink-mute transition-colors hover:text-accent"
      >
        <span className="animate-scroll-cue block text-[11px] tracking-[0.3em] uppercase">
          ▾ scroll
        </span>
      </button>
    </section>
  )
}
