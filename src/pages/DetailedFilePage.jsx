import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { DETAILED_FILE, WHATSAPP_NUMBER, WHATSAPP_URL } from '../data.js'
import { createOrder, verifyPayment } from '../lib/api.js'
import { openCheckout } from '../lib/razorpay.js'
import { handlePhoneInput, toDigits } from '../lib/phone.js'
import { BIRTH_DATE_MIN, birthDateMax } from '../lib/birthDate.js'
import { WhatsAppIcon } from '../components/Icons.jsx'
import PriceTag from '../components/PriceTag.jsx'

const GENDERS = ['Male', 'Female', 'Other']

/* Same state machine as the Book Consultation form, so the two paid flows
   behave identically — nothing renders underneath while Razorpay's own modal
   is up, and a dismissed modal is never treated as a failure. */
const IDLE = 'idle'
const CREATING = 'creating'
const CHECKOUT = 'checkout'
const VERIFYING = 'verifying'
const CONFIRMED = 'confirmed'

export default function DetailedFilePage() {
  const rootRef = useRef(null)
  const [status, setStatus] = useState(IDLE)
  const [flowError, setFlowError] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    document.title = 'Kundli Blueprint — Astrologer Supriya'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status !== IDLE) return

    const data = new FormData(e.currentTarget)
    const fullName = data.get('name')
    const email = data.get('email')
    const whatsapp = data.get('phone')

    setFlowError(null)
    setStatus(CREATING)

    // 1. Log the order server-side and open a Razorpay order. Nothing is
    //    recorded before this point — it runs only once they commit to paying.
    let order
    try {
      order = await createOrder({
        // Must match the backend's NO_SLOT_PRODUCTS key exactly.
        consultationType: DETAILED_FILE.name,
        fullName,
        whatsapp,
        email,
        gender: data.get('gender'),
        dob: data.get('birthDate'),
        tob: data.get('birthTime'),
        pob: data.get('birthPlace'),
        city: data.get('city'),
        state: data.get('state'),
        message: data.get('message'),
      })
    } catch {
      setStatus(IDLE)
      setFlowError('We could not start your order just now. Please check your connection and try again.')
      return
    }

    if (!order?.success) {
      setStatus(IDLE)
      setFlowError(order?.message ?? 'We could not start your order. Please try again.')
      return
    }

    // 2. Hand over to Razorpay's modal.
    setStatus(CHECKOUT)
    let result
    try {
      result = await openCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Supriya',
        description: `${DETAILED_FILE.name} — Written Birth Chart Report`,
        prefill: { name: fullName, contact: toDigits(whatsapp), email },
      })
    } catch {
      setStatus(IDLE)
      setFlowError('The payment window could not be opened. Please try again, or message Supriya directly.')
      return
    }

    if (!result.paid) {
      // Closing the modal is an ordinary thing to do, not an error.
      setStatus(IDLE)
      if (result.failure) setFlowError(`Payment did not go through: ${result.failure}`)
      return
    }

    // 3. Verify the signature server-side before claiming anything worked.
    setStatus(VERIFYING)
    let verified
    try {
      verified = await verifyPayment(result.response)
    } catch {
      verified = { success: false }
    }

    if (!verified?.success) {
      // Money may well have left their account, so this must never dead-end.
      setStatus(IDLE)
      setFlowError(
        verified?.message ??
          'Your payment went through, but we could not confirm it automatically. Please message Supriya on WhatsApp with your payment ID and she will sort it out right away.',
      )
      return
    }

    setConfirmation({ fullName, email })
    setStatus(CONFIRMED)
  }

  const confirmWhatsAppLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi Supriya, I just paid for my ${DETAILED_FILE.name}. My name is ${confirmation?.fullName ?? ''}.`,
  )}`

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
            Get Your <span className="text-gold-shimmer">Kundli Blueprint</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink sm:text-lg" data-reveal>
            A complete written reading of your birth chart — sent directly to you, without a live
            session.
          </p>

          <div className="mt-8 inline-flex items-baseline gap-2 rounded-full border border-accent-strong/40 bg-card px-6 py-2.5" data-reveal>
            <PriceTag
              size="hero"
              originalPrice={DETAILED_FILE.originalPrice}
              price={DETAILED_FILE.price}
            />
            <span className="text-sm text-ink-mute">/ blueprint</span>
          </div>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row" data-reveal>
            <a
              href="#detailed-file-form"
              className="w-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.3)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.5)] hover:brightness-110 sm:w-auto"
            >
              Book Your Kundli Blueprint
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
            What&rsquo;s in Your <span className="text-gold-shimmer">Kundli Blueprint</span>
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
      <section id="detailed-file-form" aria-label="Book your Kundli Blueprint" className="relative overflow-hidden py-20 sm:py-24">
        <div className="book-glow absolute inset-0" aria-hidden="true" />
        <div className="starfield absolute inset-0 opacity-60" aria-hidden="true" />

        <div className="relative mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="text-center text-3xl font-semibold text-ink-hi sm:text-4xl" data-reveal>
            Book Your <span className="text-gold-shimmer">Kundli Blueprint</span>
          </h2>
          <p className="mt-3 text-center text-sm text-ink-mute" data-reveal>
            {status === CONFIRMED
              ? 'Your order is confirmed.'
              : 'Share your birth details below, then pay securely on this page.'}
          </p>

          {status === CONFIRMED ? (
            <div className="glass-card mt-10 rounded-3xl p-8 text-center sm:p-10">
              <div className="relative mx-auto mb-6 h-16 w-16">
                <div className="absolute -inset-2 rounded-full border border-accent-strong/25" aria-hidden="true" />
                <div className="flex h-full w-full items-center justify-center rounded-full border border-accent-strong/50 bg-accent-strong/10">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-accent" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m4 12.5 5 5 11-11" />
                  </svg>
                </div>
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent">Payment Confirmed</p>
              <h3 className="mt-3 font-display text-3xl font-semibold text-ink-hi">
                Thank you, <span className="text-gold-shimmer">{confirmation.fullName.split(' ')[0]}</span>
              </h3>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink" aria-live="polite">
                Supriya will send your {DETAILED_FILE.name} to{' '}
                <span className="font-semibold text-ink-hi">{confirmation.email}</span> within{' '}
                {DETAILED_FILE.delivery}.
              </p>

              {/* Courtesy only — the order is already logged server-side, so
                  nothing depends on the customer sending this message. */}
              <a
                href={confirmWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line-strong px-8 py-3.5 text-sm font-semibold text-ink-hi transition-all duration-300 hover:border-accent-strong/70 hover:text-accent sm:w-auto"
              >
                <WhatsAppIcon className="h-4.5 w-4.5" />
                Message Supriya on WhatsApp
              </a>
            </div>
          ) : (
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
                <input id="df-phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" onInput={handlePhoneInput} placeholder="+91 98765 43210" className="field-input" />
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
                <input
                  id="df-birth-date"
                  name="birthDate"
                  type="date"
                  required
                  min={BIRTH_DATE_MIN}
                  max={birthDateMax()}
                  className="field-input"
                />
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
                  placeholder="Anything specific you'd like covered in your Kundli Blueprint"
                  className="field-input resize-none"
                />
              </div>
            </div>

            {flowError && (
              <div className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-center" role="alert">
                <p className="text-sm leading-relaxed text-red-200">{flowError}</p>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent underline underline-offset-4"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  Message Supriya directly
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={status !== IDLE}
              className="mt-8 w-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.3)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.5)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === CREATING
                ? 'Creating your order…'
                : status === CHECKOUT
                  ? 'Complete payment in the window…'
                  : status === VERIFYING
                    ? 'Confirming your payment…'
                    : (
                        <>
                          Book Your {DETAILED_FILE.name} —{' '}
                          <s className="font-medium opacity-65">{DETAILED_FILE.originalPrice}</s>{' '}
                          {DETAILED_FILE.price}
                        </>
                      )}
            </button>

            <p className="mt-4 text-center text-xs leading-relaxed text-ink-mute" aria-live="polite">
              {status === CHECKOUT
                ? 'Finish up in the payment window.'
                : 'Pay securely without leaving this page. Payments are handled by Razorpay.'}
            </p>
          </form>
          )}
        </div>
      </section>
    </div>
  )
}
