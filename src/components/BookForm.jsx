import { useCallback, useState } from 'react'
import { SERVICES } from '../data.js'
import { reserveSlot } from '../lib/scheduling.js'
import { buildPaymentUrl, saveBookingHandoff } from '../lib/payment.js'
import { handlePhoneInput } from '../lib/phone.js'
import { BIRTH_DATE_MIN, birthDateMax } from '../lib/birthDate.js'
import AppointmentPicker from './AppointmentPicker.jsx'

export default function BookForm({ selectedService, onServiceChange }) {
  const [submitting, setSubmitting] = useState(false)
  // { date: 'YYYY-MM-DD', time: 'HH:MM' } — the *appointment*, not birth data.
  const [appointment, setAppointment] = useState({ date: null, time: null })
  const [reservationError, setReservationError] = useState(null)
  // Bumping this makes the picker re-fetch availability (used after a lost race).
  const [availabilityToken, setAvailabilityToken] = useState(0)

  const handleAppointmentChange = useCallback((next) => {
    setAppointment(next)
    setReservationError(null)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    const data = new FormData(e.currentTarget)
    const service = SERVICES.find((s) => s.id === data.get('service'))

    if (!appointment.date || !appointment.time) {
      setReservationError('Please choose an appointment time first.')
      return
    }

    setSubmitting(true)
    setReservationError(null)

    // Apps Script reservation — unchanged. This is what records the booking
    // server-side (name, whatsapp, service, appointment date/time), which is why
    // none of that needs to ride along on the Razorpay URL.
    try {
      const result = await reserveSlot({
        date: appointment.date,
        time: appointment.time,
        name: data.get('name'),
        whatsapp: data.get('whatsapp'),
        consultationType: service?.name ?? '',
      })

      if (!result?.success) {
        // Someone else took the slot between loading and submitting: surface the
        // message by the dial, refresh what's free, and stop short of payment.
        setReservationError(result?.message ?? 'That slot was just taken, please pick another')
        setAppointment((a) => ({ date: a.date, time: null }))
        setAvailabilityToken((t) => t + 1)
        return
      }
    } catch {
      setReservationError('We could not hold that slot just now. Please try again.')
      setAvailabilityToken((t) => t + 1)
      return
    } finally {
      setSubmitting(false)
    }

    // Stash what has to survive the trip to Razorpay and back. Their domain
    // can't see this site's sessionStorage, but /booking-confirmed can.
    saveBookingHandoff({
      fullName: data.get('name'),
      whatsapp: data.get('whatsapp'),
      consultationType: service?.name ?? '',
    })

    window.location.href = buildPaymentUrl({
      fullName: data.get('name'),
      email: data.get('email'),
      whatsapp: data.get('whatsapp'),
      timeOfBirth: data.get('tob'),
      placeOfBirth: data.get('pob'),
    })
  }

  return (
    <section id="book" aria-label="Book a consultation" className="relative overflow-hidden py-24 sm:py-32">
      {/* Cosmic backdrop behind the glass card */}
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
          <p className="mt-4 text-sm text-ink-mute" data-reveal>
            Share your birth details — your session is confirmed personally on WhatsApp.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card mt-12 rounded-3xl p-6 sm:p-10" data-reveal>
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

            {/* Razorpay marks Email as required on its own page, so collecting
                it here means one less field to fill after the redirect. */}
            <div className="sm:col-span-2">
              <label htmlFor="bk-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                Email
              </label>
              <input
                id="bk-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="bk-dob" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-mute">
                Date of Birth
              </label>
              <input
                id="bk-dob"
                name="dob"
                type="date"
                required
                min={BIRTH_DATE_MIN}
                max={birthDateMax()}
                className="field-input"
              />
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
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Divider into the scheduling step, so it reads as a distinct stage
                rather than yet another birth-detail field. */}
            {/* min-w-0 is load-bearing: a grid item defaults to min-width:auto,
                which stops the date strip's overflow container from shrinking —
                it grows to fit all 14 cards and gets clipped by the section's
                overflow-hidden instead of scrolling. */}
            <div className="mt-2 min-w-0 border-t border-line pt-6 sm:col-span-2">
              <AppointmentPicker
                value={appointment}
                onChange={handleAppointmentChange}
                errorMessage={reservationError}
                refreshToken={availabilityToken}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 py-3.5 text-sm font-semibold tracking-wide text-midnight-950 shadow-[0_0_28px_rgba(212,169,78,0.3)] transition-all duration-300 hover:shadow-[0_0_44px_rgba(212,169,78,0.5)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Holding your slot…' : 'Continue to Payment'}
          </button>

          <p className="mt-4 text-center text-xs leading-relaxed text-ink-mute" aria-live="polite">
            {submitting
              ? 'Holding your slot, one moment…'
              : 'You’ll be taken to Razorpay to pay securely. A couple of fields need filling in there — including your date of birth and your chosen service.'}
          </p>
        </form>
      </div>
    </section>
  )
}
