import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { DETAILED_FILE, WHATSAPP_URL } from '../data.js'
import { openWhatsApp } from '../lib/whatsapp.js'
import { WhatsAppIcon } from '../components/Icons.jsx'

const GENDERS = ['Male', 'Female', 'Other']

export default function DetailedFilePage() {
  const rootRef = useRef(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    document.title = 'Detailed Birth Chart File — Astrologer Supriya'
  }, [])

  // Scoped to this page's own elements so it never re-touches the shared
  // Nav/Footer reveal setup that HomePage already owns.
  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray(rootRef.current.querySelectorAll('[data-reveal]')).forEach((el) => {
        gsap.from(el, {
          y: 32,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })
    })
    return () => mm.revert()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    openWhatsApp('Hello Supriya! I would like to order my Detailed File.', [
      ['Full Name', data.get('name')],
      ['Gender', data.get('gender')],
      ['Email', data.get('email')],
      ['Phone Number', data.get('phone')],
      ['Birth Place', data.get('birthPlace')],
      ['Birth Date', data.get('birthDate')],
      ['Birth Time', data.get('birthTime')],
      ['City', data.get('city')],
      ['State', data.get('state')],
      ['Message', data.get('message')],
    ])
    setSent(true)
  }

  return (
    <div ref={rootRef}>
      {/* Page header */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24">
        <div className="cosmic-gradient absolute inset-0" aria-hidden="true" />
        <div className="starfield absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Link
            to="/"
            className="mb-6 inline-block text-xs font-medium uppercase tracking-[0.3em] text-ink-mute transition-colors hover:text-accent"
          >
            ← Back to Home
          </Link>

          <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent" data-reveal>
            Written Birth Chart Report
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.15] text-ink-hi sm:text-5xl" data-reveal>
            Get Your <span className="text-gold-shimmer">Detailed File</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink sm:text-lg" data-reveal>
            A complete written reading of your birth chart — sent directly to you, without a live
            session.
          </p>

          <div className="mt-8 inline-flex items-baseline gap-2 rounded-full border border-accent-strong/40 bg-card px-6 py-2.5" data-reveal>
            <span className="text-2xl font-semibold text-accent sm:text-3xl">{DETAILED_FILE.price}</span>
            <span className="text-sm text-ink-mute">/ file</span>
          </div>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row" data-reveal>
            <a
              href="#detailed-file-form"
              className="w-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.3)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.5)] hover:brightness-110 sm:w-auto"
            >
              Book Your File
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong px-8 py-3.5 text-sm font-semibold text-ink-hi transition-all duration-300 hover:border-accent-strong/70 hover:text-accent sm:w-auto"
            >
              <WhatsAppIcon className="h-4.5 w-4.5" />
              Ask a Question First
            </a>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section aria-label="What's included" className="relative py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-semibold text-ink-hi sm:text-4xl" data-reveal>
            What&rsquo;s in Your <span className="text-gold-shimmer">File</span>
          </h2>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2" data-reveal>
            {DETAILED_FILE.inclusions.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4 text-sm leading-relaxed text-ink"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m2.5 8.5 3.5 3.5 7.5-8" />
                </svg>
                {item}
              </li>
            ))}
          </ul>

          {/* [OPEN ITEM] Delivery window carried over from the client's reference
              page — confirm this is still accurate before launch. */}
          <p className="mt-8 text-center text-sm text-ink-mute" data-reveal>
            Delivered within <span className="font-semibold text-ink">{DETAILED_FILE.delivery}</span> of
            booking, along with a direct number for any follow-up questions.
          </p>
        </div>
      </section>

      {/* Order form */}
      <section id="detailed-file-form" aria-label="Book your detailed file" className="relative overflow-hidden py-20 sm:py-24">
        <div className="book-glow absolute inset-0" aria-hidden="true" />
        <div className="starfield absolute inset-0 opacity-60" aria-hidden="true" />

        <div className="relative mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="text-center text-3xl font-semibold text-ink-hi sm:text-4xl" data-reveal>
            Book Your <span className="text-gold-shimmer">File</span>
          </h2>
          <p className="mt-3 text-center text-sm text-ink-mute" data-reveal>
            Share your birth details below — we&rsquo;ll confirm your order on WhatsApp.
          </p>

          <form onSubmit={handleSubmit} className="glass-card mt-10 rounded-3xl p-6 sm:p-10" data-reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="df-gender" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                  Gender
                </label>
                <select id="df-gender" name="gender" required defaultValue="" className="field-input field-select">
                  <option value="" disabled>
                    Select…
                  </option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="df-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                  Email
                </label>
                <input id="df-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field-input" />
              </div>

              <div>
                <label htmlFor="df-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                  Name
                </label>
                <input id="df-name" name="name" type="text" required autoComplete="name" placeholder="Your full name" className="field-input" />
              </div>

              <div>
                <label htmlFor="df-phone" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                  Phone Number
                </label>
                <input id="df-phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" className="field-input" />
              </div>

              <div>
                <label htmlFor="df-birth-place" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                  Birth Place
                </label>
                <input id="df-birth-place" name="birthPlace" type="text" required placeholder="City you were born in" className="field-input" />
              </div>

              <div>
                <label htmlFor="df-city" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                  Your City
                </label>
                <input id="df-city" name="city" type="text" placeholder="Where you live now" className="field-input" />
              </div>

              <div>
                <label htmlFor="df-birth-date" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                  Birth Date
                </label>
                <input id="df-birth-date" name="birthDate" type="date" required className="field-input" />
              </div>

              <div>
                <label htmlFor="df-state" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                  State
                </label>
                <input id="df-state" name="state" type="text" placeholder="Your state" className="field-input" />
              </div>

              <div>
                <label htmlFor="df-birth-time" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                  Birth Time
                </label>
                <input id="df-birth-time" name="birthTime" type="time" className="field-input" />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="df-message" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                  Your Message <span className="normal-case text-ink-faint">(optional)</span>
                </label>
                <textarea
                  id="df-message"
                  name="message"
                  rows="3"
                  placeholder="Anything specific you'd like covered in your file"
                  className="field-input resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.3)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.5)] hover:brightness-110"
            >
              Book Your File — {DETAILED_FILE.price}
            </button>

            <p className="mt-4 text-center text-xs leading-relaxed text-ink-mute" aria-live="polite">
              {sent
                ? 'WhatsApp should have opened with your details — just press send to confirm your order.'
                : 'Submitting opens WhatsApp with your details pre-filled. No payment is taken on this page.'}
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}
