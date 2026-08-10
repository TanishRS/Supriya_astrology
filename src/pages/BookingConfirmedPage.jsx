import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '../data.js'
import { takeBookingHandoff } from '../lib/payment.js'
import { WhatsAppIcon } from '../components/Icons.jsx'

const AUTO_REDIRECT_MS = 1500

function buildWhatsAppLink(handoff) {
  if (!handoff?.fullName || !handoff?.consultationType) return WHATSAPP_URL
  const message =
    `Hi Supriya, I just completed payment for ${handoff.consultationType}. ` +
    `My name is ${handoff.fullName}. Looking forward to my session!`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export default function BookingConfirmedPage() {
  /* Read (and clear) the handoff exactly once, during the first render, via a
     lazy initialiser. Doing this in an effect would run twice under
     StrictMode — the second pass would find the entry already cleared and fall
     back to the generic message, losing the personalisation. */
  const [handoff] = useState(() => takeBookingHandoff())
  const hasDetails = Boolean(handoff?.fullName && handoff?.consultationType)
  const whatsappLink = useMemo(() => buildWhatsAppLink(handoff), [handoff])

  useEffect(() => {
    document.title = 'Payment Received — Astrologer Supriya'
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      window.location.href = whatsappLink
    }, AUTO_REDIRECT_MS)
    return () => clearTimeout(id)
  }, [whatsappLink])

  return (
    <section
      aria-label="Payment received"
      className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-32"
    >
      <div className="cosmic-gradient absolute inset-0" aria-hidden="true" />
      <div className="starfield absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-lg text-center">
        {/* Gold tick inside the same ringed-circle motif used elsewhere */}
        <div className="relative mx-auto mb-8 h-20 w-20">
          <div className="absolute -inset-2 rounded-full border border-accent-strong/25" aria-hidden="true" />
          <div className="absolute -inset-5 rounded-full border border-accent-strong/10" aria-hidden="true" />
          <div className="flex h-full w-full items-center justify-center rounded-full border border-accent-strong/50 bg-accent-strong/10">
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9 text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m4 12.5 5 5 11-11" />
            </svg>
          </div>
        </div>

        <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent">
          {hasDetails ? 'Payment Received' : 'Booking'}
        </p>

        <h1 className="mt-4 text-4xl font-semibold leading-[1.15] text-ink-hi sm:text-5xl">
          {hasDetails ? (
            <>
              Thank you, <span className="text-gold-shimmer">{handoff.fullName.split(' ')[0]}</span>
            </>
          ) : (
            <>
              Let&rsquo;s get you <span className="text-gold-shimmer">connected</span>
            </>
          )}
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base text-ink" aria-live="polite">
          {hasDetails ? (
            <>
              Your {handoff.consultationType} is confirmed — connecting you to Supriya on
              WhatsApp&hellip;
            </>
          ) : (
            <>
              If you&rsquo;ve just completed a payment, message Supriya on WhatsApp and she&rsquo;ll
              confirm your session personally.
            </>
          )}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {/* Always rendered, never conditional on the timer: if the browser
              blocks the automatic redirect, this is the way through. */}
          <a
            href={whatsappLink}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.35)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.55)] hover:brightness-110 sm:w-auto"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
            {hasDetails ? 'Tap here if you’re not redirected' : 'Message Supriya on WhatsApp'}
          </a>

          <Link
            to="/"
            className="w-full rounded-full border border-line-strong px-8 py-3.5 text-sm font-semibold text-ink-hi transition-all duration-300 hover:border-accent-strong/70 hover:text-accent sm:w-auto"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  )
}
