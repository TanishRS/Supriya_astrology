import { useCallback, useEffect, useRef, useState } from 'react'
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '../data.js'
import { createOrder, fetchSchedule, isBackendConfigured, verifyPayment } from '../lib/api.js'
import { openCheckout } from '../lib/razorpay.js'
import { formatDateLabel, formatTimeLabel } from '../lib/scheduling.js'
import { handlePhoneInput, toDigits } from '../lib/phone.js'
import { BIRTH_DATE_MIN, birthDateMax } from '../lib/birthDate.js'
import { WhatsAppIcon } from './Icons.jsx'
import AppointmentPicker from './AppointmentPicker.jsx'

const AUTO_REDIRECT_MS = 1500

/* One state machine for the whole flow, so the form can never show two
   competing messages at once — notably nothing renders underneath while
   Razorpay's own modal is up. */
const IDLE = 'idle'
const CREATING = 'creating'
const CHECKOUT = 'checkout'
const VERIFYING = 'verifying'
const CONFIRMED = 'confirmed'

/* Module scope, deliberately. Defining this inside BookForm would give it a new
   component identity on every render, so React would unmount and remount the
   whole subtree each time — silently wiping every uncontrolled input the moment
   someone picked a date. */
function Shell({ children }) {
  return (
    <section id="book" aria-label="Book a consultation" className="relative overflow-hidden py-24 sm:py-32">
      <div className="book-glow absolute inset-0" aria-hidden="true" />
      <div className="starfield absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-xl px-5 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent" data-reveal>
            04 · Book
          </p>
          <h2 className="mt-4 text-4xl font-semibold text-ink-hi sm:text-5xl" data-reveal>
            Book a <span className="text-gold-shimmer">Consultation</span>
          </h2>
        </div>
        {children}
      </div>
    </section>
  )
}

export default function BookForm({ selectedService, onServiceChange }) {
  const [schedule, setSchedule] = useState(null)
  const [scheduleError, setScheduleError] = useState(null)

  const [appointment, setAppointment] = useState({ date: null, time: null })
  const [slotError, setSlotError] = useState(null)
  const [availabilityToken, setAvailabilityToken] = useState(0)

  const [status, setStatus] = useState(IDLE)
  const [flowError, setFlowError] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  const formRef = useRef(null)

  /* ----------------------- schedule: fetched once ----------------------- */
  useEffect(() => {
    if (!isBackendConfigured()) {
      setScheduleError('unconfigured')
      return
    }
    const controller = new AbortController()
    let active = true

    fetchSchedule({ signal: controller.signal })
      .then((data) => {
        if (!active) return
        if (!data.workingDays.length || !data.workingWindows.length) {
          setScheduleError('empty')
          return
        }
        setSchedule(data)
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return
        setScheduleError('failed')
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const handleAppointmentChange = useCallback((next) => {
    setAppointment(next)
    setSlotError(null)
  }, [])

  /* ------------------------- confirmed handoff -------------------------- */
  const whatsappLink = confirmation
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Hi Supriya, I just completed payment for ${confirmation.consultationType} on ` +
          `${confirmation.dateLabel} at ${confirmation.timeLabel}. My name is ${confirmation.fullName}. ` +
          `Looking forward to my session!`,
      )}`
    : WHATSAPP_URL

  useEffect(() => {
    if (status !== CONFIRMED) return
    const id = setTimeout(() => {
      window.location.href = whatsappLink
    }, AUTO_REDIRECT_MS)
    return () => clearTimeout(id)
  }, [status, whatsappLink])

  /* ------------------------------- submit ------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status !== IDLE) return

    const data = new FormData(e.currentTarget)
    if (!appointment.date || !appointment.time) {
      setSlotError('Please choose an appointment time first.')
      return
    }

    const fullName = data.get('name')
    const whatsapp = data.get('whatsapp')
    const consultationType = data.get('service')

    setFlowError(null)
    setSlotError(null)
    setStatus(CREATING)

    // 1. Hold the slot and open an order. This is the first moment anything
    //    is reserved — deliberately not before the customer commits.
    let order
    try {
      order = await createOrder({
        fullName,
        whatsapp,
        dob: data.get('dob'),
        tob: data.get('tob'),
        pob: data.get('pob'),
        consultationType,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
      })
    } catch {
      setStatus(IDLE)
      setFlowError('We could not start your booking just now. Please check your connection and try again.')
      return
    }

    if (!order?.success) {
      // Usually the slot went to someone else in the meantime.
      setStatus(IDLE)
      setSlotError(order?.message ?? 'That slot was just taken — please pick another.')
      setAppointment((a) => ({ date: a.date, time: null }))
      setAvailabilityToken((t) => t + 1)
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
        description: consultationType,
        prefill: { name: fullName, contact: toDigits(whatsapp) },
      })
    } catch {
      setStatus(IDLE)
      setFlowError('The payment window could not be opened. Please try again, or message Supriya directly.')
      return
    }

    if (!result.paid) {
      // Closing the modal is a normal thing to do, not a failure.
      setStatus(IDLE)
      if (result.failure) setFlowError(`Payment did not go through: ${result.failure}`)
      setAvailabilityToken((t) => t + 1)
      return
    }

    // 3. Verify the signature server-side before telling anyone it worked.
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

    setConfirmation({
      fullName,
      consultationType,
      dateLabel: formatDateLabel(appointment.date),
      timeLabel: formatTimeLabel(appointment.time),
    })
    setStatus(CONFIRMED)
  }

  // Payment confirmed — the whole form is replaced by the handoff.
  if (status === CONFIRMED) {
    return (
      <Shell>
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
          <p className="mx-auto mt-4 max-w-sm text-sm text-ink" aria-live="polite">
            Your {confirmation.consultationType} on {confirmation.dateLabel} at {confirmation.timeLabel} is
            booked — connecting you to Supriya on WhatsApp&hellip;
          </p>

          {/* Always rendered: if the browser blocks the auto-redirect, this is
              the way through. */}
          <a
            href={whatsappLink}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.35)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.55)] hover:brightness-110 sm:w-auto"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
            Tap here if you&rsquo;re not redirected
          </a>
        </div>
      </Shell>
    )
  }

  // Backend not reachable — a WhatsApp booking still beats a dead form.
  if (scheduleError) {
    return (
      <Shell>
        <div className="glass-card mt-10 rounded-3xl p-8 text-center sm:p-10">
          <p className="text-sm leading-relaxed text-ink">
            {scheduleError === 'unconfigured'
              ? 'Online booking is being set up right now.'
              : 'We can’t load the booking calendar at the moment.'}{' '}
            Message Supriya on WhatsApp and she’ll arrange your session personally.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 transition-all duration-300 hover:brightness-110 sm:w-auto"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
            Book on WhatsApp
          </a>
        </div>
      </Shell>
    )
  }

  if (!schedule) {
    return (
      <Shell>
        <div className="glass-card mt-10 rounded-3xl p-10 text-center" aria-busy="true">
          <p className="text-sm text-ink-mute" aria-live="polite">
            Loading available times&hellip;
          </p>
        </div>
      </Shell>
    )
  }

  const busy = status !== IDLE
  const buttonLabel =
    status === CREATING
      ? 'Creating your booking…'
      : status === CHECKOUT
        ? 'Complete payment in the window…'
        : status === VERIFYING
          ? 'Confirming your payment…'
          : 'Pay & Confirm Booking'

  return (
    <Shell>
      <p className="mt-4 text-center text-sm text-ink-mute" data-reveal>
        Pay securely without leaving this page — the payment window opens right here.
      </p>

      <form ref={formRef} onSubmit={handleSubmit} className="glass-card mt-10 rounded-3xl p-6 sm:p-10" data-reveal>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="bk-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
              Full Name
            </label>
            <input id="bk-name" name="name" type="text" required autoComplete="name" placeholder="Your full name" className="field-input" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="bk-whatsapp" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
              WhatsApp Number
            </label>
            <input
              id="bk-whatsapp"
              name="whatsapp"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              onInput={handlePhoneInput}
              placeholder="+91 98765 43210"
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="bk-dob" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
              Date of Birth
            </label>
            <input id="bk-dob" name="dob" type="date" required min={BIRTH_DATE_MIN} max={birthDateMax()} className="field-input" />
          </div>

          <div>
            <label htmlFor="bk-tob" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
              Time of Birth
            </label>
            <input id="bk-tob" name="tob" type="time" className="field-input" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="bk-pob" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
              Place of Birth
            </label>
            <input id="bk-pob" name="pob" type="text" placeholder="City, State, Country" className="field-input" />
          </div>

          {/* Services come from the backend, so prices can never drift out of
              step with what actually gets charged. */}
          <div className="sm:col-span-2">
            <label htmlFor="bk-service" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
              Consultation Type
            </label>
            <select
              id="bk-service"
              name="service"
              required
              value={selectedService}
              onChange={(e) => onServiceChange(e.target.value)}
              className="field-input field-select"
            >
              <option value="" disabled>
                Select a service…
              </option>
              {schedule.services.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} — Rs. {Number(s.amount).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 min-w-0 border-t border-line pt-6 sm:col-span-2">
            <AppointmentPicker
              schedule={schedule}
              value={appointment}
              onChange={handleAppointmentChange}
              errorMessage={slotError}
              refreshToken={availabilityToken}
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
          disabled={busy}
          className="mt-8 w-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.3)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.5)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buttonLabel}
        </button>

        <p className="mt-4 text-center text-xs leading-relaxed text-ink-mute" aria-live="polite">
          {status === CHECKOUT
            ? 'Finish up in the payment window.'
            : 'Your slot is held the moment you pay. Payments are handled securely by Razorpay.'}
        </p>
      </form>
    </Shell>
  )
}
