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

   5. `email` is intentionally absent from the redirect: the booking form does
      not collect one. If an email field is ever added to the form, pass it
      through here and it will prefill.

   Appointment date/time and consultation type deliberately do NOT ride along on
   this URL — they are already recorded server-side by the Apps Script
   reservation call in lib/scheduling.js, which this flow leaves untouched.
   ========================================================================= */

export const RAZORPAY_PAYMENT_PAGE_URL = 'https://pages.razorpay.com/pl_TNXG7smMqqxEPj/view'

/** Key for the values that survive the round trip out to Razorpay and back. */
export const BOOKING_HANDOFF_KEY = 'supriyaBookingHandoff'

/**
 * Razorpay's phone field wants bare digits — "+91 98765 43210" becomes
 * "919876543210". Anything else (spaces, +, dashes) can break the prefill.
 */
export function toDigits(value) {
  return (value ?? '').toString().replace(/\D/g, '')
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
export function buildPaymentUrl({ fullName, whatsapp, timeOfBirth, placeOfBirth }) {
  const params = [
    ['full_name', fullName],
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
