import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WHATSAPP_URL } from '../data.js'
import { WhatsAppIcon } from '../components/Icons.jsx'

/* Vestigial. Payment used to happen on a Razorpay-hosted page and return here;
   it now happens in a modal on the booking form itself and never leaves the
   site, so nothing links here any more. The route is kept only so that an old
   bookmarked or shared link lands somewhere sensible instead of a 404 —
   hence a plain "get in touch" page with no state to read. */
export default function BookingConfirmedPage() {
  useEffect(() => {
    document.title = 'Booking — Astrologer Supriya'
  }, [])

  return (
    <section
      aria-label="Booking"
      className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-32"
    >
      <div className="cosmic-gradient absolute inset-0" aria-hidden="true" />
      <div className="starfield absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-lg text-center">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent">Booking</p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.15] text-ink-hi sm:text-5xl">
          Let&rsquo;s get you <span className="text-gold-shimmer">connected</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-ink">
          If you&rsquo;ve just completed a payment, message Supriya on WhatsApp and she&rsquo;ll confirm
          your session personally.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.35)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.55)] hover:brightness-110 sm:w-auto"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
            Message Supriya on WhatsApp
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
