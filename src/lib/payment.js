/* ===========================================================================
   PAYMENT HANDOFF
   ---------------------------------------------------------------------------
   [MISMATCH WITH BRIEF — READ THIS]
   The appointment-step brief referred to "the existing Razorpay redirect flow"
   and "the final payment button". Neither exists in this codebase: the Book
   Consultation form has always ended in a "Continue on WhatsApp" button, and
   there is no Razorpay integration anywhere in the project.

   Rather than invent a Payment Page URL (which would send real visitors on the
   live site to a broken link), this module is built as a ready-to-wire seam:

     • Drop the real Payment Page URL into RAZORPAY_PAYMENT_PAGE_URL below and
       the form automatically switches to the paid redirect, carrying every
       prefill param — including the new appointment date and time — through to
       the payment webhook exactly as the brief specifies.
     • Until then, the form keeps its current WhatsApp behaviour, now with the
       chosen appointment included in the message.

   Razorpay Payment Page prefill fields use the `prefill[...]` convention, and
   arbitrary extra data is passed as `notes[...]`, which is what surfaces on the
   webhook payload. CONFIRM the exact field names against the actual Payment
   Page configuration before going live — a mismatched key silently drops the
   value rather than erroring.
   ========================================================================= */

// CONFIRM WITH CLIENT BEFORE LAUNCH — paste the live Razorpay Payment Page URL
export const RAZORPAY_PAYMENT_PAGE_URL = 'REPLACE_WITH_RAZORPAY_PAYMENT_PAGE_URL'

export function isPaymentConfigured() {
  return /^https?:\/\//i.test(RAZORPAY_PAYMENT_PAGE_URL)
}

/**
 * Builds the Payment Page URL with the client's details prefilled and the
 * appointment attached as notes, so date/time travel through to the webhook
 * alongside everything else.
 */
export function buildPaymentUrl({
  name,
  whatsapp,
  consultationType,
  amount,
  appointmentDate,
  appointmentTime,
  holdId,
}) {
  const url = new URL(RAZORPAY_PAYMENT_PAGE_URL)
  const params = url.searchParams

  params.set('prefill[name]', name ?? '')
  params.set('prefill[contact]', whatsapp ?? '')

  params.set('notes[consultation_type]', consultationType ?? '')
  params.set('notes[appointment_date]', appointmentDate ?? '')
  params.set('notes[appointment_time]', appointmentTime ?? '')
  if (holdId) params.set('notes[hold_id]', holdId)
  if (amount) params.set('notes[amount_label]', amount)

  return url.toString()
}
