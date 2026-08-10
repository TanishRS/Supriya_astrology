/* ===========================================================================
   PAYMENT HANDOFF — Razorpay Payment Page
   ---------------------------------------------------------------------------
   All of the following was verified against the live Payment Page. Please read
   before changing anything here, because several of these are non-obvious and
   fail *silently* rather than erroring.

   1. The long-form /view URL is mandatory. The short rzp.io link strips every
      query parameter on redirect, so prefill quietly does nothing. Do not
      "tidy" this into the short link.

   2. Only these field names prefill: full_name, email, phone, time_of_birth,
      place_of_birth. They are Payment Pages custom-field names — NOT the
      `prefill[...]` / `notes[...]` convention used by Razorpay Checkout. An
      unrecognised key is dropped without warning.

   3. Date of Birth cannot be prefilled in any format. This is a limitation of
      Razorpay's date-picker widget, not a formatting bug — the client fills
      that one field by hand. Don't burn time retrying it.

   4. The service/item checkboxes have no addressable field name, so the chosen
      service can't be pre-ticked either. One unavoidable extra click.

   5. `email` IS sent. The booking form did not originally collect one, which
      left Razorpay's required Email box empty on arrival; the form now asks
      for it so it arrives prefilled.

   Appointment date/time and consultation type deliberately do NOT ride along on
   this URL — they are already recorded server-side by the Apps Script
   reservation call in lib/scheduling.js, which this flow leaves untouched.
   ========================================================================= */

export const RAZORPAY_PAYMENT_PAGE_URL = 'https://pages.razorpay.com/pl_TNXG7smMqqxEPj/view'

/** Key for the values that survive the round trip out to Razorpay and back. */
export const BOOKING_HANDOFF_KEY = 'supriyaBookingHandoff'

/**
 * Razorpay's phone field wants bare digits, but its form renders its own
 * "IN +91" country selector immediately to the left of that field. So a value
 * that still carries the country code lands as +91 91XXXXXXXXXX — a dead
 * number. Since the booking form's own placeholder is "+91 98765 43210",
 * most people will type it that way, which makes this the common case rather
 * than the edge case.
 *
 * This strips the country code (and the national trunk "0") so what reaches
 * Razorpay is the bare 10-digit subscriber number its selector expects.
 */
export function toDigits(value) {
  const digits = (value ?? '').toString().replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2) // +91 98765 43210
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1) // 0 98765 43210
  return digits
}

/**
 * Builds the Payment Page redirect.
 *
 * Encoding note: this assembles the query string with encodeURIComponent
 * rather than URLSearchParams on purpose. URLSearchParams serialises spaces as
 * "+", and the prefill behaviour above was confirmed using percent-encoding —
 * so this sticks to exactly the form that was tested.
 *
 * Empty values are omitted entirely rather than sent as blanks, since Time and
 * Place of Birth are optional on the booking form.
 */
export function buildPaymentUrl({ fullName, email, whatsapp, timeOfBirth, placeOfBirth }) {
  const params = [
    ['full_name', fullName],
    ['email', email],
    ['phone', toDigits(whatsapp)],
    ['time_of_birth', timeOfBirth],
    ['place_of_birth', placeOfBirth],
  ]
    .filter(([, value]) => value != null && value.toString().trim() !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value.toString().trim())}`)
    .join('&')

  return params ? `${RAZORPAY_PAYMENT_PAGE_URL}?${params}` : RAZORPAY_PAYMENT_PAGE_URL
}

/**
 * Razorpay's domain cannot read this site's sessionStorage, but the site can
 * read it again once the browser comes back to /booking-confirmed — which is
 * how the name and service survive the trip.
 */
export function saveBookingHandoff({ fullName, whatsapp, consultationType }) {
  try {
    sessionStorage.setItem(
      BOOKING_HANDOFF_KEY,
      JSON.stringify({ fullName, whatsapp, consultationType }),
    )
  } catch {
    /* Private mode / storage disabled — the confirmation page falls back to a
       generic message rather than breaking the payment redirect. */
  }
}

/** Reads the handoff back, then clears it so a refresh can't resend stale data. */
export function takeBookingHandoff() {
  try {
    const raw = sessionStorage.getItem(BOOKING_HANDOFF_KEY)
    if (!raw) return null
    sessionStorage.removeItem(BOOKING_HANDOFF_KEY)
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}
